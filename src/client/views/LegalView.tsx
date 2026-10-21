import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { Shield, FileText, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

interface LegalViewProps {
  initialTab?: 'terms' | 'privacy';
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  isLoggedIn?: boolean;
  activeDomainName?: string;
  customHtml?: string;
  adConfig?: import('../components/PublicLayout').AdNetworkConfig;
}

export const LegalView: React.FC<LegalViewProps> = ({
  initialTab = 'terms',
  onNavigate,
  onGetStarted,
  isLoggedIn = false,
  activeDomainName,
  customHtml,
  adConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <PublicLayout
      currentPage={activeTab === 'privacy' ? 'privacy' : 'terms'}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 space-y-8">
        <div className="flex items-center justify-center gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms &amp; Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {activeTab === 'terms' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-xs text-slate-300 leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Terms of Service &amp; Conditions</h1>
              <span className="text-[11px] text-slate-500">Last Revised: October 2026</span>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">1. Acceptance of Terms</h2>
              <p>
                By accessing and using URLZ (accessible via urlz.eu.org, urlz.gr, and affiliated edge networks), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">2. Acceptable Use Policy (Zero-Tolerance Rules)</h2>
              <p>
                URLZ is built for legitimate link shortening, branding, and click attribution. You agree NOT to use URLZ to shorten, redirect, or distribute any destinations containing:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Phishing, credential harvesting, or deceptive impersonation.</li>
                <li>Malware, ransomware, Trojan horses, or unauthorized spyware downloads.</li>
                <li>Unsolicited commercial electronic messages (spam email or SMS blast links).</li>
                <li>Illegal content, copyright infringement, or materials that violate intellectual property rights.</li>
              </ul>
              <p className="text-rose-400 font-semibold pt-1">
                Any links detected violating this policy will be terminated immediately, and corresponding user accounts permanently blocked without notice.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">3. User Quotas &amp; Platform Sponsorship</h2>
              <p>
                Free tier accounts receive an allocation of 10 short links and can earn additional link creation credits through the affiliate referral program (+10 links per verified referral). Platform sponsorship, interstitial splash ads, and publisher CPM earnings are governed by our revenue sharing model and subject to a $50 minimum payout threshold.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">4. API Usage &amp; Rate Limits</h2>
              <p>
                Programmatic REST API keys are provided for authorized developer use. Users must respect published rate limits. Attempting to bypass limits with automated rotating proxies or unauthorized scraping is strictly prohibited.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">5. Progressive Web App (PWA) Usage</h2>
              <p>
                URLZ may be installed as a Progressive Web App (PWA). By installing the application, you agree to local data caching on your device for performance and offline access. You are responsible for securing your device to prevent unauthorized access to your installed dashboard.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">6. Disclaimer &amp; Limitation of Liability</h2>
              <p>
                URLZ is provided "as is" and "as available". We do not guarantee uninterrupted uptime, though we strive for 99.99% availability across global edge regions. URLZ shall not be liable for any indirect or consequential damages arising from service usage.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-xs text-slate-300 leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Privacy &amp; Data Protection Policy</h1>
              <span className="text-[11px] text-slate-500">Last Revised: October 2026</span>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">1. Information We Collect</h2>
              <p>
                We only collect data necessary to provide reliable URL shortening and analytics services:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Account Data:</strong> Username, password hash, and optional email address for account recovery and notifications.</li>
                <li><strong>Shortened Link Data:</strong> Destination URLs, custom aliases, metadata, and optional password hashes.</li>
                <li><strong>Click Analytics Data:</strong> Country, city, browser family, operating system, referrer domain, and timestamp.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">2. IP Address Anonymization</h2>
              <p>
                To protect visitor privacy, full IP addresses of visitors clicking short links are <strong>never stored in raw plaintext</strong>. IPs are converted into anonymized cryptographic hashes with rotating daily salts, solely for preventing click fraud and computing distinct click counters.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">3. Cookies &amp; Local Storage</h2>
              <p>
                We use strictly necessary session cookies (`session_token`, `refresh_token`) to maintain authentication status in the dashboard. We also utilize a `last_splash_seen` cookie and local storage to enforce a 24-hour frequency cap on interstitial splash pages, ensuring a better user experience by preventing repetitive ad views. We do not use intrusive third-party cross-site behavioral tracking cookies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">4. Data Sharing &amp; Third Parties</h2>
              <p>
                We do not sell, rent, or trade personal account data to third parties. If you configure optional retargeting pixels (such as Meta Pixel or Google Tag Manager) or Google AdSense banners, those external platforms process events in accordance with their own respective privacy disclosures.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-bold text-white">5. Contact Data Protection Officer</h2>
              <p>
                For questions regarding data access, export, or account deletion, please email our security desk at <span className="font-mono text-indigo-400">privacy@urlz.eu.org</span>.
              </p>
            </section>
          </div>
        )}
      </main>
        </>
      )}
    </PublicLayout>
  );
};
