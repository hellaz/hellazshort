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
} from 'lucide-react';

export const MonetizationView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'ads' | 'campaigns' | 'api' | 'referrals'>('ads');
  const [loading, setLoading] = useState(false);

  // Overview Data
  const [overview, setOverview] = useState<any>({
    total_clicks: 0,
    estimated_earnings: 0,
    referrals: { total_referred: 0, bonus_links_earned: 0, referral_url: '' },
    api_usage: { month_key: '', request_count: 0, monthly_limit: 10000, tier_name: 'Pro Developer' },
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

  useEffect(() => {
    fetchOverview();
    if (activeTab === 'campaigns') {
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

  const handleCopyReferralUrl = () => {
    const refUrl = overview.referrals?.referral_url || window.location.origin;
    navigator.clipboard.writeText(refUrl);
    showToast('Referral link copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <span>Monetization &amp; Revenue Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Earn ad revenue, run targeted advertiser campaigns, bill API usage, and manage referral programs
          </p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Estimated Ad Revenue
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ${overview.estimated_earnings.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold pb-1 scrollbar-none">
        {[
          { id: 'ads', label: 'Ad Network & Geo CPM', icon: TrendingUp },
          { id: 'campaigns', label: 'Advertiser Campaigns', icon: Megaphone },
          { id: 'api', label: 'Paid API & Usage Billing', icon: Code2 },
          { id: 'referrals', label: 'Affiliate & Referrals', icon: Users },
        ].map((tab) => {
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
              <span className="text-xs font-semibold text-slate-500 block mb-1">Total Monetized Clicks</span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {overview.total_clicks.toLocaleString()}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Estimated Net Revenue</span>
              <span className="text-2xl font-bold font-mono text-emerald-500">
                ${overview.estimated_earnings.toFixed(2)}
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
                disabled={overview.estimated_earnings < 50}
                onClick={() => showToast('Payout request submitted to administrator!', 'success')}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-500" />
              <span>Geo CPM Revenue Rates &amp; Country Tiers</span>
            </h3>
            <p className="text-xs text-slate-500">
              Interstitial splash page ad views automatically generate ad revenue based on visitor location.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">
                  Tier 1 ($5.00 / 1,000 CPM)
                </div>
                <p className="text-slate-500 mb-2">United States, United Kingdom, Canada, Australia</p>
                <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Highest Advertiser Demand
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <div className="font-bold text-purple-600 dark:text-purple-400 text-sm mb-1">
                  Tier 2 ($3.00 / 1,000 CPM)
                </div>
                <p className="text-slate-500 mb-2">Germany, France, Japan, Sweden, Netherlands, Spain</p>
                <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Strong Market Rates
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  Tier 3 ($1.50 / 1,000 CPM)
                </div>
                <p className="text-slate-500 mb-2">All Other Worldwide Countries &amp; Regions</p>
                <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Standard Baseline
                </div>
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
                        <td className="p-3.5 font-mono text-emerald-500">${camp.cpm_rate?.toFixed(2)}</td>
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
              <span>Programmatic REST API Usage &amp; Billing</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">
                  Monthly Request Usage ({overview.api_usage?.month_key})
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {overview.api_usage?.request_count} / {overview.api_usage?.monthly_limit?.toLocaleString()} calls
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((overview.api_usage?.request_count || 0) / (overview.api_usage?.monthly_limit || 10000)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Free Plan</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">$0 / mo</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Basic shortener access for personal use and testing.
                </p>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 mt-4">
                  <li className="flex items-center gap-2">✓ 1,000 API Requests/mo</li>
                  <li className="flex items-center gap-2">✓ Standard Redirections</li>
                  <li className="flex items-center gap-2">✓ Basic Analytics</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-900 border-2 border-indigo-500 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Popular
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Pro Developer</span>
                <div className="text-2xl font-black text-white mt-2">$19 / mo</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Power developers and growing applications.
                </p>
                <ul className="text-xs space-y-2 text-slate-300 mt-4">
                  <li className="flex items-center gap-2">✓ 25,000 API Requests/mo</li>
                  <li className="flex items-center gap-2">✓ Custom Domains &amp; Pixels</li>
                  <li className="flex items-center gap-2">✓ Geo &amp; Device Targeting</li>
                  <li className="flex items-center gap-2">✓ Retargeting &amp; Overlays</li>
                </ul>
              </div>
              <button
                onClick={() => showToast('Upgraded to Pro Developer API tier!', 'success')}
                className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Current Active Tier
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-500 uppercase tracking-wider block">Enterprise Scale</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">$99 / mo</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  High-volume marketing platforms and enterprise web suites.
                </p>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 mt-4">
                  <li className="flex items-center gap-2">✓ Unlimited API Requests</li>
                  <li className="flex items-center gap-2">✓ Priority SLA Edge Routing</li>
                  <li className="flex items-center gap-2">✓ Dedicated Support &amp; Webhooks</li>
                </ul>
              </div>
              <button
                onClick={() => showToast('Contacting Enterprise sales team...', 'info')}
                className="w-full mt-6 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Upgrade to Enterprise
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
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-slate-500 block mb-1">Bonus Link Quota Earned</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{overview.referrals?.bonus_links_earned || 0} links
                </span>
              </div>
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
    </div>
  );
};
