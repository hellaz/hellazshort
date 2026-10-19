import React, { useState } from 'react';
import { apiRequest, setAuthToken } from '../api';
import { useToast } from '../components/Toast';
import { BrandLogo } from '../components/BrandLogo';
import { CaptchaWidget } from '../components/CaptchaWidget';
import { QRCodeSVG } from 'qrcode.react';
import {
  Link as LinkIcon,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  Shield,
  Zap,
  BarChart3,
  Globe2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  Sliders,
  DollarSign,
  ChevronRight,
  Timer,
  Share2,
} from 'lucide-react';

interface PublicLandingViewProps {
  onGoToDashboard: () => void;
  onGoToLogin: () => void;
  onLoginSuccess?: (userData: any) => void;
  isLoggedIn: boolean;
  activeDomainName: string;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onGoToDashboard,
  onGoToLogin,
  onLoginSuccess,
  isLoggedIn,
  activeDomainName,
}) => {
  const { showToast } = useToast();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    shortUrl: string;
    slug: string;
    destination: string;
    hasPassword?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaData, setCaptchaData] = useState<{ token?: string; answer?: string; solution?: string }>({});

  const displayDomain = activeDomainName || window.location.host;

  const handleQuickShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl.trim()) {
      showToast('Please enter a destination URL', 'error');
      return;
    }

    if (!captchaVerified) {
      showToast('Please solve the anti-bot verification challenge.', 'error');
      return;
    }

    let dest = destinationUrl.trim();
    if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
      dest = `https://${dest}`;
    }

    setLoading(true);
    try {
      const payload: any = {
        destination_url: dest,
        slug: customAlias.trim() || undefined,
        password: password.trim() || undefined,
        redirect_code: 301,
        captcha_token: captchaData.token,
        captcha_answer: captchaData.answer,
        captcha_solution: captchaData.solution,
      };

      const res = await apiRequest('links', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        const slug = res.data.slug || customAlias;
        const shortUrl = `${window.location.origin}/${slug}`;
        setCreatedResult({
          shortUrl,
          slug,
          destination: dest,
          hasPassword: Boolean(password.trim()),
        });
        showToast('Short link generated!', 'success');
      } else {
        // If not logged in and public creation is restricted to registered users
        if (res.error?.includes('Unauthorized') || res.error?.includes('401') || res.error?.includes('login')) {
          showToast('Sign in or create an account to manage custom short links', 'info');
          onGoToLogin();
        } else {
          showToast(res.error || 'Could not shorten link. Try logging in.', 'error');
        }
      }
    } catch {
      showToast('Network error, please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'facebook') => {
    try {
      const res = await apiRequest(`auth/social/${provider}`, {
        method: 'POST',
        body: JSON.stringify({ email: `${provider}_user@urlz.eu.org`, name: `${provider.toUpperCase()} User` }),
      });
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        showToast(`Instant sign-in successful via ${provider.toUpperCase()}!`, 'success');
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user);
        } else {
          onGoToDashboard();
        }
      } else {
        showToast(res.error || res.message || `Failed social authentication via ${provider}`, 'error');
      }
    } catch {
      showToast(`Social authentication error with ${provider}`, 'error');
    }
  };

  const handleCopy = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.shortUrl);
    setCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 focus:outline-hidden cursor-pointer"
          >
            <BrandLogo variant="dark" size="md" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-indigo-400 block font-semibold leading-none">
                {displayDomain}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Instant Social Sign-in Header Icons */}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold px-1">Social Sign-In:</span>
                  <button
                    onClick={() => handleSocialLogin('google')}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                    title="Sign In with Google"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('twitter')}
                    className="p-1 rounded-lg hover:bg-slate-800 text-sky-400 transition-colors cursor-pointer"
                    title="Sign In with Twitter / X"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('facebook')}
                    className="p-1 rounded-lg hover:bg-slate-800 text-blue-500 transition-colors cursor-pointer"
                    title="Sign In with Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={onGoToLogin}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onGoToDashboard}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Generation URL Management Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Shorten, Brand &amp; Monetize <br className="hidden sm:inline" />
            <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Every Single Link
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Take full control of your links with lightning-fast edge redirects, password protection,
            monetized splash pages, retargeting pixels, and deep geo-targeting.
          </p>

          {/* Instant Shortener Form */}
          <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl text-left">
            <form onSubmit={handleQuickShorten} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="Paste a long link here (e.g. https://example.com/product/123)..."
                    className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Shortening...</span>
                  ) : (
                    <>
                      <span>Shorten</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Advanced toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showAdvanced ? 'Hide advanced options' : 'Customize alias & password protection'}</span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  Target: {displayDomain}
                </span>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Custom Alias (Optional)
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2 text-xs font-mono text-slate-500 bg-slate-950 border border-r-0 border-slate-700 rounded-l-lg">
                        /
                      </span>
                      <input
                        type="text"
                        placeholder="my-campaign"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        className="w-full px-2.5 py-2 text-xs font-mono rounded-r-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Password Protection (Optional)
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="Secret password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Anti-Bot Captcha Widget */}
              <div className="pt-2 border-t border-slate-800">
                <CaptchaWidget
                  onVerify={(data) => {
                    setCaptchaVerified(Boolean(data.token || data.answer));
                    setCaptchaData(data);
                  }}
                />
              </div>
            </form>

            {/* Social Sign-In prompt for visitors */}
            {!isLoggedIn && (
              <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>✨ Get 10 Free Short Links with instant Social Sign-In:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-indigo-500 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('twitter')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-sky-500 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-sky-400" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Twitter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-blue-600 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-blue-500" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </div>
            )}

            {/* Result Box */}
            {createdResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Your Short Link is Ready:
                      </span>
                      {createdResult.hasPassword && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded font-mono">
                          Password-Protected
                        </span>
                      )}
                    </div>
                    <a
                      href={createdResult.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-bold font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mt-0.5"
                    >
                      {createdResult.shortUrl}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => setShowQr(!showQr)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Show QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showQr && (
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col items-center">
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      <QRCodeSVG value={createdResult.shortUrl} size={160} level="H" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Scan to test on mobile</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 px-4 sm:px-6 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Premium URL Shortener Features
            </h2>
            <p className="text-sm text-slate-400">
              Built for performance marketers, creators, and power users who need granular control over their traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Password Protection */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Password Protected Links</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lock sensitive downloads, client previews, or private content with a master password. Visitors
                must enter the correct passcode before redirecting.
              </p>
            </div>

            {/* Feature 2: Splash & Interstitial Pages */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Monetization &amp; Splash Pages</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Show customized interstitial splash screens with sponsor banners, countdown timers, and call-to-actions
                before sending users to their final URL.
              </p>
            </div>

            {/* Feature 3: Retargeting Pixels */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Retargeting Pixel Library</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fire Meta Pixel, Google Analytics 4, TikTok, Twitter/X, and LinkedIn tags on click. Build warm custom
                audiences from any third-party link.
              </p>
            </div>

            {/* Feature 4: Geo & Device Routing */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Geo &amp; Device Targeting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Route iOS visitors directly to the App Store, Android to Google Play, and international visitors
                to localized landing pages based on their country code.
              </p>
            </div>

            {/* Feature 5: Comprehensive Analytics */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Deep Click Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track clicks in real-time by country, city, referrer, browser, operating system, and UTM campaigns
                with exportable CSV reports.
              </p>
            </div>

            {/* Feature 6: Custom Domains & Routing */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Multi-Domain &amp; Fast Edge</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Attach multiple custom branded domains like <span className="font-mono text-amber-300">urlz.eu.org</span> or{' '}
                <span className="font-mono text-amber-300">urlz.gr</span> with sub-millisecond Cloudflare edge redirection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer API Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-md">
              <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> Developer-First API
              </span>
              <h3 className="text-2xl font-bold text-white">
                Shorten links directly from your code, CI/CD, or CMS
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate API keys from your dashboard to automate link creation in Python, Node.js, PHP, or cURL.
              </p>
              <button
                onClick={onGoToDashboard}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>View API Documentation</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full md:w-auto font-mono text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
              <div className="text-slate-500 mb-2"># Shorten with curl</div>
              <div className="text-emerald-400 whitespace-pre">
{`curl -X POST https://${displayDomain}/api/v1/links \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"destination_url":"https://mysite.com"}'`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">URLZ</span>
            <span>&bull;</span>
            <span>Premium Link Management</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onGoToDashboard} className="hover:text-slate-300 transition-colors cursor-pointer">
              Dashboard
            </button>
            <button onClick={onGoToLogin} className="hover:text-slate-300 transition-colors cursor-pointer">
              Admin Login
            </button>
            <span className="text-slate-600 font-mono text-[11px]">{displayDomain}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
