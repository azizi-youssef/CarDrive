'use client';

import { useState, useEffect, type FormEvent } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { AccountProfileSettings } from '@/components/shared/AccountProfileSettings';
import { AgencyLogoUploader } from '@/components/agency/settings/AgencyLogoUploader';

export function AgencySettingsPanel({
  agencyId,
  canManage,
}: {
  agencyId: string;
  canManage: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    banner_url: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await fetch(`/api/agencies/${agencyId}/settings`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Impossible de charger les paramètres.');
        }
        const data = json.data;
        if (active) {
          setForm({
            name: data.name || '',
            logo_url: data.logo_url || '',
            banner_url: data.banner_url || '',
            description: data.description || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            city: data.city || '',
            address: data.address || '',
          });
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Impossible de charger les paramètres.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSettings();
    return () => {
      active = false;
    };
  }, [agencyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/agencies/${agencyId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la sauvegarde.');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E63946]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <AccountProfileSettings />
      <div>
        <h1 className="text-2xl font-bold text-[#0B1220]">Paramètres de l&apos;Agence</h1>
        <p className="text-sm text-slate-500">
          Coordonnées commerciales, adresse physique et informations publiques de votre agence.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Paramètres de l&apos;agence enregistrés avec succès.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Identité commerciale</h2>
          <p className="text-xs text-slate-500">Visible par les clients sur la marketplace CarDrive.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Nom commercial de l&apos;agence *
            </label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
            />
          </div>

          <AgencyLogoUploader
            agencyId={agencyId}
            agencyName={form.name}
            imageUrl={form.logo_url}
            disabled={!canManage}
            onUploaded={(logo_url) => setForm((current) => ({ ...current, logo_url }))}
          />

          <AgencyLogoUploader
            agencyId={agencyId}
            agencyName={form.name}
            imageUrl={form.banner_url}
            brandingType="banner"
            disabled={!canManage}
            onUploaded={(banner_url) => setForm((current) => ({ ...current, banner_url }))}
          />

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Ville principale *
            </label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Description / Présentation de l&apos;agence
          </label>
          <textarea
            rows={3}
            disabled={!canManage}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Présentez les services de votre agence, l'accueil, les options incluses..."
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
          />
        </div>

        <div className="border-b border-slate-100 pb-4 pt-2">
          <h2 className="text-base font-bold text-slate-900">Contact & Remise des véhicules</h2>
          <p className="text-xs text-slate-500">Utilisé pour les bons de réservation et notifications.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Téléphone d&apos;accueil *
            </label>
            <input
              type="text"
              required
              disabled={!canManage}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Numéro WhatsApp professionnel
            </label>
            <input
              type="text"
              disabled={!canManage}
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Email de contact
            </label>
            <input
              type="email"
              disabled={!canManage}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Adresse physique de l&apos;agence
          </label>
          <input
            type="text"
            disabled={!canManage}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ex: Bd Mohammed V, Nador..."
            className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-[#E63946] focus:outline-none"
          />
        </div>

        {canManage && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#E63946] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer les modifications
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
