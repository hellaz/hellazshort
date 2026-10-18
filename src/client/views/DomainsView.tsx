import React, { useState } from 'react';
import { Domain } from '../types';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  Layers,
  X,
  HelpCircle,
} from 'lucide-react';

interface DomainsViewProps {
  domains: Domain[];
  onRefresh: () => void;
}

export const DomainsView: React.FC<DomainsViewProps> = ({ domains, onRefresh }) => {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [routingPath, setRoutingPath] = useState('/*');
  const [redirectCode, setRedirectCode] = useState(301);
  const [submitting, setSubmitting] = useState(false);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) {
      showToast('Please provide a domain name', 'error');
      return;
    }

    setSubmitting(true);
    const cleanedDomain = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    try {
      const res = await apiRequest('domains', {
        method: 'POST',
        body: JSON.stringify({
          domain_name: cleanedDomain,
          routing_path: routingPath.trim() || '/*',
          default_redirect_code: Number(redirectCode),
        }),
      });

      if (res.success) {
        showToast(`Domain ${cleanedDomain} added successfully!`, 'success');
        setIsAddModalOpen(false);
        setDomainName('');
        onRefresh();
      } else {
        showToast(res.error || 'Failed to add domain', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDomain = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove domain "${name}"?`)) return;
    const res = await apiRequest(`domains/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast(`Domain ${name} deleted`, 'success');
      onRefresh();
    } else {
      showToast(res.error || 'Failed to delete domain', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Custom Domains &amp; Routing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect your own branded domains (e.g. urlz.eu.org, urlz.gr) to route short links
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Domain</span>
        </button>
      </div>

      {/* Domain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {domains
          .filter((d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost')
          .map((domain) => (
          <div
            key={domain.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {domain.domain_name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Route: {domain.routing_path || '/*'}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl font-medium">
              <div>
                <span className="block text-[11px] text-slate-400">Redirect Code</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {domain.default_redirect_code || 301}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Created At</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {new Date(domain.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <a
                href={`https://${domain.domain_name}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Visit Domain</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {domains.length > 1 && (
                <button
                  onClick={() => handleDeleteDomain(domain.id, domain.domain_name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Remove domain"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cloudflare DNS Setup Guide */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Cloudflare DNS Configuration Guide</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          To map a custom domain (such as <code className="text-indigo-300">urlz.eu.org</code> or{' '}
          <code className="text-indigo-300">urlz.gr</code>), add a CNAME record in your Cloudflare DNS pointing to your Worker:
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400">Type: <span className="text-emerald-400 font-bold">CNAME</span></div>
          <div className="text-slate-400">Name: <span className="text-emerald-400 font-bold">@</span> (or subdomain e.g. <span className="text-emerald-400">go</span>)</div>
          <div className="text-slate-400">Target: <span className="text-indigo-400 font-bold">hellazshort.workers.dev</span> (or your custom domain)</div>
          <div className="text-slate-400">Proxy status: <span className="text-amber-400 font-bold">Proxied (Orange Cloud)</span></div>
        </div>
      </div>

      {/* ADD DOMAIN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Custom Domain</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. urlz.gr or links.mydomain.com"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Routing Pattern
                </label>
                <input
                  type="text"
                  placeholder="/* or /go/*"
                  value={routingPath}
                  onChange={(e) => setRoutingPath(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Redirect Code
                </label>
                <select
                  value={redirectCode}
                  onChange={(e) => setRedirectCode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                  <option value={307}>307 Temporary</option>
                  <option value={308}>308 Permanent</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {submitting ? 'Adding...' : 'Add Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
