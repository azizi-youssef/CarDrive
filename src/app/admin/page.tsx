'use client';

import React, { useState } from 'react';
import { store } from '@/lib/services/store';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Car,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'agencies' | 'bookings' | 'overview'>('overview');

  const stats = store.getAdminStats();
  const agencies = store.getAgencies(false);
  const allBookings = store.getBookings();

  const handleVerifyAgency = (agencyId: string, verified: boolean) => {
    store.updateAgencyStatus(agencyId, verified ? 'ACTIVE' : 'SUSPENDED', verified);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      
      {/* Admin Top Header */}
      <div className="bg-slate-950 text-white border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Super Administration CarDrive
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/60 px-2 py-0.5 rounded">
                    Admin Root
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Supervision de l’écosystème de location de voitures à Nador
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Plateforme Opérationnelle
              </span>
            </div>

          </div>

          {/* Admin Tabs */}
          <div className="flex items-center gap-2 mt-6 border-t border-slate-800 pt-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Métriques Globales
            </button>
            <button
              onClick={() => setActiveTab('agencies')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'agencies'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Vérification des Agences</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-900 text-teal-300 text-[10px]">
                {agencies.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'bookings'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Toutes les Réservations ({allBookings.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Agences Partenaires</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalAgencies}</span>
              <Building2 className="w-5 h-5 text-[#046c7a]" />
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              {stats.verifiedAgencies} certifiées vérifiées
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Flotte Totale Nador</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.totalVehicles}</span>
              <Car className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Unités physiques référencées
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Volume d’affaires</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{formatPrice(stats.totalVolume)}</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              {stats.totalBookings} dossiers de réservation
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Commission Plateforme</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-[#046c7a]">{formatPrice(stats.platformCommission)}</span>
              <DollarSign className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              Revenus SaaS estimés (10%)
            </span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & AUDIT */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-2">
                Supervision du Moteur de Réservation & Disponibilité
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                La plateforme CarDrive empêche les conflits de dates au niveau PostgreSQL (contraintes d’exclusion range).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100">
                  <span className="font-bold text-slate-900 block mb-1">Moteur Anti-Doublons</span>
                  <p className="text-slate-600">Interval overlap checking actif sur chaque tentative de réservation.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100">
                  <span className="font-bold text-slate-900 block mb-1">Fallback Multi-Agences</span>
                  <p className="text-slate-600">Propose automatiquement le même modèle chez une autre agence dès indisponibilité.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100">
                  <span className="font-bold text-slate-900 block mb-1">Canal WhatsApp</span>
                  <p className="text-slate-600">Tracking des intentions de réservation directes avec référence #NRD.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AGENCY VERIFICATION WORKFLOW */}
        {activeTab === 'agencies' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Validation & Vérification des Agences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Contrôlez les autorisations et attribuez le badge « Partenaire Vérifié »
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Agence</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Adresse</th>
                      <th className="py-3 px-4">Flotte</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Certification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agencies.map((a) => {
                      const carCount = store.getVehicles({ agencyId: a.id }).length;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{a.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{a.slug}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{a.phone}</div>
                            <div className="text-[10px] text-slate-400">{a.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{a.address}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {carCount} voitures
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={a.status === 'ACTIVE' ? 'available' : 'rented'}>
                              {a.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {a.verified ? (
                              <button
                                onClick={() => handleVerifyAgency(a.id, false)}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors"
                              >
                                Révoquer vérification
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerifyAgency(a.id, true)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold shadow-sm transition-colors"
                              >
                                Valider & Vérifier
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Toutes les réservations de la marketplace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Surveillance globale de toutes les transactions entre clients et agences
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Dossier</th>
                      <th className="py-3 px-4">Agence</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Véhicule</th>
                      <th className="py-3 px-4">Période</th>
                      <th className="py-3 px-4">Montant</th>
                      <th className="py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#046c7a]">{b.booking_ref}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{b.agency?.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{b.customer_name}</span>
                          <span className="text-[10px] text-slate-500">{b.customer_phone}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {b.vehicle?.brand} {b.vehicle?.model}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {b.start_date} → {b.end_date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{formatPrice(b.total_price)}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              b.status === 'CONFIRMED'
                                ? 'available'
                                : b.status === 'PENDING'
                                ? 'pending'
                                : 'rented'
                            }
                          >
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
