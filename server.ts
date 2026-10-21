/**
 * Node.js Server Entry Point for URLZ (OpenShort.link Engine)
 * Runs Express with Vite middlewares in dev, routing APIs and Short Links to Hono & SQLite D1.
 */

import express from 'express';
import { getRequestListener } from '@hono/node-server';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer as createViteServer } from 'vite';
import worker from './src/index';
import type { Env } from './src/types';
import { hashPassword, verifyPassword } from './src/utils/crypto';

// Allow running inside preview iframes
process.env.ALLOW_IFRAME = 'true';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

interface CallCounter { count: number; reset(): void }

function toSqlite(v: unknown): unknown {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

class NodeD1Stmt {
  constructor(
    private db: any,
    readonly sql: string,
    private params: unknown[] = [],
    private counter?: CallCounter
  ) {}

  bind(...params: unknown[]) {
    return new NodeD1Stmt(this.db, this.sql, params.map(toSqlite), this.counter);
  }

  async first<T>(col?: string): Promise<T | null> {
    if (this.counter) this.counter.count++;
    try {
      const row = this.db.prepare(this.sql).get(...this.params);
      if (!row) return null;
      return (col ? row[col] : row) as T;
    } catch (err: any) {
      console.error(`[DB FIRST ERROR] ${this.sql}:`, err.message);
      throw err;
    }
  }

  async all<T>(): Promise<{ results: T[] }> {
    if (this.counter) this.counter.count++;
    try {
      const rows = this.db.prepare(this.sql).all(...this.params);
      return { results: rows as T[] };
    } catch (err: any) {
      console.error(`[DB ALL ERROR] ${this.sql}:`, err.message);
      throw err;
    }
  }

  async run() {
    if (this.counter) this.counter.count++;
    try {
      const r = this.db.prepare(this.sql).run(...this.params);
      return { success: true, meta: { changes: Number(r.changes) } };
    } catch (err: any) {
      console.error(`[DB RUN ERROR] ${this.sql}:`, err.message);
      throw err;
    }
  }

  exec() {
    return /\bRETURNING\b/i.test(this.sql) || /^\s*SELECT/i.test(this.sql)
      ? { results: this.db.prepare(this.sql).all(...this.params) }
      : { results: [], meta: { changes: Number(this.db.prepare(this.sql).run(...this.params).changes) } };
  }
}

function wrapD1(raw: any, counter?: CallCounter) {
  return {
    prepare: (sql: string) => new NodeD1Stmt(raw, sql, [], counter),
    batch: async (stmts: NodeD1Stmt[]) => {
      if (counter) counter.count++;
      raw.exec('BEGIN');
      try {
        const out = stmts.map((s) => s.exec());
        raw.exec('COMMIT');
        return out;
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

// 1. Initialize SQLite database
const dbFilePath = join(process.cwd(), 'openshortlink.sqlite');
const rawDb = new DatabaseSync(dbFilePath);
rawDb.exec('PRAGMA foreign_keys = ON;');
rawDb.exec('CREATE TABLE IF NOT EXISTS _cf_METADATA (id TEXT PRIMARY KEY, applied_at INTEGER);');
rawDb.exec('CREATE TABLE IF NOT EXISTS abuse_reports (id TEXT PRIMARY KEY, url TEXT, reason TEXT, email TEXT, details TEXT, status TEXT DEFAULT "pending", created_at INTEGER);');

// Run pending migrations
const migrationsDir = join(process.cwd(), 'migrations');
if (existsSync(migrationsDir)) {
  const files = readdirSync(migrationsDir)
    .filter((n) => n.endsWith('.sql'))
    .sort();

  for (const f of files) {
    const row = rawDb.prepare('SELECT id FROM _cf_METADATA WHERE id = ?').get(f);
    if (!row) {
      console.log(`Applying migration ${f}...`);
      const sql = readFileSync(join(migrationsDir, f), 'utf8');
      try {
        rawDb.exec(sql);
      } catch (err: any) {
        console.warn(`Migration ${f} notice:`, err.message);
      }
      rawDb.prepare('INSERT INTO _cf_METADATA (id, applied_at) VALUES (?, ?)').run(f, Date.now());
    }
  }
}

// 2. Initialize KV Cache
interface CacheEntry {
  value: string;
  expiresAt?: number;
}
const kvStore = new Map<string, CacheEntry>();

const CACHE = {
  get: async (key: string, opts?: { type?: string } | string) => {
    const entry = kvStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      kvStore.delete(key);
      return null;
    }
    const type = typeof opts === 'string' ? opts : opts?.type;
    if (type === 'json') {
      try {
        return JSON.parse(entry.value);
      } catch {
        return null;
      }
    }
    return entry.value;
  },
  put: async (key: string, value: string, opts?: { expirationTtl?: number }) => {
    const expiresAt = opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined;
    kvStore.set(key, { value, expiresAt });
  },
  delete: async (key: string) => {
    kvStore.delete(key);
  },
};

// 3. Analytics Engine Mock
const analyticsEvents: any[] = [];
const ANALYTICS = {
  writeDataPoint: async (point: any) => {
    analyticsEvents.push({ ...point, timestamp: Date.now() });
    if (analyticsEvents.length > 5000) analyticsEvents.shift();
  },
};

// 4. Build Env object
const DB = wrapD1(rawDb) as any;
const setupToken = process.env.SETUP_TOKEN || 'openshortlink-setup-token-secret-2025';
const firstUserUsername = process.env.FIRST_USER_USERNAME || 'admin';
const firstUserPassword = process.env.FIRST_USER_PASSWORD || 'Password1234!';
const firstUserEmail = process.env.FIRST_USER_EMAIL || 'admin@urlz.eu.org';

const env: Env = {
  DB,
  CACHE: CACHE as any,
  ANALYTICS: ANALYTICS as any,
  SETUP_TOKEN: setupToken,
  FIRST_USER_USERNAME: firstUserUsername,
  FIRST_USER_PASSWORD: firstUserPassword,
  FIRST_USER_EMAIL: firstUserEmail,
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CACHE_TTL: process.env.CACHE_TTL || '604800',
  MAX_LINKS_PER_DOMAIN: process.env.MAX_LINKS_PER_DOMAIN || '10000',
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
};

// 5. Seed default domain (urlz.eu.org, urlz.gr, and localhost)
async function seedInitialData() {
  const now = Date.now();

  // Ensure urlz.eu.org exists
  const existingUrlz = await DB.prepare('SELECT id FROM domains WHERE normalized_domain_name = ?').bind('urlz.eu.org').first<{ id: string }>();
  if (!existingUrlz) {
    const oldDomain = await DB.prepare('SELECT id FROM domains WHERE normalized_domain_name = ?').bind('url.eu.org').first<{ id: string }>();
    if (oldDomain) {
      await DB.prepare("UPDATE domains SET domain_name = 'urlz.eu.org', normalized_domain_name = 'urlz.eu.org', updated_at = ? WHERE id = ?").bind(now, oldDomain.id).run();
    } else {
      await DB.prepare(
        `INSERT INTO domains (
          id, cloudflare_account_id, domain_name, normalized_domain_name, routing_path,
          default_redirect_code, status, settings, created_at, updated_at
        ) VALUES (?, 'local-account', 'urlz.eu.org', 'urlz.eu.org', '/*', 301, 'active', ?, ?, ?)`
      ).bind('dom_urlzeuorg', JSON.stringify({ routes: ['/*'] }), now, now).run();
      console.log('Seeded default domain: urlz.eu.org');
    }
  }

  // Ensure urlz.gr exists
  const existingUrlzGr = await DB.prepare('SELECT id FROM domains WHERE normalized_domain_name = ?').bind('urlz.gr').first<{ id: string }>();
  if (!existingUrlzGr) {
    await DB.prepare(
      `INSERT INTO domains (
        id, cloudflare_account_id, domain_name, normalized_domain_name, routing_path,
        default_redirect_code, status, settings, created_at, updated_at
      ) VALUES (?, 'local-account', 'urlz.gr', 'urlz.gr', '/*', 301, 'active', ?, ?, ?)`
    ).bind('dom_urlzgr', JSON.stringify({ routes: ['/*'] }), now, now).run();
    console.log('Seeded domain: urlz.gr');
  }

  // Ensure localhost is NEVER a domain option - purge any legacy occurrences
  await DB.prepare("DELETE FROM domains WHERE normalized_domain_name = 'localhost' OR domain_name = 'localhost'").run();

  // Seed default admin user if none exists
  const userCount = await DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  if ((userCount?.count || 0) === 0 && firstUserUsername && firstUserPassword) {
    const passwordHash = await hashPassword(firstUserPassword);
    await DB.prepare(
      `INSERT INTO users (
        id, email, username, password_hash, role, created_at, updated_at, global_access, must_change_password
      ) VALUES (?, ?, ?, ?, 'owner', ?, ?, 1, 0)`
    ).bind(
      'user_admin',
      firstUserEmail,
      firstUserUsername,
      passwordHash,
      now,
      now
    ).run();
    console.log(`Initial admin user created: username="${firstUserUsername}", password="${firstUserPassword}"`);
  }

  // Ensure admin user has explicit user_domains records for both primary domains
  await DB.prepare("INSERT OR IGNORE INTO user_domains (user_id, domain_id, created_at) VALUES ('user_admin', 'dom_urlzeuorg', ?)").bind(now).run();
  await DB.prepare("INSERT OR IGNORE INTO user_domains (user_id, domain_id, created_at) VALUES ('user_admin', 'dom_urlzgr', ?)").bind(now).run();
}

seedInitialData().catch((err) => {
  console.error('Error during initial data seeding:', err);
});

// Helper for cookies
function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift()!.trim()] = decodeURI(parts.join('='));
  });
  return list;
}

