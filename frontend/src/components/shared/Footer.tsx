'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import {
  ShieldCheck,
  Star,
  Clock3,
  MapPin,
  Mail,
  MessageCircle,
  Building2,
  Plane,
  Anchor,
  Compass,
  Car,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ====================================================================== */
/* LOCALIZATION DICTIONARY                                                */
/* ====================================================================== */

interface FooterStrings {
  agencyTitle: string;
  agencyBadge: string;
  agencyDesc: string;
  agencyCta: string;
  brandTagline: string;
  brandDesc: string;
  regionTag: string;
  trust1Title: string;
  trust1Desc: string;
  trust2Title: string;
  trust2Desc: string;
  trust3Title: string;
  trust3Desc: string;
  whatsappSupport: string;
  emailUs: string;
  colExplorer: string;
  airport: string;
  port: string;
  marchica: string;
  downtown: string;
  selouane: string;
  colVehicles: string;
  suv: string;
  economy: string;
  sedan: string;
  premium: string;
  automatic: string;
  allVehicles: string;
  colServices: string;
  agencies: string;
  becomePartner: string;
  agencyPortal: string;
  faq: string;
  contact: string;
  howItWorks: string;
  legalCgv: string;
  legalPrivacy: string;
  legalMentions: string;
  sitemap: string;
  allRightsReserved: string;
  bottomTagline: string;
}

