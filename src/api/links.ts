/**
 * Copyright (c) 2025 OpenShort.link Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

// Links API endpoints

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Env, User, ApiKeyContext, Link } from '../types';
import {
  getLinkById,
  getLinkByIdIncludingDeleted,
  createLink,
  updateLink,
  deleteLink,
  listLinks,
  countLinks,
  checkSlugExists,
  listLinksWithTagFilter,
  SlugConflictError,
} from '../db/links';
import { getLinkTags, setLinkTags, getLinksTagsBatch } from '../db/tags';
import { getCategoryById, getLinksCategoriesBatch } from '../db/categories';
import { getDomainById, getDomainByName } from '../db/domains';
import {
  getGeoRedirects,
  getDeviceRedirects,
  getCityRedirects,
  getOsRedirects,
  upsertGeoRedirect,
  upsertDeviceRedirect,
  upsertCityRedirect,
  upsertOsRedirect,
  clearAllGeoRedirects,
  clearAllDeviceRedirects,
  clearAllCityRedirects,
  clearAllOsRedirects,
  getLinksGeoRedirectsBatch,
  getLinksDeviceRedirectsBatch,
  getLinksCityRedirectsBatch,
  getLinksOsRedirectsBatch,
  saveLinkRedirects,
  type RedirectData,
} from '../db/linkRedirects';
import { getOgMeta, upsertOgMeta } from '../db/linkOgMeta';
import { getLinkPixels } from '../db/linkPixels';
import { fetchOgTags, isPubliclyFetchableUrl } from '../utils/ogScraper';
import { buildCachedLink, saveLinkExtras } from '../services/linkService';
import { resolveLinkPixelIds, PixelError } from '../services/pixelLibrary';
import { parseBulkRequest, runBulk } from '../services/bulkLinks';
import { generateId, generateSlug } from '../utils/id';
import { isValidUrl, isValidSlug, normalizeUrl, sanitizeHtml, sanitizeSearchInput, validateNumericBoundary, isReservedSlug } from '../utils/validation';
import { validateUrlSecurity } from '../utils/urlFilter';
import { verifyCaptchaResponse } from '../utils/captcha';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { detectCountryCode, getCountryName } from '../utils/countryMappings';
import { authMiddleware, authOrApiKeyMiddleware, optionalAuth, apiKeyMiddleware } from '../middleware/auth';
import { validateJson } from '../middleware/validate';
import { deleteCachedLink, setCachedLink } from '../services/cache';
import { requireLinkAccess, requirePermission } from '../middleware/authorization';
import { canAccessDomain, hasPermission } from '../utils/permissions';
import { isInfiniteRedirect } from '../utils/domains';
import { getEffectiveLinkRoute } from '../utils/route';
import { createLinkSchema, updateLinkSchema, ogFetchSchema } from '../schemas';

const linksRouter = new Hono<{ Bindings: Env }>();

/** Translate pixel-library rule violations into HTTP errors. */
function rethrowPixelError(error: unknown): never {
  if (error instanceof PixelError) throw new HTTPException(error.status as 400, { message: error.message });
  throw error;
}

// Schemas imported from ../schemas

/**
 * Derive the accessible-domain constraint for the status-monitor read endpoints
 * (which are session-only via authMiddleware), mirroring GET /links.
 *
 * Returns:
 *  - `undefined` for global-access users → no domain constraint (see all).
 *  - a (possibly empty) array of domain IDs otherwise → constrain queries to these.
 *
 * If the caller supplies an explicit `domain_id` they cannot access, throws 403.
 */
async function resolveAccessibleDomainConstraint(
  c: any,
  explicitDomainId?: string
): Promise<string[] | undefined> {
  const user = c.get?.('user') as User | undefined;

  // authMiddleware guarantees a user; if somehow absent, deny by default.
  if (!user) {
    return [];
  }

  const hasGlobalAccess = user.global_access || user.role === 'admin' || user.role === 'owner';

  // Reject an explicit domain_id the user cannot access.
  if (explicitDomainId && !hasGlobalAccess) {
    const ok = await canAccessDomain(c.env, user, explicitDomainId);
    if (!ok) {
      throw new HTTPException(403, { message: 'Access denied. You do not have access to this domain.' });
    }
  }

  if (hasGlobalAccess) {
    return undefined;
  }

  return ((user as any).accessible_domain_ids as string[] | undefined) ?? [];
}

