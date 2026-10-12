/** UI projections of fields used by the supplied component; these are not database schemas. */
export interface AgencyView {
  id: string;
  name: string;
  verified: boolean;
}

export interface VehicleView {
  id: string;
  agency_id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  fuel: string | null;
  daily_price: number;
  deposit: number | null;
  unit_number: string;
  license_plate: string;
  status: string;
  images: string[];
  features: string[];
  seats: number | null;
  doors: number | null;
  mileage: number | null;
  min_rental_days: number | null;
  air_conditioning: boolean | null;
  published: boolean | null;
}

export interface BookingView {
  id: string;
  reference: string | null;
  booking_ref: string | null;
  customer_name: string;
  customer_phone: string | null;
  start_date: string;
  end_date: string;
  total_days: number | null;
  total_price: number;
  commission_amount: number | null;
  agency_amount: number | null;
  pickup_location: string | null;
  status: string;
  vehicle: { brand: string; model: string } | null;
}

export interface StatsView {
  totalVehicles: number;
  availableVehicles: number;
  currentlyRented: number;
  occupancyRate: number;
  pendingBookings: number;
  totalRevenue: number;
  netRevenue: number | null;
  platformCommission: number | null;
}

export interface VehicleForm {
  brand: string;
  model: string;
  unit_number: string;
  license_plate: string;
  year: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: string;
  doors: string;
  mileage: string;
  min_rental_days: string;
  daily_price: string;
  deposit: string;
  air_conditioning: boolean;
  images: string;
  features: string;
}

export type VehicleFormErrors = Partial<Record<keyof VehicleForm, string>>;

export interface VehicleOptions {
  categories: readonly { value: string; label: string }[];
  transmissions: readonly { value: string; label: string }[];
  fuels: readonly { value: string; label: string }[];
  minYear: number;
  maxYear: number;
  createDraft?: { status: string };
  supportsPatchFields?: boolean;
}

export class DashboardError extends Error {
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DashboardError';
    this.status = status;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(field: string): never {
  throw new DashboardError(`Réponse invalide : ${field}.`);
}

export class OperationLocks {
  private active = new Set<string>();
  acquire(key: string): boolean {
    if (this.active.has(key)) return false;
    this.active.add(key);
    return true;
  }
  release(key: string): void {
    this.active.delete(key);
  }
  snapshot(): ReadonlySet<string> {
    return new Set(this.active);
  }
}

export class RequestGeneration {
  private current = 0;
  next(): number {
    return ++this.current;
  }
  isCurrent(token: number): boolean {
    return this.current === token;
  }
  invalidate(): void {
    this.current++;
  }
}

export function awaitAbortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (res) => {
        signal.removeEventListener('abort', onAbort);
        resolve(res);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      }
    );
  });
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new DashboardError(`Réponse serveur invalide (HTTP ${response.status}).`, response.status);
  }
  if (!response.ok) {
    const message = isRecord(json) && typeof json.error === 'string' ? json.error : `Erreur HTTP ${response.status}`;
    throw new DashboardError(message, response.status);
  }
  return json;
}

export function assertSuccess(result: unknown): void {
  if (isRecord(result)) {
    if (result.success === false || result.error) {
      throw new DashboardError(typeof result.error === 'string' ? result.error : 'Opération impossible.');
    }
  }
}

export function bookingReference(booking: BookingView): string {
  return booking.reference || booking.booking_ref || booking.id || 'Sans référence';
}

export function canAccessAgency(
  profile: { role?: string; agencyIds?: readonly string[]; canAccessAdmin?: boolean } | null,
  agencyId: string
): boolean {
  if (!profile || !agencyId) return false;
  if (profile.canAccessAdmin) return true;
  return Array.isArray(profile.agencyIds) && profile.agencyIds.includes(agencyId);
}

