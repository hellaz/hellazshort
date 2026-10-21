import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import {
  Globe,
  Sliders,
  Code,
  RotateCcw,
  Eye,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PAGE_DEFAULT_TEMPLATES } from '../templates/defaultPageTemplates';

interface RootPageViewProps {
  onNavigate?: (page: string) => void;
  publicPagesConfig?: {
    mode: 'branded' | 'redirect' | 'html';
    html: string;
    redirect_url: string;
    pages: Record<string, string>;
  };
  onConfigUpdated?: () => void;
}

export const RootPageView: React.FC<RootPageViewProps> = ({
  onNavigate,
  onConfigUpdated,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Root Page Mode & Custom HTML
  const [rootMode, setRootMode] = useState<'branded' | 'redirect' | 'html'>('branded');
  const [rootRedirectUrl, setRootRedirectUrl] = useState('');
  const [activePageKey, setActivePageKey] = useState<string>('branded');
  const [publicPagesHtml, setPublicPagesHtml] = useState<Record<string, string>>({
    branded: '',
    features: '',
    about: '',
    contact: '',
    terms: '',
    privacy: '',
  });

  const [showLivePreview, setShowLivePreview] = useState(false);

  // Public Pages Ad Network Configuration
  const [adSettings, setAdSettings] = useState<{
    enabled: boolean;
    provider: 'adsense' | 'custom' | 'none';
    adsense_client_id: string;
    adsense_slot_id: string;
    custom_ad_code: string;
  }>({
    enabled: false,
    provider: 'adsense',
    adsense_client_id: '',
    adsense_slot_id: '',
    custom_ad_code: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('settings/public-pages');
      if (res.success && res.data) {
        const root = res.data.root_page || {};
        setRootMode(root.mode || 'branded');
        setRootRedirectUrl(root.redirect_url || '');

        const existingPages = res.data.pages || {};
        setPublicPagesHtml({
          branded: existingPages.branded ?? PAGE_DEFAULT_TEMPLATES.branded.html,
          features: existingPages.features ?? PAGE_DEFAULT_TEMPLATES.features.html,
          about: existingPages.about ?? PAGE_DEFAULT_TEMPLATES.about.html,
          contact: existingPages.contact ?? PAGE_DEFAULT_TEMPLATES.contact.html,
          terms: existingPages.terms ?? PAGE_DEFAULT_TEMPLATES.terms.html,
          privacy: existingPages.privacy ?? PAGE_DEFAULT_TEMPLATES.privacy.html,
        });

        if (res.data.ad_settings) {
          setAdSettings(res.data.ad_settings);
        }
      }
    } catch {
      showToast('Failed to load root page settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest('settings/public-pages', {
        method: 'POST',
        body: JSON.stringify({
          root_page: {
            mode: rootMode,
            redirect_url: rootRedirectUrl,
            html: publicPagesHtml.branded || '',
          },
          pages: publicPagesHtml,
          ad_settings: adSettings,
        }),
      });

      if (res.success) {
        showToast('Root domain and public page settings saved successfully!', 'success');
        if (onConfigUpdated) onConfigUpdated();
      } else {
        showToast(res.error || 'Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = (key: string) => {
    if (confirm(`Reset the "${key}" page back to the standard platform template?`)) {
      const standard = (PAGE_DEFAULT_TEMPLATES as any)[key]?.html || '';
      setPublicPagesHtml((prev) => ({ ...prev, [key]: standard }));
      showToast(`Reset ${key} to default template`, 'info');
    }
  };

  const pagesList = [
    { id: 'branded', label: 'Main Landing (/)', path: '/' },
    { id: 'features', label: 'Features (/p/features)', path: '/p/features' },
    { id: 'about', label: 'About (/p/about)', path: '/p/about' },
    { id: 'contact', label: 'Contact (/p/contact)', path: '/p/contact' },
    { id: 'terms', label: 'Terms of Service (/p/terms)', path: '/p/terms' },
    { id: 'privacy', label: 'Privacy Policy (/p/privacy)', path: '/p/privacy' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Root Domain &amp; Public Pages</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your domain homepage (<code>/</code>) behavior, customize public page HTML content, and preview changes live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Visit Root Domain</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* 1. Root Domain Destination Mode */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Root Domain Entrypoint (When visitors navigate to <code>/</code>)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Decide whether visiting your root domain loads the interactive shortener landing page, renders custom HTML, or forwards to another site.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'branded',
              label: 'Branded Welcome Page',
              desc: 'Interactive public landing page with live shortener, QR code generator, and feature grid',
              badge: 'Recommended',
            },
            {
              id: 'redirect',
              label: '302 Direct Redirect',
              desc: 'Immediately forward root domain visitors to an external URL or corporate homepage',
              badge: 'Forward',
            },
            {
              id: 'html',
              label: 'Custom HTML Page',
              desc: 'Render your own custom standalone HTML template directly on the root domain',
              badge: 'Developer',
            },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition-all relative ${
                rootMode === opt.id
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 font-semibold ring-1 ring-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
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
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm">{opt.label}</span>
                {rootMode === opt.id && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-75 font-normal leading-relaxed">{opt.desc}</p>
            </label>
          ))}
        </div>

        {rootMode === 'redirect' && (
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
            <label className="block font-semibold text-amber-900 dark:text-amber-200">
              Forward Destination URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/company-home"
              value={rootRedirectUrl}
              onChange={(e) => setRootRedirectUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
            />
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Cloudflare edge will immediately issue an HTTP 302 redirect to this URL whenever anyone visits your root domain without a slug.
            </p>
          </div>
        )}
      </div>

      {/* 2. Public Pages Content Editor & Live Preview */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              <span>Public Pages Content &amp; HTML Editor</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a page below to customize its markup. Changes are seamlessly served through the unified URLZ public layout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleResetToDefault(activePageKey)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-3 py-1.5 rounded-lg border font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                showLivePreview
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showLivePreview ? 'Hide Preview' : 'Split Preview'}</span>
            </button>
          </div>
        </div>

        {/* Page Selector Tabs */}
        <div className="flex overflow-x-auto gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
          {pagesList.map((pg) => {
            const isActive = activePageKey === pg.id;
            return (
              <button
                key={pg.id}
                type="button"
                onClick={() => setActivePageKey(pg.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pg.label}
              </button>
            );
          })}
        </div>

        {/* Editor & Optional Preview Area */}
        <div className={`grid gap-4 ${showLivePreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">
                Editing: <strong>{activePageKey}</strong>
              </span>
              <span>Tailwind CSS classes &amp; standard HTML supported</span>
            </div>
            <textarea
              rows={showLivePreview ? 20 : 16}
              value={publicPagesHtml[activePageKey] || ''}
              onChange={(e) =>
                setPublicPagesHtml({ ...publicPagesHtml, [activePageKey]: e.target.value })
              }
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              placeholder="<!-- Enter custom HTML markup here -->"
            />
          </div>

          {showLivePreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Live Rendered View</span>
                <span className="text-[11px] font-mono">Isolated Container</span>
              </div>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-950 text-slate-100 overflow-y-auto max-h-[460px] shadow-sm">
                <div
                  dangerouslySetInnerHTML={{
                    __html: publicPagesHtml[activePageKey] || '<p class="text-slate-500 italic">No content</p>',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
