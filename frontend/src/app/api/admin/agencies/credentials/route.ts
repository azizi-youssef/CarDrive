import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  generateTemporaryPassword,
  normalizeAgencySlug,
  resolveUniqueAgencyEmail,
} from '@/lib/utils/agency-credentials';

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  const gate = await requirePlatformPermissionApi('agencies.create');
  if (gate.denied) return gate.denied;

  const name = (request.nextUrl.searchParams.get('name') ?? '').trim();
  if (!name) {
    return failure('Nom d’agence requis.', 400);
  }

  const adminClient = await createAdminClient();
  const db = adminClient || (await createClient());
  if (!db) return failure('Service de données indisponible.', 503);

  // Fonction de vérification d'existence de l'email
  const isEmailTaken = async (candidate: string): Promise<boolean> => {
    // 1. Vérifier dans la table agencies
    const { count: agencyCount } = await db
      .from('agencies')
      .select('id', { count: 'exact', head: true })
      .ilike('email', candidate)
      .is('archived_at', null);

    if (agencyCount && agencyCount > 0) return true;

    // 2. Vérifier dans auth.users si adminClient est disponible
    if (adminClient) {
      try {
        const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 100 });
        const exists = usersData?.users?.some(
          (u) => u.email?.toLowerCase() === candidate.toLowerCase()
        );
        if (exists) return true;
      } catch {
        // Ignoré
      }
    }

    return false;
  };

  const email = await resolveUniqueAgencyEmail(name, isEmailTaken);
  const password = generateTemporaryPassword(14);
  const slug = normalizeAgencySlug(name);

  return NextResponse.json({
    success: true,
    data: {
      email,
      temporaryPassword: password,
      slug,
    },
  });
}
