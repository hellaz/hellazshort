/**
 * Abuse Reports API endpoints
 * Handles public abuse/phishing/malware reporting and dashboard review
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const abuseReportsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Ensure table exists helper (for D1 before migration or local dev)
async function ensureAbuseReportsTable(env: Env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS abuse_reports (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      reason TEXT NOT NULL,
      email TEXT,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    )
  `).run().catch(() => {});
}

// Public: Submit an abuse report
abuseReportsRouter.post('/', async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const body = await c.req.json().catch(() => ({}));
    const { url, reason, email, details } = body as {
      url?: string;
      reason?: string;
      email?: string;
      details?: string;
    };

    if (!url || !reason) {
      return c.json({ success: false, message: 'URL and reason are required' }, 400);
    }

    const id = 'abuse_' + Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();

    await c.env.DB.prepare(
      'INSERT INTO abuse_reports (id, url, reason, email, details, status, created_at) VALUES (?, ?, ?, ?, ?, "pending", ?)'
    ).bind(id, url.trim(), reason.trim(), (email || '').trim(), (details || '').trim(), createdAt).run();

    return c.json({
      success: true,
      message: 'Abuse report submitted. Thank you for protecting URLZ visitors.',
      data: { id },
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to submit abuse report' }, 500);
  }
});

// Authenticated: List abuse reports for the dashboard
abuseReportsRouter.get('/', authMiddleware, async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const result = await c.env.DB.prepare('SELECT * FROM abuse_reports ORDER BY created_at DESC LIMIT 500').all<any>();
    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to fetch abuse reports' }, 500);
  }
});

// Authenticated: Resolve or take action on an abuse report
abuseReportsRouter.post('/:id/resolve', authMiddleware, async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const { action } = body as { action?: 'disable' | 'resolve' | 'dismiss' };

    if (action === 'disable') {
      const report = await c.env.DB.prepare('SELECT url FROM abuse_reports WHERE id = ?').bind(id).first<any>();
      if (report?.url) {
        // Extract slug from URL if possible
        const slug = report.url.replace(/^https?:\/\/[^/]+\//, '').replace(/^\//, '');
        if (slug) {
          await c.env.DB.prepare("UPDATE links SET status = 'deleted' WHERE slug = ?").bind(slug).run();
        }
      }
    }

    const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved';
    await c.env.DB.prepare('UPDATE abuse_reports SET status = ? WHERE id = ?').bind(newStatus, id).run();

    return c.json({
      success: true,
      message: `Report marked as ${newStatus}`,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to resolve report' }, 500);
  }
});

// Authenticated: Delete an abuse report
abuseReportsRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM abuse_reports WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Report deleted' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to delete report' }, 500);
  }
});
