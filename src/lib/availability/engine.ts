import { Vehicle, Booking } from '@/types';

/**
 * Checks if two date ranges overlap
 */
export function doDatesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart <= bEnd && aEnd >= bStart;
}

/**
 * Determines if a specific vehicle is available for the given date range,
 * considering confirmed or active bookings
 */
export function isVehicleAvailable(
  vehicle: Vehicle,
  bookings: Booking[],
  startDate?: string,
  endDate?: string
): boolean {
  if (vehicle.status !== 'AVAILABLE' || !vehicle.published) {
    return false;
  }

  if (!startDate || !endDate) {
    return true;
  }

  // Check against active/confirmed bookings
  const hasConflict = bookings.some((b) => {
    if (b.vehicle_id !== vehicle.id) return false;
    if (b.status === 'CANCELLED' || b.status === 'REJECTED') return false;
    return doDatesOverlap(startDate, endDate, b.start_date, b.end_date);
  });

  return !hasConflict;
}

/**
 * Core Proposition Moteur:
 * When a requested vehicle is unavailable or being viewed,
 * find exact or equivalent models available at other verified agencies in Nador!
 */
export function findSameModelAlternatives(params: {
  currentVehicle: Vehicle;
  allVehicles: Vehicle[];
  allBookings: Booking[];
  startDate?: string;
  endDate?: string;
}): Vehicle[] {
  const { currentVehicle, allVehicles, allBookings, startDate, endDate } = params;

  return allVehicles.filter((v) => {
    // Exclude the current vehicle itself
    if (v.id === currentVehicle.id) return false;

    // Check same model or same brand+category
    const isExactModelMatch =
      v.brand.toLowerCase() === currentVehicle.brand.toLowerCase() &&
      v.model.toLowerCase() === currentVehicle.model.toLowerCase();

    const isCategoryMatch =
      v.category === currentVehicle.category &&
      v.transmission === currentVehicle.transmission;

    if (!isExactModelMatch && !isCategoryMatch) {
      return false;
    }

    // Must be available for the selected dates
    return isVehicleAvailable(v, allBookings, startDate, endDate);
  });
}
