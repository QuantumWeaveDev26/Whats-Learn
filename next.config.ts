import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    // Keep APIs' route-specific cache and upload sandbox policies intact.
    const pages = ["/", "/learn", "/find-my-path", "/membership", "/companion", "/settings", "/support", "/signin", "/signup", "/forgot-password", "/reset-password", "/welcome", "/privacy", "/terms", "/refunds", "/age-policy", "/billing/setup", "/admin/quality"];
    return [
      // Explicit .* also matches / in Vinext's current config-header matcher.
      { source: "/:path(.*)", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Deliberately omit includeSubDomains and preload: other hosts are managed separately.
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
      ] },
      ...pages.map(source => ({ source, headers: [
        // These pages can appear in the site's own frame or its ChatGPT companion.
        // Do not overwrite private-upload CSP sandbox rules on /api routes.
        { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://chat.openai.com; object-src 'none'; base-uri 'self'" },
        // Observe script-policy incompatibilities before enforcing nonce/hash restrictions.
        // No report endpoint is configured: reports stay in the browser console.
        { key: "Content-Security-Policy-Report-Only", value: "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com 'report-sample'; object-src 'none'; base-uri 'self'" },
      ] })),
    ];
  },
};

export default nextConfig;
