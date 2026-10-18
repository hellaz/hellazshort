# URLZ - Next-Generation URL Shortener & Link Management Platform

An open-source, edge-powered link shortener and link management platform with Premium URL Shortener capabilities. Deployed with Cloudflare Workers / Node.js Express backend and modern React + Tailwind SPA frontend.

Customized for active deployments at **urlz.eu.org** and **urlz.gr**.

---

## ✨ Features

### 🚀 Public Landing & Instant Shortening
- **Modern Public Homepage**: High-converting interface with instant link shortening, real-time alias customization, and QR code generation.
- **Break Away from Legacy Branding**: Clean, independent URLZ branding without external third-party links or logos.

### 🔒 Privacy & Access Control
- **Password Protected Links**: Protect confidential downloads or links with passcode challenges.
- **Splash & Interstitial Pages**: Monetize or brand destinations with countdown timers (5s), sponsored banners, and skip controls.
- **GDPR Compliant Anonymization**: IP addresses are anonymized and hashed with zero raw visitor storage.
- **Bot Detection & Filtering**: Excludes automated crawlers and health check pings from visitor counts.
- **Report Abuse Workflow**: Integrated form to report phishing, malware, and abusive links for review.

### 🎯 Advanced Dynamic Redirects
- **Custom Slugs**: Brand your short links with custom aliases and multi-segment slugs.
- **Geo-Targeting**: Forward visitors to localized destinations based on country code (e.g. Greece, US, Germany).
- **Device & OS Targeting**: Direct iOS users to the App Store, Android to Google Play, and desktop to web.
- **Retargeting Pixel Library**: Fire tracking pixels (Meta Pixel, Google Analytics 4, Google Tag Manager, TikTok, LinkedIn, Pinterest, Twitter/X, and custom JS).
- **OpenGraph & Social Previews**: Per-link rich preview metadata (og:title, og:description, og:image) for Twitter/X, LinkedIn, and Facebook.
- **Cloaking (iFrame)**: Optional cloaked view to keep the branded short domain visible in the browser address bar.

### 📊 In-Depth Analytics
- **Click Velocity Graphs**: Interactive Chart.js timeline of visits across 24h, 7d, 30d, and 90d.
- **Geographic Visualizer**: Click distribution by country and region with percentage metrics.
- **Device & Platform Breakdowns**: Mobile vs. Desktop vs. Tablet donut charts, operating system metrics, and browser stats.
- **UTM Attribution**: Attribution matrix for `utm_source`, `utm_medium`, and `utm_campaign`.

### 🛡️ Administration & Multi-Domain
- **Multi-Domain Management**: Support for `urlz.eu.org`, `urlz.gr`, and custom enterprise domains.
- **Link Health Monitor**: Automatic background pinging of destinations with HTTP status code and latency tracking.
- **Security & 2FA / MFA**: TOTP two-factor authentication (Google Authenticator, Authy, 1Password) with 8-digit emergency recovery codes.
- **Developer REST API**: Secure API keys with full support for cURL, Node.js, and Python integrations.
- **CSV Bulk Import & Export**: Import hundreds of links via CSV or export your link catalog.

---

## 🛠️ Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, Chart.js, QRCode.react, Vite.
- **Backend**: Express + Hono with Node SQLite D1 database adapter and KV cache.
- **Production Edge Target**: Cloudflare Workers with D1 and KV.
