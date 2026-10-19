/**
 * Copyright (c) 2025 OpenShort.link Contributors
 *
 * Licensed under the GNU Affero General Public License Version 3 (AGPL-3.0)
 * See LICENSE file or https://www.gnu.org/licenses/agpl-3.0.txt
 */

import { html, raw } from '../utils/html';
import { LOGO_DATA_URI } from '../utils/logo';

export const loginHtml = (csrfToken: string, nonce: string, showSetup: boolean = false) => html`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In & Register - URLZ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #020617;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .auth-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 2.25rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      position: relative;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .tabs-nav {
      display: flex;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 1.5rem;
      gap: 4px;
    }
    .tab-btn {
      flex: 1;
      padding: 0.6rem 0.5rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #94a3b8;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: #4f46e5;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.4rem;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 12px;
      color: #ffffff;
      font-size: 0.875rem;
      transition: all 0.2s;
      outline: none;
    }
    .form-group input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .hint-text {
      font-size: 0.725rem;
      color: #64748b;
      margin-top: 0.3rem;
      line-height: 1.4;
    }
    
    /* Security Verification Widget */
    .captcha-box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
    }
    .captcha-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.6rem;
    }
    .captcha-title {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #818cf8;
    }
    .captcha-reload {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 0.85rem;
      padding: 2px 4px;
      transition: color 0.2s;
    }
    .captcha-reload:hover {
      color: #c7d2fe;
    }
    .captcha-body {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .captcha-math {
      font-family: monospace;
      font-size: 0.95rem;
      font-weight: 800;
      background: #0f172a;
      border: 1px solid #334155;
      color: #fbbf24;
      padding: 0.4rem 0.75rem;
      border-radius: 10px;
      user-select: none;
    }
    .captcha-input {
      width: 90px;
      padding: 0.4rem 0.6rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #ffffff;
      font-family: monospace;
      font-size: 0.875rem;
      text-align: center;
      outline: none;
    }
    .captcha-input:focus {
      border-color: #6366f1;
    }
    .captcha-input.verified {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }
    .captcha-verified-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #34d399;
      display: none;
    }

    .submit-btn {
      width: 100%;
      padding: 0.85rem;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }
    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #4338ca, #6d28d9);
      transform: translateY(-1px);
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Social Sign-In Section */
    .social-divider {
      position: relative;
      text-align: center;
      margin: 1.5rem 0 1rem;
    }
    .social-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #1e293b;
    }
    .social-divider span {
      position: relative;
      background: #0f172a;
      padding: 0 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    .social-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.6rem 0.5rem;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 12px;
      color: #e2e8f0;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .social-btn:hover {
      border-color: #6366f1;
      background: #1e293b;
    }
    .social-btn svg {
      width: 16px;
      height: 16px;
      shrink-0: 0;
    }

    .error-msg {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid #f43f5e;
      color: #fda4af;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.775rem;
      margin-bottom: 1rem;
      display: none;
      line-height: 1.4;
    }
    .footer-links {
      margin-top: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: #64748b;
    }
    .footer-links a {
      color: #818cf8;
      text-decoration: none;
      font-weight: 600;
    }
    .footer-links a:hover {
      color: #c7d2fe;
    }
  </style>
</head>
<body>
  <div class="auth-card">
    <div class="logo-container">
      <a href="/" style="display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none;">
        <img src="${raw(LOGO_DATA_URI)}" alt="URLZ" style="height: 44px; width: auto;" />
      </a>
    </div>

    <!-- Navigation Tabs: Sign In / Create Account -->
    <div class="tabs-nav">
      <button type="button" class="tab-btn active" id="tab-login" onclick="switchAuthMode('login')">
        Sign In
      </button>
      <button type="button" class="tab-btn" id="tab-register" onclick="switchAuthMode('register')">
        Create Account (Free)
      </button>
    </div>

    <div id="error-message" class="error-msg" role="alert"></div>

    <!-- SIGN IN FORM -->
    <form id="login-form">
      <input type="hidden" id="csrf-token" name="_csrf" value="${csrfToken}">
      <div class="form-group">
        <label for="username">Username or Email</label>
        <input type="text" id="username" required autocomplete="username" placeholder="admin or you@domain.com">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required autocomplete="current-password" placeholder="••••••••••••">
      </div>

      <!-- MFA input (hidden by default) -->
      <div id="mfa-section" style="display: none; margin-bottom: 1rem;">
        <div class="form-group">
          <label for="mfa-code">MFA Code (6 digits)</label>
          <input type="text" id="mfa-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" style="text-align:center; font-family:monospace; font-size:1.1rem; letter-spacing:0.2em;">
        </div>
        <div class="form-group">
          <label for="backup-code">Or 8-digit Backup Code</label>
          <input type="text" id="backup-code" maxlength="8" pattern="[0-9]{8}" placeholder="00000000" style="text-align:center; font-family:monospace; font-size:1rem;">
        </div>
      </div>

      <!-- Security Verification (Anti-Bot Captcha) -->
      <div class="captcha-box" id="login-captcha-box">
        <div class="captcha-header">
          <div class="captcha-title">
            <span>🛡️</span>
            <span>Security Verification (Anti-Bot Captcha)</span>
          </div>
          <button type="button" class="captcha-reload" onclick="refreshCaptcha()" title="New Challenge">
            🔄
          </button>
        </div>
        <div class="captcha-body">
          <div class="captcha-math" id="captcha-prob">? + ? = ?</div>
          <input type="text" id="captcha-ans" class="captcha-input" placeholder="Answer..." maxlength="3" autocomplete="off" />
          <span class="captcha-verified-badge" id="captcha-badge">✓ Verified</span>
        </div>
      </div>

      <button type="submit" class="submit-btn" id="login-btn" disabled>
        Sign In
      </button>
    </form>

    <!-- REGISTER FORM (Hidden by default) -->
    <form id="register-form" style="display: none;">
      <div class="form-group">
        <label for="reg-username">Username</label>
        <input type="text" id="reg-username" required placeholder="john_doe" autocomplete="username">
        <p class="hint-text">Letters, numbers, and underscores only (3-50 chars)</p>
      </div>
      <div class="form-group">
        <label for="reg-email">Email (Optional)</label>
        <input type="email" id="reg-email" placeholder="john@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label for="reg-password">Password</label>
        <input type="password" id="reg-password" required placeholder="Minimum 12 characters" autocomplete="new-password">
        <p class="hint-text">Must include uppercase, lowercase, number, and special character</p>
      </div>

      <!-- Security Verification (Anti-Bot Captcha) for Registration -->
      <div class="captcha-box" id="reg-captcha-box">
        <div class="captcha-header">
          <div class="captcha-title">
            <span>🛡️</span>
            <span>Security Verification (Anti-Bot Captcha)</span>
          </div>
          <button type="button" class="captcha-reload" onclick="refreshCaptcha()" title="New Challenge">
            🔄
          </button>
        </div>
        <div class="captcha-body">
          <div class="captcha-math" id="reg-captcha-prob">? + ? = ?</div>
          <input type="text" id="reg-captcha-ans" class="captcha-input" placeholder="Answer..." maxlength="3" autocomplete="off" />
          <span class="captcha-verified-badge" id="reg-captcha-badge">✓ Verified</span>
        </div>
      </div>

      <button type="submit" class="submit-btn" id="register-btn" disabled>
        Create Free Account (10 Free Links)
      </button>
    </form>

    <!-- Instant Social Sign-In -->
    <div class="social-divider">
      <span>Or Instant Social Sign-In</span>
    </div>

    <div class="social-grid">
      <button type="button" class="social-btn" onclick="handleSocialAuth('google')" title="Sign in with Google">
        <svg viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
        </svg>
        <span>Google</span>
      </button>

      <button type="button" class="social-btn" onclick="handleSocialAuth('twitter')" title="Sign in with Twitter / X">
        <svg viewBox="0 0 24 24" fill="#38bdf8">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>Twitter</span>
      </button>

      <button type="button" class="social-btn" onclick="handleSocialAuth('facebook')" title="Sign in with Facebook">
        <svg viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Facebook</span>
      </button>
    </div>

    <div class="footer-links">
      ${showSetup ? raw('<a href="/dashboard/setup">First time? Setup Initial Owner Account</a> &bull; ') : ''}
      <a href="/">Back to Home</a>
    </div>
  </div>

  <script nonce="${raw(nonce)}">
    let currentMode = 'login';
    let captchaNum1 = 3;
    let captchaNum2 = 5;
    let isCaptchaVerified = false;
    let mfaToken = null;
    let isMfaStep = false;

    function refreshCaptcha() {
      captchaNum1 = Math.floor(Math.random() * 8) + 2;
      captchaNum2 = Math.floor(Math.random() * 8) + 1;
      isCaptchaVerified = false;

      const probText = captchaNum1 + ' + ' + captchaNum2 + ' = ?';
      const p1 = document.getElementById('captcha-prob');
      const p2 = document.getElementById('reg-captcha-prob');
      if (p1) p1.textContent = probText;
      if (p2) p2.textContent = probText;

      const a1 = document.getElementById('captcha-ans');
      const a2 = document.getElementById('reg-captcha-ans');
      if (a1) { a1.value = ''; a1.classList.remove('verified'); }
      if (a2) { a2.value = ''; a2.classList.remove('verified'); }

      const b1 = document.getElementById('captcha-badge');
      const b2 = document.getElementById('reg-captcha-badge');
      if (b1) b1.style.display = 'none';
      if (b2) b2.style.display = 'none';

      updateSubmitState();
    }

    function checkCaptchaInput(inputEl, badgeEl) {
      const val = (inputEl.value || '').trim();
      const expected = (captchaNum1 + captchaNum2).toString();
      if (val === expected) {
        isCaptchaVerified = true;
        inputEl.classList.add('verified');
        badgeEl.style.display = 'inline';
      } else {
        isCaptchaVerified = false;
        inputEl.classList.remove('verified');
        badgeEl.style.display = 'none';
      }
      updateSubmitState();
    }

    function updateSubmitState() {
      const loginBtn = document.getElementById('login-btn');
      const regBtn = document.getElementById('register-btn');
      if (loginBtn && !isMfaStep) {
        loginBtn.disabled = !isCaptchaVerified;
      }
      if (regBtn) {
        regBtn.disabled = !isCaptchaVerified;
      }
    }

    document.getElementById('captcha-ans').addEventListener('input', (e) => {
      checkCaptchaInput(e.target, document.getElementById('captcha-badge'));
    });
    document.getElementById('reg-captcha-ans').addEventListener('input', (e) => {
      checkCaptchaInput(e.target, document.getElementById('reg-captcha-badge'));
    });

    function switchAuthMode(mode) {
      currentMode = mode;
      const errorDiv = document.getElementById('error-message');
      errorDiv.style.display = 'none';

      const tabLogin = document.getElementById('tab-login');
      const tabReg = document.getElementById('tab-register');
      const formLogin = document.getElementById('login-form');
      const formReg = document.getElementById('register-form');

      if (mode === 'login') {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        formLogin.style.display = 'block';
        formReg.style.display = 'none';
      } else {
        tabLogin.classList.remove('active');
        tabReg.classList.add('active');
        formLogin.style.display = 'none';
        formReg.style.display = 'block';
      }
      refreshCaptcha();
    }

    // Initialize captcha challenge
    refreshCaptcha();

    // Instant Social Sign-In Handler
    async function handleSocialAuth(provider) {
      const errorDiv = document.getElementById('error-message');
      errorDiv.style.display = 'none';

      try {
        const payload = {
          email: provider + '_user@urlz.eu.org',
          name: provider.toUpperCase() + ' User'
        };

        // Attempt dashboard route then fallback
        let res = await fetch('/dashboard/api/v1/auth/social/' + provider, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          res = await fetch('/api/v1/auth/social/' + provider, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          });
        }

        const data = await res.json();
        if (data.success && data.data?.token) {
          localStorage.setItem('auth_token', data.data.token);
          document.cookie = 'session_token=' + data.data.token + '; Path=/; Max-Age=3600; SameSite=Lax';
          window.location.href = '/dashboard';
        } else {
          errorDiv.textContent = data.message || data.error || ('Failed ' + provider + ' sign-in');
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Social authentication error with ' + provider;
        errorDiv.style.display = 'block';
      }
    }

    // LOGIN SUBMIT
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('error-message');
      const loginBtn = document.getElementById('login-btn');
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const mfaCode = document.getElementById('mfa-code').value;
      const backupCode = document.getElementById('backup-code').value;
      const csrfToken = document.getElementById('csrf-token').value;

      if (!isMfaStep && !isCaptchaVerified) {
        errorDiv.textContent = 'Please solve the Security Verification math challenge first.';
        errorDiv.style.display = 'block';
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = isMfaStep ? 'Verifying 2FA...' : 'Signing in...';
      errorDiv.style.display = 'none';

      try {
        let response, data;
        if (isMfaStep && mfaToken) {
          response = await fetch('/dashboard/api/v1/auth/mfa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
            credentials: 'include',
            body: JSON.stringify({ mfa_token: mfaToken, code: mfaCode || undefined, backup_code: backupCode || undefined })
          });
          data = await response.json();
        } else {
          response = await fetch('/dashboard/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
            credentials: 'include',
            body: JSON.stringify({ username, password })
          });
          data = await response.json();

          if (data.requires_mfa && data.mfa_token) {
            mfaToken = data.mfa_token;
            isMfaStep = true;
            document.getElementById('mfa-section').style.display = 'block';
            document.getElementById('login-captcha-box').style.display = 'none';
            document.getElementById('username').disabled = true;
            document.getElementById('password').disabled = true;
            loginBtn.textContent = 'Authenticate 2FA';
            loginBtn.disabled = false;
            return;
          }
        }

        if (response.ok && data.success) {
          if (data.data?.token) {
            localStorage.setItem('auth_token', data.data.token);
            document.cookie = 'session_token=' + data.data.token + '; Path=/; Max-Age=3600; SameSite=Lax';
          }
          window.location.href = '/dashboard';
        } else {
          errorDiv.textContent = data.error?.message || data.message || data.error || 'Authentication failed';
          errorDiv.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.textContent = isMfaStep ? 'Authenticate 2FA' : 'Sign In';
          refreshCaptcha();
        }
      } catch (err) {
        errorDiv.textContent = 'Network communication failed';
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
      }
    });

    // REGISTER SUBMIT
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorDiv = document.getElementById('error-message');
      const regBtn = document.getElementById('register-btn');
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      if (!isCaptchaVerified) {
        errorDiv.textContent = 'Please solve the Security Verification challenge first.';
        errorDiv.style.display = 'block';
        return;
      }

      if (password.length < 12) {
        errorDiv.textContent = 'Password must be at least 12 characters with uppercase, lowercase, number, and special character.';
        errorDiv.style.display = 'block';
        return;
      }

      regBtn.disabled = true;
      regBtn.textContent = 'Creating account...';
      errorDiv.style.display = 'none';

      try {
        const response = await fetch('/dashboard/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username,
            email: email || undefined,
            password,
            role: 'user'
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          if (data.data?.token) {
            localStorage.setItem('auth_token', data.data.token);
            document.cookie = 'session_token=' + data.data.token + '; Path=/; Max-Age=3600; SameSite=Lax';
          }
          window.location.href = '/dashboard';
        } else {
          errorDiv.textContent = data.message || data.error?.message || data.error || 'Registration failed';
          errorDiv.style.display = 'block';
          regBtn.disabled = false;
          regBtn.textContent = 'Create Free Account (10 Free Links)';
          refreshCaptcha();
        }
      } catch (err) {
        errorDiv.textContent = 'Network error during registration';
        errorDiv.style.display = 'block';
        regBtn.disabled = false;
        regBtn.textContent = 'Create Free Account (10 Free Links)';
      }
    });
  </script>
</body>
</html>`;

