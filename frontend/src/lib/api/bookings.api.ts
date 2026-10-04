import { apiFetch } from './client';
import type { Booking } from '@/types';

export interface BookingCreateInput {
  vehicleId: string;
  agencyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  pickupTime?: string;
  dropoffTime?: string;
  pickupLocation: string;
  dropoffLocation: string;
  notes?: string;
}

/**
 * Récupère les réservations (optionnellement filtrées par agence)
 */
export async function getBookings(agencyId?: string) {
  const query = agencyId ? `?agencyId=${agencyId}` : '';
  return apiFetch<Booking[]>(`/api/bookings${query}`);
}

/**
 * Récupère une réservation par ID
 */
export async function getBookingById(id: string) {
  return apiFetch<Booking>(`/api/bookings/${id}`);
}

/**
 * Crée une nouvelle réservation
 * Retourne les alternatives si le véhicule n'est pas disponible (error 409)
 */
export async function createBooking(input: BookingCreateInput) {
  return apiFetch<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Met à jour le statut d'une réservation
 */
export async function updateBookingStatus(
  id: string,
  status: Booking['status'],
  rejectionReason?: string
) {
  return apiFetch<Booking>(`/api/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rejectionReason }),
  });
}
