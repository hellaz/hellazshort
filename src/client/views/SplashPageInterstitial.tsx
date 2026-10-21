import React, { useState, useEffect } from 'react';
import { Timer, ArrowRight, ShieldCheck, Sparkles, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BrandLogo } from '../components/BrandLogo';
import { SkyscraperAd, AdNetworkConfig } from '../components/AdBannerComponents';
import { apiRequest } from '../api';

interface SplashPageInterstitialProps {
  slug: string;
  destinationUrl: string;
  title?: string;
  bannerImage?: string;
  customMessage?: string;
  countdownSeconds?: number;
  adConfig?: AdNetworkConfig;
  showQr?: boolean;
}

export const SplashPageInterstitial: React.FC<SplashPageInterstitialProps> = ({
  slug,
  destinationUrl,
  title = 'Sponsored Destination',
  bannerImage,
  customMessage = 'You are being redirected to your destination. Please wait a moment...',
  countdownSeconds = 10,
  adConfig: initialAdConfig,
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [canSkip, setCanSkip] = useState(false);
  const [adConfig, setAdConfig] = useState<AdNetworkConfig | undefined>(initialAdConfig);

  useEffect(() => {
    if (!initialAdConfig) {
      apiRequest('settings/public-pages')
        .then((res) => {
          if (res.success && res.data?.ad_settings) {
            setAdConfig(res.data.ad_settings);
          }
        })
        .catch(() => {});
    }
  }, [initialAdConfig]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanSkip(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleProceed = () => {
    window.location.href = destinationUrl;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative">
      {/* Top Brand Bar */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <BrandLogo variant="dark" size="sm" />
      </div>

      {/* Main Container with optional Left and Right Skyscraper Ads */}
      <div className="flex items-center justify-center w-full max-w-7xl px-4 mt-12 sm:mt-0">
        {/* Left Skyscraper Ad */}
        <SkyscraperAd side="left" adConfig={adConfig} />

        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden shrink-0">
          {/* Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

          {/* Header with countdown */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700/80 text-xs font-mono font-bold text-indigo-400">
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft > 0 ? `${timeLeft}s` : 'Ready'}</span>
            </div>
          </div>

          {/* Body & Sponsored Slot */}
          <div className="py-6 space-y-4">
            {bannerImage ? (
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center">
                <img src={bannerImage} alt="Sponsored content" className="w-full object-cover" />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-linear-to-br from-indigo-950/40 via-purple-950/30 to-slate-950 border border-indigo-500/20 text-center">
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  {customMessage}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-mono truncate max-w-sm mx-auto">
                  Target: {destinationUrl}
                </p>
              </div>
            )}

            {/* Mobile Scan QR Code */}
            {showQr !== false && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? window.location.href : `https://urlz.eu.org/${slug}`}
                    size={72}
                    level="M"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Scan with Phone</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Open destination directly on mobile while waiting
                  </p>
                  <span className="text-[10px] font-mono text-indigo-400 truncate block mt-1">
                    /{slug}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleProceed}
              disabled={!canSkip}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                canSkip
                  ? 'bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>{canSkip ? 'Proceed to Destination' : `Please wait ${timeLeft}s...`}</span>
              {canSkip && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified Safety Check</span>
            </span>
            <span className="font-mono">URLZ Interstitial</span>
          </div>
        </div>

        {/* Right Skyscraper Ad */}
        <SkyscraperAd side="right" adConfig={adConfig} />
      </div>
    </div>
  );
};