// Public: Unlock a password-protected link
linksRouter.post('/unlock/:slug', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  try {
    const link = await c.env.DB.prepare('SELECT * FROM links WHERE slug = ?').bind(slug).first<any>();
    if (!link) {
      return c.json({ success: false, message: 'Link not found' }, 404);
    }

    const linkPass = link.password_hash || link.password;
    if (!linkPass) {
      return c.json({ success: true, destination_url: link.destination_url });
    }

    let matches = password === linkPass;
    if (!matches) {
      matches = await verifyPassword(password || '', linkPass).catch(() => false);
    }

    if (!matches) {
      return c.json({ success: false, message: 'Incorrect password' }, 401);
    }

    c.header('Set-Cookie', `unlocked_${link.id}=1; Path=/; Max-Age=3600; SameSite=Lax`);
    return c.json({ success: true, destination_url: link.destination_url });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// List links
linksRouter.get('/', authOrApiKeyMiddleware, async (c) => {
  const domainId = c.req.query('domain_id');
  const status = c.req.query('status');
  let search = c.req.query('search');
  const tagId = c.req.query('tag_id');
  const categoryId = c.req.query('category_id');
  const limitParam = c.req.query('limit');
  const offsetParam = c.req.query('offset');
  const includeRedirects = c.req.query('include_redirects') === 'true';

  // Validate search input to prevent SQL injection
  if (search) {
    try {
      search = sanitizeSearchInput(search);
    } catch (error) {
      throw new HTTPException(400, {
        message: error instanceof Error ? error.message : 'Invalid search input'
      });
    }
  }

  // Get user (if authenticated via session)
  const user = (c as any).get?.('user') as User | undefined;

  // Check API key domain scoping
  const apiKey = (c as any).get?.('apiKey') as ApiKeyContext | undefined;
  if (apiKey && apiKey.domain_ids && apiKey.domain_ids.length > 0) {
    // If domain_id is provided, verify it's allowed
    if (domainId && !apiKey.domain_ids.includes(domainId)) {
      throw new HTTPException(403, { message: 'Domain not on scope' });
    }
  }

  // Check domain access for authenticated users (not API keys)
  if (user && domainId) {
    const hasAccess = await canAccessDomain(c.env, user, domainId);
    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied. You do not have access to this domain.' });
    }
  }

  // Validate and set limit (default 25, max 10000)
  let limit = 25;
  if (limitParam) {
    try {
      // Handle very large numbers that might cause issues
      if (limitParam.length > 10) {
        throw new Error('limit value is too large');
      }
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || !isFinite(parsedLimit)) {
        throw new Error('limit must be a valid number');
      }
      if (!Number.isSafeInteger(parsedLimit)) {
        throw new Error('limit must be a safe integer (between -2^53 and 2^53)');
      }
      // Reject values outside valid range
      if (parsedLimit < 1) {
        throw new Error('limit must be at least 1');
      }
      if (parsedLimit > 10000) {
        throw new Error('limit cannot exceed 10000');
      }
      limit = parsedLimit;
    } catch (error) {
      throw new HTTPException(400, {
        message: error instanceof Error ? error.message : 'Invalid limit value'
      });
    }
  }

  let offset = 0;
  if (offsetParam) {
    try {
      // Handle very large numbers that might cause issues
      if (offsetParam.length > 10) {
        throw new Error('offset value is too large');
      }
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || !isFinite(parsedOffset)) {
        throw new Error('offset must be a valid number');
      }
      if (!Number.isSafeInteger(parsedOffset)) {
        throw new Error('offset must be a safe integer (between -2^53 and 2^53)');
      }
      offset = Math.max(parsedOffset, 0);
    } catch (error) {
      throw new HTTPException(400, {
        message: error instanceof Error ? error.message : 'Invalid offset value'
      });
    }
  }

  // Determine accessible domain IDs for database-level filtering
  let accessibleDomainIds: string[] | undefined = undefined;
  const hasGlobalAccess = user?.global_access || user?.role === 'admin' || user?.role === 'owner';

  if (!hasGlobalAccess && user) {
    // Use cached domain IDs from context (already fetched in authMiddleware)
    accessibleDomainIds = (user as any).accessible_domain_ids;
  } else if (apiKey && apiKey.domain_ids && apiKey.domain_ids.length > 0) {
    // Use API key domain restrictions
    accessibleDomainIds = apiKey.domain_ids;
  }

  // If tag or category filtering is needed, use optimized JOIN queries
  let links: any[];
  let totalCount: number;

  try {
    if (tagId) {
      // Use JOIN-based tag filtering (database-level, optimized)
      const result = await listLinksWithTagFilter(c.env, {
        domainIds: accessibleDomainIds,
        domainId: domainId || undefined,
        status: status || undefined,
        search: search || undefined,
        categoryId: categoryId || undefined,
        tagId,
        limit,
        offset,
      });
      links = result.links;
      totalCount = result.totalCount;
    } else {
      // Non-admin users only see links they personally created
      const isPrivileged = user?.role === 'admin' || user?.role === 'owner';
      const createdByFilter = (!isPrivileged && user?.id) ? user.id : undefined;

      // Optimized path: use database pagination with domain filtering
      links = await listLinks(c.env, {
        domainIds: accessibleDomainIds, // Database-level filtering
        domainId: domainId || undefined, // Single domain if specified
        status: status || undefined,
        search: search || undefined,
        categoryId: categoryId || undefined,
        createdBy: createdByFilter,
        limit,
        offset,
      });

      // Get total count for pagination
      totalCount = await countLinks(c.env, {
        domainIds: accessibleDomainIds,
        domainId: domainId || undefined,
        status: status || undefined,
        search: search || undefined,
        categoryId: categoryId || undefined,
        createdBy: createdByFilter,
      });
    }

    // Batch fetch tags and categories (optimized - no N+1 queries)
    const linkIds = links.map(l => l?.id).filter((id): id is string => !!id);

    // Prepare promises for parallel execution
    const promises: Promise<any>[] = [
      getLinksTagsBatch(c.env, linkIds),
      getLinksCategoriesBatch(c.env, links),
    ];

    // Add redirect fetches if requested
    if (includeRedirects && linkIds.length > 0) {
      promises.push(getLinksGeoRedirectsBatch(c.env, linkIds));
      promises.push(getLinksDeviceRedirectsBatch(c.env, linkIds));
      promises.push(getLinksCityRedirectsBatch(c.env, linkIds));
      promises.push(getLinksOsRedirectsBatch(c.env, linkIds));
    }

    const results = await Promise.all(promises);
    const tagsMap = results[0];
    const categoriesMap = results[1];

    // Extract maps if they exist (based on whether we requested them)
    const geoRedirectsMap = includeRedirects ? results[2] : new Map();
    const deviceRedirectsMap = includeRedirects ? results[3] : new Map();
    const cityRedirectsMap = includeRedirects ? results[4] : new Map();
    const osRedirectsMap = includeRedirects ? results[5] : new Map();

    // Map results
    const linksWithTags = links.map(link => ({
      ...link,
      tags: tagsMap.get(link.id) || [],
      category: categoriesMap.get(link.id),
      geo_redirects: geoRedirectsMap.get(link.id) || [],
      device_redirects: deviceRedirectsMap.get(link.id) || [],
      city_redirects: cityRedirectsMap.get(link.id) || [],
      os_redirects: osRedirectsMap.get(link.id) || [],
    }));

    return c.json({
      success: true,
      data: linksWithTags,
      pagination: {
        limit,
        offset,
        count: linksWithTags.length,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('[GET /links] Error:', error);
    // Check if it's a validation or input error that should return 400
    if (error instanceof HTTPException) {
      throw error;
    }
    // Check for timeout or database errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch links';
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      throw new HTTPException(408, {
        message: 'Request timeout - query took too long to execute'
      });
    }
    throw new HTTPException(500, {
      message: errorMessage
    });
  }
});

// Get links grouped by destination URL (for status monitor)
// IMPORTANT: This must come BEFORE /:id route to avoid route conflicts
linksRouter.get('/grouped-by-destination', authMiddleware, async (c) => {
  try {
    const domainId = c.req.query('domain_id');
    const statusCodeParam = c.req.query('status_code');
    const search = c.req.query('search');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    let limit = 25;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new HTTPException(400, { message: 'limit must be a positive number' });
      }
      if (parsedLimit > 10000) {
        throw new HTTPException(400, { message: 'limit cannot exceed 10000' });
      }
      limit = parsedLimit;
    }
    const offset = offsetParam ? Math.max(parseInt(offsetParam) || 0, 0) : 0;
    const statusCode = statusCodeParam ? parseInt(statusCodeParam) : undefined;

    // Constrain to the caller's accessible domains (reject inaccessible explicit domain_id).
    const accessibleDomainIds = await resolveAccessibleDomainConstraint(c, domainId || undefined);

    const { getLinksGroupedByDestination } = await import('../db/links');
    const { destinations, total } = await getLinksGroupedByDestination(c.env, {
      domainIds: accessibleDomainIds,
      domainId: domainId || undefined,
      statusCode,
      search: search || undefined,
      limit,
      offset,
    });

    return c.json({
      success: true,
      data: destinations || [],
      pagination: {
        limit,
        offset,
        count: destinations?.length || 0,
        total: total || 0,
        has_more: offset + limit < (total || 0),
      },
    });
  } catch (error: any) {
    // Preserve intended client errors (e.g. 403 for an inaccessible domain_id).
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error in grouped-by-destination endpoint:', error);
    throw new HTTPException(500, {
      message: error.message || 'Failed to fetch grouped destinations'
    });
  }
});

