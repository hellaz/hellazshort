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
  ShieldCheck,
  Timer,
  Laptop,
  Building,
  Share2,
  Settings,
} from 'lucide-react';

interface DashboardViewProps {
  user?: User | null;
  currentDomainId: string;
  domains: Domain[];
  onViewAnalytics: (linkId?: string) => void;
  createModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  userRole?: string;
  onNavigate?: (page: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  currentDomainId,
  domains,
  onViewAnalytics,
  createModalOpen,
  onCloseCreateModal,
  userRole,
  onNavigate,
}) => {
  const isProMember = user?.tier === 'pro' || userRole === 'admin' || userRole === 'owner';
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner' || user?.role === 'admin' || user?.role === 'owner';
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
  const [formRoute, setFormRoute] = useState('/go/*');
  const [formDestination, setFormDestination] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formRedirectCode, setFormRedirectCode] = useState(301);
  const [formPassword, setFormPassword] = useState('');
  const [formIsCloaked, setFormIsCloaked] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formMaxClicks, setFormMaxClicks] = useState('');

  // UTM Campaign Builder
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Dynamic Redirects: Country-Specific
  const [enableGeoRedirects, setEnableGeoRedirects] = useState(false);
  const [geoRedirects, setGeoRedirects] = useState<Array<{ id: string; country_code: string; destination_url: string }>>([]);

  // Dynamic Redirects: City-Specific
  const [enableCityRedirects, setEnableCityRedirects] = useState(false);
  const [cityRedirects, setCityRedirects] = useState<Array<{ id: string; city_name: string; destination_url: string }>>([]);

  // Dynamic Redirects: Device-Specific
  const [enableDeviceRedirects, setEnableDeviceRedirects] = useState(false);
  const [deviceDesktopUrl, setDeviceDesktopUrl] = useState('');
  const [deviceMobileUrl, setDeviceMobileUrl] = useState('');
  const [deviceTabletUrl, setDeviceTabletUrl] = useState('');

  // Dynamic Redirects: OS-Specific
  const [enableOsRedirects, setEnableOsRedirects] = useState(false);
  const [osAndroidUrl, setOsAndroidUrl] = useState('');
  const [osIosUrl, setOsIosUrl] = useState('');

  // Social Media Preview (Open Graph)
  const [enableOgMeta, setEnableOgMeta] = useState(false);
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [ogType, setOgType] = useState<'website' | 'article' | 'product' | 'video.other'>('website');
  const [twitterCard, setTwitterCard] = useState<'summary' | 'summary_large_image'>('summary_large_image');
  const [fetchingOg, setFetchingOg] = useState(false);

  // Splash Interstitial Configuration
  const [showSplashConfig, setShowSplashConfig] = useState(false);
  const [splashEnabled, setSplashEnabled] = useState(false);
  const [splashCountdown, setSplashCountdown] = useState(10);
  const [splashTitle, setSplashTitle] = useState('Sponsored Destination');
  const [splashMessage, setSplashMessage] = useState('You will be redirected to your destination shortly.');
  const [splashBannerUrl, setSplashBannerUrl] = useState('');
  const [splashBannerLink, setSplashBannerLink] = useState('');
  const [splashAdCode, setSplashAdCode] = useState('');
  const [splashButtonText, setSplashButtonText] = useState('Proceed to Destination');
  const [splashShowQr, setSplashShowQr] = useState(true);

  // Modal & Category Helper States
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [showAdvancedRoutes, setShowAdvancedRoutes] = useState(false);
  const [showQuickCategoryInput, setShowQuickCategoryInput] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  // Mobile Deep Linking
  const [deepLinkEnabled, setDeepLinkEnabled] = useState(false);
  const [deepIosUrl, setDeepIosUrl] = useState('');
  const [deepAndroidUrl, setDeepAndroidUrl] = useState('');
  const [deepDesktopUrl, setDeepDesktopUrl] = useState('');

  // Language Redirects
  const [enableLanguageRedirect, setEnableLanguageRedirect] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageUrl, setTargetLanguageUrl] = useState('');

  // Pixels
  const [selectedPixelIds, setSelectedPixelIds] = useState<string[]>([]);

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

  // Path helper matching backend
  const buildShortUrlPath = (route: string | undefined, slug: string): string => {
    if (!slug) return '';
    let urlPath = '/' + slug;
    if (route && route.includes('*')) {
      urlPath = route.split('*').join(slug);
      if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
    } else if (route) {
      urlPath = route.endsWith('/') ? route + slug : route + '/' + slug;
      if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
    }
    return urlPath;
  };

  // Available routes for currently selected domain
  const selectedDomainObj = useMemo(() => {
    return domains.find((d) => d.id === formDomainId);
  }, [domains, formDomainId]);

  const availableRoutes = useMemo(() => {
    if (!selectedDomainObj) return ['/go/*'];
    if (selectedDomainObj.routes && selectedDomainObj.routes.length > 0) {
      return selectedDomainObj.routes;
    }
    if (selectedDomainObj.routing_path) {
      return [selectedDomainObj.routing_path];
    }
    return ['/go/*'];
  }, [selectedDomainObj]);

  // Keep formRoute valid when domain changes
  useEffect(() => {
    if (availableRoutes.length > 0 && !availableRoutes.includes(formRoute)) {
      setFormRoute(availableRoutes[0]);
    }
  }, [availableRoutes, formRoute]);

  // Open modal if prop changes
  useEffect(() => {
    if (createModalOpen) {
      handleOpenCreate();
      if (onCloseCreateModal) {
        onCloseCreateModal();
      }
    }
  }, [createModalOpen]);

  const handleOpenCreate = () => {
    setEditingLink(null);
    const availableDomains = domains.filter(
      (d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost'
    );
    const targetDomainId = currentDomainId || (availableDomains[0]?.id || '');
    setFormDomainId(targetDomainId);

    const dom = domains.find((d) => d.id === targetDomainId);
    const routes = dom?.routes && dom.routes.length > 0 ? dom.routes : [dom?.routing_path || '/*'];
    setFormRoute(routes[0] || '/*');

    setFormDestination('');
    setFormSlug('');
    setFormTitle('');
    setFormDescription('');
    setFormCategoryId('');
    setFormTags([]);
    setTagInput('');
    setFormRedirectCode(301);
    setFormPassword('');
    setFormIsCloaked(false);
    setFormExpiresAt('');
    setFormMaxClicks('');

    // UTM
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmTerm('');
    setUtmContent('');

    // Country Redirects
    setEnableGeoRedirects(false);
    setGeoRedirects([]);

    // City Redirects
    setEnableCityRedirects(false);
    setCityRedirects([]);

    // Device Redirects
    setEnableDeviceRedirects(false);
    setDeviceDesktopUrl('');
    setDeviceMobileUrl('');
    setDeviceTabletUrl('');

    // OS Redirects
    setEnableOsRedirects(false);
    setOsAndroidUrl('');
    setOsIosUrl('');

    // OpenGraph
    setEnableOgMeta(false);
    setOgTitle('');
    setOgDescription('');
    setOgImage('');
    setOgType('website');
    setTwitterCard('summary_large_image');
    setFetchingOg(false);


    setSplashCountdown(10);
    setSplashTitle('Sponsored Destination');
    setSplashMessage('You will be redirected to your destination shortly.');
    setSplashBannerUrl('');
    setSplashBannerLink('');
    setSplashAdCode('');
    setSplashShowQr(true);
    setSplashButtonText('Proceed to Destination');

    // Deep link
    setDeepLinkEnabled(false);
    setDeepIosUrl('');
    setDeepAndroidUrl('');
    setDeepDesktopUrl('');

    // Language
    setTargetLanguage('');
    setTargetLanguageUrl('');

    setSelectedPixelIds([]);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (link: any) => {
    setEditingLink(link);
    setFormDomainId(link.domain_id);
    setFormRoute(link.route || link.routing_path || '/*');
    setFormDestination(link.destination_url);
    setFormSlug(link.slug);
    setFormTitle(link.title || '');
    setFormDescription(link.description || '');
    setFormCategoryId(link.category_id || (link.category?.id || ''));
    setFormTags(Array.isArray(link.tags) ? link.tags.map((t: any) => typeof t === 'string' ? t : (t.name || t.id)) : []);
    setTagInput('');
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
    setSplashCountdown(meta.splash?.countdown || 10);
    setSplashTitle(meta.splash?.title || 'Sponsored Destination');
    setSplashMessage(meta.splash?.message || '');
    setSplashBannerUrl(meta.splash?.banner_url || '');
    setSplashBannerLink(meta.splash?.banner_link || '');
    setSplashAdCode(meta.splash?.ad_code || '');
    setSplashShowQr(meta.splash?.show_qr !== false);
    setSplashButtonText(meta.splash?.button_text || 'Proceed to Destination');

    if (meta.deep_link) {
      setDeepLinkEnabled(Boolean(meta.deep_link.enabled));
      setDeepIosUrl(meta.deep_link.ios_url || '');
      setDeepAndroidUrl(meta.deep_link.android_url || '');
      setDeepDesktopUrl(meta.deep_link.desktop_url || '');
    } else {
      setDeepLinkEnabled(false);
      setDeepIosUrl('');
      setDeepAndroidUrl('');
      setDeepDesktopUrl('');
    }

    if (meta.language_redirects && typeof meta.language_redirects === 'object') {
      const langs = Object.keys(meta.language_redirects);
      if (langs.length > 0) {
        setTargetLanguage(langs[0]);
        setTargetLanguageUrl(meta.language_redirects[langs[0]] || '');
      } else {
        setTargetLanguage('');
        setTargetLanguageUrl('');
      }
    } else {
      setTargetLanguage('');
      setTargetLanguageUrl('');
    }

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

    // Country Redirects
    if (link.geo_redirects && Array.isArray(link.geo_redirects) && link.geo_redirects.length > 0) {
      setEnableGeoRedirects(true);
      setGeoRedirects(
        link.geo_redirects.map((g: any, i: number) => ({
          id: `geo-${i}-${Date.now()}`,
          country_code: g.country_code || '',
          destination_url: g.destination_url || '',
        }))
      );
    } else if (link.redirect_rules?.geo) {
      const entries = Object.entries(link.redirect_rules.geo);
      if (entries.length > 0) {
        setEnableGeoRedirects(true);
        setGeoRedirects(
          entries.map(([c, u], i) => ({
            id: `geo-${i}-${Date.now()}`,
            country_code: c,
            destination_url: String(u),
          }))
        );
      } else {
        setEnableGeoRedirects(false);
        setGeoRedirects([]);
      }
    } else {
      setEnableGeoRedirects(false);
      setGeoRedirects([]);
    }

    // City Redirects
    if (link.city_redirects && Array.isArray(link.city_redirects) && link.city_redirects.length > 0) {
      setEnableCityRedirects(true);
      setCityRedirects(
        link.city_redirects.map((c: any, i: number) => ({
          id: `city-${i}-${Date.now()}`,
          city_name: c.city_name || '',
          destination_url: c.destination_url || '',
        }))
      );
    } else {
      setEnableCityRedirects(false);
      setCityRedirects([]);
    }

    // Device Redirects
    if (link.device_redirects && Array.isArray(link.device_redirects) && link.device_redirects.length > 0) {
      setEnableDeviceRedirects(true);
      const desktop = link.device_redirects.find((d: any) => d.device_type === 'desktop');
      const mobile = link.device_redirects.find((d: any) => d.device_type === 'mobile');
      const tablet = link.device_redirects.find((d: any) => d.device_type === 'tablet');
      setDeviceDesktopUrl(desktop?.destination_url || '');
      setDeviceMobileUrl(mobile?.destination_url || '');
      setDeviceTabletUrl(tablet?.destination_url || '');
    } else {
      setEnableDeviceRedirects(false);
      setDeviceDesktopUrl('');
      setDeviceMobileUrl('');
      setDeviceTabletUrl('');
    }

    // OS Redirects
    if (link.os_redirects && Array.isArray(link.os_redirects) && link.os_redirects.length > 0) {
      setEnableOsRedirects(true);
      const android = link.os_redirects.find((o: any) => o.os === 'android');
      const ios = link.os_redirects.find((o: any) => o.os === 'ios');
      setOsAndroidUrl(android?.destination_url || '');
      setOsIosUrl(ios?.destination_url || '');
    } else {
      setEnableOsRedirects(false);
      setOsAndroidUrl('');
      setOsIosUrl('');
    }

    // OpenGraph
    if (link.og_meta) {
      setEnableOgMeta(true);
      setOgTitle(link.og_meta.og_title || link.og_meta.title || '');
      setOgDescription(link.og_meta.og_description || link.og_meta.description || '');
      setOgImage(link.og_meta.og_image || link.og_meta.image || '');
      setOgType(link.og_meta.og_type || 'website');
      setTwitterCard(link.og_meta.twitter_card || 'summary_large_image');
    } else {
      setEnableOgMeta(false);
      setOgTitle('');
      setOgDescription('');
      setOgImage('');
      setOgType('website');
      setTwitterCard('summary_large_image');
    }

    setSelectedPixelIds((link.pixels || []).map((p: any) => p.id || p));
    setIsEditModalOpen(true);
  };

  // Fetch OpenGraph metadata from destination URL
  const handleFetchOg = async () => {
    if (!formDestination.trim()) {
      showToast('Enter a destination URL first', 'error');
      return;
    }
    let dest = formDestination.trim();
    if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
      dest = `https://${dest}`;
    }
    setFetchingOg(true);
    try {
      const res = await apiRequest('links/og-fetch', {
        method: 'POST',
        body: JSON.stringify({ url: dest }),
      });
      if (res.success && res.data) {
        if (res.data.og_title && !ogTitle) setOgTitle(res.data.og_title);
        if (res.data.og_description && !ogDescription) setOgDescription(res.data.og_description);
        if (res.data.og_image && !ogImage) setOgImage(res.data.og_image);
        showToast('Open Graph preview metadata fetched!', 'success');
      } else {
        showToast(res.error || 'Could not fetch Open Graph metadata', 'error');
      }
    } catch {
      showToast('Failed to fetch Open Graph metadata', 'error');
    } finally {
      setFetchingOg(false);
    }
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

    setIsSavingLink(true);
    try {
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

      // Effective Domain ID fallback
      const availableDomains = domains.filter((d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost');
      const effectiveDomainId = formDomainId || currentDomainId || availableDomains[0]?.id;

      if (!effectiveDomainId) {
        showToast('Please select or configure a domain before creating a link.', 'error');
        setIsSavingLink(false);
        return;
      }

      const cleanSlug = formSlug ? formSlug.trim().replace(/^\/+|\/+$/g, '') : undefined;

      // Metadata composition
      const metadataObj: any = {
        ...(editingLink?.metadata ? (typeof editingLink.metadata === 'string' ? JSON.parse(editingLink.metadata) : editingLink.metadata) : {}),
      };

      if (splashEnabled) {
        metadataObj.splash = {
          enabled: true,
          countdown: Number(splashCountdown) || 10,
          title: splashTitle.trim() || 'Sponsored Destination',
          message: splashMessage.trim() || '',
          banner_url: splashBannerUrl.trim() || undefined,
          banner_link: splashBannerLink.trim() || undefined,
          ad_code: splashAdCode.trim() || undefined,
          button_text: splashButtonText.trim() || 'Proceed to Destination',
          show_qr: splashShowQr,
        };
      } else {
        delete metadataObj.splash;
      }

      if (formMaxClicks) {
        metadataObj.max_clicks = Number(formMaxClicks);
      } else {
        delete metadataObj.max_clicks;
      }

      if (enableLanguageRedirect && targetLanguage && targetLanguage.trim() && targetLanguageUrl && targetLanguageUrl.trim()) {
        metadataObj.language_redirects = {
          [targetLanguage.trim().toLowerCase()]: targetLanguageUrl.trim(),
        };
      } else {
        delete metadataObj.language_redirects;
      }

      if (deepLinkEnabled) {
        metadataObj.deep_link = {
          enabled: true,
          ios_url: deepIosUrl.trim() || undefined,
          android_url: deepAndroidUrl.trim() || undefined,
          desktop_url: deepDesktopUrl.trim() || undefined,
        };
      } else {
        delete metadataObj.deep_link;
      }

      // Dynamic redirects: Country
      const geo_redirects_payload = enableGeoRedirects
        ? geoRedirects
            .filter((g) => g.country_code.trim() && g.destination_url.trim())
            .map((g) => ({
              country_code: g.country_code.trim().toUpperCase(),
              destination_url: g.destination_url.trim().startsWith('http') ? g.destination_url.trim() : `https://${g.destination_url.trim()}`,
            }))
        : [];

      // Dynamic redirects: City
      const city_redirects_payload = enableCityRedirects
        ? cityRedirects
            .filter((c) => c.city_name.trim() && c.destination_url.trim())
            .map((c) => ({
              city_name: c.city_name.trim().toLowerCase(),
              destination_url: c.destination_url.trim().startsWith('http') ? c.destination_url.trim() : `https://${c.destination_url.trim()}`,
            }))
        : [];

      // Dynamic redirects: Device
      const device_redirects_payload: Array<{ device_type: 'desktop' | 'mobile' | 'tablet'; destination_url: string }> = [];
      if (enableDeviceRedirects) {
        if (deviceDesktopUrl.trim()) {
          const u = deviceDesktopUrl.trim().startsWith('http') ? deviceDesktopUrl.trim() : `https://${deviceDesktopUrl.trim()}`;
          device_redirects_payload.push({ device_type: 'desktop', destination_url: u });
        }
        if (deviceMobileUrl.trim()) {
          const u = deviceMobileUrl.trim().startsWith('http') ? deviceMobileUrl.trim() : `https://${deviceMobileUrl.trim()}`;
          device_redirects_payload.push({ device_type: 'mobile', destination_url: u });
        }
        if (deviceTabletUrl.trim()) {
          const u = deviceTabletUrl.trim().startsWith('http') ? deviceTabletUrl.trim() : `https://${deviceTabletUrl.trim()}`;
          device_redirects_payload.push({ device_type: 'tablet', destination_url: u });
        }
      }

      // Dynamic redirects: OS
      const os_redirects_payload: Array<{ os: 'android' | 'ios'; destination_url: string }> = [];
      if (enableOsRedirects) {
        if (osAndroidUrl.trim()) {
          const u = osAndroidUrl.trim().startsWith('http') ? osAndroidUrl.trim() : `https://${osAndroidUrl.trim()}`;
          os_redirects_payload.push({ os: 'android', destination_url: u });
        }
        if (osIosUrl.trim()) {
          const u = osIosUrl.trim().startsWith('http') ? osIosUrl.trim() : `https://${osIosUrl.trim()}`;
          os_redirects_payload.push({ os: 'ios', destination_url: u });
        }
      }

      const payload: any = {
        domain_id: effectiveDomainId,
        route: formRoute || '/*',
        destination_url: finalDest,
        slug: cleanSlug,
        title: formTitle.trim() || undefined,
        description: formDescription.trim() || undefined,
        category_id: formCategoryId.trim() || undefined,
        tags: formTags.length > 0 ? formTags : [],
        redirect_code: Number(formRedirectCode) || 301,
        password: formPassword.trim() || undefined,
        is_cloaked: formIsCloaked,
        expires_at: formExpiresAt ? new Date(formExpiresAt).getTime() : undefined,
        metadata: metadataObj,
        pixel_ids: selectedPixelIds,
        geo_redirects: geo_redirects_payload,
        city_redirects: city_redirects_payload,
        os_redirects: os_redirects_payload,
        device_redirects: device_redirects_payload,
      };

      // OpenGraph meta
      if (enableOgMeta && (ogTitle.trim() || ogDescription.trim() || ogImage.trim())) {
        payload.og_meta = {
          og_title: ogTitle.trim() || undefined,
          og_description: ogDescription.trim() || undefined,
          og_image: ogImage.trim() || undefined,
          og_type: ogType,
          twitter_card: twitterCard,
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
        const errorMsg = typeof res.error === 'string' ? res.error : (res.error?.message || res.message || 'Failed to save short link');
        showToast(errorMsg, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'An unexpected error occurred while saving the link.', 'error');
    } finally {
      setIsSavingLink(false);
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

  // Create Quick Category directly inside Modal
  const handleCreateQuickCategory = async () => {
    if (!quickCategoryName.trim()) return;
    try {
      const res = await apiRequest('categories', {
        method: 'POST',
        body: JSON.stringify({ name: quickCategoryName.trim() }),
      });
      if (res.success && res.data) {
        showToast(`Category "${res.data.name}" created!`, 'success');
        setCategories((prev) => [...prev, res.data]);
        setFormCategoryId(res.data.id);
        setQuickCategoryName('');
        setShowQuickCategoryInput(false);
      } else {
        const errorMsg = typeof res.error === 'string' ? res.error : (res.error?.message || res.message || 'Failed to create category');
        showToast(errorMsg, 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'Error creating category', 'error');
    }
  };

  // Copy Short Link
  const handleCopyLink = (link: LinkType) => {
    const fullShortUrl = getFullShortUrl(link);
    navigator.clipboard.writeText(fullShortUrl);
    setCopiedId(link.id);
    showToast(`Copied ${fullShortUrl} to clipboard!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Download QR Code as PNG
  const handleDownloadQrPng = () => {
    if (!qrLink) return;
    const svgEl = document.querySelector('#active-qr-svg') as SVGElement;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 512, 512);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-${qrLink.slug}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        showToast('QR Code PNG downloaded!', 'success');
      }
    };
    img.src = blobURL;
  };

  // Download QR Code as SVG
  const handleDownloadQrSvg = () => {
    if (!qrLink) return;
    const svgEl = document.querySelector('#active-qr-svg') as SVGElement;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${qrLink.slug}.svg`;
    a.click();
    showToast('QR Code SVG downloaded!', 'success');
  };

  // Format full link
  const getFullShortUrl = (link: LinkType) => {
    const domain = domains.find((d) => d.id === link.domain_id);
    const domainName = domain ? domain.domain_name : window.location.host;
    const path = buildShortUrlPath(link.route || domain?.routing_path, link.slug);
    return `https://${domainName}${path}`;
  };

  // CSV Export
  const handleExportCSV = () => {
    if (links.length === 0) {
      showToast('No links to export', 'info');
      return;
    }
    const headers = ['Slug', 'Destination URL', 'Title', 'Clicks', 'Category', 'Tags', 'Created At'];
    const rows = links.map((l) => {
      const catStr = typeof l.category === 'object' ? l.category?.name || '' : (l.category || '');
      const tagStr = (Array.isArray(l.tags) ? l.tags : []).map((t: any) => typeof t === 'object' ? t.name || t.id : t).join(';');
      return [
        `"${l.slug}"`,
        `"${l.destination_url.replace(/"/g, '""')}"`,
        `"${(l.title || '').replace(/"/g, '""')}"`,
        l.clicks_count || l.click_count || 0,
        `"${catStr.replace(/"/g, '""')}"`,
        `"${tagStr.replace(/"/g, '""')}"`,
        new Date(l.created_at).toISOString(),
      ];
    });

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
      if (selectedTag) {
        const tagList = (link.tags || []).map((t: any) => (typeof t === 'object' ? t.name || t.id : t));
        if (!tagList.includes(selectedTag)) return false;
      }
      if (selectedCategory) {
        const catId = typeof link.category === 'object' ? link.category.id : link.category_id;
        const catName = typeof link.category === 'object' ? link.category.name : link.category;
        if (selectedCategory !== catId && selectedCategory !== catName && selectedCategory !== link.category_id) {
          return false;
        }
      }
      return true;
    });
  }, [links, search, selectedTag, selectedCategory]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks_count || l.click_count || 0), 0);
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
      {/* Onboarding / Profile Completion Overlay */}
      {((user as any)?.onboarding_completed === false || (user as any)?.onboarding_completed === 0) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Settings className="w-8 h-8 animate-spin-slow" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Complete Your Profile</h2>
              <p className="text-sm text-slate-500">
                You've signed in via a social provider. To start managing links, please verify your email and set a public username.
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('settings-profile')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Update Profile & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tier & Quota Status Indicator */}
      {(user as any)?.tier === 'free' && userRole !== 'admin' && userRole !== 'owner' ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🎁</span> Free Community Plan
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/30">
                {stats.totalLinks} Links Active
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              You are on the <strong>Free Tier</strong> (10 link base quota). Invite friends to earn <strong>+10 links</strong> per referral!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <button
                onClick={() => onNavigate('monetization')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡ Get More Links</span>
              </button>
            )}
          </div>
        </div>
      ) : (user as any)?.tier === 'pro' && userRole !== 'admin' && userRole !== 'owner' ? (
        <div className="bg-gradient-to-r from-indigo-500/10 via-slate-900/60 to-slate-900 border border-indigo-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Pro Member Workspace
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30">
                {stats.totalLinks} / 5,000 Links Used
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Active <strong>Pro Developer</strong> subscription. Enjoy custom retargeting pixels, cloaking, and high API limits.
            </p>
          </div>
        </div>
      ) : null}

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
                          <button
                            onClick={() => setQrLink(link)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                            title="Instant QR Code (View & Download)"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
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
                          {link.clicks_count || link.click_count || 0}
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
                              {typeof link.category === 'object' ? link.category.name || link.category.id : link.category}
                            </span>
                          )}
                          {(Array.isArray(link.tags) ? link.tags : []).map((t: any) => {
                            const tagName = typeof t === 'object' ? t.name || t.id : t;
                            return (
                              <span
                                key={tagName}
                                className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded"
                              >
                                #{tagName}
                              </span>
                            );
                          })}
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

              {/* Domain & Advanced Route Row */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Domain <span className="text-rose-500">*</span>
                  </label>
                  {availableRoutes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowAdvancedRoutes(!showAdvancedRoutes)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Settings className="w-3 h-3" />
                      <span>{showAdvancedRoutes ? 'Hide Route Prefix' : 'Advanced Route Prefix'}</span>
                    </button>
                  )}
                </div>
                <select
                  value={formDomainId}
                  disabled={Boolean(editingLink)}
                  onChange={(e) => {
                    setFormDomainId(e.target.value);
                    const dom = domains.find((d) => d.id === e.target.value);
                    const rts = dom?.routes && dom.routes.length > 0 ? dom.routes : [dom?.routing_path || '/*'];
                    setFormRoute(rts[0] || '/*');
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer disabled:opacity-60"
                >
                  {domains
                    .filter((d) => d.domain_name !== 'localhost' && d.normalized_domain_name !== 'localhost')
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.domain_name}
                      </option>
                    ))}
                </select>
                {editingLink && (
                  <small className="block mt-1 text-[11px] text-amber-500">
                    Domain is permanent. Create a new link to use a different domain.
                  </small>
                )}

                {/* Advanced Route Path Prefix selector */}
                {showAdvancedRoutes && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Route Path Prefix
                    </label>
                    <select
                      value={formRoute}
                      onChange={(e) => setFormRoute(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                    >
                      {availableRoutes.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                    <small className="block mt-1 text-[10px] text-slate-400">
                      Matches requests under specific path prefixes (e.g. /go/*, /*).
                    </small>
                  </div>
                )}
              </div>

              {/* Slug Row */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Slug (optional)
                  </label>
                  {!editingLink && (
                    <button
                      type="button"
                      onClick={handleRandomSlug}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-generate Random
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg select-none">
                    /
                  </span>
                  <input
                    type="text"
                    disabled={Boolean(editingLink)}
                    placeholder="Auto-generated if empty (or custom: promo2026)"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_\-\/]/g, ''))}
                    className="w-full px-3 py-2 text-sm font-mono rounded-r-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
                {editingLink ? (
                  <small className="block mt-1 text-[11px] text-amber-500">
                    Slug is permanent. Create a new link for a different slug.
                  </small>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Multi-segment custom slugs supported (e.g. promo/summer or shop/2026)</p>
                )}
              </div>

              {/* Live Preview Box */}
              <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-xs font-mono text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span className="truncate">
                  Target Short URL: https://{domains.find((d) => d.id === formDomainId)?.domain_name || 'urlz.eu.org'}{buildShortUrlPath(formRoute, formSlug || 'auto-generated')}
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
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Internal campaign description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category & Tags Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category (optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickCategoryInput(!showQuickCategoryInput)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showQuickCategoryInput ? 'Cancel' : '+ New Category'}</span>
                    </button>
                  </div>

                  {showQuickCategoryInput ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="New Category Name..."
                        value={quickCategoryName}
                        onChange={(e) => setQuickCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateQuickCategory();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateQuickCategory}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (optional)
                  </label>
                  <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[38px]">
                    {formTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
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
                      placeholder={formTags.length === 0 ? 'Type tag and Enter...' : ''}
                      className="flex-1 min-w-[80px] text-xs bg-transparent focus:outline-hidden text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Redirects: Country-Specific */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className={`p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between ${!isProMember ? 'opacity-75' : ''}`}>
                  <label className={`flex items-center gap-2 select-none ${isProMember ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <input
                      type="checkbox"
                      disabled={!isProMember}
                      checked={enableGeoRedirects}
                      onChange={(e) => {
                        if (!isProMember) return;
                        setEnableGeoRedirects(e.target.checked);
                        if (e.target.checked && geoRedirects.length === 0) {
                          setGeoRedirects([{ id: `geo-${Date.now()}`, country_code: '', destination_url: '' }]);
                        }
                      }}
                      className="rounded text-indigo-600 w-4 h-4 disabled:opacity-50"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        Enable Country-Specific Redirects
                        {!isProMember && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-500 text-white text-[9px] font-black uppercase tracking-tighter">Pro</span>}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Redirect users to different URLs based on their country (max 10 countries)
                      </span>
                    </div>
                  </label>
                  {!isProMember && (
                    <button
                      type="button"
                      onClick={() => onNavigate?.('monetization')}
                      className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 cursor-pointer"
                    >
                      Unlock Pro
                    </button>
                  )}
                  {enableGeoRedirects && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {geoRedirects.length} / 10 countries
                    </span>
                  )}
                </div>

                {enableGeoRedirects && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500">
                      Users from selected countries will be redirected to their specific URL. Others use the default destination URL above.
                    </p>

                    {geoRedirects.map((geo, idx) => (
                      <div key={geo.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="GR, US, DE"
                          value={geo.country_code}
                          onChange={(e) => {
                            const updated = [...geoRedirects];
                            updated[idx].country_code = e.target.value.toUpperCase();
                            setGeoRedirects(updated);
                          }}
                          className="w-20 px-2.5 py-1.5 text-xs font-mono uppercase rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                        <input
                          type="url"
                          placeholder="https://country-specific.example.com"
                          value={geo.destination_url}
                          onChange={(e) => {
                            const updated = [...geoRedirects];
                            updated[idx].destination_url = e.target.value;
                            setGeoRedirects(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setGeoRedirects(geoRedirects.filter((g) => g.id !== geo.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                          title="Remove country"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {geoRedirects.length < 10 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGeoRedirects([...geoRedirects, { id: `geo-${Date.now()}`, country_code: '', destination_url: '' }]);
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Country
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Unified Device & Mobile OS Routing */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className={`p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between ${!isProMember ? 'opacity-75' : ''}`}>
                  <label className={`flex items-center gap-2 select-none ${isProMember ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <input
                      type="checkbox"
                      disabled={!isProMember}
                      checked={enableDeviceRedirects || enableOsRedirects}
                      onChange={(e) => {
                        if (!isProMember) return;
                        setEnableDeviceRedirects(e.target.checked);
                        setEnableOsRedirects(e.target.checked);
                      }}
                      className="rounded text-indigo-600 w-4 h-4 disabled:opacity-50"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                        Device &amp; Mobile OS Routing
                        {!isProMember && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-500 text-white text-[9px] font-black uppercase tracking-tighter">Pro</span>}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Route users based on device type (Desktop, Mobile, Tablet) or Mobile OS (iOS App Store vs Android Play Store)
                      </span>
                    </div>
                  </label>
                  {!isProMember && (
                    <button
                      type="button"
                      onClick={() => onNavigate?.('monetization')}
                      className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 cursor-pointer"
                    >
                      Unlock Pro
                    </button>
                  )}
                </div>

                {(enableDeviceRedirects || enableOsRedirects) && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Desktop URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/desktop"
                          value={deviceDesktopUrl}
                          onChange={(e) => setDeviceDesktopUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Mobile (Generic) URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/mobile"
                          value={deviceMobileUrl}
                          onChange={(e) => setDeviceMobileUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          iOS App Store URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://apps.apple.com/app/..."
                          value={osIosUrl}
                          onChange={(e) => setOsIosUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Android Play Store URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://play.google.com/store/apps/..."
                          value={osAndroidUrl}
                          onChange={(e) => setOsAndroidUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Tablet URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/tablet"
                          value={deviceTabletUrl}
                          onChange={(e) => setDeviceTabletUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Language-Based Routing */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableLanguageRedirect}
                      onChange={(e) => setEnableLanguageRedirect(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-500" />
                        Language-Based Routing (Browser Locale)
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Route visitors based on their browser preferred language header (e.g. fr, es, de, ja)
                      </span>
                    </div>
                  </label>
                </div>

                {enableLanguageRedirect && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Language Code (2-letter)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. fr, es, de"
                          maxLength={5}
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value.toLowerCase())}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Language Destination URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/fr"
                          value={targetLanguageUrl}
                          onChange={(e) => setTargetLanguageUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media Preview (Open Graph) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableOgMeta}
                      onChange={(e) => setEnableOgMeta(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                        Customize Social Media Preview (Open Graph)
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Control title, description, and image shown when link is shared on social media
                      </span>
                    </div>
                  </label>
                </div>

                {enableOgMeta && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={fetchingOg}
                        onClick={handleFetchOg}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {fetchingOg ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-500" />}
                        <span>{fetchingOg ? 'Fetching…' : 'Fetch from destination URL'}</span>
                      </button>
                      <small className="text-[10px] text-slate-400">Pulls existing OG tags from destination</small>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        OG Title
                      </label>
                      <input
                        type="text"
                        maxLength={255}
                        placeholder="My amazing destination page"
                        value={ogTitle}
                        onChange={(e) => setOgTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        OG Description
                      </label>
                      <textarea
                        rows={2}
                        maxLength={500}
                        placeholder="Brief summary for preview cards"
                        value={ogDescription}
                        onChange={(e) => setOgDescription(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        OG Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/og-banner.jpg"
                        value={ogImage}
                        onChange={(e) => setOgImage(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          OG Type
                        </label>
                        <select
                          value={ogType}
                          onChange={(e: any) => setOgType(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        >
                          <option value="website">website</option>
                          <option value="article">article</option>
                          <option value="product">product</option>
                          <option value="video.other">video</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Twitter Card
                        </label>
                        <select
                          value={twitterCard}
                          onChange={(e: any) => setTwitterCard(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        >
                          <option value="summary_large_image">summary_large_image</option>
                          <option value="summary">summary</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security & Access Protection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password Protection
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    id="link-password-protection-input-field"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Visits Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={formMaxClicks}
                    onChange={(e) => setFormMaxClicks(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* UTM Campaign Builder */}
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
                          placeholder="summer_promo_2026"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Deep Linking */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deepLinkEnabled}
                      onChange={(e) => setDeepLinkEnabled(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        📱 Mobile Deep Linking &amp; Custom App Schemes
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Open native app schemes (e.g. instagram://, spotify://) with web fallback
                      </span>
                    </div>
                  </label>
                </div>
                {deepLinkEnabled && (
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                          iOS App Scheme (e.g. instagram://user?username=urlz)
                        </label>
                        <input
                          type="text"
                          placeholder="instagram://user?username=urlz"
                          value={deepIosUrl}
                          onChange={(e) => setDeepIosUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                          Android App Scheme / Intent URL
                        </label>
                        <input
                          type="text"
                          placeholder="intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end"
                          value={deepAndroidUrl}
                          onChange={(e) => setDeepAndroidUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                        Desktop Fallback Override (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="https://instagram.com/urlz"
                        value={deepDesktopUrl}
                        onChange={(e) => setDeepDesktopUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Splash Page Interstitial (Sponsorship & Announcements) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSplashConfig(!showSplashConfig)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span>Splash Page Interstitial (Sponsorship &amp; Ads)</span>
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
                              Banner Destination Link (optional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://sponsor.com/landing"
                              value={splashBannerLink}
                              onChange={(e) => setSplashBannerLink(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>

                        {/* Ad Separation & Fallback Section (Admin/Owner Only) */}
                        {isAdminOrOwner && (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Ad Unit Separation &amp; Platform Fallback
                              </label>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-start sm:self-auto ${
                                splashAdCode.trim() || splashBannerUrl.trim()
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}>
                                {splashAdCode.trim() || splashBannerUrl.trim() ? '✨ Link-Specific Custom Ad' : '🛡️ Inherits Admin Global Ad Network'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              <strong>Fallback Guarantee:</strong> If left blank, this splash page automatically serves the administrator's global platform ad network (Google AdSense or platform campaigns). Providing your own custom script tag below overrides platform ads for this specific link.
                            </p>
                            <textarea
                              rows={2}
                              placeholder="<script async src='https://pagead2.googlesyndication.com/...'></script> or custom HTML/JS ad snippet"
                              value={splashAdCode}
                              onChange={(e) => setSplashAdCode(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        )}

                        {/* QR Code on Splash Page Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                          <div className="space-y-0.5">
                            <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              📱 Display Mobile QR Code on Splash Page
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Displays a high-contrast QR code on the intermediate page so desktop visitors can scan and open on mobile immediately.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                            <input
                              type="checkbox"
                              checked={splashShowQr}
                              onChange={(e) => setSplashShowQr(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
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
                  disabled={isSavingLink}
                  className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm cursor-pointer transition-colors flex items-center gap-2"
                >
                  {isSavingLink ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Link...</span>
                    </>
                  ) : (
                    <span>{editingLink ? 'Save Changes' : 'Create Short Link'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrLink && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div>
              <div className="inline-flex p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mobile QR Code</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan with any smartphone camera to open short link
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-md mx-auto">
              <QRCodeSVG
                id="active-qr-svg"
                value={getFullShortUrl(qrLink)}
                size={190}
                level="H"
                includeMargin
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Short Destination</span>
              <p className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 break-all select-all">
                {getFullShortUrl(qrLink)}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3 h-3" />
                <span>Rendered on intermediate splash page for desktop visitors</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQrPng}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={handleDownloadQrSvg}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG</span>
              </button>
            </div>

            <div className="flex gap-2 justify-center pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleCopyLink(qrLink)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => setQrLink(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
