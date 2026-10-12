'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { verifyAdminPortalLogin, verifyAgencyPortalLogin } from '@/lib/auth/login-guard';
import {
  LOGIN_PATH,
  canPortalAccessRedirect,
  isSafeRedirect,
  loginUrl,
  parseLoginPortal,
  portalForRole,
  PORTAL_DEFAULT_REDIRECT,
  type LoginPortal,
} from '@/lib/auth/login-portals';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { USER_ROLES } from '@cardrive/shared';

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

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

type FieldErrors = { name?: string; email?: string; password?: string; passwordConfirmation?: string };
type LoginStatus = 'idle' | 'submitting' | 'resetting' | 'success';

const PORTAL_LABEL: Record<LoginPortal, string> = {
  client: 'Client',
  agency: 'Agence',
  admin: 'Admin',
};

const PORTAL_COPY: Record<
  LoginPortal,
  {
    plateTag: string;
    eyebrow: string;
    title: string;
    titleAccent: string;
    copy: string;
    accessLabel: string;
    formSubtitle: string;
    emailPlaceholder: string;
    emailLabel: string;
    trust: string;
    help: string;
    submitLabel: string;
  }
> = {
  client: {
    plateTag: 'Client',
    eyebrow: 'Espace client',
    title: 'Vos trajets,',
    titleAccent: 'vos réservations.',
    copy: 'Retrouvez vos demandes, devis PDF et l’historique de vos locations à Nador.',
    accessLabel: 'Espace client',
    formSubtitle: 'Connectez-vous pour synchroniser vos réservations et favoris.',
    emailPlaceholder: 'vous@example.com',
    emailLabel: 'Adresse e-mail',
    trust: 'Connexion sécurisée. Google disponible pour les clients.',
    help: 'Utilisez « Mot de passe oublié » ou contactez CarDrive si vous ne retrouvez pas votre compte.',
    submitLabel: 'Se connecter',
  },
  agency: {
    plateTag: 'Agence',
    eyebrow: 'Portail partenaire',
    title: 'Votre flotte,',
    titleAccent: 'sous contrôle.',
    copy: 'Gérez véhicules, tarifs et réservations depuis un seul tableau de bord.',
    accessLabel: 'Portail agence',
    formSubtitle: 'E-mail professionnel pour accéder à votre flotte et vos réservations.',
    emailPlaceholder: 'contact@votre-agence.ma',
    emailLabel: 'E-mail professionnel',
    trust: 'Accès réservé aux agences partenaires autorisées.',
    help: 'Mot de passe oublié ou agence non activée ? Contactez le responsable CarDrive.',
    submitLabel: 'Accéder à mon espace',
  },
  admin: {
    plateTag: 'Admin',
    eyebrow: 'Administration plateforme',
    title: 'Votre parc,',
    titleAccent: 'sous contrôle.',
    copy: 'Validez les agences, la commission et la marketplace depuis l’administration.',
    accessLabel: 'Espace administrateur',
    formSubtitle: 'Connectez-vous pour gérer la plateforme CarDrive.',
    emailPlaceholder: 'admin@cardrive.ma',
    emailLabel: 'Adresse e-mail',
    trust: 'Accès réservé aux administrateurs autorisés.',
    help: 'Contactez le responsable CarDrive pour vérifier votre compte ou réinitialiser votre mot de passe.',
    submitLabel: 'Se connecter',
  },
};

const PORTAL_FEATURES: Record<LoginPortal, { icon: React.ComponentType<{ className?: string }>; label: string }[]> = {
  client: [
    { icon: CarFront, label: 'Locations' },
    { icon: UserRound, label: 'Profil' },
    { icon: Calendar, label: 'Historique' },
  ],
  agency: [
    { icon: CarFront, label: 'Flotte' },
    { icon: Building2, label: 'Agence' },
    { icon: Calendar, label: 'Réservations' },
  ],
  admin: [
    { icon: CarFront, label: 'Annonces' },
    { icon: UsersRound, label: 'Agences' },
    { icon: MessageSquare, label: 'Demandes' },
  ],
};

const URL_ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Vous n’avez pas accès à cet espace avec ce compte.',
  auth_failed: 'La connexion a échoué ou a été annulée. Réessayez.',
};

