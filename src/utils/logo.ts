/**
 * URLZ Official Brand Logo SVGs & Data URIs for Light/Dark themes
 */

// Square Arrow Logo Mark SVG
export const URLZ_ICON_SVG = `<svg viewBox="0 0 100 100" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 22 28 V 70 C 22 76 28 82 34 82 H 76 V 68 H 36 V 28 H 22 Z" fill="#808bc4"/>
  <path d="M 40 60 L 66 34 M 50 34 H 68 V 52" stroke="#808bc4" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Full Dark Theme Logo (White text for dark backgrounds)
export const URLZ_LOGO_DARK_SVG = `<svg viewBox="0 0 240 60" width="180" height="45" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 5) scale(0.5)">
    <path d="M 22 28 V 70 C 22 76 28 82 34 82 H 76 V 68 H 36 V 28 H 22 Z" fill="#808bc4"/>
    <path d="M 40 60 L 66 34 M 50 34 H 68 V 52" stroke="#808bc4" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="65" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" letter-spacing="-0.5">URLZ</text>
</svg>`;

// Full Light Theme Logo (Navy text for light backgrounds)
export const URLZ_LOGO_LIGHT_SVG = `<svg viewBox="0 0 240 60" width="180" height="45" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 5) scale(0.5)">
    <path d="M 22 28 V 70 C 22 76 28 82 34 82 H 76 V 68 H 36 V 28 H 22 Z" fill="#808bc4"/>
    <path d="M 40 60 L 66 34 M 50 34 H 68 V 52" stroke="#808bc4" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="65" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="32" fill="#13132B" letter-spacing="-0.5">URLZ</text>
</svg>`;

export const LOGO_DATA_URI = `data:image/svg+xml;base64,${btoa(URLZ_LOGO_DARK_SVG)}`;