// Get links by destination URL
linksRouter.get('/by-destination', authMiddleware, async (c) => {
  const destinationUrl = c.req.query('destination_url');
  const limitParam = c.req.query('limit');
  const offsetParam = c.req.query('offset');

  if (!destinationUrl) {
    throw new HTTPException(400, { message: 'destination_url query parameter is required' });
  }

  // Normalize the URL to match how it's stored in the database
  const normalizedUrl = normalizeUrl(destinationUrl);

  let limit = 25;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      throw new HTTPException(400, { message: 'limit must be a positive number' });
    }
    if (parsedLimit > 10000) {
      throw new HTTPException(400, { message: 'limit cannot exceed 10000' });
    }
    limit = parsedLimit;
  }
  const offset = offsetParam ? Math.max(parseInt(offsetParam) || 0, 0) : 0;

  // Constrain to the caller's accessible domains (tenant isolation).
  const accessibleDomainIds = await resolveAccessibleDomainConstraint(c);

  const { getLinksByDestinationUrl } = await import('../db/links');
  const links = await getLinksByDestinationUrl(c.env, normalizedUrl, {
    domainIds: accessibleDomainIds,
    limit,
    offset,
  });

  return c.json({
    success: true,
    data: links,
    pagination: {
      limit,
      offset,
      count: links.length,
      total: links.length, // Could add count query if needed
    },
  });
});

