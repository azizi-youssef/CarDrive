import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

/* ── KPI Card ──────────────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string } | null;
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-slate-400',
  trend,
  loading,
  className,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className={cn('rounded-xl border border-slate-200 bg-white p-5', className)}>
        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="mt-3 h-8 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="mt-2 h-3 w-20 rounded bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className="rounded-lg bg-slate-50 p-2">
            <Icon aria-hidden="true" className={cn('h-4 w-4', iconColor)} />
          </div>
        )}
      </div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {(sub || trend) && (
        <div className="mt-1.5 flex items-center gap-2">
          {sub && <span className="text-xs text-slate-500">{sub}</span>}
          {trend && <TrendBadge value={trend.value} label={trend.label} />}
        </div>
      )}
    </div>
  );
}

/* ── Trend badge ───────────────────────────────────────────────────── */
function TrendBadge({ value, label }: { value: number; label: string }) {
  const isPos = value > 0;
  const isNeg = value < 0;
  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        isPos ? 'bg-emerald-50 text-emerald-700' : isNeg ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isPos ? '+' : ''}{value}% {label}
    </span>
  );
}

/* ── Status badge ──────────────────────────────────────────────────── */
type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

export function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── Booking status badge ──────────────────────────────────────────── */
const BOOKING_STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  REQUESTED: { label: 'Demandée', variant: 'warning' },
  UNDER_REVIEW: { label: 'En révision', variant: 'info' },
  SENT_TO_AGENCY: { label: 'Envoyée agence', variant: 'info' },
  AGENCY_REVIEW: { label: 'Révision agence', variant: 'info' },
  CONFIRMED: { label: 'Confirmée', variant: 'success' },
  APPROVED: { label: 'Approuvée', variant: 'success' },
  READY_FOR_PICKUP: { label: 'Prête à livrer', variant: 'success' },
  ACTIVE: { label: 'En cours', variant: 'success' },
  COMPLETED: { label: 'Terminée', variant: 'neutral' },
  REJECTED: { label: 'Refusée', variant: 'error' },
  CANCELLED: { label: 'Annulée', variant: 'error' },
  EXPIRED: { label: 'Expirée', variant: 'neutral' },
  ALTERNATIVE_PROPOSED: { label: 'Alternative', variant: 'info' },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const cfg = BOOKING_STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as StatusVariant };
  return <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>;
}

/* ── Agency status badge ───────────────────────────────────────────── */
const AGENCY_STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  SUSPENDED: { label: 'Suspendue', variant: 'error' },
  REJECTED: { label: 'Rejetée', variant: 'error' },
};

export function AgencyStatusBadge({ status }: { status: string }) {
  const cfg = AGENCY_STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as StatusVariant };
  return <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>;
}

/* ── Section header ────────────────────────────────────────────────── */
export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Card ──────────────────────────────────────────────────────────── */
export function AdminCard({
  children,
  className,
  noPadding,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs',
        !noPadding && 'p-5 sm:p-6',
        className
      )}
    >
      {title && (
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Table wrapper ─────────────────────────────────────────────────── */
export function TableWrapper({
  children,
  className,
  tableClassName,
}: {
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
}) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className={cn('min-w-full divide-y divide-slate-100', tableClassName)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-4 py-4 text-sm text-slate-700 first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6 align-middle',
        className
      )}
    >
      {children}
    </td>
  );
}

/* ── Skeleton rows ─────────────────────────────────────────────────── */
export function TableSkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5 first:pl-5 sm:first:pl-6">
              <div
                className="h-4 rounded bg-slate-100 animate-pulse"
                style={{ width: `${60 + ((i * cols + j) % 4) * 10}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Empty state ───────────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-slate-100 p-4">
          <Icon className="h-7 w-7 text-slate-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Error banner ──────────────────────────────────────────────────── */
export function ErrorBanner({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-4">
      <div className="shrink-0 text-red-600 mt-0.5">⚠</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {retrying ? 'Chargement…' : 'Réessayer'}
        </button>
      )}
    </div>
  );
}

/* ── Alert ─────────────────────────────────────────────────────────── */
export function Alert({
  variant,
  title,
  children,
  action,
}: {
  variant: 'warning' | 'info' | 'success' | 'error';
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const styles = {
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  };
  return (
    <div
      className={cn(
        'rounded-xl border px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        styles[variant]
      )}
    >
      <div>
        {title && <p className="font-semibold text-sm">{title}</p>}
        <p className="text-sm">{children}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────────────────── */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
      <p className="text-xs text-slate-500 font-medium">
        {total === 0 ? '0 résultat' : `${from}–${to} sur ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 0}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Précédent
        </button>
        <span className="text-xs text-slate-500 tabular-nums">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= pageCount - 1}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

/* ── Btn ───────────────────────────────────────────────────────────── */
export function Btn({
  variant = 'secondary',
  size = 'md',
  children,
  className,
  loading = false,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
  loading?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:
      'bg-[#E63946] text-white hover:bg-[#C92F3B] focus-visible:ring-[#E63946]/50 shadow-sm',
    secondary:
      'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400/50',
    outline:
      'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400/50',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/50 shadow-sm',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/50',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ── Search input ──────────────────────────────────────────────────── */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Rechercher…'}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20"
      />
    </div>
  );
}

/* ── Select filter ─────────────────────────────────────────────────── */
export function SelectFilter({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/20 cursor-pointer',
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── Price display ─────────────────────────────────────────────────── */
export function Price({
  value,
  size = 'md',
  muted,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
}) {
  const formatted = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  const sizes = { sm: 'text-xs', md: 'text-sm font-semibold', lg: 'text-2xl font-bold' };
  return (
    <span className={cn(sizes[size], muted ? 'text-slate-500' : 'text-slate-900 tabular-nums')}>
      {formatted} <span className="text-slate-400 font-normal">DH</span>
    </span>
  );
}
