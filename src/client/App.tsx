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
import { ReportAbuseModal } from './views/ReportAbuseModal';

export const AppContent: React.FC = () => {
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Domains
  const [domains, setDomains] = useState<Domain[]>([]);
  const [currentDomainId, setCurrentDomainId] = useState<string>('');

  // Quick Create Link modal trigger
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Report Abuse modal trigger
  const [reportAbuseOpen, setReportAbuseOpen] = useState(false);

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

  // Check Auth
  useEffect(() => {
    const checkAuth = async () => {
      // Check path from window.location
      const path = window.location.pathname;

      try {
        const res = await apiRequest('auth/me');
        if (res.success && res.data) {
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
            setCurrentPage('login');
          } else if (path.startsWith('/dashboard')) {
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

    checkAuth();
    fetchDomains();
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

  // PUBLIC LANDING VIEW
  if (currentPage === 'landing') {
    return (
      <>
        <PublicLandingView
          onGoToDashboard={() => setCurrentPage(user ? 'dashboard' : 'login')}
          onGoToLogin={() => setCurrentPage('login')}
          isLoggedIn={Boolean(user)}
          activeDomainName={activeDomainName}
        />
        <ReportAbuseModal
          isOpen={reportAbuseOpen}
          onClose={() => setReportAbuseOpen(false)}
        />
      </>
    );
  }

  // AUTH VIEWS (LOGIN / SETUP)
  if (currentPage === 'login' || currentPage === 'setup') {
    return (
      <AuthView
        initialMode={currentPage === 'setup' ? 'setup' : 'login'}
        onLoginSuccess={handleLoginSuccess}
        onNavigateHome={() => setCurrentPage('landing')}
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
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => setCurrentPage(p)}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          userRole={user?.role}
          onCreateLinkClick={() => {
            if (currentPage !== 'dashboard') {
              setCurrentPage('dashboard');
            }
            setCreateModalOpen(true);
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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

          {/* Pixels */}
          {currentPage === 'pixels' && <PixelsView />}

          {/* Monetization & Revenue */}
          {currentPage === 'monetization' && (
            <MonetizationView user={user} onNavigate={(p) => setCurrentPage(p)} />
          )}

          {/* Integrations */}
          {currentPage === 'integrations' && <IntegrationsView />}

          {/* Settings */}
          {currentPage.startsWith('settings') && (
            <SettingsView
              user={user}
              subPage={currentPage.replace('settings-', '')}
              onUserUpdated={async () => {
                const res = await apiRequest('auth/me');
                if (res.success && res.data) setUser(res.data);
              }}
            />
          )}

          {/* Help */}
          {currentPage === 'help' && <HelpView />}
        </main>
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
