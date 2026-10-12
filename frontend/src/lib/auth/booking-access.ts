import { hasAccessPermission, type ServerAuthContext } from '@/lib/auth/server';
import type { Booking } from '@/types';

export async function authorizeBookingRead(
  auth: ServerAuthContext,
  booking: { agency_id: string; customer_id?: string | null }
): Promise<{ allowed: boolean; canReadCustomerData: boolean }> {
  if (auth.role === 'SUPER_ADMIN') {
    return { allowed: true, canReadCustomerData: true };
  }
  if (booking.customer_id && booking.customer_id === auth.userId) {
    return { allowed: true, canReadCustomerData: true };
  }
  if (!(await hasAccessPermission('bookings.read', booking.agency_id))) {
    return { allowed: false, canReadCustomerData: false };
  }
  return {
    allowed: true,
    canReadCustomerData: await hasAccessPermission('customers.read', booking.agency_id),
  };
}

export function redactBookingCustomerData(booking: Booking): Booking {
  return {
    ...booking,
    customer_id: undefined,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    first_name: undefined,
    last_name: undefined,
    cin: undefined,
    customer_country: undefined,
    birth_date: undefined,
    license_number: undefined,
    license_expiry: undefined,
    customer_notes: undefined,
    flight_number: undefined,
    flight_arrival_time: undefined,
    pickup_location: '',
    dropoff_location: '',
  };
}
