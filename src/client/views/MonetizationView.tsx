import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import {
  DollarSign,
  TrendingUp,
  Megaphone,
  Code2,
  Users,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Globe2,
  BarChart3,
  X,
  ShieldAlert,
  Check,
  HelpCircle,
  Layers,
  Settings2,
} from 'lucide-react';

import { User } from '../types';

interface MonetizationViewProps {
  user?: User | null;
  onNavigate?: (page: string) => void;
}

export const MonetizationView: React.FC<MonetizationViewProps> = ({ user, onNavigate }) => {
  const { showToast } = useToast();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'ads' | 'campaigns' | 'api' | 'referrals'>(
    isAdmin ? 'ads' : 'referrals'
  );
  const [loading, setLoading] = useState(false);

  // Platform Ad Network Settings (AdSense / Custom Script & CPM Rates)
  const [adSettings, setAdSettings] = useState({
    enabled: true,
    provider: 'adsense' as 'adsense' | 'custom' | 'none',
    adsense_client_id: '',
    adsense_slot_id: '',
    custom_ad_code: '',
    tier1_cpm: 5.0,
    tier2_cpm: 3.0,
    tier3_cpm: 1.5,
  });
  const [adSettingsLoading, setAdSettingsLoading] = useState(false);
  const [adSettingsSaving, setAdSettingsSaving] = useState(false);

  // Referral Code Application & Demo Credits
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [claimingCode, setClaimingCode] = useState(false);
  const [grantingDemoCredit, setGrantingDemoCredit] = useState(false);

  // API Upgrade Request Modal
  const [isApiRequestModalOpen, setIsApiRequestModalOpen] = useState(false);
  const [requestTier, setRequestTier] = useState<'Pro Developer' | 'Enterprise Scale'>('Pro Developer');
  const [requestContactEmail, setRequestContactEmail] = useState(user?.email || '');
  const [requestReason, setRequestReason] = useState('');
  const [requestSending, setRequestSending] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setRequestContactEmail(user.email);
    }
  }, [user]);

  const handleSendApiRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSending(true);
    try {
      const res = await apiRequest('monetization/api-request', {
        method: 'POST',
        body: JSON.stringify({
          tier: requestTier,
          email: requestContactEmail.trim() || undefined,
          reason: requestReason.trim() || undefined,
        }),
      });
      if (res.success) {
        showToast(res.message || 'Request submitted successfully!', 'success');
        setIsApiRequestModalOpen(false);
        setRequestReason('');
      } else {
        showToast(res.error || 'Failed to submit request', 'error');
      }
    } catch {
      showToast('Network error submitting request', 'error');
    } finally {
      setRequestSending(false);
    }
  };

  // Overview Data
  const [overview, setOverview] = useState<any>({
    total_clicks: 0,
    estimated_earnings: 0,
    quota: {
      free_limit: 10,
      bonus_credits: 0,
      total_limit: 10,
      used_links: 0,
      remaining_links: 10,
      is_unlimited: false,
    },
    referrals: { total_referred: 0, bonus_links_earned: 0, referral_url: '' },
    api_usage: { month_key: '', request_count: 0, monthly_limit: 0, tier_name: 'Free Community Plan', is_api_enabled: false },
  });

  // Campaigns Data
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [campTargetUrl, setCampTargetUrl] = useState('');
  const [campBannerUrl, setCampBannerUrl] = useState('');
  const [campHeading, setCampHeading] = useState('Sponsored Announcement');
  const [campMessage, setCampMessage] = useState('');
  const [campCountry, setCampCountry] = useState('ALL');
  const [campCpm, setCampCpm] = useState('3.00');
  const [campBudget, setCampBudget] = useState('100.00');
  const [creatingCamp, setCreatingCamp] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('monetization/overview');
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest('monetization/campaigns');
      if (res.success && Array.isArray(res.data)) {
        setCampaigns(res.data);
      }
    } catch {}
  };

  const fetchAdSettings = async () => {
    setAdSettingsLoading(true);
    try {
      const res = await apiRequest('monetization/ad-settings');
      if (res.success && res.data) {
        setAdSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch {} finally {
      setAdSettingsLoading(false);
    }
  };

  const handleSaveAdSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdSettingsSaving(true);
    try {
      const res = await apiRequest('monetization/ad-settings', {
        method: 'POST',
        body: JSON.stringify(adSettings),
      });
      if (res.success) {
        showToast('Ad Network and Geo CPM rates saved successfully!', 'success');
        fetchOverview();
      } else {
        showToast(res.error || 'Failed to save ad settings', 'error');
      }
    } catch {
      showToast('Network error saving ad settings', 'error');
    } finally {
      setAdSettingsSaving(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    if (activeTab === 'ads') {
      fetchAdSettings();
    } else if (activeTab === 'campaigns') {
      fetchCampaigns();
    }
  }, [activeTab]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim() || !campTargetUrl.trim()) {
      showToast('Campaign name and target URL are required.', 'error');
      return;
    }

    setCreatingCamp(true);
    try {
      const res = await apiRequest('monetization/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: campName.trim(),
          target_url: campTargetUrl.trim(),
          banner_url: campBannerUrl.trim() || undefined,
          heading: campHeading.trim(),
          message: campMessage.trim(),
          target_country: campCountry.toUpperCase(),
          cpm_rate: parseFloat(campCpm) || 3.0,
          budget_limit: parseFloat(campBudget) || 100.0,
        }),
      });

      if (res.success) {
        showToast('Advertiser campaign launched successfully!', 'success');
        setIsCampaignModalOpen(false);
        setCampName('');
        setCampTargetUrl('');
        setCampBannerUrl('');
        fetchCampaigns();
      } else {
        showToast(res.error || 'Failed to create campaign', 'error');
      }
    } finally {
      setCreatingCamp(false);
    }
  };

  const handleToggleCampaignStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const res = await apiRequest(`monetization/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.success) {
      showToast(`Campaign ${nextStatus === 'active' ? 'activated' : 'paused'}`, 'info');
      fetchCampaigns();
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const res = await apiRequest(`monetization/campaigns/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Campaign deleted.', 'success');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCodeInput.trim()) return;
    setClaimingCode(true);
    try {
      const res = await apiRequest('monetization/referrals/claim', {
        method: 'POST',
        body: JSON.stringify({ referral_code: claimCodeInput.trim() }),
      });
      if (res.success) {
        showToast(res.message || 'Referral applied successfully!', 'success');
        setClaimCodeInput('');
        fetchOverview();
      } else {
        showToast(res.error || 'Failed to apply referral', 'error');
      }
    } catch {
      showToast('Network error applying referral', 'error');
    } finally {
      setClaimingCode(false);
    }
  };

  const handleGrantDemoCredits = async () => {
    setGrantingDemoCredit(true);
    try {
      const res = await apiRequest('monetization/credits/grant', {
        method: 'POST',
        body: JSON.stringify({ amount: 50 }),
      });
      if (res.success) {
        showToast('+50 Link Creation Credits Awarded!', 'success');
        fetchOverview();
      } else {
        showToast(res.error || 'Failed to award credits', 'error');
      }
    } catch {
      showToast('Network error awarding credits', 'error');
    } finally {
      setGrantingDemoCredit(false);
    }
  };

  const handleCopyReferralUrl = () => {
    const refUrl = overview.referrals?.referral_url || `${window.location.origin}/auth?ref=${user?.username || 'user'}`;
    navigator.clipboard.writeText(refUrl);
    showToast('Affiliate referral link copied to clipboard!', 'success');
  };

  const quota = overview.quota || {
    free_limit: 10,
    bonus_credits: 0,
    total_limit: 10,
    used_links: 0,
    remaining_links: 10,
    is_unlimited: isAdmin,
  };

  const percentUsed = quota.is_unlimited
    ? 0
    : Math.min(100, Math.round((quota.used_links / (quota.total_limit || 1)) * 100));

  const availableTabs = [
    ...(isAdmin
      ? [{ id: 'ads' as const, label: 'Platform Ad Network & Geo CPM', icon: TrendingUp }]
      : []),
    { id: 'referrals' as const, label: 'Affiliate & Free Link Credits', icon: Users },
    { id: 'campaigns' as const, label: 'Advertiser Campaigns', icon: Megaphone },
    { id: 'api' as const, label: 'Paid API & Usage', icon: Code2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <span>Sponsorship &amp; Link Credits Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Configure platform ad networks, approve revenue payouts, and manage advertiser campaigns'
              : 'Earn bonus link credits via referrals to unlock creating more than 10 links, run campaigns, and track API limits'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Estimated Ad Revenue
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ${(overview.estimated_earnings ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* SHORT LINK CREATION QUOTA & CREDITS CARD */}
      <div className="bg-gradient-to-r from-indigo-900/30 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Short Link Creation Allowance
              </span>
              {quota.is_unlimited ? (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/40">
                  Unlimited (Admin)
                </span>
              ) : (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    quota.remaining_links === 0
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {quota.remaining_links} Links Available
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {quota.is_unlimited
                ? `${quota.used_links} Short Links Created (Unlimited)`
                : `${quota.used_links} of ${quota.total_limit} Free Short Links Used (${quota.remaining_links} remaining)`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGrantDemoCredits}
              disabled={grantingDemoCredit}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Add test referral credits (+50 links)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{grantingDemoCredit ? 'Adding Credits...' : 'Claim +50 Referral Credits'}</span>
            </button>
            <button
              onClick={handleCopyReferralUrl}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Affiliate Link</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {!quota.is_unlimited && (
          <div className="space-y-1.5">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${
                  percentUsed >= 100
                    ? 'bg-red-500'
                    : percentUsed >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{percentUsed}% Quota Utilized</span>
              <span>
                Free Allowance: 10 Links + {quota.bonus_credits} Referral Credits = {quota.total_limit} Max
              </span>
            </div>
          </div>
        )}

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Base Free Links</span>
            <span className="text-base font-bold font-mono text-white">10 Links</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Referral Credits Earned</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              +{quota.bonus_credits} Links
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Quota</span>
            <span className="text-base font-bold font-mono text-indigo-400">
              {quota.is_unlimited ? 'Unlimited' : `${quota.total_limit} Links`}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Remaining Available</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {quota.is_unlimited ? 'Unlimited' : `${quota.remaining_links} Links`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold pb-1 scrollbar-none">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AD NETWORK & GEO CPM */}
      {activeTab === 'ads' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Total Ad Clicks</span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {(overview?.total_clicks ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Estimated Net Revenue</span>
              <span className="text-2xl font-bold font-mono text-emerald-500">
                ${(overview?.estimated_earnings ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Payout Status</span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                  Minimum $50.00
                </span>
              </div>
              <button
                disabled={(overview?.estimated_earnings ?? 0) < 50}
                onClick={() => showToast('Payout request submitted to administrator!', 'success')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Admin Ad Network & AdSense Configuration */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Platform Ad Network &amp; AdSense Integration</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure Google AdSense or external ad network tags to automatically display on branded splash pages.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adSettings.enabled}
                      onChange={(e) => setAdSettings({ ...adSettings, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {adSettings.enabled ? 'Network Active' : 'Network Paused'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveAdSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ad Network Provider
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setAdSettings({ ...adSettings, provider: 'adsense' })}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        adSettings.provider === 'adsense'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-sm">Google AdSense</span>
                      <span className="text-[11px] opacity-75 font-normal">Native responsive display banners</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdSettings({ ...adSettings, provider: 'custom' })}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        adSettings.provider === 'custom'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-sm">Custom Ad Script / Tag</span>
                      <span className="text-[11px] opacity-75 font-normal">PropellerAds, Adsterra, PopAds, or HTML</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdSettings({ ...adSettings, provider: 'none' })}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        adSettings.provider === 'none'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-sm">No Global Ads</span>
                      <span className="text-[11px] opacity-75 font-normal">Only show individual link banner images</span>
                    </button>
                  </div>
                </div>

                {adSettings.provider === 'adsense' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Google AdSense Publisher ID (Client ID)
                      </label>
                      <input
                        type="text"
                        placeholder="ca-pub-1234567890123456"
                        value={adSettings.adsense_client_id}
                        onChange={(e) => setAdSettings({ ...adSettings, adsense_client_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Found in your Google AdSense account under Settings &rarr; Account Info.
                      </span>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        AdSense Ad Unit Slot ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="1234567890"
                        value={adSettings.adsense_slot_id}
                        onChange={(e) => setAdSettings({ ...adSettings, adsense_slot_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Specific display banner slot. If empty, responsive auto-ads will render.
                      </span>
                    </div>
                  </div>
                )}

                {adSettings.provider === 'custom' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Ad Network JavaScript / HTML Embed Tag
                    </label>
                    <textarea
                      rows={4}
                      placeholder={`<script type="text/javascript" src="//network.com/ad.js"></script>\n<div id="ad-unit"></div>`}
                      value={adSettings.custom_ad_code}
                      onChange={(e) => setAdSettings({ ...adSettings, custom_ad_code: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Raw script snippet from any ad platform (PropellerAds, Adsterra, PopAds, Ezoic, etc.).
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Configurable Geo CPM Revenue Rates ($ / 1,000 Views)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block mb-1">
                        Tier 1 CPM Rate (US, UK, CA, AU)
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.10"
                          min="0.10"
                          value={adSettings.tier1_cpm}
                          onChange={(e) => setAdSettings({ ...adSettings, tier1_cpm: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block mb-1">
                        Tier 2 CPM Rate (EU, JP, SE)
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.10"
                          min="0.10"
                          value={adSettings.tier2_cpm}
                          onChange={(e) => setAdSettings({ ...adSettings, tier2_cpm: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block mb-1">
                        Tier 3 CPM Rate (Worldwide)
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.10"
                          min="0.10"
                          value={adSettings.tier3_cpm}
                          onChange={(e) => setAdSettings({ ...adSettings, tier3_cpm: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={adSettingsSaving}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {adSettingsSaving ? 'Saving Settings...' : 'Save Ad Network & CPM Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Geo CPM Revenue Rates & Country Tiers Explanation */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Understanding Geo CPM Rates &amp; Country Tiers</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  <strong>What does CPM mean?</strong> CPM stands for <em>Cost Per Mille</em> (Latin for thousand). It is the standard advertising metric that measures how much revenue is generated for every 1,000 views of an interstitial splash page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">Tier 1 Traffic</span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    ${adSettings.tier1_cpm?.toFixed(2)} / 1k views
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  <strong>Countries:</strong> United States, United Kingdom, Canada, Australia.
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Advertisers pay the highest rates for these visitors due to high consumer purchasing power and mature e-commerce markets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">Tier 2 Traffic</span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    ${adSettings.tier2_cpm?.toFixed(2)} / 1k views
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  <strong>Countries:</strong> Germany, France, Japan, Sweden, Netherlands, Spain, Greece, Italy.
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Solid European and Asian economic markets with steady advertiser demand and healthy commercial click-through rates.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tier 3 Traffic</span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    ${adSettings.tier3_cpm?.toFixed(2)} / 1k views
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  <strong>Countries:</strong> All other worldwide countries and unclassified traffic.
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Global baseline rate. Every visit from any region around the globe continuously contributes to the publisher earnings pool.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">How Earnings are Calculated:</strong>
                When someone clicks a short link enabled with a splash page, our analytics engine detects their geographic country and credits the link owner with the corresponding Geo CPM rate. Earnings can be withdrawn once they reach the $50 minimum threshold.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADVERTISER CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Third-Party Advertiser Campaigns</h3>
              <p className="text-xs text-slate-500">Run native banner and interstitial ad campaigns on short-link traffic</p>
            </div>
            <button
              onClick={() => setIsCampaignModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ad Campaign</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active advertiser campaigns. Click "Create Ad Campaign" to launch a campaign.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="p-3.5">Campaign Name</th>
                      <th className="p-3.5">Destination URL</th>
                      <th className="p-3.5">Target Geo</th>
                      <th className="p-3.5">CPM Rate</th>
                      <th className="p-3.5">Impressions</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{camp.name}</td>
                        <td className="p-3.5 max-w-[200px] truncate font-mono text-[11px] text-slate-500">
                          {camp.target_url}
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">{camp.target_country || 'ALL'}</td>
                        <td className="p-3.5 font-mono text-emerald-500">${(camp.cpm_rate ?? 0).toFixed(2)}</td>
                        <td className="p-3.5 font-mono">{camp.impressions || 0}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleCampaignStatus(camp.id, camp.status)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer ${
                              camp.status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {camp.status}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAID API & USAGE BILLING */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-500" />
              <span>Programmatic REST API Usage &amp; Access</span>
            </h3>

            {!isAdmin ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>REST API Access Restricted on Free Accounts</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  Programmatic API endpoints and API keys are only available to platform administrators unless approved via a paid developer upgrade. Free user accounts have <strong>0 API requests / month</strong> and manage links exclusively through the web dashboard.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    Monthly Quota: 0 / 0 calls (API Inactive)
                  </span>
                  <button
                    onClick={() => {
                      setRequestTier('Pro Developer');
                      setIsApiRequestModalOpen(true);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Request Developer Access</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">
                    Administrator Unlimited Quota ({overview.api_usage?.month_key || 'Current'})
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {overview.api_usage?.request_count} / {overview.api_usage?.monthly_limit?.toLocaleString()} calls
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-indigo-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((overview.api_usage?.request_count || 0) / (overview.api_usage?.monthly_limit || 100000)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Free Plan */}
            <div
              className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-xs flex flex-col justify-between relative ${
                !isAdmin
                  ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {!isAdmin && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Current Active Tier</span>
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Free Community Plan
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">$0 / mo</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Basic shortener access for personal use and web dashboard management.
                </p>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 mt-4">
                  <li className="flex items-center gap-2">✓ 10 Free Shortened Links</li>
                  <li className="flex items-center gap-2">✓ +50 Bonus Links per Referral</li>
                  <li className="flex items-center gap-2">✓ Click Analytics &amp; QR Codes</li>
                  <li className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    ✕ 0 Programmatic API Requests (Web Only)
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="w-full block py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {!isAdmin ? 'Current Active Tier' : 'Standard Free Tier'}
                </span>
              </div>
            </div>

            {/* Pro Developer Plan */}
            <div className="bg-slate-900 border-2 border-indigo-500 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Paid Upgrade
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  Pro Developer
                </span>
                <div className="text-2xl font-black text-white mt-2">$19 / mo</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  For developers building automated apps and production integrations.
                </p>
                <ul className="text-xs space-y-2 text-slate-300 mt-4">
                  <li className="flex items-center gap-2">✓ 25,000 API Requests / mo</li>
                  <li className="flex items-center gap-2">✓ Programmatic API Keys &amp; Whitelist</li>
                  <li className="flex items-center gap-2">✓ Custom Domains &amp; Pixels</li>
                  <li className="flex items-center gap-2">✓ Geo &amp; Device Targeting</li>
                  <li className="flex items-center gap-2">✓ Webhooks &amp; Status Monitor</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setRequestTier('Pro Developer');
                  setIsApiRequestModalOpen(true);
                }}
                className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-colors"
              >
                {isAdmin ? 'Manage Developer Access' : 'Request Paid Upgrade ($19/mo)'}
              </button>
            </div>

            {/* Enterprise Scale Plan */}
            <div
              className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-xs flex flex-col justify-between relative ${
                isAdmin ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {isAdmin && (
                <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Admin Access</span>
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-purple-500 uppercase tracking-wider block">
                  Enterprise Scale
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">$99 / mo</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  High-volume marketing platforms, custom routing, and enterprise fleets.
                </p>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 mt-4">
                  <li className="flex items-center gap-2">✓ Unlimited API Requests</li>
                  <li className="flex items-center gap-2">✓ Priority Edge SLA Routing</li>
                  <li className="flex items-center gap-2">✓ Dedicated Support &amp; Webhooks</li>
                  <li className="flex items-center gap-2">✓ Custom Contract &amp; Invoicing</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setRequestTier('Enterprise Scale');
                  setIsApiRequestModalOpen(true);
                }}
                className="w-full mt-6 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                {isAdmin ? 'Administrator Active' : 'Contact Admin to Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AFFILIATE & REFERRAL PROGRAM */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>In-App Referral &amp; Affiliate Program</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Share your unique referral link. Earn +50 bonus free links for every user who registers using your link!
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-full">
                {overview.referrals?.referral_url}
              </div>
              <button
                onClick={handleCopyReferralUrl}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Referral Link</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-slate-500 block mb-1">Referred Members</span>
                <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {overview.referrals?.total_referred || 0} users
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Friends who registered via your link</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-slate-500 block mb-1">Bonus Link Quota Earned</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{overview.referrals?.bonus_links_earned || 0} links
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">+50 permanent link credits per invite</span>
              </div>
            </div>

            {/* How Credits Work Explainer */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>How Link Creation Credits Work</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-indigo-500 mb-1">1. Base Free Tier (10 Links)</div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Every registered account starts with 10 free short links with full analytics, QR codes, and routing.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-emerald-500 mb-1">2. Invite Friends (+50 Credits)</div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Share your affiliate link. Whenever someone creates an account, you receive +50 link creation credits!
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-amber-500 mb-1">3. Create Beyond 10 Links</div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Your credits stack permanently, allowing you to create unlimited links without paying any subscription fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Apply Inviter's Code or Claim Bonus */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <form onSubmit={handleClaimReferral} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Enter friend's referral code / username"
                  value={claimCodeInput}
                  onChange={(e) => setClaimCodeInput(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs w-64"
                />
                <button
                  type="submit"
                  disabled={claimingCode || !claimCodeInput.trim()}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {claimingCode ? 'Applying...' : 'Apply Code'}
                </button>
              </form>

              <button
                type="button"
                onClick={handleGrantDemoCredits}
                disabled={grantingDemoCredit}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 shrink-0 transition-all disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{grantingDemoCredit ? 'Granting...' : 'Test Referral (+50 Credits)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Advertiser Campaign</h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Promo Banner 2026"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Destination URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://myadvertisersite.com/deal"
                  value={campTargetUrl}
                  onChange={(e) => setCampTargetUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Banner Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/banner.png"
                    value={campBannerUrl}
                    onChange={(e) => setCampBannerUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Country (Code)</label>
                  <input
                    type="text"
                    placeholder="ALL or US, GB, DE"
                    value={campCountry}
                    onChange={(e) => setCampCountry(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CPM Rate ($ / 1k views)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={campCpm}
                    onChange={(e) => setCampCpm(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Budget Limit ($)</label>
                  <input
                    type="number"
                    value={campBudget}
                    onChange={(e) => setCampBudget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCamp}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                >
                  {creatingCamp ? 'Launching...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API UPGRADE REQUEST MODAL */}
      {isApiRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Request API Access ({requestTier})
                </h3>
              </div>
              <button
                onClick={() => setIsApiRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Programmatic REST API usage is restricted to administrators and paid accounts. Submit your details below to request developer activation from the platform administrator.
            </p>

            <form onSubmit={handleSendApiRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Selected Tier
                </label>
                <select
                  value={requestTier}
                  onChange={(e) => setRequestTier(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Pro Developer">Pro Developer ($19 / mo - 25,000 requests)</option>
                  <option value="Enterprise Scale">Enterprise Scale ($99 / mo - Unlimited)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Contact Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={requestContactEmail}
                  onChange={(e) => setRequestContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Intended Integration / Use Case
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Automating link creation from our marketing CMS..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={requestSending}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 transition-colors shadow-md"
                >
                  {requestSending ? 'Sending Request...' : 'Submit Upgrade Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsApiRequestModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
