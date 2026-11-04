'use client';

import React, { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { BRAND_LOGO_PATHS } from '@/lib/constants/brand-logos';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { cn } from '@/lib/utils';

/*
 * Ordre = demande du marché marocain : les marques produites ou très diffusées localement
 * (Dacia, Renault, Peugeot) d'abord, puis les généralistes, le premium en dernier.
 * Valeurs = libellés du catalogue (utilisés pour le filtre de recherche).
 */
export const FEATURED_BRANDS = [
  'Dacia',
  'Renault',
  'Peugeot',
  'Toyota',
  'Volkswagen',
  'Hyundai',
  'Kia',
  'Citroen',
  'Mercedes-Benz',
  'Land Rover',
] as const;

/* Libellés d'affichage : la valeur filtrée reste celle du catalogue */
const DISPLAY_NAMES: Record<string, string> = {
  Citroen: 'Citroën',
};

/*
 * Poids optique : chaque logo tient dans une boîte de 40×40 px, puis une échelle par marque
 * égalise la surface visuelle (logos fins et larges agrandis, emblèmes pleins réduits).
 */
const LOGO_SCALE: Record<string, number> = {
  Dacia: 1.2,
  Renault: 0.9,
  Peugeot: 0.95,
  Toyota: 0.95,
  Volkswagen: 0.9,
  Hyundai: 1.1,
  Kia: 1.25,
  Citroen: 0.95,
  'Mercedes-Benz': 0.9,
  'Land Rover': 1,
};

/*
 * Contrastes sur fond blanc : logos et noms #374151 (10,3:1), nombre de véhicules #4B5563 (7,6:1).
 * Le rouge de marque #E63946 ne fait que 4,2:1 : il sert aux éléments graphiques (seuil 3:1),
 * le texte rouge utilise #C92F3B (5,3:1).
 */
const COLORS = {
  accentText: '#C92F3B',
  accent: '#E63946',
};

/** Compte de véhicules par marque, clé normalisée (minuscules, sans accents). */
export function normalizeBrandKey(brand: string): string {
  return brand
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Logo vectoriel d'une marque (tracé Simple Icons, ou emblème dédié). */
export function BrandLogo({ brand, className }: { brand: string; className?: string }) {
  const scale = { transform: `scale(${LOGO_SCALE[brand] ?? 1})` };
  if (brand === 'Land Rover') {
    // Pas de tracé libre : ovale typographique dans l'esprit du badge
    return (
      <svg viewBox="0 0 48 24" aria-hidden="true" className={className} style={scale}>
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} style={scale}>
      <path d={path} fill="currentColor" />
    </svg>
  );
}

/** Carte d'une marque : logo, nom et nombre de véhicules, lien vers la recherche filtrée. */
function BrandCard({
  brand,
  count,
  loading,
}: {
  brand: string;
  count: number | undefined;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const name = DISPLAY_NAMES[brand] ?? brand;
  const countLabel =
    count === undefined || count === 0
      ? t.brands.soon
      : (count === 1 ? t.brands.vehicleOne : t.brands.vehicleMany).replace('{count}', String(count));

  return (
    <Link
      href={`/search?brand=${encodeURIComponent(brand)}`}
      aria-label={
        loading
          ? t.brands.cardLabel.replace('{brand}', name)
          : `${t.brands.cardLabel.replace('{brand}', name)} — ${countLabel}`
      }
      className="group/card flex h-31 w-[clamp(132px,36vw,168px)] flex-col items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-3 shadow-[0_1px_2px_rgba(11,18,32,0.04),0_8px_20px_-16px_rgba(11,18,32,0.2)] outline-none transition-[translate,scale,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[#E63946] hover:shadow-[0_2px_4px_rgba(11,18,32,0.05),0_18px_32px_-18px_rgba(11,18,32,0.35)] focus-visible:-translate-y-1 focus-visible:border-[#E63946] focus-visible:ring-2 focus-visible:ring-[#E63946]/35 active:translate-y-0 active:scale-[0.98] sm:h-33 sm:rounded-[24px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      {/* Boîte 40×40 : même surface visuelle pour tous les logos */}
      <span className="flex h-10 w-10 items-center justify-center" aria-hidden="true">
        <BrandLogo
          brand={brand}
          className="h-full w-full text-[#374151] transition-colors duration-200 group-hover/card:text-[#0B1220] group-focus-visible/card:text-[#0B1220]"
        />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#374151] transition-colors duration-200 group-hover/card:text-[#0B1220]">
        {name}
      </span>
      {loading ? (
        <span className="h-3.5 w-16 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <span className="text-xs font-medium text-[#4B5563]">{countLabel}</span>
      )}
    </Link>
  );
}

/** Vitesse du défilement continu (px/s), et pause après une action de l'utilisateur */
const CYCLE_SPEED_PX_PER_S = 32;
const MANUAL_HOLD_MS = 6000;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/** Largeur d'une série complète de marques (cartes + écarts), base du cycle. */
function measureSetWidth(el: HTMLUListElement, count: number): number {
  const items = el.children;
  if (count === 0 || items.length < count) return 0;
  const first = items[0] as HTMLElement;
  if (items.length > count) return (items[count] as HTMLElement).offsetLeft - first.offsetLeft;
  const last = items[count - 1] as HTMLElement;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  return last.offsetLeft + last.offsetWidth + gap - first.offsetLeft;
}

/**
 * Carrousel animé des grandes marques, en cycle infini :
 * - défilement continu et fluide ; une copie de la série est placée à la suite et la position est
 *   recalée d'une série dès qu'elle est dépassée, si bien que la boucle n'a ni fin ni saut visible ;
 * - défilement natif (swipe, molette, clavier), flèches sans butée et barre de progression du cycle ;
 * - pause au survol, au focus, au toucher, hors écran et onglet masqué, bouton pause/lecture (WCAG 2.2.2) ;
 * - apparition en cascade des cartes à l'entrée dans l'écran ;
 * - aucune animation si l'utilisateur a demandé à réduire les mouvements (liste simple, sans copie).
 */
export function BrandMarquee({
  brands = FEATURED_BRANDS,
  vehicleCounts,
  countsLoading = false,
}: {
  brands?: readonly string[];
  /** Nombre de véhicules par marque, clés issues de normalizeBrandKey() */
  vehicleCounts?: Record<string, number>;
  countsLoading?: boolean;
}) {
  const { t } = useTranslation();
  const scrollerId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const holdUntil = useRef(0);
  const setWidth = useRef(0);
  const position = useRef(0);
  const [state, setState] = useState({ canPrev: false, canNext: true, thumb: 100, offset: 0 });

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true
  );
  // Cycle possible : animations autorisées et marques plus larges que l'écran (sinon tout est déjà visible)
  const [loop, setLoop] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [inView, setInView] = useState(false);
  // Apparition en cascade, jouée une seule fois quand la section approche de l'écran
  const [reveal, setReveal] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const series = measureSetWidth(el, brands.length);
    setWidth.current = series;
    const cycle = !reducedMotion && series > el.clientWidth + 8;
    setLoop(cycle);

    if (cycle) {
      // Position dans le cycle courant ; flèches toujours actives (pas de butée)
      const thumb = Math.min(100, (el.clientWidth / (series + el.clientWidth)) * 100);
      const progress = (((el.scrollLeft % series) + series) % series) / series;
      setState({ canPrev: true, canNext: true, thumb, offset: progress * (100 - thumb) });
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    const thumb = el.scrollWidth > 0 ? Math.min(100, (el.clientWidth / el.scrollWidth) * 100) : 100;
    const ratio = max > 0 ? el.scrollLeft / max : 0;
    setState({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft < max - 4,
      thumb,
      offset: ratio * (100 - thumb),
    });
  }, [brands.length, reducedMotion]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Recalage d'une série une fois le défilement manuel terminé (évite d'interrompre un swipe)
    const wrap = () => {
      const series = setWidth.current;
      if (loop && series > 0 && el.scrollLeft >= series) el.scrollLeft -= series;
    };
    // Les événements scroll sont déjà cadencés par le navigateur (une fois par image au plus)
    update();
    el.addEventListener('scroll', update, { passive: true });
    el.addEventListener('scrollend', wrap);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      el.removeEventListener('scrollend', wrap);
      observer.disconnect();
    };
  }, [update, loop]);

  // Visibilité de la section : met le défilement en pause hors écran
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold: 0.2,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Apparition : déclenchée un peu avant l'entrée à l'écran (marge de 15 %), donc sans clignotement.
  // Les cartes ne sont jamais masquées à l'avance : si l'observateur ne se déclenche pas, elles restent visibles.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const near = entry?.isIntersecting ?? false;
        if (first) {
          first = false;
          // Déjà visible au chargement : pas d'animation
          if (near) observer.disconnect();
          return;
        }
        if (near) {
          setReveal(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px 15% 0px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const autoplayActive = loop && playing && pageVisible && inView && !hovered && !focusInside;

  // Défilement continu : position flottante cumulée (scrollLeft est arrondi par les navigateurs)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!autoplayActive || !el) return;
    position.current = el.scrollLeft;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = Math.min(50, now - last);
      last = now;
      if (Date.now() < holdUntil.current) {
        position.current = el.scrollLeft;
      } else {
        // L'utilisateur a bougé la liste entre-temps : on repart de sa position
        if (Math.abs(el.scrollLeft - Math.round(position.current)) > 2) position.current = el.scrollLeft;
        position.current += (CYCLE_SPEED_PX_PER_S * elapsed) / 1000;
        const series = setWidth.current;
        if (series > 0 && position.current >= series) position.current -= series;
        el.scrollLeft = Math.round(position.current);
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [autoplayActive]);

  /** Toute action manuelle suspend le défilement automatique quelques secondes */
  const holdAutoplay = () => {
    holdUntil.current = Date.now() + MANUAL_HOLD_MS;
  };

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    holdAutoplay();
    const page = el.clientWidth * 0.85;
    const series = setWidth.current;
    // Cycle : on se replace d'une série avant d'avancer pour ne jamais buter sur une extrémité
    if (loop && series > 0) {
      if (direction > 0 && el.scrollLeft + page > el.scrollWidth - el.clientWidth - 1) el.scrollLeft -= series;
      if (direction < 0 && el.scrollLeft - page < 0) el.scrollLeft += series;
    }
    el.scrollBy({ left: direction * page, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const roundButton =
    'flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0B1220] shadow-sm outline-none transition-colors duration-200 hover:border-[#E63946] hover:text-[#C92F3B] focus-visible:ring-2 focus-visible:ring-[#E63946]/40 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:shadow-none disabled:hover:border-slate-100';

  const pauseButton = (className: string) =>
    loop ? (
      <button
        type="button"
        onClick={() => setPlaying((value) => !value)}
        aria-controls={scrollerId}
        aria-label={playing ? t.brands.pause : t.brands.play}
        title={playing ? t.brands.pause : t.brands.play}
        className={cn(roundButton, className)}
      >
        {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
      </button>
    ) : null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="brand-marquee-title"
      // Marge de départ commune au titre et aux cartes (mêmes valeurs que le conteneur max-w-7xl)
      className="bg-white py-12 [--edge:1rem] sm:py-16 sm:[--edge:1.5rem] lg:[--edge:max(2rem,calc((100%-80rem)/2+2rem))]"
    >
      <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: COLORS.accentText }}>
            {t.brands.eyebrow}
          </p>
          <h2 id="brand-marquee-title" className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-[28px]">
            {t.brands.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/search"
            className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-bold text-[#0B1220] outline-none transition-colors hover:text-[#C92F3B] focus-visible:ring-2 focus-visible:ring-[#E63946]/40"
          >
            {t.brands.catalog}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none rtl:rotate-180"
              aria-hidden="true"
            />
          </Link>
          <div dir="ltr" className="flex items-center gap-2">
            {/* Pause/lecture : à côté des flèches sur PC, sous le carrousel sur mobile */}
            {pauseButton('hidden sm:flex')}
            {/* Flèches : masquées sur mobile (swipe natif) */}
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!state.canPrev}
              aria-controls={scrollerId}
              aria-label={t.brands.previous}
              className={cn(roundButton, 'hidden sm:flex')}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!state.canNext}
              aria-controls={scrollerId}
              aria-label={t.brands.next}
              className={cn(roundButton, 'hidden sm:flex')}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* dir="ltr" : défilement et flèches cohérents quelle que soit la langue */}
      <div
        dir="ltr"
        role="region"
        aria-label={t.brands.regionLabel}
        className="relative mt-5"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocusInside(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false);
        }}
      >
        <ul
          id={scrollerId}
          ref={scrollerRef}
          onPointerDown={holdAutoplay}
          onWheel={holdAutoplay}
          onTouchStart={holdAutoplay}
          className={cn(
            'flex gap-3 overflow-x-auto overscroll-x-contain py-4 ps-(--edge) pe-(--edge) scroll-ps-(--edge) [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden',
            // Aimantation sur les cartes, sauf pendant le défilement continu (elle le bloquerait)
            autoplayActive ? 'snap-none' : 'snap-x snap-mandatory'
          )}
        >
          {/* Cycle : série d'origine + copie inerte (masquée aux lecteurs d'écran, hors tabulation) */}
          {(loop ? [0, 1] : [0]).flatMap((copy) =>
            brands.map((brand, index) => (
              <li
                key={`${copy}-${brand}`}
                aria-hidden={copy === 1 || undefined}
                inert={copy === 1 || undefined}
                className={cn(
                  'shrink-0 snap-start',
                  reveal && 'animate-[cd-brand-rise_560ms_cubic-bezier(0.16,1,0.3,1)_both]'
                )}
                style={reveal ? { animationDelay: `${Math.min(index, 7) * 70}ms` } : undefined}
              >
                <BrandCard
                  brand={brand}
                  count={vehicleCounts?.[normalizeBrandKey(brand)]}
                  loading={countsLoading}
                />
              </li>
            ))
          )}
        </ul>

        {/* Fondus contextuels : à gauche seulement après défilement, à droite tant qu'il reste du contenu */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-white to-transparent transition-opacity duration-200 sm:w-16',
            state.canPrev ? 'opacity-100' : 'opacity-0'
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-white to-transparent transition-opacity duration-200 sm:w-16',
            state.canNext ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* Barre de progression (décorative) ; sur mobile, précédée du bouton pause/lecture */}
      {state.thumb < 100 && (
        <div dir="ltr" className="mx-auto mt-3 flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          {pauseButton('sm:hidden')}
          <div aria-hidden="true" className="relative h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute inset-y-0 rounded-full transition-[left] duration-150 motion-reduce:transition-none"
              style={{ width: `${state.thumb}%`, left: `${state.offset}%`, backgroundColor: COLORS.accent }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
