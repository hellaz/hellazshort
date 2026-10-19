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
    textSizeClass = 'text-4xl';
  }

  if (isSquare) {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div className={`relative ${squareSizeClass} shrink-0 flex items-center justify-center overflow-hidden rounded-xl shadow-xs border border-white/10 dark:border-white/20`}>
          <img
            src="/BackgroundSQR.png"
            alt="URLZ"
            className="w-full h-full object-cover"
          />
        </div>
        {variant !== 'icon_only' && (
          <div className="flex items-baseline font-black tracking-tight leading-none">
            <span
              className={`font-sans ${textSizeClass} ${
                variant === 'dark'
                  ? 'text-white'
                  : variant === 'light'
                  ? 'text-[#13132B]'
                  : 'text-[#13132B] dark:text-white'
              }`}
            >
              URLZ
            </span>
            {showDomainSuffix && (
              <span className="text-[#808bc4] font-bold text-sm ml-0.5">.GR</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Horizontal Logo layout using auto_urlz_logo_invert.png
  return (
    <div className={`inline-flex items-center gap-2 select-none ${heightClass} ${className}`}>
      <img
        src="/auto_urlz_logo_invert.png"
        alt="URLZ"
        className={`${heightClass} w-auto max-w-[200px] sm:max-w-none object-contain transition-all ${
          variant === 'dark'
            ? 'brightness-100'
            : variant === 'light'
            ? 'brightness-0'
            : 'brightness-0 dark:brightness-100'
        }`}
      />
      {showDomainSuffix && (
        <span className="text-[#808bc4] font-bold text-sm ml-0.5">.GR</span>
      )}
    </div>
  );
};

