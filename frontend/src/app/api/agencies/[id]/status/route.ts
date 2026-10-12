import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/auth/admin-api';
import { agenciesService } from '@/lib/services/agencies.service';
import type { AgencyStatus } from '@/types';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const body = await req.json();
    const status = body.status as AgencyStatus;
    const verified = Boolean(body.verified);

    if (!status) {
      return NextResponse.json({ success: false, error: 'Champ status requis' }, { status: 400 });
    }

    const updated = await agenciesService.updateAgencyStatus(id, status, verified);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Agence introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