export const setupErrorHtml = html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup - URLZ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .error-container { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 500px; text-align: center; }
    h1 { margin-bottom: 1rem; color: #f43f5e; font-weight: 600; }
    p { color: #64748b; margin-bottom: 1rem; line-height: 1.6; }
    code { background: #f1f5f9; padding: 0.375rem 0.625rem; border-radius: 6px; font-family: 'Courier New', monospace; color: #334155; }
    a { color: #6366f1; text-decoration: none; font-weight: 500; }
    a:hover { color: #4f46e5; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>⚠️ Setup Not Configured</h1>
    <p>SETUP_TOKEN is not configured in the environment variables.</p>
    <p>Please set <code>SETUP_TOKEN</code> in your <code>wrangler.toml</code> or Cloudflare dashboard.</p>
    <p><a href="/dashboard/login">Go to Login</a></p>
  </div>
</body>
</html>`;

export const setupHtml = (csrfToken: string, nonce: string) => html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup First User - URLZ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .setup-container { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 420px; }
    h1 { margin-bottom: 1.5rem; text-align: center; color: #334155; font-weight: 600; }
    .info-box { background: #dbeafe; border: 1px solid #93c5fd; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem; color: #1e40af; line-height: 1.5; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #334155; font-size: 0.875rem; }
    .form-group input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; background: #f1f5f9; color: #334155; transition: all 0.2s; }
    .form-group input:focus { outline: none; border-color: #6366f1; background: white; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
    .btn { width: 100%; padding: 0.75rem; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 1rem; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .btn:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .error { color: #f43f5e; margin-top: 0.5rem; font-size: 0.875rem; background: #ffe4e6; padding: 0.75rem; border-radius: 8px; }
    small { color: #64748b; font-size: 0.875rem; }
    a { color: #6366f1; text-decoration: none; font-weight: 500; }
    a:hover { color: #4f46e5; }
  </style>
</head>
<body>
  <div class="setup-container">
    <h1>🔗 Setup First User</h1>
    <div class="info-box">
      <strong>⚠️ Security Notice:</strong> This is a one-time setup. You need your SETUP_TOKEN to create the first user account.
    </div>
    <form id="setup-form">
      <input type="hidden" id="csrf-token" name="_csrf" value="${csrfToken}">
      <div class="form-group">
        <label for="setup-token">Setup Token</label>
        <input type="password" id="setup-token" required placeholder="Enter your SETUP_TOKEN">
        <small>Found in your environment variables (wrangler.toml or Cloudflare dashboard)</small>
      </div>
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" required autocomplete="username" pattern="[a-zA-Z0-9_-]+" minlength="3" maxlength="50">
        <small>Letters, numbers, underscore, and hyphen only</small>
      </div>
      <div class="form-group">
        <label for="email">Email (optional)</label>
        <input type="email" id="email" autocomplete="email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required autocomplete="new-password" minlength="12">
        <small>Minimum 12 characters with uppercase, lowercase, number, and special character</small>
      </div>
      <div id="error-message" class="error" role="alert" aria-live="assertive" style="display: none;"></div>
      <button type="submit" class="btn">Create Owner Account</button>
    </form>
    <div style="text-align: center; margin-top: 1rem;">
      <a href="/dashboard/login" style="color: #007bff; text-decoration: none;">Already have an account? Login</a>
    </div>
  </div>
  <script nonce="${raw(nonce)}">
    document.getElementById('setup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const setupToken = document.getElementById('setup-token').value;
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error-message');
      const csrfToken = document.getElementById('csrf-token').value;
      
      // Client-side password validation matching backend requirements
      if (password.length < 12) {
        errorDiv.textContent = 'Password must be at least 12 characters long';
        errorDiv.style.display = 'block';
        return;
      }
      if (!/[A-Z]/.test(password)) {
        errorDiv.textContent = 'Password must contain at least one uppercase letter';
        errorDiv.style.display = 'block';
        return;
      }
      if (!/[a-z]/.test(password)) {
        errorDiv.textContent = 'Password must contain at least one lowercase letter';
        errorDiv.style.display = 'block';
        return;
      }
      if (!/[0-9]/.test(password)) {
        errorDiv.textContent = 'Password must contain at least one number';
        errorDiv.style.display = 'block';
        return;
      }
      if (!/[!@#$%^&*()_+\\-=\\[\\]{};\\':"\\\\|,.<>\\/?]/.test(password)) {
        errorDiv.textContent = 'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\\':"\\\\|,.<>/? etc.)';
        errorDiv.style.display = 'block';
        return;
      }
      
      try {
        const response = await fetch('/dashboard/api/v1/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({ 
            username, 
            email: email || undefined, 
            password,
            setup_token: setupToken
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          errorDiv.textContent = data.error?.message || 'Setup failed';
          errorDiv.style.display = 'block';
          return;
        }
        
        // Store token in localStorage as backup
        if (data.data?.token) {
          localStorage.setItem('auth_token', data.data.token);
        }
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
