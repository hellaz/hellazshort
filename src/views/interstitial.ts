/**
 * HTML interstitial views for password protection, splash pages, cloaking, and expired links.
 * Works seamlessly in both Cloudflare Workers and Node.js environments.
 */

import { escapeHtml } from '../utils/html';

export function renderPasswordPromptPage(slug: string, linkId?: string): string {
  const safeSlug = escapeHtml(slug);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password Protected Link - URLZ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 2.25rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { width: 56px; height: 56px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 1.25rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem; }
    input { width: 100%; padding: 0.85rem 1rem; border-radius: 12px; border: 1px solid #334155; background: #020617; color: #fff; font-size: 0.95rem; margin-bottom: 1rem; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2); }
    button { width: 100%; padding: 0.85rem; border-radius: 12px; border: none; background: #f59e0b; color: #000; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #d97706; }
    .error { color: #f43f5e; font-size: 0.85rem; margin-bottom: 1rem; display: none; background: rgba(244, 63, 94, 0.1); padding: 0.6rem; border-radius: 8px; border: 1px solid rgba(244, 63, 94, 0.2); }
    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Password Protected Link</h1>
    <p>This short link requires a passcode to continue to its destination.</p>
    <div id="err" class="error"></div>
    <form id="f">
      <input type="password" id="p" placeholder="Enter password..." required autofocus />
      <button type="submit" id="btn">Unlock &amp; Continue &rarr;</button>
    </form>
    <div class="footer">Protected by URLZ Security</div>
  </div>
  <script>
    document.getElementById('f').onsubmit = async (e) => {
      e.preventDefault();
      const p = document.getElementById('p').value;
      const btn = document.getElementById('btn');
      btn.textContent = 'Verifying...';
      btn.disabled = true;
      try {
        const res = await fetch('/api/v1/links/unlock/${safeSlug}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: p })
        });
        const data = await res.json();
        if (res.ok && data.destination_url) {
          window.location.reload();
        } else {
          const err = document.getElementById('err');
          err.textContent = data.message || 'Incorrect password';
          err.style.display = 'block';
          btn.textContent = 'Unlock & Continue \\u2192';
          btn.disabled = false;
        }
      } catch (err) {
        const errEl = document.getElementById('err');
        errEl.textContent = 'Verification error. Please try again.';
        errEl.style.display = 'block';
        btn.textContent = 'Unlock & Continue \\u2192';
        btn.disabled = false;
      }
    };
  </script>
</body>
</html>`;
}

export function renderSplashPage(
  splash: {
    title?: string;
    countdown?: number;
    message?: string;
    banner_url?: string;
    button_text?: string;
  },
  destinationUrl: string
): string {
  const countdown = Math.max(Number(splash.countdown) || 5, 2);
  const title = escapeHtml(splash.title || 'Sponsored Link');
  const customMessage = escapeHtml(splash.message || 'You will be redirected to your destination shortly.');
  const bannerUrl = splash.banner_url ? escapeHtml(splash.banner_url) : '';
  const buttonText = escapeHtml(splash.button_text || 'Proceed to Destination');
  const safeDest = escapeHtml(destinationUrl);

  return `<!DOCTYPE html>
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
      <div class="target-preview">Target: ${safeDest}</div>
    </div>
    <a id="proceedBtn" href="${safeDest}" class="btn disabled">Please wait ${countdown}s...</a>
    <div class="footer">
      <span>🔒 URLZ Interstitial</span>
      <a href="/report-abuse?url=${encodeURIComponent(destinationUrl)}">Report Abuse</a>
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
</html>`;
}

export function renderCloakedPage(destinationUrl: string, title?: string): string {
  const safeDest = escapeHtml(destinationUrl);
  const safeTitle = escapeHtml(title || 'URLZ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; }
    iframe { border: none; width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  <iframe src="${safeDest}" allowfullscreen sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
</body>
</html>`;
}

export function renderExpiredPage(type: 'expired' | 'limit'): string {
  const isLimit = type === 'limit';
  const icon = isLimit ? '🛑' : '⏳';
  const title = isLimit ? 'Visit Limit Reached' : 'Link Expired';
  const message = isLimit
    ? 'This short URL has reached its maximum visit limit and is no longer accepting clicks.'
    : 'This short URL has reached its expiration date and is no longer available.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - URLZ</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; margin: 0; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 2.5rem; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
    a { display: inline-block; padding: 0.75rem 1.5rem; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; transition: background 0.2s; }
    a:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">&larr; Return to URLZ</a>
  </div>
</body>
</html>`;
}
