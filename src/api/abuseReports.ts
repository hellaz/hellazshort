/**
 * Abuse Reports & Public Contact Inquiries API endpoints
 * Handles public abuse/phishing reporting, general support, sales & API inquiries, and dashboard review.
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const abuseReportsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Ensure table exists & alter columns if needed
async function ensureAbuseReportsTable(env: Env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS abuse_reports (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT 'abuse',
      name TEXT,
      url TEXT,
      reason TEXT NOT NULL,
      email TEXT,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    )
  `).run().catch(() => {});

  // Add missing columns if upgrading existing table schema
  await env.DB.prepare(`ALTER TABLE abuse_reports ADD COLUMN category TEXT DEFAULT 'abuse'`).run().catch(() => {});
  await env.DB.prepare(`ALTER TABLE abuse_reports ADD COLUMN name TEXT`).run().catch(() => {});
}

// Public: Submit an inquiry or abuse report
abuseReportsRouter.post('/', async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const body = await c.req.json().catch(() => ({}));
    const { url, reason, subject, email, name, details, message, category } = body as {
      url?: string;
      reason?: string;
      subject?: string;
      email?: string;
      name?: string;
      details?: string;
      message?: string;
      category?: string;
    };

    const inquiryCategory = (category || 'support').trim().toLowerCase();
    const finalReason = (subject || reason || 'General Inquiry').trim();
    const finalDetails = (message || details || '').trim();
    const finalName = (name || '').trim();
    const finalEmail = (email || '').trim();
    const finalUrl = (url || '').trim();

    if (!finalReason && !finalDetails) {
      return c.json({ success: false, message: 'Subject / reason and message details are required.' }, 400);
    }

    const id = 'inq_' + Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();

    await c.env.DB.prepare(
      'INSERT INTO abuse_reports (id, category, name, url, reason, email, details, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?)'
    ).bind(id, inquiryCategory, finalName, finalUrl, finalReason, finalEmail, finalDetails, createdAt).run();

    return c.json({
      success: true,
      message: 'Thank you! Your inquiry has been submitted and recorded in the URLZ support system.',
      data: { id },
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to submit inquiry' }, 500);
  }
});

// Authenticated: List abuse reports and contact inquiries for the admin dashboard
abuseReportsRouter.get('/', authMiddleware, async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const result = await c.env.DB.prepare('SELECT * FROM abuse_reports ORDER BY created_at DESC LIMIT 500').all<any>();
    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to fetch inquiries' }, 500);
  }
});

// Authenticated: Resolve or take action on an inquiry / report
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
      message: `Inquiry marked as ${newStatus}`,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to resolve inquiry' }, 500);
  }
});

// Authenticated: Delete an inquiry / report
abuseReportsRouter.delete('/:id', authMiddleware, async (c) => {
  try {
    await ensureAbuseReportsTable(c.env);
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM abuse_reports WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Inquiry deleted' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Failed to delete inquiry' }, 500);
  }
});
