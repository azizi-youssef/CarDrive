'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2, Car, Calendar, CheckCircle2, XCircle, Clock, Plus, Trash2, Edit, Search,
  Eye, X, Download, LogOut, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import { fetchClientAuthProfile, signOutEverywhere, type ClientAuthProfile } from '@/lib/auth/client';
import { canManageAgencyFleet, canManageAgencyBookings } from '@/lib/auth/portals';
import { canPerformAgencyBookingAction } from '@cardrive/shared';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api/client';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { MeetingPointBadge } from '@/components/booking/MeetingPointBadge';
import type { Vehicle, Booking, VehicleCategory, TransmissionType, FuelType } from '@/types';
import AgencyAccessPanel from '@/components/agency/AgencyAccessPanel';
import {
  DashboardError, OperationLocks, RequestGeneration, assertSuccess, awaitAbortable,
  bookingReference, canAccessAgency, decodeAgencies, decodeBookings, decodeFleet, decodeStats,
  emptyVehicleForm, normalizeSearch, paginate, readJsonResponse, resolveAmounts, safeImageUrl,
  validateVehicleForm, vehiclePatch, vehicleToForm, vehicleWriteFields,
  type AgencyView, type BookingView, type StatsView, type VehicleView,
  type VehicleForm, type VehicleFormErrors, type VehicleOptions
} from './agency-dashboard.logic';

type Option<T extends string> = { value: T; label: string };
type BookingAction = 'approve' | 'reject';
type Tab = 'overview' | 'fleet' | 'bookings' | 'access';
type Notice = { id: number; kind: 'success' | 'error'; message: string };
type ModalNotice = Pick<Notice, 'kind' | 'message'>;
type Confirmation = {
  title: string; message: string; label: string; destructive: boolean; requireReason?: boolean;
  target: { kind: 'booking'; id: string; action: BookingAction } | { kind: 'delete'; id: string }
  | { kind: 'status'; id: string; from: string; to: string };
};

/** Populate only after reviewing the actual API, enum definitions and server authorization. */
export interface DashboardContracts {
  serverAuthorizationReviewed?: boolean;
  bookingStatuses?: readonly Booking['status'][];
  vehicleForm?: {
    categories: readonly Option<VehicleCategory>[];
    transmissions: readonly Option<TransmissionType>[];
    fuels: readonly Option<FuelType>[];
    minYear: number;
    maxYear: number;
    createDraft?: { status: Vehicle['status'] };
    supportsPatchFields?: boolean;
  };
  vehicleStatusTransitions?: readonly {
    from: Vehicle['status']; to: Vehicle['status']; label: string;
  }[];
}

export interface AgencyDemoData {
  agencies: readonly unknown[];
  resources: Readonly<Record<string, {
    stats: unknown; vehicles: readonly unknown[]; bookings: readonly unknown[];
  }>>;
}

export interface AgencyDashboardProps {
  mode?: 'production' | 'demo';
  contracts?: DashboardContracts;
  demoData?: AgencyDemoData;
}

const NO_CONTRACTS: DashboardContracts = {};
const NOOP = () => undefined;
const primaryBase = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${primaryBase} bg-[#02306B] hover:bg-[#064181] focus-visible:outline-[#02306B]`;
const danger = `${primaryBase} bg-red-700 hover:bg-red-800 focus-visible:outline-red-700`;
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02306B] disabled:cursor-not-allowed disabled:opacity-50';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#02306B] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500';

function errorMessage(error: unknown): string {
  if (error instanceof DashboardError) return error.message;
  return 'Connexion interrompue. Actualisez les données ; le résultat d’une opération peut être incertain.';
}

function isAccessError(error: unknown): boolean {
  return error instanceof DashboardError && (error.status === 401 || error.status === 403);
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  return readJsonResponse(await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal }));
}

interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  updatedAt: Date | null;
}

