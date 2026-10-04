import { Agency, Vehicle, Booking, Review, SearchFilters, BookingStatus, AgencyStatus } from '@/types';
import { INITIAL_AGENCIES, INITIAL_VEHICLES, INITIAL_REVIEWS } from './mockData';
import { isVehicleAvailable } from '../availability/engine';

// Initial sample bookings
const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    booking_ref: '#NRD-8421',
    vehicle_id: 'car-1',
    agency_id: 'agency-1',
    customer_name: 'Anas El Khattabi',
    customer_email: 'anas.elkhattabi@gmail.com',
    customer_phone: '+212 661 98 76 54',
    start_date: '2026-10-10',
    end_date: '2026-10-15',
    pickup_time: '10:30',
    dropoff_time: '14:00',
    pickup_location: 'Aéroport Nador Al-Aroui (NDR)',
    dropoff_location: 'Aéroport Nador Al-Aroui (NDR)',
    total_days: 5,
    daily_price: 360,
    total_price: 1800,
    deposit_amount: 3000,
    status: 'CONFIRMED',
    created_at: '2026-10-01T14:20:00Z',
  },
  {
    id: 'book-2',
    booking_ref: '#NRD-9104',
    vehicle_id: 'car-2',
    agency_id: 'agency-2',
    customer_name: 'Omar Benali',
    customer_email: 'omar.benali@outlook.fr',
    customer_phone: '+33 6 12 34 56 78',
    start_date: '2026-10-12',
    end_date: '2026-10-18',
    pickup_time: '16:00',
    dropoff_time: '12:00',
    pickup_location: 'Corniche Marchica (Nador)',
    dropoff_location: 'Aéroport Nador Al-Aroui (NDR)',
    total_days: 6,
    daily_price: 340,
    total_price: 2040,
    deposit_amount: 3000,
    status: 'PENDING',
    created_at: '2026-10-02T08:15:00Z',
  },
  {
    id: 'book-3',
    booking_ref: '#NRD-5532',
    vehicle_id: 'car-10',
    agency_id: 'agency-2',
    customer_name: 'Tarik Amrani',
    customer_email: 'tarik.amrani@gmail.com',
    customer_phone: '+212 662 45 67 89',
    start_date: '2026-10-05',
    end_date: '2026-10-08',
    pickup_time: '09:00',
    dropoff_time: '19:00',
    pickup_location: 'Centre-Ville Nador (Boulevard Mohammed V)',
    dropoff_location: 'Centre-Ville Nador (Boulevard Mohammed V)',
    total_days: 3,
    daily_price: 680,
    total_price: 2040,
    deposit_amount: 5000,
    status: 'ACTIVE',
    created_at: '2026-10-02T05:00:00Z',
  },
];

class CarDriveStore {
  private agencies: Agency[] = [...INITIAL_AGENCIES];
  private vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  private bookings: Booking[] = [...INITIAL_BOOKINGS];
  private reviews: Review[] = [...INITIAL_REVIEWS];

  constructor() {
    this.linkRelations();
  }

  private linkRelations() {
    this.vehicles = this.vehicles.map((v) => ({
      ...v,
      agency: this.agencies.find((a) => a.id === v.agency_id),
    }));

    this.bookings = this.bookings.map((b) => ({
      ...b,
      vehicle: this.vehicles.find((v) => v.id === b.vehicle_id),
      agency: this.agencies.find((a) => a.id === b.agency_id),
    }));
  }

  // --- AGENCIES ---
  public getAgencies(onlyActive = true): Agency[] {
    if (onlyActive) {
      return this.agencies.filter((a) => a.status === 'ACTIVE');
    }
    return [...this.agencies];
  }

  public getAgencyBySlug(slug: string): Agency | undefined {
    return this.agencies.find((a) => a.slug === slug);
  }

  public getAgencyById(id: string): Agency | undefined {
    return this.agencies.find((a) => a.id === id);
  }

  public updateAgencyStatus(id: string, status: AgencyStatus, verified: boolean): Agency | undefined {
    const agency = this.agencies.find((a) => a.id === id);
    if (agency) {
      agency.status = status;
      agency.verified = verified;
      this.linkRelations();
    }
    return agency;
  }