// Get link by ID
linksRouter.get('/:id', authOrApiKeyMiddleware, async (c) => {
  const id = c.req.param('id');
  const link = await getLinkById(c.env, id);

  if (!link) {
    throw new HTTPException(404, { message: 'Link not found' });
  }

  // Check domain access for authenticated users (not API keys)
  const user = (c as any).get?.('user') as User | undefined;
  const apiKey = (c as any).get?.('apiKey') as ApiKeyContext | undefined;
  if (user && !apiKey) {
    const hasAccess = await canAccessDomain(c.env, user, link.domain_id);
    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied. You do not have access to this domain.' });
    }
  }

  // Check API key domain scoping
  if (apiKey && apiKey.domain_ids && apiKey.domain_ids.length > 0) {
    if (!apiKey.domain_ids.includes(link.domain_id)) {
      throw new HTTPException(403, { message: 'Domain not on scope' });
    }
  }

  // Get tags and category
  const tags = await getLinkTags(c.env, id);
  const linkWithTags = { ...link, tags };

  // Get category if category_id is set
  if (link.category_id) {
    const category = await getCategoryById(c.env, link.category_id);
    if (category) {
      (linkWithTags as any).category = category;
    }
  }

  // Get geo and device redirects in parallel
  const [geoRedirects, deviceRedirects, cityRedirects, osRedirects, ogMeta, pixels] = await Promise.all([
    getGeoRedirects(c.env, id),
    getDeviceRedirects(c.env, id),
    getCityRedirects(c.env, id),
    getOsRedirects(c.env, id),
    getOgMeta(c.env, id),
    getLinkPixels(c.env, id)
  ]);

  return c.json({
    success: true,
    data: {
      ...linkWithTags,
      geo_redirects: geoRedirects,
      device_redirects: deviceRedirects,
      city_redirects: cityRedirects,
      os_redirects: osRedirects,
      og_meta: ogMeta,
      pixels,
    },
  });
});

