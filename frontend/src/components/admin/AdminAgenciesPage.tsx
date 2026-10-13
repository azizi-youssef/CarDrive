'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Eye, ImageUp, Loader2, Plus, Search, ShieldCheck, X } from 'lucide-react';
import type { AgencyStatus } from '@cardrive/shared';
import { formatPrice } from '@/lib/utils';

type AgencyRow = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  status: AgencyStatus;
  verified: boolean;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  member_count?: number;
  vehicle_count?: number;
  booking_count?: number;
};
type HistoryEntry = { action: string; entity_type: string; created_at: string; result: string };
type AgencyDetail = AgencyRow & {
  description: string;
  latitude: number | null;
  longitude: number | null;
  logo_url: string;
  banner_url: string | null;
  member_count: number;
  vehicle_count: number;
  booking_count: number;
  customer_count: number;
  total_volume: number;
  platform_commission: number;
  last_activity_at: string | null;
  recent_history: HistoryEntry[];
  members: { id: string; full_name: string; email: string; role: string; status: string }[];
  vehicles: { id: string; brand: string; model: string; status: string }[];
  bookings: { id: string; booking_ref: string; reference: string | null; status: string; start_date: string; end_date: string }[];
};
type ListMeta = { page: number; pageSize: number; total: number; totalPages: number };
type FormValues = {
  name: string; slug: string; description: string; phone: string; whatsapp: string;
  email: string; address: string; city: string; latitude: string; longitude: string;
  logo_url: string; banner_url: string;
};
const EMPTY_FORM: FormValues = {
  name: '', slug: '', description: '', phone: '', whatsapp: '', email: '',
  address: '', city: '', latitude: '', longitude: '', logo_url: '', banner_url: '',
};
const statusLabel: Record<string, string> = {
  PENDING: 'En attente', ACTIVE: 'Active', SUSPENDED: 'Suspendue', REJECTED: 'Refusée', ARCHIVED: 'Archivée',
};
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#02306B] focus:ring-2 focus:ring-blue-100';
const actionsLabel: Record<string, string> = {
  'agency.created': 'Agence créée',
  'agency.archived': 'Agence archivée',
  'agency.status_changed': 'Statut modifié',
  'agency.updated': 'Informations modifiées',
  'member.invited': 'Collaborateur invité',
  'member.revoked': 'Accès révoqué',
  'member.role_changed': 'Rôle modifié',
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', ...init });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok || !body || typeof body !== 'object' || !('success' in body) || body.success !== true) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error : `Erreur HTTP ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function agencyForm(agency?: Partial<AgencyDetail> | AgencyRow): FormValues {
  if (!agency) return EMPTY_FORM;
  return {
    name: agency.name ?? '', slug: agency.slug ?? '', description: 'description' in agency ? agency.description ?? '' : '',
    phone: agency.phone ?? '', whatsapp: agency.whatsapp ?? '', email: agency.email ?? '',
    address: agency.address ?? '', city: agency.city ?? '',
    latitude: 'latitude' in agency && agency.latitude != null ? String(agency.latitude) : '',
    longitude: 'longitude' in agency && agency.longitude != null ? String(agency.longitude) : '',
    logo_url: 'logo_url' in agency ? agency.logo_url ?? '' : '',
    banner_url: 'banner_url' in agency ? agency.banner_url ?? '' : '',
  };
}

