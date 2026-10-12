import Link from 'next/link';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import { Home, Search } from 'lucide-react';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export default function NotFound() {
  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-[#F3F5F7] px-5 py-16 font-[family-name:var(--font-body)] text-slate-900`}
    >
      {/* Ligne de route */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[18%] h-1"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #0B0E13 0 36px, transparent 36px 68px)',
          opacity: 0.12,
        }}
      />

      <div className="relative w-full max-w-xl text-center">
        {/* Plaque */}
        <div
          role="img"
          aria-label="Erreur 404"
          className="inline-flex items-stretch overflow-hidden rounded-2xl bg-white text-[#0B0E13] shadow-[0_18px_50px_rgba(11,14,19,0.14)] ring-1 ring-black/15"
        >
          <span className="m-1 flex items-center rounded-xl border-[3px] border-[#0B0E13] px-6 py-2 font-[family-name:var(--font-display)] text-7xl font-extrabold leading-none tracking-[-0.05em] sm:px-8 sm:text-8xl">
            404
          </span>
          <span className="flex items-center bg-[#E63946] px-3.5 text-xs font-semibold text-white sm:px-4 sm:text-sm">
            Introuvable
          </span>
        </div>

        <h1 className="mt-10 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.04em] text-[#0B0E13] sm:text-5xl">
          Page introuvable
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
          Cette page n'existe pas ou a été déplacée. Le véhicule que vous
          cherchez a peut-être été retiré de la route.
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#E63946] px-6 text-[15px] font-semibold text-white outline-none transition-colors hover:bg-[#D32F3C] focus-visible:ring-2 focus-visible:ring-[#E63946]/60 focus-visible:ring-offset-2 active:bg-[#BF2935]"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <Link
            href="/search"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-800 outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#E63946]/50"
          >
            <Search aria-hidden="true" className="h-4 w-4" />
            Chercher un véhicule
          </Link>
        </div>
      </div>
    </main>
  );
}