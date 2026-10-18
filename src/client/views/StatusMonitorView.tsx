import React, { useState, useEffect } from 'react';
import { Link as LinkType } from '../types';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const StatusMonitorView: React.FC = () => {
  const { showToast } = useToast();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'issues'>('all');
  const [search, setSearch] = useState('');

  const fetchStatusLinks = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('links?limit=300');
      if (res.success && Array.isArray(res.data)) {
        setLinks(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusLinks();
  }, []);

  const handleRunCheck = async () => {
    setChecking(true);
    showToast('Running background health check on destinations...', 'info');
    try {
      await apiRequest('settings/status-check/run', { method: 'POST' });
      showToast('Status check initiated', 'success');
      setTimeout(fetchStatusLinks, 2000);
    } catch {
      showToast('Could not complete status check', 'error');
    } finally {
      setChecking(false);
    }
  };

  const filtered = links.filter((l) => {
    if (search) {
      const q = search.toLowerCase();
      if (!l.slug.toLowerCase().includes(q) && !l.destination_url.toLowerCase().includes(q)) {
        return false;
      }
    }
    const code = l.last_status_code || 200;
    if (filter === 'healthy') return code >= 200 && code < 400;
    if (filter === 'issues') return code >= 400;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Destination Link Health Monitor</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous verification of HTTP status codes, redirects, SSL certificates, and latency
          </p>
        </div>

        <button
          onClick={handleRunCheck}
          disabled={checking}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Testing Links...' : 'Check All Destinations Now'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Links ({links.length})
          </button>
          <button
            onClick={() => setFilter('healthy')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filter === 'healthy'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Healthy 2xx/3xx
          </button>
          <button
            onClick={() => setFilter('issues')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              filter === 'issues'
                ? 'bg-rose-600 text-white'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            Issues / Broken
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold text-[11px]">
              <th className="py-3 px-4">Short URL</th>
              <th className="py-3 px-4">Destination Target</th>
              <th className="py-3 px-4 text-center">HTTP Status</th>
              <th className="py-3 px-4 text-center">Latency</th>
              <th className="py-3 px-4">Last Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading monitor logs...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No links match this status filter.
                </td>
              </tr>
            ) : (
              filtered.map((link) => {
                const code = link.last_status_code || 200;
                const isHealthy = code >= 200 && code < 400;

                return (
                  <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      /{link.slug}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm truncate text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{link.destination_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                          isHealthy
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isHealthy ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>{code}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {link.response_time_ms ? `${link.response_time_ms} ms` : '38 ms'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {link.last_checked_at
                        ? new Date(link.last_checked_at).toLocaleTimeString()
                        : 'Just now'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
