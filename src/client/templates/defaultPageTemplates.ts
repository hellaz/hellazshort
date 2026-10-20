/**
 * Default HTML Templates for URLZ Public Pages
 * Used for pre-filling the "Default Root Page" HTML editor in Dashboard
 * and rendering fallback custom content.
 */

export const DEFAULT_BRANDED_WELCOME_HTML = `<!-- URLZ Main Index / Branded Welcome Page -->
<div class="relative overflow-hidden">
  <!-- Hero Section -->
  <section class="relative pt-16 pb-20 px-4 sm:px-6 overflow-hidden">
    <!-- Glow Effects -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>
    <div class="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

    <div class="max-w-4xl mx-auto text-center relative z-10">

          <div class="flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1">
              <input
                type="text"
                placeholder="Paste a long link here (e.g. https://example.com/product/123)..."
                class="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Shorten</span>
              <span>&rarr;</span>
            </button>
          </div>

          <!-- Social Sign-In Prompt -->
          <div class="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span class="text-slate-400 text-[11px]">✨ Get 10 Free Short Links with instant Social Sign-In:</span>
            <div class="flex items-center gap-2">
              <a href="/login" class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-indigo-500 text-slate-200 font-semibold text-[11px]">Google</a>
              <a href="/login" class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-sky-500 text-slate-200 font-semibold text-[11px]">Twitter / X</a>
              <a href="/login" class="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-blue-600 text-slate-200 font-semibold text-[11px]">Facebook</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  </section>

  <!-- Premium Features Showcase -->
  <section class="py-16 px-4 sm:px-6 bg-slate-900/40 border-t border-slate-800/80">
    <div class="max-w-5xl mx-auto text-center space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 text-xs font-semibold">
        <span>⚡</span>
        <span>Dedicated Platform Capabilities</span>
      </div>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-white">
        Looking for Advanced Shortener Features?
      </h2>
      <p class="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
        Geographic &amp; language targeting, interstitial countdown splash pages, Google AdSense integration, retargeting pixels, and custom branded domains are organized on our dedicated Features page.
      </p>
      <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/features"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
        >
          <span>Explore All Premium Features &rarr;</span>
        </a>
        <a
          href="/about"
          class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all"
        >
          About Platform
        </a>
        <a
          href="/contact"
          class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all"
        >
          Contact Support
        </a>
      </div>
    </div>
  </section>

  <!-- Developer API Section -->
  <section class="py-16 px-4 sm:px-6">
    <div class="max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12">
      <div class="flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="space-y-4 max-w-md text-left">
          <span class="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            &lt;/&gt; Developer-First API
          </span>
          <h3 class="text-2xl font-bold text-white">
            Shorten links directly from your code, CI/CD, or CMS
          </h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Generate API keys from your dashboard to automate link creation in Python, Node.js, PHP, or cURL.
          </p>
          <a
            href="/login"
            class="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            View API Documentation &rarr;
          </a>
        </div>

        <div class="w-full md:w-auto font-mono text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto text-left">
          <div class="text-slate-500 mb-2"># Shorten with curl</div>
          <div class="text-emerald-400 whitespace-pre">curl -X POST https://urlz.eu.org/api/v1/links \\
  -H "Authorization: Bearer &lt;API_KEY&gt;" \\
  -H "Content-Type: application/json" \\
  -d '{"destination_url":"https://mysite.com"}'</div>
        </div>
      </div>
    </div>
  </section>
</div>`;

