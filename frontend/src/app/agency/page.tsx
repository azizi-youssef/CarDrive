'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { store } from '@/lib/services/store';
import { Vehicle, Booking, VehicleCategory, TransmissionType, FuelType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { formatPrice } from '@/lib/utils';
import {
  Building2,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Users,
  Eye,
  X,
  Download,
} from 'lucide-react';
import { AgencyBookingDetailModal } from '@/components/agency/AgencyBookingDetailModal';
import { MeetingPointBadge } from '@/components/booking/MeetingPointBadge';

export default function AgencyDashboardPage() {
  // We can let the user pick which agency they want to manage (defaults to agency-1 "Nador Auto Rent")
  const agencies = store.getAgencies();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('agency-1');
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'bookings'>('overview');

  // Trigger state rerender when mutations happen
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  const agency = store.getAgencyById(selectedAgencyId);
  const stats = store.getAgencyStats(selectedAgencyId);
  const fleet = store.getVehicles({ agencyId: selectedAgencyId });
  const bookings = store.getBookings(selectedAgencyId);

  // Add vehicle modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('Dacia');
  const [newModel, setNewModel] = useState('Duster');
  const [newYear, setNewYear] = useState(2025);
  const [newCategory, setNewCategory] = useState<VehicleCategory>('SUV');
  const [newTransmission, setNewTransmission] = useState<TransmissionType>('AUTOMATIC');
  const [newFuel, setNewFuel] = useState<FuelType>('DIESEL');
  const [newPrice, setNewPrice] = useState(360);
  const [newDeposit, setNewDeposit] = useState(3000);
  const [newUnit, setNewUnit] = useState('Duster #005');
  const [newPlate, setNewPlate] = useState('89012-A-50');

  const handleBookingStatus = (bookingId: string, status: any) => {
    store.updateBookingStatus(bookingId, status);
    setRefreshKey((prev) => prev + 1);
  };

  const handleToggleStatus = (carId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'RENTED' : 'AVAILABLE';
    store.updateVehicle(carId, { status: nextStatus as any });
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeleteVehicle = (carId: string) => {
    if (confirm('Voulez-vous vraiment retirer ce véhicule de votre flotte ?')) {
      store.deleteVehicle(carId);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = `${newBrand.toLowerCase()}-${newModel.toLowerCase()}-${newYear}-${Date.now()}`;

    store.addVehicle({
      agency_id: selectedAgencyId,
      unit_number: newUnit,
      license_plate: newPlate,
      brand: newBrand,
      model: newModel,
      slug,
      year: newYear,
      category: newCategory,
      transmission: newTransmission,
      fuel: newFuel,
      seats: 5,
      doors: 5,
      air_conditioning: true,
      mileage: 10000,
      daily_price: newPrice,
      deposit: newDeposit,
      min_rental_days: 1,
      status: 'AVAILABLE',
      published: true,
      featured: false,
      images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop&q=80'],
      features: ['Climatisation', 'Bluetooth', 'Radar de recul'],
    });

    setIsAddModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      
      {/* Top SaaS Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#02306B] to-blue-500 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {agency?.name || 'Portail Agence'}
                  </h1>
                  {agency?.verified && (
                    <Badge variant="verified" icon>Vérifiée</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Dashboard de gestion de flotte & réservations • Nador
                </p>
              </div>
            </div>

            {/* Agency Selector Switcher (Simulation for multi-agency management) */}
            <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 pl-2">Agence active :</span>
              <select
                aria-label="Agence active"
                value={selectedAgencyId}
                onChange={(e) => {
                  setSelectedAgencyId(e.target.value);
                  setRefreshKey((prev) => prev + 1);
                }}
                className="bg-slate-900 text-white font-semibold rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none cursor-pointer"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#02306B] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Vue Générale
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'fleet'
                  ? 'bg-[#02306B] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Gestion de la Flotte ({fleet.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'bookings'
                  ? 'bg-[#02306B] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Réservations</span>
              {stats.pendingBookings > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                  {stats.pendingBookings}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Flotte</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.totalVehicles}</span>
                  <Car className="w-5 h-5 text-[#02306B]" />
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                  {stats.availableVehicles} disponibles
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Véhicules Loués</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.currentlyRented}</span>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Taux d’occupation : {stats.occupancyRate}%
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Demandes en attente</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-amber-600">{stats.pendingBookings}</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  À traiter rapidement
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Revenu Net Agence (85%)</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-extrabold text-[#02306B]">
                    {formatPrice(stats.netRevenue ?? Math.round(stats.totalRevenue * 0.85))}
                  </span>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Brut: {formatPrice(stats.totalRevenue)} · Com. 15%: -{formatPrice(stats.platformCommission ?? Math.round(stats.totalRevenue * 0.15))}
                </span>
              </div>
            </div>

            {/* Quick Pending Bookings Action Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900">
                  Dernières demandes de réservation
                </h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-semibold text-[#02306B] hover:underline"
                >
                  Voir toutes les réservations
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5">Référence</th>
                        <th className="py-2.5">Client</th>
                        <th className="py-2.5">Véhicule</th>
                        <th className="py-2.5">Point RDV Choisi</th>
                        <th className="py-2.5">Période</th>
                        <th className="py-2.5">Montant</th>
                        <th className="py-2.5">Statut</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono font-bold text-[#02306B]">{b.booking_ref}</td>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800 block">{b.customer_name}</span>
                            <span className="text-[10px] text-slate-500">{b.customer_phone}</span>
                          </td>
                          <td className="py-3 font-medium text-slate-700">
                            {b.vehicle?.brand} {b.vehicle?.model}
                          </td>
                          <td className="py-3">
                            <MeetingPointBadge location={b.pickup_location || 'Aéroport Nador Al-Aroui (NDR)'} size="sm" />
                          </td>
                          <td className="py-3 text-slate-600">
                            {b.start_date} → {b.end_date} ({b.total_days}j)
                          </td>
                          <td className="py-3 font-bold text-slate-900">{formatPrice(b.total_price)}</td>
                          <td className="py-3">
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
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedBookingForDetail(b)}
                                className="px-2.5 py-1 rounded-lg bg-[#02306B] hover:bg-[#064181] text-white font-semibold text-[11px] transition-colors"
                              >
                                Traiter
                              </button>
                              <a
                                href={`/api/bookings/${encodeURIComponent(b.reference || b.booking_ref || '')}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                                title="Télécharger la fiche PDF"
                              >
                                <Download className="w-3 h-3 text-[#FF7300]" />
                                <span>PDF</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4">Aucune réservation pour le moment.</p>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: FLEET MANAGEMENT */}
        {activeTab === 'fleet' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Flotte automobile de l’agence</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gérez vos unités physiques, immatriculations et disponibilités en direct
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white text-xs font-semibold shadow transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un véhicule</span>
              </button>
            </div>

            {/* Fleet Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Véhicule</th>
                      <th className="py-3 px-4">Unité / Immat</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Tarif / jour</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fleet.map((car) => (
                      <tr key={car.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                              <Image
                                src={car.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80'}
                                alt={car.model}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {car.brand} {car.model}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {car.year} • {car.transmission === 'AUTOMATIC' ? 'Auto' : 'Manuelle'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          <div>{car.unit_number}</div>
                          <div className="text-[10px] text-slate-400">{car.license_plate}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {car.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#02306B]">
                          {formatPrice(car.daily_price)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(car.id, car.status)}
                            className="cursor-pointer"
                            title="Cliquer pour changer le statut"
                          >
                            <Badge variant={car.status === 'AVAILABLE' ? 'available' : 'rented'} icon>
                              {car.status === 'AVAILABLE' ? 'Disponible' : 'Loué'}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteVehicle(car.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer le véhicule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALL BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Toutes les réservations</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Historique complet des demandes reçues via la plateforme CarDrive
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Dossier</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Véhicule</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Lieu de prise</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4 text-emerald-700">Net Agence (85%)</th>
                      <th className="py-3 px-4 text-slate-500">Com. 15%</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Changer statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => {
                      const commission = b.commission_amount ?? Math.round(b.total_price * 0.15);
                      const netAgency = b.agency_amount ?? (b.total_price - commission);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#02306B]">{b.booking_ref}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{b.customer_name}</span>
                            <span className="text-[10px] text-slate-500">{b.customer_phone}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {b.vehicle?.brand} {b.vehicle?.model}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {b.start_date} → {b.end_date}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">{b.pickup_location}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{formatPrice(b.total_price)}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">{formatPrice(netAgency)}</td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">-{formatPrice(commission)}</td>
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
                        <td className="py-3.5 px-4 text-right">
                          <select
                            aria-label="Statut de la réservation"
                            value={b.status}
                            onChange={(e) => handleBookingStatus(b.id, e.target.value)}
                            className="text-xs p-1.5 rounded-lg border border-slate-200 font-semibold bg-white cursor-pointer"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
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

      </div>

      {/* ADD VEHICLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Ajouter un véhicule à votre flotte
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modèle *</label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Année</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Économique">Économique</option>
                    <option value="SUV">SUV</option>
                    <option value="Berline">Berline</option>
                    <option value="Luxe">Luxe</option>
                    <option value="7 places">7 places</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Boîte</label>
                  <select
                    value={newTransmission}
                    onChange={(e) => setNewTransmission(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="AUTOMATIC">Automatique</option>
                    <option value="MANUAL">Manuelle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numéro d’unité</label>
                  <input
                    type="text"
                    placeholder="Ex: Duster #003"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Immatriculation</label>
                  <input
                    type="text"
                    placeholder="Ex: 12345-A-50"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif jour (DH) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#02306B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Caution (DH)</label>
                  <input
                    type="number"
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white font-semibold shadow"
                >
                  Enregistrer & Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AGENCY BOOKING DETAIL MODAL */}
      <AgencyBookingDetailModal
        booking={selectedBookingForDetail}
        isOpen={Boolean(selectedBookingForDetail)}
        onClose={() => setSelectedBookingForDetail(null)}
        onStatusUpdated={() => setRefreshKey((prev) => prev + 1)}
      />

    </div>
  );
}