const STRINGS: Record<string, FooterStrings> = {
  fr: {
    agencyTitle: 'Vous êtes une agence de location de voitures à Nador ?',
    agencyBadge: 'Portail Partenaire',
    agencyDesc:
      'Rejoignez le premier réseau de loueurs professionnels de l’Oriental pour digitaliser votre flotte et recevoir des demandes de réservation qualifiées.',
    agencyCta: 'Devenir agence partenaire',
    brandTagline: 'Location de voitures à Nador',
    brandDesc:
      'CarDrive est la marketplace automobile de référence à Nador. Comparez les disponibilités en temps réel et réservez auprès d’agences locales partenaires rigoureusement sélectionnées.',
    regionTag: 'Nador · Région de l’Oriental · Maroc',
    trust1Title: 'Agences partenaires vérifiées',
    trust1Desc: 'Des loueurs professionnels immatriculés et rigoureusement sélectionnés.',
    trust2Title: 'Tarifs clairs & sans frais cachés',
    trust2Desc: 'Des conditions transparentes et des prix fixés en direct par les agences.',
    trust3Title: 'Disponibilité & Support 7j/7',
    trust3Desc: 'Prise en charge aéroport, port et centre-ville avec assistance WhatsApp continue.',
    whatsappSupport: 'Assistance WhatsApp CarDrive',
    emailUs: 'contact@cardrive.ma',
    colExplorer: 'Explorer Nador',
    airport: 'Aéroport Nador-Al Aroui (NDR)',
    port: 'Port de Beni Ansar (Ferry)',
    marchica: 'Marchica & Lagune',
    downtown: 'Nador Centre-Ville',
    selouane: 'Selouane & Environs',
    colVehicles: 'Véhicules & Flotte',
    suv: 'SUV & 4x4',
    economy: 'Citadines & Économiques',
    sedan: 'Berlines Confort',
    premium: 'Luxe & Prestige',
    automatic: 'Boîte Automatique',
    allVehicles: 'Tous les véhicules',
    colServices: 'Services & Partenaires',
    agencies: 'Agences partenaires',
    becomePartner: 'Devenir partenaire',
    agencyPortal: 'Espace agence',
    faq: 'Centre d’aide & FAQ',
    contact: 'Contact & Support',
    howItWorks: 'Comment ça marche',
    legalCgv: 'Conditions Générales (CGV)',
    legalPrivacy: 'Confidentialité',
    legalMentions: 'Mentions Légales',
    sitemap: 'Plan du site',
    allRightsReserved: 'Tous droits réservés.',
    bottomTagline: 'CarDrive · Marketplace de location de véhicules à Nador & dans l’Oriental',
  },
  ar: {
    agencyTitle: 'هل تمتلك وكالة كراء سيارات بالناظور؟',
    agencyBadge: 'بوابة الشركاء',
    agencyDesc:
      'انضم لشبكة كاردرايف الرائدة في الجهة الشرقية لرقمنة أسطولك واستقبال طلبات حجز موثوقة ومباشرة من الزبائن.',
    agencyCta: 'انضم كوكالة شريكة',
    brandTagline: 'كراء السيارات في الناظور',
    brandDesc:
      'كاردرايف هي المنصة المرجعية لمقارنة وحجز سيارات الكراء بالناظور والجهة الشرقية، لدى وكالات محلية معتمدة وموثوقة.',
    regionTag: 'الناظور · الجهة الشرقية · المغرب',
    trust1Title: 'وكالات شريكة معتمدة',
    trust1Desc: 'مهنيون محليون مرخصون ومختارون بعناية فائقة.',
    trust2Title: 'أسعار واضحة بدون مصاريف خفية',
    trust2Desc: 'شروط شفافة وأسعار مباشرة ومحددة من قبل الوكالات بدون وسيط.',
    trust3Title: 'توفر واستلام 7/7 أيام',
    trust3Desc: 'تسليم في المطار، الميناء ووسط المدينة مع دعم متواصل عبر الواتساب.',
    whatsappSupport: 'دعم واتساب كاردرايف',
    emailUs: 'contact@cardrive.ma',
    colExplorer: 'الوجهات ونقاط الاستلام',
    airport: 'مطار الناظور العروي (NDR)',
    port: 'ميناء بني انصار (البواخر)',
    marchica: 'مارتشيكا والبحيرة',
    downtown: 'وسط مدينة الناظور',
    selouane: 'سلوان ونواحيها',
    colVehicles: 'الأسطول والسيارات',
    suv: 'سيارات الدفع الرباعي و SUV',
    economy: 'سيارات اقتصادية وصغيرة',
    sedan: 'سيارات عائلية وسيدان',
    premium: 'سيارات برستيج وفاخرة',
    automatic: 'ناقل حركة أوتوماتيكي',
    allVehicles: 'عرض جميع السيارات',
    colServices: 'الخدمات والشركاء',
    agencies: 'الوكالات الشريكة',
    becomePartner: 'انضم كشريك',
    agencyPortal: 'بوابة الوكالة',
    faq: 'الأسئلة الشائعة والمساعدة',
    contact: 'الاتصال والدعم',
    howItWorks: 'كيف يعمل الموقع',
    legalCgv: 'الشروط العامة للاستخدام',
    legalPrivacy: 'سياسة الخصوصية',
    legalMentions: 'البيانات القانونية',
    sitemap: 'خريطة الموقع',
    allRightsReserved: 'جميع الحقوق محفوظة.',
    bottomTagline: 'كاردرايف · منصة كراء السيارات بالناظور والجهة الشرقية للمملكة',
  },
  en: {
    agencyTitle: 'Do you manage a car rental agency in Nador?',
    agencyBadge: 'Partner Portal',
    agencyDesc:
      'Join the premier rental marketplace in the Oriental region to digitize your fleet and receive verified booking inquiries.',
    agencyCta: 'Become a partner agency',
    brandTagline: 'Car Rental in Nador',
    brandDesc:
      'CarDrive is the leading automotive marketplace in Nador, helping travelers compare live availability and book directly from verified local partner agencies.',
    regionTag: 'Nador · Oriental Region · Morocco',
    trust1Title: 'Verified Partner Agencies',
    trust1Desc: 'Licensed, trustworthy local car rental businesses in Nador.',
    trust2Title: 'Transparent Pricing',
    trust2Desc: 'Direct pricing without hidden fees or unexpected commissions.',
    trust3Title: '7/7 Availability & Support',
    trust3Desc: 'Direct airport & port handover with continuous WhatsApp customer assistance.',
    whatsappSupport: 'CarDrive WhatsApp Support',
    emailUs: 'contact@cardrive.ma',
    colExplorer: 'Explore Nador',
    airport: 'Nador Al-Aroui Airport (NDR)',
    port: 'Beni Ansar Port (Ferry)',
    marchica: 'Marchica & Lagoon',
    downtown: 'Nador City Center',
    selouane: 'Selouane & Surroundings',
    colVehicles: 'Fleet & Categories',
    suv: 'SUV & 4x4',
    economy: 'Compact & Economy',
    sedan: 'Comfort Sedans',
    premium: 'Luxury & Prestige',
    automatic: 'Automatic Transmission',
    allVehicles: 'All Available Vehicles',
    colServices: 'Services & Partners',
    agencies: 'Partner Agencies',
    becomePartner: 'Partner with Us',
    agencyPortal: 'Agency Portal',
    faq: 'FAQ & Help Center',
    contact: 'Contact & Support',
    howItWorks: 'How it Works',
    legalCgv: 'Terms of Service',
    legalPrivacy: 'Privacy Policy',
    legalMentions: 'Legal Notice',
    sitemap: 'Sitemap',
    allRightsReserved: 'All rights reserved.',
    bottomTagline: 'CarDrive · Car Rental Marketplace in Nador & Eastern Morocco',
  },
};

