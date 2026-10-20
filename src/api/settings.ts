/**
 * Copyright (c) 2025 OpenShort.link Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

// Settings API endpoints

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Env, User, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { validateJson } from '../middleware/validate';
import {
  getStatusCheckFrequency,
  setStatusCheckFrequency,
  getStatusCheckFrequencyOrDefault,
  getAnalyticsAggregationEnabled,
  getAnalyticsAggregationEnabledOrDefault,
  setAnalyticsAggregationEnabled,
  getAnalyticsThresholds,
  getAnalyticsThresholdsOrDefault,
  setAnalyticsThresholds,
  getRootPageSettingsOrDefault,
  setRootPageSettings,
  getPrivacySettingsOrDefault,
  setPrivacySettings,
  getBotProtectionSettingsOrDefault,
  setBotProtectionSettings,
  getAdNetworkSettingsOrDefault,
} from '../db/settings';
import { getFrequencyLabel } from '../types';
import {
  statusCheckFrequencySchema,
  analyticsAggregationSchema,
  analyticsThresholdsSchema,
  rootPageSchema,
} from '../schemas';

const settingsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Schemas imported from ../schemas

// Get status check frequency setting
settingsRouter.get('/status-check-frequency', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Only admin/owner can view settings
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const setting = await getStatusCheckFrequencyOrDefault(c.env);

  return c.json({
    success: true,
    data: {
      ...setting,
      frequency_label: getFrequencyLabel(setting.frequency),
    },
  });
});

// Update status check frequency setting
settingsRouter.put('/status-check-frequency', authMiddleware, validateJson(statusCheckFrequencySchema), async (c) => {
  const user = c.get('user') as User;
  
  // Only admin/owner can update settings
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const validated = c.req.valid('json');

  await setStatusCheckFrequency(
    c.env,
    validated.frequency,
    validated.enabled,
    validated.check_top_100_daily,
    validated.batch_size,
    user.id
  );

  const updated = await getStatusCheckFrequency(c.env);

  return c.json({
    success: true,
    data: {
      ...updated!,
      frequency_label: getFrequencyLabel(validated.frequency),
    },
    message: 'Status check frequency updated successfully',
  });
});

// Analytics Aggregation Settings

// Get analytics aggregation enabled setting
settingsRouter.get('/analytics-aggregation', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Only admin/owner can view settings
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const setting = await getAnalyticsAggregationEnabledOrDefault(c.env);

  return c.json({
    success: true,
    data: setting,
  });
});

// Update analytics aggregation enabled setting
settingsRouter.put('/analytics-aggregation', authMiddleware, validateJson(analyticsAggregationSchema), async (c) => {
  const user = c.get('user') as User;
  
  // Only admin/owner can update settings
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const validated = c.req.valid('json');

  await setAnalyticsAggregationEnabled(
    c.env,
    validated.enabled,
    user.id
  );

  const updated = await getAnalyticsAggregationEnabled(c.env);

  return c.json({
    success: true,
    data: updated || await getAnalyticsAggregationEnabledOrDefault(c.env),
    message: `Analytics aggregation ${validated.enabled ? 'enabled' : 'disabled'} successfully`,
  });
});

// Get analytics thresholds
settingsRouter.get('/analytics-thresholds', authMiddleware, async (c) => {
  const user = c.get('user');
  
  // Only admin/owner can view settings
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const thresholds = await getAnalyticsThresholdsOrDefault(c.env);

  return c.json({
    success: true,
    data: thresholds,
  });
});

// Update analytics thresholds
settingsRouter.put('/analytics-thresholds', authMiddleware, validateJson(analyticsThresholdsSchema), async (c) => {
  try {
    const user = c.get('user') as User;
    
    // Only admin/owner can update settings
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      throw new HTTPException(403, { message: 'Insufficient permissions' });
    }

    const validated = c.req.valid('json');

    await setAnalyticsThresholds(
      c.env,
      validated.threshold_days,
      user.id
    );

    const updated = await getAnalyticsThresholds(c.env);

    return c.json({
      success: true,
      data: updated || await getAnalyticsThresholdsOrDefault(c.env),
      message: 'Analytics thresholds updated successfully',
    });
  } catch (error) {
    console.error('[SETTINGS] Update analytics thresholds error:', error);
    // Re-throw HTTPException and ZodError for error handler
    if (error instanceof HTTPException) {
      throw error;
    }
    // Handle database errors
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      throw new HTTPException(409, { message: 'Duplicate settings entry' });
    }
    // Keep internal error details in logs only; return a generic message to clients
    // (HTTPException messages are passed verbatim to the client by errorHandler).
    throw new HTTPException(500, {
      message: 'Failed to update analytics thresholds'
    });
  }
});

// Public endpoint for visitors to load custom page HTML & site-wide Ad settings
settingsRouter.get('/public-pages', async (c) => {
  const setting = await getRootPageSettingsOrDefault(c.env);
  const adSetting = await getAdNetworkSettingsOrDefault(c.env);
  return c.json({
    success: true,
    data: {
      mode: setting.mode,
      html: setting.html,
      redirect_url: setting.redirect_url,
      pages: setting.pages || {},
      ad_settings: {
        enabled: adSetting.enabled,
        provider: adSetting.provider,
        adsense_client_id: adSetting.adsense_client_id,
        adsense_slot_id: adSetting.adsense_slot_id,
        custom_ad_code: adSetting.custom_ad_code,
      },
    },
  });
});

// Root page settings (#12) — what the domain root serves when no slug is given.
settingsRouter.get('/root-page', authMiddleware, async (c) => {
  const user = c.get('user') as User;

  // Only admin/owner can view settings
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const setting = await getRootPageSettingsOrDefault(c.env);
  return c.json({ success: true, data: setting });
});

settingsRouter.put('/root-page', authMiddleware, validateJson(rootPageSchema), async (c) => {
  try {
    const user = c.get('user') as User;

    // Only admin/owner can update settings
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      throw new HTTPException(403, { message: 'Insufficient permissions' });
    }

    const validated = c.req.valid('json');

    await setRootPageSettings(
      c.env,
      {
        mode: validated.mode,
        html: validated.html || '',
        redirect_url: validated.redirect_url || '',
        pages: validated.pages || {},
      },
      user.id
    );

    const updated = await getRootPageSettingsOrDefault(c.env);

    return c.json({
      success: true,
      data: updated,
      message: 'Root page settings updated successfully',
    });
  } catch (error) {
    console.error('[SETTINGS] Update root page error:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    // Keep internal error details in logs only; return a generic message to clients.
    throw new HTTPException(500, { message: 'Failed to update root page settings' });
  }
});

// Privacy & GDPR Settings
settingsRouter.get('/privacy', authMiddleware, async (c) => {
  const setting = await getPrivacySettingsOrDefault(c.env);
  return c.json({ success: true, data: setting });
});

settingsRouter.put('/privacy', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const body = await c.req.json().catch(() => ({}));
  await setPrivacySettings(c.env, body, user.id);
  const updated = await getPrivacySettingsOrDefault(c.env);
  return c.json({ success: true, data: updated, message: 'Privacy & GDPR settings updated successfully' });
});

// Bot Protection & Safety Settings
settingsRouter.get('/bot-protection', authMiddleware, async (c) => {
  const setting = await getBotProtectionSettingsOrDefault(c.env);
  return c.json({ success: true, data: setting });
});

settingsRouter.put('/bot-protection', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const body = await c.req.json().catch(() => ({}));
  await setBotProtectionSettings(c.env, body, user.id);
  const updated = await getBotProtectionSettingsOrDefault(c.env);
  return c.json({ success: true, data: updated, message: 'Bot protection settings updated successfully' });
});

// Captcha & Safety Filters Settings
settingsRouter.get('/captcha', authMiddleware, async (c) => {
  const row = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'captcha_settings'").first<any>();
  let data = { enabled: true, provider: 'built_in', site_key: '', secret_key: '', blocked_domains: [] };
  if (row && row.value) {
    try {
      data = JSON.parse(row.value);
    } catch {}
  }
  return c.json({ success: true, data });
});

settingsRouter.post('/captcha', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    throw new HTTPException(403, { message: 'Insufficient permissions' });
  }

  const body = await c.req.json().catch(() => ({}));
  const valueStr = JSON.stringify({
    enabled: Boolean(body.enabled),
    provider: body.provider || 'built_in',
    site_key: body.site_key || '',
    secret_key: body.secret_key || '',
    blocked_domains: Array.isArray(body.blocked_domains) ? body.blocked_domains : [],
    updated_at: Date.now(),
    updated_by: user.id,
  });

  await c.env.DB.prepare(
    "INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('captcha_settings', ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by"
  )
    .bind(valueStr, Date.now(), user.id)
    .run();

  return c.json({ success: true, message: 'Captcha & security filter settings saved successfully' });
});

export { settingsRouter };

