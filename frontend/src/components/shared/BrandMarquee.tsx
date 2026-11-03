import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BRAND_LOGO_PATHS } from '@/lib/constants/brand-logos';

/* Valeurs du catalogue (utilisées pour le filtre de recherche), dans l'ordre d'affichage */
export const FEATURED_BRANDS = [
  'Mercedes-Benz',
  'Land Rover',
  'Toyota',
  'Peugeot',
  'Citroen',
  'Dacia',
  'Renault',
  'Volkswagen',
  'Hyundai',
  'Kia',
] as const;

/* Libellés d'affichage : la valeur filtrée reste celle du catalogue */
const DISPLAY_NAMES: Record<string, string> = {
  Citroen: 'Citroën',
};

/** Logo vectoriel d'une marque (tracé Simple Icons, ou emblème dédié). */
export function BrandLogo({ brand, className }: { brand: string; className?: string }) {
  if (brand === 'Land Rover') {
    // Pas de tracé libre : ovale typographique dans l'esprit du badge
    return (
      <svg viewBox="0 0 48 24" aria-hidden="true" className={className}>
        <ellipse cx="24" cy="12" rx="23" ry="11" fill="currentColor" />
        <ellipse cx="24" cy="12" rx="21.2" ry="9.4" fill="none" stroke="#fff" strokeWidth="0.8" />
        <text
          x="24"
          y="14.3"
          textAnchor="middle"
          fill="#fff"
          fontSize="6"
          fontWeight="800"
          textLength="34"
          lengthAdjust="spacingAndGlyphs"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          LAND ROVER
        </text>
      </svg>
    );
  }
  const path = BRAND_LOGO_PATHS[brand];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={path} fill="currentColor" />
    </svg>
  );
}

/** Carte d'une marque : logo centré + nom en majuscules, lien vers la recherche filtrée. */
export function BrandCard({ brand, inert = false }: { brand: string; inert?: boolean }) {
  const name = DISPLAY_NAMES[brand] ?? brand;
  const wide = brand === 'Land Rover';

  return (
    <Link
      href={`/search?brand=${encodeURIComponent(brand)}`}
      tabIndex={inert ? -1 : undefined}
      aria-label={`${name} — voir les véhicules`}
      className="group/card flex h-[82px] w-[clamp(118px,34vw,140px)] flex-col items-center justify-center gap-2 rounded-[22px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04),0_8px_20px_-16px_rgba(11,18,32,0.18)] outline-none transition-[border-color,box-shadow] duration-300 hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(11,18,32,0.05),0_14px_28px_-16px_rgba(11,18,32,0.28)] focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2 sm:h-[86px] sm:w-[144px] sm:rounded-[24px] lg:h-[94px] lg:w-[160px] lg:rounded-[26px] motion-reduce:transition-none"
    >
      <BrandLogo
        brand={brand}
        className={
          (wide ? 'h-7 w-14 lg:h-8 lg:w-16' : 'h-7 w-7 lg:h-8 lg:w-8') +
          ' text-[#0B1220] opacity-80 transition-opacity duration-300 group-hover/card:opacity-100 motion-reduce:transition-none'
        }
      />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 transition-colors duration-300 group-hover/card:text-[#0B1220] lg:text-[11px]">
        {name}
      </span>
    </Link>
  );
}

function BrandTrack({ brands, duplicate = false }: { brands: readonly string[]; duplicate?: boolean }) {
  return (
    // La copie ne sert qu'à boucler l'animation : masquée aux lecteurs d'écran et hors tabulation
    <ul className="flex shrink-0 items-center" aria-hidden={duplicate || undefined}>
      {brands.map((brand) => (
        // Espacement par marge (et non gap) : les deux copies s'enchaînent exactement, sans saut
        <li key={brand} className="me-3 sm:me-4 lg:me-5">
          <BrandCard brand={brand} inert={duplicate} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Carrousel horizontal des grandes marques.
 * Défilement CSS (translateX) en boucle infinie, pause au survol de la section ou au focus clavier,
 * défilement manuel quand l'utilisateur demande moins d'animations.
 */
export function BrandMarquee({
  brands = FEATURED_BRANDS,
  duration = 35,
  eyebrow = 'Constructeurs',
  title = 'Les grandes marques',
}: {
  brands?: readonly string[];
  /** Durée d'un cycle complet, en secondes */
  duration?: number;
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section aria-labelledby="brand-marquee-title" className="group/marquee bg-white py-10 sm:py-14">
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E63946]">{eyebrow}</p>
          <h2 id="brand-marquee-title" className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-[28px]">
            {title}
          </h2>
        </div>
        <Link
          href="/search"
          className="group/link inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg text-sm font-bold text-[#0B1220] outline-none transition-colors hover:text-[#E63946] focus-visible:ring-2 focus-visible:ring-[#E63946]"
        >
          Tout le catalogue
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none rtl:rotate-180"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* dir="ltr" : le défilement va toujours de droite à gauche, même en arabe */}
      <div dir="ltr" className="relative mt-7 overflow-hidden motion-reduce:overflow-x-auto">
        <div
          className="flex w-max py-4 will-change-transform animate-[cd-marquee_var(--marquee-duration)_linear_infinite] group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:px-4"
          style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        >
          <BrandTrack brands={brands} />
          {/* Copie pour la boucle (translateX -50 %) — inutile sans animation */}
          <div className="flex motion-reduce:hidden">
            <BrandTrack brands={brands} duplicate />
          </div>
        </div>

        {/* Fondus blancs aux extrémités */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-white via-white/80 to-transparent sm:w-24 lg:w-40 motion-reduce:hidden"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-white via-white/80 to-transparent sm:w-24 lg:w-40 motion-reduce:hidden"
        />
      </div>
    </section>
  );
}
