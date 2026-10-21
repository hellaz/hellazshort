/**
 * Copyright (c) 2025 OpenShort.link Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

// Main Cloudflare Worker entry point

import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './types';
import { errorHandler } from './middleware/error';
import { loggerMiddleware } from './middleware/logger';
import { createRateLimit } from './middleware/rateLimit';
import { csrfProtection } from './middleware/csrf';
import { securityHeaders } from './middleware/security';
import { cacheControl } from './middleware/cache-control';
import { handleRedirect } from './services/redirect';
import { getDomainByRoutingPath, normalizeRoutePrefix } from './db/domains';
import { getRootPageSettingsOrDefault } from './db/settings';
import { renderNotFoundPage } from './views/interstitial';

// Import API routes (static - they're small and needed for functionality)
import { linksRouter } from './api/links';
import { domainsRouter } from './api/domains';
import { analyticsRouter } from './api/analytics';
import { authRouter } from './api/auth';
import { usersRouter } from './api/users';
import { tagsRouter } from './api/tags';
import { pixelsRouter } from './api/pixels';
import { categoriesRouter } from './api/categories';
import { apiKeysRouter } from './api/apiKeys';
import { settingsRouter } from './api/settings';
import { importRouter } from './api/import';
import { staticRouter } from './api/static';
import { abuseReportsRouter } from './api/abuseReports';
import { monetizationRouter } from './api/monetization';
// Dynamic imports only for large dashboard/auth views (reduces bundle size)

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', loggerMiddleware);
app.use('*', cors({
  // Restrict browser CORS to an allowlist when ALLOWED_ORIGINS is configured
  // (comma-separated). If unset, preserve the previous permissive behavior ('*').
  // We never send credentials, so '*' is never combined with credentials.
  // Server-to-server / API-key clients send no Origin header and are unaffected.
  origin: (origin, c) => {
    // ALLOWED_ORIGINS is documented in env.d.ts; typed locally because the Env
    // interface (src/types/index.ts) is not augmentable from an ambient .d.ts.
    const allowedOrigins = (c.env as { ALLOWED_ORIGINS?: string }).ALLOWED_ORIGINS || '';
    const allowed = allowedOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (allowed.length > 0) {
      // Echo the request Origin only if it is explicitly allowlisted.
      return origin && allowed.includes(origin) ? origin : null;
    }
    // No allowlist configured: fall back to wildcard (unchanged prior behavior).
    return '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Conditional middleware: Skip CSRF and security headers for redirect routes
// Redirects are GET-only and don't return HTML, so these are unnecessary
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname;
  
  // Apply CSRF/security for dashboard and API routes only
  // Everything else is a redirect route
  const isAdminRoute = path.startsWith('/dashboard') || path.startsWith('/api');
  
  // Exclude auth and public endpoints from CSRF (they create sessions or run without a session)
  const isAuthEndpoint = path.includes('/auth/') ||
                         path.includes('/links/unlock') ||
                         path.endsWith('/abuse-reports') ||
                         (path.endsWith('/links') && !c.req.header('Cookie')?.includes('session_token='));
  
  if (isAdminRoute && !isAuthEndpoint) {
    // Apply CSRF and security headers for dashboard/API routes
    // Chain them properly: CSRF first, then security headers
    await csrfProtection(c, async () => {
      await securityHeaders(c, next);
    });
  } else if (isAdminRoute && isAuthEndpoint) {
    // Auth endpoints: security headers only, no CSRF
    await securityHeaders(c, next);
  } else {
    // Public routes (redirects + the root/route landing page, which can now return
    // branded or custom HTML): apply security headers. No CSRF — GET-only, no session
    // writes. CSP allows inline styles ('unsafe-inline') so the branded page renders,
    // and blocks unnonced inline scripts in custom-HTML mode.
    await securityHeaders(c, next);
  }
});

// Cache control for API routes
app.use('/api/*', cacheControl);

// ============================================================================
// DASHBOARD ROUTES - All admin functionality under /dashboard/*
// ============================================================================

// Dashboard - Health check (moved under /dashboard)
app.get('/dashboard/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Debug - Returns Cloudflare GeoIP headers for the current visitor
// Useful for users to verify exact city/country names before setting up redirect rules.
// Registered under both /api and /dashboard/api via one shared handler.
function handleMyLocation(c: Context<{ Bindings: Env; Variables: Variables }>) {
  // request.cf is populated by Cloudflare by default; the cf-* headers require the
  // "visitor location headers" Managed Transform, so fall back to them if present.
  const cf = (c.req.raw as { cf?: Record<string, string> }).cf || {};
  const city = cf.city || c.req.header('cf-ipcity') || null;
  const country = cf.country || c.req.header('cf-ipcountry') || null;
  const region = cf.region || c.req.header('cf-region') || null;
  const regionCode = cf.regionCode || c.req.header('cf-region-code') || null;
  const timezone = cf.timezone || c.req.header('cf-timezone') || null;

  return c.json({
    success: true,
    data: {
      city,
      country,
      region,
      region_code: regionCode,
      timezone,
      note: 'Use these exact values when setting up city/country redirect rules. City matching is case-insensitive.',
      docs: 'https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-ipcity',
    },
  });
}

app.get('/api/v1/debug/my-location', handleMyLocation);
app.get('/dashboard/api/v1/debug/my-location', handleMyLocation);

// Dashboard - Validation endpoint (moved under /dashboard)
app.get('/dashboard/__validate__', (c) => {
  return c.json({
    valid: true,
    script: 'openshortlink',
    timestamp: Date.now()
  });
});

// Embedded SPA Index HTML Fallback
const SPA_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URLZ - Link Shortener & Management Platform</title>
  <meta name="description" content="URLz Cloudflare-based link shortener and management platform">
  <meta property="og:title" content="URLZ - Link Shortener & Management Platform">
  <meta property="og:description" content="URLz Cloudflare-based link shortener and management platform">
  <link rel="icon" type="image/png" href="/BackgroundSQR.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script type="module" crossorigin src="/assets/index.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index.css">
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased min-h-screen">
  <div id="root"></div>
</body>
</html>`;

async function serveSpa(c: any) {
  if (c.env.ASSETS) {
    try {
      const res = await c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url), c.req.raw));
      if (res.status === 200) {
        return res;
      }
    } catch {}
  }
  return c.html(SPA_INDEX_HTML);
}

// Serve static assets from ASSETS binding if available
app.get('/assets/*', async (c) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
  return c.text('Asset not found', 404);
});

const staticExtRegex = /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|eot)$/i;
app.get('/*', async (c, next) => {
  const url = new URL(c.req.url);
  if (staticExtRegex.test(url.pathname)) {
    if (c.env.ASSETS) {
      const assetRes = await c.env.ASSETS.fetch(c.req.raw);
      if (assetRes.status < 400) return assetRes;
    }
  }
  return next();
});

// Serve React Single Page Application for Dashboard & Auth views
app.get('/dashboard/login', serveSpa);
app.get('/dashboard/setup', serveSpa);
app.get('/login', serveSpa);
app.get('/setup', serveSpa);
app.get('/dashboard', serveSpa);
app.get('/dashboard/*', serveSpa);

// Dashboard - Catch-all for unmatched dashboard routes (MUST come after more specific /dashboard/* routes)
// Note: Moved to after API routes to allow /dashboard/api/* to be matched first

// ============================================================================
// API ROUTES - Mounted at BOTH /dashboard/api/* (for dashboard) and /api/* (for external)
// ============================================================================

// Dashboard internal API - used by dashboard JavaScript
// These endpoints work with just /dashboard/* Cloudflare route
app.route('/dashboard/api/v1/auth', authRouter);
app.route('/dashboard/api/v1/users', usersRouter);
app.route('/dashboard/api/v1/links/import', importRouter);
app.route('/dashboard/api/v1/links', linksRouter);
app.route('/dashboard/api/v1/domains', domainsRouter);
app.route('/dashboard/api/v1/analytics', analyticsRouter);
app.route('/dashboard/api/v1/tags', tagsRouter);
app.route('/dashboard/api/v1/pixels', pixelsRouter);
app.route('/dashboard/api/v1/categories', categoriesRouter);
app.route('/dashboard/api/v1/api-keys', apiKeysRouter);
app.route('/dashboard/api/v1/settings', settingsRouter);
app.route('/dashboard/api/v1/abuse-reports', abuseReportsRouter);
app.route('/dashboard/api/v1/monetization', monetizationRouter);

// Auto-create the first user from environment variables. Shared by the /dashboard/api
// and /api mounts below. Gated by SETUP_TOKEN (consistent with /register) in addition
// to the "no users exist" check, and rate-limited to slow abuse of the unauth endpoint.
async function handleSetupAuto(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const existingUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const userCount = existingUsers?.count || 0;

  if (userCount > 0) {
    return c.json({ success: false, message: 'Users already exist. Auto-setup is only for first user.' }, 400);
  }

  // Require SETUP_TOKEN to be configured AND supplied (body `setup_token` or `X-Setup-Token`).
  if (!c.env.SETUP_TOKEN) {
    return c.json({
      success: false,
      message: 'Server configuration error: SETUP_TOKEN not configured.'
    }, 400);
  }
  const body = await c.req.json().catch(() => ({}));
  const providedToken = (body as { setup_token?: string }).setup_token || c.req.header('X-Setup-Token');
  if (!providedToken || providedToken !== c.env.SETUP_TOKEN) {
    return c.json({ success: false, message: 'Invalid or missing setup token.' }, 403);
  }

  if (!c.env.FIRST_USER_USERNAME || !c.env.FIRST_USER_PASSWORD) {
    return c.json({
      success: false,
      message: 'Auto-setup requires FIRST_USER_USERNAME and FIRST_USER_PASSWORD environment variables.'
    }, 400);
  }

  const { getUserByUsername } = await import('./db/users');
  const existingUser = await getUserByUsername(c.env, c.env.FIRST_USER_USERNAME);
  if (existingUser) {
    return c.json({ success: false, message: 'User already exists.' }, 400);
  }

  const { hashPassword } = await import('./utils/crypto');
  const { createUser } = await import('./db/users');
  const passwordHash = await hashPassword(c.env.FIRST_USER_PASSWORD);

  const user = await createUser(c.env, {
    username: c.env.FIRST_USER_USERNAME,
    email: c.env.FIRST_USER_EMAIL || undefined,
    password_hash: passwordHash,
    role: 'owner',
  });

  return c.json({
    success: true,
    message: 'First user created successfully from environment variables.',
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  }, 201);
}

const setupAutoRateLimit = createRateLimit({
  window: 60,
  max: 5,
  key: (c) => `setup-auto:${c.req.header('CF-Connecting-IP') || 'unknown'}`,
});

// Auto-create first user - also available under /dashboard/api
app.post('/dashboard/api/v1/auth/setup-auto', setupAutoRateLimit, handleSetupAuto);

// Dashboard catch-all - AFTER API routes
app.get('/dashboard/*', async (c) => {
  return c.redirect('/dashboard');
});

// ============================================================================
// EXTERNAL API ROUTES - Optional, enable /api/* route in Cloudflare if needed
// ============================================================================

// External API - for third-party integrations (requires /api/* Cloudflare route)
app.post('/api/v1/auth/setup-auto', setupAutoRateLimit, handleSetupAuto);

app.route('/api/v1/auth', authRouter);
app.route('/api/v1/users', usersRouter);
app.route('/api/v1/links/import', importRouter);
app.route('/api/v1/links', linksRouter);
app.route('/api/v1/domains', domainsRouter);
app.route('/api/v1/analytics', analyticsRouter);
app.route('/api/v1/tags', tagsRouter);
app.route('/api/v1/pixels', pixelsRouter);
app.route('/api/v1/categories', categoriesRouter);
app.route('/api/v1/api-keys', apiKeysRouter);
app.route('/api/v1/settings', settingsRouter);
app.route('/api/v1/abuse-reports', abuseReportsRouter);
app.route('/api/v1/monetization', monetizationRouter);

// ============================================================================
// LINK REDIRECT HANDLER - Catch-all for short link redirects
// ============================================================================

app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const domain = url.hostname;
  const path = url.pathname;

  // Handle __validate__ endpoint for domain route validation
  // This allows external domains to validate their Cloudflare Worker routes
  if (path.endsWith('/__validate__')) {
    return c.json({
      valid: true,
      script: 'openshortlink',
      timestamp: Date.now()
    });
  }

  // Reserved SPA Paths - If the path starts with /p/ or matches a root entry point, serve the SPA.
  const isSpaPage = path.startsWith('/p/') || 
                   ['/login', '/register', '/signup', '/setup', '/dashboard', '/analytics', '/domains', '/pixels', '/integrations', '/monetization', '/settings', '/help'].includes(path.toLowerCase());
  
  if (isSpaPage) {
    return serveSpa(c);
  }

  // Try to find domain and routing path
  let result = await getDomainByRoutingPath(c.env, domain, path);

  if (!result) {
    // If not found by exact hostname, try primary active domain (e.g. urlz.eu.org in dev or custom proxy)
    const fallbackDomain = await c.env.DB.prepare(
      `SELECT * FROM domains WHERE status = 'active' ORDER BY CASE WHEN normalized_domain_name = 'urlz.eu.org' THEN 0 ELSE 1 END, created_at ASC LIMIT 1`
    ).first<import('./types').Domain>();
    if (fallbackDomain) {
      result = await getDomainByRoutingPath(c.env, fallbackDomain.domain_name, path);
    }
  }

  if (!result) {
    if (path === '/' || path === '') {
      return serveSpa(c);
    }
    // Final fallback for unknown routes on non-configured domains
    return c.html(renderNotFoundPage('domain'), 404);
  }

  const { domain: domainObj, matchedRoute } = result;

  // Extract slug from path by stripping EXACTLY the matched route prefix from the
  // start (not a substring replace anywhere in the path), then trimming slashes.
  const routePrefix = normalizeRoutePrefix(matchedRoute); // e.g. '/go/*' -> '/go', '/*' -> '/'
  let slug = path;
  if (routePrefix !== '' && routePrefix !== '/' &&
      (slug === routePrefix || slug.startsWith(routePrefix + '/'))) {
    slug = slug.slice(routePrefix.length);
  }
  slug = slug.replace(/^\//, '').replace(/\/$/, '');

  if (!slug) {
    // #12: serve the configured default page for the domain root (no slug given).
    const rootPage = await getRootPageSettingsOrDefault(c.env);

    if (rootPage.mode === 'redirect' && rootPage.redirect_url) {
      return Response.redirect(rootPage.redirect_url, 302);
    }

    if (rootPage.mode === 'html' && rootPage.html.trim()) {
      return c.html(rootPage.html);
    }

    // Default: serve React Single Page Application (Public Landing View / Dashboard)
    return serveSpa(c);
  }

  // Handle redirect (pass execution context for proper async tracking)
  const redirectResponse = await handleRedirect(c.env, c.req.raw, domainObj, slug, c.executionCtx as any, matchedRoute);

  return redirectResponse;
});

// Error handler
app.onError(errorHandler);

// Cron trigger for scheduled tasks
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
  const cron = event.cron;

  // Handle different cron triggers
  if (cron === '0 0 * * *') {
    // Daily tasks (midnight UTC)
    ctx.waitUntil((async () => {
      try {
        // Daily analytics aggregation — respect the aggregation-enabled setting
        // (the manual /analytics/aggregate endpoint gates on the same setting).
        const { getAnalyticsAggregationEnabledOrDefault } = await import('./db/settings');
        const aggregationSettings = await getAnalyticsAggregationEnabledOrDefault(env);
        if (aggregationSettings.enabled) {
          const { aggregateYesterday } = await import('./services/analyticsAggregation');
          await aggregateYesterday(env);
        } else {
          console.log('[CRON] Analytics aggregation is disabled in settings; skipping.');
        }
      } catch (error) {
        console.error('[CRON ERROR] Failed to aggregate analytics:', error);
      }

      try {
        // Daily top 100 links status check
        const { processDailyTop100Check } = await import('./services/status-check');
        const result = await processDailyTop100Check(env);
      } catch (error) {
        console.error('[CRON ERROR] Failed to check top 100 links:', error);
      }
    })());
  } else if (cron === '0 */6 * * *') {
    // Status check every 6 hours (batch size read from settings)
    ctx.waitUntil((async () => {
      try {
        const { processScheduledStatusCheck } = await import('./services/status-check');
        const result = await processScheduledStatusCheck(env);
      } catch (error) {
        console.error('[CRON ERROR] Failed to check link statuses:', error);
      }
    })());
  } else {
    // Unrecognized cron string — likely wrangler.toml `crons` was edited without
    // updating this dispatch. Log loudly instead of silently doing nothing.
    console.warn(`[CRON] Unrecognized cron trigger "${cron}"; no scheduled job matched. Update the scheduled() handler in src/index.ts if crons changed.`);
  }
}
// Export default object with both fetch (HTTP handler) and scheduled (cron handler)
export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => app.fetch(request, env, ctx),
  scheduled,
};
