import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { AGENCY_LOGO_ASSETS } from '@/lib/constants/agency-logo-assets';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'cardrive-agency-logos';

function failure(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST() {
  const gate = await requirePlatformPermissionApi('agencies.update');
  if (gate.denied) return gate.denied;

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de stockage indisponible.', 503);

  const { data: agencies, error: lookupError } = await supabase
    .from('agencies')
    .select('id, slug, logo_url')
    .in('slug', Object.keys(AGENCY_LOGO_ASSETS));
  if (lookupError) {
    console.error('[AgencyLogoSync] Agency lookup failed:', lookupError.message);
    return failure('Impossible de charger les agences.', 500);
  }

  let saved = 0;
  let skipped = 0;
  for (const agency of agencies ?? []) {
    if (agency.logo_url?.trim()) {
      skipped += 1;
      continue;
    }

    const asset = AGENCY_LOGO_ASSETS[agency.slug];
    if (!asset) continue;

    let bytes: Buffer;
    try {
      bytes = await readFile(path.join(process.cwd(), 'public', asset.fileName));
    } catch (error) {
      console.error(`[AgencyLogoSync] Bundled logo could not be read for ${agency.slug}:`, error);
      return failure(`Le fichier logo de ${agency.slug} est introuvable.`, 500);
    }

    const objectPath = `${agency.id}/logo.${asset.fileName.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: asset.contentType,
        cacheControl: '3600',
        upsert: true,
      });
    if (uploadError) {
      console.error(`[AgencyLogoSync] Upload failed for ${agency.slug}:`, uploadError.message);
      return failure(
        'Impossible d’importer les logos. Vérifiez que la migration de stockage des logos est appliquée.',
        503
      );
    }

    const logoUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
    let updateQuery = supabase
      .from('agencies')
      .update({ logo_url: logoUrl })
      .eq('id', agency.id);
    updateQuery =
      agency.logo_url == null
        ? updateQuery.is('logo_url', null)
        : updateQuery.eq('logo_url', '');
    const { data: updated, error: updateError } = await updateQuery
      .select('id')
      .maybeSingle();
    if (updateError || !updated) {
      const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([objectPath]);
      if (cleanupError) {
        console.error(`[AgencyLogoSync] Failed to clean up ${agency.slug} logo:`, cleanupError.message);
      }
      if (!updateError) {
        skipped += 1;
        continue;
      }
      console.error(`[AgencyLogoSync] Database update failed for ${agency.slug}:`, updateError.message);
      return failure('Logo téléversé mais URL non enregistrée en base. Réessayez la synchronisation.', 500);
    }
    saved += 1;
  }

  return NextResponse.json(
    { success: true, data: { saved, skipped } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
