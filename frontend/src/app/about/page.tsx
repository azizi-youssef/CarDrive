
import React from 'react';
import Link from 'next/link';
import {
  Car,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Compass,
  Search,
  Users,
  Zap,
  CheckCircle2,
  Building2,
} from 'lucide-react';

const values = [
  {
    icon: Search,
    title: 'Cherchez une voiture, pas une agence',
    description:
      'CarDrive centralise les véhicules proposés par les agences partenaires afin de vous permettre de partir directement du modèle, du budget et de vos besoins.',
  },
  {
    icon: ShieldCheck,
    title: 'Des partenaires identifiés',
    description:
      'Nous structurons les informations des agences et de leurs véhicules pour rendre la recherche plus claire et faciliter une réservation en toute confiance.',
  },
  {
    icon: Car,
    title: 'Trouvez des alternatives',
    description:
      'Lorsqu’un modèle recherché n’est pas disponible, CarDrive peut vous présenter des véhicules similaires proposés par d’autres partenaires.',
  },
  {
    icon: MapPin,
    title: 'Pensé pour Nador',
    description:
      'Aéroport Al-Aroui, Beni Ansar, Nador Centre, Selouane ou Marchica : la plateforme est conçue autour des besoins de mobilité du territoire.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Définissez votre besoin',
    description:
      'Choisissez vos dates, votre point de récupération et le type de véhicule recherché.',
  },
  {
    number: '02',
    title: 'Comparez les véhicules',
    description:
      'Explorez les modèles disponibles auprès des différentes agences partenaires.',
  },
  {
    number: '03',
    title: 'Contactez et réservez',
    description:
      'Consultez les détails du véhicule puis échangez directement avec l’agence.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* ─────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#E63946]/6 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-slate-900/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E63946]/10 text-[#E63946]">
                <Compass className="h-3 w-3" />
              </span>

              <span>À propos de CarDrive</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-[-0.035em] text-[#0B1220] sm:text-5xl lg:text-6xl">
              La location de voitures,
              <span className="block text-[#E63946]">
                pensée autrement.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              CarDrive simplifie la recherche de voitures à Nador en
              permettant aux voyageurs et aux résidents de découvrir
              directement les véhicules disponibles auprès des agences
              partenaires.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/search"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E63946] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#E63946]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C92F3B] hover:shadow-xl hover:shadow-[#E63946]/25 sm:w-auto"
              >
                <Search className="h-4 w-4" />
                <span>Explorer les véhicules</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/agencies"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Découvrir les agences
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          STORY
      ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
          {/* Label card */}
          <div className="relative overflow-hidden rounded-3xl bg-[#0B1220] p-8 text-white sm:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E63946]/20 blur-3xl"
            />

            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Notre vision
                </span>

                <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
                  Une expérience plus simple pour trouver la bonne voiture.
                </h2>
              </div>

              <div className="mt-12">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E63946]">
                    <Car className="h-4 w-4 text-white" />
                  </div>

                  <span>CarDrive · Nador, Maroc</span>
                </div>
              </div>
            </div>
          </div>

          {/* Story */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#E63946]">
              <span className="h-px w-6 bg-[#E63946]" />
              Le constat
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#0B1220] sm:text-3xl">
              La recherche d’une voiture ne devrait pas être compliquée.
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
              <p>
                À Nador, un voyageur peut avoir besoin d’un véhicule dès son
                arrivée à l’Aéroport Al-Aroui ou au Port de Beni Ansar. Pourtant,
                identifier rapidement un modèle précis peut nécessiter plusieurs
                recherches et prises de contact auprès d’agences différentes.
              </p>

              <p>
                CarDrive part d’une idée simple :{' '}
                <strong className="font-semibold text-slate-900">
                  commencer par la voiture recherchée plutôt que par le nom de
                  l’agence.
                </strong>
              </p>

              <p>
                La plateforme rassemble les informations nécessaires pour
                découvrir les véhicules, comparer les options disponibles et
                entrer directement en contact avec le partenaire concerné.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-[#E63946]/15 bg-[#E63946]/5 p-5">
              <p className="text-sm font-semibold leading-6 text-[#0B1220]">
                « Ne cherchez plus une agence. Cherchez directement la voiture
                dont vous avez besoin. »
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          VALUES
      ───────────────────────────────────────────── */}
      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#E63946]">
              Pourquoi CarDrive
            </span>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1220] sm:text-4xl">
              Une plateforme construite autour de l’expérience de recherche.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Chaque fonctionnalité vise à réduire les étapes inutiles entre
              votre besoin et le véhicule que vous souhaitez louer.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="group rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E63946]/10 text-[#E63946] transition-colors group-hover:bg-[#E63946] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0B1220]">
                        {value.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#E63946]">
            Simple par conception
          </span>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1220] sm:text-4xl">
            Comment fonctionne CarDrive ?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Quelques étapes pour passer de votre besoin à une voiture adaptée
            à votre séjour.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold tracking-tight text-slate-200">
                  {step.number}
                </span>

                {index < steps.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 text-slate-300 md:block" />
                )}
              </div>

              <h3 className="mt-6 text-lg font-bold text-[#0B1220]">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          LOCAL FOCUS
      ───────────────────────────────────────────── */}
      <section className="bg-[#0B1220]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#E63946]">
                <MapPin className="h-4 w-4" />
                <span>Ancrage local</span>
              </div>

              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Conçu pour les déplacements autour de Nador.
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                CarDrive prend en compte les principaux points de mobilité de
                la région : Nador Centre, l’Aéroport Al-Aroui, le Port de Beni
                Ansar, Selouane et les environs de Marchica.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  'Nador Centre',
                  'Al-Aroui',
                  'Beni Ansar',
                  'Selouane',
                  'Marchica',
                ].map((location) => (
                  <span
                    key={location}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {location}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 lg:flex">
              <MapPin className="h-10 w-10 text-[#E63946]" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#E63946] px-7 py-12 text-center shadow-xl shadow-[#E63946]/15 sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl"
          />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Car className="h-6 w-6 text-white" />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Votre prochaine voiture est peut-être déjà ici.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              Parcourez les véhicules disponibles et trouvez une solution
              adaptée à votre séjour à Nador.
            </p>

            <Link
              href="/search"
              className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0B1220] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <span>Rechercher une voiture</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
