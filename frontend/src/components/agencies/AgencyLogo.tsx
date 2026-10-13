'use client';

import { useState } from 'react';
import { AGENCY_LOGO_ASSETS } from '@/lib/constants/agency-logo-assets';

export function AgencyLogo({
  slug,
  name,
  logoUrl,
  className,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  className: string;
}) {
  const storedLogo = logoUrl?.trim() || '';
  const bundledLogo = AGENCY_LOGO_ASSETS[slug]?.publicPath;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const src =
    storedLogo && failedSource !== storedLogo
      ? storedLogo
      : bundledLogo && failedSource !== bundledLogo
        ? bundledLogo
        : null;

  if (!src) {
    return (
      <span
        aria-label={`Logo indisponible pour ${name}`}
        className={`flex h-full w-full items-center justify-center bg-[#02306B] text-lg font-bold text-white ${className}`}
      >
        {name.trim().charAt(0).toLocaleUpperCase('fr-FR') || '?'}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- agency logos can come from Supabase Storage or bundled assets
    <img
      src={src}
      alt={`Logo ${name}`}
      className={className}
      onError={() => setFailedSource(src)}
    />
  );
}
