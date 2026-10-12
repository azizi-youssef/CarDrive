export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUPPORT',
  'AGENCY_OWNER',
  'AGENCY_MANAGER',
  'AGENCY_STAFF',
  'CUSTOMER',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const AGENCY_MEMBER_ROLES = [
  'agency_admin',
  'agency_manager',
  'agency_agent',
  'viewer',
] as const;

export type AgencyMemberRole = (typeof AGENCY_MEMBER_ROLES)[number];

export const ACCESS_PERMISSIONS = [
  'agencies.read',
  'agencies.create',
  'agencies.update',
  'agencies.suspend',
  'agencies.delete',
  'members.read',
  'members.invite',
  'members.update_role',
  'members.revoke',
  'vehicles.read',
  'vehicles.manage',
  'bookings.read',
  'bookings.manage',
  'customers.read',
  'reports.read',
] as const;

export type AccessPermission = (typeof ACCESS_PERMISSIONS)[number];

export const AGENCY_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const;
export type AgencyStatus = (typeof AGENCY_STATUSES)[number];