export function decodeAgencies(json: unknown): AgencyView[] {
  let list: unknown[] = [];
  if (Array.isArray(json)) list = json;
  else if (isRecord(json) && Array.isArray(json.data)) list = json.data;
  else if (isRecord(json) && Array.isArray(json.agencies)) list = json.agencies;

  return list.map((item): AgencyView => {
    if (!isRecord(item)) invalid('agence');
    return {
      id: String(item.id || ''),
      name: String(item.name || 'Agence'),
      verified: Boolean(item.verified),
    };
  }).filter((a) => a.id.length > 0);
}

export function decodeStats(json: unknown, _agencyId?: string): StatsView {
  let data = json;
  if (isRecord(json) && isRecord(json.data)) data = json.data;
  if (!isRecord(data)) invalid('statistiques');
  const d = data as Record<string, unknown>;
  return {
    totalVehicles: typeof d.totalVehicles === 'number' ? d.totalVehicles : Number(d.totalVehicles) || 0,
    availableVehicles: typeof d.availableVehicles === 'number' ? d.availableVehicles : Number(d.availableVehicles) || 0,
    currentlyRented: typeof d.currentlyRented === 'number' ? d.currentlyRented : Number(d.currentlyRented) || 0,
    occupancyRate: typeof d.occupancyRate === 'number' ? d.occupancyRate : Number(d.occupancyRate) || 0,
    pendingBookings: typeof d.pendingBookings === 'number' ? d.pendingBookings : Number(d.pendingBookings) || 0,
    totalRevenue: typeof d.totalRevenue === 'number' ? d.totalRevenue : Number(d.totalRevenue) || 0,
    netRevenue: d.netRevenue !== undefined && d.netRevenue !== null ? Number(d.netRevenue) : null,
    platformCommission: d.platformCommission !== undefined && d.platformCommission !== null ? Number(d.platformCommission) : null,
  };
}

export function decodeFleet(json: unknown, agencyId?: string): VehicleView[] {
  let list: unknown[] = [];
  if (Array.isArray(json)) list = json;
  else if (isRecord(json) && Array.isArray(json.data)) list = json.data;
  else if (isRecord(json) && Array.isArray(json.vehicles)) list = json.vehicles;

  return list.map((item): VehicleView => {
    if (!isRecord(item)) invalid('véhicule');
    return {
      id: String(item.id || ''),
      agency_id: String(item.agency_id || agencyId || ''),
      brand: String(item.brand || ''),
      model: String(item.model || ''),
      year: typeof item.year === 'number' ? item.year : Number(item.year) || new Date().getFullYear(),
      category: String(item.category || ''),
      transmission: String(item.transmission || ''),
      fuel: item.fuel ? String(item.fuel) : null,
      daily_price: typeof item.daily_price === 'number' ? item.daily_price : Number(item.daily_price) || 0,
      deposit: item.deposit !== null && item.deposit !== undefined ? Number(item.deposit) : null,
      unit_number: String(item.unit_number || ''),
      license_plate: String(item.license_plate || ''),
      status: String(item.status || 'AVAILABLE'),
      images: Array.isArray(item.images) ? item.images.map(String) : [],
      features: Array.isArray(item.features) ? item.features.map(String) : [],
      seats: item.seats !== null && item.seats !== undefined ? Number(item.seats) : null,
      doors: item.doors !== null && item.doors !== undefined ? Number(item.doors) : null,
      mileage: item.mileage !== null && item.mileage !== undefined ? Number(item.mileage) : null,
      min_rental_days: item.min_rental_days !== null && item.min_rental_days !== undefined ? Number(item.min_rental_days) : null,
      air_conditioning: item.air_conditioning !== null && item.air_conditioning !== undefined ? Boolean(item.air_conditioning) : null,
      published: item.published !== null && item.published !== undefined ? Boolean(item.published) : null,
    };
  }).filter((v) => v.id.length > 0);
}