export default function AdminAgenciesPage() {
  const [rows, setRows] = useState<AgencyRow[]>([]);
  const [meta, setMeta] = useState<ListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('created_at');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgencyRow | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<AgencyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncingLogos, setSyncingLogos] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page), pageSize: '15', status, sort, direction, q: query,
    });
    try {
      const result = await api<{ data: AgencyRow[]; meta: ListMeta }>(
        `/api/admin/agencies?${params.toString()}`,
        { signal }
      );
      setRows(result.data);
      setMeta(result.meta);
    } catch (cause) {
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les agences.');
      setRows([]);
      setMeta(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [direction, page, query, sort, status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setValues(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (agency: AgencyRow) => {
    setEditing(agency);
    setValues(agencyForm(agency));
    setFormOpen(true);
  };

  const showDetail = async (agency: AgencyRow) => {
    setDetail(null);
    setDetailLoading(true);
    setError(null);
    try {
      const result = await api<{ data: AgencyDetail }>(`/api/admin/agencies/${encodeURIComponent(agency.id)}`);
      setDetail(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger le détail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const saveAgency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const payload = {
      ...values,
      latitude: values.latitude ? Number(values.latitude) : null,
      longitude: values.longitude ? Number(values.longitude) : null,
    };
    try {
      await api(editing ? `/api/admin/agencies/${encodeURIComponent(editing.id)}` : '/api/admin/agencies', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setFormOpen(false);
      setNotice({ kind: 'success', message: editing ? 'Agence mise à jour.' : 'Agence créée en attente de validation.' });
      await load();
    } catch (cause) {
      setNotice({ kind: 'error', message: cause instanceof Error ? cause.message : 'Enregistrement impossible.' });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (agency: AgencyRow) => {
    const nextStatus = agency.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const question = nextStatus === 'ACTIVE'
      ? `Réactiver l’agence « ${agency.name} » ?`
      : `Suspendre l’agence « ${agency.name} » ?`;
    if (!window.confirm(question)) return;
    setBusyId(agency.id);
    try {
      await api(`/api/admin/agencies/${encodeURIComponent(agency.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, verified: nextStatus === 'ACTIVE' }),
      });
      setNotice({ kind: 'success', message: nextStatus === 'ACTIVE' ? 'Agence activée.' : 'Agence suspendue.' });
      await load();
    } catch (cause) {
      setNotice({ kind: 'error', message: cause instanceof Error ? cause.message : 'Modification du statut impossible.' });
    } finally {
      setBusyId(null);
    }
  };

  const archiveAgency = async (agency: AgencyRow) => {
    if (!window.confirm(`Archiver « ${agency.name} » ? Les réservations et la comptabilité seront conservées.`)) return;
    const confirmationName = window.prompt(`Tapez exactement le nom de l’agence : ${agency.name}`);
    if (confirmationName === null) return;
    setBusyId(agency.id);
    try {
      await api(`/api/admin/agencies/${encodeURIComponent(agency.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationName }),
      });
      setNotice({ kind: 'success', message: 'Agence archivée sans suppression des données historiques.' });
      await load();
    } catch (cause) {
      setNotice({ kind: 'error', message: cause instanceof Error ? cause.message : 'Archivage impossible.' });
    } finally {
      setBusyId(null);
    }
  };

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  };

  const syncBundledLogos = async () => {
    setSyncingLogos(true);
    setNotice(null);
    try {
      const result = await api<{ data: { saved: number; skipped: number } }>(
        '/api/admin/agencies/sync-logos',
        { method: 'POST' }
      );
      setNotice({
        kind: 'success',
        message: `${result.data.saved} logo(s) enregistré(s) en base; ${result.data.skipped} déjà configuré(s).`,
      });
      await load();
    } catch (cause) {
      setNotice({
        kind: 'error',
        message: cause instanceof Error ? cause.message : 'Impossible de synchroniser les logos.',
      });
    } finally {
      setSyncingLogos(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F3F5F7] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[#02306B]"><ArrowLeft className="h-4 w-4" />Retour à l’administration</Link>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold"><Building2 className="h-6 w-6" />Gestion centralisée des agences</h1>
            <p className="mt-1 text-sm text-slate-500">Validation, coordonnées, accès, activité et archivage non destructif.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void syncBundledLogos()} disabled={syncingLogos} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50">
              {syncingLogos ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
              Enregistrer les logos disponibles
            </button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#02306B] px-4 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Créer une agence</button>
          </div>
        </div>
        {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${notice.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice.message}</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        <form onSubmit={applySearch} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="sm:col-span-2"><label htmlFor="agency-search" className="mb-1 block text-xs font-semibold">Recherche</label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="agency-search" className={`${inputClass} pl-9`} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Nom, e-mail, téléphone, ville" maxLength={120} /></div></div>
          <div><label htmlFor="agency-status" className="mb-1 block text-xs font-semibold">Statut</label><select id="agency-status" className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="ALL">Tous les statuts</option><option value="PENDING">En attente</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspendue</option><option value="REJECTED">Refusée</option><option value="ARCHIVED">Archivée</option></select></div>
          <div><label htmlFor="agency-sort" className="mb-1 block text-xs font-semibold">Trier par</label><select id="agency-sort" className={inputClass} value={sort} onChange={(event) => setSort(event.target.value)}><option value="created_at">Date de création</option><option value="name">Nom</option><option value="status">Statut</option></select></div>
          <div className="flex gap-2"><button type="submit" className="flex-1 rounded-xl bg-[#02306B] px-4 py-2.5 text-sm font-semibold text-white">Rechercher</button><button type="button" className="rounded-xl border border-slate-200 px-3" aria-label="Inverser le sens du tri" onClick={() => setDirection((current) => current === 'asc' ? 'desc' : 'asc')}>{direction === 'asc' ? '↑' : '↓'}</button></div>
        </form>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          {loading ? <p className="flex items-center gap-2 p-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Chargement des agences…</p> : rows.length === 0 ? <p className="p-8 text-sm text-slate-500">Aucune agence pour ces critères.</p> : <table className="w-full min-w-[1000px] text-left text-sm">
            <caption className="sr-only">Liste paginée des agences CarDrive</caption>
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Agence</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Membres</th><th className="px-4 py-3">Véhicules</th><th className="px-4 py-3">Réservations</th><th className="px-4 py-3">Créée le</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.map((agency) => <tr key={agency.id}>
              <td className="px-4 py-3"><p className="font-semibold">{agency.name}</p><p className="text-xs text-slate-500">{agency.city} · /{agency.slug}</p></td>
              <td className="px-4 py-3"><p>{agency.email}</p><p className="text-xs text-slate-500">{agency.phone}</p></td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${agency.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : agency.status === 'PENDING' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{statusLabel[agency.archived_at ? 'ARCHIVED' : agency.status] ?? agency.status}</span>{agency.verified && <span className="ml-1 inline-flex" title="Vérifiée"><ShieldCheck className="h-4 w-4 text-emerald-700" /></span>}</td>
              <td className="px-4 py-3">{agency.member_count ?? 0}</td><td className="px-4 py-3">{agency.vehicle_count ?? 0}</td><td className="px-4 py-3">{agency.booking_count ?? 0}</td><td className="px-4 py-3">{dateLabel(agency.created_at)}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-1">
                <button type="button" aria-label={`Détail ${agency.name}`} title="Détail" className="rounded-lg p-2 text-[#02306B] hover:bg-blue-50" onClick={() => void showDetail(agency)}><Eye className="h-4 w-4" /></button>
                <button type="button" aria-label={`Modifier ${agency.name}`} title="Modifier" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100" onClick={() => openEdit(agency)}>✎</button>
                {!agency.archived_at && <button type="button" disabled={busyId === agency.id} className="rounded-lg px-2 py-2 text-xs font-semibold text-[#02306B] hover:bg-blue-50 disabled:opacity-50" onClick={() => void changeStatus(agency)}>{busyId === agency.id ? '…' : agency.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}</button>}
                {!agency.archived_at && <button type="button" disabled={busyId === agency.id} className="rounded-lg px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={() => void archiveAgency(agency)}>Archiver</button>}
              </div></td>
            </tr>)}</tbody>
          </table>}
          {meta && <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm"><span className="text-slate-500">{meta.total} agence{meta.total > 1 ? 's' : ''} · page {meta.page}/{Math.max(1, meta.totalPages)}</span><div className="flex gap-2"><button type="button" aria-label="Page précédente" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Page suivante" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </div>
      </div>

      {formOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"><section role="dialog" aria-modal="true" aria-labelledby="agency-form-title" className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between"><h2 id="agency-form-title" className="text-lg font-bold">{editing ? 'Modifier l’agence' : 'Créer une agence'}</h2><button type="button" aria-label="Fermer" onClick={() => setFormOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <form onSubmit={saveAgency} className="mt-4 grid gap-4 sm:grid-cols-2">
          {([
            ['name', 'Nom de l’agence', 'text'], ['slug', 'Slug', 'text'], ['email', 'E-mail', 'email'],
            ['phone', 'Téléphone', 'tel'], ['whatsapp', 'WhatsApp', 'tel'], ['city', 'Ville', 'text'],
            ['address', 'Adresse', 'text'], ['latitude', 'Latitude', 'number'], ['longitude', 'Longitude', 'number'],
            ['logo_url', 'URL du logo', 'url'], ['banner_url', 'URL de la bannière', 'url'],
          ] as const).map(([field, label, type]) => <div key={field}><label htmlFor={`agency-${field}`} className="mb-1 block text-sm font-semibold">{label}</label><input id={`agency-${field}`} type={type} required={!['latitude', 'longitude', 'logo_url', 'banner_url'].includes(field)} min={type === 'number' ? field === 'latitude' ? -90 : -180 : undefined} max={type === 'number' ? field === 'latitude' ? 90 : 180 : undefined} step={type === 'number' ? 'any' : undefined} className={inputClass} value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} maxLength={field === 'email' ? 254 : 240} /></div>)}
          <div className="sm:col-span-2"><label htmlFor="agency-description" className="mb-1 block text-sm font-semibold">Description</label><textarea id="agency-description" rows={3} maxLength={2000} className={inputClass} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} /></div>
          {notice?.kind === 'error' && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{notice.message}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" onClick={() => setFormOpen(false)}>Annuler</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#02306B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Enregistrer' : 'Créer en attente'}</button></div>
        </form>
      </section></div>}

      {(detail || detailLoading) && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><aside role="dialog" aria-modal="true" aria-labelledby="agency-detail-title" className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#02306B]">Détail de l’agence</p><h2 id="agency-detail-title" className="mt-1 text-xl font-bold">{detail?.name ?? 'Chargement…'}</h2></div><button type="button" aria-label="Fermer le détail" onClick={() => setDetail(null)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        {detailLoading ? <p className="py-8 text-sm text-slate-500">Chargement des indicateurs…</p> : detail && <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[['Membres', detail.member_count], ['Véhicules', detail.vehicle_count], ['Réservations', detail.booking_count], ['Clients', detail.customer_count], ['Volume', formatPrice(detail.total_volume)], ['Commission', formatPrice(detail.platform_commission)]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}</div>
          <p className="text-sm text-slate-500">Créée le {dateLabel(detail.created_at)} · Dernière activité {dateLabel(detail.last_activity_at)}</p>
          <section><h3 className="font-bold">Membres récents</h3>{detail.members.length ? <ul className="mt-2 divide-y divide-slate-100">{detail.members.map((member) => <li key={member.id} className="flex justify-between gap-3 py-2 text-sm"><span>{member.full_name || member.email} <small className="text-slate-500">{member.email}</small></span><span className="text-xs text-slate-500">{member.role} · {member.status}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Aucun membre.</p>}</section>
          <section><h3 className="font-bold">Véhicules récents</h3><ul className="mt-2 divide-y divide-slate-100">{detail.vehicles.map((vehicle) => <li key={vehicle.id} className="flex justify-between py-2 text-sm"><span>{vehicle.brand} {vehicle.model}</span><span className="text-slate-500">{vehicle.status}</span></li>)}</ul></section>
          <section><h3 className="font-bold">Réservations récentes</h3><ul className="mt-2 divide-y divide-slate-100">{detail.bookings.map((booking) => <li key={booking.id} className="flex justify-between gap-3 py-2 text-sm"><span>{booking.reference || booking.booking_ref} · {booking.start_date} – {booking.end_date}</span><span className="text-slate-500">{booking.status}</span></li>)}</ul></section>
          <section><h3 className="font-bold">Historique</h3><ul className="mt-2 divide-y divide-slate-100">{detail.recent_history.map((entry, index) => <li key={`${entry.created_at}-${index}`} className="flex justify-between gap-3 py-2 text-sm"><span>{actionsLabel[entry.action] ?? entry.action}</span><time className="text-xs text-slate-500">{dateLabel(entry.created_at)}</time></li>)}</ul></section>
        </div>}
      </aside></div>}
    </main>
  );
}