function getStrings(locale: string): FooterStrings {
  return STRINGS[locale] || STRINGS.fr;
}

/* ====================================================================== */
/* LINK COMPONENT                                                         */
/* ====================================================================== */

function NavItem({
  href,
  children,
  highlight = false,
  isRTL = false,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
  isRTL?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'group flex items-center justify-between rounded-lg py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#E63946]',
          highlight
            ? 'font-semibold text-[#E63946] hover:text-[#C92F3B]'
            : 'text-slate-400 hover:text-white'
        )}
      >
        <span className="flex items-center gap-2">
          {icon && (
            <span
              className={cn(
                'text-slate-500 transition-colors',
                highlight ? 'text-[#E63946]' : 'group-hover:text-white'
              )}
            >
              {icon}
            </span>
          )}
          <span>{children}</span>
        </span>

        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100',
            highlight ? 'text-[#E63946] opacity-100' : 'text-slate-500 group-hover:text-white',
            isRTL
              ? 'rotate-180 group-hover:-translate-x-0.5'
              : 'group-hover:translate-x-0.5'
          )}
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/* ====================================================================== */
/* MAIN FOOTER COMPONENT                                                  */
/* ====================================================================== */

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { locale, isRTL } = useTranslation();
  const strings = getStrings(locale);

  // Mobile Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    explorer: true,
    vehicles: false,
    services: false,
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer
      className="relative overflow-hidden border-t border-white/6 bg-[#0B1220] text-slate-300"
      role="contentinfo"
    >
      {/* Subtle Automotive Industrial Background Atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-[#E63946]/5 blur-3xl" />
        <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-slate-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================================================ */}
        {/* 1. AGENCY CONVERSION CTA                                     */}
        {/* ============================================================ */}
        <section aria-label={strings.agencyTitle} className="pt-10 sm:pt-12">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/5 via-white/2 to-transparent p-6 sm:p-8">
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E63946]/25 bg-[#E63946]/10 text-[#E63946]"
                  aria-hidden="true"
                >
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      {strings.agencyTitle}
                    </h2>
                    <span className="rounded-full border border-[#E63946]/30 bg-[#E63946]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#E63946]">
                      {strings.agencyBadge}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-xs sm:text-[13px] leading-relaxed text-slate-400">
                    {strings.agencyDesc}
                  </p>
                </div>
              </div>

              <Link
                href="/agency/join"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#E63946] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-red-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C92F3B] hover:shadow-xl active:translate-y-0 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>{strings.agencyCta}</span>
                <ArrowUpRight
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    isRTL && 'rotate-90 group-hover:-translate-x-0.5'
                  )}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. THREE MEANINGFUL TRUST ARGUMENTS                          */}
        {/* ============================================================ */}
        <section
          aria-label="Engagements CarDrive"
          className="my-8 border-y border-white/6 py-8"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {/* Argument 1 */}
            <div className="flex items-start gap-3.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                aria-hidden="true"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  {strings.trust1Title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {strings.trust1Desc}
                </p>
              </div>
            </div>

            {/* Argument 2 */}
            <div className="flex items-start gap-3.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400"
                aria-hidden="true"
              >
                <Star className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  {strings.trust2Title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {strings.trust2Desc}
                </p>
              </div>
            </div>

            {/* Argument 3 */}
            <div className="flex items-start gap-3.5 sm:col-span-2 md:col-span-1">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400"
                aria-hidden="true"
              >
                <Clock3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">
                  {strings.trust3Title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  {strings.trust3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. FOUR LOGICAL GROUPS ARCHITECTURE                          */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* ---------------------------------------------------------- */}
          {/* GROUP 1: CARDRIVE (Brand, Commercial Description & Contact) */}
          {/* ---------------------------------------------------------- */}
          <div className="space-y-4 lg:col-span-4">
            <Link
              href="/"
              aria-label="CarDrive — Accueil"
              className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-[#E63946]"
            >
              <div className="relative h-9 w-40">
                <Image
                  src="/logo_12.png"
                  alt="CarDrive"
                  fill
                  sizes="160px"
                  className={cn(
                    'object-contain brightness-110',
                    isRTL ? 'object-right' : 'object-left'
                  )}
                />
              </div>
            </Link>

            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              {strings.brandDesc}
            </p>

            {/* Direct Contact Actions */}
            <div className="pt-2 space-y-2">
              <a
                href="https://wa.me/212661987654?text=Bonjour%20CarDrive%2C%20je%20souhaite%20louer%20un%20v%C3%A9hicule%20%C3%A0%20Nador"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex max-w-sm items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>{strings.whatsappSupport}</span>
                </span>
                <ArrowUpRight
                  className={cn(
                    'h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    isRTL && 'rotate-90 group-hover:-translate-x-0.5'
                  )}
                  aria-hidden="true"
                />
              </a>

              <a
                href="mailto:contact@cardrive.ma"
                className="flex max-w-sm items-center gap-2.5 rounded-xl border border-white/5 bg-white/2 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-white/10 hover:text-white"
              >
                <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>{strings.emailUs}</span>
              </a>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* GROUP 2: EXPLORER (Destinations & Hubs)                     */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-3">
            {/* Desktop / Tablet Header */}
            <h3 className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-4">
              <span className="h-1 w-3.5 rounded-full bg-[#E63946]" aria-hidden="true" />
              <span>{strings.colExplorer}</span>
            </h3>

            {/* Mobile Accordion Trigger */}
            <button
              type="button"
              onClick={() => toggleAccordion('explorer')}
              aria-expanded={openAccordions.explorer}
              className="flex md:hidden w-full items-center justify-between border-b border-white/6 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              <span className="flex items-center gap-2">
                <span className="h-1 w-3.5 rounded-full bg-[#E63946]" aria-hidden="true" />
                <span>{strings.colExplorer}</span>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  openAccordions.explorer && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            {/* Links List */}
            <ul
              className={cn(
                'space-y-1.5 pt-2 md:pt-0',
                openAccordions.explorer ? 'block' : 'hidden md:block'
              )}
            >
              <NavItem
                href="/location-voiture-nador-aeroport"
                isRTL={isRTL}
                icon={<Plane className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.airport}
              </NavItem>
              <NavItem
                href="/location-voiture-beni-ansar"
                isRTL={isRTL}
                icon={<Anchor className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.port}
              </NavItem>
              <NavItem
                href="/search?location=marchica"
                isRTL={isRTL}
                icon={<Compass className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.marchica}
              </NavItem>
              <NavItem
                href="/location-voiture-nador"
                isRTL={isRTL}
                icon={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.downtown}
              </NavItem>
              <NavItem
                href="/search?location=selouane"
                isRTL={isRTL}
                icon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.selouane}
              </NavItem>
            </ul>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* GROUP 3: VEHICLES (SUV, Economy, Sedan, Luxury, Auto)       */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-2">
            {/* Desktop / Tablet Header */}
            <h3 className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-4">
              <span className="h-1 w-3.5 rounded-full bg-[#E63946]" aria-hidden="true" />
              <span>{strings.colVehicles}</span>
            </h3>

            {/* Mobile Accordion Trigger */}
            <button
              type="button"
              onClick={() => toggleAccordion('vehicles')}
              aria-expanded={openAccordions.vehicles}
              className="flex md:hidden w-full items-center justify-between border-b border-white/6 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              <span className="flex items-center gap-2">
                <span className="h-1 w-3.5 rounded-full bg-[#E63946]" aria-hidden="true" />
                <span>{strings.colVehicles}</span>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  openAccordions.vehicles && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            {/* Links List */}
            <ul
              className={cn(
                'space-y-1.5 pt-2 md:pt-0',
                openAccordions.vehicles ? 'block' : 'hidden md:block'
              )}
            >
              <NavItem
                href="/location-voiture-nador-suv"
                isRTL={isRTL}
                icon={<Car className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.suv}
              </NavItem>
              <NavItem
                href="/search?category=%C3%89conomique"
                isRTL={isRTL}
                icon={<Car className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.economy}
              </NavItem>
              <NavItem
                href="/search?category=Berline"
                isRTL={isRTL}
                icon={<Car className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.sedan}
              </NavItem>
              <NavItem
                href="/search?category=Luxe"
                isRTL={isRTL}
                icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.premium}
              </NavItem>
              <NavItem
                href="/location-voiture-nador-automatique"
                isRTL={isRTL}
                icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {strings.automatic}
              </NavItem>
              <NavItem href="/search" isRTL={isRTL} highlight>
                {strings.allVehicles}
              </NavItem>
            </ul>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* GROUP 4: SERVICES (Agencies, Registration, FAQ, Support)   */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-3">
            {/* Desktop / Tablet Header */}
            <h3 className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-4">
              <span className="h-1 w-3.5 rounded-full bg-[#E63946]" aria-hidden="true" />
              <span>{strings.colServices}</span>
            </h3>

            {/* Mobile Accordion Trigger */}
            <button
              type="button"
              onClick={() => toggleAccordion('services')}
              aria-expanded={openAccordions.services}
              className="flex md:hidden w-full items-center justify-between border-b border-white/6 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              <span className="flex items-center gap-2">
                <span className="h-1 w-3.5 rounded-full bg-[#E63946]" aria-hidden="true" />
                <span>{strings.colServices}</span>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  openAccordions.services && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            {/* Links List */}
            <ul
              className={cn(
                'space-y-1.5 pt-2 md:pt-0',
                openAccordions.services ? 'block' : 'hidden md:block'
              )}
            >
              <NavItem href="/agencies" isRTL={isRTL}>
                {strings.agencies}
              </NavItem>
              <NavItem href="/agency/join" isRTL={isRTL} highlight>
                {strings.becomePartner}
              </NavItem>
              <NavItem href="/agency" isRTL={isRTL}>
                {strings.agencyPortal}
              </NavItem>
              <NavItem href="/about" isRTL={isRTL}>
                {strings.howItWorks}
              </NavItem>
              <NavItem href="/faq" isRTL={isRTL}>
                {strings.faq}
              </NavItem>
              <NavItem href="/contact" isRTL={isRTL}>
                {strings.contact}
              </NavItem>
            </ul>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. BOTTOM COPYRIGHT & LEGAL BAR                              */}
        {/* ============================================================ */}
        <div className="border-t border-white/6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
            {/* Copyright & Region */}
            <div className="flex flex-wrap items-center gap-3">
              <span>
                © {currentYear} CarDrive. {strings.allRightsReserved}
              </span>
              <span className="hidden sm:inline text-slate-700" aria-hidden="true">
                •
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="h-3 w-3 text-slate-500" aria-hidden="true" />
                <span>Nador, Maroc</span>
              </span>
              <span className="hidden sm:inline text-slate-700" aria-hidden="true">
                •
              </span>
              {/* Language Selector in Footer */}
              <LanguageSelector variant="footer" />
            </div>

            {/* Legal Navigation */}
            <nav aria-label="Liens légaux" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <Link
                href="/cgv"
                className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#E63946]"
              >
                {strings.legalCgv}
              </Link>
              <Link
                href="/confidentialite"
                className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#E63946]"
              >
                {strings.legalPrivacy}
              </Link>
              <Link
                href="/mentions-legales"
                className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#E63946]"
              >
                {strings.legalMentions}
              </Link>
              <Link
                href="/sitemap.xml"
                className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#E63946]"
              >
                {strings.sitemap}
              </Link>
            </nav>
          </div>

          {/* Minimalist Industrial Brand Tagline */}
          <div className="mt-4 pt-4 border-t border-white/3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-600">
              {strings.bottomTagline}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