  // --- VEHICLES ---
  public getVehicles(filters?: SearchFilters): Vehicle[] {
    let result = this.vehicles.filter((v) => v.published);

    if (!filters) return result;

    if (filters.agencyId) {
      result = result.filter((v) => v.agency_id === filters.agencyId);
    }

    if (filters.category && filters.category !== 'Tous les types') {
      result = result.filter((v) => v.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters.brand) {
      result = result.filter((v) => v.brand.toLowerCase() === filters.brand!.toLowerCase());
    }

    if (filters.transmission) {
      result = result.filter((v) => v.transmission === filters.transmission);
    }

    if (filters.fuel) {
      result = result.filter((v) => v.fuel === filters.fuel);
    }

    if (filters.minPrice) {
      result = result.filter((v) => v.daily_price >= filters.minPrice!);
    }

    if (filters.maxPrice) {
      result = result.filter((v) => v.daily_price <= filters.maxPrice!);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (v) =>
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.agency?.name.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }

    // Availability filter by dates
    if (filters.startDate && filters.endDate) {
      result = result.filter((v) =>
        isVehicleAvailable(v, this.bookings, filters.startDate, filters.endDate)
      );
    }

    // Sorting
    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.daily_price - b.daily_price);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.daily_price - a.daily_price);
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) => (b.agency?.rating || 0) - (a.agency?.rating || 0));
    } else {
      // Default: featured first, then newest
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }

  public getVehicleBySlug(slug: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.slug === slug);
  }

  public addVehicle(newCar: Omit<Vehicle, 'id' | 'created_at'>): Vehicle {
    const id = `car-${Date.now()}`;
    const vehicle: Vehicle = {
      ...newCar,
      id,
      created_at: new Date().toISOString(),
    };
    this.vehicles.unshift(vehicle);
    this.linkRelations();
    return vehicle;
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | undefined {
    const index = this.vehicles.findIndex((v) => v.id === id);
    if (index !== -1) {
      this.vehicles[index] = { ...this.vehicles[index], ...updates };
      this.linkRelations();
      return this.vehicles[index];
    }
    return undefined;
  }

  public deleteVehicle(id: string): boolean {
    const initialLen = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    this.linkRelations();
    return this.vehicles.length < initialLen;
  }

  // --- BOOKINGS ---
  public getBookings(agencyId?: string): Booking[] {
    let list = [...this.bookings];
    if (agencyId) {
      list = list.filter((b) => b.agency_id === agencyId);
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public createBooking(data: Omit<Booking, 'id' | 'created_at'>): Booking {
    const id = `book-${Date.now()}`;
    const commission_rate = data.commission_rate ?? 0.15;
    const commission_amount = data.commission_amount ?? Math.round(data.total_price * commission_rate);
    const agency_amount = data.agency_amount ?? (data.total_price - commission_amount);

    const newBooking: Booking = {
      ...data,
      commission_rate,
      commission_amount,
      agency_amount,
      id,
      created_at: new Date().toISOString(),
    };
    this.bookings.unshift(newBooking);
    this.linkRelations();
    return newBooking;
  }

  public updateBookingStatus(
    id: string,
    status: BookingStatus,
    rejectionReason?: string
  ): Booking | undefined {
    const booking = this.bookings.find((b) => b.id === id);
    if (booking) {
      booking.status = status;
      if (rejectionReason) booking.rejection_reason = rejectionReason;
      this.linkRelations();
    }
    return booking;
  }

  // --- REVIEWS ---
  public getReviewsForVehicle(vehicleId: string): Review[] {
    return this.reviews.filter((r) => r.vehicle_id === vehicleId);
  }

  public addReview(review: Omit<Review, 'id' | 'created_at'>): Review {
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.reviews.unshift(newRev);
    return newRev;
  }

  // --- STATS ---
  public getAgencyStats(agencyId: string) {
    const agencyVehicles = this.vehicles.filter((v) => v.agency_id === agencyId);
    const agencyBookings = this.bookings.filter((b) => b.agency_id === agencyId);

    const totalVehicles = agencyVehicles.length;
    const availableVehicles = agencyVehicles.filter((v) => v.status === 'AVAILABLE').length;
    const currentlyRented = agencyVehicles.filter((v) => v.status === 'RENTED').length;
    const pendingBookings = agencyBookings.filter((b) => b.status === 'PENDING').length;
    const confirmedBookings = agencyBookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE').length;

    const totalRevenue = agencyBookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED' || b.status === 'ACTIVE')
      .reduce((acc, curr) => acc + curr.total_price, 0);

    const platformCommission = Math.round(totalRevenue * 0.15); // 15% CarDrive
    const netRevenue = totalRevenue - platformCommission; // 85% Net Agence

    const occupancyRate = totalVehicles > 0 ? Math.round((currentlyRented / totalVehicles) * 100) : 0;

    return {
      totalVehicles,
      availableVehicles,
      currentlyRented,
      pendingBookings,
      confirmedBookings,
      totalRevenue,
      platformCommission,
      netRevenue,
      occupancyRate,
    };
  }

  public getAdminStats() {
    const totalAgencies = this.agencies.length;
    const verifiedAgencies = this.agencies.filter((a) => a.verified).length;
    const pendingAgencies = this.agencies.filter((a) => a.status === 'PENDING').length;
    const totalVehicles = this.vehicles.length;
    const totalBookings = this.bookings.length;
    const totalVolume = this.bookings.reduce((sum, b) => sum + b.total_price, 0);

    return {
      totalAgencies,
      verifiedAgencies,
      pendingAgencies,
      totalVehicles,
      totalBookings,
      totalVolume,
      platformCommission: Math.round(totalVolume * 0.15), // 15% commission model CarDrive
    };
  }
}

// Global Singleton for in-memory session persistence
export const store = new CarDriveStore();
