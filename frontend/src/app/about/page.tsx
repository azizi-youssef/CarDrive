import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import {
  Car,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Search,
  Check,
  X,
  Building2,
} from 'lucide-react';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'À propos — CarDrive',
  description:
    'CarDrive rassemble les voitures des agences de location de Nador au même endroit : cherchez le modèle dont vous avez besoin, pas une agence.',
};

const headingFont = 'font-[family-name:var(--font-display)]';

const values = [
  {
    icon: Search,
    title: 'Partez de la voiture',
    description:
      'Choisissez un modèle, un budget ou un besoin. CarDrive affiche les véhicules de toutes les agences partenaires au même endroit.',
  },
  {
    icon: ShieldCheck,
    title: 'Des agences identifiées',
    description:
      'Chaque agence et chaque véhicule sont présentés avec des informations claires, pour réserver en confiance.',
  },
  {
    icon: Car,
    title: 'Une alternative si le modèle est pris',
    description:
      'Quand la voiture voulue n’est pas disponible, CarDrive propose des véhicules similaires chez d’autres partenaires.',
  },
  {
    icon: MapPin,
    title: 'Pensé pour Nador',
    description:
      'Aéroport Al-Aroui, Beni Ansar, Nador Centre, Selouane, Marchica : la plateforme suit les trajets réels du territoire.',
  },
];

const steps = [
  {
    title: 'Décrivez votre besoin',
    description:
      'Indiquez vos dates, votre point de récupération et le type de véhicule.',
  },
  {
    title: 'Comparez les véhicules',
    description:
      'Parcourez les modèles disponibles chez les différentes agences partenaires.',
  },
  {
    title: 'Contactez l’agence',
    description:
      'Consultez la fiche du véhicule, puis échangez directement avec l’agence pour réserver.',
  },
];

const locations = [
  'Nador Centre',
  'Aéroport Al-Aroui',
  'Port de Beni Ansar',
  'Selouane',
  'Marchica',
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] focus-visible:ring-offset-2';

