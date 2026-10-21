/**
 * Copyright (c) 2025 OpenShort.link Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

// Validation utilities

import { z } from 'zod';

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidSlug(slug: string): boolean {
  // Alphanumeric, underscore, hyphen, and optional slash separator for multi-segment slugs (2-100 characters)
  return /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 100;
}

// Reserved slugs that cannot be used for short links
const RESERVED_SLUGS = new Set([
  'api',
  'dashboard',
  'login',
  'setup',
  'assets',
  'health',
  'admin',
  'static',
  'auth',
  'logout',
  'register',
  'verify',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]);

export function isReservedSlug(slug: string): boolean {
  const rootSegment = slug.split('/')[0].toLowerCase();
  return RESERVED_SLUGS.has(rootSegment);
}

export function sanitizeSlug(slug: string): string {
  // Remove invalid characters, normalize slashes for multi-segment slugs
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9_\-\/]/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/^-+|-+$/g, '');
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // 1. Scheme and Host normalization (handled by URL constructor: lowercases them)
    // 2. Port stripping (handled by URL constructor: .port is empty if standard)

    // 3. Decode unreserved percent-encoded characters (A-Za-z0-9, -, _, ., ~)
    // per RFC 3986 section 2.3
    const decodeUnreserved = (str: string) => {
      return str.replace(/%([0-9A-F]{2})/gi, (match, hex) => {
        const code = parseInt(hex, 16);
        if (
          (code >= 65 && code <= 90) || // A-Z
          (code >= 97 && code <= 122) || // a-z
          (code >= 48 && code <= 57) || // 0-9
          code === 45 || // -
          code === 46 || // .
          code === 95 || // _
          code === 126   // ~
        ) {
          return String.fromCharCode(code);
        }
        return match.toUpperCase(); // Normalize percent-encodings to uppercase
      });
    };

    parsed.pathname = decodeUnreserved(parsed.pathname);

    // 4. Path normalization: remove trailing slash (if not root)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // 5. Tracking Parameter Stripping (Optional deduplication)
    // Strip common marketing UTM tags and click IDs to prevent duplicate short records
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ttclid', 'li_fat_id', 'twclid', 'yclid', '_ga', '_gl'
    ];
    trackingParams.forEach(param => {
      parsed.searchParams.delete(param);
    });

    // 6. Search normalization: decode unreserved characters and normalize hex to uppercase
    const search = decodeUnreserved(parsed.search);

    // Reconstruct URL
    // We don't use parsed.toString() because we want our custom decoded pathname/search
    const protocol = parsed.protocol; // includes colon
    const host = parsed.host; // includes port if non-standard
    const hash = parsed.hash;

    return `${protocol}//${host}${parsed.pathname}${search}${hash}`;
  } catch {
    return url;
  }
}

export function sanitizeHtml(input: unknown): string {
  try {
    // Handle edge cases: null, undefined, non-string types
    if (input === null || input === undefined) {
      return '';
    }
    
    const str = typeof input === 'string' ? input : String(input);
    
    // Proper HTML entity encoding to prevent XSS
    // Encode all HTML special characters
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } catch (error) {
    // If anything goes wrong, return empty string and log error
    console.error('[sanitizeHtml] Error sanitizing input:', error);
    return '';
  }
}

export function sanitizeSearchInput(search: string): string {
  // Detect SQL injection patterns
  const sqlInjectionPatterns = [
    /('|(\-\-)|(;)|(\|\|)|(\*))/, // SQL special characters
    /(\bOR\b.*=.*)/i, // OR with equals
    /(\bAND\b.*=.*)/i, // AND with equals
    /(UNION.*SELECT)/i, // UNION SELECT
    /(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE)\s+(TABLE|DATABASE)/i, // DDL/DML
    /\/\*.*\*\//,  // SQL comments
  ];

  // Check for SQL injection patterns
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(search)) {
      throw new Error('Invalid search input: potentially malicious pattern detected');
    }
  }

  // Return sanitized search (trim and limit length)
  return search.trim().substring(0, 200);
}

export function validateNumericBoundary(value: number, min: number, max: number, fieldName: string): number {
  if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new Error(`${fieldName} must be a safe integer`);
  }
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return value;
}
