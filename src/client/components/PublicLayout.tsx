import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ArrowRight } from 'lucide-react';
import { apiRequest, setAuthToken } from '../api';
import { useToast } from './Toast';
import {
  AdNetworkConfig,
  SiteAdBanner,
  SkyscraperAd,
  DashboardHeaderAd,
} from './AdBannerComponents';

export type { AdNetworkConfig };
export { SiteAdBanner, SkyscraperAd, DashboardHeaderAd };

export interface PublicLayoutProps {
  currentPage?: string;
  onNavigate?: (page: string, authMode?: 'login' | 'register') => void;
  onGoToDashboard?: () => void;
  onGoToLogin?: () => void;
  onGetStarted?: () => void;
  onLoginSuccess?: (userData: any) => void;
  isLoggedIn?: boolean;
  activeDomainName?: string;
  adConfig?: AdNetworkConfig;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentPage = 'landing',
  onNavigate,
  onGoToDashboard,
  onGoToLogin,
  onGetStarted,
  onLoginSuccess,
  isLoggedIn = false,
  activeDomainName = 'urlz.eu.org',
  adConfig,
  children,
}) => {
  const { showToast } = useToast();

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'facebook') => {
    try {
      const refCode = localStorage.getItem('urlz_ref');
      const res = await apiRequest(`auth/social/${provider}`, {
        method: 'POST',
        body: JSON.stringify({
          email: `${provider}_user@urlz.eu.org`,
          name: `${provider.toUpperCase()} User`,
          referral_code: refCode || undefined,
        }),
      });

      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        showToast(`Instant sign-in successful via ${provider.toUpperCase()}!`, 'success');
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        } else if (onGoToDashboard) {
          onGoToDashboard();
        }
      } else {
        showToast(res.error || `Failed social authentication via ${provider}`, 'error');
      }
    } catch {
      showToast(`Social authentication error with ${provider}`, 'error');
    }
  };

  const navTo = (page: string, mode?: 'login' | 'register') => {
    if (onNavigate) {
      onNavigate(page, mode);
    } else if (page === 'login') {
      if (mode === 'register' && onGetStarted) onGetStarted();
      else if (onGoToLogin) onGoToLogin();
    }
  };

  const displayDomain =
    activeDomainName && activeDomainName !== 'localhost' ? activeDomainName : 'urlz.eu.org';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* UNIFIED HEADER BAR — IDENTICAL ACROSS ALL PUBLIC PAGES */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navTo('landing')}
            className="flex items-center focus:outline-hidden cursor-pointer"
            title="URLZ Home"
          >
            <BrandLogo variant="dark" size="md" />
          </button>

          {/* Public Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <button
              onClick={() => navTo('features')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'features' ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => navTo('about')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'about' ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              About
            </button>
            <button
              onClick={() => navTo('contact')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'contact' ? 'text-indigo-400 font-bold' : 'hover:text-white'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard || (() => navTo('dashboard'))}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Instant Social Sign-in Header Icons */}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold px-1">Social Sign-In:</span>
                  <button
                    onClick={() => handleSocialLogin('google')}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                    title="Sign In with Google"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('twitter')}
                    className="p-1 rounded-lg hover:bg-slate-800 text-sky-400 transition-colors cursor-pointer"
                    title="Sign In with Twitter / X"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('facebook')}
                    className="p-1 rounded-lg hover:bg-slate-800 text-blue-500 transition-colors cursor-pointer"
                    title="Sign In with Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={onGetStarted || (() => navTo('login', 'register'))}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* SITE-WIDE AD BANNER (JUST AFTER HEADER) */}
      <SiteAdBanner position="top" adConfig={adConfig} />

      {/* PAGE BODY CONTENT */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* SITE-WIDE AD BANNER (JUST BEFORE FOOTER) */}
      <SiteAdBanner position="bottom" adConfig={adConfig} />

      {/* UNIFIED FOOTER — IDENTICAL ACROSS ALL PUBLIC PAGES */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">URLZ</span>
            <span>&bull;</span>
            <span>Premium Link Management</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navTo('features')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'features' ? 'text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => navTo('about')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'about' ? 'text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              About
            </button>
            <button
              onClick={() => navTo('contact')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'contact' ? 'text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => navTo('terms')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'terms' ? 'text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => navTo('privacy')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'privacy' ? 'text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={onGoToLogin || (() => navTo('login', 'login'))}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <span className="text-slate-600 font-mono text-[11px]">{displayDomain}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
