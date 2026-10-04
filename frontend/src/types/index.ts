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
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'NO_SHOW';

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
  booking_ref: string; // e.g. #NRD-4821
  vehicle_id: string;
  vehicle?: Vehicle;
  agency_id: string;
  agency?: Agency;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  pickup_time: string;
  dropoff_time: string;
  pickup_location: string;
  dropoff_location: string;
  total_days: number;
  daily_price: number;
  total_price: number;
  commission_rate?: number; // ex: 0.15 pour 15%
  commission_amount?: number; // 15% du prix total
  agency_amount?: number; // 85% reversé à l'agence
  deposit_amount: number;
  status: BookingStatus;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
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
