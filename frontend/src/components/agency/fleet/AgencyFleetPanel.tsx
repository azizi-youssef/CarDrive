'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Car,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Fuel,
  Gauge,
  Sparkles,
  Camera,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { VehicleFormModal, type EditableVehicle } from './VehicleFormModal';
import { FleetCapacityCard } from '../subscription/FleetCapacityCard';
import { AgencySubscriptionModal } from '../subscription/AgencySubscriptionModal';
import type { AgencySubscription, SubscriptionPlan } from '@/types';

export type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: 'MANUAL' | 'AUTOMATIC';
  fuel: 'DIESEL' | 'GASOLINE' | 'HYBRID' | 'ELECTRIC';
  seats: number;
  doors: number;
  air_conditioning: boolean;
  mileage: number;
  daily_price: number;
  deposit: number;
  min_rental_days: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'BLOCKED';
  published: boolean;
  license_plate?: string;
  unit_number?: string;
  images: string[];
  features: string[];
  created_at: string;
};

export function AgencyFleetPanel({
  agencyId,
  canManage,
  onOpenCalendar,
}: {
  agencyId: string;
  canManage: boolean;
  onOpenCalendar?: (vehicleId?: string) => void;
}) {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [editingVehicle, setEditingVehicle] = useState<EditableVehicle | null | 'new'>(null);
  const [blockingVehicle, setBlockingVehicle] = useState<VehicleRow | null>(null);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('Indisponibilité manuelle');
  const [blockType, setBlockType] = useState<'BLOCKED' | 'MAINTENANCE'>('BLOCKED');
  const [blockingBusy, setBlockingBusy] = useState(false);
  const [blockingError, setBlockingError] = useState<string | null>(null);
  const [uploadingVehicleId, setUploadingVehicleId] = useState<string | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<AgencySubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const loadSubscription = useCallback(async () => {
    try {
      setSubLoading(true);
      const [subRes, plansRes] = await Promise.all([
        fetch(`/api/agencies/${agencyId}/subscription`),
        fetch('/api/subscriptions/plans'),
      ]);
      const subJson = await subRes.json();
      const plansJson = await plansRes.json();

      if (subJson.success && subJson.data) {
        setSubscription(subJson.data);
      }
      if (plansJson.success && plansJson.data) {
        setPlans(plansJson.data);
      }
    } catch (err) {
      console.warn('Could not load subscription data:', err);
    } finally {
      setSubLoading(false);
    }
  }, [agencyId]);

  const handleDirectPhotoUpload = async (vehicleId: string, file: File | null) => {
    if (!file) return;
    setUploadingVehicleId(vehicleId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleId', vehicleId);

      const res = await fetch(`/api/agencies/${agencyId}/vehicles/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Échec du téléversement de la photo');
      }
      await loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du téléversement de la photo.');
    } finally {
      setUploadingVehicleId(null);
    }
  };

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '12',
        q: search,
        sort,
      });
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/agencies/${agencyId}/vehicles?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors du chargement des véhicules.');
      }
      setVehicles(json.data ?? []);
      setTotalPages(json.meta?.totalPages ?? 1);
      setTotalCount(json.meta?.total ?? 0);
    } catch (err: any) {
      setError(err.message || 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  }, [agencyId, page, search, category, status, sort]);

  useEffect(() => {
    void loadVehicles();
    void loadSubscription();
  }, [loadVehicles, loadSubscription]);

  const togglePublish = async (vehicle: VehicleRow) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !vehicle.published }),
      });
      if (!res.ok) throw new Error('Échec de la mise à jour');
      void loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour de la publication');
    }
  };

  const deleteVehicle = async (vehicle: VehicleRow) => {
    if (!canManage) return;
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ou archiver le véhicule ${vehicle.brand} ${vehicle.model} ?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la suppression');
      void loadVehicles();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingVehicle) return;
    setBlockingBusy(true);
    setBlockingError(null);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles/${blockingVehicle.id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: blockStartDate,
          end_date: blockEndDate,
          type: blockType,
          reason: blockReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible de bloquer cette période.');
      }
      setBlockingVehicle(null);
      void loadVehicles();
    } catch (err: any) {
      setBlockingError(err.message);
    } finally {
      setBlockingBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1220]">Flotte de véhicules</h1>
          <p className="text-sm text-slate-500">
            {totalCount} véhicule{totalCount > 1 ? 's' : ''} enregistré{totalCount > 1 ? 's' : ''} au
            catalogue de votre agence.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              if (subscription?.is_at_capacity) {
                setUpgradeModalOpen(true);
              } else {
                setEditingVehicle('new');
              }
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition',
              subscription?.is_at_capacity
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-[#E63946] hover:bg-red-700 text-white'
            )}
            title={
              subscription?.is_at_capacity
                ? 'Capacité maximale atteinte pour votre forfait'
                : 'Ajouter un véhicule'
            }
          >
            <Plus className="h-4 w-4" />
            {subscription?.is_at_capacity ? 'Augmenter le forfait' : 'Ajouter un véhicule'}
          </button>
        )}
      </div>

      {/* Subscription Fleet Capacity Card */}
      <FleetCapacityCard
        subscription={subscription}
        loading={subLoading}
        onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par marque, modèle, plaque..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm focus:border-[#E63946] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E63946]"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#E63946] focus:outline-none"
        >
          <option value="all">Toutes les catégories</option>
          <option value="Économique">Économique</option>
          <option value="SUV">SUV</option>
          <option value="Berline">Berline</option>
          <option value="Luxe">Luxe</option>
          <option value="7 places">7 places</option>
          <option value="Automatique">Automatique</option>
          <option value="Citadine">Citadine</option>
          <option value="Compacte">Compacte</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#E63946] focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="RENTED">En location</option>
          <option value="MAINTENANCE">En maintenance</option>
          <option value="BLOCKED">Bloqué</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#E63946] focus:outline-none"
        >
          <option value="created_at">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="year_desc">Année récente</option>
        </select>

        <button
          type="button"
          onClick={() => void loadVehicles()}
          title="Actualiser la liste"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Vehicles */}
      {loading && vehicles.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Car className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Aucun véhicule trouvé</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {search || category !== 'all' || status !== 'all'
              ? 'Essayez de modifier vos filtres ou termes de recherche.'
              : 'Commencez par ajouter votre premier véhicule pour le proposer sur la marketplace.'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setEditingVehicle('new')}
              className="mt-4 rounded-xl bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ajouter un véhicule
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => {
            const mainImg = v.images[0] || null;
            return (
              <div
                key={v.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* Image & Badges Header */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                  {mainImg ? (
                    <Image
                      src={mainImg}
                      alt={`${v.brand} ${v.model}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-4 text-center text-slate-400">
                      <Car className="mb-1 h-10 w-10 text-slate-300" />
                      {canManage && (
                        <label className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-[#E63946] hover:text-[#E63946]">
                          <Camera className="h-3.5 w-3.5 text-[#E63946]" />
                          <span>Ajouter une photo</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            disabled={uploadingVehicleId === v.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) void handleDirectPhotoUpload(v.id, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Direct Camera Button (Top Right) */}
                  {canManage && (
                    <label
                      title="Téléverser ou modifier la photo directement"
                      className={cn(
                        'absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-black/60 text-white shadow-xs backdrop-blur-md transition hover:bg-[#E63946]',
                        uploadingVehicleId === v.id && 'pointer-events-none opacity-80'
                      )}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingVehicleId === v.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) void handleDirectPhotoUpload(v.id, file);
                          e.target.value = '';
                        }}
                      />
                      {uploadingVehicleId === v.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </label>
                  )}

                  {/* Status Badges */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-semibold backdrop-blur-md shadow-xs',
                        v.status === 'AVAILABLE' && 'bg-emerald-600/90 text-white',
                        v.status === 'RENTED' && 'bg-blue-600/90 text-white',
                        v.status === 'MAINTENANCE' && 'bg-amber-600/90 text-white',
                        v.status === 'BLOCKED' && 'bg-slate-700/90 text-white'
                      )}
                    >
                      {v.status === 'AVAILABLE' && 'Disponible'}
                      {v.status === 'RENTED' && 'En location'}
                      {v.status === 'MAINTENANCE' && 'Maintenance'}
                      {v.status === 'BLOCKED' && 'Bloqué'}
                    </span>
                    {!v.published && (
                      <span className="rounded-lg bg-red-600/90 px-2 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-md">
                        Non publié
                      </span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                    {v.category}
                  </div>
                </div>

                {/* Content Details */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {v.brand} {v.model}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {v.year} • {v.license_plate || v.unit_number || 'Immat. non renseignée'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[#E63946]">
                        {formatPrice(v.daily_price)}
                      </span>
                      <span className="text-xs text-slate-500"> / jour</span>
                    </div>
                  </div>

                  {/* Specs Quick Pill */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2 py-1">
                      {v.transmission === 'AUTOMATIC' ? 'Automatique' : 'Manuelle'}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1">{v.fuel}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1">
                      {v.mileage.toLocaleString()} km
                    </span>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingVehicle(v)}
                            title="Modifier les informations"
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePublish(v)}
                            title={v.published ? 'Retirer de la marketplace' : 'Publier le véhicule'}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                          >
                            {v.published ? (
                              <EyeOff className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-emerald-600" />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setBlockingVehicle(v);
                          setBlockStartDate(new Date().toISOString().split('T')[0]!);
                          const tmrw = new Date();
                          tmrw.setDate(tmrw.getDate() + 2);
                          setBlockEndDate(tmrw.toISOString().split('T')[0]!);
                        }}
                        title="Bloquer des dates"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => void deleteVehicle(v)}
                        title="Archiver / Supprimer le véhicule"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
          <p className="text-slate-500">
            Page {page} sur {totalPages} ({totalCount} véhicules)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingVehicle && (
        <VehicleFormModal
          agencyId={agencyId}
          initialVehicle={editingVehicle === 'new' ? null : editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={() => {
            setEditingVehicle(null);
            void loadVehicles();
            void loadSubscription();
          }}
        />
      )}

      {/* Subscription Upgrade Modal */}
      {subscription && (
        <AgencySubscriptionModal
          agencyId={agencyId}
          subscription={subscription}
          plans={plans}
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          onSuccess={(updatedSub) => {
            setSubscription(updatedSub);
            void loadVehicles();
          }}
        />
      )}

      {/* Quick Availability Block Modal */}
      {blockingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Bloquer une période — {blockingVehicle.brand} {blockingVehicle.model}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Empêche les clients de réserver ce véhicule sur la plage de dates sélectionnée.
            </p>

            {blockingError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {blockingError}
              </div>
            )}

            <form onSubmit={handleCreateBlock} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Type</label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as 'BLOCKED' | 'MAINTENANCE')}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm"
                >
                  <option value="BLOCKED">Indisponibilité / Réservé hors plateforme</option>
                  <option value="MAINTENANCE">Maintenance technique / Révision</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Date début</label>
                  <input
                    type="date"
                    required
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Date fin</label>
                  <input
                    type="date"
                    required
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Motif</label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Révision garage, client direct..."
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockingVehicle(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={blockingBusy}
                  className="flex items-center gap-2 rounded-xl bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {blockingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirmer le blocage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
