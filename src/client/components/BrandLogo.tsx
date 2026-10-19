import React from 'react';

export interface BrandLogoProps {
  layout?: 'horizontal' | 'square' | 'icon_only' | 'auto';
  variant?: 'auto' | 'light' | 'dark' | 'icon_only' | 'full';
  showDomainSuffix?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * URLZ Official Brand Logo Component
 * - Horizontal layout: Uses official /auto_urlz_logo_invert.png (500x180)
 * - Square / Icon layout: Uses official /BackgroundSQR.png (160x160)
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  layout = 'horizontal',
  variant = 'auto',
  showDomainSuffix = false,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const isSquare = layout === 'square' || layout === 'icon_only' || variant === 'icon_only';

  let heightClass = 'h-8';
  let squareSizeClass = 'w-8 h-8';
  let textSizeClass = 'text-xl';

  if (size === 'sm') {
    heightClass = 'h-6';
    squareSizeClass = 'w-6 h-6';
    textSizeClass = 'text-base';
  } else if (size === 'lg') {
    heightClass = 'h-10';
    squareSizeClass = 'w-10 h-10';
    textSizeClass = 'text-2xl';
  } else if (size === 'xl') {
    heightClass = 'h-14';
    squareSizeClass = 'w-14 h-14';
    textSizeClass = 'text-3xl';
  }

  if (imgError) {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className={`${squareSizeClass} rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-sm shrink-0`}>
          🔗
        </div>
        {variant !== 'icon_only' && (
          <div className="flex items-baseline font-black tracking-tight leading-none">
            <span className={`font-sans ${textSizeClass} text-slate-900 dark:text-white`}>
              URL<span className="text-indigo-500">Z</span>
            </span>
            {showDomainSuffix && (
              <span className="text-indigo-400 font-bold text-xs ml-0.5">.GR</span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isSquare) {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className={`relative ${squareSizeClass} shrink-0 flex items-center justify-center overflow-hidden rounded-xl shadow-xs border border-slate-700/50`}>
          <img
            src="/BackgroundSQR.png"
            alt="URLZ"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
        {variant !== 'icon_only' && (
          <div className="flex items-baseline font-black tracking-tight leading-none">
            <span className={`font-sans ${textSizeClass} text-slate-900 dark:text-white`}>
              URL<span className="text-indigo-500">Z</span>
            </span>
            {showDomainSuffix && (
              <span className="text-indigo-400 font-bold text-xs ml-0.5">.GR</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${heightClass} ${className}`}>
      <img
        src="/auto_urlz_logo_invert.png"
        alt="URLZ"
        className={`${heightClass} w-auto max-w-[200px] sm:max-w-none object-contain transition-all`}
        onError={() => setImgError(true)}
      />
      {showDomainSuffix && (
        <span className="text-indigo-400 font-bold text-xs ml-0.5">.GR</span>
      )}
    </div>
  );
};

