import React, { useState, useEffect } from 'react';
import { ApiKey, User } from '../types';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  X,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface IntegrationsViewProps {
  user?: User | null;
  onNavigate?: (page: string) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ user, onNavigate }) => {
  const { showToast } = useToast();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(isAdmin);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [codeTab, setCodeTab] = useState<'curl' | 'node' | 'python'>('curl');

  const fetchKeys = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await apiRequest('api-keys');
      if (res.success && Array.isArray(res.data)) {
        setApiKeys(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchKeys();
    }
  }, [isAdmin]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await apiRequest('api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: keyName.trim() }),
      });

      if (res.success && res.data) {
        setNewSecretKey(res.data.key || res.data.secret || res.data.api_key || 'key_live_' + Math.random().toString(36).slice(2));
        showToast('API key generated! Copy it now.', 'success');
        setKeyName('');
        fetchKeys();
      } else {
        showToast(res.error || 'Failed to create API key', 'error');
      }
    } catch {
      showToast('Network error generating key', 'error');
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Revoke API Key "${name}"? Any active integrations using this key will immediately stop working.`)) return;
    const res = await apiRequest(`api-keys/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('API key revoked', 'success');
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } else {
      showToast(res.error || 'Failed to revoke API key', 'error');
    }
  };

  const currentHost = window.location.host;

  const codeSnippets = {
    curl: `curl -X POST https://${currentHost}/api/v1/links \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination_url": "https://example.com/blog/my-post",
    "slug": "custom-alias",
    "redirect_code": 301
  }'`,
    node: `import axios from 'axios';

const res = await axios.post('https://${currentHost}/api/v1/links', {
  destination_url: 'https://example.com/blog/my-post',
  slug: 'custom-alias',
}, {
  headers: {
    Authorization: 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});

console.log('Short URL:', res.data.data.short_url);`,
    python: `import requests

url = "https://${currentHost}/api/v1/links"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "destination_url": "https://example.com/blog/my-post",
    "slug": "custom-alias"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
              Developer Feature
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              Programmatic REST API Access is Restricted
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
              Programmatic API keys and endpoints are only available to platform administrators unless approved via a paid developer upgrade. Free user accounts create and manage links exclusively through the web dashboard.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>What You Get With a Developer Upgrade</span>
            </div>
            <ul className="text-slate-600 dark:text-slate-400 space-y-1.5 pl-5 list-disc text-[11px] leading-relaxed">
              <li><strong>25,000+ API calls / month</strong> for high-speed automated shortening</li>
              <li><strong>Custom API Key Provisioning</strong> with strict CIDR IP Whitelisting</li>
              <li><strong>Batch Link Generation</strong> and automated link expiration rules</li>
              <li><strong>Webhook Alerts</strong> on status check degradation and broken destination URLs</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('monetization')}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <span>View Plans &amp; Request Upgrade</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Developer API Keys &amp; Integrations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authenticate programmatic requests to create, manage, and analyze links via REST API
          </p>
        </div>

        <button
          onClick={() => {
            setNewSecretKey(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New API Key</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Active API Keys</h3>
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading API keys...</p>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active API keys created yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {apiKeys.map((k) => (
              <div key={k.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{k.name}</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Prefix: {k.key_prefix || 'key_live_...'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-[11px]">
                    Created {new Date(k.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRevokeKey(k.id, k.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Revoke key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code Snippets Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-white">API Usage Code Examples</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {(['curl', 'node', 'python'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-3 py-1 rounded cursor-pointer transition-colors uppercase ${
                  codeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
          <pre className="whitespace-pre">{codeSnippets[codeTab]}</pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeSnippets[codeTab]);
              showToast('Snippet copied to clipboard', 'success');
            }}
            className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            title="Copy code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CREATE KEY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New API Key</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newSecretKey ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Make sure to copy your API key now. You will not be able to see it again!
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono break-all text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>{newSecretKey}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newSecretKey);
                      setCopiedKey(true);
                      showToast('API key copied!', 'success');
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 shrink-0 ml-2"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 bg-slate-900 dark:bg-slate-800 text-white font-semibold rounded-lg mt-2 cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Identifier / Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CI/CD Deployment or Zapier Integration"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                  >
                    Generate API Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