export function decodeBookings(json: unknown, _agencyId?: string): BookingView[] {
  let list: unknown[] = [];
  if (Array.isArray(json)) list = json;
  else if (isRecord(json) && Array.isArray(json.bookings)) list = json.bookings;
  else if (isRecord(json) && Array.isArray(json.data)) list = json.data;

  return list.map((item): BookingView => {
    if (!isRecord(item)) invalid('réservation');
    const vehicle = isRecord(item.vehicle) ? {
      brand: String(item.vehicle.brand || ''),
      model: String(item.vehicle.model || ''),
    } : null;
    return {
      id: String(item.id || ''),
      reference: item.reference ? String(item.reference) : null,
      booking_ref: item.booking_ref ? String(item.booking_ref) : null,
      customer_name: String(item.customer_name || 'Client'),
      customer_phone: item.customer_phone ? String(item.customer_phone) : null,
      start_date: String(item.start_date || ''),
      end_date: String(item.end_date || ''),
      total_days: item.total_days !== null && item.total_days !== undefined ? Number(item.total_days) : null,
      total_price: typeof item.total_price === 'number' ? item.total_price : Number(item.total_price) || 0,
      commission_amount: item.commission_amount !== null && item.commission_amount !== undefined ? Number(item.commission_amount) : null,
      agency_amount: item.agency_amount !== null && item.agency_amount !== undefined ? Number(item.agency_amount) : null,
      pickup_location: item.pickup_location ? String(item.pickup_location) : null,
      status: String(item.status || 'PENDING'),
      vehicle,
    };
  }).filter((b) => b.id.length > 0);
}

export function resolveAmounts(gross: number, commissionAmount: number | null, agencyAmount: number | null) {
  const derived = commissionAmount === null || agencyAmount === null;
  const commission = commissionAmount ?? Math.round(gross * 0.15);
  const net = agencyAmount ?? (gross - commission);
  const consistent = Math.abs((commission + net) - gross) <= 1;
  return {
    gross,
    commission,
    net,
    derived,
    consistent,
  };
}

export function normalizeSearch(text: string): string {
  return (text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function paginate<T>(list: T[], page: number, pageSize: number): {
  current: number;
  pages: number;
  total: number;
  offset: number;
  entries: T[];
} {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const offset = (current - 1) * pageSize;
  const entries = list.slice(offset, offset + pageSize);
  return { current, pages, total, offset, entries };
}

export function safeImageUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    const parsed = new URL(url, 'https://cardrive.invalid');
    return ['http:', 'https:'].includes(parsed.protocol) || url.startsWith('/');
  } catch {
    return false;
  }
}

export function emptyVehicleForm(): VehicleForm {
  return {
    brand: '',
    model: '',
    unit_number: '',
    license_plate: '',
    year: String(new Date().getFullYear()),
    category: '',
    transmission: '',
    fuel: '',
    seats: '5',
    doors: '5',
    mileage: '0',
    min_rental_days: '1',
    daily_price: '',
    deposit: '',
    air_conditioning: true,
    images: '',
    features: '',
  };
}

export function vehicleToForm(vehicle: VehicleView): VehicleForm {
  return {
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    unit_number: vehicle.unit_number || '',
    license_plate: vehicle.license_plate || '',
    year: String(vehicle.year ?? ''),
    category: vehicle.category || '',
    transmission: vehicle.transmission || '',
    fuel: vehicle.fuel || '',
    seats: vehicle.seats !== null && vehicle.seats !== undefined ? String(vehicle.seats) : '',
    doors: vehicle.doors !== null && vehicle.doors !== undefined ? String(vehicle.doors) : '',
    mileage: vehicle.mileage !== null && vehicle.mileage !== undefined ? String(vehicle.mileage) : '',
    min_rental_days: vehicle.min_rental_days !== null && vehicle.min_rental_days !== undefined ? String(vehicle.min_rental_days) : '',
    daily_price: vehicle.daily_price !== undefined ? String(vehicle.daily_price) : '',
    deposit: vehicle.deposit !== null && vehicle.deposit !== undefined ? String(vehicle.deposit) : '',
    air_conditioning: Boolean(vehicle.air_conditioning),
    images: Array.isArray(vehicle.images) ? vehicle.images.join('\n') : '',
    features: Array.isArray(vehicle.features) ? vehicle.features.join('\n') : '',
  };
}

