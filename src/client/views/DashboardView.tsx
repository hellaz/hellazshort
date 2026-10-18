import React, { useState, useEffect, useMemo } from 'react';
import { Domain, Link as LinkType, Tag, Category, Pixel } from '../types';
import { apiRequest } from '../api';
import { useToast } from '../components/Toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  Plus,
  Copy,
  Check,
  QrCode,
  Edit2,
  Trash2,
  BarChart2,
  ExternalLink,
  Download,
  Upload,
  Tag as TagIcon,
  Folder,
  Layers,
  Lock,
  Globe,
  Smartphone,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
} from 'lucide-react';

interface DashboardViewProps {
  currentDomainId: string;
  domains: Domain[];
  onViewAnalytics: (linkId?: string) => void;
  createModalOpen?: boolean;
  onCloseCreateModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentDomainId,
  domains,
  onViewAnalytics,
  createModalOpen,
  onCloseCreateModal,
}) => {
  const { showToast } = useToast();

  const [links, setLinks] = useState<LinkType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [perPage, setPerPage] = useState(50);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);

  // QR Modal
  const [qrLink, setQrLink] = useState<LinkType | null>(null);

  // CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);

  // Tags & Categories Modals
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Delete Link Confirm
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  // Form State for Create / Edit
  const [formDomainId, setFormDomainId] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formRedirectCode, setFormRedirectCode] = useState(301);
  const [formPassword, setFormPassword] = useState('');
  const [formIsCloaked, setFormIsCloaked] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formMaxClicks, setFormMaxClicks] = useState('');

  // Advanced Accordions in Create/Edit
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  const [showTargeting, setShowTargeting] = useState(false);
  const [targetIos, setTargetIos] = useState('');
  const [targetAndroid, setTargetAndroid] = useState('');
  const [targetDesktop, setTargetDesktop] = useState('');
  const [targetMobile, setTargetMobile] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [targetCountryUrl, setTargetCountryUrl] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [targetCityUrl, setTargetCityUrl] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageUrl, setTargetLanguageUrl] = useState('');

  // Splash Interstitial Configuration
  const [showSplashConfig, setShowSplashConfig] = useState(false);
  const [splashEnabled, setSplashEnabled] = useState(false);
  const [splashCountdown, setSplashCountdown] = useState(5);
  const [splashTitle, setSplashTitle] = useState('Sponsored Destination');
  const [splashMessage, setSplashMessage] = useState('You will be redirected to your destination shortly.');
  const [splashBannerUrl, setSplashBannerUrl] = useState('');
  const [splashButtonText, setSplashButtonText] = useState('Proceed to Destination');

  const [selectedPixelIds, setSelectedPixelIds] = useState<string[]>([]);

  // OpenGraph Meta
  const [showOgMeta, setShowOgMeta] = useState(false);
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const linkQuery = currentDomainId ? `domain_id=${currentDomainId}&limit=500&include_redirects=true` : 'limit=500&include_redirects=true';
      const [linksRes, tagsRes, catsRes, pixelsRes] = await Promise.all([
        apiRequest(`links?${linkQuery}`),
        apiRequest('tags'),
        apiRequest('categories'),
        apiRequest('pixels'),
      ]);

      if (linksRes.success && Array.isArray(linksRes.data)) {
        setLinks(linksRes.data);
      }
      if (tagsRes.success && Array.isArray(tagsRes.data)) {
        setTags(tagsRes.data);
      }
      if (catsRes.success && Array.isArray(catsRes.data)) {
        setCategories(catsRes.data);
      }
      if (pixelsRes.success && Array.isArray(pixelsRes.data)) {
        setPixels(pixelsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDomainId]);

  // Open modal if prop changes
  useEffect(() => {
    if (createModalOpen) {
      handleOpenCreate();
    }
  }, [createModalOpen]);

  const handleOpenCreate = () => {
    setEditingLink(null);
    const availableDomains = domains.filter(
      (d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost'
    );
    setFormDomainId(currentDomainId || (availableDomains[0]?.id || ''));
    setFormDestination('');
    setFormSlug('');
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setFormTags([]);
    setFormRedirectCode(301);
    setFormPassword('');
    setFormIsCloaked(false);
    setFormExpiresAt('');
    setFormMaxClicks('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');
    setTargetIos('');
    setTargetAndroid('');
    setTargetDesktop('');
    setTargetMobile('');
    setTargetCountry('');
    setTargetCountryUrl('');
    setTargetCity('');
    setTargetCityUrl('');
    setTargetLanguage('');
    setTargetLanguageUrl('');
    setSplashEnabled(false);
    setSplashCountdown(5);
    setSplashTitle('Sponsored Destination');
    setSplashMessage('You will be redirected to your destination shortly.');
    setSplashBannerUrl('');
    setSplashButtonText('Proceed to Destination');
    setSelectedPixelIds([]);
    setOgTitle('');
    setOgDescription('');
    setOgImage('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (link: any) => {
    setEditingLink(link);
    setFormDomainId(link.domain_id);
    setFormDestination(link.destination_url);
    setFormSlug(link.slug);
    setFormTitle(link.title || '');
    setFormDescription(link.description || '');
    setFormCategory(link.category || '');
    setFormTags(link.tags || []);
    setFormRedirectCode(link.redirect_code || 301);
    setFormPassword(link.password || '');
    setFormIsCloaked(Boolean(link.is_cloaked));
    setFormExpiresAt(link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '');

    // Parse metadata
    let meta: any = {};
    try {
      meta = typeof link.metadata === 'string' ? JSON.parse(link.metadata) : (link.metadata || {});
    } catch {
      meta = {};
    }

    setFormMaxClicks(meta.max_clicks ? String(meta.max_clicks) : '');
    setSplashEnabled(Boolean(meta.splash?.enabled));
    setSplashCountdown(meta.splash?.countdown || 5);
    setSplashTitle(meta.splash?.title || 'Sponsored Destination');
    setSplashMessage(meta.splash?.message || '');
    setSplashBannerUrl(meta.splash?.banner_url || '');
    setSplashButtonText(meta.splash?.button_text || 'Proceed to Destination');

    // UTM (extract if present in destination)
    try {
      const u = new URL(link.destination_url);
      setUtmSource(u.searchParams.get('utm_source') || '');
      setUtmMedium(u.searchParams.get('utm_medium') || '');
      setUtmCampaign(u.searchParams.get('utm_campaign') || '');
      setUtmTerm(u.searchParams.get('utm_term') || '');
      setUtmContent(u.searchParams.get('utm_content') || '');
    } catch {
      // ignore
    }

    // OS redirects
    const iosRedirect = link.os_redirects?.find((r: any) => r.os === 'ios')?.destination_url || link.redirect_rules?.device?.['ios'] || '';
    const androidRedirect = link.os_redirects?.find((r: any) => r.os === 'android')?.destination_url || link.redirect_rules?.device?.['android'] || '';
    setTargetIos(iosRedirect);
    setTargetAndroid(androidRedirect);

    // Device redirects
    const desktopRedirect = link.device_redirects?.find((r: any) => r.device_type === 'desktop')?.destination_url || '';
    const mobileRedirect = link.device_redirects?.find((r: any) => r.device_type === 'mobile')?.destination_url || '';
    setTargetDesktop(desktopRedirect);
    setTargetMobile(mobileRedirect);

    // Geo redirects
    if (link.geo_redirects && link.geo_redirects.length > 0) {
      setTargetCountry(link.geo_redirects[0].country_code);
      setTargetCountryUrl(link.geo_redirects[0].destination_url);
    } else if (link.redirect_rules?.geo) {
      const firstCountry = Object.keys(link.redirect_rules.geo)[0];
      setTargetCountry(firstCountry || '');
      setTargetCountryUrl(firstCountry ? link.redirect_rules.geo[firstCountry] : '');
    } else {
      setTargetCountry('');
      setTargetCountryUrl('');
    }

    // City redirects
    if (link.city_redirects && link.city_redirects.length > 0) {
      setTargetCity(link.city_redirects[0].city_name);
      setTargetCityUrl(link.city_redirects[0].destination_url);
    } else {
      setTargetCity('');
      setTargetCityUrl('');
    }

    // Language redirects
    if (meta.language_redirects) {
      const firstLang = Object.keys(meta.language_redirects)[0];
      setTargetLanguage(firstLang || '');
      setTargetLanguageUrl(firstLang ? meta.language_redirects[firstLang] : '');
    } else {
      setTargetLanguage('');
      setTargetLanguageUrl('');
    }

    setSelectedPixelIds(link.pixel_ids || []);
    setOgTitle(link.og_meta?.og_title || link.og_meta?.title || '');
    setOgDescription(link.og_meta?.og_description || link.og_meta?.description || '');
    setOgImage(link.og_meta?.og_image || link.og_meta?.image || '');

    setIsEditModalOpen(true);
  };

  // Generate random short slug
  const handleRandomSlug = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormSlug(res);
  };

  // Build final destination URL with UTM params if filled
  const computedDestinationUrl = useMemo(() => {
    if (!formDestination) return '';
    try {
      const url = new URL(formDestination.startsWith('http') ? formDestination : `https://${formDestination}`);
      if (utmSource) url.searchParams.set('utm_source', utmSource);
      if (utmMedium) url.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) url.searchParams.set('utm_campaign', utmCampaign);
      if (utmTerm) url.searchParams.set('utm_term', utmTerm);
      if (utmContent) url.searchParams.set('utm_content', utmContent);
      return url.toString();
    } catch {
      return formDestination;
    }
  }, [formDestination, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  // Save Link (Create or Update)
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDestination) {
      showToast('Please enter a destination URL', 'error');
      return;
    }

    let finalDest = formDestination.trim();
    if (!finalDest.startsWith('http://') && !finalDest.startsWith('https://')) {
      finalDest = `https://${finalDest}`;
    }

    // Apply UTM params
    if (utmSource || utmMedium || utmCampaign) {
      try {
        const u = new URL(finalDest);
        if (utmSource) u.searchParams.set('utm_source', utmSource);
        if (utmMedium) u.searchParams.set('utm_medium', utmMedium);
        if (utmCampaign) u.searchParams.set('utm_campaign', utmCampaign);
        if (utmTerm) u.searchParams.set('utm_term', utmTerm);
        if (utmContent) u.searchParams.set('utm_content', utmContent);
        finalDest = u.toString();
      } catch {
        // ignore
      }
    }

    const cleanSlug = formSlug ? formSlug.trim().replace(/^\/+|\/+$/g, '') : undefined;

    // Metadata composition
    const metadataObj: any = {
      ...(editingLink?.metadata ? (typeof editingLink.metadata === 'string' ? JSON.parse(editingLink.metadata) : editingLink.metadata) : {}),
    };

    if (splashEnabled) {
      metadataObj.splash = {
        enabled: true,
        countdown: Number(splashCountdown) || 5,
        title: splashTitle.trim() || 'Sponsored Destination',
        message: splashMessage.trim() || '',
        banner_url: splashBannerUrl.trim() || undefined,
        button_text: splashButtonText.trim() || 'Proceed to Destination',
      };
    } else {
      delete metadataObj.splash;
    }

    if (formMaxClicks) {
      metadataObj.max_clicks = Number(formMaxClicks);
    } else {
      delete metadataObj.max_clicks;
    }

    if (targetLanguage && targetLanguageUrl) {
      metadataObj.language_redirects = {
        [targetLanguage.trim().toLowerCase()]: targetLanguageUrl.trim(),
      };
    } else {
      delete metadataObj.language_redirects;
    }

    // Dynamic redirects
    const geo_redirects = targetCountry && targetCountryUrl
      ? [{ country_code: targetCountry.trim().toUpperCase(), destination_url: targetCountryUrl.trim() }]
      : [];
    const city_redirects = targetCity && targetCityUrl
      ? [{ city_name: targetCity.trim().toLowerCase(), destination_url: targetCityUrl.trim() }]
      : [];
    const os_redirects = [];
    if (targetIos) os_redirects.push({ os: 'ios' as const, destination_url: targetIos.trim() });
    if (targetAndroid) os_redirects.push({ os: 'android' as const, destination_url: targetAndroid.trim() });
    const device_redirects = [];
    if (targetDesktop) device_redirects.push({ device_type: 'desktop' as const, destination_url: targetDesktop.trim() });
    if (targetMobile) device_redirects.push({ device_type: 'mobile' as const, destination_url: targetMobile.trim() });

    const payload: any = {
      domain_id: formDomainId,
      destination_url: finalDest,
      slug: cleanSlug,
      title: formTitle.trim() || undefined,
      description: formDescription.trim() || undefined,
      category_id: formCategory.trim() || undefined,
      tags: formTags.length > 0 ? formTags : [],
      redirect_code: Number(formRedirectCode) || 301,
      password: formPassword.trim() || undefined,
      is_cloaked: formIsCloaked,
      expires_at: formExpiresAt ? new Date(formExpiresAt).getTime() : undefined,
      metadata: metadataObj,
      pixel_ids: selectedPixelIds,
      geo_redirects,
      city_redirects,
      os_redirects,
      device_redirects,
    };

    // OpenGraph meta
    if (ogTitle || ogDescription || ogImage) {
      payload.og_meta = {
        og_title: ogTitle.trim() || undefined,
        og_description: ogDescription.trim() || undefined,
        og_image: ogImage.trim() || undefined,
      };
    }

    let res;
    if (editingLink) {
      res = await apiRequest(`links/${editingLink.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiRequest('links', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    if (res.success) {
      showToast(editingLink ? 'Link updated successfully' : 'Short link created!', 'success');
      setIsEditModalOpen(false);
      if (onCloseCreateModal) onCloseCreateModal();
      fetchData();
    } else {
      showToast(res.error || res.message || 'Failed to save link', 'error');
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: string) => {
    const res = await apiRequest(`links/${id}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Link deleted successfully', 'success');
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setDeletingLinkId(null);
    } else {
      showToast(res.error || 'Failed to delete link', 'error');
    }
  };

  // Copy Short Link
  const handleCopyLink = (link: LinkType) => {
    const domain = domains.find((d) => d.id === link.domain_id);
    const domainName = domain ? domain.domain_name : window.location.host;
    const fullShortUrl = `https://${domainName}/${link.slug}`;

    navigator.clipboard.writeText(fullShortUrl);
    setCopiedId(link.id);
    showToast(`Copied ${fullShortUrl} to clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Format full link
  const getFullShortUrl = (link: LinkType) => {
    const domain = domains.find((d) => d.id === link.domain_id);
    const domainName = domain ? domain.domain_name : window.location.host;
    return `https://${domainName}/${link.slug}`;
  };

  // CSV Export
  const handleExportCSV = () => {
    if (links.length === 0) {
      showToast('No links to export', 'info');
      return;
    }
    const headers = ['Slug', 'Destination URL', 'Title', 'Clicks', 'Category', 'Tags', 'Created At'];
    const rows = links.map((l) => [
      `"${l.slug}"`,
      `"${l.destination_url.replace(/"/g, '""')}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      l.clicks_count || 0,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${(l.tags || []).join(';')}"`,
      new Date(l.created_at).toISOString(),
    ]);

    const csvStr = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urlz-links-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported links to CSV', 'success');
  };

  // CSV Import
  const handleImportCSV = async () => {
    if (!csvContent.trim()) {
      showToast('Please provide CSV content', 'error');
      return;
    }
    setImporting(true);
    try {
      const res = await apiRequest('links/import', {
        method: 'POST',
        body: JSON.stringify({
          domain_id: currentDomainId || domains[0]?.id,
          csv: csvContent,
        }),
      });

      if (res.success) {
        showToast('Links imported successfully!', 'success');
        setIsImportModalOpen(false);
        setCsvContent('');
        fetchData();
      } else {
        showToast(res.error || 'Failed to import CSV', 'error');
      }
    } finally {
      setImporting(false);
    }
  };

  // Filter links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSlug = link.slug.toLowerCase().includes(q);
        const matchesDest = link.destination_url.toLowerCase().includes(q);
        const matchesTitle = (link.title || '').toLowerCase().includes(q);
        if (!matchesSlug && !matchesDest && !matchesTitle) return false;
      }
      if (selectedTag && !(link.tags || []).includes(selectedTag)) {
        return false;
      }
      if (selectedCategory && link.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [links, search, selectedTag, selectedCategory]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks_count || 0), 0);
    const activeCount = links.filter((l) => l.status === 'active').length;
    const brokenCount = links.filter((l) => l.last_status_code && l.last_status_code >= 400).length;
    return {
      totalLinks: links.length,
      totalClicks,
      activeCount,
      brokenCount,
    };
  }, [links]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Links</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalLinks}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Clicks</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalClicks.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">Tracked</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Links</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeCount}</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Healthy
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link Health</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${stats.brokenCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {stats.brokenCount}
            </span>
            <span className="text-xs text-slate-500">{stats.brokenCount > 0 ? 'Issues detected' : '0 errors'}</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Header & Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Link Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, customize, and analyze shortened links with targeting and tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Link</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by slug, title, or destination..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                #{t.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Manage Tags / Categories Buttons */}
          <button
            onClick={() => setIsTagModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <TagIcon className="w-3.5 h-3.5" />
            <span>Tags</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh links"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Links Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Short URL</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-center">Clicks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Taxonomy</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading your short links...</span>
                  </td>
                </tr>
              ) : filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No links found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || selectedTag || selectedCategory
                        ? 'Try clearing the filters or search term'
                        : 'Create your first shortened link to get started!'}
                    </p>
                    {!search && !selectedTag && !selectedCategory && (
                      <button
                        onClick={handleOpenCreate}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Link</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLinks.slice(0, perPage).map((link) => {
                  const fullUrl = getFullShortUrl(link);
                  const isCopied = copiedId === link.id;

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Short URL Column */}
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">/{link.slug}</span>
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Open link in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {link.title && (
                          <div className="font-sans text-[11px] text-slate-500 font-normal truncate max-w-[200px]">
                            {link.title}
                          </div>
                        )}
                      </td>

                      {/* Destination URL */}
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div
                          className="truncate text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                          title={link.destination_url}
                        >
                          {link.destination_url}
                        </div>
                        {/* Features Badges (Targeting, Password, Pixels) */}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                          {link.password && (
                            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded font-sans">
                              <Lock className="w-2.5 h-2.5" /> Protected
                            </span>
                          )}
                          {link.is_cloaked && (
                            <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded font-sans">
                              <Eye className="w-2.5 h-2.5" /> Cloaked
                            </span>
                          )}
                          {link.redirect_rules?.device && (
                            <span className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-sans">
                              <Smartphone className="w-2.5 h-2.5" /> Device
                            </span>
                          )}
                          {link.redirect_rules?.geo && (
                            <span className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-sans">
                              <Globe className="w-2.5 h-2.5" /> Geo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {link.clicks_count || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            link.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : link.status === 'expired'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              link.status === 'active'
                                ? 'bg-emerald-500'
                                : link.status === 'expired'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {link.status}
                        </span>
                      </td>

                      {/* Category & Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {link.category && (
                            <span className="text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                              {link.category}
                            </span>
                          )}
                          {(link.tags || []).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setQrLink(link)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Show QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewAnalytics(link.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                            title="View Analytics"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(link)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Link"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingLinkId(link.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingLink ? 'Edit Short Link' : 'Create New Short Link'}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure destination, custom slug, redirects, and tracking parameters
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/very/long/product/url"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Domain & Custom Slug Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Domain
                  </label>
                  <select
                    value={formDomainId}
                    onChange={(e) => setFormDomainId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    {domains
                      .filter((d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost')
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.domain_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Custom or Multi-segment Slug (optional)
                    </label>
                    <button
                      type="button"
                      onClick={handleRandomSlug}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Random
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg select-none">
                      /
                    </span>
                    <input
                      type="text"
                      placeholder="promo2025 or campaign/summer"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\/]/g, ''))}
                      className="w-full px-3 py-2 text-sm font-mono rounded-r-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Multi-segment custom slugs supported (e.g. promo/summer or shop/2026)</p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-mono text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span className="truncate">
                  Target Short URL: https://{domains.find((d) => d.id === formDomainId)?.domain_name || 'urlz.eu.org'}/{formSlug || 'auto-generated'}
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-500 font-sans ml-2 shrink-0">Live Preview</span>
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Summer Sale Campaign"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    list="category-options"
                    placeholder="e.g. Marketing, Social, Internal"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                  <datalist id="category-options">
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (type and press Enter)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  {formTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setFormTags(formTags.filter((t) => t !== tag))}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                        e.preventDefault();
                        const cleaned = tagInput.trim().replace(/^#/, '');
                        if (!formTags.includes(cleaned)) {
                          setFormTags([...formTags, cleaned]);
                        }
                        setTagInput('');
                      }
                    }}
                    placeholder={formTags.length === 0 ? 'e.g. twitter, campaign2025' : ''}
                    className="flex-1 min-w-[120px] text-xs bg-transparent focus:outline-hidden text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* HTTP Code & Security & Cloaking */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Redirect Code
                  </label>
                  <select
                    value={formRedirectCode}
                    onChange={(e) => setFormRedirectCode(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value={301}>301 Permanent</option>
                    <option value={302}>302 Temporary</option>
                    <option value={307}>307 Temporary</option>
                    <option value={308}>308 Permanent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password Protection
                  </label>
                  <input
                    type="password"
                    placeholder="Optional password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Limited Access: Maximum Visits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Visits Limit (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500 visits"
                    value={formMaxClicks}
                    onChange={(e) => setFormMaxClicks(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Automatically disables link after reaching visit threshold</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Security &amp; Privacy Verification
                  </label>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>GDPR Compliant &bull; Bot Filtered &bull; Phishing Scanned</span>
                  </div>
                </div>
              </div>

              {/* UTM Builder Accordion */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowUtmBuilder(!showUtmBuilder)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span>UTM Campaign Builder</span>
                  {showUtmBuilder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showUtmBuilder && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          utm_source
                        </label>
                        <input
                          type="text"
                          placeholder="twitter, newsletter, google"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          utm_medium
                        </label>
                        <input
                          type="text"
                          placeholder="social, email, cpc"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          utm_campaign
                        </label>
                        <input
                          type="text"
                          placeholder="summer_promo_2025"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Targeting Rules (Device, Geo & Language) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTargeting(!showTargeting)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span>Dynamic Redirects: Geo, Device &amp; Language</span>
                  {showTargeting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTargeting && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500">
                      Dynamically redirect visitors to different places based on device, country, or language.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          iOS Destination Override
                        </label>
                        <input
                          type="text"
                          placeholder="https://apps.apple.com/app/..."
                          value={targetIos}
                          onChange={(e) => setTargetIos(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Android Destination Override
                        </label>
                        <input
                          type="text"
                          placeholder="https://play.google.com/store/apps/..."
                          value={targetAndroid}
                          onChange={(e) => setTargetAndroid(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Country Code (e.g. GR, US, DE)
                        </label>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="GR"
                          value={targetCountry}
                          onChange={(e) => setTargetCountry(e.target.value.toUpperCase())}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Country Destination URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://mysite.gr/product"
                          value={targetCountryUrl}
                          onChange={(e) => setTargetCountryUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    {/* City Override */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          City Name (e.g. Athens, London, New York)
                        </label>
                        <input
                          type="text"
                          placeholder="Athens"
                          value={targetCity}
                          onChange={(e) => setTargetCity(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          City Destination URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://mysite.gr/athens-special"
                          value={targetCityUrl}
                          onChange={(e) => setTargetCityUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    {/* Desktop & Mobile Overrides */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Desktop Device Override
                        </label>
                        <input
                          type="text"
                          placeholder="https://mysite.com/desktop-version"
                          value={targetDesktop}
                          onChange={(e) => setTargetDesktop(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Mobile Device Override
                        </label>
                        <input
                          type="text"
                          placeholder="https://m.mysite.com"
                          value={targetMobile}
                          onChange={(e) => setTargetMobile(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Language Code (e.g. el, en, fr)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="el"
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value.toLowerCase())}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 lowercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Language Destination URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://mysite.com/el/welcome"
                          value={targetLanguageUrl}
                          onChange={(e) => setTargetLanguageUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Splash Page Interstitial (Monetization & Announcements) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSplashConfig(!showSplashConfig)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span>Splash Page Interstitial (Monetization &amp; Ads)</span>
                    {splashEnabled && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold">
                        Active ({splashCountdown}s)
                      </span>
                    )}
                  </div>
                  {showSplashConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showSplashConfig && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={splashEnabled}
                        onChange={(e) => setSplashEnabled(e.target.checked)}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Enable Interstitial Splash Page Before Redirecting
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Displays a timed interstitial screen with countdown, promotional message or ad banner, and a skip button.
                    </p>

                    {splashEnabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Countdown Delay (seconds)
                            </label>
                            <input
                              type="number"
                              min="2"
                              max="30"
                              value={splashCountdown}
                              onChange={(e) => setSplashCountdown(Math.max(2, parseInt(e.target.value) || 5))}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Sponsor / Heading Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sponsored Destination"
                              value={splashTitle}
                              onChange={(e) => setSplashTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Custom Message / Ad Copy
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Check out our exclusive deals before proceeding..."
                            value={splashMessage}
                            onChange={(e) => setSplashMessage(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Banner Image URL (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://example.com/ad-banner.png"
                              value={splashBannerUrl}
                              onChange={(e) => setSplashBannerUrl(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Continue Button Text
                            </label>
                            <input
                              type="text"
                              placeholder="Proceed to Destination"
                              value={splashButtonText}
                              onChange={(e) => setSplashButtonText(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pixels Selection */}
              {pixels.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Attach Tracking Pixels
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pixels.map((pix) => (
                      <label
                        key={pix.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPixelIds.includes(pix.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPixelIds([...selectedPixelIds, pix.id]);
                            } else {
                              setSelectedPixelIds(selectedPixelIds.filter((id) => id !== pix.id));
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-medium truncate">{pix.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition-colors"
                >
                  {editingLink ? 'Save Changes' : 'Create Short Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">QR Code</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Scan to open short link on mobile devices
            </p>

            <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block shadow-inner mx-auto mb-4">
              <QRCodeSVG
                value={getFullShortUrl(qrLink)}
                size={200}
                level="H"
                includeMargin
              />
            </div>

            <p className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 break-all">
              {getFullShortUrl(qrLink)}
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleCopyLink(qrLink)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </button>
              <button
                onClick={() => setQrLink(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Links from CSV</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Paste CSV contents below. Expected columns:{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">
                slug,destination_url,title,category,tags
              </code>
            </p>

            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={`slug,destination_url,title,category,tags\nsite,https://mywebsite.com,Homepage,Internal,web\nshop,https://store.example.com,Store,Sales,store;ecommerce`}
              className="w-full p-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />

            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSV}
                disabled={importing}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
              >
                {importing ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE TAGS MODAL */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-indigo-500" /> Manage Tags
              </h3>
              <button onClick={() => setIsTagModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add tag form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                onClick={async () => {
                  if (!newTagName.trim()) return;
                  const res = await apiRequest('tags', {
                    method: 'POST',
                    body: JSON.stringify({ name: newTagName.trim() }),
                  });
                  if (res.success) {
                    showToast('Tag created', 'success');
                    setNewTagName('');
                    fetchData();
                  } else {
                    showToast(res.error || 'Failed to create tag', 'error');
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">#{tag.name}</span>
                  <button
                    onClick={async () => {
                      const res = await apiRequest(`tags/${tag.id}`, { method: 'DELETE' });
                      if (res.success) {
                        setTags(tags.filter((t) => t.id !== tag.id));
                        showToast('Tag deleted', 'success');
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-500" /> Manage Categories
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add category form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <button
                onClick={async () => {
                  if (!newCategoryName.trim()) return;
                  const res = await apiRequest('categories', {
                    method: 'POST',
                    body: JSON.stringify({ name: newCategoryName.trim() }),
                  });
                  if (res.success) {
                    showToast('Category created', 'success');
                    setNewCategoryName('');
                    fetchData();
                  } else {
                    showToast(res.error || 'Failed to create category', 'error');
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                  <button
                    onClick={async () => {
                      const res = await apiRequest(`categories/${cat.id}`, { method: 'DELETE' });
                      if (res.success) {
                        setCategories(categories.filter((c) => c.id !== cat.id));
                        showToast('Category deleted', 'success');
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingLinkId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Short Link?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              This action cannot be undone. Any traffic accessing this short URL will receive a 404.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeletingLinkId(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLink(deletingLinkId)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