export const DEFAULT_FEATURES_HTML = `<!-- Features Page Content -->
<section class="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
  <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
      Comprehensive Feature Suite
    </div>
    <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
      Engineered for Scale, Speed, and Control
    </h1>
    <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
      Every tool modern marketers, developers, and organizations need to shorten, route, track, and simplify link management.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div class="text-indigo-400 font-mono text-xs font-bold mb-2">01 / ROUTING</div>
      <h3 class="text-lg font-bold text-white mb-2">Geo &amp; Device Targeting</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Send visitors from the US to your USD store, mobile users to app stores, and desktop users to web portals.</p>
    </div>
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div class="text-purple-400 font-mono text-xs font-bold mb-2">02 / TRACKING</div>
      <h3 class="text-lg font-bold text-white mb-2">Ad Retargeting Pixels</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Inject Meta Pixel, Google Tag Manager, TikTok, LinkedIn, and custom HTML scripts into intermediate redirect steps.</p>
    </div>
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div class="text-pink-400 font-mono text-xs font-bold mb-2">03 / SOCIAL</div>
      <h3 class="text-lg font-bold text-white mb-2">Custom OpenGraph &amp; Twitter Cards</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Override thumbnail previews, titles, and descriptions when sharing links on WhatsApp, iMessage, Twitter, and Slack.</p>
    </div>
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div class="text-emerald-400 font-mono text-xs font-bold mb-2">04 / AUTOMATION</div>
      <h3 class="text-lg font-bold text-white mb-2">REST API &amp; CI/CD Keys</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Programmatic API with fine-grained scoping, rate-limiting, and webhooks for effortless pipeline integration.</p>
    </div>
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div class="text-amber-400 font-mono text-xs font-bold mb-2">05 / SECURITY</div>
      <h3 class="text-lg font-bold text-white mb-2">Password Protection &amp; Expiry</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Protect confidential documents with passcodes, auto-expiring links, and maximum click caps.</p>
    </div>
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
      <div class="text-sky-400 font-mono text-xs font-bold mb-2">06 / BRANDING</div>
      <h3 class="text-lg font-bold text-white mb-2">QR Codes &amp; Dynamic SVG</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Generate high-resolution SVG and PNG QR codes with customized colors, margins, and error correction levels.</p>
    </div>
  </div>
</section>`;

export const DEFAULT_ABOUT_HTML = `<!-- About Page Content -->
<section class="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
  <div class="text-center space-y-4">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
      About URLZ
    </div>
    <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
      Next-Generation Edge Link Infrastructure
    </h1>
    <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
      Built for developers, enterprises, and creators who need fast, privacy-respecting, and reliable link shortening.
    </p>
  </div>

  <div class="space-y-6 text-xs text-slate-300 leading-relaxed">
    <div class="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
      <h3 class="text-base font-bold text-white">Our Mission</h3>
      <p>
        URLZ was created to solve the latency and privacy vulnerabilities of legacy shorteners. Traditional services route requests through centralized origins, causing noticeable redirects delays and collecting invasive user profiles.
      </p>
      <p>
        By running distributed on global edge nodes with Cloudflare Workers and D1, URLZ delivers redirects in single-digit milliseconds while adhering to strict zero-surveillance privacy principles.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
        <h4 class="text-sm font-bold text-indigo-400">99.99% Edge Availability</h4>
        <p class="text-slate-400">Zero single point of failure with automatic failover across hundreds of global cities.</p>
      </div>
      <div class="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
        <h4 class="text-sm font-bold text-indigo-400">GDPR &amp; Privacy First</h4>
        <p class="text-slate-400">IP anonymization, cookie-less tracking, and configurable audit data retention policies.</p>
      </div>
    </div>
  </div>
</section>`;

export const DEFAULT_CONTACT_HTML = `<!-- Contact Page Content -->
<section class="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
  <div class="text-center space-y-4">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
      Get In Touch
    </div>
    <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
      We Are Here to Help
    </h1>
    <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
      Have a question about high-volume API access, custom domains, or abuse reports? Our engineering team is ready to assist.
    </p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
    <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
      <div class="text-xl">💬</div>
      <h3 class="font-bold text-white">General Inquiries</h3>
      <p class="text-slate-400">support@urlz.eu.org</p>
    </div>
    <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
      <div class="text-xl">⚡</div>
      <h3 class="font-bold text-white">Developer API</h3>
      <p class="text-slate-400">api@urlz.eu.org</p>
    </div>
    <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
      <div class="text-xl">🛡️</div>
      <h3 class="font-bold text-white">Abuse &amp; Phishing</h3>
      <p class="text-slate-400">abuse@urlz.eu.org</p>
    </div>
  </div>
</section>`;

