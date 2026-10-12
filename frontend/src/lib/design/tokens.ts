/**
 * Jetons de design du portail agence CarDrive.
 * Palette de marque unique — evite la derive visuelle entre les dashboards.
 */

export const BRAND = {
  navy: '#0B1220',
  red: '#E63946',
  white: '#FFFFFF',
  surface: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
} as const;

/** Classes Tailwind reutilisables (bordures, etats, focus). */
export const shell = {
  page: 'min-h-screen bg-[#F1F5F9] text-[#0F172A]',
  sidebar: 'bg-[#0B1220] text-white',
  card: 'rounded-2xl border border-slate-200 bg-white',
  cardPad: 'p-5 sm:p-6',
  heading: 'text-lg font-bold tracking-tight text-[#0F172A]',
  subtle: 'text-sm text-[#64748B]',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2',
} as const;

export const button = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C92F3B] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50',
} as const;

export const input =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/25 disabled:bg-slate-100 disabled:text-slate-500';

/** Presets de periode pour les filtres du dashboard. */
export type RangePreset = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'all';

export const RANGE_PRESETS: readonly { value: RangePreset; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'ytd', label: 'Cette année' },
  { value: 'all', label: 'Tout' },
] as const;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Convertit un preset en bornes [from, to] (bornes exclues = non definies). */
export function resolveRange(preset: RangePreset): { from?: string; to?: string } {
  if (preset === 'all') return {};
  const now = new Date();
  if (preset === 'today') return { from: isoDate(now), to: isoDate(now) };
  if (preset === 'ytd') return { from: `${now.getFullYear()}-01-01`, to: isoDate(now) };
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: isoDate(start), to: isoDate(now) };
}