function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>, revision: number, onAccessLost: (message: string) => void,
): Resource<T> {
  const [state, setState] = useState<Resource<T>>({ data: null, error: null, loading: true, updatedAt: null });
  const generations = useRef(new RequestGeneration());
  useEffect(() => {
    const controller = new AbortController();
    const token = generations.current.next();
    const generation = generations.current;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
    setState((previous) => ({ ...previous, loading: true, error: null }));
    void awaitAbortable(load(controller.signal), controller.signal).then((data: T) => {
      if (generation.isCurrent(token) && !controller.signal.aborted) {
        setState({ data, error: null, loading: false, updatedAt: new Date() });
      }
    }).catch((error: unknown) => {
      if (!generation.isCurrent(token)) return;
      if (controller.signal.aborted && !timedOut) return;
      const message = timedOut ? 'Le chargement a dépassé 20 secondes. Réessayez.' : errorMessage(error);
      setState((previous) => ({ ...previous, data: isAccessError(error) ? null : previous.data, error: message, loading: false }));
      if (isAccessError(error)) onAccessLost(message);
    }).finally(() => window.clearTimeout(timeout));
    return () => {
      generation.invalidate();
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [load, revision, onAccessLost]);
  return state;
}

export default function AgencyDashboard({ mode = 'production', contracts = NO_CONTRACTS, demoData }: AgencyDashboardProps) {
  return mode === 'demo'
    ? <DemoDashboard demoData={demoData} />
    : <ProductionDashboard contracts={contracts} />;
}

function ProductionDashboard({ contracts }: { contracts: DashboardContracts }) {
  const [bootstrapRevision, setBootstrapRevision] = useState(0);
  const [state, setState] = useState<{
    loading: boolean; profile: ClientAuthProfile | null; agencies: AgencyView[]; error: string | null;
  }>({ loading: true, profile: null, agencies: [], error: null });
  const [signingOut, setSigningOut] = useState(false);
  const signOutLock = useRef(false);
  const authGeneration = useRef(new RequestGeneration());
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    const generation = authGeneration.current;
    return () => { alive.current = false; generation.invalidate(); };
  }, []);

  const onAccessLost = useCallback((message: string) => {
    authGeneration.current.invalidate();
    setState({ loading: false, profile: null, agencies: [], error: message });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const generation = authGeneration.current;
    const token = generation.next();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setState({ loading: true, profile: null, agencies: [], error: null });
    async function bootstrap() {
      try {
        const profile = await awaitAbortable(fetchClientAuthProfile(), controller.signal);
        if (!generation.isCurrent(token) || controller.signal.aborted) return;
        if (!profile) throw new DashboardError('Connectez-vous pour accéder au portail agence.', 401);
        if (typeof profile.role !== 'string' || !profile.role.trim() || !Array.isArray(profile.agencyIds) ||
          !profile.agencyIds.every((id: unknown) => typeof id === 'string' && id.trim().length > 0) ||
          (profile.canAccessAdmin !== undefined && profile.canAccessAdmin !== null && typeof profile.canAccessAdmin !== 'boolean') ||
          (profile.email !== undefined && profile.email !== null && typeof profile.email !== 'string')) {
          throw new DashboardError('Le profil de connexion est incomplet. Reconnectez-vous.');
        }
        const json = await getJson('/api/agencies/mine', controller.signal);
        const agencies = decodeAgencies(json).filter((entry: AgencyView) => canAccessAgency(profile, entry.id));
        if (!generation.isCurrent(token) || controller.signal.aborted) return;
        setState({ loading: false, profile, agencies, error: null });
      } catch (error: unknown) {
        if (!generation.isCurrent(token)) return;
        setState({
          loading: false, profile: null, agencies: [], error: controller.signal.aborted
            ? 'Le chargement de la session a expiré. Réessayez.' : errorMessage(error)
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void bootstrap();
    return () => { generation.invalidate(); controller.abort(); window.clearTimeout(timeout); };
  }, [bootstrapRevision]);

  const handleSignOut = async () => {
    if (signOutLock.current) return;
    signOutLock.current = true;
    authGeneration.current.invalidate();
    setSigningOut(true);
    setState({ loading: false, profile: null, agencies: [], error: null });
    try {
      await signOutEverywhere(createClient());
      if (alive.current) window.location.assign('/login?portal=agency');
    } catch {
      if (alive.current) setState({
        loading: false, profile: null, agencies: [],
        error: 'La déconnexion n’a pas pu être confirmée. Réessayez avant de quitter votre compte.'
      });
    } finally {
      signOutLock.current = false;
      if (alive.current) setSigningOut(false);
    }
  };

  if (state.loading || signingOut) return <PortalSkeleton label={signingOut ? 'Déconnexion…' : 'Chargement du portail agence…'} />;
  if (!state.profile || state.agencies.length === 0) {
    return <PortalBlocked message={state.error ?? 'Aucune agence autorisée n’est associée à votre compte.'}
      onRetry={() => setBootstrapRevision((value) => value + 1)} onSignOut={() => void handleSignOut()} />;
  }
  return <AgencyPortal agencies={state.agencies} profile={state.profile} mode="production" contracts={contracts}
    onAccessLost={onAccessLost} onSignOut={() => void handleSignOut()} />;
}

function DemoDashboard({ demoData }: { demoData: AgencyDemoData | undefined }) {
  const result = useMemo(() => {
    try {
      if (!demoData) throw new DashboardError('Aucune donnée de démonstration n’a été fournie.');
      return { agencies: decodeAgencies({ success: true, data: demoData.agencies }), error: null };
    } catch (error: unknown) { return { agencies: [], error: errorMessage(error) }; }
  }, [demoData]);
  if (!demoData || !result.agencies.length) return <PortalBlocked message={result.error ?? 'La démonstration ne contient aucune agence.'} />;
  return <AgencyPortal agencies={result.agencies} profile={null} mode="demo" contracts={NO_CONTRACTS}
    demoData={demoData} onAccessLost={NOOP} />;
}

function AgencyPortal({ agencies, profile, mode, contracts, demoData, onAccessLost, onSignOut }: {
  agencies: AgencyView[]; profile: ClientAuthProfile | null; mode: 'production' | 'demo';
  contracts: DashboardContracts; demoData?: AgencyDemoData;
  onAccessLost: (message: string) => void; onSignOut?: () => void;
}) {
  const [selectedId, setSelectedId] = useState(agencies[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const agency = agencies.find((entry) => entry.id === selectedId) ?? agencies[0];
  const scopeAllowed = mode === 'demo' || canAccessAgency(profile, agency?.id ?? '');
  if (!agency || !scopeAllowed) return <PortalBlocked message="Cette agence n’est pas autorisée pour votre compte." />;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 text-slate-900">
      <a href="#agency-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Aller au contenu</a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#02306B] text-white"><Building2 className="h-5 w-5" aria-hidden="true" /></div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#02306B]">CarDrive · Portail agence</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold sm:text-xl">{agency.name}</h1>
                {agency.verified ? <Badge variant="verified" icon>Vérifiée</Badge>
                  : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Non vérifiée</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {agencies.length > 1 && <div className="min-w-0 flex-1 sm:flex-none">
              <label htmlFor="active-agency" className="sr-only">Agence active</label>
              <select id="active-agency" value={agency.id} disabled={busy}
                onChange={(event) => setSelectedId(event.target.value)} className={`${inputClass} max-w-xs`}>
                {agencies.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
              </select>
            </div>}
            {profile?.email && <span className="hidden max-w-52 truncate text-xs text-slate-500 sm:block" title={profile.email}>{profile.email}</span>}
            {onSignOut && <button type="button" className={secondary} onClick={onSignOut}><LogOut className="h-4 w-4" aria-hidden="true" />Déconnexion</button>}
          </div>
        </div>
      </header>
      <main id="agency-content" className="mx-auto max-w-7xl space-y-5 px-4 pt-6 sm:px-6 lg:px-8">
        {mode === 'demo' && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Mode démonstration · Lecture seule · Aucun appel aux API de production.</div>}
        <AgencyWorkspace key={`${mode}:${agency.id}`} agency={agency} profile={profile} mode={mode} contracts={contracts}
          demoSnapshot={demoData?.resources[agency.id]} onAccessLost={onAccessLost} onBusyChange={setBusy} />
      </main>
    </div>
  );
}

function AgencyWorkspace({ agency, profile, mode, contracts, demoSnapshot, onAccessLost, onBusyChange }: {
  agency: AgencyView; profile: ClientAuthProfile | null; mode: 'production' | 'demo'; contracts: DashboardContracts;
  demoSnapshot?: AgencyDemoData['resources'][string]; onAccessLost: (message: string) => void;
  onBusyChange: (value: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: Tab =
    requestedTab === 'overview' || requestedTab === 'fleet' ||
    requestedTab === 'bookings' || requestedTab === 'access'
      ? requestedTab
      : 'overview';
  const [revisions, setRevisions] = useState({ stats: 0, fleet: 0, bookings: 0 });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [modalNotice, setModalNotice] = useState<ModalNotice | null>(null);
  const [busyKeys, setBusyKeys] = useState<ReadonlySet<string>>(new Set());
  const [editor, setEditor] = useState<{ vehicle: VehicleView | null } | null>(null);
  const [detail, setDetail] = useState<BookingView | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const locks = useRef(new OperationLocks());
  const noticeId = useRef(0);
  const mounted = useRef(false);
  const mutationControllers = useRef(new Set<AbortController>());
  const tabId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const agencyId = agency.id;

  const setActiveTab = (tab: Tab) => {
    router.replace(`/agency?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    mounted.current = true;
    const controllers = mutationControllers.current;
    return () => { mounted.current = false; controllers.forEach((controller) => controller.abort()); onBusyChange(false); };
  }, [onBusyChange]);

  useEffect(() => { onBusyChange(busyKeys.size > 0); }, [busyKeys, onBusyChange]);

  const loadStats = useCallback(async (signal: AbortSignal) => {
    const json = mode === 'demo' ? { success: true, data: demoSnapshot?.stats }
      : await getJson(`/api/stats/agency/${encodeURIComponent(agencyId)}`, signal);
    return decodeStats(json, agencyId);
  }, [agencyId, mode, demoSnapshot]);
  const loadFleet = useCallback(async (_signal: AbortSignal) => {
    // Preserve apiFetch's existing auth/transport behavior. Its AbortSignal support is not available for review.
    const json: unknown = mode === 'demo' ? { success: true, data: demoSnapshot?.vehicles }
      : await apiFetch<Vehicle[]>(`/api/vehicles?agencyId=${encodeURIComponent(agencyId)}`);
    return decodeFleet(json, agencyId);
  }, [agencyId, mode, demoSnapshot]);
  const loadBookings = useCallback(async (signal: AbortSignal) => {
    const json = mode === 'demo' ? { success: true, bookings: demoSnapshot?.bookings }
      : await getJson(`/api/bookings?agencyId=${encodeURIComponent(agencyId)}`, signal);
    return decodeBookings(json, agencyId);
  }, [agencyId, mode, demoSnapshot]);
  const stats = useResource(loadStats, revisions.stats, onAccessLost);
  const fleet = useResource(loadFleet, revisions.fleet, onAccessLost);
  const bookings = useResource(loadBookings, revisions.bookings, onAccessLost);

  const managementReviewed = mode === 'production' && contracts.serverAuthorizationReviewed === true && canAccessAgency(profile, agencyId);
  const canFleet = managementReviewed && profile !== null && canManageAgencyFleet(profile.role) === true;
  const canBookings = managementReviewed && profile !== null && canManageAgencyBookings(profile.role) === true;
  const fleetReady = fleet.data !== null && !fleet.error && !fleet.loading;
  const bookingsReady = bookings.data !== null && !bookings.error && !bookings.loading;
  const formContract = contracts.vehicleForm;
  const formOptionsValid = Boolean(formContract && formContract.categories.length && formContract.transmissions.length &&
    formContract.fuels.length && Number.isInteger(formContract.minYear) && Number.isInteger(formContract.maxYear) &&
    formContract.minYear <= formContract.maxYear);
  const canCreate = canFleet && fleetReady && formOptionsValid && formContract?.createDraft !== undefined;
  const canEdit = canFleet && fleetReady && formOptionsValid && formContract?.supportsPatchFields === true;

  const notify = (kind: Notice['kind'], message: string) => {
    if (mounted.current) {
      setModalNotice({ kind, message });
      setNotices((previous) => [...previous.slice(-3), { id: ++noticeId.current, kind, message }]);
    }
  };
  const openDetail = (booking: BookingView) => { setModalNotice(null); setDetail(booking); };
  const openEditor = (vehicle: VehicleView | null) => { setModalNotice(null); setEditor({ vehicle }); };
  const refresh = (...resources: (keyof typeof revisions)[]) => {
    setRevisions((previous) => ({ ...previous, ...Object.fromEntries(resources.map((key) => [key, previous[key] + 1])) }));
  };
  const bookingAllowed = (booking: BookingView, action: BookingAction) => {
    const status = contracts.bookingStatuses?.find((value) => value === booking.status);
    return canBookings && bookingsReady && status !== undefined && canPerformAgencyBookingAction(status, action) === true;
  };

  const perform = async (key: string, task: (signal: AbortSignal) => Promise<void>, message: string, done?: () => void,
    affected: (keyof typeof revisions)[] = []) => {
    if (!mounted.current || !locks.current.acquire(key)) return;
    setModalNotice(null);
    setBusyKeys(locks.current.snapshot());
    const controller = new AbortController();
    mutationControllers.current.add(controller);
    try {
      await task(controller.signal);
      if (mounted.current && !controller.signal.aborted) { notify('success', message); done?.(); }
    } catch (error: unknown) {
      if (mounted.current && !controller.signal.aborted) {
        notify('error', errorMessage(error));
        if (isAccessError(error)) onAccessLost(errorMessage(error));
        // Reconcile with the backend on failures, including ambiguous network outcomes. Never auto-resubmit.
        if (affected.length) refresh(...affected);
      }
    } finally {
      mutationControllers.current.delete(controller);
      locks.current.release(key);
      if (mounted.current) setBusyKeys(locks.current.snapshot());
    }
  };

  const bookingAction = async (booking: BookingView, action: BookingAction, reason: string) => {
    const current = bookings.data?.find((entry: BookingView) => entry.id === booking.id);
    if (!current || !bookingAllowed(current, action)) { notify('error', 'Cette action n’est plus autorisée pour cette réservation.'); return; }
    if (action === 'reject' && !reason.trim()) return;
    await perform(`booking:${booking.id}`, async (signal) => {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingReference(current))}/status`, {
        method: 'POST', credentials: 'same-origin', signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(action === 'reject' ? { reason: reason.trim() } : {}) }),
      });
      assertSuccess(await readJsonResponse(response));
    }, action === 'approve' ? 'Réservation approuvée.' : 'Réservation refusée.', () => {
      setConfirmation(null); setDetail(null); refresh('bookings', 'stats', 'fleet');
    }, ['bookings', 'stats', 'fleet']);
  };

  const requestBookingAction = (booking: BookingView, action: BookingAction) => {
    if (!bookingAllowed(booking, action)) return;
    setModalNotice(null);
    setDetail(null);
    setConfirmation({
      title: action === 'approve' ? 'Approuver cette réservation ?' : 'Refuser cette réservation ?',
      message: `${bookingReference(booking)} · ${booking.customer_name}. Confirmez votre décision pour cette demande.`,
      label: action === 'approve' ? 'Approuver' : 'Confirmer le refus', destructive: action === 'reject',
      requireReason: action === 'reject', target: { kind: 'booking', id: booking.id, action }
    });
  };

  const requestDelete = (vehicle: VehicleView) => {
    if (!canFleet || !fleetReady || vehicle.agency_id !== agencyId || busyKeys.has(`vehicle:${vehicle.id}`)) return;
    setModalNotice(null);
    setConfirmation({
      title: 'Retirer ce véhicule de la flotte ?',
      message: `${vehicle.brand} ${vehicle.model} · ${vehicle.license_plate || vehicle.unit_number}. Le véhicule sera retiré de votre flotte. Confirmez cette action.`,
      label: 'Retirer le véhicule', destructive: true, target: { kind: 'delete', id: vehicle.id }
    });
  };

  const requestVehicleStatus = (vehicle: VehicleView, next: NonNullable<DashboardContracts['vehicleStatusTransitions']>[number]) => {
    if (!canFleet || !fleetReady || next.from !== vehicle.status || vehicle.agency_id !== agencyId) return;
    setModalNotice(null);
    setConfirmation({
      title: 'Changer le statut du véhicule ?', message: `${vehicle.brand} ${vehicle.model} · ${next.label}`,
      label: 'Confirmer le changement', destructive: false, target: { kind: 'status', id: vehicle.id, from: next.from, to: next.to }
    });
  };

  const confirmAction = async (reason: string) => {
    if (!confirmation) return;
    const target = confirmation.target;
    if (target.kind === 'booking') {
      const booking = bookings.data?.find((entry: BookingView) => entry.id === target.id);
      if (booking) await bookingAction(booking, target.action, reason);
      else notify('error', 'Cette réservation n’est plus disponible. Actualisez les données.');
      return;
    }
    const vehicle = fleet.data?.find((entry: VehicleView) => entry.id === target.id);
    if (!canFleet || !fleetReady || !vehicle || vehicle.agency_id !== agencyId) {
      notify('error', 'Cette action n’est plus autorisée pour ce véhicule.'); return;
    }
    if (target.kind === 'delete') {
      await perform(`vehicle:${vehicle.id}`, async () => {
        assertSuccess(await apiFetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}`, { method: 'DELETE' }));
      }, 'Véhicule retiré de la flotte.', () => { setConfirmation(null); refresh('fleet', 'stats'); }, ['fleet', 'stats']);
      return;
    }
    const next = contracts.vehicleStatusTransitions?.find((transition) => transition.from === vehicle.status &&
      transition.from === target.from && transition.to === target.to);
    if (!next) { notify('error', 'La transition de statut n’est plus autorisée.'); return; }
    await perform(`vehicle:${vehicle.id}`, async () => {
      assertSuccess(await apiFetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}`, {
        method: 'PATCH', body: JSON.stringify({ status: next.to }),
      }));
    }, 'Statut du véhicule mis à jour.', () => { setConfirmation(null); refresh('fleet', 'stats'); }, ['fleet', 'stats']);
  };

  const saveVehicle = async (form: VehicleForm, vehicle: VehicleView | null) => {
    if (!formContract || !(vehicle ? canEdit : canCreate)) { notify('error', 'L’enregistrement de ce véhicule n’est pas autorisé.'); return; }
    const errors = validateVehicleForm(form, formContract, fleet.data ?? [], vehicle?.id);
    if (Object.keys(errors).length) return;
    if (vehicle && vehicle.agency_id !== agencyId) return;
    if (vehicle) {
      const current = fleet.data?.find((entry: VehicleView) => entry.id === vehicle.id);
      if (!current || JSON.stringify(vehicleWriteFields(vehicleToForm(current))) !== JSON.stringify(vehicleWriteFields(vehicleToForm(vehicle)))) {
        notify('error', 'Le véhicule a changé depuis l’ouverture du formulaire. Rouvrez-le avant d’enregistrer.'); return;
      }
    }
    const fields = vehicle ? vehiclePatch(form, vehicle) : vehicleWriteFields(form);
    if (vehicle && Object.keys(fields).length === 0) { notify('success', 'Aucune modification à enregistrer.'); setEditor(null); return; }
    if (!vehicle && !formContract.createDraft) return;
    const slugBase = `${form.brand}-${form.model}-${form.year}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vehicle';
    const payload = vehicle ? fields : {
      ...fields, agency_id: agencyId, slug: `${slugBase}-${Date.now()}`,
      status: formContract.createDraft?.status, published: false, featured: false
    };
    await perform(vehicle ? `vehicle:${vehicle.id}` : 'vehicle:create', async () => {
      assertSuccess(await apiFetch(vehicle ? `/api/vehicles/${encodeURIComponent(vehicle.id)}` : '/api/vehicles', {
        method: vehicle ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      }));
    }, vehicle ? 'Véhicule mis à jour.' : 'Véhicule enregistré sans publication automatique.', () => { setEditor(null); refresh('fleet', 'stats'); }, ['fleet', 'stats']);
  };

  const downloadPdf = async (booking: BookingView) => {
    if (!managementReviewed || !bookingsReady || !bookings.data?.some((entry: BookingView) => entry.id === booking.id)) return;
    const reference = bookingReference(booking);
    await perform(`booking:${booking.id}`, async (signal) => {
      const response = await fetch(`/api/bookings/${encodeURIComponent(reference)}/pdf`, { cache: 'no-store', credentials: 'same-origin', signal });
      if (!response.ok) throw new DashboardError(response.status === 403 ? 'Accès au PDF refusé.' : `Téléchargement impossible (HTTP ${response.status}).`, response.status);
      if (!/\bapplication\/pdf\b/i.test(response.headers.get('content-type') ?? '')) throw new DashboardError('Le serveur n’a pas renvoyé un PDF.');
      const blob = await response.blob();
      if (await blob.slice(0, 5).text() !== '%PDF-') throw new DashboardError('Le document PDF reçu est invalide.');
      if (signal.aborted || !mounted.current) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `reservation-${reference.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'Fiche PDF téléchargée.');
  };

  const anyLoading = stats.loading || fleet.loading || bookings.loading;
  const allBusy = busyKeys.size > 0;
  const fleetRows = fleet.data ?? [];
  const bookingRows = bookings.data ?? [];
  const tabs: readonly { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Vue générale' },
    { value: 'fleet', label: `Flotte${fleet.data ? ` (${fleet.data.length})` : ''}` },
    { value: 'bookings', label: `Réservations${bookings.data ? ` (${bookings.data.length})` : ''}` },
    { value: 'access', label: 'Accès et permissions' },
  ];

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div ref={tabsRef} role="tablist" aria-label="Sections du tableau de bord" className="flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        {tabs.map((tab, index) => <button key={tab.value} id={`${tabId}-${tab.value}`} type="button" role="tab"
          aria-selected={activeTab === tab.value} aria-controls={`${tabId}-panel`} tabIndex={activeTab === tab.value ? 0 : -1}
          onClick={() => setActiveTab(tab.value)} onKeyDown={(event) => {
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            const nextTab = tabs[next];
            if (!nextTab) return;
            setActiveTab(nextTab.value);
            tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
          }} className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#02306B] ${activeTab === tab.value ? 'bg-[#02306B] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          {tab.label}
        </button>)}
      </div>
      <button type="button" onClick={() => refresh('stats', 'fleet', 'bookings')} disabled={anyLoading || allBusy} className={secondary}>
        <RefreshCw className={`h-4 w-4 ${anyLoading ? 'animate-spin' : ''}`} aria-hidden="true" />{anyLoading ? 'Actualisation…' : 'Actualiser'}
      </button>
    </div>
    {mode === 'production' && !contracts.serverAuthorizationReviewed && <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#02306B]" aria-hidden="true" /><p>Accès en lecture seule. La gestion et les exports ne sont pas activés pour ce portail.</p>
    </div>}
    <section className="space-y-2" aria-label="Notifications">
      {notices.map((notice) => <div key={notice.id} role={notice.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${notice.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
        {notice.kind === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> : <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />}
        <span className="min-w-0 flex-1">{notice.message}</span><button type="button" aria-label="Fermer la notification" className="rounded p-0.5 focus-visible:outline focus-visible:outline-2" onClick={() => setNotices((previous) => previous.filter((entry) => entry.id !== notice.id))}><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>)}
    </section>
    <section id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${activeTab}`} tabIndex={0} className="space-y-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#02306B]">
      {activeTab === 'overview' && <>
        <ResourceFeedback label="Statistiques" resource={stats} onRetry={() => refresh('stats')} />
        <OverviewCards stats={stats} bookings={bookings} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-bold">Demandes en attente</h2><p className="mt-1 text-xs text-slate-500">Triées par début de location</p></div>
            <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-[#02306B] focus-visible:outline focus-visible:outline-2" onClick={() => setActiveTab('bookings')}>Toutes les réservations</button>
          </div>
          <ResourceFeedback label="Réservations" resource={bookings} onRetry={() => refresh('bookings')} />
          {bookings.data ? <BookingTable bookings={bookingRows.filter((entry: BookingView) => entry.status === 'PENDING').sort((a: BookingView, b: BookingView) => a.start_date.localeCompare(b.start_date)).slice(0, 5)}
            busyKeys={busyKeys} bookingAllowed={bookingAllowed} onDetail={openDetail} onAction={requestBookingAction}
            canPdf={managementReviewed && bookingsReady} onPdf={(booking) => void downloadPdf(booking)} emptyMessage="Aucune demande en attente dans la liste chargée." />
            : <ResourcePlaceholder loading={bookings.loading} />}
        </div>
      </>}
      {activeTab === 'fleet' && <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-bold">Votre flotte</h2><p className="mt-1 text-sm text-slate-500">Unités, caractéristiques et tarifs de {agency.name}</p></div>
          <button type="button" className={primary} disabled={!canCreate || allBusy} onClick={() => openEditor(null)}><Plus className="h-4 w-4" aria-hidden="true" />Ajouter un véhicule</button>
        </div>
        {canFleet && !canCreate && <p className="text-sm text-slate-500">L’ajout de véhicules n’est pas activé pour cette agence.</p>}
        <ResourceFeedback label="Flotte" resource={fleet} onRetry={() => refresh('fleet')} />
        {fleet.data ? <FleetPanel vehicles={fleetRows} canEdit={canEdit} canDelete={canFleet && fleetReady} canChangeStatus={canFleet && fleetReady}
          transitions={contracts.vehicleStatusTransitions ?? []} busyKeys={busyKeys} onEdit={openEditor}
          onDelete={requestDelete} onStatus={requestVehicleStatus} /> : <ResourcePlaceholder loading={fleet.loading} />}
      </>}
      {activeTab === 'bookings' && <>
        <div><h2 className="text-xl font-bold">Réservations</h2><p className="mt-1 text-sm text-slate-500">Consultez les dossiers et traitez les demandes autorisées.</p></div>
        <ResourceFeedback label="Réservations" resource={bookings} onRetry={() => refresh('bookings')} />
        {bookings.data ? <BookingsPanel bookings={bookingRows} busyKeys={busyKeys} bookingAllowed={bookingAllowed}
          onDetail={openDetail} onAction={requestBookingAction} canPdf={managementReviewed && bookingsReady} onPdf={(booking) => void downloadPdf(booking)} /> : <ResourcePlaceholder loading={bookings.loading} />}
      </>}
      {activeTab === 'access' && <AgencyAccessPanel agencyId={agencyId} agencyName={agency.name} profile={profile} />}
    </section>
    {editor && formContract && <VehicleEditor vehicle={editor.vehicle} options={formContract} fleet={fleetRows}
      busy={busyKeys.has(editor.vehicle ? `vehicle:${editor.vehicle.id}` : 'vehicle:create')} notice={modalNotice} onClose={() => setEditor(null)} onSave={saveVehicle} />}
    {confirmation && <ConfirmationDialog {...confirmation} run={confirmAction} busy={allBusy} notice={modalNotice}
      disabled={confirmation.target.kind === 'booking' ? !bookingsReady : !fleetReady} onClose={() => setConfirmation(null)} />}
    {detail && <BookingDetails booking={bookings.data?.find((entry: BookingView) => entry.id === detail.id) ?? detail}
      busy={busyKeys.has(`booking:${detail.id}`)} notice={modalNotice} onClose={() => setDetail(null)} bookingAllowed={bookingAllowed}
      onAction={requestBookingAction} canPdf={managementReviewed && bookingsReady} onPdf={(booking) => void downloadPdf(booking)} />}
  </>;
}

function PortalSkeleton({ label }: { label: string }) {
  return <div className="min-h-screen bg-[#F8FAFC] p-4 text-slate-600 sm:p-8" role="status" aria-busy="true">
    <div className="mx-auto max-w-7xl space-y-6"><p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin text-[#02306B]" aria-hidden="true" />{label}</p>
      <div aria-hidden="true" className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">{[0, 1, 2, 3].map((index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>
      <TableSkeleton />
    </div>
  </div>;
}

function PortalBlocked({ message, onRetry, onSignOut }: { message: string; onRetry?: () => void; onSignOut?: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 text-slate-900">
    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <Building2 className="mb-4 h-9 w-9 text-[#02306B]" aria-hidden="true" /><h1 className="text-xl font-bold">Portail agence CarDrive</h1>
      <p role="alert" className="mt-3 text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/login?portal=agency" className={primary}>Se connecter</Link>
        {onRetry && <button type="button" onClick={onRetry} className={secondary}>Réessayer</button>}
        {onSignOut && <button type="button" onClick={onSignOut} className={secondary}>Déconnexion</button>}
      </div>
    </div>
  </main>;
}

function TableSkeleton() {
  return <div role="status" aria-busy="true" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
    <span className="sr-only">Chargement des données…</span>
    {[0, 1, 2, 3].map((index) => <div key={index} aria-hidden="true" className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
  </div>;
}

function ResourcePlaceholder({ loading }: { loading: boolean }) {
  return loading ? <TableSkeleton /> : <EmptyState message="Données indisponibles. Réessayez le chargement de cette ressource." />;
}

function ResourceFeedback<T>({ label, resource, onRetry }: { label: string; resource: Resource<T>; onRetry: () => void }) {
  if (resource.error) return <div role="alert" className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><p className="min-w-0 flex-1">{label} : {resource.error}{resource.data !== null && ' Les dernières données restent affichées.'}</p>
    <button type="button" disabled={resource.loading} className={secondary} onClick={onRetry}>Réessayer</button>
  </div>;
  if (resource.loading && resource.data !== null) return <p role="status" className="mb-3 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />{label} : actualisation en cours…</p>;
  if (resource.updatedAt) return <p className="mb-3 text-xs text-slate-500">{label} · Synchronisé à {resource.updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>;
  return null;
}

function money(value: number | null | undefined): string { return value === null || value === undefined ? 'Non transmis' : formatPrice(value); }

function formatDate(value: string): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function KpiCard({ label, value, detail, icon, loading }: { label: string; value: ReactNode; detail: ReactNode; icon: ReactNode; loading: boolean }) {
  return <article aria-busy={loading} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-slate-500">{label}</h3><span className="text-[#02306B]" aria-hidden="true">{icon}</span></div>
    {loading ? <><div className="my-3 h-9 w-24 animate-pulse rounded-lg bg-slate-100" aria-hidden="true" /><span className="sr-only">Chargement de {label}</span></> : <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>}
    <div className="mt-2 text-xs leading-relaxed text-slate-500">{detail}</div>
  </article>;
}

function OverviewCards({ stats, bookings }: { stats: Resource<StatsView>; bookings: Resource<BookingView[]> }) {
  const data = stats.data;
  const amounts = data ? resolveAmounts(data.totalRevenue, data.platformCommission, data.netRevenue) : null;
  const confirmed = bookings.data?.filter((booking) => booking.status === 'CONFIRMED');
  const confirmedTotal = confirmed?.reduce((total, booking) => total + booking.total_price, 0);
  const skeleton = stats.loading && data === null;
  return <>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
      <KpiCard label="Véhicules" value={data?.totalVehicles ?? '—'} detail={data ? `${data.availableVehicles} disponibles · Flotte actuelle` : 'Données de flotte'} icon={<Car className="h-5 w-5" />} loading={skeleton} />
      <KpiCard label="Véhicules loués" value={data?.currentlyRented ?? '—'} detail={data ? `Occupation : ${data.occupancyRate}% · Situation actuelle` : 'Situation actuelle'} icon={<Calendar className="h-5 w-5" />} loading={skeleton} />
      <KpiCard label="Demandes en attente" value={data?.pendingBookings ?? '—'} detail="Demandes à traiter" icon={<Clock className="h-5 w-5 text-amber-600" />} loading={skeleton} />
      <KpiCard label="Revenu net agence" value={amounts ? money(amounts.net) : '—'} detail={amounts ? <>{amounts.derived ? 'Calculé par différence · ' : ''}Données enregistrées</> : 'Montant indisponible'} icon={<Building2 className="h-5 w-5" />} loading={skeleton} />
    </div>
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
      <div><p className="text-xs text-slate-500">Revenu brut enregistré</p><p className="mt-1 text-lg font-semibold">{data ? money(data.totalRevenue) : '—'}</p></div>
      <div><p className="text-xs text-slate-500">Commission plateforme</p><p className="mt-1 text-lg font-semibold">{amounts ? money(amounts.commission) : '—'}</p></div>
      <div><p className="text-xs text-slate-500">Réservations confirmées · Liste chargée</p><p className="mt-1 text-lg font-semibold">{confirmedTotal === undefined ? '—' : money(confirmedTotal)}</p><p className="mt-1 text-xs text-slate-500">{confirmed ? `${confirmed.length} dossier(s)` : 'Liste indisponible'}</p></div>
      <div><p className="text-xs text-slate-500">Paiements encaissés</p><p className="mt-1 text-lg font-semibold">Non transmis</p><p className="mt-1 text-xs text-slate-500">Une confirmation ne prouve pas un paiement.</p></div>
      <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-4">Période des revenus non précisée. Le montant des réservations confirmées porte sur les dossiers chargés.</p>
      {amounts && !amounts.consistent && <p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-4">Les montants brut, net et commission transmis ne se rapprochent pas. Vérifiez le dossier financier.</p>}
    </div>
  </>;
}

function StatusBadge({ status }: { status: string }) {
  const labels: Readonly<Record<string, { label: string; className: string }>> = {
    AVAILABLE: { label: 'Disponible', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    RENTED: { label: 'Loué', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
    CONFIRMED: { label: 'Confirmée', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    PENDING: { label: 'En attente', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
    REJECTED: { label: 'Refusée', className: 'bg-red-50 text-red-800 ring-red-200' },
    CANCELLED: { label: 'Annulée', className: 'bg-red-50 text-red-800 ring-red-200' },
  };
  const presentation = labels[status] ?? { label: status, className: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${presentation.className}`}>{presentation.label}</span>;
}

function EmptyState({ message }: { message: string }) {
  return <div role="status" className="rounded-2xl bg-white px-6 py-10 text-center"><Car className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" /><p className="text-sm text-slate-600">{message}</p></div>;
}

function Pagination({ current, pages, total, offset, shown, onPage, pageSize, onPageSize }: {
  current: number; pages: number; total: number; offset: number; shown: number; onPage: (page: number) => void;
  pageSize: number; onPageSize: (size: number) => void;
}) {
  const id = useId();
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
    <p aria-live="polite">{total ? `${offset + 1}–${offset + shown} sur ${total}` : '0 résultat'}</p>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor={id}>Lignes</label><select id={id} value={pageSize} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus:ring-2 focus:ring-blue-100" onChange={(event) => onPageSize(Number(event.target.value))}>
      {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
    </select><span>Page {current} / {pages}</span>
      <button type="button" className={secondary} aria-label="Page précédente" disabled={current <= 1} onClick={() => onPage(current - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
      <button type="button" className={secondary} aria-label="Page suivante" disabled={current >= pages} onClick={() => onPage(current + 1)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>
  </nav>;
}

function Toolbar({ search, onSearch, searchLabel, status, onStatus, statuses, sort, onSort, sorts }: {
  search: string; onSearch: (value: string) => void; searchLabel: string;
  status: string; onStatus: (value: string) => void; statuses: readonly string[];
  sort: string; onSort: (value: string) => void; sorts: readonly { value: string; label: string }[];
}) {
  const id = useId();
  return <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_180px_210px]">
    <div className="relative"><label htmlFor={`${id}-search`} className="sr-only">{searchLabel}</label><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
      <input id={`${id}-search`} type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchLabel} className={`${inputClass} pl-9`} />
    </div>
    <div><label htmlFor={`${id}-status`} className="sr-only">Filtrer par statut</label><select id={`${id}-status`} value={status} onChange={(event) => onStatus(event.target.value)} className={inputClass}><option value="">Tous les statuts</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
    <div><label htmlFor={`${id}-sort`} className="sr-only">Trier les résultats</label><select id={`${id}-sort`} value={sort} onChange={(event) => onSort(event.target.value)} className={inputClass}>{sorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
  </div>;
}

function VehicleThumbnail({ vehicle }: { vehicle: VehicleView }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = vehicle.images.find(safeImageUrl);
  return <div className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
    {url && url !== failedUrl ? <Image src={url} alt={`${vehicle.brand} ${vehicle.model}`} fill sizes="64px" unoptimized className="object-cover" onError={() => setFailedUrl(url)} /> : <Car className="h-6 w-6 text-slate-400" aria-hidden="true" />}
  </div>;
}

function FleetPanel({ vehicles, canEdit, canDelete, canChangeStatus, transitions, busyKeys, onEdit, onDelete, onStatus }: {
  vehicles: VehicleView[]; canEdit: boolean; canDelete: boolean; canChangeStatus: boolean;
  transitions: NonNullable<DashboardContracts['vehicleStatusTransitions']>; busyKeys: ReadonlySet<string>;
  onEdit: (vehicle: VehicleView) => void; onDelete: (vehicle: VehicleView) => void;
  onStatus: (vehicle: VehicleView, transition: NonNullable<DashboardContracts['vehicleStatusTransitions']>[number]) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return vehicles.filter((vehicle) => (!status || vehicle.status === status) && normalizeSearch(`${vehicle.brand} ${vehicle.model} ${vehicle.license_plate} ${vehicle.unit_number} ${vehicle.category} ${vehicle.fuel ?? ''}`).includes(query))
      .sort((a, b) => sort === 'price-asc' ? a.daily_price - b.daily_price : sort === 'price-desc' ? b.daily_price - a.daily_price
        : sort === 'year' ? b.year - a.year : `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'fr', { numeric: true }));
  }, [vehicles, search, status, sort]);
  const pagination = paginate(filtered, page, pageSize);
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <Toolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchLabel="Rechercher un véhicule, une plaque…"
      status={status} onStatus={(value) => { setStatus(value); setPage(1); }} statuses={[...new Set(vehicles.map((vehicle) => vehicle.status))].sort()}
      sort={sort} onSort={(value) => { setSort(value); setPage(1); }} sorts={[{ value: 'name', label: 'Nom du véhicule' }, { value: 'price-asc', label: 'Prix croissant' }, { value: 'price-desc', label: 'Prix décroissant' }, { value: 'year', label: 'Année décroissante' }]} />
    {pagination.total === 0 ? <EmptyState message={vehicles.length ? 'Aucun véhicule ne correspond à vos filtres.' : 'Aucun véhicule dans la flotte chargée.'} />
      : <div className="relative w-full min-w-0 max-w-full overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#02306B]" role="region" aria-label="Tableau de la flotte, défilement horizontal possible" tabIndex={0}>
        <table className="w-full min-w-[820px] text-left text-sm"><caption className="sr-only">Véhicules de l’agence active</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr>{['Véhicule', 'Unité / Immatriculation', 'Catégorie / Carburant', 'Tarif / jour', 'Statut', 'Actions'].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{pagination.entries.map((vehicle: VehicleView) => {
            const busy = busyKeys.has(`vehicle:${vehicle.id}`);
            const next = canChangeStatus ? transitions.filter((transition) => transition.from === vehicle.status) : [];
            return <tr key={vehicle.id} aria-busy={busy} className="hover:bg-slate-50/70">
              <td className="px-4 py-4"><div className="flex items-center gap-3"><VehicleThumbnail vehicle={vehicle} /><div><p className="font-semibold">{vehicle.brand} {vehicle.model}</p><p className="mt-1 text-xs text-slate-500">{vehicle.year} · {vehicle.transmission}{vehicle.published === false && ' · Non publié'}</p></div></div></td>
              <td className="px-4 py-4"><p className="font-mono text-xs font-semibold">{vehicle.unit_number || 'Non transmis'}</p><p className="mt-1 text-xs text-slate-500">{vehicle.license_plate || 'Non transmise'}</p></td>
              <td className="px-4 py-4"><p>{vehicle.category}</p><p className="mt-1 text-xs text-slate-500">{vehicle.fuel ?? 'Carburant non transmis'}</p></td>
              <td className="px-4 py-4 font-semibold text-[#02306B]">{money(vehicle.daily_price)}</td>
              <td className="px-4 py-4"><StatusBadge status={vehicle.status} />{next.map((transition) => <button key={`${transition.from}:${transition.to}`} type="button" disabled={busy} className="mt-2 block rounded px-1 text-xs font-medium text-[#02306B] underline disabled:opacity-50" onClick={() => onStatus(vehicle, transition)}>{transition.label}</button>)}</td>
              <td className="px-4 py-4"><div className="flex items-center justify-end gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-500" aria-label="Opération en cours" />}
                {canEdit && <button type="button" className={secondary} disabled={busy} aria-label={`Modifier ${vehicle.brand} ${vehicle.model}, ${vehicle.unit_number}`} onClick={() => onEdit(vehicle)}><Edit className="h-4 w-4" aria-hidden="true" /></button>}
                {canDelete && <button type="button" className={`${secondary} text-red-700 hover:bg-red-50`} disabled={busy} aria-label={`Retirer ${vehicle.brand} ${vehicle.model}, ${vehicle.unit_number}`} onClick={() => onDelete(vehicle)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>}
                {!canEdit && !canDelete && <span className="text-xs text-slate-500">Lecture seule</span>}
              </div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    <Pagination {...pagination} shown={pagination.entries.length} onPage={setPage} pageSize={pageSize} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
    <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">La recherche et les filtres portent sur les véhicules chargés.</p>
  </div>;
}

interface BookingTableProps {
  bookings: BookingView[]; busyKeys: ReadonlySet<string>;
  bookingAllowed: (booking: BookingView, action: BookingAction) => boolean;
  onDetail: (booking: BookingView) => void; onAction: (booking: BookingView, action: BookingAction) => void;
  canPdf: boolean; onPdf: (booking: BookingView) => void; emptyMessage?: string;
}

function BookingActions({ booking, busy, bookingAllowed, onDetail, onAction, canPdf, onPdf, hideDetail = false }: Omit<BookingTableProps, 'bookings' | 'busyKeys'> & { booking: BookingView; busy: boolean; hideDetail?: boolean }) {
  return <div className="flex flex-wrap justify-end gap-2">
    {bookingAllowed(booking, 'approve') && <button type="button" disabled={busy} onClick={() => onAction(booking, 'approve')} className={`${secondary} border-emerald-200 text-emerald-800 hover:bg-emerald-50`}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Approuver</button>}
    {bookingAllowed(booking, 'reject') && <button type="button" disabled={busy} onClick={() => onAction(booking, 'reject')} className={`${secondary} border-red-200 text-red-800 hover:bg-red-50`}><XCircle className="h-4 w-4" aria-hidden="true" />Refuser</button>}
    {!hideDetail && <button type="button" className={secondary} disabled={busy} aria-label={`Détails de la réservation ${bookingReference(booking)}`} onClick={() => onDetail(booking)}><Eye className="h-4 w-4" aria-hidden="true" /><span>Détails</span></button>}
    {canPdf && <button type="button" className={secondary} disabled={busy} aria-label={`Télécharger le PDF de ${bookingReference(booking)}`} onClick={() => onPdf(booking)}><Download className="h-4 w-4" aria-hidden="true" /><span>PDF</span></button>}
    {busy && <span role="status" className="flex items-center gap-1 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />En cours</span>}
  </div>;
}

function BookingTable({ bookings, busyKeys, emptyMessage = 'Aucune réservation dans la liste chargée.', ...actions }: BookingTableProps) {
  if (!bookings.length) return <EmptyState message={emptyMessage} />;
  return <div className="relative w-full min-w-0 max-w-full overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#02306B]" role="region" aria-label="Tableau des réservations, défilement horizontal possible" tabIndex={0}>
    <table className="w-full min-w-[1160px] text-left text-sm"><caption className="sr-only">Réservations de l’agence active</caption>
      <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr>{['Dossier / Client', 'Véhicule / Point de retrait', 'Période', 'Total', 'Commission', 'Net agence', 'Statut', 'Actions'].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{bookings.map((booking) => {
        const amounts = resolveAmounts(booking.total_price, booking.commission_amount, booking.agency_amount);
        const busy = busyKeys.has(`booking:${booking.id}`);
        return <tr key={booking.id} className="hover:bg-slate-50/70" aria-busy={busy}>
          <td className="px-4 py-4"><p className="font-mono text-xs font-semibold text-[#02306B]">{bookingReference(booking)}</p><p className="mt-1 font-medium">{booking.customer_name}</p>{booking.customer_phone && <p className="mt-1 text-xs text-slate-500">{booking.customer_phone}</p>}</td>
          <td className="px-4 py-4"><p>{booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Véhicule non transmis'}</p><div className="mt-2">{booking.pickup_location ? <MeetingPointBadge location={booking.pickup_location} size="sm" /> : <span className="text-xs text-slate-500">Point de retrait non transmis</span>}</div></td>
          <td className="px-4 py-4 text-xs text-slate-600"><p>{formatDate(booking.start_date)}</p><p className="mt-1">→ {formatDate(booking.end_date)}</p>{booking.total_days !== null && <p className="mt-1 text-slate-500">{booking.total_days} jour(s)</p>}</td>
          <td className="px-4 py-4 font-semibold">{money(amounts.gross)}</td>
          <td className="px-4 py-4 text-xs text-slate-600">{money(amounts.commission)}</td>
          <td className="px-4 py-4 text-xs font-semibold text-emerald-800">{money(amounts.net)}{amounts.derived && <span className="mt-1 block text-xs font-normal text-slate-500">Par différence</span>}{!amounts.consistent && <span className="mt-1 block text-xs font-normal text-red-700">Montants incohérents</span>}</td>
          <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
          <td className="px-4 py-4"><BookingActions booking={booking} busy={busy} {...actions} /></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function BookingsPanel(props: BookingTableProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return props.bookings.filter((booking) => (!status || booking.status === status) && normalizeSearch(`${bookingReference(booking)} ${booking.customer_name} ${booking.customer_phone ?? ''} ${booking.vehicle?.brand ?? ''} ${booking.vehicle?.model ?? ''}`).includes(query))
      .sort((a, b) => sort === 'amount-desc' ? b.total_price - a.total_price : sort === 'amount-asc' ? a.total_price - b.total_price
        : sort === 'date-asc' ? a.start_date.localeCompare(b.start_date) : b.start_date.localeCompare(a.start_date));
  }, [props.bookings, search, status, sort]);
  const pagination = paginate(filtered, page, pageSize);
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <Toolbar search={search} onSearch={(value) => { setSearch(value); setPage(1); }} searchLabel="Rechercher un dossier, un client…"
      status={status} onStatus={(value) => { setStatus(value); setPage(1); }} statuses={[...new Set(props.bookings.map((booking) => booking.status))].sort()}
      sort={sort} onSort={(value) => { setSort(value); setPage(1); }} sorts={[{ value: 'date-desc', label: 'Début de location ↓' }, { value: 'date-asc', label: 'Début de location ↑' }, { value: 'amount-desc', label: 'Montant décroissant' }, { value: 'amount-asc', label: 'Montant croissant' }]} />
    <BookingTable {...props} bookings={pagination.entries} emptyMessage={props.bookings.length ? 'Aucune réservation ne correspond à vos filtres.' : undefined} />
    <Pagination {...pagination} shown={pagination.entries.length} onPage={setPage} pageSize={pageSize} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
    <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Les montants concernent chaque réservation et ne constituent pas une preuve d’encaissement.</p>
  </div>;
}

function Dialog({ title, children, busy, onClose, footer }: { title: string; children: ReactNode; busy: boolean; onClose: () => void; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    if (dialog && !dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close(); document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={ref} aria-labelledby={id} aria-busy={busy} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const dialog = ref.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }}
    className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6"><h2 id={id} className="text-lg font-bold">{title}</h2><button type="button" disabled={busy} className={`${secondary} shrink-0 px-2`} aria-label="Fermer la fenêtre" onClick={onClose}><X className="h-4 w-4" aria-hidden="true" /></button></div>
    <div className="px-5 py-5 sm:px-6">{children}</div>{footer && <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">{footer}</div>}
  </dialog>;
}

function DialogNotice({ notice }: { notice: ModalNotice | null }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (notice?.kind === 'error') ref.current?.scrollIntoView({ block: 'nearest' }); }, [notice]);
  if (!notice) return null;
  return <p ref={ref} role={notice.kind === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-xl border p-3 text-sm ${notice.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{notice.message}</p>;
}

function ConfirmationDialog({ title, message, label, destructive, requireReason, run, busy, disabled, notice, onClose }: {
  title: string; message: string; label: string; destructive: boolean; requireReason?: boolean;
  run: (reason: string) => Promise<void>; busy: boolean; disabled: boolean; notice: ModalNotice | null; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const id = useId();
  return <Dialog title={title} busy={busy} onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (busy || disabled) return; if (requireReason && !reason.trim()) { setReasonError(true); return; } void run(reason); }}>
      <DialogNotice notice={notice} />
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      {requireReason && <div className="mt-4"><label htmlFor={`${id}-reason`} className="mb-1 block text-sm font-medium">Motif du refus <span aria-hidden="true">*</span></label>
        <textarea id={`${id}-reason`} maxLength={500} required value={reason} disabled={busy} onChange={(event) => { setReason(event.target.value); setReasonError(false); }} className={inputClass} rows={3} aria-invalid={reasonError} aria-describedby={reasonError ? `${id}-error` : undefined} />
        {reasonError && <p id={`${id}-error`} className="mt-1 text-xs text-red-700">Indiquez un motif de refus.</p>}
      </div>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" className={secondary} disabled={busy} onClick={onClose}>Annuler</button><button type="submit" disabled={busy || disabled} className={destructive ? danger : primary}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Traitement…' : label}</button></div>
    </form>
  </Dialog>;
}

function VehicleEditor({ vehicle, options, fleet, busy, notice, onClose, onSave }: {
  vehicle: VehicleView | null; options: VehicleOptions; fleet: VehicleView[]; busy: boolean; notice: ModalNotice | null;
  onClose: () => void; onSave: (form: VehicleForm, vehicle: VehicleView | null) => Promise<void>;
}) {
  const [form, setForm] = useState<VehicleForm>(() => vehicle ? vehicleToForm(vehicle) : emptyVehicleForm());
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const setField = <K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) => {
    setForm((previous: VehicleForm) => ({ ...previous, [key]: value }));
    setErrors((previous: VehicleFormErrors) => ({ ...previous, [key]: undefined }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateVehicleForm(form, options, fleet, vehicle?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    void onSave(form, vehicle);
  };
  const field = (key: Exclude<keyof VehicleForm & string, 'air_conditioning'>, label: string, type: 'text' | 'number' = 'text', required = true) => <div>
    <label htmlFor={`${id}-${key}`} className="mb-1 block text-xs font-semibold text-slate-700">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input id={`${id}-${key}`} name={key} type={type} value={form[key]} onChange={(event) => setField(key, event.target.value)} disabled={busy} required={required}
      min={type === 'number' ? key === 'year' ? options.minYear : key === 'daily_price' ? 0.01 : key === 'mileage' || key === 'deposit' ? 0 : 1 : undefined}
      max={key === 'year' ? options.maxYear : undefined} step={type === 'number' ? key === 'daily_price' || key === 'deposit' ? '0.01' : '1' : undefined}
      className={inputClass} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${id}-${key}-error` : undefined} />
    {errors[key] && <p id={`${id}-${key}-error`} className="mt-1 text-xs text-red-700">{errors[key]}</p>}
  </div>;
  const select = (key: 'category' | 'transmission' | 'fuel', label: string, choices: readonly { value: string; label: string }[]) => <div>
    <label htmlFor={`${id}-${key}`} className="mb-1 block text-xs font-semibold text-slate-700">{label} <span aria-hidden="true">*</span></label>
    <select id={`${id}-${key}`} name={key} value={form[key]} disabled={busy} required className={inputClass} onChange={(event) => setField(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}>
      <option value="">Choisir…</option>{!choices.some((option) => option.value === form[key]) && form[key] && <option value={form[key]} disabled>{form[key]} · Valeur non validée</option>}
      {choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>{errors[key] && <p id={`${id}-${key}-error`} className="mt-1 text-xs text-red-700">{errors[key]}</p>}
  </div>;
  return <Dialog title={vehicle ? `Modifier ${vehicle.brand} ${vehicle.model}` : 'Ajouter un véhicule'} busy={busy} onClose={onClose}>
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      <DialogNotice notice={notice} />
      {Object.values(errors).some(Boolean) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Corrigez les champs indiqués avant d’enregistrer.</p>}
      <fieldset disabled={busy} className="space-y-4"><legend className="mb-3 text-sm font-semibold">Identification et caractéristiques</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field('brand', 'Marque')}{field('model', 'Modèle')}{field('unit_number', 'Numéro d’unité')}{field('license_plate', 'Immatriculation')}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field('year', 'Année', 'number')}{select('category', 'Catégorie', options.categories)}{select('transmission', 'Transmission', options.transmissions)}{select('fuel', 'Carburant', options.fuels)}</div>
        <div className="grid grid-cols-2 gap-3">{field('seats', 'Places', 'number', !vehicle)}{field('doors', 'Portes', 'number', !vehicle)}{field('mileage', 'Kilométrage', 'number', !vehicle)}{field('min_rental_days', 'Durée minimum (jours)', 'number', !vehicle)}</div>
        <label htmlFor={`${id}-ac`} className="flex items-center gap-2 text-sm"><input id={`${id}-ac`} type="checkbox" checked={form.air_conditioning} onChange={(event) => setField('air_conditioning', event.target.checked)} className="h-4 w-4 accent-[#02306B]" />Climatisation</label>
      </fieldset>
      <fieldset disabled={busy}><legend className="mb-3 text-sm font-semibold">Tarification</legend><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field('daily_price', 'Prix par jour (DH)', 'number')}{field('deposit', 'Caution (DH)', 'number', !vehicle)}</div></fieldset>
      <fieldset disabled={busy} className="space-y-3"><legend className="mb-3 text-sm font-semibold">Images et équipements</legend>
        <div><label htmlFor={`${id}-images`} className="mb-1 block text-xs font-semibold">Images · Une URL par ligne</label><textarea id={`${id}-images`} name="images" rows={3} value={form.images} onChange={(event) => setField('images', event.target.value)} className={inputClass} aria-invalid={Boolean(errors.images)} aria-describedby={errors.images ? `${id}-images-error` : undefined} />{errors.images && <p id={`${id}-images-error`} className="mt-1 text-xs text-red-700">{errors.images}</p>}</div>
        <div><label htmlFor={`${id}-features`} className="mb-1 block text-xs font-semibold">Équipements · Un par ligne</label><textarea id={`${id}-features`} name="features" rows={3} value={form.features} onChange={(event) => setField('features', event.target.value)} className={inputClass} /></div>
      </fieldset>
      <p className="text-xs leading-relaxed text-slate-500">{vehicle ? 'Les champs non modifiés sont conservés. Vider un champ numérique facultatif conserve sa valeur enregistrée.' : 'Le véhicule sera enregistré sans publication automatique. Tous les champs marqués * sont obligatoires.'}</p>
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" className={secondary} disabled={busy} onClick={onClose}>Annuler</button><button type="submit" className={primary} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </form>
  </Dialog>;
}

function BookingDetails({ booking, busy, notice, onClose, bookingAllowed, onAction, canPdf, onPdf }: {
  booking: BookingView; busy: boolean; notice: ModalNotice | null; onClose: () => void; bookingAllowed: BookingTableProps['bookingAllowed'];
  onAction: BookingTableProps['onAction']; canPdf: boolean; onPdf: BookingTableProps['onPdf'];
}) {
  const amounts = resolveAmounts(booking.total_price, booking.commission_amount, booking.agency_amount);
  const rows: readonly [string, string][] = [
    ['Client', booking.customer_name], ['Téléphone', booking.customer_phone ?? 'Non transmis'],
    ['Véhicule', booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Non transmis'],
    ['Début', formatDate(booking.start_date)], ['Fin', formatDate(booking.end_date)],
    ['Point de retrait', booking.pickup_location ?? 'Non transmis'],
    ['Montant de la réservation', money(amounts.gross)], ['Commission', money(amounts.commission)], ['Net agence', money(amounts.net)],
  ];
  return <Dialog title={`Réservation ${bookingReference(booking)}`} busy={busy} onClose={onClose}>
    <DialogNotice notice={notice} />
    <StatusBadge status={booking.status} /><dl className="mt-5 grid gap-4 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl>
    {amounts.derived && <p className="mt-4 text-xs text-slate-500">Un montant a été calculé par différence à partir du brut et du montant enregistré.</p>}
    {!amounts.consistent && <p role="alert" className="mt-4 text-sm text-red-700">Les montants financiers transmis sont incohérents.</p>}
    <div className="mt-6 border-t border-slate-200 pt-4"><BookingActions booking={booking} busy={busy} bookingAllowed={bookingAllowed} onAction={onAction} canPdf={canPdf} onPdf={onPdf} onDetail={NOOP} hideDetail /></div>
  </Dialog>;
}
