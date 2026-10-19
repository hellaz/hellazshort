import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Link2,
  Globe,
  BarChart3,
  Activity,
  Target,
  DollarSign,
  Key,
  Shield,
  Search,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface DashboardHelpPanelProps {
  currentPage: string;
  onNavigate?: (page: string) => void;
}

interface HelpContent {
  title: string;
  icon: React.ElementType;
  badge: string;
  summary: string;
  sections: Array<{
    title: string;
    items: string[];
  }>;
  tips: string[];
}

const PAGE_HELP_MAP: Record<string, HelpContent> = {
  dashboard: {
    title: 'Short Links & Management',
    icon: Link2,
    badge: 'OpenShortlink Core',
    summary:
      'Create, manage, and optimize shortened links with edge redirection, dynamic targeting, password protection, and tracking pixels.',
    sections: [
      {
        title: 'Creating & Routing Links',
        items: [
          'Destination URL: The target web page visitors will land on (supports HTTP & HTTPS).',
          'Domain & Path Prefix: Choose an active domain and route prefix (/* for full domain or /go/* for specific path).',
          'Custom Slug: Optional custom alias (e.g. urlz.eu.org/my-brand). If blank, an 8-character random slug is assigned.',
          'Redirect Code: 301 (Permanent SEO transfer), 302 (Temporary), or 307/308 (HTTP method preservation).',
        ],
      },
      {
        title: 'Dynamic Targeting & Rules',
        items: [
          'Geo Redirects: Redirect users from specific countries (e.g. US, DE, JP) to localized destination URLs.',
          'Device & OS Redirects: Route Mobile (iOS/Android) vs Desktop vs Tablet users to app stores or mobile pages.',
          'Language Redirects: Direct visitors based on browser preferred language header (e.g. fr, es, de).',
        ],
      },
      {
        title: 'Security & Protection',
        items: [
          'Password Protection: Lock short links with a password prompt before redirection.',
          'Expiration & Max Clicks: Set an expiration date/time or maximum click limit before link deactivates.',
          'Cloaking: Mask the destination URL in a full-screen iframe so the short URL remains in the browser address bar.',
        ],
      },
    ],
    tips: [
      'Need to tag UTM params? Use the built-in UTM Campaign Builder in the create modal to auto-append source, medium & campaign.',
      'Select multiple links using checkboxes to perform batch export, tag assignment, or status changes.',
    ],
  },
  analytics: {
    title: 'Analytics & Reports',
    icon: BarChart3,
    badge: 'Real-Time Insights',
    summary:
      'Track real-time traffic, click volume, geographic distribution, device breakdown, and referrer channels for all shortened links.',
    sections: [
      {
        title: 'Key Metrics Explained',
        items: [
          'Total Clicks: Overall total redirection requests recorded by Cloudflare Workers.',
          'Unique Visitors: Distinct visitors based on IP hash + User-Agent fingerprint within a 24-hour window.',
          'Referrers: Websites, search engines, or social platforms where visitors clicked your short link.',
          'Bot & Crawler Filtering: Automatic filtering of search engine indexers and social media link preview bots.',
        ],
      },
      {
        title: 'Geographic & Device Breakdown',
        items: [
          'Country & City Heatmaps: High-resolution visitor location insights resolved at edge data centers.',
          'Device & Browser Distribution: Percentage breakdown across Mobile, Desktop, Tablet, Chrome, Safari, Firefox, etc.',
        ],
      },
    ],
    tips: [
      'Export analytics reports as CSV for client reporting or deeper data warehouse analysis.',
      'Filter analytics by specific domains or date ranges (24h, 7d, 30d, All Time).',
    ],
  },
  domains: {
    title: 'Custom Domains & Routing',
    icon: Globe,
    badge: 'Branded Short URLs',
    summary:
      'Connect custom domain names and configure Cloudflare Worker routes for high-speed edge redirects.',
    sections: [
      {
        title: 'Domain Setup & Guidelines',
        items: [
          'Custom Domains: Use your own brand domains (e.g. link.yourbrand.com) alongside default system domains.',
          'Route Prefixes: Define route prefixes like /* (root level) or /go/* (prefix level) on each domain.',
          'Fallback Destination: Specify where visitors go if they request an invalid or non-existent short link path.',
          'Cloudflare Worker Binding: Ensure your domain routes are configured in Cloudflare DNS or Worker route triggers.',
        ],
      },
    ],
    tips: [
      'Set a custom Fallback URL on each domain to avoid showing default 404 pages when users mistype a slug.',
      'Mark a primary domain as default to auto-select it in link creation modals.',
    ],
  },
  'status-monitor': {
    title: 'Link Health & Status Monitor',
    icon: Activity,
    badge: 'Automated Monitoring',
    summary:
      'Monitor destination URLs in the background to detect broken 404 links, server 5xx outages, and expired domains.',
    sections: [
      {
        title: 'Status Check Mechanics',
        items: [
          'Automated Cron Checks: Periodic background health checks executed via scheduled cron triggers.',
          'Manual Run Health Check: Trigger an instant verification scan across active non-deleted links.',
          'Status Badges: 200 (Healthy), 301/302 (Redirecting), 404 (Not Found / Broken), 500+ (Server Outage), Timeout (Unresponsive).',
        ],
      },
    ],
    tips: [
      'Review broken 404 links on the Link Monitor tab to quickly update or redirect dead links before losing traffic.',
      'Adjust status check frequency and batch limits under Settings -> Status Check Config.',
    ],
  },
  pixels: {
    title: 'Tracking Pixels Library',
    icon: Target,
    badge: 'Audience Retargeting',
    summary:
      'Attach retargeting pixels to short links to build custom audiences on Meta, Google Analytics 4, TikTok, and LinkedIn.',
    sections: [
      {
        title: 'Supported Pixel Platforms',
        items: [
          'Meta (Facebook) Pixel: Track PageView & Custom Events for Facebook & Instagram ad custom audiences.',
          'Google Analytics 4 (GA4): Send event hits to GA4 measurement IDs (G-XXXXXXXXXX).',
          'TikTok Pixel: Fire events for TikTok Ads Manager retargeting campaigns.',
          'LinkedIn Insight Tag: Build LinkedIn matched audiences from click traffic.',
        ],
      },
      {
        title: 'How It Works',
        items: [
          'Pixel Firing: When a visitor clicks your short link, an invisible micro-interstitial fires the pixel before redirecting.',
          'Third-Party Links: Retarget users even when linking to third-party sites like Amazon, YouTube, news, or blogs.',
        ],
      },
    ],
    tips: [
      'Add pixels once in the Tracking Pixels library, then attach them to multiple short links with a single click.',
    ],
  },
  monetization: {
    title: 'Monetization & Interstitials',
    icon: DollarSign,
    badge: 'Ad Revenue & Referrals',
    summary:
      'Monetize link clicks with sponsored splash pages, AdSense banners, and earn free link credits with referrals.',
    sections: [
      {
        title: 'Monetization Tools',
        items: [
          'Interstitial Splash Pages: Display a custom sponsored banner or Google AdSense ad unit with a countdown timer.',
          'AdSense Integration: Embed responsive Google AdSense code or banner ads directly into redirection interstitials.',
          'Referral Program: Share your unique referral link to earn +50 free link credits per active signup.',
        ],
      },
    ],
    tips: [
      'Set a 3-5 second countdown timer on interstitial splash pages for optimal ad viewability without frustrating visitors.',
    ],
  },
  settings: {
    title: 'Settings & Security',
    icon: Shield,
    badge: 'System Admin',
    summary:
      'Configure user profiles, anti-bot Security Verification, automated status check schedules, and REST API access.',
    sections: [
      {
        title: 'Admin & Profile Settings',
        items: [
          'User Management & Roles: Admin, Owner, Editor, and User role permissions.',
          'Security Verification: Anti-bot challenge enforcement for public registration and guest link creation.',
          'API Keys: Generate personal REST API keys for headless link creation and programmatic automation.',
          'Status Check Schedule: Configure automated monitoring frequency (2 weeks, 1 month, daily top 100).',
        ],
      },
    ],
    tips: [
      'Use API Keys with specific scopes for automated integrations or CI/CD deployments.',
    ],
  },
};

