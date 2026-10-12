import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/server';
import {
  canAccessAdminPortal,
  canAccessAgencyPortal,
  agencyRoleLabel,
} from '@/lib/auth/portals';

export async function GET() {
  const auth = await getServerAuth();
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    configured: true,
    user: {
      id: auth.userId,
      email: auth.email,
      displayName: auth.displayName,
      avatarUrl: auth.avatarUrl,
      role: auth.role,
      roleLabel: agencyRoleLabel(auth.role),
      agencyIds: auth.agencyIds,
      agencyMemberships: auth.memberships,
      agencyName: auth.agencyName,
      agencyLogoUrl: auth.agencyLogoUrl,
      canAccessAdmin: canAccessAdminPortal(auth.role),
      canAccessAgency: canAccessAgencyPortal(auth.role, auth.agencyIds),
    },
  });
}
