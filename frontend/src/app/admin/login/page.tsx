
'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  createClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get('redirect');

  // Évite les redirections externes de type:
  // /admin/login?redirect=https://example.com
  const redirectUrl =
    redirectParam && redirectParam.startsWith('/')
      ? redirectParam
      : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    // Ne jamais simuler une authentification admin.
    if (!isSupabaseConfigured()) {
      setError(
        "L'authentification administrateur n'est pas configurée. Contactez le responsable technique."
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setError(
        "Le service d'authentification est momentanément indisponible."
      );
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(
          'Adresse e-mail ou mot de passe incorrect.'
        );
        setLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError(
        "Impossible de se connecter pour le moment. Veuillez réessayer."
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B12] px-4 py-12 text-white sm:px-6">
      {/* ─────────────────────────────────────────────
          BACKGROUND
      ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Red glow */}
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E63946]/8 blur-[120px]" />

        {/* Secondary glow */}
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/[0.025] blur-3xl" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* ─────────────────────────────────────────
            BRAND / HEADER
        ───────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E63946]/20 bg-[#E63946]/10 text-[#E63946] shadow-lg shadow-[#E63946]/5">
            <KeyRound className="h-7 w-7" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              CarDrive
            </h1>

            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Espace d'administration de la marketplace
          </p>
        </div>

        {/* ─────────────────────────────────────────
            LOGIN CARD
        ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0D131D]/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {/* Card top accent */}
          <div className="h-1 bg-gradient-to-r from-[#E63946] via-[#E63946]/70 to-transparent" />

          <div className="p-6 sm:p-8">
            {/* Security label */}
            <div className="mb-7 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldAlert className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Zone sécurisée
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Accès réservé aux administrateurs autorisés
                </p>
              </div>

              <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                <p className="leading-5">
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Adresse e-mail
                </label>

                <div className="group relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#E63946]"
                  />

                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="admin@cardrive.ma"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-[#070B12] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-[#E63946]/60 focus:ring-2 focus:ring-[#E63946]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    Mot de passe
                  </label>
                </div>

                <div className="group relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-[#E63946]"
                  />

                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-[#070B12] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-[#E63946]/60 focus:ring-2 focus:ring-[#E63946]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 disabled:pointer-events-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#E63946] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E63946]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C92F3B] hover:shadow-xl hover:shadow-[#E63946]/20 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authentification...
                  </>
                ) : (
                  <>
                    Ouvrir le panneau administrateur
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Back */}
            <div className="mt-7 border-t border-white/5 pt-6 text-center">
              <Link
                href="/"
                className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
              >
                ← Retour au site public CarDrive
              </Link>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────
            SECURITY FOOTER
        ───────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-600">
          <Lock className="h-3.5 w-3.5 shrink-0" />

          <span>
            Accès protégé par authentification sécurisée
          </span>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-700">
          CarDrive · Administration Platform
        </p>
      </div>
    </div>
  );
}

function AdminLoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B12] text-slate-400">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-[#E63946]" />
        Chargement...
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}
