'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  Trash2,
  Star,
  Loader2,
  Check,
  AlertCircle,
  Car,
  DollarSign,
  Camera,
  Layers,
} from 'lucide-react';
import {
  VEHICLE_CATEGORIES,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
  type VehicleCreateInput,
} from '@/lib/validations/vehicle';
import { cn } from '@/lib/utils';

export type EditableVehicle = {
  id?: string;
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
  weekly_price?: number | null;
  monthly_price?: number | null;
  deposit: number;
  min_rental_days: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'BLOCKED';
  published: boolean;
  license_plate?: string;
  unit_number?: string;
  images: string[];
  features: string[];
};

const COMMON_FEATURES = [
  'GPS / Navigation',
  'Bluetooth & USB',
  'Caméra de recul',
  'Régulateur de vitesse',
  'Apple CarPlay / Android Auto',
  'Radars de stationnement',
  'Sièges chauffants',
  'Toit ouvrant / Panoramique',
  'Démarrage sans clé',
  'Phares LED',
  'Fixation Isofix',
];

export function VehicleFormModal({
  agencyId,
  initialVehicle,
  onClose,
  onSuccess,
}: {
  agencyId: string;
  initialVehicle?: EditableVehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditableVehicle>(() => {
    if (initialVehicle) {
      return { ...initialVehicle };
    }
    return {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'Économique',
      transmission: 'MANUAL',
      fuel: 'DIESEL',
      seats: 5,
      doors: 5,
      air_conditioning: true,
      mileage: 15000,
      daily_price: 350,
      deposit: 3000,
      min_rental_days: 1,
      status: 'AVAILABLE',
      published: true,
      license_plate: '',
      unit_number: '',
      images: [],
      features: ['Bluetooth & USB', 'Climatisation'],
    };
  });

  useEffect(() => {
    if (initialVehicle) {
      setForm({ ...initialVehicle });
    }
  }, [initialVehicle]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFeature = (feat: string) => {
    setForm((prev) => {
      const exists = prev.features.includes(feat);
      return {
        ...prev,
        features: exists ? prev.features.filter((f) => f !== feat) : [...prev.features, feat],
      };
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]!);
    }
    if (form.id) {
      formData.append('vehicleId', form.id);
    }

    try {
      const res = await fetch(`/api/agencies/${agencyId}/vehicles/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du téléversement');
      }

      const newUrls = (data.data?.urls as string[]) || [];
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls],
      }));
    } catch (err: any) {
      setError(err.message || 'Échec du téléversement des images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const makePrimaryImage = (indexToPrimary: number) => {
    setForm((prev) => {
      const target = prev.images[indexToPrimary];
      if (!target) return prev;
      const rest = prev.images.filter((_, idx) => idx !== indexToPrimary);
      return { ...prev, images: [target, ...rest] };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (uploading) {
      setError('Veuillez patienter pendant la fin du téléversement de vos photos.');
      return;
    }

    if (!form.brand.trim() || !form.model.trim()) {
      setError('La marque et le modèle sont obligatoires.');
      setStep(1);
      return;
    }
    if (form.daily_price <= 0) {
      setError('Le tarif journalier doit être supérieur à 0.');
      setStep(2);
      return;
    }

    // Si l'utilisateur appuie sur Entrée lors des étapes 1 ou 2, avancer sans soumettre
    if (step < 3) {
      setStep((s) => (s + 1) as 2 | 3);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `/api/agencies/${agencyId}/vehicles/${form.id}`
        : `/api/agencies/${agencyId}/vehicles`;

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Impossible d\'enregistrer le véhicule.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT') {
      e.preventDefault();
      if (step < 3) {
        setStep((s) => (s + 1) as 2 | 3);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#0B1220] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E63946] text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {form.id ? `Modifier : ${form.brand} ${form.model}` : 'Ajouter un nouveau véhicule'}
              </h2>
              <p className="text-xs text-slate-300">
                Flotte CarDrive — Tarification certifiée & disponibilité
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 text-sm font-medium">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 pb-3 transition-colors',
              step === 1
                ? 'border-[#E63946] font-semibold text-[#0B1220]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                step === 1 ? 'bg-[#E63946] text-white' : 'bg-slate-200 text-slate-700'
              )}
            >
              1
            </span>
            Caractéristiques
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 pb-3 transition-colors',
              step === 2
                ? 'border-[#E63946] font-semibold text-[#0B1220]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                step === 2 ? 'bg-[#E63946] text-white' : 'bg-slate-200 text-slate-700'
              )}
            >
              2
            </span>
            Tarifs & Conditions
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 pb-3 transition-colors',
              step === 3
                ? 'border-[#E63946] font-semibold text-[#0B1220]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                step === 3 ? 'bg-[#E63946] text-white' : 'bg-slate-200 text-slate-700'
              )}
            >
              3
            </span>
            Photos & Publication
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="max-h-[65vh] overflow-y-auto p-6">
          {/* STEP 1: Specs */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Marque *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dacia, Renault, Peugeot..."
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#E63946] focus:outline-none focus:ring-1 focus:ring-[#E63946]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Modèle *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Duster, Clio 5, 208..."
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#E63946] focus:outline-none focus:ring-1 focus:ring-[#E63946]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Année *
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#E63946] focus:outline-none focus:ring-1 focus:ring-[#E63946]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Catégorie
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none"
                  >
                    {VEHICLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Transmission
                  </label>
                  <select
                    value={form.transmission}
                    onChange={(e) =>
                      setForm({ ...form, transmission: e.target.value as 'MANUAL' | 'AUTOMATIC' })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none"
                  >
                    <option value="MANUAL">Manuelle</option>
                    <option value="AUTOMATIC">Automatique</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Carburant
                  </label>
                  <select
                    value={form.fuel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fuel: e.target.value as 'DIESEL' | 'GASOLINE' | 'HYBRID' | 'ELECTRIC',
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#E63946] focus:outline-none"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="GASOLINE">Essence</option>
                    <option value="HYBRID">Hybride</option>
                    <option value="ELECTRIC">Électrique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Places
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="9"
                    value={form.seats}
                    onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Portes
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="5"
                    value={form.doors}
                    onChange={(e) => setForm({ ...form, doors: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Kilométrage actuel
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.mileage}
                    onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Immatriculation
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 54321-A-50"
                    value={form.license_plate ?? ''}
                    onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Équipements & Options
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_FEATURES.map((feat) => {
                    const active = form.features.includes(feat);
                    return (
                      <button
                        type="button"
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          active
                            ? 'border-[#E63946] bg-red-50 text-[#E63946]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Prix par jour (MAD) *
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      required
                      min="50"
                      value={form.daily_price}
                      onChange={(e) => setForm({ ...form, daily_price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-16 text-lg font-bold text-[#0B1220] focus:border-[#E63946] focus:outline-none focus:ring-1 focus:ring-[#E63946]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-semibold text-slate-400">
                      DH / jour
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Tarif de base appliqué pour chaque jour de location sur la plateforme.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Caution exigée (MAD) *
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      value={form.deposit}
                      onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-16 text-lg font-bold text-[#0B1220] focus:border-[#E63946] focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-semibold text-slate-400">
                      DH
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Montant de la préautorisation carte bancaire ou chèque de garantie à la remise
                    des clés.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Durée minimale (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.min_rental_days}
                    onChange={(e) => setForm({ ...form, min_rental_days: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Prix semaine (Optionnel)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto calculé si vide"
                    value={form.weekly_price ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weekly_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Prix mensuel (Optionnel)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto calculé si vide"
                    value={form.monthly_price ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        monthly_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Images & Publishing */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Image Uploader */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Photos du véhicule (Supabase Storage)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={(e) => void handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 transition-colors hover:border-[#E63946] hover:bg-red-50/20"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[#E63946]" />
                      <p className="text-sm font-medium text-slate-600">
                        Téléversement vers Supabase Storage...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[#E63946]">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        Cliquez ou glissez-déposez des photos ici
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Formats acceptés : JPG, PNG, WebP (max 10 Mo par photo)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Warning when no images */}
              {form.images.length === 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Aucune photo ajoutée pour l&apos;instant</p>
                    <p className="mt-0.5 text-amber-700">
                      Ajoutez au moins 1 photo pour que votre véhicule soit présenté avec son visuel réel sur la marketplace CarDrive.
                    </p>
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {form.images.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Photos ajoutées ({form.images.length}) — La première photo est la photo principale
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {form.images.map((imgUrl, idx) => (
                      <div
                        key={imgUrl}
                        className={cn(
                          'group relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-slate-100',
                          idx === 0 ? 'border-[#E63946]' : 'border-slate-200'
                        )}
                      >
                        <Image
                          src={imgUrl}
                          alt="Véhicule"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {idx === 0 && (
                          <span className="absolute left-2 top-2 rounded-md bg-[#E63946] px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                            Principale
                          </span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/50 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => makePrimaryImage(idx)}
                              title="Définir comme photo principale"
                              className="rounded-lg bg-white/90 p-1.5 text-amber-600 hover:bg-white"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            title="Supprimer la photo"
                            className="rounded-lg bg-white/90 p-1.5 text-red-600 hover:bg-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publication Settings */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Publier immédiatement sur la marketplace
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rend le véhicule visible par les clients lors des recherches sur CarDrive.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(e) => setForm({ ...form, published: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-300 peer-checked:bg-[#E63946] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Précédent
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="rounded-xl bg-[#0B1220] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1E293B]"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={busy || uploading}
                  className="flex items-center gap-2 rounded-xl bg-[#E63946] px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
                >
                  {busy || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {uploading
                    ? 'Téléversement en cours...'
                    : busy
                    ? 'Enregistrement...'
                    : form.id
                    ? 'Enregistrer les modifications'
                    : 'Créer et enregistrer'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