// Fetch Open Graph tags from a destination URL (for the "Fetch from URL" button).
// Scrapes the URL the user entered and returns its OG/Twitter meta so the dashboard
// can pre-fill the social preview fields. Auth-gated; SSRF-guarded.
linksRouter.post('/og-fetch', authMiddleware, validateJson(ogFetchSchema), async (c) => {
  const { url } = c.req.valid('json');

  if (!isPubliclyFetchableUrl(url)) {
    throw new HTTPException(400, { message: 'URL is not publicly fetchable' });
  }

  try {
    const og = await fetchOgTags(url);
    return c.json({ success: true, data: og });
  } catch (error) {
    throw new HTTPException(400, {
      message: error instanceof Error ? error.message : 'Failed to fetch Open Graph tags',
    });
  }
});

// Create link
linksRouter.post('/', optionalAuth, validateJson(createLinkSchema), async (c) => {
  // If no session user was resolved by optionalAuth, check if an API key Bearer header was provided
  if (!(c as any).get?.('user') && c.req.header('Authorization')?.startsWith('Bearer sk_')) {
    await apiKeyMiddleware(c as any, async () => {});
  }

  const validated = c.req.valid('json');

  // Auto-resolve domain_id if omitted (guest/public requests)
  let effectiveDomainId = validated.domain_id;
  if (!effectiveDomainId) {
    const reqHost = (c.req.header('host') || 'urlz.eu.org').split(':')[0].toLowerCase();
    const domMatch = await getDomainByName(c.env, reqHost);
    if (domMatch && domMatch.status === 'active') {
      effectiveDomainId = domMatch.id;
    } else {
      const { listDomains } = await import('../db/domains');
      const allDomains = await listDomains(c.env);
      const activePrimary = allDomains.find((d) => d.status === 'active' && d.domain_name !== 'localhost') || allDomains[0];
      effectiveDomainId = activePrimary?.id;
    }
  }

  if (!effectiveDomainId) {
    throw new HTTPException(400, { message: 'No valid active domain available for short link creation.' });
  }

  const user = (c as any).get?.('user') as User | undefined;
  const apiKey = (c as any).get?.('apiKey') as ApiKeyContext | undefined;

  if (user && !hasPermission(user, 'create_links')) {
    throw new HTTPException(403, { message: 'Access denied. Required permission: create_links' });
  }
  if (user && !apiKey && validated.domain_id) {
    const hasAccess = await canAccessDomain(c.env, user, effectiveDomainId);
    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied. You do not have access to this domain.' });
    }
  }

  if (!isValidUrl(validated.destination_url)) {
    throw new HTTPException(400, { message: 'Invalid destination URL' });
  }

  const securityCheck = validateUrlSecurity(validated.destination_url);
  if (!securityCheck.safe) {
    throw new HTTPException(400, { message: securityCheck.reason || 'Destination URL failed security checks.' });
  }

  if (!user && !apiKey) {
    const captchaRes = await verifyCaptchaResponse(c.env, validated.captcha_token, validated.captcha_answer, validated.captcha_solution);
    if (!captchaRes.valid) {
      throw new HTTPException(400, { message: captchaRes.message || 'Captcha verification failed.' });
    }
  }

  // Quota check
  if (user && user.role !== 'owner' && user.role !== 'admin') {
    const userLinksCountRow = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM links WHERE created_by = ? AND status != 'deleted'`).bind(user.id).first<{ count: number }>();
    const bonusRow = await c.env.DB.prepare(`SELECT SUM(bonus_links_granted) as total_bonus FROM referrals WHERE referrer_user_id = ?`).bind(user.id).first<{ total_bonus: number }>();
    const maxAllowed = 10 + (Number(bonusRow?.total_bonus) || 0);
    if ((userLinksCountRow?.count || 0) >= maxAllowed) {
      throw new HTTPException(403, { message: `Free link limit reached (${userLinksCountRow?.count}/${maxAllowed}).` });
    }
  }

  if (await isInfiniteRedirect(c.env, validated.destination_url)) {
    throw new HTTPException(400, { message: 'Infinite redirect loop detected.' });
  }

  const domain = await getDomainById(c.env, effectiveDomainId);
  if (!domain || domain.status !== 'active') {
    throw new HTTPException(400, { message: 'Inactive or non-existent domain.' });
  }

  const effectiveRoute = getEffectiveLinkRoute(domain, validated.route);

  let slug = validated.slug;
  if (!slug) {
    slug = generateSlug(8);
    let attempts = 0;
    while (await checkSlugExists(c.env, effectiveDomainId, slug) && attempts < 10) {
      slug = generateSlug(8);
      attempts++;
    }
  } else {
    if (!isValidSlug(slug) || isReservedSlug(slug)) {
      throw new HTTPException(400, { message: 'Invalid or reserved slug.' });
    }
    if (await checkSlugExists(c.env, effectiveDomainId, slug)) {
      throw new HTTPException(409, { message: 'Slug already exists.' });
    }
  }

  const title = validated.title ? sanitizeHtml(validated.title) : undefined;
  const description = validated.description ? sanitizeHtml(validated.description) : undefined;
  const destinationUrl = normalizeUrl(validated.destination_url);

  if (validated.category_id) {
    const category = await getCategoryById(c.env, validated.category_id);
    if (!category) throw new HTTPException(404, { message: 'Category not found.' });
  }

  const metadataObj = validated.metadata ? { ...validated.metadata } : {};
  if (effectiveRoute) metadataObj.route = effectiveRoute;
  if (validated.deep_link) metadataObj.deep_link = validated.deep_link;
  if (validated.fallback_url) metadataObj.fallback_url = validated.fallback_url;
  if (validated.redirect_type) metadataObj.redirect_type = validated.redirect_type;
  if (validated.overlay) metadataObj.overlay = validated.overlay;
  if (validated.media_embed) metadataObj.media_embed = validated.media_embed;

  // Default Splash behavior for all shortened links unless disabled on purpose
  if (!metadataObj.splash && validated.redirect_type !== 'direct') {
    metadataObj.splash = {
      enabled: true,
      countdown: 5,
      title: 'Sponsored Destination',
      message: 'You will be redirected to your destination shortly.',
      button_text: 'Proceed to Destination'
    };
  }

  const metadata = JSON.stringify(metadataObj);
  const pixelIds = await resolveLinkPixelIds(c.env, effectiveDomainId, validated.pixel_ids, { applyDefaults: true }).catch(rethrowPixelError);

  let link: Link;
  try {
    const passwordHash = validated.password ? await hashPassword(validated.password) : null;
    link = await createLink(c.env, {
      domain_id: effectiveDomainId,
      slug,
      destination_url: destinationUrl,
      title,
      description,
      redirect_code: validated.redirect_code,
      status: 'active',
      expires_at: validated.expires_at,
      password_hash: passwordHash,
      metadata,
      category_id: validated.category_id,
      click_count: 0,
      unique_visitors: 0,
      created_by: user?.id || null,
    });
  } catch (error) {
    if (error instanceof SlugConflictError) throw new HTTPException(409, { message: 'Slug already exists.' });
    throw error;
  }

  if (validated.tags && validated.tags.length > 0) await setLinkTags(c.env, link.id, validated.tags);

  await saveLinkRedirects(c.env, link.id, {
    geo_redirects: validated.geo_redirects as any,
    device_redirects: validated.device_redirects,
    city_redirects: validated.city_redirects as any,
    os_redirects: validated.os_redirects,
  });

  if (validated.og_meta && (validated.og_meta.og_title || validated.og_meta.og_description || validated.og_meta.og_image)) {
    await upsertOgMeta(c.env, link.id, validated.og_meta);
  }

  if (pixelIds && pixelIds.length > 0) await saveLinkExtras(c.env, link.id, { pixel_ids: pixelIds });

  const cachedLink = await buildCachedLink(c.env, link, domain);
  await setCachedLink(c.env, domain.domain_name, link.slug, cachedLink);

  const [geoRedirects, deviceRedirects, cityRedirects, osRedirects, ogMeta, pixels] = await Promise.all([
    getGeoRedirects(c.env, link.id),
    getDeviceRedirects(c.env, link.id),
    getCityRedirects(c.env, link.id),
    getOsRedirects(c.env, link.id),
    getOgMeta(c.env, link.id),
    getLinkPixels(c.env, link.id),
  ]);

  const tags = await getLinkTags(c.env, link.id);
  const linkWithTags = { ...link, tags, geo_redirects: geoRedirects, device_redirects: deviceRedirects, city_redirects: cityRedirects, os_redirects: osRedirects, og_meta: ogMeta, pixels };

  return c.json({ success: true, data: linkWithTags }, 201);
});

// Update link
linksRouter.put('/:id', authOrApiKeyMiddleware, requireLinkAccess('edit'), validateJson(updateLinkSchema), async (c) => {
  const id = c.req.param('id');
  const validated = c.req.valid('json');

  const existingLink = await getLinkByIdIncludingDeleted(c.env, id);
  if (!existingLink) throw new HTTPException(404, { message: 'Link not found' });

  const apiKey = (c as any).get?.('apiKey') as ApiKeyContext | undefined;
  if (apiKey && apiKey.domain_ids && apiKey.domain_ids.length > 0) {
    if (!apiKey.domain_ids.includes(existingLink.domain_id)) throw new HTTPException(403, { message: 'Domain not on scope' });
  }

  const updates: Parameters<typeof updateLink>[2] = {};
  if (validated.destination_url) {
    if (!isValidUrl(validated.destination_url)) throw new HTTPException(400, { message: 'Invalid destination URL' });
    updates.destination_url = normalizeUrl(validated.destination_url);
    if (await isInfiniteRedirect(c.env, updates.destination_url)) throw new HTTPException(400, { message: 'Infinite redirect loop.' });
  }
  if (validated.title !== undefined) updates.title = validated.title ? sanitizeHtml(validated.title) : undefined;
  if (validated.description !== undefined) updates.description = validated.description ? sanitizeHtml(validated.description) : undefined;
  if (validated.redirect_code !== undefined) updates.redirect_code = validated.redirect_code;
  if (validated.status !== undefined) updates.status = validated.status;
  if (validated.expires_at !== undefined) updates.expires_at = validated.expires_at;
  if (validated.category_id !== undefined) {
    if (validated.category_id) {
      const category = await getCategoryById(c.env, validated.category_id);
      if (!category) throw new HTTPException(404, { message: 'Category not found' });
    }
    updates.category_id = validated.category_id;
  }

  if (validated.route !== undefined) {
    const domain = await getDomainById(c.env, existingLink.domain_id);
    if (domain) {
      if (!domain.routes?.includes(validated.route) && validated.route !== (domain.routing_path || '/*')) throw new HTTPException(400, { message: 'Invalid route' });
      const currentMetadata = updates.metadata ? JSON.parse(updates.metadata) : (existingLink.metadata ? JSON.parse(existingLink.metadata) : {});
      updates.metadata = JSON.stringify({ ...currentMetadata, route: validated.route });
    }
  }

  if (validated.password !== undefined) updates.password_hash = validated.password ? await hashPassword(validated.password) : null;

  if (validated.metadata !== undefined) {
    const currentMetadata = updates.metadata ? JSON.parse(updates.metadata) : (existingLink.metadata ? JSON.parse(existingLink.metadata) : {});
    updates.metadata = JSON.stringify({ ...currentMetadata, ...validated.metadata });
  }

  if (validated.deep_link !== undefined) {
    const currentMetadata = updates.metadata ? JSON.parse(updates.metadata) : (existingLink.metadata ? JSON.parse(existingLink.metadata) : {});
    updates.metadata = JSON.stringify({ ...currentMetadata, deep_link: validated.deep_link });
  }

  const pixelIds = await resolveLinkPixelIds(c.env, existingLink.domain_id, validated.pixel_ids, { applyDefaults: false }).catch(rethrowPixelError);
  await updateLink(c.env, id, updates);
  if (validated.tags !== undefined) await setLinkTags(c.env, id, validated.tags);
  if (validated.geo_redirects !== undefined) { await clearAllGeoRedirects(c.env, id); await saveLinkRedirects(c.env, id, { geo_redirects: validated.geo_redirects as any }); }
  if (validated.device_redirects !== undefined) { await clearAllDeviceRedirects(c.env, id); await saveLinkRedirects(c.env, id, { device_redirects: validated.device_redirects }); }
  if (validated.city_redirects !== undefined) { await clearAllCityRedirects(c.env, id); await saveLinkRedirects(c.env, id, { city_redirects: validated.city_redirects as any }); }
  if (validated.os_redirects !== undefined) { await clearAllOsRedirects(c.env, id); await saveLinkRedirects(c.env, id, { os_redirects: validated.os_redirects }); }

  await saveLinkExtras(c.env, id, { og_meta: validated.og_meta, pixel_ids: pixelIds });

  const updatedLink = await getLinkById(c.env, id);
  if (!updatedLink) throw new HTTPException(404, { message: 'Link not found' });

  const domain = await getDomainById(c.env, existingLink.domain_id);
  if (domain) {
    if (updatedLink.status !== 'active') await deleteCachedLink(c.env, domain.domain_name, existingLink.slug);
    else await setCachedLink(c.env, domain.domain_name, existingLink.slug, await buildCachedLink(c.env, updatedLink, domain));
  }

  const fresh = await Promise.all([getGeoRedirects(c.env, id), getDeviceRedirects(c.env, id), getCityRedirects(c.env, id), getOsRedirects(c.env, id), getOgMeta(c.env, id), getLinkPixels(c.env, id)]);
  const tags = await getLinkTags(c.env, id);
  let category = updatedLink.category_id ? await getCategoryById(c.env, updatedLink.category_id) : undefined;

  return c.json({ success: true, data: { ...updatedLink, tags, category, geo_redirects: fresh[0], device_redirects: fresh[1], city_redirects: fresh[2], os_redirects: fresh[3], og_meta: fresh[4], pixels: fresh[5] } });
});

// Delete link
linksRouter.delete('/:id', authOrApiKeyMiddleware, requireLinkAccess('delete'), async (c) => {
  const id = c.req.param('id');
  const hardDelete = c.req.query('hard') === 'true';
  const existingLink = await getLinkByIdIncludingDeleted(c.env, id);
  if (!existingLink || (existingLink.status === 'deleted' && !hardDelete)) throw new HTTPException(404, { message: 'Link not found' });

  const apiKey = (c as any).get?.('apiKey') as ApiKeyContext | undefined;
  if (apiKey?.domain_ids?.length && !apiKey.domain_ids.includes(existingLink.domain_id)) throw new HTTPException(403, { message: 'Domain not on scope' });

  if (await deleteLink(c.env, id, hardDelete)) {
    const domain = await getDomainById(c.env, existingLink.domain_id);
    if (domain) await deleteCachedLink(c.env, domain.domain_name, existingLink.slug);
    return c.json({ success: true, message: 'Link deleted' });
  }
  throw new HTTPException(500, { message: 'Failed to delete link' });
});

// Bulk operations
linksRouter.post('/bulk', authOrApiKeyMiddleware, requirePermission('edit_links'), async (c) => {
  const body = await c.req.json();
  const parsed = parseBulkRequest(body);
  if (!parsed.ok) throw new HTTPException(400, { message: (parsed as any).message });
  const apiKey = (c as any).get?.('apiKey') as ApiKeyContext | undefined;
  const user = (c as any).get?.('user') as User | undefined;
  return c.json({ success: true, data: await runBulk(c.env, { user, apiKey }, parsed.request) });
});

// Status Check
linksRouter.get('/status/:statusCode', authMiddleware, async (c) => {
  const statusCode = parseInt(c.req.param('statusCode'));
  const domainId = c.req.query('domain_id');
  const accessibleDomainIds = await resolveAccessibleDomainConstraint(c, domainId || undefined);
  const { getLinksByStatusCode, getStatusSummary } = await import('../db/links');
  const { links, total } = await getLinksByStatusCode(c.env, statusCode, { domainIds: accessibleDomainIds, domainId: domainId || undefined, limit: 25 });
  const statusSummary = await getStatusSummary(c.env, domainId || undefined, accessibleDomainIds);
  return c.json({ success: true, data: links, pagination: { total, count: links.length }, status_summary: statusSummary });
});

linksRouter.post('/check-status', authMiddleware, async (c) => {
  const user = (c as any).get?.('user') as User | undefined;
  if (!user) throw new HTTPException(401, { message: 'Auth required' });
  const body = await c.req.json().catch(() => ({}));
  const { checkLinksBatch } = await import('../services/status-check');
  const { getStatusCheckFrequencyOrDefault } = await import('../db/settings');
  const settings = await getStatusCheckFrequencyOrDefault(c.env);
  const isGlobalAdmin = ['admin', 'owner'].includes(user.role) || user.global_access;
  const result = await c.env.DB.prepare(`SELECT * FROM links WHERE status != 'deleted' ${isGlobalAdmin ? '' : 'AND created_by = ?'} LIMIT ?`).bind(...(isGlobalAdmin ? [settings.batch_size || 100] : [user.id, settings.batch_size || 100])).all<Link>();
  const results = await checkLinksBatch(result.results || [], c.env, 0);
  return c.json({ success: true, data: { checked: results.length } });
});

export { linksRouter };
