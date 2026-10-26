import type { NextConfig } from "next";

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "wviqbscbnrrpxpojhqql.supabase.co",
    pathname: "/**",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const supabaseOrigin = new URL(supabaseUrl);
    if (supabaseOrigin.protocol === "https:") {
      remotePatterns.push({
        protocol: "https",
        hostname: supabaseOrigin.hostname,
        pathname: "/**",
      });
    }
  } catch {
    // Ignore invalid url
  }
}

/* -------------------------------------------------------------------------- */
/* Security Headers                                                           */
/* -------------------------------------------------------------------------- */

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Enable XSS protection for legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  // HSTS – force HTTPS (enable only in production behind HTTPS)
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  // Content-Security-Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline chunks + Supabase realtime
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
      // Styles: self + inline (Tailwind generates inline styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + Supabase + Unsplash + data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
      // Connections: self + Supabase API & Realtime
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.whatsapp.com",
      // Workers: self
      "worker-src 'self' blob:",
      // Frame ancestors: deny by default (same as X-Frame-Options)
      "frame-ancestors 'self'",
      // Form submissions to self only
      "form-action 'self'",
      // Base URI
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@cardrive/shared"],
  outputFileTracingIncludes: {
    "/api/admin/agencies/sync-logos": [
      "./public/logo_marchicacar.jpeg",
      "./public/logo_Krinicar.jpeg",
    ],
  },
  images: {
    remotePatterns,
    // Enable size optimization
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Compress output
  compress: true,
  // Enable React strict mode for catching potential issues
  reactStrictMode: true,
  // Power header
  poweredByHeader: false,
};

export default nextConfig;
