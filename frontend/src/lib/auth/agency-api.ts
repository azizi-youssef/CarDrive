import { NextResponse } from 'next/server';
import { getServerAuth, canManageAgencyBooking } from '@/lib/auth/server';
import { canAccessAgencyPortal } from '@/lib/auth/portals';

type ServerAuth = NonNullable<Awaited<ReturnType<typeof getServerAuth>>>;

export type AgencyPortalGate =
  | { auth: ServerAuth; denied: null }
  | { auth: null; denied: NextResponse };

export async function requireAgencyPortalApi(): Promise<AgencyPortalGate> {
  const auth = await getServerAuth();
  if (!auth) {
    return {
      auth: null,
      denied: NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      ),
    };
  }

  if (!canAccessAgencyPortal(auth.role, auth.agencyIds)) {
    return {
      auth: null,
      denied: NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 }),
    };
  }

  return { auth, denied: null };
}

export type AgencyScopeGate =
  | { auth: ServerAuth; denied: null }
  | { auth: null; denied: NextResponse };

export async function requireAgencyScopeApi(agencyId: string): Promise<AgencyScopeGate> {
  const gate = await requireAgencyPortalApi();
  if (gate.denied) return gate;

  if (!canManageAgencyBooking(gate.auth, agencyId)) {
    return {
      auth: null,
      denied: NextResponse.json(
        { success: false, error: 'Accès refusé à cette agence' },
        { status: 403 }
      ),
    };
  }

  return { auth: gate.auth, denied: null };
}
