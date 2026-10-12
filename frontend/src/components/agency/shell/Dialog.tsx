'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { button } from '@/lib/design/tokens';

/**
 * Comportements communs aux boîtes de dialogue :
 * verrouillage du défilement, fermeture par Échap et piège à focus.
 */
function useDialogBehaviour(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    const timer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        )
        ?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  return panelRef;
}

function Backdrop({ children, labelledBy }: { children: ReactNode; labelledBy: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="w-full">
        {children}
      </div>
    </div>
  );
}

/** Boîte de dialogue générique (détail, formulaire). */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const panelRef = useDialogBehaviour(true, onClose);

  return (
    <Backdrop labelledBy={titleId}>
      <div
        ref={panelRef}
        className={cn(
          'mx-auto max-h-[92vh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-[#0F172A]">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-[#64748B]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </Backdrop>
  );
}

/** Confirmation explicite avant toute action destructive ou irreversible. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  destructive = false,
  busy = false,
  reason,
  onReasonChange,
  reasonLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  reason?: string;
  onReasonChange?: (value: string) => void;
  reasonLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panelRef = useDialogBehaviour(true, onCancel);
  const requiresReason = Boolean(onReasonChange);
  const blocked = busy || (requiresReason && !reason?.trim());

  return (
    <Backdrop labelledBy={titleId}>
      <div
        ref={panelRef}
        className="mx-auto max-w-md rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          {destructive && (
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-[#0F172A]">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-[#64748B]">{message}</p>
          </div>
        </div>

        {onReasonChange && (
          <div className="mt-4">
            <label
              htmlFor={`${titleId}-reason`}
              className="block text-sm font-medium text-[#0F172A]"
            >
              {reasonLabel ?? 'Motif'}
            </label>
            <textarea
              id={`${titleId}-reason`}
              value={reason ?? ''}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#E63946] focus:ring-2 focus:ring-[#E63946]/25"
            />
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={button.secondary} onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button
            type="button"
            className={destructive ? button.danger : button.primary}
            onClick={onConfirm}
            disabled={blocked}
          >
            {busy ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}
