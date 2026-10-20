import React from 'react';
import { PublicLayout } from '../components/PublicLayout';
import {
  Globe,
  Zap,
  Target,
  Sparkles,
  ShieldCheck,
  Code2,
  QrCode,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  PieChart,
} from 'lucide-react';

interface FeaturesViewProps {
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  isLoggedIn?: boolean;
  activeDomainName?: string;
  customHtml?: string;
  adConfig?: import('../components/PublicLayout').AdNetworkConfig;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({
  onNavigate,
  onGetStarted,
  isLoggedIn = false,
  activeDomainName,
  customHtml,
  adConfig,
}) => {
  return (
    <PublicLayout
      currentPage="features"
      onNavigate={onNavigate}
      onGetStarted={onGetStarted}
      onGoToLogin={() => onNavigate('login')}
      onGoToDashboard={() => onNavigate('dashboard')}
      isLoggedIn={isLoggedIn}
      activeDomainName={activeDomainName}
      adConfig={adConfig}
    >
      {customHtml ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full" dangerouslySetInnerHTML={{ __html: customHtml }} />
      ) : (
        <>
          {/* Hero Section */}
          <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Enterprise Shortener Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Everything You Need to Command <br className="hidden sm:inline" />
          <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Short Links &amp; Traffic
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-4 leading-relaxed">
          Explore the full suite of URL redirection tools, granular audience targeting, ad integration, retargeting pixels, and edge infrastructure.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full flex-1 space-y-16">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Geographic &amp; Language Targeting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Route visitors to country-specific landing pages (US, UK, DE, FR, JP) and detect browser preferred language headers (`Accept-Language`) for personalized international user journeys.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Interstitial Splash &amp; AdSense</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enable ad integration with branded countdown splash pages. Embed Google AdSense responsive units or custom network tags, with auto-redirection after 3 to 15 seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Retargeting Pixels</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fire Meta (Facebook) Pixel, Google Tag Manager, TikTok, LinkedIn, or Twitter tracking events before redirecting to build highly targeted remarketing custom audiences.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Custom Branded Domains</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your own domains (e.g. `brand.link`) with automatic Cloudflare SSL. Support for root matching (`/*`) or isolated path prefix routing (`/go/*`).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Dynamic Vector QR Codes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly generate high-resolution QR codes for print marketing, menus, and billboards with customizable error correction and direct SVG/PNG downloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Programmatic REST API</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrate short link creation and automated click queries directly into your internal applications, bots, or CI/CD pipelines with scoped API keys.
            </p>
          </div>
        </div>

        {/* Deep Dive Section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-white">Built for Security &amp; Enterprise Speed</h2>
            <p className="text-xs text-slate-400">
              Reliability and abuse prevention are built into every level of the URLZ stack.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>&lt; 15ms Latency</span>
              </div>
              <p className="text-slate-500 text-[11px]">Edge-cached redirects resolved instantly from 300+ global data centers.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Phishing Defense</span>
              </div>
              <p className="text-slate-500 text-[11px]">Real-time domain reputation screening and Google Safe Browsing verification.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Password Guard</span>
              </div>
              <p className="text-slate-500 text-[11px]">Secure confidential links with client-side hashed password authentication.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <PieChart className="w-4 h-4" />
                <span>Live Analytics</span>
              </div>
              <p className="text-slate-500 text-[11px]">Real-time referrer channels, OS breakdown, and UTM campaign tracking.</p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="text-center py-10 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Supercharge Your Link Management?
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create an account in 30 seconds. Base free tier includes 10 short links, with +50 bonus links for every friend you invite.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

        </>
      )}
    </PublicLayout>
  );
};