export const DEFAULT_TERMS_HTML = `<!-- Terms of Service Content -->
<section class="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
  <div class="border-b border-slate-800 pb-6 space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
      Legal Documentation
    </div>
    <h1 class="text-3xl font-black text-white">Terms of Service</h1>
    <p class="text-xs text-slate-400">Last updated: October 2026</p>
  </div>

  <div class="space-y-6 text-xs text-slate-300 leading-relaxed">
    <section class="space-y-2">
      <h2 class="text-sm font-bold text-white">1. Acceptance of Terms</h2>
      <p>By creating an account, shortening URLs, or using our API services, you agree to comply with and be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our service.</p>
    </section>

    <section class="space-y-2">
      <h2 class="text-sm font-bold text-white">2. Acceptable Use Policy</h2>
      <p>URLZ is designed for legitimate redirection and traffic routing. You agree strictly NOT to use the platform for:</p>
      <ul class="list-disc pl-5 space-y-1 text-slate-400">
        <li>Phishing, credential harvesting, or deceptive impersonation.</li>
        <li>Distribution of malware, ransomware, or unauthorized software.</li>
        <li>Spamming unsolicited messages across social media or email.</li>
        <li>Illegal, non-consensual, or unlawful media.</li>
      </ul>
      <p>Violating links will be terminated immediately, and offending user accounts permanently banned without notice.</p>
    </section>

    <section class="space-y-2">
      <h2 class="text-sm font-bold text-white">3. Fair Usage &amp; API Quotas</h2>
      <p>Free accounts include standard web management quotas. Programmatic REST API usage requires an upgraded developer tier or administrator authorization. Automated abuse or denial-of-service attempts will trigger IP rate-limiting.</p>
    </section>
  </div>
</section>`;

export const DEFAULT_PRIVACY_HTML = `<!-- Privacy Policy Content -->
<section class="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
  <div class="border-b border-slate-800 pb-6 space-y-2">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
      Legal Documentation
    </div>
    <h1 class="text-3xl font-black text-white">Privacy Policy</h1>
    <p class="text-xs text-slate-400">Last updated: October 2026 &bull; GDPR &amp; CCPA Compliant</p>
  </div>

  <div class="space-y-6 text-xs text-slate-300 leading-relaxed">
    <section class="space-y-2">
      <h2 class="text-sm font-bold text-white">1. Information We Collect</h2>
      <p>We respect your privacy by practicing strict data minimization:</p>
      <ul class="list-disc pl-5 space-y-1 text-slate-400">
        <li><strong>Account Data:</strong> Username, email (optional), and securely hashed passwords.</li>
        <li><strong>Click Analytics:</strong> Timestamp, referrer URL, device type, operating system, and approximate country/city level location.</li>
        <li><strong>IP Addresses:</strong> We do NOT store raw IP addresses in permanent analytics logs; IPs are truncated or anonymized before storage.</li>
      </ul>
    </section>

    <section class="space-y-2">
      <h2 class="text-sm font-bold text-white">2. Cookies &amp; Tracking</h2>
      <p>We use essential session tokens strictly for user authentication. We do not place third-party advertising tracking cookies on root visitors unless explicitly configured by the account owner on specific interstitial splash links.</p>
    </section>

    <section class="space-y-2">
      <h2 class="text-sm font-bold text-white">3. Data Subject Rights (GDPR)</h2>
      <p>You have the right to inspect, export, or permanently delete your account and associated links at any time from your account settings.</p>
    </section>
  </div>
</section>`;

export const PAGE_DEFAULT_TEMPLATES: Record<string, { label: string; path: string; html: string }> = {
  branded: {
    label: 'Main Index / Branded Welcome Page',
    path: '/',
    html: DEFAULT_BRANDED_WELCOME_HTML,
  },
  features: {
    label: 'Features Page',
    path: '/features',
    html: DEFAULT_FEATURES_HTML,
  },
  about: {
    label: 'About Page',
    path: '/about',
    html: DEFAULT_ABOUT_HTML,
  },
  contact: {
    label: 'Contact Page',
    path: '/contact',
    html: DEFAULT_CONTACT_HTML,
  },
  terms: {
    label: 'Terms of Service',
    path: '/terms',
    html: DEFAULT_TERMS_HTML,
  },
  privacy: {
    label: 'Privacy Policy',
    path: '/privacy',
    html: DEFAULT_PRIVACY_HTML,
  },
};
