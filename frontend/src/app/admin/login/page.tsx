'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import {
  createClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client';

/* =========================================================
   FONTS
========================================================= */

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

/* =========================================================
   CONSTANTES & HELPERS
========================================================= */

const DEFAULT_REDIRECT = '/admin';
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

/**
 * Sécurité : seuls les chemins internes sont autorisés.
 * Refuse : https://evil.com, //evil.com, /\evil.com, caractères de contrôle.
 */
function isSafeRedirect(value: string | null): value is string {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.includes('\\')) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;
  return true;
}

/* =========================================================
   MARQUE : plaque d'immatriculation
========================================================= */

function PlateMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-stretch overflow-hidden rounded-[10px] bg-white text-[#0B0E13] shadow-[0_6px_20px_rgba(0,0,0,0.28)] ring-1 ring-black/15 ${className}`}
    >
      <span className="m-[3px] flex items-center rounded-[7px] border-2 border-[#0B0E13] px-3.5 py-1 font-[family-name:var(--font-display)] text-[22px] font-extrabold leading-none tracking-[-0.03em]">
        CarDrive
      </span>
      <span className="flex items-center bg-[#0B0E13] px-3 text-[11px] font-semibold text-white">
        Admin
      </span>
    </div>
  );
}

/* =========================================================
   PANNEAU VISUEL (desktop)
========================================================= */

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#E63946] lg:flex lg:w-[46%] xl:w-1/2">
      {/* Route en perspective */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 640"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="cd-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E63946" stopOpacity="1" />
            <stop offset="0.45" stopColor="#E63946" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Bitume */}
        <path d="M-120 640 L300 120 L720 640 Z" fill="#0B0E13" />
        {/* Bas-côtés */}
        <path
          d="M-120 640 L300 120"
          stroke="#FFFFFF"
          strokeWidth="5"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M720 640 L300 120"
          stroke="#FFFFFF"
          strokeWidth="5"
          fill="none"
          opacity="0.9"
        />
        {/* Ligne centrale */}
        <path
          className="cd-road"
          d="M300 640 L300 120"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeDasharray="34 26"
          fill="none"
        />
        {/* Fondu vers l'horizon */}
        <rect x="0" y="0" width="600" height="640" fill="url(#cd-fade)" />
      </svg>

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <PlateMark />

        <div className="max-w-md">
          <h2 className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] text-white xl:text-6xl">
            Votre parc,
            <br />
            sous contrôle.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-6 text-[#1A0507]">
            Annonces, vendeurs et demandes clients, depuis un seul espace.
          </p>
        </div>

        <p className="text-xs text-[#1A0507]">Nador, Maroc</p>
      </div>
    </aside>
  );
}