const DEFAULT_HELP: HelpContent = {
  title: 'OpenShortlink Documentation & Help',
  icon: BookOpen,
  badge: 'Documentation',
  summary:
    'Comprehensive guidance for managing domains, short links, redirects, tracking pixels, and Cloudflare Worker deployments.',
  sections: [
    {
      title: 'General Overview',
      items: [
        'OpenShortlink is a high-performance URL shortener built for Cloudflare Workers & D1 edge database.',
        'Sub-10ms redirect speeds with edge caching across global Cloudflare data centers.',
        'Full support for custom branded domains, tracking pixels, interstitial splash ads, and REST API.',
      ],
    },
  ],
  tips: [
    'Need help with a specific feature? Navigate to the relevant dashboard page to view context-aware instructions.',
  ],
};

export const DashboardHelpPanel: React.FC<DashboardHelpPanelProps> = ({
  currentPage,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dashboard_help_open');
      return saved !== null ? saved === 'true' : true; // Open by default on desktop
    } catch {
      return true;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  useEffect(() => {
    try {
      localStorage.setItem('dashboard_help_open', String(isOpen));
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Determine current page key
  let pageKey = currentPage.split('-')[0] || 'dashboard';
  if (currentPage.startsWith('analytics')) pageKey = 'analytics';
  if (currentPage.startsWith('settings')) pageKey = 'settings';

  const content = PAGE_HELP_MAP[pageKey] || DEFAULT_HELP;
  const IconComponent = content.icon;

  // Filter sections by search query
  const filteredSections = content.sections
    .map((sec) => {
      if (!searchQuery.trim()) return sec;
      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const filteredItems = sec.items.filter((item) => item.toLowerCase().includes(q));
      if (matchTitle || filteredItems.length > 0) {
        return { title: sec.title, items: filteredItems.length > 0 ? filteredItems : sec.items };
      }
      return null;
    })
    .filter(Boolean) as Array<{ title: string; items: string[] }>;

  return (
    <>
      {/* Closed Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all cursor-pointer group"
          title="Open Page Help & Guidelines"
        >
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Page Help & Guidelines</span>
          <span className="sm:hidden">Help</span>
        </button>
      )}

      {/* Slide-over Right Hand Side Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400">
              <IconComponent className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {content.title}
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {content.badge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Help Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{content.summary}</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search page guidelines & tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Accordion Sections */}
          <div className="space-y-2">
            {filteredSections.map((sec, idx) => {
              const isAccordionOpen = openAccordion === idx;
              return (
                <div
                  key={sec.title}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/30"
                >
                  <button
                    onClick={() => setOpenAccordion(isAccordionOpen ? null : idx)}
                    className="w-full p-3 text-left font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{sec.title}</span>
                    </span>
                    {isAccordionOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isAccordionOpen && (
                    <div className="p-3 pt-0 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2 text-slate-600 dark:text-slate-300">
                      {sec.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pro Tips Box */}
          {content.tips.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Pro Tips & Best Practices</span>
              </div>
              {content.tips.map((tip, idx) => (
                <p key={idx} className="text-[11px] leading-relaxed opacity-90">
                  • {tip}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer Link to full Help Center */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">Need full docs or API spec?</span>
          <button
            onClick={() => {
              if (onNavigate) onNavigate('help');
            }}
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer text-xs"
          >
            <span>Help Center</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </aside>
    </>
  );
};
