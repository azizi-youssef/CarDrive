'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Comportement commun des boîtes de dialogue modales (WCAG 2.2 — 2.1.2, 2.4.3, 2.4.11) :
 * - focus initial dans le dialogue (`[data-autofocus]`, sinon premier élément focalisable, sinon le dialogue) ;
 * - Tab / Maj+Tab restent dans le dialogue, même si le focus en était sorti (clic sur une zone neutre) ;
 * - Échap ferme uniquement le dialogue au premier plan ;
 * - le reste de la page devient `inert` (ni clavier, ni lecteur d'écran) ;
 * - défilement de la page bloqué tant qu'au moins un dialogue est ouvert ;
 * - à la fermeture, le focus revient sur l'élément qui a ouvert le dialogue.
 *
 * `onClose` est lu via une référence : un parent qui se ré-affiche (temps réel, saisie)
 * ne relance pas l'effet et ne déplace donc jamais le focus pendant la saisie.
 */

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const NEVER_INERT_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'META', 'NOSCRIPT']);

export interface ModalDialogOptions {
  /** Appelé sur Échap (et seulement si le dialogue est au premier plan). Absent : Échap sans effet. */
  onClose?: () => void;
  /** Bloque la fermeture par Échap (envoi en cours, par exemple). */
  closeDisabled?: boolean;
  /**
   * Élément à refocaliser à la fermeture. Par défaut : l'élément actif à l'ouverture
   * (Safari ne donne pas le focus à un bouton cliqué : préciser l'élément d'ouverture dans ce cas).
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

interface DialogEntry {
  element: HTMLElement;
}

// Pile des dialogues ouverts : seul le dernier réagit au clavier
const openDialogs: DialogEntry[] = [];
let savedBodyOverflow: string | null = null;

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.closest('[inert]')) return false;
  // Navigateurs : exclut les éléments masqués par un ancêtre (display:none, visibility:hidden).
  // jsdom ne calcule pas la mise en page : seuls les éléments explicitement masqués sont exclus.
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ checkVisibilityCSS: true });
  }
  return true;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

/** Rend inerte tout ce qui n'est pas sur le chemin du dialogue ; renvoie la fonction de restauration. */
export function inertOutside(target: HTMLElement): () => void {
  const touched: HTMLElement[] = [];
  let node: HTMLElement = target;
  while (node.parentElement && node !== document.body) {
    const parent: HTMLElement = node.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement)) continue;
      if (NEVER_INERT_TAGS.has(sibling.tagName) || sibling.hasAttribute('inert')) continue;
      // Annonces globales (route, notifications) et fond cliquable du dialogue laissés actifs
      if (sibling.hasAttribute('aria-live') || sibling.tagName === 'NEXT-ROUTE-ANNOUNCER') continue;
      if (sibling.hasAttribute('data-modal-backdrop')) continue;
      sibling.setAttribute('inert', '');
      touched.push(sibling);
    }
    node = parent;
  }
  return () => {
    for (const element of touched) element.removeAttribute('inert');
  };
}

function focusInitial(dialog: HTMLElement) {
  const preferred = dialog.querySelector<HTMLElement>('[data-autofocus]');
  const target = preferred ?? getFocusableElements(dialog)[0] ?? dialog;
  if (target === dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: target === dialog });
}

export function useModalDialog<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  options: ModalDialogOptions = {}
): RefObject<T | null> {
  const dialogRef = useRef<T | null>(null);
  const optionsRef = useRef(options);

  // Dernière version des options, sans relancer l'effet d'ouverture
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const active = document.activeElement;
    const opener =
      optionsRef.current.returnFocusRef?.current ??
      (active instanceof HTMLElement && active !== document.body ? active : null);
    const entry: DialogEntry = { element: dialog };
    openDialogs.push(entry);

    if (openDialogs.length === 1) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const restoreInert = inertOutside(dialog);
    const isTopMost = () => openDialogs[openDialogs.length - 1] === entry;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopMost() || event.defaultPrevented) return;

      if (event.key === 'Escape') {
        const { onClose, closeDisabled } = optionsRef.current;
        if (!onClose || closeDisabled) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(dialog);
      const active = document.activeElement;
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const outside = !(active instanceof Node) || !dialog.contains(active) || active === dialog;
      if (event.shiftKey && (outside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => {
      if (!dialog.contains(document.activeElement)) focusInitial(dialog);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      restoreInert();
      const index = openDialogs.indexOf(entry);
      if (index !== -1) openDialogs.splice(index, 1);
      if (openDialogs.length === 0 && savedBodyOverflow !== null) {
        document.body.style.overflow = savedBodyOverflow;
        savedBodyOverflow = null;
      }
      // Retour du focus à l'élément d'origine, sauf si l'utilisateur l'a placé ailleurs entre-temps
      const active = document.activeElement;
      const focusLost = !active || active === document.body || dialog.contains(active);
      if (focusLost && opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return dialogRef;
}
