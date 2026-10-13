import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

const settingsUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Le nom commercial est requis').optional(),
  description: z.string().trim().optional(),
  phone: z.string().trim().min(8, 'Numéro de téléphone requis').optional(),
  whatsapp: z.string().trim().optional(),
  email: z.string().email('Email invalide').optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'agencies.read');
  if (gate.denied) return gate.denied;

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de base de données indisponible.', 503);

  const { data: agency, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .maybeSingle();

  if (error || !agency) {
    return failure('Agence introuvable.', 404);
  }

  return NextResponse.json({
    success: true,
    data: agency,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'agencies.update');
  if (gate.denied) return gate.denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure('Corps de requête JSON invalide.', 400);
  }

  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return failure(parsed.error.issues.map((i) => i.message).join(', '), 422);
  }

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de base de données indisponible.', 503);

  const { data: updated, error } = await supabase
    .from('agencies')
    .update(parsed.data)
    .eq('id', agencyId)
    .select()
    .single();

  if (error) {
    console.error('[AgencySettings] Update error:', error.message);
    return failure(`Erreur mise à jour paramètres: ${error.message}`, 500);
  }

  return NextResponse.json({
    success: true,
    data: updated,
  });
}