export function vehicleWriteFields(form: VehicleForm): Record<string, unknown> {
  const images = form.images
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const features = form.features
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const payload: Record<string, unknown> = {
    brand: form.brand.trim(),
    model: form.model.trim(),
    unit_number: form.unit_number.trim(),
    license_plate: form.license_plate.trim(),
    year: parseInt(form.year, 10) || new Date().getFullYear(),
    category: form.category,
    transmission: form.transmission,
    fuel: form.fuel || null,
    air_conditioning: form.air_conditioning,
    daily_price: parseFloat(form.daily_price) || 0,
    images,
    features,
  };

  if (form.seats.trim()) payload.seats = parseInt(form.seats, 10);
  if (form.doors.trim()) payload.doors = parseInt(form.doors, 10);
  if (form.mileage.trim()) payload.mileage = parseInt(form.mileage, 10);
  if (form.min_rental_days.trim()) payload.min_rental_days = parseInt(form.min_rental_days, 10);
  if (form.deposit.trim()) payload.deposit = parseFloat(form.deposit);

  return payload;
}

export function vehiclePatch(form: VehicleForm, current: VehicleView): Record<string, unknown> {
  const full = vehicleWriteFields(form);
  const baseline = vehicleWriteFields(vehicleToForm(current));
  const diff: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(full)) {
    if (JSON.stringify(value) !== JSON.stringify(baseline[key])) {
      diff[key] = value;
    }
  }

  return diff;
}

export function validateVehicleForm(
  form: VehicleForm,
  options: VehicleOptions,
  fleet: VehicleView[],
  currentId?: string
): VehicleFormErrors {
  const errors: VehicleFormErrors = {};

  if (!form.brand.trim()) errors.brand = 'La marque est obligatoire.';
  if (!form.model.trim()) errors.model = 'Le modèle est obligatoire.';
  if (!form.unit_number.trim()) {
    errors.unit_number = 'Le numéro d’unité est obligatoire.';
  } else if (
    fleet.some(
      (v) => v.id !== currentId && v.unit_number.toLowerCase() === form.unit_number.trim().toLowerCase()
    )
  ) {
    errors.unit_number = 'Ce numéro d’unité existe déjà.';
  }

  if (!form.license_plate.trim()) {
    errors.license_plate = 'L’immatriculation est obligatoire.';
  } else if (
    fleet.some(
      (v) => v.id !== currentId && v.license_plate.toLowerCase() === form.license_plate.trim().toLowerCase()
    )
  ) {
    errors.license_plate = 'Cette immatriculation existe déjà.';
  }

  const yearNum = parseInt(form.year, 10);
  if (!form.year.trim() || isNaN(yearNum) || yearNum < options.minYear || yearNum > options.maxYear) {
    errors.year = `L’année doit être comprise entre ${options.minYear} et ${options.maxYear}.`;
  }

  if (!form.category) errors.category = 'La catégorie est obligatoire.';
  if (!form.transmission) errors.transmission = 'La boîte de vitesses est obligatoire.';
  if (!form.fuel) errors.fuel = 'Le carburant est obligatoire.';

  const priceNum = parseFloat(form.daily_price);
  if (!form.daily_price.trim() || isNaN(priceNum) || priceNum <= 0) {
    errors.daily_price = 'Le prix par jour doit être supérieur à 0.';
  }

  if (form.deposit.trim()) {
    const depositNum = parseFloat(form.deposit);
    if (isNaN(depositNum) || depositNum < 0) {
      errors.deposit = 'La caution ne peut pas être négative.';
    }
  }

  if (form.images.trim()) {
    const urls = form.images.split('\n').map((u) => u.trim()).filter(Boolean);
    const invalidUrl = urls.some((u) => !safeImageUrl(u));
    if (invalidUrl) {
      errors.images = 'Une ou plusieurs URL d’images sont invalides.';
    }
  }

  return errors;
}
