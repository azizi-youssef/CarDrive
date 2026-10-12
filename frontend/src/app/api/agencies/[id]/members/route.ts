import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { agencyInviteSchema } from '@/lib/validations/agency-access';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'members.read');
  if (gate.denied) return gate.denied;

  const supabase = await createClient();
  if (!supabase) return failure('Service de données indisponible.', 503);
  const { data: members, error } = await supabase
    .from('agency_members')
    .select('id, user_id, role, status, created_at, invited_at, revoked_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AgencyMembers] Listing failed:', error.message);
    return failure('Impossible de charger les membres.', 500);
  }

  const userIds = [...new Set((members ?? []).map((member) => member.user_id))];
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
    : { data: [], error: null };
  if (profileError) {
    console.error('[AgencyMembers] Profile lookup failed:', profileError.message);
    return failure('Impossible de charger les informations des membres.', 500);
  }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return NextResponse.json({
    success: true,
    data: (members ?? []).map((member) => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      status: member.status,
      created_at: member.created_at,
      invited_at: member.invited_at,
      revoked_at: member.revoked_at,
      email: profileById.get(member.user_id)?.email ?? '',
      full_name: profileById.get(member.user_id)?.full_name ?? '',
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'members.invite');
  if (gate.denied) return gate.denied;

  const body: unknown = await request.json().catch(() => null);
  const parsed = agencyInviteSchema.safeParse(body);
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => issue.message).join(', '), 400);
  }

  const supabase = await createClient();
  const admin = await createAdminClient();
  if (!supabase || !admin) {
    return failure('Les invitations nécessitent une clé Supabase administrateur configurée.', 503);
  }

  const { data: existingProfile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle();
  if (profileError) {
    console.error('[AgencyMembers] Invite lookup failed:', profileError.message);
    return failure('Impossible de vérifier le compte destinataire.', 500);
  }

  if (existingProfile) {
    return failure(
      'Ce compte existe déjà. L’invitation par e-mail Supabase est réservée aux nouveaux comptes.',
      409
    );
  }

  const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(
        `/agency/invitations/accept?agencyId=${agencyId}`
      )}`,
    }
  );
  if (invitationError) {
    if (invitationError.code === 'email_exists' || invitationError.status === 422) {
      return failure(
        'Ce compte existe déjà. L’invitation par e-mail Supabase est réservée aux nouveaux comptes.',
        409
      );
    }
    console.error('[AgencyMembers] Supabase invitation failed:', invitationError.message);
    return failure('Impossible d’envoyer l’invitation.', 502);
  }
  const userId = invitation.user?.id;
  if (!userId) return failure('Supabase n’a pas retourné le compte invité.', 502);

  const { data: memberId, error: memberError } = await supabase.rpc('invite_agency_member', {
    p_agency_id: agencyId,
    p_user_id: userId,
    p_role: parsed.data.role,
  });
  if (memberError) {
    console.error('[AgencyMembers] Membership invitation failed:', memberError.message);
    if (memberError.code === '42501') return failure('Cette attribution de rôle n’est pas autorisée.', 403);
    if (memberError.code === '23505') return failure('Une invitation ou adhésion existe déjà pour ce compte.', 409);
    return failure('Le compte a été invité, mais son accès agence n’a pas pu être préparé. Réessayez ou contactez le support.', 502);
  }

  return NextResponse.json({
    success: true,
    data: { id: memberId, email: parsed.data.email, role: parsed.data.role, status: 'INVITED' },
  }, { status: 201 });
}
