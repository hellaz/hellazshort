import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../api';
import { UserCheck, ShieldAlert, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  user: User;
  onProfileUpdated: (updatedUser: any) => void;
  onNavigateToSettings: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  onProfileUpdated,
  onNavigateToSettings,
}) => {
  const isPlaceholderUsername = Boolean(user?.username?.match(/^(google|facebook|twitter|github)_/));
  const isPlaceholderEmail = Boolean(user?.email?.endsWith('@urlz.eu.org'));

  const [username, setUsername] = useState(isPlaceholderUsername ? '' : user?.username || '');
  const [email, setEmail] = useState(isPlaceholderEmail ? '' : user?.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPlaceholderUsername) setUsername('');
    else setUsername(user?.username || '');

    if (isPlaceholderEmail) setEmail('');
    else setEmail(user?.email || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Please choose a valid username (at least 3 characters).');
      return;
    }

    if (cleanUsername.match(/^(google|facebook|twitter|github)_/i)) {
      setError('Username cannot start with system prefixes like "google_".');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.endsWith('@urlz.eu.org')) {
      setError('Please enter your valid personal or work email address.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest('auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          username: cleanUsername,
          email: cleanEmail,
        }),
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
      } else {
        setError(res.error || 'Failed to update profile. Please try a different username.');
      }
    } catch {
      setError('Network error while updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <UserCheck className="w-8 h-8 animate-bounce-short" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span>Complete Your Profile</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              You've signed in via federated social login. Set your custom username and primary email address to get full access to URLZ.
            </p>
          </div>
        </div>

        {/* Current status badges */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium">Temporary Username:</span>
            <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400">
              {user?.username || 'google_user'}
            </code>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium">Temporary Email:</span>
            <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400">
              {user?.email || 'google_user@urlz.eu.org'}
            </code>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Choose Public Username *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={30}
              placeholder="e.g. alex_dev or brandmaster"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Real Contact Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Save Profile & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="text-[11px] text-slate-500 hover:text-indigo-500 underline cursor-pointer"
          >
            Or open full Settings page
          </button>
        </div>
      </div>
    </div>
  );
};
