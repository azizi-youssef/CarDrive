import { NextRequest, NextResponse } from 'next/server';
import {
  requireAgencyPermissionApi,
  requirePlatformPermissionApi,
} from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

const BUCKET = 'cardrive-agency-logos';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function failure(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

function hasValidImageSignature(type: string, bytes: Uint8Array): boolean {
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === 'image/png') {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
  }
  return type === 'image/webp' &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}

function getAgencyBrandingPath(url: string | null, agencyId: string): string | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    const prefix = `/storage/v1/object/public/${BUCKET}/${agencyId}/`;
    if (!pathname.startsWith(prefix)) return null;
    const objectPath = pathname
      .slice(`/storage/v1/object/public/${BUCKET}/`.length)
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
    if (!objectPath.startsWith(`${agencyId}/`) || objectPath.split('/').includes('..')) {
      return null;
    }
    return objectPath;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return failure('Origine de la requête non autorisée.', 403);
  }

  const { id: agencyId } = await context.params;
  const platformGate = await requirePlatformPermissionApi('agencies.update');
  if (platformGate.denied) {
    const agencyGate = await requireAgencyPermissionApi(agencyId, 'agencies.update');
    if (agencyGate.denied) return agencyGate.denied;
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE + 64 * 1024) {
    return failure('L’image ne peut pas dépasser 5 Mo.', 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure('Formulaire de téléversement invalide.', 400);
  }

  const brandingType = formData.has('banner') ? 'banner' : 'logo';
  const value = formData.get(brandingType);
  if (!(value instanceof File) || value.size === 0) {
    return failure('Sélectionnez un fichier image.', 400);
  }
  if (value.size > MAX_FILE_SIZE) return failure('L’image ne peut pas dépasser 5 Mo.', 413);

  const extension = IMAGE_TYPES.get(value.type);
  if (!extension) return failure('Choisissez une image JPEG, PNG ou WebP.', 415);

  const bytes = new Uint8Array(await value.arrayBuffer());
  if (!hasValidImageSignature(value.type, bytes)) {
    return failure('Le contenu du fichier ne correspond pas à une image valide.', 415);
  }

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de stockage indisponible.', 503);

  const { data: agency, error: lookupError } = await supabase
    .from('agencies')
    .select('logo_url, banner_url')
    .eq('id', agencyId)
    .maybeSingle();
  if (lookupError) {
    console.error('[AgencyBranding] Agency branding lookup failed:', lookupError.message);
    return failure('Impossible de charger les informations de l’agence.', 500);
  }
  if (!agency) return failure('Agence introuvable.', 404);

  const objectPath = `${agencyId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, Buffer.from(bytes), {
      contentType: value.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) {
    console.error('[AgencyBranding] Image upload failed:', uploadError.message);
    return failure('Impossible de téléverser l’image.', 500);
  }

  const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
  const previousUrl = brandingType === 'banner' ? agency.banner_url : agency.logo_url;
  const { data: updated, error: updateError } = await supabase
    .from('agencies')
    .update(brandingType === 'banner' ? { banner_url: imageUrl } : { logo_url: imageUrl })
    .eq('id', agencyId)
    .select('id, logo_url, banner_url')
    .maybeSingle();

  if (updateError || !updated) {
    const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([objectPath]);
    if (cleanupError) {
      console.error('[AgencyBranding] Failed to clean up uploaded image:', cleanupError.message);
    }
    if (updateError) {
      console.error('[AgencyBranding] Branding update failed:', updateError.message);
      return failure('Impossible d’enregistrer l’image de l’agence.', 500);
    }
    return failure('Agence introuvable.', 404);
  }

  const previousPath = getAgencyBrandingPath(previousUrl, agencyId);
  if (previousPath && previousPath !== objectPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([previousPath]);
    if (removeError) {
      console.error('[AgencyBranding] Failed to remove previous image:', removeError.message);
    }
  }

  return NextResponse.json(
    { success: true, data: updated },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
