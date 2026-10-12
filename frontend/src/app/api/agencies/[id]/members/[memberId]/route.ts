import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createClient } from '@/lib/supabase/server';
import { agencyMemberRoleUpdateSchema } from '@/lib/validations/agency-access';

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: agencyId, memberId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'members.update_role');
  if (gate.denied) return gate.denied;

  const body: unknown = await request.json().catch(() => null);
  const parsed = agencyMemberRoleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => issue.message).join(', '), 400);
  }
  const supabase = await createClient();
  if (!supabase) return failure('Service de données indisponible.', 503);
  const { error } = await supabase.rpc('change_agency_member_role', {
    p_member_id: memberId,
    p_role: parsed.data.role,
  });
  if (error) {
    if (error.code === '42501') return failure('Cette modification de rôle n’est pas autorisée.', 403);
    if (error.code === 'P0002') return failure('Membre introuvable.', 404);
    console.error('[AgencyMembers] Role update failed:', error.message);
    return failure('Impossible de modifier le rôle.', 500);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: agencyId, memberId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'members.revoke');
  if (gate.denied) return gate.denied;

  const supabase = await createClient();
  if (!supabase) return failure('Service de données indisponible.', 503);
  const { error } = await supabase.rpc('revoke_agency_member', {
    p_member_id: memberId,
  });
  if (error) {
    if (error.code === '42501') return failure('La révocation de ce membre n’est pas autorisée.', 403);
    if (error.code === 'P0002') return failure('Membre introuvable.', 404);
    if (error.code === '23514') return failure('La dernière personne administratrice ne peut pas être révoquée.', 409);
    console.error('[AgencyMembers] Revocation failed:', error.message);
    return failure('Impossible de révoquer ce membre.', 500);
  }
  return NextResponse.json({ success: true });
}
