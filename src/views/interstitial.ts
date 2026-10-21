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
  <meta name="robots" content="noindex, nofollow">
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
    banner_link?: string;
    ad_code?: string;
    button_text?: string;
    show_qr?: boolean;
    short_url?: string;
  },
  destinationUrl: string,
  nonce?: string,
  shortUrlParam?: string,
  linkDescription?: string,
  linkTitle?: string,
  referralUrl?: string
): string {
  // Enforce default maximum 10s countdown
  const countdown = Math.min(Math.max(Number(splash.countdown) || 5, 1), 10);
  const title = escapeHtml(splash.title || 'Sponsored Destination');
  const customMessage = escapeHtml(splash.message || 'Your destination link will be ready when the countdown completes.');
  const bannerUrl = splash.banner_url ? escapeHtml(splash.banner_url) : '';
  const bannerLink = splash.banner_link ? escapeHtml(splash.banner_link) : '';
  const shortUrl = shortUrlParam || splash.short_url || '';
  const showQr = splash.show_qr !== false && Boolean(shortUrl);
  const adCode = splash.ad_code ? splash.ad_code : `<div style="background: linear-gradient(135deg, #1e1b4b, #312e81); border: 1px dashed #6366f1; border-radius: 16px; padding: 1.5rem; text-align: center; color: #a5b4fc; font-size: 0.85rem;"><div style="font-weight: 700; margin-bottom: 0.25rem; color: #fff;">Sponsored Ad Unit</div><div>728×90 Leaderboard / Responsive Banner</div></div>`;
  const buttonText = escapeHtml(splash.button_text || 'Get Link');
  const safeDest = escapeHtml(destinationUrl);
  const jsonDest = JSON.stringify(destinationUrl);
  const nonceAttr = nonce ? ` nonce="${escapeHtml(nonce)}"` : '';
  const safeLinkTitle = linkTitle ? escapeHtml(linkTitle) : '';
  const safeLinkDesc = linkDescription ? escapeHtml(linkDescription) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title} - URLZ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 28px; padding: 2.25rem; max-width: 580px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .logo { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 900; color: #fff; margin-bottom: 1.25rem; letter-spacing: -0.02em; }
    .logo-badge { width: 36px; height: 36px; background: linear-gradient(135deg, #4f46e5, #9333ea); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); }
    .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: #1e293b; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; color: #818cf8; margin-bottom: 1.25rem; }
    .timer { font-family: monospace; font-size: 0.85rem; background: #312e81; color: #c7d2fe; padding: 0.2rem 0.6rem; border-radius: 9999px; }
    h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; }
    .banner { width: 100%; max-height: 180px; object-fit: cover; border-radius: 16px; margin-bottom: 1.25rem; border: 1px solid #334155; }
    
    /* QR Code Card on Splash Page */
    .qr-container { display: flex; align-items: center; gap: 14px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 12px 16px; margin-bottom: 1.25rem; text-align: left; }
    .qr-frame { background: #ffffff; padding: 6px; border-radius: 12px; display: flex; align-items: center; justify-content: center; shrink-0; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .qr-frame img { display: block; border-radius: 6px; }
    .qr-text { flex: 1; min-width: 0; }
    .qr-title { font-weight: 700; font-size: 0.85rem; color: #fff; display: flex; align-items: center; gap: 4px; }
    .qr-desc { font-size: 0.75rem; color: #94a3b8; line-height: 1.35; margin-top: 2px; }
    .qr-slug { font-family: monospace; font-size: 0.7rem; color: #818cf8; margin-top: 4px; word-break: break-all; }

    /* Anti-Fraud Standards: Clear 11px gray label and strict minimum 150px buffer between ad and action button */
    .ad-wrapper { width: 100%; margin-bottom: 150px; text-align: center; }
    .ad-label { font-size: 11px; color: #94a3b8; font-family: system-ui, -apple-system, sans-serif; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-weight: 600; }
    #ad-container { width: 100%; min-height: 250px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 14px; }
    #fallback-promo { display: none; width: 100%; min-height: 250px; background: linear-gradient(135deg, #1e1b4b, #312e81); border: 1px solid #4f46e5; border-radius: 18px; padding: 2rem; color: #fff; text-align: center; }
    .promo-badge { display: inline-block; background: #4f46e5; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; rounded: 6px; text-transform: uppercase; margin-bottom: 12px; }
    .promo-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; }
    .promo-text { font-size: 0.85rem; color: #a5b4fc; margin-bottom: 1.5rem; }
    .promo-btn { display: inline-block; padding: 0.6rem 1.25rem; background: #fff; color: #4338ca; font-weight: 700; font-size: 0.85rem; border-radius: 10px; text-decoration: none; }

    .msg-box { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
    p { font-size: 0.875rem; color: #cbd5e1; line-height: 1.5; }
    .target-preview { font-size: 0.75rem; color: #64748b; font-family: monospace; word-break: break-all; margin-top: 0.5rem; }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 0.95rem 1.5rem; border-radius: 14px; border: none; background: #4f46e5; color: #fff; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: background 0.2s, opacity 0.2s, transform 0.1s; text-decoration: none; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
    .btn.disabled { opacity: 0.5; pointer-events: none; background: #334155; box-shadow: none; cursor: not-allowed; }
    .btn:hover:not(.disabled) { background: #4338ca; transform: translateY(-1px); }
    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #1e293b; }
    .footer a { color: #818cf8; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-badge">⚡</div>
      <span>URLZ</span>
    </div>
    <div>
      <div class="badge">
        <span>${title}</span>
        <span id="countdown" class="timer">${countdown}s</span>
      </div>
    </div>
    ${bannerUrl ? (bannerLink ? `<a href="${bannerLink}" target="_blank" rel="noopener"><img src="${bannerUrl}" alt="Banner" class="banner" /></a>` : `<img src="${bannerUrl}" alt="Banner" class="banner" />`) : ''}

    ${showQr ? `
    <div class="qr-container">
      <div class="qr-frame">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&amp;margin=6&amp;data=${encodeURIComponent(shortUrl)}" alt="Scan QR Code to open on mobile" width="88" height="88" loading="lazy" />
      </div>
      <div class="qr-text">
        <div class="qr-title">📱 Scan with Phone</div>
        <div class="qr-desc">Take this link on mobile while the countdown finishes</div>
        <div class="qr-slug">${escapeHtml(shortUrl)}</div>
      </div>
    </div>
    ` : ''}

    <!-- Dynamic Ad Container with 11px gray label and strict minimum 150px separation buffer -->
    <div class="ad-wrapper">
      <div class="ad-label">Advertisement</div>
      <div id="ad-container">
        ${adCode}
      </div>
      <div id="fallback-promo">
        <div class="promo-badge">Platform Update</div>
        <div class="promo-title">Tired of slow links?</div>
        <div class="promo-text">Create your own branded short links for free with URLZ. Lightning fast, secure, and permanent.</div>
        <a href="/" class="promo-btn">Get Started for Free &rarr;</a>
      </div>
    </div>

    <div class="msg-box">
      ${title && title !== 'Sponsored Destination' ? `<h2 style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${title}</h2>` : ''}
      <p>${customMessage}</p>
      
      ${(safeLinkTitle || safeLinkDesc) ? `
      <div style="margin-top: 1.25rem; padding: 1rem; background: rgba(79, 70, 229, 0.1); border: 1px solid rgba(79, 70, 229, 0.2); border-radius: 14px; text-align: left;">
        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #818cf8; font-weight: 700; margin-bottom: 0.5rem;">Destination Preview</div>
        ${safeLinkTitle ? `<div style="font-weight: 700; color: #fff; font-size: 0.9rem; margin-bottom: 0.25rem;">${safeLinkTitle}</div>` : ''}
        ${safeLinkDesc ? `<div style="font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">${safeLinkDesc}</div>` : ''}
      </div>
      ` : ''}

      <div class="target-preview">Target: ${safeDest}</div>
    </div>

    ${referralUrl ? `
    <div style="margin-bottom: 1.25rem;">
      <a href="${escapeHtml(referralUrl)}" target="_blank" rel="noopener" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.75rem; background: rgba(79, 70, 229, 0.05); border: 1px dashed rgba(79, 70, 229, 0.3); border-radius: 12px; color: #a5b4fc; text-decoration: none; font-size: 0.8rem; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'; this.style.borderColor='rgba(79, 70, 229, 0.5)';" onmouseout="this.style.background='rgba(79, 70, 229, 0.05)'; this.style.borderColor='rgba(79, 70, 229, 0.3)';">
        <span>✨ Like URLZ? Register yourself!</span>
        <span style="font-size: 1rem;">&rarr;</span>
      </a>
    </div>
    ` : ''}

    <!-- Final Action Button: Disabled until timer hits 0. User MUST intentionally click (never auto-triggered). -->
    <a id="proceedBtn" href="${safeDest}" class="btn disabled" role="button" aria-disabled="true">
      Please wait <span id="btnTimer" style="margin-left: 4px;">${countdown}s</span>...
    </a>

    <div class="footer">
      <span>🔒 URLZ Interstitial Safety Gate</span>
      <a href="/p/report-abuse?url=${encodeURIComponent(destinationUrl)}">Report Abuse</a>
    </div>
  </div>

  <script${nonceAttr}>
    (function() {
      // Record splash view for 24-hour frequency capping (both localStorage and Cookie)
      var now = Date.now().toString();
      try {
        localStorage.setItem('last_splash_seen', now);
      } catch(e) {}
      document.cookie = 'last_splash_seen=' + now + '; max-age=86400; path=/; SameSite=Lax';

      var remaining = ${countdown};
      var cd = document.getElementById('countdown');
      var btnTimer = document.getElementById('btnTimer');
      var btn = document.getElementById('proceedBtn');
      var dest = ${jsonDest};

      // Strict Anti-Fraud Standard: Never auto-trigger click or redirect on timer finish.
      // The user must intentionally click to proceed.
      if (btn) {
        btn.addEventListener('click', function(e) {
          if (btn.classList.contains('disabled')) {
            e.preventDefault();
            return false;
          }
          // Intentionally clicked by user
          try {
            window.location.href = dest;
          } catch(err) {
            window.location.replace(dest);
          }
        });
      }

      // Ad-Block Detection & Fallback
      setTimeout(function() {
        var adContainer = document.getElementById('ad-container');
        var fallback = document.getElementById('fallback-promo');
        var adLoaded = false;
        
        if (adContainer) {
          // Check if ad container has content and is visible
          if (adContainer.innerHTML.trim().length > 100 && adContainer.offsetHeight > 10) {
            adLoaded = true;
          }
        }
        
        if (!adLoaded && fallback) {
          fallback.style.display = 'block';
          if (adContainer) adContainer.style.display = 'none';
        }
      }, 1500);

      var interval = setInterval(function() {
        remaining--;
        if (remaining > 0) {
          if (cd) cd.textContent = remaining + 's';
          if (btnTimer) btnTimer.textContent = remaining + 's';
        } else {
          clearInterval(interval);
          if (cd) cd.textContent = 'Ready';
          if (btn) {
            btn.textContent = '${buttonText} →';
            btn.classList.remove('disabled');
            btn.removeAttribute('aria-disabled');
          }
          // Do NOT auto-trigger proceed(). Wait for user intentional click.
        }
      }, 1000);
    })();
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
  <meta name="robots" content="noindex, nofollow">
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
  <meta name="robots" content="noindex, nofollow">

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

export function renderNotFoundPage(type: 'link' | 'domain' = 'link'): string {
  const icon = '🔍';
  const title = type === 'domain' ? 'Domain Not Found' : 'Link Not Found';
  const message = type === 'domain' 
    ? 'The domain you are trying to access is not configured on our platform or is currently inactive.'
    : 'The short link you are looking for does not exist, has been deleted, or the URL is mistyped.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title} - URLZ</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; margin: 0; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 28px; padding: 3rem 2rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); position: relative; overflow: hidden; }
    .card::before { content: ""; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 70%); pointer-events: none; }
    .icon { font-size: 3.5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 15px rgba(79, 70, 229, 0.3)); }
    h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem; color: #fff; letter-spacing: -0.02em; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.7; margin-bottom: 2rem; }
    .btn-group { display: flex; flex-direction: column; gap: 0.75rem; }
    a { display: inline-block; padding: 0.9rem 1.5rem; border-radius: 14px; font-weight: 700; font-size: 0.95rem; transition: all 0.2s; text-decoration: none; }
    .btn-primary { background: #4f46e5; color: #fff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }
    .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; color: #fff; }
    .footer { margin-top: 2rem; font-size: 0.75rem; color: #475569; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="btn-group">
      <a href="/" class="btn-primary">Go to Homepage</a>
      <a href="/login" class="btn-secondary">Sign In / Dashboard</a>
    </div>
    <div class="footer">Next-Generation Link Management &bull; URLZ</div>
  </div>
</body>
</html>`;
}

export function renderDeepLinkPage(
  deepLinkUrl: string,
  fallbackUrl: string,
  platformName: string = 'App'
): string {
  const safeDeep = escapeHtml(deepLinkUrl);
  const safeFallback = escapeHtml(fallbackUrl);
  const safePlatform = escapeHtml(platformName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Opening ${safePlatform}... - URLZ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; text-align: center; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 28px; padding: 2.5rem; max-width: 440px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { font-size: 3rem; margin-bottom: 1.25rem; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
    h1 { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1.75rem; }
    .btn { display: inline-block; width: 100%; padding: 0.85rem; border-radius: 14px; background: #4f46e5; color: #fff; font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: background 0.2s; margin-bottom: 0.75rem; }
    .btn:hover { background: #4338ca; }
    .fallback-link { font-size: 0.8rem; color: #818cf8; text-decoration: none; }
    .fallback-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🚀</div>
    <h1>Opening in ${safePlatform}...</h1>
    <p>Attempting to open link directly in native application. If the app is not installed, you will be redirected automatically.</p>
    <a href="${safeDeep}" class="btn">Open ${safePlatform} Now &rarr;</a>
    <div>
      <a href="${safeFallback}" class="fallback-link">Continue to Web Version</a>
    </div>
  </div>
  <script>
    window.location.href = "${safeDeep}";
    setTimeout(function() {
      window.location.href = "${safeFallback}";
    }, 2500);
  </script>
</body>
</html>`;
}

export interface MediaEmbedInfo {
  type: 'youtube' | 'vimeo' | 'dailymotion' | 'tiktok' | 'spotify' | 'soundcloud' | null;
  embedUrl: string | null;
  id: string | null;
}

export function detectMediaEmbed(url: string): MediaEmbedInfo {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace('www.', '');

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id = '';
      if (host.includes('youtu.be')) {
        id = u.pathname.replace(/^\//, '');
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.replace('/shorts/', '');
      } else {
        id = u.searchParams.get('v') || '';
      }
      if (id) {
        return { type: 'youtube', embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, id };
      }
    }

    if (host.includes('vimeo.com')) {
      const match = u.pathname.match(/\/(\d+)/);
      if (match && match[1]) {
        return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1`, id: match[1] };
      }
    }

    if (host.includes('dailymotion.com') || host.includes('dai.ly')) {
      const parts = u.pathname.split('/');
      const id = parts[parts.length - 1];
      if (id) {
        return { type: 'dailymotion', embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, id };
      }
    }

    if (host.includes('spotify.com')) {
      const path = u.pathname.replace(/^\//, '');
      if (path) {
        return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${path}`, id: path };
      }
    }

    if (host.includes('tiktok.com')) {
      const match = u.pathname.match(/\/video\/(\d+)/);
      if (match && match[1]) {
        return { type: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`, id: match[1] };
      }
    }
  } catch {}

  return { type: null, embedUrl: null, id: null };
}

export function renderMediaEmbedPage(
  mediaInfo: MediaEmbedInfo,
  destinationUrl: string,
  title?: string,
  description?: string
): string {
  const safeTitle = escapeHtml(title || 'Media Player');
  const safeDesc = escapeHtml(description || 'Click play to watch or listen to media.');
  const safeDest = escapeHtml(destinationUrl);
  const safeEmbed = mediaInfo.embedUrl ? escapeHtml(mediaInfo.embedUrl) : safeDest;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${safeTitle} - URLZ</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020617; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; }
    .container { max-width: 800px; width: 100%; text-align: center; }
    .badge { display: inline-block; background: #1e293b; color: #818cf8; padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.5; }
    .player-box { width: 100%; aspect-ratio: 16 / 9; max-height: 480px; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); margin-bottom: 1.5rem; }
    iframe { width: 100%; height: 100%; border: none; }
    .btn-bar { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 12px; background: #4f46e5; color: #fff; font-weight: 700; font-size: 0.875rem; text-decoration: none; transition: background 0.2s; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">🎬 Dedicated Media Player</div>
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <div class="player-box">
      <iframe src="${safeEmbed}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div class="btn-bar">
      <a href="${safeDest}" target="_blank" rel="noopener noreferrer" class="btn">Watch on Original Platform &rarr;</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderOverlayPage(
  destinationUrl: string,
  overlay: {
    title?: string;
    message?: string;
    button_text?: string;
    button_url?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-banner';
  }
): string {
  const safeDest = escapeHtml(destinationUrl);
  const title = escapeHtml(overlay.title || 'Special Offer');
  const message = escapeHtml(overlay.message || 'Check out this exclusive deal from URLZ!');
  const buttonText = escapeHtml(overlay.button_text || 'Learn More');
  const buttonUrl = overlay.button_url ? escapeHtml(overlay.button_url) : safeDest;

  const isTop = overlay.position === 'top-banner';
  const isLeft = overlay.position === 'bottom-left';

  let posCss = 'bottom: 24px; right: 24px; max-width: 380px;';
  if (isTop) posCss = 'top: 0; left: 0; right: 0; width: 100%; border-radius: 0; border-bottom: 2px solid #6366f1;';
  else if (isLeft) posCss = 'bottom: 24px; left: 24px; max-width: 380px;';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>URLZ</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
    iframe { border: none; width: 100%; height: 100%; }
    .overlay-card { position: fixed; z-index: 999999; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 20px; padding: 1.25rem; box-shadow: 0 20px 40px rgba(0,0,0,0.6); ${posCss} }
    .overlay-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .overlay-title { font-size: 0.95rem; font-weight: 700; color: #818cf8; }
    .close-btn { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; padding: 0 0.25rem; }
    .close-btn:hover { color: #fff; }
    .overlay-msg { font-size: 0.825rem; color: #cbd5e1; line-height: 1.4; margin-bottom: 1rem; }
    .overlay-btn { display: block; text-align: center; background: #4f46e5; color: #fff; text-decoration: none; padding: 0.65rem 1rem; border-radius: 10px; font-weight: 700; font-size: 0.85rem; transition: background 0.2s; }
    .overlay-btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <iframe src="${safeDest}"></iframe>
  <div id="overlayBox" class="overlay-card">
    <div class="overlay-header">
      <span class="overlay-title">✨ ${title}</span>
      <button class="close-btn" onclick="document.getElementById('overlayBox').style.display='none'">&times;</button>
    </div>
    <div class="overlay-msg">${message}</div>
    <a href="${buttonUrl}" target="_blank" rel="noopener noreferrer" class="overlay-btn">${buttonText} &rarr;</a>
  </div>
</body>
</html>`;
}
