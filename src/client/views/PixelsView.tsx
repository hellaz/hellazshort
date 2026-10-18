import React, { useState, useEffect } from 'react';
import { Pixel } from '../types';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import {
  Share2,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  X,
  Code2,
  Tag,
} from 'lucide-react';

export const PixelsView: React.FC = () => {
  const { showToast } = useToast();
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [pixelType, setPixelType] = useState<Pixel['pixel_type']>('meta');
  const [pixelId, setPixelId] = useState('');
  const [description, setDescription] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPixels = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('pixels');
      if (res.success && Array.isArray(res.data)) {
        setPixels(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPixels();
  }, []);

  const handleCreatePixel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!pixelId.trim() && pixelType !== 'custom')) {
      showToast('Please fill in required pixel fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('pixels', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          pixel_type: pixelType,
          pixel_id: pixelId.trim() || 'custom',
          description: description.trim() || undefined,
          custom_code: pixelType === 'custom' ? customCode.trim() : undefined,
        }),
      });

      if (res.success) {
        showToast('Tracking pixel added to library!', 'success');
        setIsModalOpen(false);
        setName('');
        setPixelId('');
        setDescription('');
        setCustomCode('');
        fetchPixels();
      } else {
        showToast(res.error || 'Failed to create pixel', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePixel = async (id: string, pixelName: string) => {
    if (!confirm(`Delete pixel "${pixelName}"?`)) return;
    const res = await apiRequest(`pixels/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Pixel deleted', 'success');
      setPixels(pixels.filter((p) => p.id !== id));
    } else {
      showToast(res.error || 'Failed to delete pixel', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Retargeting Pixel Library</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fire tracking tags (Meta, GA4, GTM, TikTok, LinkedIn) when visitors click your short links
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pixel</span>
        </button>
      </div>

      {/* Pixels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">Loading pixels...</div>
        ) : pixels.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No pixels added yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your Meta, GA4, or TikTok pixel to build custom audiences from every click.
            </p>
          </div>
        ) : (
          pixels.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {p.pixel_type}
                </span>
                <button
                  onClick={() => handleDeletePixel(p.id, p.name)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h3>
                <p className="text-xs font-mono text-slate-500 truncate mt-0.5">ID: {p.pixel_id}</p>
                {p.description && <p className="text-xs text-slate-400 mt-1">{p.description}</p>}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to attach
                </span>
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE PIXEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Tracking Pixel</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePixel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pixel Provider
                </label>
                <select
                  value={pixelType}
                  onChange={(e) => setPixelType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="meta">Meta (Facebook) Pixel</option>
                  <option value="ga4">Google Analytics 4 (GA4)</option>
                  <option value="gtm">Google Tag Manager (GTM)</option>
                  <option value="tiktok">TikTok Pixel</option>
                  <option value="linkedin">LinkedIn Insight Tag</option>
                  <option value="pinterest">Pinterest Tag</option>
                  <option value="twitter">Twitter / X Pixel</option>
                  <option value="custom">Custom JavaScript Tag</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pixel Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Facebook Pixel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {pixelType !== 'custom' ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pixel ID / Measurement ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      pixelType === 'meta'
                        ? 'e.g. 123456789012345'
                        : pixelType === 'ga4'
                        ? 'e.g. G-XXXXXXXXXX'
                        : 'e.g. GTM-XXXXXXX'
                    }
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom JavaScript Code
                  </label>
                  <textarea
                    rows={4}
                    placeholder="<script>...</script>"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Used for retargeting campaign visitors"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  disabled={submitting}
                  className="px-4 py-2 font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Pixel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
