import React, { useState, useEffect } from 'react';
import { User, Domain } from './types';
import { apiRequest, setAuthToken, getAuthToken } from './api';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { AnalyticsView } from './views/AnalyticsView';
import { StatusMonitorView } from './views/StatusMonitorView';
import { DomainsView } from './views/DomainsView';
import { PixelsView } from './views/PixelsView';
import { IntegrationsView } from './views/IntegrationsView';
import { SettingsView } from './views/SettingsView';
import { MonetizationView } from './views/MonetizationView';
import { HelpView } from './views/HelpView';
import { AuthView } from './views/AuthView';
import { PublicLandingView } from './views/PublicLandingView';
import { FeaturesView } from './views/FeaturesView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { LegalView } from './views/LegalView';
import { ReportAbuseModal } from './views/ReportAbuseModal';
import { RootPageView } from './views/RootPageView';
import { DashboardHelpPanel } from './components/DashboardHelpPanel';

export const AppContent: React.FC = () => {
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<'owner' | 'admin' | 'pro' | 'user' | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'setup'>('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Domains
  const [domains, setDomains] = useState<Domain[]>([]);
  const [currentDomainId, setCurrentDomainId] = useState<string>('');

  // Quick Create Link modal trigger
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Report Abuse modal trigger
  const [reportAbuseOpen, setReportAbuseOpen] = useState(false);

  // Public Pages HTML configuration (managed in Default Root Page dashboard)
  const [publicPagesConfig, setPublicPagesConfig] = useState<{
    mode: 'branded' | 'redirect' | 'html';
    html: string;
    redirect_url: string;
    pages: Record<string, string>;
    ad_settings?: import('./components/PublicLayout').AdNetworkConfig;
  }>({
    mode: 'branded',
    html: '',
    redirect_url: '',
    pages: {},
  });

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update SEO Meta Tags & Title
  useEffect(() => {
    const baseTitle = 'URLZ - Shorten, Brand & Simplify Links';
    const baseDescription =
      'Take full control of your links with lightning-fast Cloudflare edge redirects, password protection, branded splash pages, retargeting pixels, and deep geo-targeting.';

    let pageTitle = baseTitle;
    let pageDescription = baseDescription;

    switch (currentPage) {
      case 'features':
        pageTitle = `Features - ${baseTitle}`;
        pageDescription =
          'Explore the full suite of URL redirection tools, granular audience targeting, ad integration, and retargeting pixels.';
        break;
      case 'about':
        pageTitle = `About - ${baseTitle}`;
        pageDescription =
          'Learn more about the URLZ platform, our high-speed edge infrastructure, and our mission to simplify link management.';
        break;
      case 'contact':
        pageTitle = `Contact - ${baseTitle}`;
        pageDescription =
          'Get in touch with our team for general support, abuse reports, or enterprise inquiries.';
        break;
      case 'terms':
        pageTitle = `Terms of Service - ${baseTitle}`;
        break;
      case 'privacy':
        pageTitle = `Privacy Policy - ${baseTitle}`;
        break;
      case 'dashboard':
      case 'analytics':
      case 'domains':
      case 'pixels':
      case 'integrations':
      case 'monetization':
      case 'settings':
      case 'help':
        pageTitle = `${currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} - Dashboard`;
        break;
    }

    document.title = pageTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', pageDescription);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', pageDescription);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', pageDescription);
  }, [currentPage]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  // Fetch Domains
  const fetchDomains = async () => {
    const res = await apiRequest('domains');
    if (res.success && Array.isArray(res.data)) {
      // localhost is never a domain option
      const filtered = res.data.filter(
        (d: Domain) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost'
      );
      setDomains(filtered);
      if (filtered.length > 0 && !currentDomainId) {
        const preferred =
          filtered.find((d: Domain) => d.domain_name === 'urlz.eu.org') ||
          filtered.find((d: Domain) => d.domain_name === 'urlz.gr') ||
          filtered[0];
        setCurrentDomainId(preferred.id);
      }
    }
  };

  const navigateTo = (page: string, authMode?: 'login' | 'register') => {
    if (authMode) setAuthInitialMode(authMode);
    setCurrentPage(page);
    try {
      let url = '/';
      if (page !== 'landing') {
        const pPages = ['features', 'about', 'contact', 'terms', 'privacy', 'report-abuse'];
        url = pPages.includes(page) ? `/p/${page}` : `/${page}`;
      }
      window.history.pushState({}, '', url);
    } catch {}
  };

  // Popstate listener for back/forward browser buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/p/features') setCurrentPage('features');
      else if (path === '/p/about') setCurrentPage('about');
      else if (path === '/p/contact') setCurrentPage('contact');
      else if (path === '/p/terms') setCurrentPage('terms');
      else if (path === '/p/privacy') setCurrentPage('privacy');
      else if (path === '/p/report-abuse') setCurrentPage('report-abuse');
      else if (path === '/register' || path === '/signup') {
        setAuthInitialMode('register');
        setCurrentPage('login');
      } else if (path === '/login') {
        setAuthInitialMode('login');
        setCurrentPage('login');
      } else if (path === '/' || path === '') {
        setCurrentPage('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check Auth & Initial Path
  useEffect(() => {
    const checkAuth = async () => {
      // Check path and search query from window.location
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search;

      // Extract referral code if present and persist
      const params = new URLSearchParams(search);
      const ref = params.get('ref') || params.get('referral_code') || params.get('r');
      if (ref) {
        localStorage.setItem('urlz_ref', ref.trim());
      }

      // Check public standalone pages first (must use /p/ prefix)
      if (path === '/p/features') {
        setCurrentPage('features');
        setAuthChecked(true);
        return;
      } else if (path === '/p/about') {
        setCurrentPage('about');
        setAuthChecked(true);
        return;
      } else if (path === '/p/contact') {
        setCurrentPage('contact');
        setAuthChecked(true);
        return;
      } else if (path === '/p/terms') {
        setCurrentPage('terms');
        setAuthChecked(true);
        return;
      } else if (path === '/p/privacy') {
        setCurrentPage('privacy');
        setAuthChecked(true);
        return;
      } else if (path === '/p/report-abuse') {
        setCurrentPage('report-abuse');
        setAuthChecked(true);
        return;
      } else if (path === '/register' || path === '/signup' || path === '/auth') {
        setAuthInitialMode('register');
        setCurrentPage('login');
        setAuthChecked(true);
        return;
      }

      try {
        const res = await apiRequest('auth/me');
        if (res.success && res.data) {
          if (res.data.token) {
            setAuthToken(res.data.token);
          }
          setUser(res.data);
          // If accessing /dashboard directly, go to dashboard
          if (path.startsWith('/dashboard') || path === '/admin') {
            setCurrentPage('dashboard');
          } else if (path === '/login' || path === '/setup') {
            setCurrentPage('dashboard');
          }
        } else {
          setUser(null);
          if (path.startsWith('/dashboard/setup') || path === '/setup') {
            setCurrentPage('setup');
          } else if (path.startsWith('/dashboard/login') || path === '/login') {
            setAuthInitialMode('login');
            setCurrentPage('login');
          } else if (path.startsWith('/dashboard')) {
            setAuthInitialMode('login');
            setCurrentPage('login');
          } else {
            setCurrentPage('landing');
          }
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    const fetchPublicPages = async () => {
      try {
        const res = await apiRequest('settings/public-pages');
        if (res.success && res.data) {
          setPublicPagesConfig(res.data);
          // If mode is redirect, handle external redirect on root /
          if (
            res.data.mode === 'redirect' &&
            res.data.redirect_url &&
            (window.location.pathname === '/' || window.location.pathname === '')
          ) {
            window.location.href = res.data.redirect_url;
          }
        }
      } catch {}
    };

    checkAuth();
    fetchDomains();
    fetchPublicPages();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
      setUser(null);
      setCurrentPage('landing');
      showToast('Signed out successfully', 'info');
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setCurrentPage('dashboard');
    fetchDomains();
  };

  const activeDomain = domains.find((d) => d.id === currentDomainId);
  const activeDomainName =
    activeDomain?.domain_name && activeDomain.domain_name !== 'localhost'
      ? activeDomain.domain_name
      : 'urlz.eu.org';

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono font-semibold">Initializing URLZ...</span>
        </div>
      </div>
    );
  }

  // SEPARATE PUBLIC PAGES
  if (currentPage === 'features') {
    return (
      <FeaturesView
        onNavigate={navigateTo}
        onGetStarted={() => navigateTo('login', 'register')}
        isLoggedIn={Boolean(user)}
        activeDomainName={activeDomainName}
        customHtml={publicPagesConfig.pages?.['features']}
        adConfig={publicPagesConfig.ad_settings}
      />
    );
  }

  if (currentPage === 'about') {
    return (
      <AboutView
        onNavigate={navigateTo}
        onGetStarted={() => navigateTo('login', 'register')}
        isLoggedIn={Boolean(user)}
        activeDomainName={activeDomainName}
        customHtml={publicPagesConfig.pages?.['about']}
        adConfig={publicPagesConfig.ad_settings}
      />
    );
  }

  if (currentPage === 'contact') {
    return (
      <ContactView
        onNavigate={navigateTo}
        onGetStarted={() => navigateTo('login', 'register')}
        isLoggedIn={Boolean(user)}
        activeDomainName={activeDomainName}
        customHtml={publicPagesConfig.pages?.['contact']}
        adConfig={publicPagesConfig.ad_settings}
      />
    );
  }

  if (currentPage === 'terms' || currentPage === 'privacy') {
    return (
      <LegalView
        initialTab={currentPage === 'privacy' ? 'privacy' : 'terms'}
        onNavigate={navigateTo}
        onGetStarted={() => navigateTo('login', 'register')}
        isLoggedIn={Boolean(user)}
        activeDomainName={activeDomainName}
        customHtml={publicPagesConfig.pages?.[currentPage]}
        adConfig={publicPagesConfig.ad_settings}
      />
    );
  }

  // PUBLIC LANDING VIEW
  if (currentPage === 'landing') {
    return (
      <>
        <PublicLandingView
          onGoToDashboard={() => {
            if (user) {
              setCurrentPage('dashboard');
            } else {
              navigateTo('login', 'register');
            }
          }}
          onGoToLogin={() => navigateTo('login', 'login')}
          onLoginSuccess={handleLoginSuccess}
          isLoggedIn={Boolean(user)}
          activeDomainName={activeDomainName}
          onNavigate={navigateTo}
          adConfig={publicPagesConfig.ad_settings}
          customHtml={
            publicPagesConfig.mode === 'html'
              ? publicPagesConfig.html
              : (publicPagesConfig.html && publicPagesConfig.html.trim().length > 0
                  ? publicPagesConfig.html
                  : undefined)
          }
        />
        <ReportAbuseModal
          isOpen={reportAbuseOpen}
          onClose={() => setReportAbuseOpen(false)}
        />
      </>
    );
  }

  // AUTH VIEWS (LOGIN / REGISTER / SETUP)
  if (currentPage === 'login' || currentPage === 'setup') {
    return (
      <AuthView
        initialMode={currentPage === 'setup' ? 'setup' : authInitialMode}
        onLoginSuccess={handleLoginSuccess}
        onNavigateHome={() => navigateTo('landing')}
        adConfig={publicPagesConfig.ad_settings}
      />
    );
  }

  // ADMIN / DASHBOARD APPLICATION SHELL
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar
        user={user}
        domains={domains}
        currentDomainId={currentDomainId}
        onSelectDomain={(id) => setCurrentDomainId(id)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        onCreateLinkClick={() => {
          if (currentPage !== 'dashboard') {
            setCurrentPage('dashboard');
          }
          setCreateModalOpen(true);
        }}
        onNavigate={(p) => setCurrentPage(p)}
        adConfig={publicPagesConfig.ad_settings}
        simulatedRole={simulatedRole}
        onSimulateRole={setSimulatedRole}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => setCurrentPage(p)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          userRole={simulatedRole || user?.role}
          onCreateLinkClick={() => {
            if (currentPage !== 'dashboard') {
              setCurrentPage('dashboard');
            }
            setCreateModalOpen(true);
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Simulated Role Notice Banner */}
          {simulatedRole && simulatedRole !== user?.role && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>👁️</span>
                <span>
                  Simulating dashboard view as <strong>{simulatedRole === 'user' ? 'Free Community Tier (10 Links Quota)' : 'Paid / Pro Member (Unlimited Links)'}</strong>
                </span>
              </span>
              <button
                onClick={() => setSimulatedRole(null)}
                className="underline hover:text-white cursor-pointer font-bold"
              >
                Reset to Admin View
              </button>
            </div>
          )}

          {/* Main Dashboard: Links management */}
          {currentPage === 'dashboard' && (
            <DashboardView
              currentDomainId={currentDomainId}
              domains={domains}
              onViewAnalytics={(linkId) => {
                setCurrentPage('analytics-overview');
              }}
              createModalOpen={createModalOpen}
              onCloseCreateModal={() => setCreateModalOpen(false)}
              userRole={simulatedRole || user?.role}
              onNavigate={(p) => setCurrentPage(p)}
            />
          )}

          {/* Analytics subviews */}
          {currentPage.startsWith('analytics') && (
            <AnalyticsView
              currentDomainId={currentDomainId}
              domains={domains}
              subPage={currentPage.replace('analytics-', '')}
            />
          )}

          {/* Link Monitor */}
          {currentPage === 'status-monitor' && <StatusMonitorView />}

          {/* Domains */}
          {currentPage === 'domains' && (
            <DomainsView domains={domains} onRefresh={fetchDomains} />
          )}

          {/* Root Domain & Public Pages CMS */}
          {currentPage === 'root-page' && (
            <RootPageView
              onNavigate={(p) => setCurrentPage(p)}
              publicPagesConfig={publicPagesConfig}
            />
          )}

          {/* Pixels */}
          {currentPage === 'pixels' && <PixelsView />}

          {/* Monetization & Revenue */}
          {currentPage === 'monetization' && (
            <MonetizationView
              user={user ? { ...user, role: simulatedRole === 'pro' ? 'user' : (simulatedRole || user.role) } : null}
              onNavigate={(p) => setCurrentPage(p)}
            />
          )}

          {/* Integrations */}
          {currentPage === 'integrations' && (
            <IntegrationsView user={user} onNavigate={(p) => setCurrentPage(p)} />
          )}

          {/* Settings */}
          {currentPage.startsWith('settings') && (
            <SettingsView
              user={user}
              subPage={currentPage.replace('settings-', '')}
              onNavigate={(p) => setCurrentPage(p)}
              onUserUpdated={async () => {
                const res = await apiRequest('auth/me');
                if (res.success && res.data) setUser(res.data);
              }}
            />
          )}

          {/* Help */}
          {currentPage === 'help' && <HelpView />}
        </main>

        {/* Right Hand Side Collapsible Help Panel */}
        <DashboardHelpPanel currentPage={currentPage} onNavigate={(p) => setCurrentPage(p)} />
      </div>

      <ReportAbuseModal
        isOpen={reportAbuseOpen}
        onClose={() => setReportAbuseOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
