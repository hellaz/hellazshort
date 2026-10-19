/**
 * Copyright (c) 2025 URLZ Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Env, User, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils/id';

const monetizationRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// 1. Overview & Geo CPM Ad Revenue
monetizationRouter.get('/overview', authMiddleware, async (c) => {
  const user = c.get('user') as User;

  // Calculate CPM revenue based on click geolocation breakdown
  let totalClicks = 0;
  let estimatedEarnings = 0.0;

  try {
    const clicksRow = await c.env.DB.prepare(
      `SELECT SUM(click_count) as total FROM links WHERE created_by = ? OR ? = 'owner' OR ? = 'admin'`
    )
      .bind(user.id, user.role, user.role)
      .first<{ total: number }>();

    totalClicks = clicksRow?.total || 0;

    // Fetch click geo breakdown for CPM calculation
    const geoRows = await c.env.DB.prepare(
      `SELECT country, SUM(clicks) as clicks FROM analytics_geo WHERE link_id IN (SELECT id FROM links WHERE created_by = ?) GROUP BY country`
    )
      .bind(user.id)
      .all<{ country: string; clicks: number }>();

    if (geoRows.results && geoRows.results.length > 0) {
      for (const row of geoRows.results) {
        const country = (row.country || '').toUpperCase();
        const clicks = Number(row.clicks) || 0;
        let cpmRate = 1.5; // Tier 3 default ($1.50 CPM)
        if (['US', 'GB', 'CA', 'AU'].includes(country)) {
          cpmRate = 5.0; // Tier 1 ($5.00 CPM)
        } else if (['DE', 'FR', 'JP', 'IT', 'ES', 'NL', 'SE', 'GR'].includes(country)) {
          cpmRate = 3.0; // Tier 2 ($3.00 CPM)
        }
        estimatedEarnings += (clicks / 1000) * cpmRate;
      }
    } else {
      // Fallback estimate if geo breakdown is empty
      estimatedEarnings = (totalClicks / 1000) * 2.5;
    }
  } catch {
    estimatedEarnings = 0.0;
  }

  // Fetch Referral Stats
  let referralCount = 0;
  let bonusLinksEarned = 0;
  try {
    const refRow = await c.env.DB.prepare(
      `SELECT COUNT(*) as count, SUM(bonus_links_granted) as total_bonus FROM referrals WHERE referrer_user_id = ?`
    )
      .bind(user.id)
      .first<{ count: number; total_bonus: number }>();

    referralCount = refRow?.count || 0;
    bonusLinksEarned = refRow?.total_bonus || 0;
  } catch {
    referralCount = 0;
  }

  // Fetch API Usage stats
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  let apiRequestsCount = 0;
  try {
    const apiRow = await c.env.DB.prepare(
      `SELECT request_count FROM api_usage_logs WHERE user_id = ? AND month_key = ?`
    )
      .bind(user.id, currentMonthKey)
      .first<{ request_count: number }>();

    apiRequestsCount = apiRow?.request_count || 0;
  } catch {
    apiRequestsCount = 0;
  }

  // Fetch user link creation quota & credits
  let userLinksCount = 0;
  try {
    const linkCountRow = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM links WHERE created_by = ? AND status != 'deleted'`
    )
      .bind(user.id)
      .first<{ count: number }>();
    userLinksCount = linkCountRow?.count || 0;
  } catch {
    userLinksCount = 0;
  }

  const isUnlimited = user.role === 'owner' || user.role === 'admin';
  const freeBaseLimit = 10;
  const totalLimit = isUnlimited ? 999999 : freeBaseLimit + bonusLinksEarned;
  const remainingLinks = isUnlimited ? 999999 : Math.max(0, totalLimit - userLinksCount);

  return c.json({
    success: true,
    data: {
      total_clicks: totalClicks,
      estimated_earnings: Number(estimatedEarnings.toFixed(2)),
      quota: {
        free_limit: freeBaseLimit,
        bonus_credits: bonusLinksEarned,
        total_limit: totalLimit,
        used_links: userLinksCount,
        remaining_links: remainingLinks,
        is_unlimited: isUnlimited,
      },
      referrals: {
        total_referred: referralCount,
        bonus_links_earned: bonusLinksEarned,
        referral_code: user.username || user.id,
        referral_url: `https://${c.req.header('host') || 'urlz.eu.org'}/register?ref=${user.username || user.id}`,
      },
      api_usage: {
        month_key: currentMonthKey,
        request_count: apiRequestsCount,
        monthly_limit: user.role === 'owner' || user.role === 'admin' ? 100000 : 0,
        tier_name: user.role === 'owner' || user.role === 'admin' ? 'Enterprise / Admin' : 'Free Community Plan',
        is_api_enabled: user.role === 'owner' || user.role === 'admin',
      },
    },
  });
});

// Submit Request for API Access / Developer Plan Upgrade
monetizationRouter.post('/api-request', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const body = await c.req.json().catch(() => ({}));
  const requestedTier = (body.tier || 'Pro Developer').trim();
  const contactEmail = (body.email || user.email || '').trim();
  const useCase = (body.use_case || body.reason || 'Requested programmatic REST API access').trim();

  // Record upgrade request in audit log for administrators
  try {
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, event_type, details, ip_address, user_agent, created_at)
       VALUES (?, ?, 'api_upgrade_request', ?, ?, ?, ?)`
    ).bind(
      generateId(),
      user.id,
      JSON.stringify({ requested_tier: requestedTier, contact_email: contactEmail, use_case: useCase }),
      c.req.header('CF-Connecting-IP') || '127.0.0.1',
      c.req.header('User-Agent') || 'Browser',
      Date.now()
    ).run();
  } catch (err) {
    console.warn('Failed to insert audit log for API request:', err);
  }

  return c.json({
    success: true,
    message: `API access upgrade request for ${requestedTier} submitted. The platform administrator will review your request and get in touch at ${contactEmail || 'your email'}.`,
  });
});

// Claim Referral Code / Redeem Credit
monetizationRouter.post('/referrals/claim', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const body = await c.req.json().catch(() => ({}));
  const referralCode = (body.referral_code || '').trim();

  if (!referralCode) {
    throw new HTTPException(400, { message: 'Referral username or code is required' });
  }

  const referrer = await c.env.DB.prepare(
    `SELECT id, username FROM users WHERE username = ? OR id = ?`
  ).bind(referralCode, referralCode).first<{ id: string; username: string }>();

  if (!referrer) {
    throw new HTTPException(404, { message: 'Referral user not found' });
  }

  if (referrer.id === user.id) {
    throw new HTTPException(400, { message: 'You cannot use your own referral code' });
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM referrals WHERE referrer_user_id = ? AND referred_user_id = ?`
  ).bind(referrer.id, user.id).first<any>();

  if (existing) {
    throw new HTTPException(409, { message: 'Referral bonus already awarded between these accounts' });
  }

  const id = generateId();
  const bonus = 50;
  await c.env.DB.prepare(
    `INSERT INTO referrals (id, referrer_user_id, referred_user_id, bonus_links_granted, created_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, referrer.id, user.id, bonus, Date.now()).run();

  return c.json({
    success: true,
    message: `Referral applied! +${bonus} free link credits granted to referrer @${referrer.username || referrer.id}.`,
  });
});

// Grant Demo / Test Referral Credits (adds +50 credits to user account)
monetizationRouter.post('/credits/grant', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const body = await c.req.json().catch(() => ({}));
  const amount = Number(body.amount) || 50;
  const targetUserId = (user.role === 'owner' || user.role === 'admin') && body.user_id ? body.user_id : user.id;

  const id = generateId();
  await c.env.DB.prepare(
    `INSERT INTO referrals (id, referrer_user_id, referred_user_id, bonus_links_granted, created_at) VALUES (?, ?, ?, ?, ?)`
  ).bind(id, targetUserId, 'bonus_' + generateId().slice(0, 8), amount, Date.now()).run();

  return c.json({
    success: true,
    message: `+${amount} link creation credits successfully added to account!`,
  });
});

// 2. Advertiser Campaigns List
monetizationRouter.get('/campaigns', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  try {
    const campaigns = await c.env.DB.prepare(
      `SELECT * FROM ad_campaigns WHERE user_id = ? ORDER BY created_at DESC`
    )
      .bind(user.id)
      .all<any>();

    return c.json({ success: true, data: campaigns.results || [] });
  } catch {
    return c.json({ success: true, data: [] });
  }
});

// 3. Create Advertiser Campaign
monetizationRouter.post('/campaigns', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const body = await c.req.json().catch(() => ({}));

  if (!body.name || !body.target_url) {
    throw new HTTPException(400, { message: 'Campaign name and target URL are required' });
  }

  const id = generateId();
  const createdAt = Date.now();

  await c.env.DB.prepare(
    `INSERT INTO ad_campaigns (id, user_id, name, target_url, banner_url, heading, message, cpm_rate, budget_limit, target_country, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
  )
    .bind(
      id,
      user.id,
      body.name.trim(),
      body.target_url.trim(),
      body.banner_url?.trim() || null,
      body.heading?.trim() || 'Sponsored Announcement',
      body.message?.trim() || '',
      Number(body.cpm_rate) || 3.0,
      Number(body.budget_limit) || 100.0,
      body.target_country?.toUpperCase() || 'ALL',
      createdAt
    )
    .run();

  return c.json({ success: true, message: 'Advertiser campaign created successfully', data: { id } });
});

// 4. Toggle or Delete Advertiser Campaign
monetizationRouter.put('/campaigns/:id', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));

  await c.env.DB.prepare(`UPDATE ad_campaigns SET status = ? WHERE id = ? AND user_id = ?`)
    .bind(body.status === 'inactive' ? 'inactive' : 'active', id, user.id)
    .run();

  return c.json({ success: true, message: 'Campaign updated successfully' });
});

monetizationRouter.delete('/campaigns/:id', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const id = c.req.param('id');

  await c.env.DB.prepare(`DELETE FROM ad_campaigns WHERE id = ? AND user_id = ?`).bind(id, user.id).run();

  return c.json({ success: true, message: 'Campaign deleted successfully' });
});

export { monetizationRouter };
