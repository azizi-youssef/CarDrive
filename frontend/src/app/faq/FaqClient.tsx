'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  MessageSquare,
  Search,
  HelpCircle,
  ShieldCheck,
  Car,
  CalendarCheck,
  MapPin,
  Building2,
  ArrowRight,
  X,
  FileQuestion,
} from 'lucide-react';
import { ShinyText, Magnet } from '@/components/ui/react-bits';

const FAQ_ITEMS = [
  {
    question: 'Comment fonctionne CarDrive Nador ?',
    answer:
      "CarDrive est une plateforme qui permet de découvrir les véhicules proposés par plusieurs agences de location à Nador et dans les environs. Vous recherchez un véhicule, consultez ses caractéristiques, ses conditions et son tarif, puis contactez l'agence concernée pour finaliser votre réservation.",
    icon: Car,
  },
  {
    question: 'Comment rechercher une voiture ?',
    answer:
      "Vous pouvez commencer votre recherche depuis la page Véhicules en indiquant vos dates et vos critères. Vous pouvez ensuite consulter les modèles disponibles, comparer les caractéristiques et ouvrir la fiche d'un véhicule pour obtenir davantage d'informations.",
    icon: Search,
  },
  {
    question: 'Comment réserver un véhicule ?',
    answer:
      "Après avoir sélectionné un véhicule, cliquez sur « Demander cette voiture ». Vous complétez votre demande avec votre numéro de CIN et vos coordonnées. CarDrive transmet votre dossier à l'agence partenaire qui confirme la disponibilité sous 1h à 2h.",
    icon: CalendarCheck,
  },
  {
    question: 'Comment fonctionne la disponibilité des véhicules ?',
    answer:
      "La disponibilité est gérée en direct par les agences partenaires sur la plateforme CarDrive. En envoyant votre demande via CarDrive, vous bloquez le tarif affiché. Si le véhicule venait à être indisponible, CarDrive vous propose immédiatement des alternatives équivalentes.",
    icon: CalendarCheck,
  },
  {
    question: 'Que signifie le badge « Agence vérifiée » ?',
    answer:
      "Lorsqu'une agence dispose du badge « Agence vérifiée », cela signifie que son registre de commerce, ses assurances professionnelles et son parc ont fait l'objet d'une validation rigoureuse par CarDrive.",
    icon: ShieldCheck,
  },
  {
    question: "Puis-je récupérer une voiture à l'aéroport Nador-Al Aroui ?",
    answer:
      "Oui, la majorité de nos agences partenaires assurent la livraison à l'aéroport Nador-Al Aroui ou au port de Beni Ansar. Précisez simplement votre numéro de vol ou de traversée lors de votre demande sur CarDrive pour que l'agent vous attende à votre arrivée.",
    icon: MapPin,
  },
  {
    question: 'Quel montant de caution dois-je prévoir ?',
    answer:
      "Le montant de la caution dépend notamment du véhicule, de l'agence et des conditions du contrat. Les modalités de paiement ou de blocage de la caution peuvent également varier. Vérifiez toujours les conditions communiquées par l'agence avant de confirmer votre réservation.",
    icon: ShieldCheck,
  },
  {
    question: 'Les assurances sont-elles incluses dans le prix ?',
    answer:
      "Les conditions d'assurance peuvent varier selon le véhicule et l'agence. Le tarif affiché ne doit donc pas être interprété comme incluant automatiquement toutes les garanties ou options. Consultez les conditions du véhicule et demandez à l'agence quelles couvertures sont incluses dans le prix.",
    icon: ShieldCheck,
  },
  {
    question: 'Puis-je annuler ma réservation ?',
    answer:
      "Les conditions d'annulation sont définies par chaque agence et peuvent dépendre du délai avant la prise en charge du véhicule. Avant de réserver, vérifiez les conditions applicables à votre demande et demandez à l'agence quelles éventuelles pénalités peuvent s'appliquer.",
    icon: CalendarCheck,
  },
  {
    question: "CarDrive est-il adapté aux Marocains résidant à l'étranger (MRE) ?",
    answer:
      "Oui. La plateforme est pensée notamment pour faciliter la recherche d'un véhicule avant ou pendant un séjour à Nador. Les services proposés aux MRE, les horaires de prise en charge, les conditions de retard de vol ou les documents nécessaires dépendent toutefois de chaque agence.",
    icon: MapPin,
  },
  {
    question: 'Une agence peut-elle rejoindre CarDrive ?',
    answer:
      "Oui. Les agences de location souhaitant proposer leurs véhicules sur CarDrive peuvent soumettre une demande de partenariat depuis la page dédiée. Après étude des informations fournies, l'agence peut être intégrée à la plateforme selon les conditions du service.",
    icon: Building2,
  },
];

