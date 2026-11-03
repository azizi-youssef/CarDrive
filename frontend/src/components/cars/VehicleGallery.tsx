'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CarFront, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOptimizableImage } from '@/lib/utils/images';

interface VehicleGalleryProps {
  images: string[];
  /** Ex. « Hyundai Tucson 2026 » — sert aux textes alternatifs */
  title: string;
  /** Pastille superposée (statut de disponibilité) */
  overlay?: React.ReactNode;
}

function Placeholder({ title, className }: { title: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${title} — photo indisponible`}
      className={cn('flex h-full w-full items-center justify-center bg-linear-to-b from-[#EEF0F3] to-[#F5F6F8] text-slate-300', className)}
    >
      <CarFront className="h-16 w-16" strokeWidth={1.2} aria-hidden="true" />
    </div>
  );
}

/**
 * Galerie de la fiche véhicule : grande photo, miniatures, compteur, navigation clavier
 * et visionneuse plein écran. Les photos en échec sont remplacées par un emplacement neutre.
 */
export function VehicleGallery({ images, title, overlay }: VehicleGalleryProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const count = images.length;
  const hasMany = count > 1;
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const src = count > 0 && !failed.has(safeIndex) ? images[safeIndex] : undefined;

  const go = useCallback(
    (step: 1 | -1) => {
      if (count < 2) return;
      setDirection(step);
      setIndex((current) => (current + step + count) % count);
    },
    [count]
  );

  const markFailed = (i: number) => setFailed((current) => new Set(current).add(i));

  // Visionneuse : Échap, flèches, scroll bloqué, focus restauré à la fermeture
  useEffect(() => {
    if (!lightboxOpen) return;
    const opener = openerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [lightboxOpen, go]);

  const slide = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: direction * 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
      };

  const arrowClass =
    'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#0B1220] shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946]';

  return (
    <section aria-roledescription="carrousel" aria-label={`Photos — ${title}`} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_1px_2px_rgba(11,18,32,0.04)] sm:p-2.5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#F5F6F8]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={safeIndex}
            className="absolute inset-0"
            initial={slide.initial}
            animate={slide.animate}
            exit={slide.exit}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
          >
            {src ? (
              <Image
                src={src}
                alt={`${title} — photo ${safeIndex + 1} sur ${Math.max(count, 1)}`}
                fill
                priority={safeIndex === 0}
                sizes="(max-width: 1024px) 100vw, 860px"
                className="object-cover"
                unoptimized={!isOptimizableImage(src)}
                onError={() => markFailed(safeIndex)}
              />
            ) : (
              <Placeholder title={title} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/35 to-transparent" />

        {overlay && <div className="absolute start-3 top-3 z-10">{overlay}</div>}

        {hasMany && (
          <>
            <button type="button" onClick={() => go(-1)} className={cn(arrowClass, 'start-3')} aria-label="Photo précédente">
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(1)} className={cn(arrowClass, 'end-3')} aria-label="Photo suivante">
              <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            </button>
          </>
        )}

        <div className="absolute bottom-3 start-3 z-10 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-bold tabular-nums text-white backdrop-blur-md" aria-live="polite">
          {count > 0 ? safeIndex + 1 : 0} / {count}
        </div>

        {src && (
          <button
            ref={openerRef}
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Afficher la photo en plein écran"
            className="absolute bottom-3 end-3 z-10 inline-flex h-10 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-xs font-bold text-[#0B1220] shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E63946]"
          >
            <Expand className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline" aria-hidden="true">Plein écran</span>
          </button>
        )}
      </div>

      {hasMany && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:mt-2.5" aria-label="Miniatures">
          {images.map((image, i) => (
            <li key={`${image}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDirection(i > safeIndex ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={`Afficher la photo ${i + 1}`}
                aria-current={i === safeIndex ? 'true' : undefined}
                className={cn(
                  'relative block aspect-[16/10] w-24 overflow-hidden rounded-lg border-2 transition sm:w-28',
                  i === safeIndex ? 'border-[#E63946]' : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                {failed.has(i) ? (
                  <Placeholder title={title} className="[&_svg]:h-6 [&_svg]:w-6" />
                ) : (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized={!isOptimizableImage(image)}
                    onError={() => markFailed(i)}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── Visionneuse plein écran ─────────────────────────────── */}
      {lightboxOpen && src && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — visionneuse`}
          className="fixed inset-0 z-[70] flex flex-col bg-[#0B1220]/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <p className="text-sm font-bold">
              {title}
              <span className="ms-3 font-medium tabular-nums text-slate-400">
                {safeIndex + 1} / {count}
              </span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Fermer la visionneuse"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={src}
              alt={`${title} — photo ${safeIndex + 1} sur ${count}`}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized={!isOptimizableImage(src)}
            />
            {hasMany && (
              <>
                <button type="button" onClick={() => go(-1)} className={cn(arrowClass, 'start-4')} aria-label="Photo précédente">
                  <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => go(1)} className={cn(arrowClass, 'end-4')} aria-label="Photo suivante">
                  <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          <div className="pb-[max(1rem,env(safe-area-inset-bottom))]" />
        </div>
      )}
    </section>
  );
}
