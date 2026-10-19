import React, { useState, useEffect } from 'react';
import { User, AuditLog, StatusCheckSettings, RootPageSettings } from '../types';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Settings,
  Shield,
  Key,
  Users,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  UserCheck,
  Trash2,
  RefreshCw,
  Activity,
  Plus,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingsViewProps {
  user: User | null;
  subPage?: string;
  onUserUpdated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  subPage = 'account',
  onUserUpdated,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(subPage);

  // Account State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA / MFA State
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaQrUri, setMfaQrUri] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);

  // Root Page State
  const [rootMode, setRootMode] = useState<'branded' | 'redirect' | 'html'>('branded');
  const [rootRedirectUrl, setRootRedirectUrl] = useState('');
  const [rootHtml, setRootHtml] = useState('');
  const [rootSaving, setRootSaving] = useState(false);

  // Users Management State (Owner/Admin)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Captcha & Safety Filters State
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [captchaProvider, setCaptchaProvider] = useState<'built_in' | 'turnstile' | 'recaptcha' | 'solvemedia'>('built_in');
  const [captchaSiteKey, setCaptchaSiteKey] = useState('');
  const [captchaSecretKey, setCaptchaSecretKey] = useState('');
  const [blockedDomainsInput, setBlockedDomainsInput] = useState('');
  const [captchaSaving, setCaptchaSaving] = useState(false);

  // Status Check Configuration State
  const [statusCheckEnabled, setStatusCheckEnabled] = useState(true);
  const [statusCheckFrequencyValue, setStatusCheckFrequencyValue] = useState(1);
  const [statusCheckFrequencyUnit, setStatusCheckFrequencyUnit] = useState<'days' | 'weeks'>('days');
  const [statusCheckTop100Daily, setStatusCheckTop100Daily] = useState(false);
  const [statusCheckBatchSize, setStatusCheckBatchSize] = useState(100);
  const [statusCheckLabel, setStatusCheckLabel] = useState('Every 1 Day');
  const [statusCheckLastUpdated, setStatusCheckLastUpdated] = useState<number | null>(null);
  const [statusCheckSaving, setStatusCheckSaving] = useState(false);
  const [statusCheckTesting, setStatusCheckTesting] = useState(false);
  const [statusCheckTestResult, setStatusCheckTestResult] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(subPage);
  }, [subPage]);

  // Load Settings on mount
  useEffect(() => {
    if (activeTab === 'status-check' && (user?.role === 'owner' || user?.role === 'admin')) {
      fetchStatusCheckSettings();
    }

    if (activeTab === 'default-page' || activeTab === 'root-page') {
      apiRequest('settings/root-page').then((res) => {
        if (res.success && res.data) {
          setRootMode(res.data.mode || 'branded');
          setRootRedirectUrl(res.data.redirect_url || '');
          setRootHtml(res.data.html || '');
        }
      });
    }

    if (activeTab === 'captcha') {
      apiRequest('settings/captcha').then((res) => {
        if (res.success && res.data) {
          setCaptchaEnabled(res.data.enabled !== false);
          setCaptchaProvider(res.data.provider || 'built_in');
          setCaptchaSiteKey(res.data.site_key || '');
          setCaptchaSecretKey(res.data.secret_key || '');
          setBlockedDomainsInput(Array.isArray(res.data.blocked_domains) ? res.data.blocked_domains.join(', ') : '');
        }
      });
    }

    if (activeTab === 'users' && (user?.role === 'owner' || user?.role === 'admin')) {
      fetchUsers();
    }

    if (activeTab === 'audit' && (user?.role === 'owner' || user?.role === 'admin')) {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchStatusCheckSettings = async () => {
    try {
      const res = await apiRequest('settings/status-check-frequency');
      if (res.success && res.data) {
        setStatusCheckEnabled(res.data.enabled !== false);
        if (res.data.frequency) {
          setStatusCheckFrequencyValue(res.data.frequency.value || 1);
          setStatusCheckFrequencyUnit(res.data.frequency.unit || 'days');
        }
        setStatusCheckTop100Daily(Boolean(res.data.check_top_100_daily));
        setStatusCheckBatchSize(res.data.batch_size || 100);
        setStatusCheckLabel(res.data.frequency_label || 'Every 1 Day');
        setStatusCheckLastUpdated(res.data.last_updated_at || null);
      }
    } catch {
      // Ignored
    }
  };

  const handleSaveStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusCheckSaving(true);
    try {
      const res = await apiRequest('settings/status-check-frequency', {
        method: 'PUT',
        body: JSON.stringify({
          frequency: {
            value: Number(statusCheckFrequencyValue) || 1,
            unit: statusCheckFrequencyUnit,
          },
          enabled: statusCheckEnabled,
          check_top_100_daily: statusCheckTop100Daily,
          batch_size: Number(statusCheckBatchSize) || 100,
        }),
      });
      if (res.success) {
        showToast('Status check settings updated successfully!', 'success');
        if (res.data?.frequency_label) {
          setStatusCheckLabel(res.data.frequency_label);
        }
      } else {
        showToast(res.error || 'Failed to update status check settings', 'error');
      }
    } catch {
      showToast('Network error saving status check settings', 'error');
    } finally {
      setStatusCheckSaving(false);
    }
  };

  const handleRunManualStatusCheck = async () => {
    setStatusCheckTesting(true);
    setStatusCheckTestResult(null);
    try {
      const res = await apiRequest('links/check-status', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (res.success) {
        const checkedCount = res.data?.checked || 0;
        showToast(`Health check complete! Verified ${checkedCount} link(s).`, 'success');
        setStatusCheckTestResult(`Verified ${checkedCount} link(s). Any dead or broken links are flagged on the Link Monitor.`);
      } else {
        showToast(res.error || 'Failed to run status check', 'error');
        setStatusCheckTestResult(`Error: ${res.error || 'Failed to execute status check'}`);
      }
    } catch {
      showToast('Network error triggering status check', 'error');
      setStatusCheckTestResult('Network error while running status check');
    } finally {
      setStatusCheckTesting(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await apiRequest('users');
      if (res.success && Array.isArray(res.data)) {
        setAllUsers(res.data);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await apiRequest('auth/audit?limit=100');
      if (res.success && Array.isArray(res.data?.logs || res.data)) {
        setAuditLogs(res.data?.logs || res.data);
      }
    } finally {
      setAuditLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiRequest('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (res.success) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.error || 'Failed to change password', 'error');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Setup 2FA / MFA
  const handleInitiateMfa = async () => {
    setMfaLoading(true);
    try {
      const res = await apiRequest('auth/mfa/setup', { method: 'POST' });
      if (res.success && res.data) {
        setMfaSecret(res.data.secret);
        setMfaQrUri(res.data.qr_code_uri || res.data.otpauth_url);
      } else {
        showToast(res.error || 'Failed to initiate 2FA setup', 'error');
      }
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || !mfaSecret) return;

    setMfaLoading(true);
    try {
      const res = await apiRequest('auth/mfa/verify-setup', {
        method: 'POST',
        body: JSON.stringify({
          secret: mfaSecret,
          code: mfaCode.trim(),
        }),
      });

      if (res.success) {
        showToast('Two-factor authentication enabled!', 'success');
        if (res.data?.backup_codes) {
          setMfaBackupCodes(res.data.backup_codes);
        }
        setMfaSecret(null);
        setMfaQrUri(null);
        if (onUserUpdated) onUserUpdated();
      } else {
        showToast(res.error || 'Invalid 6-digit code. Please try again.', 'error');
      }
    } finally {
      setMfaLoading(false);
    }
  };

  // Save Root Page Settings
  const handleSaveRootPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setRootSaving(true);
    try {
      const res = await apiRequest('settings/root-page', {
        method: 'PUT',
        body: JSON.stringify({
          mode: rootMode,
          redirect_url: rootMode === 'redirect' ? rootRedirectUrl : undefined,
          html: rootMode === 'html' ? rootHtml : undefined,
        }),
      });

      if (res.success) {
        showToast('Root page configuration saved!', 'success');
      } else {
        showToast(res.error || 'Failed to save settings', 'error');
      }
    } finally {
      setRootSaving(false);
    }
  };

  const handleSaveCaptchaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaptchaSaving(true);
    try {
      const res = await apiRequest('settings/captcha', {
        method: 'POST',
        body: JSON.stringify({
          enabled: captchaEnabled,
          provider: captchaProvider,
          site_key: captchaSiteKey,
          secret_key: captchaSecretKey,
          blocked_domains: blockedDomainsInput.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.success) {
        showToast('Captcha & security filter settings saved successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to save captcha settings', 'error');
      }
    } finally {
      setCaptchaSaving(false);
    }
  };

  // Add User (Owner/Admin)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newUserEmail.trim() || undefined,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (res.success) {
        showToast(`User ${newUsername} created!`, 'success');
        setIsAddUserModalOpen(false);
        setNewUsername('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
      } else {
        showToast(res.error || 'Failed to create user', 'error');
      }
    } catch {
      showToast('Network error creating user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>System &amp; Security Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure security, 2FA, root landing behavior, users, and audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold pb-1 scrollbar-none">
        {[
          { id: 'account', label: 'Account Information', icon: UserCheck },
          { id: 'security', label: 'Security & 2FA', icon: Shield },
          ...(user?.role === 'owner' || user?.role === 'admin'
            ? [
                { id: 'status-check', label: 'Status Check Config', icon: Activity },
                { id: 'captcha', label: 'Captcha & Safety Filters', icon: Shield },
                { id: 'default-page', label: 'Default Root Page', icon: Sliders },
                { id: 'users', label: 'User Management', icon: Users },
                { id: 'audit', label: 'Audit Log', icon: FileText },
              ]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACCOUNT INFORMATION */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Profile Details</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-0.5">Username</label>
                <div className="font-bold text-slate-900 dark:text-white text-sm bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {user?.username}
                </div>
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5">Email Address</label>
                <div className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  {user?.email || 'No email attached'}
                </div>
              </div>
              <div>
                <label className="text-slate-500 block mb-0.5">Role Permission</label>
                <span className="inline-block px-2.5 py-1 rounded-full uppercase font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Change Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & 2FA */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Multi-Factor Authentication (MFA / 2FA)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Protect your URLZ administration account with TOTP (Google Authenticator, Authy, 1Password)
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user?.mfa_enabled
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {user?.mfa_enabled ? '2FA Enabled' : '2FA Disabled'}
            </span>
          </div>

          {!user?.mfa_enabled && !mfaQrUri && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Enhance account security by requiring a 6-digit one-time passcode whenever logging in.
              </p>
              <button
                onClick={handleInitiateMfa}
                disabled={mfaLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                {mfaLoading ? 'Generating QR...' : 'Enable Two-Factor Authentication'}
              </button>
            </div>
          )}

          {mfaQrUri && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 max-w-md">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Step 1: Scan QR Code with Authenticator App
              </h4>
              <div className="bg-white p-3 rounded-xl inline-block shadow-xs">
                <QRCodeSVG value={mfaQrUri} size={180} level="M" />
              </div>
              <div className="text-xs font-mono text-slate-500 break-all bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                Secret: {mfaSecret}
              </div>

              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider pt-2">
                Step 2: Enter 6-digit Verification Code
              </h4>
              <form onSubmit={handleVerifyMfa} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest font-mono text-lg py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  type="submit"
                  disabled={mfaLoading || mfaCode.length !== 6}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  {mfaLoading ? 'Verifying...' : 'Verify & Activate 2FA'}
                </button>
              </form>
            </div>
          )}

          {mfaBackupCodes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                Save Your 8-digit Backup Codes
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                If you lose your device, you can use these one-time codes to sign in.
              </p>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {mfaBackupCodes.map((code, idx) => (
                  <span key={idx} className="bg-white dark:bg-slate-900 p-1.5 rounded border text-center font-bold">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEFAULT ROOT PAGE */}
      {activeTab === 'default-page' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Domain Root Page Behavior</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Choose what visitors see when they open your root domain (e.g. urlz.eu.org without a slug)
            </p>
          </div>

          <form onSubmit={handleSaveRootPage} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'branded', label: 'Branded Welcome Page', desc: 'Modern public landing page with link shortener' },
                { id: 'redirect', label: 'Redirect to URL', desc: 'Forward root visitors immediately to a custom destination' },
                { id: 'html', label: 'Custom HTML Page', desc: 'Render your own custom styled HTML markup' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                    rootMode === opt.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 font-semibold ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="rootMode"
                    value={opt.id}
                    checked={rootMode === opt.id}
                    onChange={() => setRootMode(opt.id as any)}
                    className="sr-only"
                  />
                  <div className="font-bold mb-1">{opt.label}</div>
                  <div className="text-[11px] opacity-75 font-normal">{opt.desc}</div>
                </label>
              ))}
            </div>

            {rootMode === 'redirect' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Forward Destination URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/company-home"
                  value={rootRedirectUrl}
                  onChange={(e) => setRootRedirectUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}

            {rootMode === 'html' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom HTML Markup
                </label>
                <textarea
                  rows={6}
                  placeholder="<!DOCTYPE html><html><body><h1>Welcome</h1></body></html>"
                  value={rootHtml}
                  onChange={(e) => setRootHtml(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={rootSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer transition-colors"
            >
              {rootSaving ? 'Saving...' : 'Save Root Page Config'}
            </button>
          </form>
        </div>
      )}

      {/* TAB: STATUS CHECK CONFIG */}
      {activeTab === 'status-check' && (user?.role === 'owner' || user?.role === 'admin') && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Automated Link Health &amp; Status Monitor Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure background worker tasks that automatically ping shortened link destinations to detect 404s, timeouts, and broken URLs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  statusCheckEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    statusCheckEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {statusCheckEnabled ? 'Monitoring Active' : 'Monitoring Paused'}
              </span>
            </div>
          </div>

          {/* Test Check Banner */}
          {statusCheckTestResult && (
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{statusCheckTestResult}</span>
              </div>
              <button
                onClick={() => setStatusCheckTestResult(null)}
                className="text-indigo-400 hover:text-indigo-200 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSaveStatusCheck} className="space-y-5 text-xs">
            {/* Enable switch */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusCheckEnabled}
                  onChange={(e) => setStatusCheckEnabled(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block text-sm">
                    Enable Automatic Background Health Verification
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    When active, links will be queued and tested automatically according to the frequency schedule below.
                  </span>
                </div>
              </label>
            </div>

            {/* Frequency selection */}
            <div className="space-y-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Check Frequency Schedule
              </label>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Every 1 Day', val: 1, unit: 'days' as const },
                  { label: 'Every 3 Days', val: 3, unit: 'days' as const },
                  { label: 'Every 1 Week', val: 1, unit: 'weeks' as const },
                  { label: 'Every 2 Weeks', val: 2, unit: 'weeks' as const },
                  { label: 'Every 30 Days', val: 30, unit: 'days' as const },
                ].map((preset) => {
                  const isSelected =
                    statusCheckFrequencyValue === preset.val &&
                    statusCheckFrequencyUnit === preset.unit;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setStatusCheckFrequencyValue(preset.val);
                        setStatusCheckFrequencyUnit(preset.unit);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Interval */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-slate-500 text-xs">Or custom interval:</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={statusCheckFrequencyValue}
                  onChange={(e) => setStatusCheckFrequencyValue(parseInt(e.target.value, 10) || 1)}
                  className="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-center font-mono font-bold"
                />
                <select
                  value={statusCheckFrequencyUnit}
                  onChange={(e) => setStatusCheckFrequencyUnit(e.target.value as any)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
                <span className="text-slate-400 text-xs">
                  (Currently: <strong className="text-indigo-500">{statusCheckLabel}</strong>)
                </span>
              </div>
            </div>

            {/* Check Top 100 Daily */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusCheckTop100Daily}
                  onChange={(e) => setStatusCheckTop100Daily(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Daily High-Traffic Priority Pass
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Regardless of standard frequency, always test the top 100 most clicked links daily to protect active marketing campaigns.
                  </span>
                </div>
              </label>
            </div>

            {/* Batch Size */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batch Size per Execution Run (10 – 1000 links)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={10}
                  max={1000}
                  step={10}
                  value={statusCheckBatchSize}
                  onChange={(e) => setStatusCheckBatchSize(parseInt(e.target.value, 10) || 100)}
                  className="w-32 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500">
                  Default: 100 links per run. Limits concurrent outbound requests to stay well within cloud edge timeouts.
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={statusCheckSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {statusCheckSaving ? 'Saving Config...' : 'Save Status Check Config'}
              </button>

              <button
                type="button"
                onClick={handleRunManualStatusCheck}
                disabled={statusCheckTesting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-300 dark:border-slate-600 cursor-pointer transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statusCheckTesting ? 'animate-spin' : ''}`} />
                <span>{statusCheckTesting ? 'Executing Batch Check...' : 'Run Health Check Now'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: CAPTCHA & SAFETY FILTERS */}
      {activeTab === 'captcha' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Anti-Bot Captcha &amp; Domain Filter System</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure anti-spam captcha challenges for anonymous link creation and define custom domain blacklists.
            </p>
          </div>

          <form onSubmit={handleSaveCaptchaSettings} className="space-y-5 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={captchaEnabled}
                  onChange={(e) => setCaptchaEnabled(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Require Captcha Verification for Anonymous / Guest Users
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Registered logged-in users bypass captcha automatically for frictionless link creation.
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Captcha Provider Engine
                </label>
                <select
                  value={captchaProvider}
                  onChange={(e) => setCaptchaProvider(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="built_in">Built-In Math Security Challenge (Zero External Keys Needed)</option>
                  <option value="turnstile">Cloudflare Turnstile</option>
                  <option value="recaptcha">Google reCAPTCHA v2 / v3</option>
                  <option value="solvemedia">SolveMedia Captcha</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Site Key (Optional for External Captchas)
                </label>
                <input
                  type="text"
                  placeholder="0x4AAAAAA..."
                  value={captchaSiteKey}
                  onChange={(e) => setCaptchaSiteKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Secret Key (Optional for External Captchas)
              </label>
              <input
                type="password"
                placeholder="0x4AAAAAA..."
                value={captchaSecretKey}
                onChange={(e) => setCaptchaSecretKey(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Domain &amp; TLD Blacklist (Comma separated)
              </label>
              <textarea
                rows={3}
                placeholder="badsite.com, grabify.link, iplogger.org, spam-domain.net"
                value={blockedDomainsInput}
                onChange={(e) => setBlockedDomainsInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Restricted TLDs (.zip, .mov, .su, .xyz, etc.) and malware/phishing keywords are automatically blocked by default.
              </p>
            </div>

            <button
              type="submit"
              disabled={captchaSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
            >
              {captchaSaving ? 'Saving Settings...' : 'Save Security Settings'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: USER MANAGEMENT */}
      {activeTab === 'users' && (user?.role === 'owner' || user?.role === 'admin') && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin &amp; Team Users</h3>
              <p className="text-xs text-slate-500">Manage user access and administrative roles</p>
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {allUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{u.username}</span>
                  <span className="text-slate-400 text-[11px]">{u.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {u.role}
                  </span>
                  {u.mfa_enabled && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      2FA Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add User Modal */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New User</h3>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="user">User (Link creator)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (user?.role === 'owner' || user?.role === 'admin') && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Security &amp; System Audit Log</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
            {auditLoading ? (
              <p className="text-slate-400 py-6 text-center">Loading audit events...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">No audit log records recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {log.event_type}
                    </span>
                    <span className="text-slate-400 ml-2">by user: {log.user_id || 'system'}</span>
                    {log.ip_address && <span className="text-slate-500 ml-2">({log.ip_address})</span>}
                  </div>
                  <span className="text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* ACCESS DENIED FALLBACK FOR REGULAR USERS VISITING ADMIN TABS */}
      {['status-check', 'captcha', 'default-page', 'users', 'audit'].includes(activeTab) &&
        user?.role !== 'owner' &&
        user?.role !== 'admin' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Administrator Access Required</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This system configuration panel is restricted to platform administrators and owners. Regular users can manage personal profile and credentials from the Account Information tab.
            </p>
            <button
              onClick={() => setActiveTab('account')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Return to Account Information
            </button>
          </div>
        )}
    </div>
  );
};
