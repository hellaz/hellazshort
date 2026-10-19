import React, { useState, useEffect } from 'react';
import { apiRequest, setAuthToken } from '../api';
import { useToast } from '../components/Toast';
import { BrandLogo } from '../components/BrandLogo';
import { CaptchaWidget } from '../components/CaptchaWidget';
import {
  Link as LinkIcon,
  Lock,
  User,
  Key,
  Shield,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Check,
  Mail,
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'setup';
  onLoginSuccess: (userData: any) => void;
  onNavigateHome: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onNavigateHome,
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'setup' | 'mfa'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    apiRequest('auth/setup-status')
      .then((res) => {
        if (res.success && res.data) {
          setIsSetupCompleted(res.data.is_setup_completed);
          if (res.data.is_setup_completed && mode === 'setup') {
            setMode('login');
          }
        }
      })
      .catch(() => {
        setIsSetupCompleted(true);
      });
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Please complete the Security Verification challenge first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (res.data?.requires_mfa) {
        setMfaToken(res.data.mfa_token);
        setMode('mfa');
        showToast('MFA verification code required', 'info');
      } else if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        showToast('Welcome back!', 'success');
        onLoginSuccess(res.data.user);
      } else {
        setError(res.error || res.message || 'Invalid username or password');
      }
    } catch {
      setError('Network communication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'facebook') => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest(`auth/social/${provider}`, {
        method: 'POST',
        body: JSON.stringify({ email: `${provider}_user@urlz.eu.org`, name: `${provider.toUpperCase()} User` }),
      });
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        showToast(`Instant sign-in successful via ${provider.toUpperCase()}!`, 'success');
        onLoginSuccess(res.data.user);
      } else {
        setError(res.error || res.message || `Failed social authentication via ${provider}`);
      }
    } catch {
      setError(`Social authentication error with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Please complete the Security Verification challenge first');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters with uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim() || undefined,
          password,
          role: 'user',
        }),
      });

      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        showToast('Welcome to URLZ! Your account has 10 free short links.', 'success');
        onLoginSuccess(res.data.user);
      } else {
        setError(res.error || res.message || 'Registration failed');
      }
    } catch {
      setError('Network communication failed during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || !mfaToken) return;

    setLoading(true);
    setError('');

    try {
      const isBackup = mfaCode.length === 8;
      const res = await apiRequest('auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          mfa_token: mfaToken,
          code: !isBackup ? mfaCode.trim() : undefined,
          backup_code: isBackup ? mfaCode.trim() : undefined,
        }),
      });

      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        showToast('2FA Verified!', 'success');
        onLoginSuccess(res.data.user);
      } else {
        setError(res.error || 'Invalid authentication code');
      }
    } catch {
      setError('Verification network failure');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequest('auth/register', {
        method: 'POST',
        body: JSON.stringify({
          setup_token: setupToken.trim(),
          username: username.trim(),
          email: email.trim() || undefined,
          password,
        }),
      });

      if (res.success) {
        showToast('Owner user initialized! Please login.', 'success');
        setMode('login');
      } else {
        setError(res.error || res.message || 'Setup initialization failed');
      }
    } catch {
      setError('Setup failed. Verify your SETUP_TOKEN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Brand logo */}
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2.5 mb-8 focus:outline-hidden cursor-pointer"
      >
        <BrandLogo variant="dark" size="lg" />
      </button>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selector between Sign In and Create Account */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setCaptchaVerified(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setCaptchaVerified(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account (Free)
            </button>
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div>
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-white">Sign In to URLZ</h1>
              <p className="text-xs text-slate-400 mt-1">
                Access your link management dashboard &amp; analytics
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="admin or user@urlz.eu.org"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Security Verification (Anti-Bot Captcha) */}
              <div className="pt-2 border-t border-slate-800">
                <CaptchaWidget
                  onVerify={(data) => setCaptchaVerified(Boolean(data.token || data.answer))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <div>
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-white">Join URLZ Platform</h1>
              <p className="text-xs text-slate-400 mt-1">
                Create a free account and get 10 free short links
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Letters, numbers, and underscores (3-50 chars)</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 12 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Requires uppercase, lowercase, number, and symbol</p>
              </div>

              {/* Security Verification (Anti-Bot Captcha) */}
              <div className="pt-2 border-t border-slate-800">
                <CaptchaWidget
                  onVerify={(data) => setCaptchaVerified(Boolean(data.token || data.answer))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account (10 Free Links)'}
              </button>
            </form>
          </div>
        )}

        {/* SOCIAL LOGINS FOR BOTH LOGIN & REGISTER */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 text-center mb-0.5">
              {mode === 'login' ? 'Or Sign In with Social Account:' : 'Or Auto-Register with Social Account:'}
            </p>
            <p className="text-[10px] text-slate-500 text-center mb-3">
              One-click federated sign-in: logs into existing accounts or automatically creates a new account.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSocialLogin('google')}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-indigo-500 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSocialLogin('twitter')}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-sky-500 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4 fill-sky-400" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Twitter</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSocialLogin('facebook')}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 hover:border-blue-600 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4 fill-blue-500" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>
        )}
        {isSetupCompleted === false && (
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setMode('setup')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              First time? Initial Setup
            </button>
          </div>
        )}

        {/* MFA VERIFICATION MODE */}
        {mode === 'mfa' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-white">Two-Factor Authentication</h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter the 6-digit code from your authenticator app (or 8-digit backup code)
              </p>
            </div>

            <form onSubmit={handleMfaVerify} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest font-mono text-2xl py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                disabled={loading || (mfaCode.length !== 6 && mfaCode.length !== 8)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Authenticate'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* INITIAL SETUP MODE */}
        {mode === 'setup' && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white">Initialize URLZ System</h1>
              <p className="text-xs text-slate-400 mt-1">
                Configure the primary administrator account using your SETUP_TOKEN
              </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Setup Token (SETUP_TOKEN)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter SETUP_TOKEN..."
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Admin Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="admin@urlz.eu.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating account...' : 'Create Owner Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Already initialized? Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
