/**
 * Copyright (c) 2025 URLZ Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

// Advanced URL Filtering, TLD Blacklist, and Anti-Abuse Scanner Engine

const BLOCKED_TLDS = new Set([
  'zip',
  'mov',
  'kim',
  'su',
  'top',
  'xyz',
  'work',
  'click',
  'monster',
  'cfd',
  'buzz',
  'country',
  'gq',
  'tk',
  'ml',
  'ga',
  'cf',
  'phishing',
  'scam',
]);

const BAD_KEYWORD_PATTERNS = [
  // Phishing & Scams
  /login-verify/i,
  /account-update-required/i,
  /secure-billing-update/i,
  /passcode-reset-service/i,
  /apple-id-verify/i,
  /paypal-security-check/i,
  /metamask-verify/i,
  /binance-auth/i,
  /free-crypto-giveaway/i,
  // Malware & Executables
  /\.(exe|bat|cmd|sh|vbs|msi|scr|pif|jar|iso)$/i,
  // Pornography & Inappropriate Content
  /pornhub|xvideos|redtube|youporn|xnxx|cam4|onlyfans-leak|adult-content|nsfw-video/i,
  // Illegal Gambling / Casino Spam
  /slot-gacor|judionline|poker-jackpot-bonus|free-spins-casino/i,
];

const DEFAULT_BLOCKED_DOMAINS = new Set([
  'grabify.link',
  'iplogger.org',
  'blas2.ru',
  'bitly.com', // Prevent recursive shortener nesting abuse
  'tinyurl.com',
  't.co',
]);

export interface UrlSecurityResult {
  safe: boolean;
  reason?: string;
}

/**
 * Validates a target URL against TLD blacklists, malware patterns, adult content, and custom blocked domain lists.
 */
export function validateUrlSecurity(
  destinationUrl: string,
  customBlockedDomains?: string[]
): UrlSecurityResult {
  if (!destinationUrl || typeof destinationUrl !== 'string') {
    return { safe: false, reason: 'Invalid or missing URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(destinationUrl.startsWith('http') ? destinationUrl : `https://${destinationUrl}`);
  } catch {
    return { safe: false, reason: 'Malformed URL structure.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const fullPath = (parsed.hostname + parsed.pathname + parsed.search).toLowerCase();

  // 1. Check TLD Blacklist
  const parts = hostname.split('.');
  const tld = parts[parts.length - 1];
  if (BLOCKED_TLDS.has(tld)) {
    return {
      safe: false,
      reason: `URLs with top-level domain .${tld} are restricted for security reasons.`,
    };
  }

  // 2. Check Blocked Domain List
  if (DEFAULT_BLOCKED_DOMAINS.has(hostname)) {
    return {
      safe: false,
      reason: `The domain ${hostname} is on the security blocklist.`,
    };
  }

  if (customBlockedDomains && customBlockedDomains.length > 0) {
    const lowerCustom = customBlockedDomains.map((d) => d.toLowerCase().trim());
    if (lowerCustom.some((d) => d && (hostname === d || hostname.endsWith(`.${d}`)))) {
      return {
        safe: false,
        reason: `The domain ${hostname} is prohibited by system policy.`,
      };
    }
  }

  // 3. Check Keyword Patterns (Phishing, Malware, NSFW, Spam)
  for (const pattern of BAD_KEYWORD_PATTERNS) {
    if (pattern.test(fullPath)) {
      return {
        safe: false,
        reason: 'Target URL contains prohibited keywords or restricted file extensions.',
      };
    }
  }

  // 4. IP Hostname check (prevent raw IP redirection unless explicitly allowed)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return {
      safe: false,
      reason: 'Raw IP address URLs are not permitted as redirect destinations.',
    };
  }

  return { safe: true };
}
