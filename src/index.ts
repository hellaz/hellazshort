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
import { escapeHtml } from './utils/html';

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
    const { renderNotFoundPage } = await import('./views/interstitial');
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

  // Reserved SPA Paths - If the slug matches a public page, serve the SPA instead of redirecting.
  // This allows direct navigation to /features, /about, etc.
  const reservedSpaPaths = ['features', 'about', 'contact', 'terms', 'privacy', 'login', 'register', 'setup', 'report-abuse', 'dashboard', 'analytics', 'domains', 'pixels', 'integrations', 'monetization', 'settings', 'help'];
  if (reservedSpaPaths.includes(slug.toLowerCase())) {
    return serveSpa(c);
  }

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

// #12: built-in branded welcome page served at a domain root when no custom
// page or redirect is configured. domainName is escaped (it originates from the DB).
function renderBrandedRootPage(domainName: string, nonce: string = ''): string {
  const safeDomain = escapeHtml(domainName);
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>URLZ - Shorten, Brand & Simplify Links (${safeDomain})</title>
  <meta name="description" content="Take full control of your links with lightning-fast Cloudflare edge redirects, password protection, branded splash pages, retargeting pixels, and deep geo-targeting.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="URLZ - Shorten, Brand & Simplify Links (${safeDomain})">
  <meta property="og:description" content="Take full control of your links with lightning-fast Cloudflare edge redirects, password protection, branded splash pages, retargeting pixels, and deep geo-targeting.">
  <meta property="og:site_name" content="URLZ">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="URLZ - Shorten, Brand & Simplify Links (${safeDomain})">
  <meta name="twitter:description" content="Take full control of your links with lightning-fast Cloudflare edge redirects, password protection, branded splash pages, retargeting pixels, and deep geo-targeting.">
  <script src="https://cdn.tailwindcss.com"${nonceAttr}></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background-color: #020617; color: #f8fafc; min-height: 100vh; }
    a { text-decoration: none; color: inherit; }
    input, button { font-family: inherit; }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
  <!-- Navigation Header -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2.5">
          <img src="/auto_urlz_logo_invert.png" alt="URLZ" class="h-9 w-auto object-contain" onerror="this.onerror=null;this.classList.add('hidden');this.nextElementSibling.classList.remove('hidden');" />
          <div class="hidden flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">🔗</div>
            <span class="text-xl font-black text-white">URL<span class="text-indigo-400">Z</span></span>
          </div>
        </a>
        <span class="text-[10px] font-mono text-indigo-400 font-semibold px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/50">
          ${safeDomain}
        </span>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Instant Social Sign-in quick icons -->
        <div class="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-semibold px-1">Social Sign-In:</span>
          <button onclick="handleSocialAuth('google')" class="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer" title="Sign In with Google">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
          </button>
          <button onclick="handleSocialAuth('twitter')" class="p-1 rounded-lg hover:bg-slate-800 text-sky-400 transition-colors cursor-pointer" title="Sign In with Twitter / X">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
          <button onclick="handleSocialAuth('facebook')" class="p-1 rounded-lg hover:bg-slate-800 text-blue-500 transition-colors cursor-pointer" title="Sign In with Facebook">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
        </div>

        <a href="/dashboard/login" class="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors">
          Sign In
        </a>
        <a href="/dashboard" class="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all">
          Open Dashboard &rarr;
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>
    <div class="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

    <div class="max-w-4xl mx-auto text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
        <span>✨ Next-Generation Link Management Platform</span>
      </div>

      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
        Shorten, Brand & Simplify <br class="hidden sm:inline" />
        <span class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          Every Single Link
        </span>
      </h1>

      <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Take full control of your links with lightning-fast Cloudflare edge redirects, password protection,
        branded splash pages, retargeting pixels, and deep geo-targeting.
      </p>

      <!-- Instant Shortener Form with Security Verification -->
      <div class="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-left">
        <form id="shortForm" class="space-y-3">
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              id="destUrl"
              required
              placeholder="Paste a long link here (e.g. https://example.com/product/123)..."
              class="flex-1 px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              id="submitBtn"
              class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>Shorten</span> &rarr;
            </button>
          </div>

          <div class="flex items-center justify-between pt-1">
            <button
              type="button"
              id="toggleAdv"
              class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              ⚙️ Customize alias & password protection
            </button>
            <span class="text-[11px] text-slate-500 font-mono">
              Domain: ${safeDomain}
            </span>
          </div>

          <div id="advBox" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">
                Custom Alias (Optional)
              </label>
              <div class="flex items-center">
                <span class="px-2.5 py-2 text-xs font-mono text-slate-500 bg-slate-950 border border-r-0 border-slate-700 rounded-l-lg">
                  /
                </span>
                <input
                  type="text"
                  id="customAlias"
                  placeholder="my-campaign"
                  class="w-full px-2.5 py-2 text-xs font-mono rounded-r-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">
                Password Protection (Optional)
              </label>
              <input
                type="password"
                id="linkPassword"
                placeholder="Secret password..."
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Security Verification (Anti-Bot Captcha) -->
          <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs pt-2">
            <div class="flex items-center justify-between text-slate-300">
              <div class="flex items-center gap-1.5 font-semibold text-[11px] text-indigo-400">
                <span class="text-emerald-400">🛡️</span>
                <span>Security Verification (Anti-Bot Captcha)</span>
              </div>
              <button
                type="button"
                id="refreshCaptchaBtn"
                class="text-slate-500 hover:text-slate-300 p-1 cursor-pointer transition-colors text-xs"
                title="Refresh Challenge"
              >
                🔄 Refresh
              </button>
            </div>
            <div class="flex items-center gap-3">
              <div id="captchaProblem" class="px-3 py-1.5 bg-slate-900 font-mono text-sm font-bold text-amber-400 rounded-lg border border-slate-800 select-none">
                4 + 5 = ?
              </div>
              <input
                type="text"
                id="captchaAnswer"
                maxlength="3"
                placeholder="Answer..."
                class="w-24 px-3 py-1.5 font-mono text-xs rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-indigo-500"
              />
              <span id="captchaStatus" class="hidden text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                ✓ Verified
              </span>
            </div>
          </div>
        </form>

        <!-- Social Sign-in Callout inside Form Card -->
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>✨ Get 10 Free Short Links with instant Social Sign-In:</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="handleSocialAuth('google')"
              class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-indigo-500 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onclick="handleSocialAuth('twitter')"
              class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-sky-500 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <svg class="w-3.5 h-3.5 fill-sky-400" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </button>
            <button
              type="button"
              onclick="handleSocialAuth('facebook')"
              class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-blue-600 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <svg class="w-3.5 h-3.5 fill-blue-500" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>
        </div>

        <div id="resultCard" class="hidden mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/30">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="text-xs font-semibold text-emerald-400">
                ✅ Your Short Link is Ready:
              </div>
              <a
                id="resLink"
                href="#"
                target="_blank"
                class="text-base sm:text-lg font-bold font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mt-0.5"
              ></a>
            </div>
            <button
              id="copyBtn"
              class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Feature Showcase Grid -->
  <section class="py-16 px-4 sm:px-6 bg-slate-900/40 border-t border-slate-800/80">
    <div class="max-w-6xl mx-auto">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Premium Link Management Features
        </h2>
        <p class="text-sm text-slate-400">
          Built for performance marketers, creators, and power users who need total control over their traffic.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 text-xl">🔒</div>
          <h3 class="text-base font-bold text-white mb-2">Password Protected Links</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Lock sensitive downloads or private content with a master password. Visitors enter a passcode before redirecting.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 text-xl">⏳</div>
          <h3 class="text-base font-bold text-white mb-2">Sponsorship & Splash Pages</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Display customized splash screens with sponsor banners, countdown timers, and CTAs before sending users to final destinations.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 transition-all">
          <div class="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 text-xl">🎯</div>
          <h3 class="text-base font-bold text-white mb-2">Retargeting Pixel Library</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Fire Meta Pixel, Google Analytics 4, TikTok, and LinkedIn tags on click to build warm custom audiences from third-party links.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 text-xl">🌍</div>
          <h3 class="text-base font-bold text-white mb-2">Geo & Device Targeting</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Route iOS users to App Store, Android to Google Play, and international visitors to localized landing pages by country.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 text-xl">📊</div>
          <h3 class="text-base font-bold text-white mb-2">Deep Click Analytics</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Track real-time clicks by country, referrer, OS, browser, and UTM campaigns with exportable CSV reports.
          </p>
        </div>

        <div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 text-xl">⚡</div>
          <h3 class="text-base font-bold text-white mb-2">Multi-Domain & Fast Edge</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Attach custom domains like <span class="font-mono text-amber-300">${safeDomain}</span> with sub-millisecond Cloudflare Worker edge redirection.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Developer API Section -->
  <section class="py-16 px-4 sm:px-6">
    <div class="max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12">
      <div class="flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="space-y-4 max-w-md">
          <span class="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            💻 Developer API
          </span>
          <h3 class="text-2xl font-bold text-white">
            Shorten links programmatically via REST API
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Generate API keys from your dashboard to automate link creation in Python, Node.js, PHP, or cURL.
          </p>
          <a href="/dashboard" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors">
            <span>Open Dashboard</span> &rarr;
          </a>
        </div>

        <div class="w-full md:w-auto font-mono text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
          <div class="text-slate-500 mb-2"># Shorten with curl</div>
          <div class="text-emerald-400 whitespace-pre">curl -X POST https://${safeDomain}/api/v1/links \\
  -H "Authorization: Bearer &lt;API_KEY&gt;" \\
  -H "Content-Type: application/json" \\
  -d '{"destination_url":"https://example.com"}'</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 text-xs text-slate-500">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-300">URLZ</span>
        <span>&bull;</span>
        <span>Link Management Platform</span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/dashboard" class="hover:text-slate-300 transition-colors">Dashboard</a>
        <a href="/dashboard/login" class="hover:text-slate-300 transition-colors">Admin Login</a>
        <span class="text-slate-600 font-mono text-[11px]">${safeDomain}</span>
      </div>
    </div>
  </footer>

  <script${nonceAttr}>
    const toggleAdv = document.getElementById('toggleAdv');
    const advBox = document.getElementById('advBox');
    toggleAdv.addEventListener('click', () => advBox.classList.toggle('hidden'));

    // Captcha Logic for Instant Shortener
    let cap1 = 4;
    let cap2 = 5;
    let isCapSolved = false;
    const problemEl = document.getElementById('captchaProblem');
    const answerEl = document.getElementById('captchaAnswer');
    const statusEl = document.getElementById('captchaStatus');
    const refreshBtn = document.getElementById('refreshCaptchaBtn');

    function refreshCaptcha() {
      cap1 = Math.floor(Math.random() * 8) + 2;
      cap2 = Math.floor(Math.random() * 8) + 1;
      isCapSolved = false;
      if (problemEl) problemEl.textContent = cap1 + ' + ' + cap2 + ' = ?';
      if (answerEl) {
        answerEl.value = '';
        answerEl.classList.remove('border-emerald-500', 'bg-emerald-950/20');
        answerEl.classList.add('border-slate-700');
      }
      if (statusEl) statusEl.classList.add('hidden');
    }

    if (refreshBtn) refreshBtn.addEventListener('click', refreshCaptcha);
    if (answerEl) {
      answerEl.addEventListener('input', () => {
        const val = answerEl.value.trim();
        if (val === (cap1 + cap2).toString()) {
          isCapSolved = true;
          answerEl.classList.remove('border-slate-700');
          answerEl.classList.add('border-emerald-500', 'bg-emerald-950/20');
          if (statusEl) statusEl.classList.remove('hidden');
        } else {
          isCapSolved = false;
          answerEl.classList.remove('border-emerald-500', 'bg-emerald-950/20');
          answerEl.classList.add('border-slate-700');
          if (statusEl) statusEl.classList.add('hidden');
        }
      });
    }

    // Initialize challenge
    refreshCaptcha();

    // Instant Social Sign-In Handler
    async function handleSocialAuth(provider) {
      try {
        const payload = {
          email: provider + '_user@urlz.eu.org',
          name: provider.toUpperCase() + ' User'
        };

        let csrfToken = '';
        try {
          const csrfRes = await fetch('/api/v1/auth/csrf');
          if (csrfRes.ok) {
            const csrfData = await csrfRes.json();
            csrfToken = csrfData?.data?.csrfToken || '';
          }
        } catch (e) {}

        const headers = {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        };

        let res = await fetch('/dashboard/api/v1/auth/social/' + provider, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          res = await fetch('/api/v1/auth/social/' + provider, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(payload)
          });
        }

        const data = await res.json();
        if (data.success && data.data?.token) {
          localStorage.setItem('auth_token', data.data.token);
          document.cookie = 'session_token=' + data.data.token + '; Path=/; Max-Age=3600; SameSite=Lax';
          window.location.href = '/dashboard';
        } else {
          alert(data.message || data.error || 'Failed to authenticate via ' + provider);
        }
      } catch (e) {
        alert('Authentication failed with ' + provider);
      }
    }

    const shortForm = document.getElementById('shortForm');
    const destUrl = document.getElementById('destUrl');
    const customAlias = document.getElementById('customAlias');
    const linkPassword = document.getElementById('linkPassword');
    const resultCard = document.getElementById('resultCard');
    const resLink = document.getElementById('resLink');
    const copyBtn = document.getElementById('copyBtn');

    shortForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isCapSolved) {
        alert('Please solve the Security Verification challenge before shortening links.');
        if (answerEl) answerEl.focus();
        return;
      }

      const url = destUrl.value.trim();
      const alias = customAlias.value.trim();
      const pass = linkPassword.value.trim();

      const res = await fetch('/api/v1/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: url,
          slug: alias || undefined,
          password: pass || undefined,
          redirect_code: 301,
          captcha_solution: (cap1 + cap2).toString()
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        const fullUrl = window.location.origin + '/' + (data.data.slug || alias);
        resLink.href = fullUrl;
        resLink.textContent = fullUrl;
        resultCard.classList.remove('hidden');
      } else {
        alert(data.message || data.error || 'Failed to shorten link.');
      }
    });

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(resLink.href);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy Link', 2000);
    });
  </script>
</body>
</html>`;
}

// Export default object with both fetch (HTTP handler) and scheduled (cron handler)
export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => app.fetch(request, env, ctx),
  scheduled,
};
