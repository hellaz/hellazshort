import React from 'react';
import { HelpCircle, BookOpen, Shield, Globe, Zap, Code2, Lock, ArrowUpRight } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Documentation &amp; User Manual</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Everything you need to know about link shorteners, custom routing, and privacy-first analytics
        </p>
      </div>

      <div className="space-y-4">
        {/* Section 1: Creating Short Links */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>1. Creating &amp; Customizing Links</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Click <strong>Create Link</strong> from the top navigation or dashboard. Provide the destination URL
            and optional custom slug (e.g. <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">promo2025</code>).
            You can optionally assign categories, tags, expiration timestamps, or password access.
          </p>
        </div>

        {/* Section 2: Password Protection & Interstitials */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>2. Password Protection &amp; Splash Pages</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            When you protect a link with a password, visitors see an encrypted security challenge prompting for the
            key before forwarding. Splash pages allow displaying custom sponsor banners or notices for 5 seconds before
            proceeding.
          </p>
        </div>

        {/* Section 3: Geo & Device Routing */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>3. Geo &amp; Device Specific Targeting</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Configure mobile OS overrides (send iOS visitors to the App Store and Android visitors to Google Play) or
            country rules (e.g. forward visitors from Greece to localized Greek stores).
          </p>
        </div>

        {/* Section 4: Privacy & GDPR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>4. GDPR &amp; Bot Detection Compliance</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All visitor telemetry is hashed and aggregated without persisting plain-text IP addresses. Automated bot
            crawlers and monitoring probes are filtered to ensure pristine click counts.
          </p>
        </div>
      </div>
    </div>
  );
};
