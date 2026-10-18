import React, { useState } from 'react';
import { apiRequest, setAuthToken } from '../api';
import { useToast } from '../components/Toast';
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
  const [mode, setMode] = useState<'login' | 'setup' | 'mfa'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <LinkIcon className="w-5 h-5" />
        </div>
        <span className="text-2xl font-black tracking-tight text-white">URLZ</span>
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

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white">Administrator Sign In</h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to access the link management dashboard
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
                    placeholder="admin or admin@urlz.eu.org"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setMode('setup')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                First time? Initial Setup
              </button>
            </div>
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
