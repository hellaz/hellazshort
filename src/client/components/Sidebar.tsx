import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Globe,
  Share2,
  Key,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Users,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onToggle,
  userRole,
}) => {
  const [analyticsOpen, setAnalyticsOpen] = useState(
    currentPage.startsWith('analytics')
  );
  const [settingsOpen, setSettingsOpen] = useState(
    currentPage.startsWith('settings')
  );

  const isCurrent = (page: string) => currentPage === page;

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } shrink-0 bg-slate-900 dark:bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-200 flex flex-col z-30 select-none min-h-[calc(100vh-4rem)]`}
    >
      {/* Sidebar toggle button */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        {isOpen && (
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
            Navigation
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors mx-auto cursor-pointer"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <Sliders className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isCurrent('dashboard')
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
          title="Dashboard & Links"
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          {isOpen && <span>Dashboard</span>}
        </button>

        {/* Analytics Dropdown */}
        <div>
          <button
            onClick={() => {
              if (!isOpen) onToggle();
              setAnalyticsOpen(!analyticsOpen);
              if (!currentPage.startsWith('analytics')) {
                onNavigate('analytics-overview');
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentPage.startsWith('analytics')
                ? 'bg-slate-800 text-indigo-400'
                : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
            title="Analytics"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 shrink-0" />
              {isOpen && <span>Analytics</span>}
            </div>
            {isOpen && (
              analyticsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isOpen && analyticsOpen && (
            <div className="pl-9 pr-2 py-1 space-y-0.5 text-xs">
              {[
                { id: 'analytics-overview', label: 'Overview' },
                { id: 'analytics-geography', label: 'Geography' },
                { id: 'analytics-devices', label: 'Devices' },
                { id: 'analytics-referrers', label: 'Referrers' },
                { id: 'analytics-utm', label: 'UTM Campaigns' },
                { id: 'analytics-os', label: 'Operating Systems' },
                { id: 'analytics-browsers', label: 'Browsers' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onNavigate(sub.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    isCurrent(sub.id)
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link Monitor */}
        <button
          onClick={() => onNavigate('status-monitor')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isCurrent('status-monitor')
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
          title="Link Health Monitor"
        >
          <Activity className="w-5 h-5 shrink-0" />
          {isOpen && <span>Link Monitor</span>}
        </button>

        {/* Domains */}
        <button
          onClick={() => onNavigate('domains')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isCurrent('domains')
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
          title="Custom Domains"
        >
          <Globe className="w-5 h-5 shrink-0" />
          {isOpen && <span>Domains</span>}
        </button>

        {/* Pixels */}
        <button
          onClick={() => onNavigate('pixels')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isCurrent('pixels')
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
          title="Pixel Library"
        >
          <Share2 className="w-5 h-5 shrink-0" />
          {isOpen && <span>Pixel Library</span>}
        </button>

        {/* Integrations & API Keys */}
        <button
          onClick={() => onNavigate('integrations')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isCurrent('integrations')
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
          title="API Keys & Integration"
        >
          <Key className="w-5 h-5 shrink-0" />
          {isOpen && <span>API & Keys</span>}
        </button>

        {/* Settings Dropdown */}
        <div>
          <button
            onClick={() => {
              if (!isOpen) onToggle();
              setSettingsOpen(!settingsOpen);
              if (!currentPage.startsWith('settings')) {
                onNavigate('settings-account');
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentPage.startsWith('settings')
                ? 'bg-slate-800 text-indigo-400'
                : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
            title="Settings"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 shrink-0" />
              {isOpen && <span>Settings</span>}
            </div>
            {isOpen && (
              settingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isOpen && settingsOpen && (
            <div className="pl-9 pr-2 py-1 space-y-0.5 text-xs">
              <button
                onClick={() => onNavigate('settings-account')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  isCurrent('settings-account')
                    ? 'bg-indigo-600/30 text-indigo-300'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Account Info
              </button>
              <button
                onClick={() => onNavigate('settings-security')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  isCurrent('settings-security')
                    ? 'bg-indigo-600/30 text-indigo-300'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Security & 2FA
              </button>
              <button
                onClick={() => onNavigate('settings-status-check')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  isCurrent('settings-status-check')
                    ? 'bg-indigo-600/30 text-indigo-300'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Status Check Config
              </button>
              <button
                onClick={() => onNavigate('settings-default-page')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  isCurrent('settings-default-page')
                    ? 'bg-indigo-600/30 text-indigo-300'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Default Root Page
              </button>
              {(userRole === 'owner' || userRole === 'admin') && (
                <>
                  <button
                    onClick={() => onNavigate('settings-users')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      isCurrent('settings-users')
                        ? 'bg-indigo-600/30 text-indigo-300'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    User Management
                  </button>
                  <button
                    onClick={() => onNavigate('settings-audit')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      isCurrent('settings-audit')
                        ? 'bg-indigo-600/30 text-indigo-300'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Audit Log
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Help */}
        <button
          onClick={() => onNavigate('help')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isCurrent('help')
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-slate-800 hover:text-white text-slate-300'
          }`}
          title="Documentation & Help"
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {isOpen && <span>Help & Docs</span>}
        </button>
      </nav>

      {/* Footer Info */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>URLZ Pro</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">v2.4.0</span>
          </div>
          <p className="text-[10px]">Cloudflare edge link platform</p>
        </div>
      )}
    </aside>
  );
};