const loginStyles = `
  .cd-login {
    --cd-bg: #0d1016;
    --cd-field: #181d26;
    --cd-text: #f6f7f9;
    --cd-muted: #a6adbb;
    --cd-line: rgba(255,255,255,.12);
    --cd-accent: #ff6673;
    --cd-button: #d12e40;
    color-scheme: dark;
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
    min-height: 100vh;
    min-height: 100svh;
    width: 100%;
    background: var(--cd-bg);
    color: var(--cd-text);
    font-family: var(--font-body), Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .cd-login, .cd-login * { box-sizing: border-box; }
  .cd-login h1, .cd-login h2, .cd-login p { margin: 0; }
  .cd-login a { color: inherit; text-decoration: none; }
  .cd-login button, .cd-login input { font: inherit; }
  .cd-login button { cursor: pointer; }
  .cd-login svg { display: block; flex-shrink: 0; }
  .cd-login :is(a, button, summary):focus-visible {
    outline: 2px solid var(--cd-accent);
    outline-offset: 5px;
  }
  .cd-brand {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: clamp(32px, 4vw, 64px);
    border-right: 1px solid var(--cd-line);
    background:
      radial-gradient(ellipse at 100% 0%, rgba(168,31,47,.36), transparent 63%),
      linear-gradient(155deg, #18171c, #11141b 62%);
  }
  .cd-brand::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: linear-gradient(to bottom, transparent 10%, #000);
    pointer-events: none;
  }
  .cd-brand-top { display: flex; align-items: center; justify-content: center; gap: 20px; }
  .cd-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: transparent;
  }
  .cd-logo img {
    display: block;
    width: 400px;
    max-width: 100%;
    height: auto;
  }
  .cd-road-art {
    position: absolute;
    z-index: -1;
    right: -105px;
    bottom: -100px;
    width: min(920px, 145%);
    height: auto;
    pointer-events: none;
  }
  .cd-hero {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    padding: 78px 0 88px;
  }
  .cd-eyebrow {
    display: flex;
    align-items: center;
    gap: 11px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    line-height: 1.6;
    text-transform: uppercase;
    color: #c9bac0;
  }
  .cd-eyebrow::before {
    content: '';
    width: 25px;
    height: 2px;
    background: var(--cd-accent);
  }
  .cd-hero h2 {
    margin-top: 25px;
    max-width: 570px;
    font-family: var(--font-display), Arial, sans-serif;
    font-size: clamp(48px, 4.55vw, 76px);
    line-height: 1.04;
    font-weight: 800;
    letter-spacing: -.055em;
  }
  .cd-hero h2 span { color: var(--cd-accent); }
  .cd-hero-copy {
    max-width: 355px;
    margin-top: 26px !important;
    color: #b4b7c2;
    font-size: 16px;
    line-height: 1.75;
  }
  .cd-features {
    display: flex;
    flex-wrap: wrap;
    gap: 18px 25px;
    margin-top: 36px;
    color: #d2d4dc;
    font-size: 12px;
  }
  .cd-feature { display: inline-flex; align-items: center; gap: 8px; }
  .cd-feature svg { width: 16px; height: 16px; color: var(--cd-accent); }
  .cd-brand-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 22px;
    border-top: 1px solid var(--cd-line);
    font-size: 12px;
    line-height: 1.5;
    color: var(--cd-muted);
  }
  .cd-location { display: inline-flex; align-items: center; gap: 7px; }
  .cd-location svg { width: 14px; height: 14px; }
  .cd-access {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 36px clamp(28px, 4.5vw, 76px) 26px;
    background: radial-gradient(ellipse at 50% 30%, #151923 0%, #0d1016 70%);
  }
  .cd-topbar { display: flex; justify-content: flex-end; align-items: center; gap: 18px; }
  .cd-mobile-brand { display: none; }
  .cd-back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    color: var(--cd-muted) !important;
    font-size: 12px;
    transition: color .2s ease;
  }
  .cd-back svg { width: 15px; height: 15px; transition: transform .2s ease; }
  .cd-back:hover { color: var(--cd-text) !important; }
  .cd-back:hover svg { transform: translateX(-3px); }
  .cd-form-content {
    width: 100%;
    max-width: 410px;
    margin: auto;
    padding: 50px 0 44px;
    animation: cd-enter .5s ease both;
  }
  .cd-portal-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 28px;
  }
  .cd-portal-tab {
    min-height: 44px;
    padding: 8px 6px;
    border: 1px solid var(--cd-line);
    border-radius: 10px;
    background: rgba(255,255,255,.02);
    color: var(--cd-muted);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    transition: border-color .2s, background .2s, color .2s;
  }
  .cd-portal-tab[aria-current='true'] {
    border-color: rgba(255,102,115,.45);
    background: rgba(255,102,115,.08);
    color: var(--cd-text);
  }
  .cd-portal-tab:hover:not([aria-current='true']) {
    border-color: rgba(255,255,255,.22);
    color: #e1e4eb;
  }
  .cd-form-header { margin-bottom: 24px; }
  .cd-access-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 22px;
    padding: 6px 10px;
    border: 1px solid rgba(255,102,115,.22);
    border-radius: 6px;
    background: rgba(255,102,115,.055);
    color: #ff9ca5;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.5;
  }
  .cd-access-label svg { width: 13px; height: 13px; }
  .cd-form-header h1 {
    font-family: var(--font-display), Arial, sans-serif;
    font-size: clamp(32px, 3vw, 42px);
    font-weight: 700;
    letter-spacing: -.04em;
    line-height: 1.15;
  }
  .cd-form-header p {
    margin-top: 12px;
    max-width: 350px;
    color: var(--cd-muted);
    font-size: 14px;
    line-height: 1.7;
  }
  .cd-form { display: grid; gap: 23px; }
  .cd-field label { display: block; margin-bottom: 10px; color: #e1e4eb; font-size: 13px; font-weight: 500; }
  .cd-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
  .cd-label-row label { margin-bottom: 0; }
  .cd-link-btn {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: #ff9ca5;
    font-size: 12px;
    font-weight: 500;
  }
  .cd-link-btn:hover:not(:disabled) { text-decoration: underline; }
  .cd-link-btn:disabled { cursor: not-allowed; opacity: .55; }
  .cd-input-wrap { position: relative; }
  .cd-input-icon {
    position: absolute;
    top: 50%;
    left: 17px;
    width: 18px;
    height: 18px;
    transform: translateY(-50%);
    color: #929baa;
    pointer-events: none;
    transition: color .2s ease;
  }
  .cd-input {
    display: block;
    width: 100%;
    height: 56px;
    padding: 0 16px 0 48px;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px;
    background: var(--cd-field);
    color: var(--cd-text);
    font-size: 16px !important;
    line-height: 1.5;
    outline: none;
    transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
  }
  .cd-input::placeholder { color: #939cab; opacity: 1; }
  .cd-input:hover:not(:disabled) { border-color: rgba(255,255,255,.28); }
  .cd-input:focus {
    border-color: var(--cd-accent);
    background: #1b202a;
    box-shadow: 0 0 0 4px rgba(255,102,115,.11);
  }
  .cd-input-wrap:focus-within .cd-input-icon { color: var(--cd-accent); }
  .cd-input[aria-invalid='true'] { border-color: #ff8190; }
  .cd-input:disabled { opacity: .65; cursor: not-allowed; }
  .cd-input-password { padding-right: 56px; }
  .cd-toggle-password {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--cd-muted);
  }
  .cd-toggle-password svg { width: 18px; height: 18px; }
  .cd-field-error, .cd-caps-hint { margin-top: 9px !important; font-size: 12px; line-height: 1.6; }
  .cd-field-error { color: #ff9ca5; }
  .cd-caps-hint { color: #f0c773; }
  .cd-alert, .cd-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 24px;
    padding: 13px 14px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.6;
  }
  .cd-alert { border: 1px solid rgba(255,102,115,.26); background: rgba(255,102,115,.07); color: #ffb9c0; }
  .cd-notice { border: 1px solid rgba(61,220,151,.28); background: rgba(61,220,151,.07); color: #a4f0cc; }
  .cd-alert svg, .cd-notice svg { width: 17px; height: 17px; margin-top: 2px; }
  .cd-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    min-height: 54px;
    margin-top: 3px;
    padding: 13px 18px;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px;
    background: var(--cd-button);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 5px 20px rgba(170,21,39,.14);
  }
  .cd-submit:disabled { cursor: not-allowed; opacity: .7; }
  .cd-submit[data-success='true'] { background: #24734b; }
  .cd-spinner { animation: cd-spin .8s linear infinite; }
  .cd-countdown { color: var(--cd-muted); font-size: 12px; text-align: center; }
  .cd-oauth { margin-top: 8px; display: grid; gap: 12px; }
  .cd-oauth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--cd-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .cd-oauth-divider::before, .cd-oauth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--cd-line);
  }
  .cd-join { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--cd-line); text-align: center; font-size: 13px; color: var(--cd-muted); }
  .cd-join a { color: #ff9ca5; font-weight: 600; }
  .cd-trust {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 30px;
    padding-top: 23px;
    border-top: 1px solid var(--cd-line);
    color: var(--cd-muted);
    font-size: 12px;
    line-height: 1.6;
  }
  .cd-trust svg { width: 16px; height: 16px; margin-top: 2px; color: #c0c7d3; }
  .cd-help { margin-top: 16px; color: var(--cd-muted); font-size: 12px; line-height: 1.7; }
  .cd-help summary { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; cursor: pointer; list-style: none; }
  .cd-help summary::-webkit-details-marker { display: none; }
  .cd-access-footer { color: #929baa; font-size: 11px; text-align: center; }
  .cd-skeleton { height: 56px; border: 1px solid var(--cd-line); border-radius: 10px; background: var(--cd-field); }
  .cd-skeleton-label { height: 12px; width: 94px; margin-bottom: 12px; border-radius: 3px; background: #252c39; }
  .cd-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  @keyframes cd-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cd-spin { to { transform: rotate(360deg); } }
  @media (max-width: 959px) {
    .cd-login { display: block; }
    .cd-brand { display: none; }
    .cd-access { min-height: 100svh; padding: 28px 28px 22px; }
    .cd-topbar { flex-direction: column-reverse; align-items: stretch; gap: 14px; }
    .cd-topbar .cd-back { align-self: flex-start; }
    .cd-mobile-brand { display: inline-flex; align-self: center; }
  }
  @media (max-width: 400px) {
    .cd-portal-tab { font-size: 10px; padding: 8px 4px; }
    .cd-back span { display: none; }
  }
`;

function BrandLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`cd-logo${mobile ? ' cd-mobile-brand' : ''}`}>
      <Image
        src="/Logo-CarDrive.png"
        alt="CarDrive"
        width={200}
        height={200}
        priority
      />
    </div>
  );
}

function BrandPanel({ portal }: { portal: LoginPortal }) {
  const copy = PORTAL_COPY[portal];
  const features = PORTAL_FEATURES[portal];

  return (
    <aside className="cd-brand" aria-label="CarDrive">
      <div className="cd-brand-top">
        <BrandLogo />
      </div>
      <svg className="cd-road-art" aria-hidden="true" viewBox="0 0 720 720" fill="none">
        <path d="M805 60H492c-112 0-202 90-202 202v63c0 84-68 152-152 152H-92" stroke="#e63946" strokeOpacity=".06" strokeWidth="148" />
        <path d="M805 60H492c-112 0-202 90-202 202v63c0 84-68 152-152 152H-92" stroke="#e63946" strokeOpacity=".2" strokeWidth="2" strokeDasharray="10 16" />
      </svg>
      <div className="cd-hero">
        <div className="cd-eyebrow">{copy.eyebrow}</div>
        <h2>
          {copy.title}
          <br />
          <span>{copy.titleAccent}</span>
        </h2>
        <p className="cd-hero-copy">{copy.copy}</p>
        <div className="cd-features">
          {features.map(({ icon: Icon, label }) => (
            <span key={label} className="cd-feature">
              <Icon aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="cd-brand-footer">
        <span className="cd-location">
          <MapPin aria-hidden="true" />
          Nador, Maroc
        </span>
        <span>Votre activité. Une seule interface.</span>
      </div>
    </aside>
  );
}

function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portal = parseLoginPortal(searchParams?.get('portal'));
  const isRegistration = portal === 'client' && searchParams?.get('mode') === 'signup';
  const copy = PORTAL_COPY[portal];

  const redirectParam = searchParams?.get('redirect');
  const redirectUrl = isSafeRedirect(redirectParam) && canPortalAccessRedirect(portal, redirectParam)
    ? redirectParam
    : PORTAL_DEFAULT_REDIRECT[portal];

  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmationRef = useRef<HTMLInputElement>(null);
  const requestPending = useRef(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockLeft, setLockLeft] = useState(0);

  const busy = status !== 'idle';
  const locked = lockLeft > 0;

  useEffect(() => {
    const code = searchParams?.get('error');
    if (code && URL_ERROR_MESSAGES[code]) {
      setError(URL_ERROR_MESSAGES[code]);
    }
  }, [searchParams]);

  useEffect(() => {
    if (lockUntil === null) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockLeft(remaining);
      if (remaining === 0) {
        setLockUntil(null);
        setError(null);
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [lockUntil]);

  const switchPortal = (next: LoginPortal) => {
    if (next === portal) return;
    setError(null);
    setNotice(null);
    router.replace(loginUrl(next, { redirect: isSafeRedirect(redirectParam) ? redirectParam : undefined }));
  };

  const startCooldown = () => {
    setLockLeft(LOCK_SECONDS);
    setLockUntil(Date.now() + LOCK_SECONDS * 1000);
    setAttempts(0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requestPending.current || locked) return;

    setError(null);
    setNotice(null);
    const normalizedEmail = email.trim();
    const nextErrors: FieldErrors = {};
    if (isRegistration && !fullName.trim()) nextErrors.name = 'Saisissez votre nom complet.';
    if (!normalizedEmail) nextErrors.email = 'Saisissez votre adresse e-mail.';
    else if (emailRef.current?.validity.typeMismatch) nextErrors.email = 'Adresse e-mail invalide.';
    if (!password) nextErrors.password = 'Saisissez votre mot de passe.';
    else if (isRegistration && password.length < 8) {
      nextErrors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (isRegistration && password !== passwordConfirmation) {
      nextErrors.passwordConfirmation = 'Les mots de passe ne correspondent pas.';
    }
    setFieldErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.passwordConfirmation) {
      (nextErrors.name ? nameRef : nextErrors.email ? emailRef : nextErrors.password ? passwordRef : passwordConfirmationRef).current?.focus();
      return;
    }

    requestPending.current = true;
    setStatus('submitting');
    let authenticated = false;

    try {
      if (!isSupabaseConfigured()) {
        setError('La connexion est momentanément indisponible. Contactez CarDrive.');
        return;
      }
      const supabase = createClient();
      if (!supabase) {
        setError('Service indisponible. Réessayez dans quelques instants.');
        return;
      }

      const authResult = isRegistration
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { full_name: fullName.trim() },
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account')}`,
            },
          })
        : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      const { data, error: signInError } = authResult;

      if (signInError) {
        if (signInError.status === 429) {
          startCooldown();
          setError('Trop de tentatives. Patientez avant de réessayer.');
        } else if (signInError.status !== undefined && signInError.status >= 500) {
          setError('Service indisponible. Réessayez dans quelques instants.');
        } else {
          const nextAttempts = attempts + 1;
          if (nextAttempts >= MAX_ATTEMPTS) {
            startCooldown();
            setError('Plusieurs tentatives ont échoué. Patientez avant de réessayer.');
          } else {
            setAttempts(nextAttempts);
            setError(isRegistration
              ? 'Création du compte impossible. Vérifiez les informations saisies ou connectez-vous si vous possédez déjà un compte.'
              : 'Connexion refusée. Vérifiez vos identifiants.');
          }
          setPassword('');
          window.requestAnimationFrame(() => passwordRef.current?.focus());
        }
        return;
      }

      if (!data.session || !data.user) {
        if (isRegistration && data.user) {
          setNotice('Compte créé. Consultez votre e-mail pour confirmer votre adresse avant de vous connecter.');
          return;
        }
        setError('La connexion n’a pas abouti. Réessayez.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      const role = USER_ROLES.find((candidate) => candidate === profile?.role);
      const authenticatedPortal = role ? portalForRole(role) : null;
      if (profileError || !authenticatedPortal) {
        await supabase.auth.signOut();
        setError(profileError
          ? 'Impossible de vérifier le rôle de votre compte. Réessayez.'
          : 'Ce compte ne possède pas de rôle de portail autorisé.');
        return;
      }

      if (authenticatedPortal === 'admin') {
        const portalError = await verifyAdminPortalLogin(supabase, data.user.id);
        if (portalError) {
          setError(portalError);
          setPassword('');
          return;
        }
      } else if (authenticatedPortal === 'agency') {
        const portalError = await verifyAgencyPortalLogin(supabase, data.user.id);
        if (portalError) {
          setError(portalError);
          setPassword('');
          return;
        }
      }

      setStatus('success');
      const destination = isSafeRedirect(redirectParam) &&
        canPortalAccessRedirect(authenticatedPortal, redirectParam)
        ? redirectParam
        : PORTAL_DEFAULT_REDIRECT[authenticatedPortal];
      router.replace(destination);
      router.refresh();
      authenticated = true;
    } catch {
      setError(isRegistration
        ? 'Création du compte impossible. Vérifiez votre réseau et réessayez.'
        : 'Connexion impossible. Vérifiez votre réseau.');
    } finally {
      if (!authenticated) {
        requestPending.current = false;
        setStatus('idle');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (requestPending.current || locked || portal === 'admin') return;
    setError(null);
    setNotice(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail || emailRef.current?.validity.typeMismatch) {
      setFieldErrors((c) => ({ ...c, email: 'Saisissez votre e-mail pour recevoir le lien.' }));
      emailRef.current?.focus();
      return;
    }

    requestPending.current = true;
    setStatus('resetting');
    try {
      const supabase = createClient();
      if (!supabase || !isSupabaseConfigured()) {
        setError('Réinitialisation indisponible pour le moment.');
        return;
      }
      const resetReturn = loginUrl(portal);
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(resetReturn)}`,
      });
      setNotice('Si un compte existe pour cet e-mail, un lien de réinitialisation vient d’être envoyé.');
    } catch {
      setError('Envoi impossible. Réessayez.');
    } finally {
      requestPending.current = false;
      setStatus('idle');
    }
  };

  const AccessIcon = portal === 'agency' ? Building2 : portal === 'admin' ? LockKeyhole : UserRound;

  return (
    <main lang="fr" className={`${displayFont.variable} ${bodyFont.variable} cd-login`}>
      <style>{loginStyles}</style>
      <BrandPanel portal={portal} />
      <section className="cd-access" aria-label="Connexion CarDrive">
        <div className="cd-topbar">
          <BrandLogo mobile />
          <Link href="/" className="cd-back">
            <ArrowLeft aria-hidden="true" />
            <span>Retour au site</span>
          </Link>
        </div>

        <div className="cd-form-content">
          <div className="cd-portal-tabs" role="tablist" aria-label="Type de compte">
            {(['client', 'agency', 'admin'] as LoginPortal[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-current={p === portal ? 'true' : undefined}
                className="cd-portal-tab"
                onClick={() => switchPortal(p)}
                disabled={busy}
              >
                {PORTAL_LABEL[p]}
              </button>
            ))}
          </div>

          <header className="cd-form-header">
            <div className="cd-access-label">
              <AccessIcon aria-hidden="true" />
              {copy.accessLabel}
            </div>
            <h1>{isRegistration ? 'Créer un compte client' : 'Connexion'}</h1>
            <p>{isRegistration ? 'Créez votre espace pour suivre vos demandes et réservations.' : copy.formSubtitle}</p>
          </header>

          {error && (
            <div role="alert" className="cd-alert">
              <AlertCircle aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}
          {notice && (
            <div role="status" className="cd-notice">
              <CheckCircle2 aria-hidden="true" />
              <p>{notice}</p>
            </div>
          )}

          <form className="cd-form" noValidate onSubmit={handleSubmit} aria-busy={busy}>
            {isRegistration && (
              <div className="cd-field">
                <label htmlFor="cd-login-name">Nom complet</label>
                <div className="cd-input-wrap">
                  <UserRound aria-hidden="true" className="cd-input-icon" />
                  <input
                    ref={nameRef}
                    id="cd-login-name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setFieldErrors((current) => ({ ...current, name: undefined }));
                    }}
                    placeholder="Votre nom"
                    disabled={busy}
                    aria-invalid={Boolean(fieldErrors.name)}
                    className="cd-input"
                  />
                </div>
                {fieldErrors.name && <p className="cd-field-error">{fieldErrors.name}</p>}
              </div>
            )}
            <div className="cd-field">
              <label htmlFor="cd-login-email">{copy.emailLabel}</label>
              <div className="cd-input-wrap">
                <Mail aria-hidden="true" className="cd-input-icon" />
                <input
                  ref={emailRef}
                  id="cd-login-email"
                  type="email"
                  autoComplete={isRegistration ? 'email' : 'username'}
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((c) => ({ ...c, email: undefined }));
                  }}
                  placeholder={copy.emailPlaceholder}
                  disabled={busy}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className="cd-input"
                />
              </div>
              {fieldErrors.email && <p className="cd-field-error">{fieldErrors.email}</p>}
            </div>

            <div className="cd-field">
              {portal !== 'admin' ? (
                <div className="cd-label-row">
                  <label htmlFor="cd-login-password">Mot de passe</label>
                  <button type="button" className="cd-link-btn" onClick={handleForgotPassword} disabled={busy || locked}>
                    {status === 'resetting' ? 'Envoi…' : 'Mot de passe oublié ?'}
                  </button>
                </div>
              ) : (
                <label htmlFor="cd-login-password">Mot de passe</label>
              )}
              <div className="cd-input-wrap">
                <LockKeyhole aria-hidden="true" className="cd-input-icon" />
                <input
                  ref={passwordRef}
                  id="cd-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegistration ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((c) => ({ ...c, password: undefined }));
                  }}
                  onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  placeholder="Votre mot de passe"
                  disabled={busy}
                  className="cd-input cd-input-password"
                />
                <button
                  type="button"
                  className="cd-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={busy}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && <p className="cd-field-error">{fieldErrors.password}</p>}
              {capsLock && <p className="cd-caps-hint">Verrouillage majuscules activé.</p>}
            </div>
            {isRegistration && (
              <div className="cd-field">
                <label htmlFor="cd-password-confirmation">Confirmer le mot de passe</label>
                <div className="cd-input-wrap">
                  <LockKeyhole aria-hidden="true" className="cd-input-icon" />
                  <input
                    ref={passwordConfirmationRef}
                    id="cd-password-confirmation"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={passwordConfirmation}
                    onChange={(event) => {
                      setPasswordConfirmation(event.target.value);
                      setFieldErrors((current) => ({ ...current, passwordConfirmation: undefined }));
                    }}
                    placeholder="Confirmez votre mot de passe"
                    disabled={busy}
                    aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
                    className="cd-input"
                  />
                </div>
                {fieldErrors.passwordConfirmation && <p className="cd-field-error">{fieldErrors.passwordConfirmation}</p>}
              </div>
            )}

            <button type="submit" className="cd-submit" disabled={busy || locked} data-success={status === 'success'}>
              {status === 'submitting' ? (
                <>
                  <Loader2 className="cd-spinner" aria-hidden="true" />
                  {isRegistration ? 'Création…' : 'Connexion…'}
                </>
              ) : status === 'success' ? (
                <>
                  <Check aria-hidden="true" />
                  {isRegistration ? 'Compte créé' : 'Connexion réussie'}
                </>
              ) : locked ? (
                <>Réessayer dans {lockLeft} s</>
              ) : (
                <>
                  {isRegistration ? 'Créer mon compte' : copy.submitLabel}
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
            {locked && <p className="cd-countdown">Patientez avant une nouvelle tentative.</p>}
          </form>

          {portal === 'client' && (
            <p className="cd-join">
              {isRegistration ? 'Vous avez déjà un compte ? ' : 'Nouveau sur CarDrive ? '}
              <Link href={isRegistration ? loginUrl('client') : `${LOGIN_PATH}?portal=client&mode=signup`}>
                {isRegistration ? 'Se connecter' : 'Créer un compte'}
              </Link>
            </p>
          )}

          {portal === 'client' && (
            <div className="cd-oauth">
              <div className="cd-oauth-divider">ou</div>
              <GoogleSignInButton variant="dark" next={redirectUrl} label="Continuer avec Google" />
            </div>
          )}

          {portal === 'agency' && (
            <p className="cd-join">
              Pas encore partenaire ? <Link href="/agency/join">Rejoindre le réseau</Link>
            </p>
          )}

          <div className="cd-trust">
            <ShieldCheck aria-hidden="true" />
            <p>{copy.trust}</p>
          </div>
          <details className="cd-help">
            <summary>
              Un problème d’accès ?
              <ChevronDown aria-hidden="true" />
            </summary>
            <p>{copy.help}</p>
          </details>
        </div>

        <p className="cd-access-footer">© {new Date().getFullYear()} CarDrive · Nador, Maroc</p>
      </section>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className={`${displayFont.variable} ${bodyFont.variable} cd-login`}>
      <style>{loginStyles}</style>
      <div className="cd-access" style={{ gridColumn: '1 / -1', minHeight: '100svh' }}>
        <div className="cd-form-content">
          <div className="cd-skeleton-label" />
          <div className="cd-skeleton" />
        </div>
      </div>
    </main>
  );
}

export default function UnifiedPortalLogin() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PortalLoginForm />
    </Suspense>
  );
}
