import { NextRequest, NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const auth = await getServerAuth();
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Authentification requise' },
      { status: 401 }
    );
  }

  const { id: agencyId } = await context.params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Service de données indisponible.' },
      { status: 503 }
    );
  }

  const { error } = await supabase.rpc('accept_agency_invitation', {
    p_agency_id: agencyId,
  });

  if (error) {
    if (error.code === 'P0002' || error.code === '42501') {
      return NextResponse.json(
        { success: false, error: 'Invitation invalide ou expirée.' },
        { status: 403 }
      );
    }
    console.error('[AgencyMembers] Invitation acceptance failed:', error.message);
    return NextResponse.json(
      { success: false, error: 'Impossible d\'accepter cette invitation.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
