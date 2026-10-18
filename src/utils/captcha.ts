/**
 * Copyright (c) 2025 URLZ Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

import type { Env } from '../types';

export interface CaptchaVerificationResult {
  valid: boolean;
  message?: string;
}

/**
 * Server-side verification for Captcha tokens (Turnstile, reCAPTCHA, SolveMedia, or Built-In Math Captcha).
 */
export async function verifyCaptchaResponse(
  env: Env,
  captchaToken?: string,
  captchaAnswer?: string,
  captchaSolution?: string
): Promise<CaptchaVerificationResult> {
  // Fetch global settings to check if captcha is enabled
  let settings: any = {};
  try {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'captcha_settings'").first<any>();
    if (row && row.value) {
      settings = JSON.parse(row.value);
    }
  } catch {
    settings = {};
  }

  // If captcha is explicitly disabled in settings, allow pass
  if (settings.enabled === false) {
    return { valid: true };
  }

  const provider = settings.provider || 'built_in';

  // 1. Built-In Math / Challenge Captcha
  if (provider === 'built_in' || !settings.secret_key) {
    if (captchaAnswer && captchaSolution) {
      if (captchaAnswer.trim() === captchaSolution.trim()) {
        return { valid: true };
      }
      return { valid: false, message: 'Incorrect captcha answer. Please solve the math verification.' };
    }
    // If no secret key is configured, allow built-in validation pass if token provided
    if (captchaToken && captchaToken.length > 3) {
      return { valid: true };
    }
    return { valid: false, message: 'Captcha verification is required for anonymous requests.' };
  }

  // 2. Cloudflare Turnstile Verification
  if (provider === 'turnstile') {
    if (!captchaToken) {
      return { valid: false, message: 'Cloudflare Turnstile token missing.' };
    }
    try {
      const formData = new FormData();
      formData.append('secret', settings.secret_key);
      formData.append('response', captchaToken);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });
      const data: any = await res.json();
      if (data.success) {
        return { valid: true };
      }
      return { valid: false, message: 'Turnstile verification failed. Please try again.' };
    } catch {
      return { valid: false, message: 'Turnstile verification service error.' };
    }
  }

  // 3. Google reCAPTCHA Verification (v2 / v3)
  if (provider === 'recaptcha') {
    if (!captchaToken) {
      return { valid: false, message: 'reCAPTCHA token missing.' };
    }
    try {
      const res = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${settings.secret_key}&response=${captchaToken}`,
        { method: 'POST' }
      );
      const data: any = await res.json();
      if (data.success) {
        return { valid: true };
      }
      return { valid: false, message: 'reCAPTCHA verification failed.' };
    } catch {
      return { valid: false, message: 'reCAPTCHA verification service error.' };
    }
  }

  // Default fallback
  if (captchaToken || captchaAnswer) {
    return { valid: true };
  }

  return { valid: false, message: 'Captcha verification required.' };
}
