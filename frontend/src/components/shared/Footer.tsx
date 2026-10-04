
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  MapPin,
  Mail,
  MessageCircle,
  CarFront,
  ArrowUpRight,
  Star,
  Zap,
  Clock3,
  Plane,
  Ship,
  Building2,
  Search,
  Users,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

function FooterHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
      <span className="h-1 w-4 rounded-full bg-[#E63946]" />
      {children}
    </h3>
  );
}

function FooterLink({
  href,
  children,
  highlight = false,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
  external?: boolean;
}) {
  const className = `
    group flex items-center gap-2 text-[13px] transition-all duration-200
    ${highlight
      ? 'font-semibold text-[#E63946] hover:text-red-300'
      : 'text-slate-400 hover:translate-x-0.5 hover:text-white'
    }
  `;

  const content = (
    <>
      <ChevronRight
        className={`h-3 w-3 shrink-0 transition-transform duration-200 ${highlight
            ? 'text-[#E63946]'
            : 'text-slate-600 group-hover:text-[#E63946] group-hover:translate-x-0.5'
          }`}
      />
      <span>{children}</span>
      {external && (
        <ArrowUpRight className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
      )}
    </>
  );

  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={className}>
        {content}
      </Link>
    </li>
  );
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.04] text-emerald-400 transition-colors duration-200 group-hover:border-emerald-400/20 group-hover:bg-emerald-400/10">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[12px] font-medium text-slate-200">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function LocationItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-2.5 text-[13px] text-slate-400 transition-colors duration-200 hover:text-white"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.035] text-slate-500 transition-all duration-200 group-hover:bg-[#E63946]/10 group-hover:text-[#E63946]">
          {icon}
        </span>

        <span className="flex-1">{children}</span>

        <ArrowUpRight className="h-3 w-3 text-slate-700 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#E63946] group-hover:opacity-100" />
      </Link>
    </li>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-800/70 bg-[#0B1220] text-slate-300">

      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#E63946]/[0.035] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/[0.025] blur-3xl" />
      </div>

      {/* ================================================================ */}
      {/* AGENCY CTA                                                       */}
      {/* ================================================================ */}

      <section className="relative border-b border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.055] to-white/[0.015] p-5 sm:p-6">

            {/* Accent glow */}
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#E63946]/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E63946]/20 bg-[#E63946]/10">
                  <Building2 className="h-5 w-5 text-[#E63946]" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      Vous êtes une agence de location ?
                    </h2>

                    <span className="rounded-full border border-[#E63946]/20 bg-[#E63946]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#E63946]">
                      Partenaire
                    </span>
                  </div>

                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
                    Rejoignez CarDrive et présentez vos véhicules à des
                    clients recherchant une location à Nador et dans la
                    région de l'Oriental.
                  </p>
                </div>
              </div>

              <Link
                href="/agency/join"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E63946] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-red-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C92F3B] hover:shadow-xl"
              >
                Devenir partenaire
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* MAIN FOOTER                                                      */}
      {/* ================================================================ */}

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">

          {/* ------------------------------------------------------------ */}
          {/* BRAND                                                        */}
          {/* ------------------------------------------------------------ */}

          <div className="lg:col-span-4">

            <Link
              href="/"
              aria-label="CarDrive — Accueil"
              className="inline-flex items-center"
            >
              <div className="relative h-10 w-[150px]">
                <Image
                  src="/logo_CarDrive1.png"
                  alt="CarDrive"
                  fill
                  sizes="150px"
                  className="object-contain object-left brightness-110"
                />
              </div>
            </Link>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Nador · Oriental · Maroc
              </span>
            </div>

            <p className="mt-5 max-w-md text-[13px] leading-6 text-slate-400">
              CarDrive simplifie la location de voitures à Nador en
              permettant de découvrir et comparer les véhicules proposés
              par les agences partenaires.
            </p>

            {/* Trust */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <TrustItem
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Partenaires vérifiés"
                description="Des agences locales référencées."
              />

              <TrustItem
                icon={<Star className="h-4 w-4" />}
                title="Prix transparents"
                description="Des informations claires avant réservation."
              />

              <TrustItem
                icon={<Zap className="h-4 w-4" />}
                title="Réservation directe"
                description="Contactez directement le partenaire."
              />

              <TrustItem
                icon={<Clock3 className="h-4 w-4" />}
                title="Disponibilité"
                description="Informations actualisées par les agences."
              />
            </div>

            {/* Contact */}
            <div className="mt-7 border-t border-slate-800/70 pt-5">

              <a
                href="https://wa.me/212661987654?text=Bonjour%20CarDrive%2C%20je%20souhaite%20louer%20un%20v%C3%A9hicule%20%C3%A0%20Nador"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <span>Support WhatsApp</span>
                <ArrowUpRight className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5" />
              </a>

              <a
                href="mailto:contact@cardrive.ma"
                className="group mt-2.5 flex items-center gap-2.5 text-xs text-slate-400 transition-colors hover:text-white"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                contact@cardrive.ma
              </a>

            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* LOCATIONS                                                     */}
          {/* ------------------------------------------------------------ */}

          <div className="lg:col-span-2">
            <FooterHeading>Explorer Nador</FooterHeading>

            <ul className="space-y-3">
              <LocationItem
                href="/location-voiture-nador-aeroport"
                icon={<Plane className="h-3.5 w-3.5" />}
              >
                Aéroport Nador-Al Aroui
              </LocationItem>

              <LocationItem
                href="/location-voiture-beni-ansar"
                icon={<Ship className="h-3.5 w-3.5" />}
              >
                Port de Beni Ansar
              </LocationItem>

              <LocationItem
                href="/search?location=marchica"
                icon={<MapPin className="h-3.5 w-3.5" />}
              >
                Marchica & Corniche
              </LocationItem>

              <LocationItem
                href="/search?location=centre"
                icon={<Building2 className="h-3.5 w-3.5" />}
              >
                Centre-ville
              </LocationItem>

              <LocationItem
                href="/search?location=selouane"
                icon={<MapPin className="h-3.5 w-3.5" />}
              >
                Selouane
              </LocationItem>
            </ul>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* VEHICLES                                                      */}
          {/* ------------------------------------------------------------ */}

          <div className="lg:col-span-2">
            <FooterHeading>Véhicules</FooterHeading>

            <ul className="space-y-3">
              <FooterLink href="/search?category=SUV">
                SUV & 4x4
              </FooterLink>

              <FooterLink href="/search?category=Économique">
                Économiques
              </FooterLink>

              <FooterLink href="/search?category=Berline">
                Berlines
              </FooterLink>

              <FooterLink href="/search?category=7%20places">
                7–9 places
              </FooterLink>

              <FooterLink href="/search?category=Luxe">
                Luxe & Premium
              </FooterLink>

              <FooterLink href="/search?transmission=AUTOMATIC">
                Automatiques
              </FooterLink>

              <FooterLink href="/search" highlight>
                Tous les véhicules
              </FooterLink>
            </ul>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* PLATFORM                                                      */}
          {/* ------------------------------------------------------------ */}

          <div className="lg:col-span-2">
            <FooterHeading>CarDrive</FooterHeading>

            <ul className="space-y-3">
              <FooterLink href="/agency/join" highlight>
                Devenir partenaire
              </FooterLink>

              <FooterLink href="/agencies">
                Agences partenaires
              </FooterLink>

              <FooterLink href="/agency">
                Espace agence
              </FooterLink>

              <FooterLink href="/about">
                À propos
              </FooterLink>

              <FooterLink href="/faq">
                Questions fréquentes
              </FooterLink>

              <FooterLink href="/contact">
                Nous contacter
              </FooterLink>
            </ul>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* HELP / QUICK ACTIONS                                         */}
          {/* ------------------------------------------------------------ */}

          <div className="lg:col-span-2">
            <FooterHeading>Besoin d'aide ?</FooterHeading>

            <div className="space-y-2">

              <Link
                href="/search"
                className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition-colors group-hover:text-white">
                  <Search className="h-3.5 w-3.5" />
                </span>

                <span>
                  <span className="block text-[11px] font-semibold text-slate-200">
                    Rechercher
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Trouver une voiture
                  </span>
                </span>
              </Link>

              <Link
                href="/agencies"
                className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition-colors group-hover:text-white">
                  <Users className="h-3.5 w-3.5" />
                </span>

                <span>
                  <span className="block text-[11px] font-semibold text-slate-200">
                    Nos agences
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Découvrir les partenaires
                  </span>
                </span>
              </Link>

              <Link
                href="/faq"
                className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.05]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 transition-colors group-hover:text-white">
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>

                <span>
                  <span className="block text-[11px] font-semibold text-slate-200">
                    Centre d'aide
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Questions fréquentes
                  </span>
                </span>
              </Link>

            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* BOTTOM BAR                                                       */}
        {/* ================================================================ */}

        <div className="mt-12 border-t border-slate-800/70 pt-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            {/* Copyright */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500">
              <span>© {currentYear} CarDrive</span>

              <span className="hidden text-slate-700 sm:inline">
                •
              </span>

              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Nador, Maroc
              </span>

              <span className="hidden text-slate-700 sm:inline">
                •
              </span>

              <span className="flex items-center gap-1.5">
                <CarFront className="h-3 w-3" />
                Mobilité simplifiée
              </span>
            </div>

            {/* Legal */}
            <nav
              aria-label="Liens légaux"
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500"
            >
              <Link
                href="/terms"
                className="transition-colors hover:text-slate-300"
              >
                Conditions
              </Link>

              <Link
                href="/privacy"
                className="transition-colors hover:text-slate-300"
              >
                Confidentialité
              </Link>

              <Link
                href="/contact"
                className="transition-colors hover:text-slate-300"
              >
                Contact
              </Link>

              <Link
                href="/sitemap.xml"
                className="transition-colors hover:text-slate-300"
              >
                Sitemap
              </Link>
            </nav>
          </div>

          {/* Final brand line */}
          <div className="mt-6 flex items-center justify-center border-t border-slate-800/40 pt-5">
            <p className="text-center text-[10px] tracking-wide text-slate-600">
              CarDrive · Location de voitures à Nador
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
