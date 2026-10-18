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
  
  // Exclude auth endpoints from CSRF (they create sessions, can't have CSRF token before login)
  const isAuthEndpoint = path.endsWith('/auth/login') || 
                         path.endsWith('/auth/register') ||
                         path.endsWith('/auth/refresh') ||
                         path.endsWith('/auth/mfa/verify') ||
                         path.endsWith('/auth/setup-auto');
  
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

// Dashboard - Login page (moved from /login to /dashboard/login)
app.get('/dashboard/login', async (c) => {
  const { loginHtml } = await import('./views/auth');
  const csrfToken = c.get('csrfToken') || '';
  const nonce = c.get('nonce') || '';
  let showSetup = false;
  try {
    const existingUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    showSetup = (existingUsers?.count || 0) === 0;
  } catch {}
  return c.html(loginHtml(csrfToken, nonce, showSetup));
});

// Dashboard - Setup page (moved from /setup to /dashboard/setup)
app.get('/dashboard/setup', async (c) => {
  if (!c.env.DB) {
    return c.html(`
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:50px auto;padding:28px;background:#fef2f2;border:1px solid #f87171;border-radius:12px;color:#991b1b;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="margin-top:0;">D1 Database Binding Missing</h2>
        <p>The <code>DB</code> binding was not found on your Cloudflare Worker.</p>
        <p>In Cloudflare Dashboard &gt; <strong>Workers &amp; Pages</strong> &gt; <strong>hellazshort</strong> &gt; <strong>Settings</strong> &gt; <strong>Bindings</strong>, add a D1 Database binding with variable name <strong>DB</strong> pointing to <strong>openshortlink-db</strong>.</p>
      </div>
    `, 500);
  }

  // Check if users already exist
  let userCount = 0;
  try {
    const existingUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    userCount = existingUsers?.count || 0;
  } catch (err: any) {
    return c.html(`
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:50px auto;padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);color:#334155;">
        <h2 style="color:#e11d48;margin-top:0;">Database Connection Error</h2>
        <p>Could not query D1 database: <strong>${err.message}</strong></p>
        <p>This usually happens when the <code>database_id</code> in <code>wrangler.toml</code> does not match the actual ID of your D1 database.</p>
        <h3>How to fix:</h3>
        <ol style="line-height:1.8;padding-left:20px;">
          <li>In Cloudflare Dashboard, go to <strong>Storage &amp; Databases</strong> &gt; <strong>D1 SQL Database</strong>.</li>
          <li>Click on <strong>openshortlink-db</strong> and copy the <strong>Database ID</strong>.</li>
          <li>In <strong>Workers &amp; Pages</strong> &gt; <strong>hellazshort</strong> &gt; <strong>Settings</strong> &gt; <strong>Bindings</strong>, ensure D1 binding <strong>DB</strong> is connected to <strong>openshortlink-db</strong> (or update <code>database_id</code> in <code>wrangler.toml</code>).</li>
        </ol>
      </div>
    `, 500);
  }

  if (userCount > 0) {
    // Users exist, redirect to login
    return c.redirect('/dashboard/login');
  }

  // Check if SETUP_TOKEN is configured
  if (!c.env.SETUP_TOKEN) {
    const { setupErrorHtml } = await import('./views/auth');
    return c.html(setupErrorHtml);
  }

  const { setupHtml } = await import('./views/auth');
  const csrfToken = c.get('csrfToken') || '';
  const nonce = c.get('nonce') || '';
  return c.html(setupHtml(csrfToken, nonce));
});

// Dashboard - Static assets (moved from /static to /dashboard/static)
app.route('/dashboard/static', staticRouter);

// Dashboard - Main dashboard page
app.get('/dashboard', async (c) => {
  // Dynamic import - only loads dashboard code when accessed
  const { dashboardHtml } = await import('./views/dashboard');
  
  // Check for auth cookie, auth header, or query token
  const cookieHeader = c.req.header('Cookie');
  let token = cookieHeader?.match(/session_token=([^;]+)/)?.[1];
  const url = new URL(c.req.url);
  const queryToken = url.searchParams.get('token');
  if (!token && queryToken) {
    token = queryToken;
  }
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    const existingUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    if ((existingUsers?.count || 0) === 0) {
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return c.redirect('/dashboard/setup');
    }
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return c.redirect('/dashboard/login');
  }

  // Prevent caching of dashboard
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  if (queryToken) {
    const isProd = c.env.ENVIRONMENT === 'production';
    c.header('Set-Cookie', `session_token=${token}; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=3600`);
  }
  const csrfToken = c.get('csrfToken') || '';
  const nonce = c.get('nonce') || '';
  return c.html(dashboardHtml(csrfToken, nonce));
});

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
      return c.redirect('/dashboard');
    }
    return c.text('Not found', 404);
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

    // Default: a built-in branded welcome page.
    return c.html(renderBrandedRootPage(domainObj.domain_name, c.get('nonce')));
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
  <title>URLZ - Shorten, Brand & Monetize Links (${safeDomain})</title>
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
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-black text-xl">
          🔗
        </div>
        <div>
          <span class="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            URLZ
          </span>
          <span class="text-[10px] font-mono text-indigo-400 block -mt-1 font-semibold">
            ${safeDomain}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <a href="/dashboard/login" class="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors">
          Sign In
        </a>
        <a href="/dashboard" class="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all">
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
        Shorten, Brand & Monetize <br class="hidden sm:inline" />
        <span class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          Every Single Link
        </span>
      </h1>

      <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Take full control of your links with lightning-fast Cloudflare edge redirects, password protection,
        monetized splash pages, retargeting pixels, and deep geo-targeting.
      </p>

      <!-- Instant Shortener Form -->
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
              class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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
        </form>

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
          <h3 class="text-base font-bold text-white mb-2">Monetization & Splash Pages</h3>
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

    const shortForm = document.getElementById('shortForm');
    const destUrl = document.getElementById('destUrl');
    const customAlias = document.getElementById('customAlias');
    const linkPassword = document.getElementById('linkPassword');
    const resultCard = document.getElementById('resultCard');
    const resLink = document.getElementById('resLink');
    const copyBtn = document.getElementById('copyBtn');

    shortForm.addEventListener('submit', async (e) => {
      e.preventDefault();
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
          redirect_code: 301
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        const fullUrl = window.location.origin + '/' + (data.data.slug || alias);
        resLink.href = fullUrl;
        resLink.textContent = fullUrl;
        resultCard.classList.remove('hidden');
      } else {
        alert(data.message || data.error || 'Please sign in to create short links on this domain.');
        window.location.href = '/dashboard/login';
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
