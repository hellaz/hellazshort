import React from 'react';
import { PublicLayout } from '../components/PublicLayout';
import {
  Globe,
  Zap,
  ShieldCheck,
  Server,
  Cpu,
  Layers,
  ArrowRight,
  HeartHandshake,
  CheckCircle,
} from 'lucide-react';

interface AboutViewProps {
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  isLoggedIn?: boolean;
  activeDomainName?: string;
  customHtml?: string;
  adConfig?: import('../components/PublicLayout').AdNetworkConfig;
}

export const AboutView: React.FC<AboutViewProps> = ({
  onNavigate,
  onGetStarted,
  isLoggedIn = false,
  activeDomainName,
  customHtml,
  adConfig,
}) => {
  return (
    <PublicLayout
      currentPage="about"
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex-1 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Our Mission &amp; Infrastructure</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Built for Lightning-Fast <br className="hidden sm:inline" />
            <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Global Redirection &amp; Link Intelligence
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            URLZ was created to solve the fundamental problems of traditional URL shorteners: sluggish redirection speeds, invasive ad traps, and arbitrary link outages.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Edge-Native Global Architecture</h3>
            <p className="text-slate-400 leading-relaxed">
              Every shortened link is replicated across Cloudflare's edge network spanning 300+ global cities. Redirects resolve in less than 15 milliseconds, right from the data center closest to the user.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Zero-Tolerance Abuse Protection</h3>
            <p className="text-slate-400 leading-relaxed">
              We employ real-time machine intelligence, phishing domain blocklists, Google Safe Browsing APIs, and automated threat monitors to ensure our short domains maintain pristine deliverability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Custom Domain Independence</h3>
            <p className="text-slate-400 leading-relaxed">
              Never be locked into a vendor's domain name. URLZ allows users to connect their own branded domains with zero-configuration SSL, ensuring your brand stays front-and-center.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Privacy &amp; Data Integrity</h3>
            <p className="text-slate-400 leading-relaxed">
              We strictly hash IP addresses before storage and aggregate analytics without selling personal data to data brokers. You own your link metrics and click analytics.
            </p>
          </div>
        </div>

        {/* Commitment List */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-white">Our Core Commitments</h3>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>99.99% Uptime SLA:</strong> High-availability edge caching ensures your links resolve 24/7 without fail.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Clean Community Short Links:</strong> No misleading download traps, unclosable pop-unders, or abusive malware redirects.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Transparent Free Tier:</strong> Free accounts get 10 permanent short links, expandable with our +50 bonus link affiliate program.</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-6">
          <button
            onClick={onGetStarted}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <span>Start Shortening with URLZ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
        </>
      )}
    </PublicLayout>
  );
};
