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
  },
};

export default nextConfig;
