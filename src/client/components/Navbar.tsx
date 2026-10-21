import React from 'react';
import { Domain, User } from '../types';
import { BrandLogo } from './BrandLogo';
import { Moon, Sun, LogOut, Plus, Shield, ChevronDown } from 'lucide-react';
import { DashboardHeaderAd, AdNetworkConfig } from './AdBannerComponents';

interface NavbarProps {
  user: User | null;
  domains: Domain[];
  currentDomainId: string;
  onSelectDomain: (domainId: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onCreateLinkClick: () => void;
  onNavigate: (page: string) => void;
  adConfig?: AdNetworkConfig;
  simulatedRole?: 'owner' | 'admin' | 'pro' | 'user' | null;
  onSimulateRole?: (role: 'owner' | 'admin' | 'pro' | 'user' | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  domains,
  currentDomainId,
  onSelectDomain,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  onCreateLinkClick,
  onNavigate,
  adConfig,
  simulatedRole,
  onSimulateRole,
}) => {
  const effectiveRole = simulatedRole || user?.role || 'user';
  const roleBadge =
    effectiveRole === 'user' ? 'Free' : effectiveRole === 'pro' ? 'Pro' : 'Admin';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden cursor-pointer"
          >
            <BrandLogo variant="auto" size="md" />
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                effectiveRole === 'user'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40'
                  : effectiveRole === 'pro'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
              }`}
            >
              {roleBadge}
            </span>
          </button>
        </div>

        {/* Dashboard 468x60 px Classic Header Ad Banner */}
        <DashboardHeaderAd adConfig={adConfig} />

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Admin Role Simulation Switcher */}
          {(user?.role === 'owner' || user?.role === 'admin') && onSimulateRole && (
            <div className="relative hidden sm:block">
              <select
                value={simulatedRole || user.role}
                onChange={(e) => {
                  const val = e.target.value as any;
                  onSimulateRole(val === user.role ? null : val);
                }}
                className={`appearance-none pl-2.5 pr-7 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                  simulatedRole && simulatedRole !== user.role
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Simulate dashboard view as Admin, Pro User, or Free User"
              >
                <option value={user.role}>👑 View As: Admin</option>
                <option value="pro">⚡ View As: Paid User</option>
                <option value="user">🎁 View As: Free User</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          )}

          {/* Domain Selector */}
          <div className="relative">
            <select
              value={currentDomainId}
              onChange={(e) => onSelectDomain(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors max-w-[180px] sm:max-w-[240px] truncate"
              title="Active Domain"
            >
              <option value="">All Domains</option>
              {domains
                .filter((d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.domain_name} {d.routing_path !== '/*' ? `(${d.routing_path})` : ''}
                  </option>
                ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Add Link */}
          <button
            onClick={onCreateLinkClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
            title="Add Link"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Add Link</span>
            <span className="xs:hidden">Add</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Menu / Role Badge */}
          {user && (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onNavigate('settings-account')}
                className="hidden md:flex flex-col text-right hover:opacity-80 transition-opacity cursor-pointer"
                title="Account Settings"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user.username}
                </span>
                <span className="text-[10px] text-slate-500 capitalize leading-tight flex items-center gap-0.5 justify-end">
                  {user.role === 'owner' && <Shield className="w-2.5 h-2.5 text-indigo-500" />}
                  {user.role}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