export function FaqClient() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* ─────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#E63946]/6 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-slate-900/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E63946]/10 text-[#E63946]">
                <HelpCircle className="h-3 w-3" />
              </span>
              <ShinyText text="Questions fréquentes · Assistance CarDrive" />
            </div>

            <h1 className="text-4xl font-extrabold tracking-[-0.035em] text-[#0B1220] sm:text-5xl">
              Tout savoir sur{' '}
              <span className="text-[#E63946]">CarDrive</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Retrouvez les réponses aux questions les plus fréquentes
              concernant la recherche, la réservation et la location de
              véhicules à Nador.
            </p>

            {/* Instant Search Bar */}
            <div className="mx-auto mt-7 max-w-lg">
              <div className="relative flex items-center rounded-2xl border border-slate-200 bg-[#F8FAFC] p-1.5 shadow-xs focus-within:border-[#0B1220] focus-within:ring-2 focus-within:ring-[#0B1220]/15 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-2xs">
                  <Search className="h-4 w-4" />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une question (caution, aéroport, assurance...)"
                  className="w-full bg-transparent px-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Effacer la recherche"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {searchQuery && (
                <p className="mt-2 text-left text-xs text-slate-500 px-2 font-medium">
                  {filteredItems.length} réponse{filteredItems.length > 1 ? 's' : ''} trouvée{filteredItems.length > 1 ? 's' : ''} pour « {searchQuery} »
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FAQ ACCORDIONS LIST
      ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const Icon = item.icon;

              return (
                <details
                  key={item.question}
                  open={Boolean(searchQuery)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-xs open:border-[#E63946]/30"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 text-sm font-bold text-[#0B1220] outline-none transition-colors hover:text-[#E63946] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E63946] sm:px-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-slate-600 transition-colors group-open:bg-[#E63946]/10 group-open:text-[#E63946]">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1 leading-6">
                      {item.question}
                    </span>

                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-[#E63946]" />
                  </summary>

                  <div className="border-t border-slate-100">
                    <div className="px-5 pb-6 pt-5 sm:px-6">
                      <p className="pl-0 text-sm leading-7 text-slate-600 sm:pl-13">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="rounded-3xl border border-slate-200/90 bg-white p-10 text-center shadow-xs max-w-md mx-auto space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileQuestion className="h-6 w-6 text-[#E63946]" />
            </div>
            <h3 className="text-base font-bold text-[#0B1220]">
              Aucune question ne correspond à votre recherche
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Essayez avec d’autres mots-clés ou parcourez directement l'ensemble des questions.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1220] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Réinitialiser la recherche
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
            SUPPORT CTA
        ───────────────────────────────────────── */}
        <section className="relative mt-12 overflow-hidden rounded-3xl bg-[#0B1220] px-6 py-10 text-center sm:px-10">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E63946]/15 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"
          />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E63946]/15 text-[#E63946]">
              <MessageSquare className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white sm:text-2xl">
              Vous avez encore une question ?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Consultez les véhicules disponibles ou contactez directement
              notre assistance conciergerie 7j/7 pour obtenir les informations spécifiques à
              votre réservation.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnet strength={0.25} className="w-full sm:w-auto">
                <Link
                  href="/search"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold text-white shadow-xs hover:-translate-y-0.5 hover:bg-[#C92F3B] hover:shadow-[0_4px_16px_rgba(230,57,70,0.3)] transition-all sm:w-auto"
                >
                  <Search className="h-4 w-4" />
                  <span>Rechercher une voiture</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Magnet>

              <Magnet strength={0.2} className="w-full sm:w-auto">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors sm:w-auto"
                >
                  <span>Nous contacter</span>
                </Link>
              </Magnet>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