/* Illustration du principe : une voiture, plusieurs agences. */
function SearchPreview() {
  const offers = [
    { agency: 'Agence partenaire A', available: true },
    { agency: 'Agence partenaire B', available: true },
    { agency: 'Agence partenaire C', available: false },
  ];

  return (
    <figure className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="text-sm font-medium text-slate-900">
            Dacia Logan
          </span>
          <span className="ml-auto text-xs text-slate-500">Nador</span>
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {offers.map((offer) => (
            <li
              key={offer.agency}
              className="flex items-center gap-3 py-3 text-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>

              <span
                className={
                  offer.available ? 'text-slate-900' : 'text-slate-400'
                }
              >
                {offer.agency}
              </span>

              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  offer.available
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {offer.available ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <X className="h-3 w-3" aria-hidden="true" />
                )}
                {offer.available ? 'Disponible' : 'Indisponible'}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#E63946]/10 px-4 py-3">
          <Car className="h-4 w-4 text-[#E63946]" aria-hidden="true" />
          <p className="text-sm text-slate-900">
            <span className="font-semibold">Alternative proposée :</span>{' '}
            Renault Clio
          </p>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-slate-500">
        Exemple illustratif
      </figcaption>
    </figure>
  );
}

export default function AboutPage() {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#F8FAFC] font-[family-name:var(--font-body)] text-slate-900 antialiased`}
    >
      {/* HERO */}
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden border-b border-slate-200 bg-white"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#E63946]/[0.07] blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <h1
              id="hero-title"
              className={`${headingFont} text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl`}
            >
              Cherchez la voiture, pas l’agence.
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              CarDrive rassemble les véhicules des agences de location de
              Nador. Voyageurs et résidents trouvent le modèle dont ils ont
              besoin, puis contactent directement l’agence qui le propose.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/search"
                className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E63946]/25 transition-colors hover:bg-[#C92F3B] motion-reduce:transition-none ${focusRing}`}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Explorer les véhicules
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/agencies"
                className={`inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 motion-reduce:transition-none ${focusRing}`}
              >
                Voir les agences
              </Link>
            </div>
          </div>

          <SearchPreview />
        </div>
      </section>

      {/* CONSTAT */}
      <section
        aria-labelledby="story-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <h2
            id="story-title"
            className={`${headingFont} text-balance text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl`}
          >
            Trouver une voiture ne devrait pas demander dix appels.
          </h2>

          <div className="max-w-2xl space-y-5 text-base leading-8 text-slate-600">
            <p>
              À Nador, un voyageur peut avoir besoin d’un véhicule dès son
              arrivée à l’aéroport Al-Aroui ou au port de Beni Ansar. Pour
              trouver un modèle précis, il faut aujourd’hui contacter
              plusieurs agences, une par une.
            </p>

            <p>
              CarDrive inverse la démarche :{' '}
              <strong className="font-semibold text-slate-900">
                on commence par la voiture recherchée, pas par le nom de
                l’agence.
              </strong>{' '}
              La plateforme réunit les véhicules, permet de comparer les
              options disponibles et met en relation avec le bon partenaire.
            </p>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section
        aria-labelledby="values-title"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h2
            id="values-title"
            className={`${headingFont} max-w-2xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl`}
          >
            Une recherche plus courte, du besoin jusqu’au volant.
          </h2>

          <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="flex gap-4 border-t border-slate-200 pt-6"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E63946]/10 text-[#E63946]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div>
                    <dt
                      className={`${headingFont} text-lg font-bold text-slate-950`}
                    >
                      {value.title}
                    </dt>
                    <dd className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                      {value.description}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* FONCTIONNEMENT */}
      <section
        aria-labelledby="steps-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <h2
          id="steps-title"
          className={`${headingFont} max-w-2xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl`}
        >
          Comment fonctionne CarDrive ?
        </h2>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-14 right-[-1rem] top-6 hidden h-px bg-slate-300 md:block"
                />
              )}

              <span
                className={`${headingFont} relative flex h-12 w-12 items-center justify-center rounded-full bg-[#E63946] text-lg font-extrabold text-white`}
              >
                {index + 1}
              </span>

              <h3
                className={`${headingFont} mt-5 text-xl font-bold text-slate-950`}
              >
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-7 text-slate-600 sm:text-base">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ANCRAGE LOCAL */}
      <section aria-labelledby="local-title" className="bg-[#0B1220]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <h2
              id="local-title"
              className={`${headingFont} text-balance text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl`}
            >
              Conçu pour les déplacements autour de Nador.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              CarDrive couvre les principaux points de mobilité de la région,
              pour récupérer une voiture là où le trajet commence.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2.5">
              {locations.map((location) => (
                <li
                  key={location}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100"
                >
                  <MapPin
                    className="h-3.5 w-3.5 text-[#E63946]"
                    aria-hidden="true"
                  />
                  {location}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL : voyageurs et agences */}
      <section
        aria-labelledby="cta-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <h2 id="cta-title" className="sr-only">
          Commencer avec CarDrive
        </h2>

        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl bg-[#E63946] p-8 text-white sm:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />

            <div className="relative">
              <p
                className={`${headingFont} text-balance text-2xl font-extrabold leading-tight sm:text-3xl`}
              >
                Votre prochaine voiture est peut-être déjà ici.
              </p>
              <p className="mt-3 max-w-md text-base leading-7 text-white/85">
                Parcourez les véhicules disponibles et trouvez celui qui
                convient à votre séjour à Nador.
              </p>

              <Link
                href="/search"
                className={`group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0B1220] shadow-lg transition-colors hover:bg-slate-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#E63946]`}
              >
                Rechercher une voiture
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>

              <p
                className={`${headingFont} mt-5 text-xl font-bold text-slate-950`}
              >
                Vous gérez une agence de location ?
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                Présentez votre flotte aux voyageurs et aux résidents qui
                cherchent une voiture à Nador.
              </p>
            </div>

            {/* Adaptez l’URL à votre page de contact ou d’inscription partenaire */}
            <Link
              href="/contact"
              className={`mt-7 inline-flex items-center gap-2 self-start text-sm font-bold text-[#E63946] hover:text-[#C92F3B] ${focusRing} rounded`}
            >
              Devenir partenaire
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}