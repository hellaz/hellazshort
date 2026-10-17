/**
 * Node.js Server Entry Point for OpenShort.link
 * Runs the Hono app on port 3000 (0.0.0.0) with local SQLite D1 & KV bindings.
 */

import { serve } from '@hono/node-server';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import worker from './src/index';
import type { Env } from './src/types';
import { hashPassword } from './src/utils/crypto';

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
        // Some migrations may have partial table creations already, continue safely
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

// 5. Seed default domain (urlz.eu.org as primary, localhost as fallback)
async function seedInitialData() {
  const now = Date.now();

  // Ensure urlz.eu.org exists
  const existingUrlz = await DB.prepare('SELECT id FROM domains WHERE normalized_domain_name = ?').bind('urlz.eu.org').first<{ id: string }>();
  if (!existingUrlz) {
    const oldDomain = await DB.prepare('SELECT id FROM domains WHERE normalized_domain_name = ?').bind('url.eu.org').first<{ id: string }>();
    if (oldDomain) {
      await DB.prepare("UPDATE domains SET domain_name = 'urlz.eu.org', normalized_domain_name = 'urlz.eu.org', updated_at = ? WHERE id = ?").bind(now, oldDomain.id).run();
      console.log('Renamed default domain to urlz.eu.org');
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

  // Ensure localhost is also present for local dev
  const existingLocalhost = await DB.prepare('SELECT id FROM domains WHERE normalized_domain_name = ?').bind('localhost').first<{ id: string }>();
  if (!existingLocalhost) {
    await DB.prepare(
      `INSERT INTO domains (
        id, cloudflare_account_id, domain_name, normalized_domain_name, routing_path,
        default_redirect_code, status, settings, created_at, updated_at
      ) VALUES (?, 'local-account', 'localhost', 'localhost', '/*', 301, 'active', ?, ?, ?)`
    ).bind('dom_localhost', JSON.stringify({ routes: ['/*'] }), now, now).run();
  }

  // Seed default admin user if none exists
  const userCount = await DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  if ((userCount?.count || 0) === 0 && firstUserUsername && firstUserPassword) {
    const passwordHash = await hashPassword(firstUserPassword);
    const now = Date.now();
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
}

seedInitialData().catch((err) => {
  console.error('Error during initial data seeding:', err);
});

// 6. Start Node HTTP server
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

console.log(`Starting OpenShort.link server on ${hostname}:${port}...`);

serve(
  {
    fetch: (request: Request) => {
      const executionCtx: any = {
        waitUntil(promise: Promise<unknown>) {
          promise.catch((err) => console.error('[ASYNC WORKER ERROR]', err));
        },
        passThroughOnException() {},
      };
      return worker.fetch(request, env, executionCtx);
    },
    port,
    hostname,
  },
  (info) => {
    console.log(`\n======================================================`);
    console.log(`🔗 OpenShort.link is running!`);
    console.log(`📍 Web URL:     http://0.0.0.0:${info.port}`);
    console.log(`📍 Dashboard:   http://0.0.0.0:${info.port}/dashboard`);
    console.log(`📍 Setup:       http://0.0.0.0:${info.port}/dashboard/setup`);
    console.log(`🔑 SETUP_TOKEN: ${setupToken}`);
    console.log(`👤 Admin User:  ${firstUserUsername} (Password: ${firstUserPassword})`);
    console.log(`======================================================\n`);
  }
);
