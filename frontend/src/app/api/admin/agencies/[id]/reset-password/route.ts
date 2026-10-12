import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { resetAgencyPasswordSchema } from '@/lib/validations/agency-access';
import { generateTemporaryPassword } from '@/lib/utils/agency-credentials';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const gate = await requirePlatformPermissionApi('agencies.update');
  if (gate.denied) return gate.denied;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = resetAgencyPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return failure(parsed.error.issues.map((i) => i.message).join(', '), 400);
  }

  const supabase = await createClient();
  if (!supabase) return failure('Service de données indisponible.', 503);

  const adminClient = await createAdminClient();
  if (!adminClient) {
    return failure('Service de sécurité administrateur indisponible.', 503);
  }

  // 1. Récupérer l'agence
  const { data: agency, error: agencyError } = await adminClient
    .from('agencies')
    .select('id, name, email, archived_at')
    .eq('id', id)
    .maybeSingle();

  if (agencyError || !agency) {
    return failure('Agence introuvable.', 404);
  }

  if (agency.archived_at) {
    return failure('Impossible de réinitialiser le mot de passe d’une agence archivée.', 400);
  }

  // 2. Trouver l'utilisateur propriétaire dans agency_members ou profiles
  const { data: member } = await adminClient
    .from('agency_members')
    .select('user_id')
    .eq('agency_id', id)
    .in('role', ['agency_admin', 'AGENCY_OWNER'])
    .maybeSingle();

  let targetUserId = member?.user_id;

  if (!targetUserId) {
    // Fallback: chercher dans profiles par email
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('email', agency.email)
      .maybeSingle();
    targetUserId = profile?.id;
  }

  if (!targetUserId) {
    return failure('Compte utilisateur d’authentification introuvable pour cette agence.', 404);
  }

  // 3. Nouveau mot de passe temporaire
  const newPassword = parsed.data.password || generateTemporaryPassword(14);

  // 4. Mettre à jour dans Supabase Auth
  const { error: authError } = await adminClient.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
    email_confirm: true,
  });

  if (authError) {
    console.error('[AdminAgencies] Password reset failed:', authError.message);
    return failure(`Échec de réinitialisation : ${authError.message}`, 500);
  }

  // 5. Journaliser l'action (SANS le mot de passe !)
  await adminClient.from('audit_logs').insert({
    user_id: gate.auth.userId,
    action: 'AGENCY_PASSWORD_RESET',
    entity_type: 'AGENCY',
    entity_id: id,
    metadata: {
      agency_name: agency.name,
      email: agency.email,
      target_user_id: targetUserId,
    },
  });

  return NextResponse.json({
    success: true,
    credentials: {
      agencyName: agency.name,
      email: agency.email,
      temporaryPassword: newPassword,
    },
  });
}
