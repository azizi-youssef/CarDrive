import type { NextConfig } from "next";

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  const supabaseOrigin = new URL(supabaseUrl);
  if (supabaseOrigin.protocol === "https:") {
    remotePatterns.push({
      protocol: "https",
      hostname: supabaseOrigin.hostname,
      pathname: "/storage/v1/object/**",
    });
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@cardrive/shared"],
  images: {
    remotePatterns,
  },
};

export default nextConfig;
