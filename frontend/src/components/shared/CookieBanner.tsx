'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X, Check, Settings } from 'lucide-react';

const STORAGE_KEY = 'cardrive_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    if (stored === 'accepted' || stored === 'declined') {
      setConsent(stored);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setConsent('accepted');
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setConsent('declined');
  }

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Consentement aux cookies"
      className="fixed bottom-4 left-4 right-4 z-100 md:bottom-6 md:left-auto md:right-6 md:max-w-md"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 bg-[#0B1220] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Cookie className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-sm font-bold text-white">Paramètres des cookies</p>
          </div>
          <button
            onClick={decline}
            aria-label="Refuser et fermer"
            className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Nous utilisons des cookies essentiels au fonctionnement du site et, avec votre
            accord, des cookies analytiques pour améliorer votre expérience.
          </p>

          {showDetails && (
            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {[
                { name: '🔒 Cookies essentiels', desc: 'Session, authentification. Toujours actifs.', always: true },
                { name: '📊 Cookies analytiques', desc: 'Mesure d\'audience anonymisée pour améliorer le service.', always: false },
              ].map(({ name, desc, always }) => (
                <div key={name} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{name}</p>
                    <p className="text-[11px] text-slate-500">{desc}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${always ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {always ? 'Requis' : 'Optionnel'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-700"
          >
            <Settings className="h-3.5 w-3.5" />
            {showDetails ? 'Masquer les détails' : 'Voir les détails'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
          <button
            id="cookie-accept"
            onClick={accept}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B1220] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Check className="h-4 w-4" />
            Accepter
          </button>
          <button
            id="cookie-decline"
            onClick={decline}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Refuser
          </button>
        </div>

        {/* Privacy link */}
        <div className="border-t border-slate-100 px-5 py-2 text-center">
          <Link
            href="/confidentialite"
            className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline transition"
          >
            Politique de Confidentialité
          </Link>
          {' · '}
          <Link
            href="/mentions-legales"
            className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline transition"
          >
            Mentions Légales
          </Link>
        </div>
      </div>
    </div>
  );
}
