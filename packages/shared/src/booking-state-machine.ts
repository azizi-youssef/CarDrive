import type { BookingStatus } from './booking-status';
import { normalizeBookingStatus } from './booking-status';

export type BookingActorRole =
  | 'CUSTOMER'
  | 'AGENCY_OWNER'
  | 'AGENCY_MANAGER'
  | 'AGENCY_STAFF'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'SUPPORT'
  | 'SYSTEM';

export type AgencyBookingAction = 'approve' | 'reject' | 'propose_alternative';

const AGENCY_ACTION_FROM: Record<AgencyBookingAction, BookingStatus[]> = {
  approve: ['REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW', 'PENDING'],
  reject: ['REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW', 'ALTERNATIVE_PROPOSED', 'PENDING'],
  propose_alternative: ['REQUESTED', 'UNDER_REVIEW', 'SENT_TO_AGENCY', 'AGENCY_REVIEW', 'PENDING'],
};

const AGENCY_ACTION_TO: Record<AgencyBookingAction, BookingStatus> = {
  approve: 'APPROVED',
  reject: 'REJECTED',
  propose_alternative: 'ALTERNATIVE_PROPOSED',
};

export function canPerformAgencyBookingAction(
  currentStatus: string,
  action: AgencyBookingAction
): boolean {
  const normalized = normalizeBookingStatus(currentStatus);
  const allowed = AGENCY_ACTION_FROM[action];
  return allowed.includes(normalized as BookingStatus);
}

export function targetStatusForAgencyAction(action: AgencyBookingAction): BookingStatus {
  return AGENCY_ACTION_TO[action];
}

export function isPlatformAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

export function isPlatformStaffRole(role: string): boolean {
  return isPlatformAdminRole(role) || role === 'SUPPORT';
}

export function isAgencyRole(role: string): boolean {
  return role === 'AGENCY_OWNER' || role === 'AGENCY_MANAGER' || role === 'AGENCY_STAFF';
}