/* =========================================================
   FORMULAIRE
========================================================= */

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get('redirect');
  const redirectUrl = isSafeRedirect(redirectParam)
    ? redirectParam
    : DEFAULT_REDIRECT;

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);

  const locked = lockLeft > 0;

  /* Compte à rebours après trop d'échecs */
  useEffect(() => {
    if (lockLeft <= 0) return;
    const timer = window.setInterval(() => {
      setLockLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockLeft]);

  const clearError = () => {
    if (error) setError(null);
  };

  const handleCapsLock = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    setCapsLock(event.getModifierState('CapsLock'));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading || locked) return;

    setError(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Saisissez votre adresse e-mail.');
      emailRef.current?.focus();
      return;
    }

    if (!password) {
      setError('Saisissez votre mot de passe.');
      passwordRef.current?.focus();
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        "L'authentification n'est pas configurée. Contactez le responsable technique.",
      );
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setError(
        "Le service d'authentification est momentanément indisponible. Réessayez dans quelques instants.",
      );
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) {
        if (signInError.status === 429) {
          setError(
            'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
          );
        } else {
          const nextAttempts = attempts + 1;
          setAttempts(nextAttempts);

          if (nextAttempts >= MAX_ATTEMPTS) {
            setAttempts(0);
            setLockLeft(LOCK_SECONDS);
            setError(
              'Trop d’échecs consécutifs. Le formulaire est verrouillé temporairement.',
            );
          } else {
            setError('Adresse e-mail ou mot de passe incorrect.');
          }
        }

        setPassword('');
        setLoading(false);
        passwordRef.current?.focus();
        return;
      }

      router.replace(redirectUrl);
      router.refresh();
    } catch {
      setError(
        'Connexion impossible pour le moment. Vérifiez votre réseau et réessayez.',
      );
      setLoading(false);
    }
  };

  const inputBase =
    'h-12 w-full rounded-lg border border-white/10 bg-white/[0.035] px-4 text-[15px] text-white outline-none transition-colors placeholder:text-slate-600 hover:border-white/20 focus:border-[#E63946] focus:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-[#E63946]/40 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} flex min-h-screen bg-[#0B0E13] font-[family-name:var(--font-body)] text-white`}
    >
      <style>{`
        @keyframes cd-road { to { stroke-dashoffset: -120; } }
        .cd-road { animation: cd-road 2.6s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cd-road { animation: none; }
        }
      `}</style>

      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Marque (mobile) */}
          <div className="mb-10 lg:hidden">
            <PlateMark />
          </div>

          <header className="mb-8">
            <h1 className="font-[family-name:var(--font-display)] text-[34px] font-extrabold leading-tight tracking-[-0.035em]">
              Connexion
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-slate-400">
              Utilisez votre compte administrateur CarDrive.
            </p>
          </header>

          {/* Erreur */}
          <div aria-live="polite" className="empty:hidden">
            {error && (
              <div
                role="alert"
                id="login-error"
                className="mb-6 flex items-start gap-3 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3.5"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-300"
                />
                <p className="text-sm leading-5 text-red-200">{error}</p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
            aria-describedby={error ? 'login-error' : undefined}
          >
            {/* E-mail */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Adresse e-mail
              </label>

              <input
                ref={emailRef}
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearError();
                }}
                placeholder="admin@cardrive.ma"
                disabled={loading}
                className={inputBase}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Mot de passe
              </label>

              <div className="relative">
                <input
                  ref={passwordRef}
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearError();
                  }}
                  onKeyDown={handleCapsLock}
                  onKeyUp={handleCapsLock}
                  onBlur={() => setCapsLock(false)}
                  placeholder="Votre mot de passe"
                  disabled={loading}
                  aria-describedby={capsLock ? 'caps-hint' : undefined}
                  className={`${inputBase} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 outline-none transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-[#E63946]/50 disabled:pointer-events-none"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>

              {capsLock && (
                <p
                  id="caps-hint"
                  className="mt-2 text-[13px] text-amber-300"
                >
                  Le verrouillage majuscules est activé.
                </p>
              )}
            </div>

            {/* Envoi */}
            <button
              type="submit"
              disabled={loading || locked}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#E63946] px-4 text-[15px] font-semibold text-white outline-none transition-colors hover:bg-[#D32F3C] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E13] active:bg-[#BF2935] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  <span>Connexion en cours</span>
                </>
              ) : locked ? (
                <span>Réessayer dans {lockLeft} s</span>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          {/* Pied */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="flex items-start gap-2.5 text-[13px] leading-5 text-slate-500">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
              />
              Accès réservé aux administrateurs autorisés.
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-400 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#E63946]/50"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Retour au site
            </Link>
          </div>

          <p className="mt-8 text-xs text-slate-600 lg:hidden">
            © {new Date().getFullYear()} CarDrive · Nador, Maroc
          </p>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   FALLBACK DE CHARGEMENT
========================================================= */

function AdminLoginFallback() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-[#0B0E13] text-slate-400"
    >
      <div className="flex items-center gap-3 text-sm">
        <Loader2
          aria-hidden="true"
          className="h-4 w-4 animate-spin text-[#E63946]"
        />
        Chargement
      </div>
    </main>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}