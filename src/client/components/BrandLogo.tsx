import React from 'react';

interface BrandLogoProps {
  variant?: 'auto' | 'light' | 'dark' | 'icon_only' | 'full';
  showDomainSuffix?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * URLZ Official Brand Logo Component
 * Automatically adapts between Light & Dark background variations or forces specific theme logo.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'auto',
  showDomainSuffix = false,
  size = 'md',
  className = '',
}) => {
  let height = 'h-8';
  let iconSize = 'w-8 h-8';
  let textSize = 'text-xl';

  if (size === 'sm') {
    height = 'h-6';
    iconSize = 'w-6 h-6';
    textSize = 'text-base';
  } else if (size === 'lg') {
    height = 'h-10';
    iconSize = 'w-10 h-10';
    textSize = 'text-2xl';
  } else if (size === 'xl') {
    height = 'h-14';
    iconSize = 'w-14 h-14';
    textSize = 'text-4xl';
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${height} ${className}`}>
      {/* Official URLZ Background / SQR & Inverted Logo Asset */}
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center overflow-hidden rounded-xl shadow-xs border border-white/10 dark:border-white/20`}>
        <img
          src="/BackgroundSQR.png"
          alt="URLZ"
          className={`w-full h-full object-cover ${
            variant === 'dark' ? 'hidden' : variant === 'light' ? 'block' : 'dark:hidden'
          }`}
        />
        <img
          src="/auto_urlz_logo_invert.png"
          alt="URLZ"
          className={`w-full h-full object-cover ${
            variant === 'dark' ? 'block' : variant === 'light' ? 'hidden' : 'hidden dark:block'
          }`}
        />
      </div>

      {/* Text Typography (URLZ or URLZ.GR) */}
      {variant !== 'icon_only' && (
        <div className="flex items-baseline font-black tracking-tight leading-none">
          <span
            className={`font-sans ${textSize} ${
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
};