// 6. Setup Express App
async function startServer() {
  const app = express();
  const port = 3000;
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const hostname = '0.0.0.0';

  // Always serve public assets statically
  app.use(express.static(resolve('public')));

  // Hono Request Listener for API & Workers
  const honoListener = getRequestListener((req: Request) => {
    const executionCtx: any = {
      waitUntil(promise: Promise<unknown>) {
        promise.catch((err) => console.error('[ASYNC WORKER ERROR]', err));
      },
      passThroughOnException() {},
    };
    return worker.fetch(req, env, executionCtx);
  });

  // Password Unlock Endpoint
  app.post('/api/v1/links/unlock/:slug', express.json(), async (req, res) => {
    const { slug } = req.params;
    const { password } = req.body || {};

    try {
      const link = await DB.prepare('SELECT * FROM links WHERE slug = ?').bind(slug).first<any>();
      if (!link) {
        return res.status(404).json({ success: false, message: 'Link not found' });
      }

      const linkPass = link.password_hash || link.password;
      if (!linkPass) {
        return res.json({ success: true, destination_url: link.destination_url });
      }

      let matches = password === linkPass;
      if (!matches) {
        matches = await verifyPassword(password, linkPass).catch(() => false);
      }

      if (!matches) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }

      // Set unlocked cookie
      res.setHeader('Set-Cookie', `unlocked_${link.id}=1; Path=/; Max-Age=3600; SameSite=Lax`);
      return res.json({ success: true, destination_url: link.destination_url });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Abuse Reports Endpoints (Report phishing, malware, bad reputation)
  app.post('/api/v1/abuse-reports', express.json(), async (req, res) => {
    try {
      const { url, reason, email, details } = req.body || {};
      if (!url || !reason) {
        return res.status(400).json({ success: false, message: 'URL and reason are required' });
      }
      const id = 'abuse_' + Math.random().toString(36).substring(2, 11);
      await DB.prepare(
        'INSERT INTO abuse_reports (id, url, reason, email, details, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", ?)'
      ).bind(id, url, reason, email || '', details || '', Date.now()).run();
      return res.json({ success: true, message: 'Abuse report submitted. Thank you for protecting URLZ visitors.' });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/v1/abuse-reports', async (_req, res) => {
    try {
      const rows = await DB.prepare('SELECT * FROM abuse_reports ORDER BY created_at DESC').all<any>();
      return res.json({ success: true, data: rows.results || [] });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/v1/abuse-reports/:id/resolve', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body || {};
      if (action === 'disable') {
        const report = await DB.prepare('SELECT url FROM abuse_reports WHERE id = ?').bind(id).first<any>();
        if (report?.url) {
          const slug = report.url.replace(/^https?:\/\/[^\/]+\//, '');
          if (slug) {
            await DB.prepare("UPDATE links SET status = 'disabled' WHERE slug = ?").bind(slug).run();
          }
        }
      }
      await DB.prepare("UPDATE abuse_reports SET status = 'resolved' WHERE id = ?").bind(id).run();
      return res.json({ success: true, message: 'Report marked resolved' });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  // Middleware: Route API and short-link redirects
  app.use(async (req, res, next) => {
    const pathname = req.path;

    // 1. API routes and internal endpoints go to Hono
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/dashboard/api/') ||
      pathname === '/dashboard/health' ||
      pathname.endsWith('/__validate__')
    ) {
      return honoListener(req, res);
    }

    // 2. Filter out frontend SPA routes and asset paths
    const isFrontendPath =
      pathname === '/' ||
      pathname.startsWith('/p/') ||
      pathname === '/dashboard' ||
      pathname.startsWith('/dashboard/') ||
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/signup' ||
      pathname === '/setup' ||
      pathname === '/admin' ||
      pathname.startsWith('/@') ||
      pathname.startsWith('/src/') ||
      pathname.startsWith('/node_modules/') ||
      pathname.startsWith('/assets/') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.ts') ||
      pathname.endsWith('.tsx') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.json') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.svg');

    if (!isFrontendPath && req.method === 'GET') {
      const cleanSlug = pathname.replace(/^\//, '');

      try {
        const link = await DB.prepare('SELECT * FROM links WHERE slug = ?').bind(cleanSlug).first<any>();
        if (link) {
          const cookies = parseCookies(req.headers.cookie);
          const linkPass = link.password_hash || link.password;
          const isUnlocked = cookies[`unlocked_${link.id}`] === '1';

          let metadata: any = {};
          try {
            metadata = typeof link.metadata === 'string' ? JSON.parse(link.metadata) : (link.metadata || {});
          } catch {}

          // 1. Check expiration date
          if (link.expires_at && Date.now() > link.expires_at) {
            return res.status(410).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Link Expired - URLZ</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#020617;color:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;margin:0;}.card{background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:2.5rem;max-width:440px;width:100%;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);}.icon{font-size:3rem;margin-bottom:1rem;}h1{font-size:1.4rem;margin-bottom:0.5rem;}p{color:#94a3b8;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;}a{display:inline-block;padding:0.75rem 1.5rem;background:#4f46e5;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:0.875rem;}</style></head>
<body><div class="card"><div class="icon">⏳</div><h1>Link Expired</h1><p>This short URL has reached its expiration date and is no longer available.</p><a href="/">Go to URLZ Homepage &rarr;</a></div></body></html>`);
          }

          // 2. Check maximum visits limit
          if (metadata.max_clicks && (link.click_count || 0) >= metadata.max_clicks) {
            return res.status(410).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Visit Limit Reached - URLZ</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#020617;color:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;margin:0;}.card{background:#0f172a;border:1px solid #1e293b;border-radius:24px;padding:2.5rem;max-width:440px;width:100%;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);}.icon{font-size:3rem;margin-bottom:1rem;}h1{font-size:1.4rem;margin-bottom:0.5rem;}p{color:#94a3b8;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;}a{display:inline-block;padding:0.75rem 1.5rem;background:#4f46e5;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:0.875rem;}</style></head>
<body><div class="card"><div class="icon">🛑</div><h1>Visit Limit Reached</h1><p>This short URL has reached its maximum visit limit and is no longer accepting clicks.</p><a href="/">Go to URLZ Homepage &rarr;</a></div></body></html>`);
          }

          // 3. Password protection interstitial
          if (linkPass && !isUnlocked) {
            return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Protected Link - URLZ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 2rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { width: 56px; height: 56px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 1.25rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; }
    input { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #334155; background: #020617; color: #fff; font-size: 0.9rem; margin-bottom: 1rem; outline: none; }
    input:focus { border-color: #f59e0b; }
    button { width: 100%; padding: 0.75rem; border-radius: 12px; border: none; background: #f59e0b; color: #000; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #d97706; }
    .error { color: #f43f5e; font-size: 0.8rem; margin-bottom: 1rem; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Password Protected Link</h1>
    <p>This short link requires a passcode to continue to destination.</p>
    <div id="err" class="error"></div>
    <form id="f">
      <input type="password" id="p" placeholder="Enter password..." required autofocus />
      <button type="submit">Unlock &amp; Continue &rarr;</button>
    </form>
  </div>
  <script>
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault();
      const p = document.getElementById('p').value;
      const res = await fetch('/api/v1/links/unlock/${cleanSlug}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: p })
      });
      const data = await res.json();
      if (res.ok && data.destination_url) {
        window.location.href = data.destination_url;
      } else {
        const err = document.getElementById('err');
        err.textContent = data.message || 'Incorrect password';
        err.style.display = 'block';
      }
    };
  </script>
</body>
</html>`);
          }

          // 4. Splash Page Interstitial (Monetization & Custom Message)
          if (metadata.splash?.enabled && req.query.skip_splash !== '1') {
            const countdown = Math.max(Number(metadata.splash.countdown) || 5, 2);
            const title = metadata.splash.title || 'Sponsored Destination';
            const customMessage = metadata.splash.message || 'You will be redirected to your destination shortly.';
            const bannerUrl = metadata.splash.banner_url || '';
            const buttonText = metadata.splash.button_text || 'Proceed to Destination';

            return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - URLZ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 28px; padding: 2rem; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #1e293b; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; color: #818cf8; margin-bottom: 1.25rem; }
    .timer { font-family: monospace; font-size: 0.85rem; background: #312e81; color: #c7d2fe; padding: 0.2rem 0.6rem; border-radius: 9999px; }
    h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }
    .banner { width: 100%; max-height: 200px; object-fit: cover; border-radius: 16px; margin-bottom: 1.25rem; border: 1px solid #334155; }
    .msg-box { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; }
    p { font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; }
    .target-preview { font-size: 0.75rem; color: #64748b; font-family: monospace; word-break: break-all; margin-top: 0.5rem; }
    .btn { display: inline-block; width: 100%; padding: 0.85rem; border-radius: 14px; border: none; background: #4f46e5; color: #fff; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: background 0.2s, opacity 0.2s; text-decoration: none; }
    .btn.disabled { opacity: 0.5; pointer-events: none; background: #334155; }
    .btn:hover:not(.disabled) { background: #4338ca; }
    .footer { margin-top: 1.25rem; font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #1e293b; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span>✨ ${title}</span>
      <span id="countdown" class="timer">${countdown}s</span>
    </div>
    ${bannerUrl ? `<img src="${bannerUrl}" alt="Banner" class="banner" />` : ''}
    <div class="msg-box">
      <p>${customMessage}</p>
      <div class="target-preview">Target: ${link.destination_url}</div>
    </div>
    <a id="proceedBtn" href="${link.destination_url}" class="btn disabled">Please wait ${countdown}s...</a>
    <div class="footer">
      <span>🔒 URLZ Interstitial</span>
      <a href="/report-abuse?url=${encodeURIComponent(link.destination_url)}">Report Abuse</a>
    </div>
  </div>
  <script>
    let remaining = ${countdown};
    const cd = document.getElementById('countdown');
    const btn = document.getElementById('proceedBtn');
    const interval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        cd.textContent = remaining + 's';
        btn.textContent = 'Please wait ' + remaining + 's...';
      } else {
        clearInterval(interval);
        cd.textContent = 'Ready';
        btn.textContent = '${buttonText} \\u2192';
        btn.classList.remove('disabled');
      }
    }, 1000);
  </script>
</body>
</html>`);
          }

          if (link.is_cloaked || metadata.is_cloaked) {
            return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${link.title || 'URLZ'}</title>
  <style>body,html{margin:0;padding:0;height:100%;overflow:hidden;}iframe{border:none;width:100%;height:100%;}</style>
</head>
<body>
  <iframe src="${link.destination_url}"></iframe>
</body>
</html>`);
          }

          // Let Hono redirect handler execute the redirection & click analytics
          return honoListener(req, res);
        }
      } catch (e) {
        console.error('Slug lookup error:', e);
      }
    }

    // 3. Fall through to Vite SPA / Frontend
    next();
  });

  // Vite Integration in Development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(resolve('dist')));
    app.use((_req, res) => {
      res.sendFile(resolve('dist/index.html'));
    });
  }

  app.listen(port, hostname, () => {
    console.log(`\n======================================================`);
    console.log(`🔗 URLZ Link Management Engine is running!`);
    console.log(`📍 Web URL:     http://${hostname}:${port}`);
    console.log(`📍 Dashboard:   http://${hostname}:${port}/dashboard`);
    console.log(`📍 Setup:       http://${hostname}:${port}/dashboard/setup`);
    console.log(`🔑 SETUP_TOKEN: ${setupToken}`);
    console.log(`👤 Admin User:  ${firstUserUsername} (Password: ${firstUserPassword})`);
    console.log(`======================================================\n`);
  });

  if (envPort !== port) {
    app.listen(envPort, hostname, () => {
      console.log(`📍 Also listening on secondary port: http://${hostname}:${envPort}`);
    });
  }
}


startServer().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
