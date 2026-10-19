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
          'Destination URL (Required): The target web page visitors will land on (e.g., https://example.com/product).',
          'Domain Selection: Select an active domain (e.g. urlz.eu.org). By default, links map to root (/*). Click "Advanced Route Prefix" if you need specific sub-path prefixes.',
          'Custom Slug (Optional): Custom path alias (e.g. /my-brand). If left blank, an 8-character random slug is assigned automatically.',
          'Redirect Code: Select 301 (Permanent Moved), 302 (Found / Temporary), 307 (Temporary Preserve Method), or 308 (Permanent Preserve Method). Defaults to 301.',
        ],
      },
      {
        title: 'Targeting & Dynamic Redirects',
        items: [
          'Country / Geo Redirects: Direct visitors from specific countries (e.g. US, DE, JP) to localized destination URLs.',
          'Device & Mobile OS Routing: Route visitors by Device type (Desktop, Mobile, Tablet) or Mobile OS (iOS App Store vs Android Play Store) in one unified card.',
          'Language-Based Routing: Route visitors based on browser preferred language headers (e.g. fr, es, de, ja).',
          'UTM Campaign Builder: Easily append utm_source, utm_medium, and utm_campaign query parameters directly in the creation modal.',
        ],
      },
      {
        title: 'Security, Protection & Monetization',
        items: [
          'Password Protection: Lock short links with an optional password prompt before redirection.',
          'Expiration & Max Clicks: Set an expiration date/time or maximum click limit before the link deactivates.',
          'Cloaking: Mask the destination URL inside an edge-rendered iframe so the short URL stays in the browser address bar.',
          'Interstitial Splash Pages: Display a custom sponsored banner image, link, or Google AdSense ad code with a customizable countdown timer (e.g. 5s) before redirecting.',
        ],
      },
    ],
    tips: [
      'To organize your links, select or create a Category or add Tags directly in the link creation modal.',
      'Use checkboxes on the Links list to perform batch operations: export CSV, assign tags, or delete multiple links.',
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
          'Unique Visitors: Distinct visitors calculated based on IP hash + User-Agent fingerprint within a 24-hour window.',
          'Referrers: Websites, search engines, or social platforms where visitors clicked your short link.',
          'Bot & Crawler Filtering: Automatic detection and filtering of search engine indexers and social media link preview bots.',
        ],
      },
      {
        title: 'Geographic & Device Breakdown',
        items: [
          'Country & City Heatmaps: High-resolution visitor location insights resolved at edge data centers.',
          'Device & Browser Distribution: Percentage breakdown across Mobile, Desktop, Tablet, Chrome, Safari, Firefox, Edge, etc.',
        ],
      },
    ],
    tips: [
      'Export detailed analytics reports as CSV files for client reporting or warehouse analysis.',
      'Filter analytics charts by specific domains or date ranges (24h, 7d, 30d, All Time).',
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
          'Custom Domains: Use your own brand domains (e.g. link.yourbrand.com) alongside default system domains (urlz.eu.org).',
          'Route Prefixes: Define route prefixes like /* (root level routing) or /go/* (isolated sub-folder routing) on each domain.',
          'Fallback Destination: Specify where visitors go (e.g., https://yourmainwebsite.com) if they request an unassigned or non-existent short link path.',
          'DNS CNAME Target: Point your custom domain CNAME record to cname.urlz.eu.org in your DNS provider.',
        ],
      },
    ],
    tips: [
      'Always set a custom Fallback URL on each domain to avoid showing default 404 pages when users mistype a slug.',
      'Mark a primary domain as default to auto-select it in link creation modals.',
    ],
  },
  'status-monitor': {
    title: 'Link Health & Status Monitor',
    icon: Activity,
    badge: 'Automated Monitoring',
    summary:
      'Monitor destination URLs in the background to detect broken 404 links, server 5xx outages, and unresponsive destinations.',
    sections: [
      {
        title: 'Status Check Mechanics',
        items: [
          'Automated Cron Checks: Background health checks executed on a configurable schedule (e.g. every 2 weeks or 1 month).',
          'Manual Verification ("Run Health Check Now"): Trigger an instant scan across all active non-deleted links in your account.',
          'Status Badges: 200 OK (Healthy), 301/302/307/308 (Active Redirect), 404 (Broken / Not Found), 500+ (Server Outage), Timeout (Unresponsive).',
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
      'Add pixels once in the Tracking Pixels library, then attach them to multiple short links in the create modal with a single click.',
    ],
  },
  monetization: {
    title: 'Monetization & Link Credits',
    icon: DollarSign,
    badge: 'Ad Revenue & Referrals',
    summary:
      'Monetize link clicks with sponsored splash pages, Google AdSense banners, advertiser campaigns, and earn free link creation credits.',
    sections: [
      {
        title: 'Monetization & Credits Tools',
        items: [
          'Short Link Creation Allowance: Base free accounts include 10 short links. Earn +50 bonus link creation credits per referral invite.',
          'Interstitial Splash Pages: Display custom sponsored banners or Google AdSense ad units with a countdown timer before redirection.',
          'Advertiser Campaigns: Launch CPM advertiser campaigns ($/1,000 views) targeted by country, with budget limits and custom banners.',
          'Referral Program: Share your unique referral link to earn +50 permanent link credits per registered referral.',
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
      'Configure user profiles, anti-bot Security Verification, automated status check schedules, and REST API keys.',
    sections: [
      {
        title: 'Admin & Profile Settings',
        items: [
          'User Management & Roles: Admin, Owner, Editor, and User role permissions.',
          'Security Verification: Interactive anti-bot challenge enforcement for public registrations and guest link shortening.',
          'API Keys: Generate personal REST API keys for headless link creation and programmatic automation.',
          'Status Check Schedule: Configure automated monitoring frequency (2 weeks, 1 month, daily top 100).',
        ],
      },
    ],
    tips: [
      'Use REST API Keys with specific scopes for automated integrations or CI/CD deployments.',
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
      return saved !== null ? saved === 'true' : true;
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

  let pageKey = currentPage.split('-')[0] || 'dashboard';
  if (currentPage.startsWith('analytics')) pageKey = 'analytics';
  if (currentPage.startsWith('settings')) pageKey = 'settings';

  const content = PAGE_HELP_MAP[pageKey] || DEFAULT_HELP;
  const IconComponent = content.icon;

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

      <aside
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{content.summary}</p>
          </div>

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
