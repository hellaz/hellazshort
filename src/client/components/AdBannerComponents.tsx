import React, { useEffect } from 'react';

export interface AdNetworkConfig {
  enabled: boolean;
  provider: 'adsense' | 'custom' | 'none';
  adsense_client_id?: string;
  adsense_slot_id?: string;
  custom_ad_code?: string;
}

export function isAdDefined(ad?: AdNetworkConfig): boolean {
  // Prevent execution of third-party ad scripts during local development
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return false;
  }
  if (!ad || !ad.enabled || ad.provider === 'none') return false;
  if (ad.provider === 'adsense') {
    return Boolean(
      (ad.adsense_client_id && ad.adsense_client_id.trim().length > 0) ||
      (ad.adsense_slot_id && ad.adsense_slot_id.trim().length > 0)
    );
  }
  if (ad.provider === 'custom') {
    return Boolean(ad.custom_ad_code && ad.custom_ad_code.trim().length > 0);
  }
  return false;
}

/**
 * Site-wide Top & Bottom Ad Banner (Responsive Horizontal Unit)
 * Collapses and occupies 0 space if no ad network is defined.
 */
export const SiteAdBanner: React.FC<{ position: 'top' | 'bottom'; adConfig?: AdNetworkConfig }> = ({
  position,
  adConfig,
}) => {
  useEffect(() => {
    if (adConfig?.provider === 'adsense' && adConfig.adsense_client_id) {
      try {
        const scriptId = 'adsense-js-sdk';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.adsense_client_id}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore
      }
    }
  }, [adConfig]);

  if (!isAdDefined(adConfig)) {
    return null; // Collapses completely, occupying 0 space
  }

  return (
    <aside
      aria-label={`Site Advertisement ${position}`}
      className="w-full bg-slate-900/80 border-y border-slate-800/80 py-2.5 px-4 flex flex-col items-center justify-center text-center transition-all"
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">
          Sponsored Advertisement
        </div>

        {adConfig?.provider === 'custom' && adConfig.custom_ad_code ? (
          <div
            className="w-full flex items-center justify-center overflow-hidden"
            dangerouslySetInnerHTML={{ __html: adConfig.custom_ad_code }}
          />
        ) : (
          <div className="max-w-[728px] w-full h-[90px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800/60 p-1 shadow-inner">
            <ins
              className="adsbygoogle"
              style={{ display: 'inline-block', width: '728px', height: '90px' }}
              data-ad-client={adConfig?.adsense_client_id || ''}
              data-ad-slot={adConfig?.adsense_slot_id || ''}
              data-ad-format="horizontal"
            />
          </div>
        )}
      </div>
    </aside>
  );
};

/**
 * Left / Right Vertical Skyscraper Ad Placeholder (160x600 px Wide Skyscraper)
 * Used on Login Page (AuthView) and Splash Interstitial Page.
 * Collapses and occupies 0 space if no ad network is defined.
 */
export const SkyscraperAd: React.FC<{
  side: 'left' | 'right';
  adConfig?: AdNetworkConfig;
}> = ({ side, adConfig }) => {
  useEffect(() => {
    if (adConfig?.provider === 'adsense' && adConfig.adsense_client_id) {
      try {
        const scriptId = 'adsense-js-sdk';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.adsense_client_id}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore
      }
    }
  }, [adConfig]);

  if (!isAdDefined(adConfig)) {
    return null; // Collapses completely, occupying 0 space
  }

  return (
    <aside
      aria-label={`Skyscraper Advertisement ${side}`}
      className={`hidden lg:flex flex-col items-center justify-center shrink-0 w-[160px] min-h-[600px] bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 text-center transition-all shadow-xl ${
        side === 'left' ? 'mr-6' : 'ml-6'
      }`}
    >
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-2">
        {side === 'left' ? 'Left Skyscraper' : 'Right Skyscraper'}
      </div>

      {adConfig?.provider === 'custom' && adConfig.custom_ad_code ? (
        <div
          className="w-full h-full flex flex-col items-center justify-center overflow-hidden"
          dangerouslySetInnerHTML={{ __html: adConfig.custom_ad_code }}
        />
      ) : (
        <div className="w-[160px] h-[600px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 p-1 shadow-inner">
          <ins
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '160px', height: '600px' }}
            data-ad-client={adConfig?.adsense_client_id || ''}
            data-ad-slot={adConfig?.adsense_slot_id || ''}
            data-ad-format="vertical"
          />
        </div>
      )}
    </aside>
  );
};

/**
 * Classic 468x60 px Header Banner for Dashboard Header (Navbar)
 * Collapses and occupies 0 space if no ad network is defined.
 */
export const DashboardHeaderAd: React.FC<{ adConfig?: AdNetworkConfig }> = ({ adConfig }) => {
  useEffect(() => {
    if (adConfig?.provider === 'adsense' && adConfig.adsense_client_id) {
      try {
        const scriptId = 'adsense-js-sdk';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.adsense_client_id}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore
      }
    }
  }, [adConfig]);

  if (!isAdDefined(adConfig)) {
    return null; // Collapses completely, occupying 0 space
  }

  return (
    <div className="hidden lg:flex flex-col items-center justify-center mx-4 my-auto shrink-0">
      {adConfig?.provider === 'custom' && adConfig.custom_ad_code ? (
        <div
          className="w-[468px] h-[60px] flex items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner"
          dangerouslySetInnerHTML={{ __html: adConfig.custom_ad_code }}
        />
      ) : (
        <div className="w-[468px] h-[60px] flex items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 shadow-inner">
          <ins
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '468px', height: '60px' }}
            data-ad-client={adConfig?.adsense_client_id || ''}
            data-ad-slot={adConfig?.adsense_slot_id || ''}
          />
        </div>
      )}
    </div>
  );
};
