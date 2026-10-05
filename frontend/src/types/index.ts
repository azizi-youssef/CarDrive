export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SUPPORT'
  | 'AGENCY_OWNER'
  | 'AGENCY_MANAGER'
  | 'AGENCY_STAFF'
  | 'CUSTOMER';

export type AgencyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type VehicleCategory =
  | 'Économique'
  | 'SUV'
  | 'Berline'
  | 'Luxe'
  | '7 places'
  | 'Automatique'
  | 'Citadine'
  | 'Compacte';

export type TransmissionType = 'MANUAL' | 'AUTOMATIC';
export type FuelType = 'DIESEL' | 'GASOLINE' | 'HYBRID' | 'ELECTRIC';
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'BLOCKED';

export type BookingStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'SENT_TO_AGENCY'
  | 'AGENCY_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ALTERNATIVE_PROPOSED'
  | 'READY_FOR_PICKUP'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PENDING' // Rétrocompatibilité
  | 'CONFIRMED'; // Rétrocompatibilité

export type CommissionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DUE'
  | 'PAID'
  | 'CANCELLED';

export type DeliveryType =
  | 'AGENCY_PICKUP'
  | 'AIRPORT'
  | 'HOTEL'
  | 'ADDRESS';

export type BookingEventType =
  | 'REQUEST_CREATED'
  | 'CUSTOMER_CONFIRMED'
  | 'PDF_GENERATED'
  | 'SENT_TO_AGENCY'
  | 'AGENCY_VIEWED'
  | 'AGENCY_ACCEPTED'
  | 'AGENCY_REJECTED'
  | 'ALTERNATIVE_PROPOSED'
  | 'CLIENT_NOTIFIED'
  | 'PICKUP_READY'
  | 'RENTAL_STARTED'
  | 'RENTAL_COMPLETED'
  | 'COMMISSION_CONFIRMED'
  | 'COMMISSION_PAID'
  | 'BOOKING_CANCELLED';

export interface BookingEvent {
  id: string;
  booking_id: string;
  actor_id?: string;
  actor_role: 'CUSTOMER' | 'AGENCY_OWNER' | 'AGENCY_MANAGER' | 'AGENCY_STAFF' | 'SUPER_ADMIN' | 'SYSTEM';
  event_type: BookingEventType | string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  commission_rate: number; // e.g. 15.00
  currency: string;
  payment_fee: number;
  cancellation_fee: number;
  created_at?: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  logo_url: string;
  banner_url?: string;
  status: AgencyStatus;
  verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  agency_id: string;
  agency?: Agency;
  unit_number: string;
  license_plate: string;
  brand: string;
  model: string;
  slug: string;
  year: number;
  category: VehicleCategory;
  transmission: TransmissionType;
  fuel: FuelType;
  seats: number;
  doors: number;
  air_conditioning: boolean;
  mileage: number;
  daily_price: number; // in MAD (DH)
  weekly_price?: number;
  monthly_price?: number;
  deposit: number;
  min_rental_days: number;
  status: VehicleStatus;
  published: boolean;
  featured: boolean;
  images: string[];
  features: string[];
  created_at: string;
}

export interface Booking {
  id: string;
  reference?: string; // e.g. CD-2026-001842
  booking_ref?: string; // alias rétrocompatible
  vehicle_id: string;
  vehicle?: Vehicle;
  agency_id: string;
  agency?: Agency;
  customer_id?: string;
  
  // Informations client
  first_name?: string;
  last_name?: string;
  customer_name: string;
  cin?: string;
  customer_email: string;
  customer_phone: string;
  customer_country?: string;
  birth_date?: string;
  license_number?: string;
  license_expiry?: string;

  // Dates et lieux
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  pickup_time: string;
  dropoff_time: string;
  pickup_location: string;
  dropoff_location: string;
  total_days: number;
  
  // Options
  delivery_type?: DeliveryType;
  flight_number?: string;
  flight_arrival_time?: string;
  child_seat?: boolean;
  additional_driver?: boolean;
  customer_notes?: string;
  agency_notes?: string;
  notes?: string;

  // Calculs financiers
  daily_price: number;
  subtotal?: number;
  total_price: number;
  commission_rate: number; // ex: 15.00
  commission_amount: number; // ex: 270
  agency_amount: number; // ex: 1530
  deposit_amount: number;

  // Statuts
  status: BookingStatus;
  agency_status?: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'ALTERNATIVE_PROPOSED';
  commission_status?: CommissionStatus;
  rejection_reason?: string;
  alternative_vehicle_id?: string;
  alternative_vehicle?: Vehicle;

  // Documents
  pdf_url?: string;

  // Timestamps
  requested_at?: string;
  reviewed_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;

  // Événements timeline
  events?: BookingEvent[];
}

export interface Review {
  id: string;
  vehicle_id: string;
  agency_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  transmission?: string;
  fuel?: string;
  minPrice?: number;
  maxPrice?: number;
  agencyId?: string;
  brand?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}
