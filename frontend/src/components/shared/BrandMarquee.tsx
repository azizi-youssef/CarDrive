import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { POPULAR_BRANDS } from '@/lib/constants/catalog';
import { BRAND_LOGO_PATHS } from '@/lib/constants/brand-logos';

/* Marques de la recherche (sans l'option « Toutes les marques ») */
const BRANDS = POPULAR_BRANDS.filter((brand) => brand !== 'Toutes les marques');

/* Libellés d'affichage : la valeur filtrée reste celle du catalogue */
const DISPLAY_NAMES: Record<string, string> = {
  Citroen: 'Citroën',
};

function BrandTile({ brand, duplicate }: { brand: string; duplicate: boolean }) {
  const name = DISPLAY_NAMES[brand] ?? brand;
  const path = BRAND_LOGO_PATHS[brand];

  return (
    <Link
      href={`/search?brand=${encodeURIComponent(brand)}`}
      tabIndex={duplicate ? -1 : undefined}
      className="group/tile relative flex h-24 w-40 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-b from-white to-[#F5F6F8] shadow-[0_1px_2px_rgba(11,18,32,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-[#0B1220]/15 hover:shadow-[0_18px_36px_-20px_rgba(11,18,32,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946] sm:h-28 sm:w-48 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Liseré rouge révélé au survol */}
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-0.5 origin-center scale-x-0 rounded-full bg-[#E63946] transition-transform duration-300 group-hover/tile:scale-x-100 motion-reduce:transition-none"
      />
      {path ? (
        <>
          <svg
            viewBox="0 0 24 24"
            role="img"
            aria-label={name}
            className="h-9 w-9 fill-[#0B1220] opacity-65 transition-opacity duration-300 group-hover/tile:opacity-100 sm:h-10 sm:w-10"
          >
            <path d={path} />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors duration-300 group-hover/tile:text-[#0B1220]">
            {name}
          </span>
        </>
      ) : (
        // Pas de logo libre de droits disponible : logotype typographique
        <span className="px-4 text-center text-[13px] font-extrabold uppercase leading-snug tracking-[0.12em] text-[#0B1220] opacity-65 transition-opacity duration-300 group-hover/tile:opacity-100 sm:text-sm">
          {name}
        </span>
      )}
      <span className="sr-only"> — voir les véhicules</span>
    </Link>
  );
}

function BrandTrack({ duplicate = false }: { duplicate?: boolean }) {
  return (
    // La 2ᵉ copie ne sert qu'à boucler l'animation : masquée aux lecteurs d'écran et hors tabulation
    <ul className="flex shrink-0 items-center py-3" aria-hidden={duplicate || undefined}>
      {BRANDS.map((brand) => (
        // Espacement par marge (et non gap) pour que les deux copies s'enchaînent sans saut
        <li key={brand} className="me-4 sm:me-5">
          <BrandTile brand={brand} duplicate={duplicate} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Bandeau défilant des grandes marques, chacune menant à la recherche filtrée.
 * Pause au survol et au focus ; défilement manuel si l'utilisateur réduit les mouvements.
 */
export function BrandMarquee() {
  return (
    <section aria-labelledby="brand-marquee-title" className="border-b border-slate-200 bg-white py-10 sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E63946]">
            <span className="h-px w-7 bg-current" aria-hidden="true" />
            Constructeurs
          </p>
          <h2 id="brand-marquee-title" className="mt-2 text-xl font-extrabold tracking-tight text-[#0B1220] sm:text-2xl">
            Les grandes marques
          </h2>
        </div>
        <Link
          href="/search"
          className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#0B1220] transition-colors hover:text-[#E63946]"
        >
          Tout le catalogue
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* dir="ltr" : en RTL, la piste ancrée à droite laisserait la bande vide pendant la boucle */}
      <div
        dir="ltr"
        className="group relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]"
      >
        <div className="flex w-max animate-[cd-marquee_45s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          <BrandTrack />
          {/* Copie pour la boucle — inutile quand l'animation est désactivée */}
          <div className="flex motion-reduce:hidden">
            <BrandTrack duplicate />
          </div>
        </div>
      </div>
    </section>
  );
}
