import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const PROFILE_AVATAR_BUCKET = 'cardrive-profile-avatars';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Le nom est requis.').max(100, 'Le nom est trop long.'),
  remove_avatar: z.boolean().optional().default(false),
});

function failure(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

function matchesImageSignature(type: string, bytes: Uint8Array): boolean {
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === 'image/png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  return (
    type === 'image/webp' &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  );
}

function getOwnedAvatarPath(avatarUrl: string | null, userId: string): string | null {
  if (!avatarUrl) return null;
  try {
    const pathname = new URL(avatarUrl).pathname;
    const prefix = `/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/`;
    if (!pathname.startsWith(prefix)) return null;

    const objectPath = pathname
      .slice(prefix.length)
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
    if (!objectPath.startsWith(`${userId}/`) || objectPath.split('/').includes('..')) {
      return null;
    }
    return objectPath;
  } catch {
    return null;
  }
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return failure('Session expirée ou non authentifiée.', 401);

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) {
    console.error('[AccountProfile] Profile lookup failed:', error.message);
    return failure('Impossible de charger le profil.', 500);
  }
  if (!profile) return failure('Profil introuvable.', 404);

  return NextResponse.json(
    { success: true, data: profile },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return failure('Origine de la requête non autorisée.', 403);
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_AVATAR_SIZE + 64 * 1024) {
    return failure('La photo ne peut pas dépasser 5 Mo.', 413);
  }

  const auth = await getAuthenticatedUser();
  if (!auth) return failure('Session expirée ou non authentifiée.', 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure('Formulaire de profil invalide.', 400);
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    remove_avatar: formData.get('remove_avatar') === 'true',
  });
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => issue.message).join(', '), 422);
  }

  const avatarValue = formData.get('avatar');
  const avatarFile = avatarValue instanceof File && avatarValue.size > 0 ? avatarValue : null;
  if (avatarFile && avatarFile.size > MAX_AVATAR_SIZE) {
    return failure('La photo ne peut pas dépasser 5 Mo.', 413);
  }
  if (avatarFile && !['image/jpeg', 'image/png', 'image/webp'].includes(avatarFile.type)) {
    return failure('Choisissez une image JPEG, PNG ou WebP.', 415);
  }
  if (avatarFile && parsed.data.remove_avatar) {
    return failure('Choisissez une photo ou sa suppression, pas les deux.', 400);
  }

  const admin = await createAdminClient();
  if (!admin) return failure('Service sécurisé de mise à jour indisponible.', 503);

  const { data: existing, error: lookupError } = await admin
    .from('profiles')
    .select('avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (lookupError) {
    console.error('[AccountProfile] Profile lookup before update failed:', lookupError.message);
    return failure('Impossible de vérifier le profil.', 500);
  }
  if (!existing) return failure('Profil introuvable.', 404);

  let uploadedPath: string | null = null;
  let avatarUrl = existing.avatar_url;

  if (avatarFile) {
    const bytes = new Uint8Array(await avatarFile.arrayBuffer());
    if (!matchesImageSignature(avatarFile.type, bytes)) {
      return failure('Le contenu du fichier ne correspond pas à une image valide.', 415);
    }

    const extension = avatarFile.type === 'image/jpeg' ? 'jpg' : avatarFile.type.slice('image/'.length);
    uploadedPath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage
      .from(PROFILE_AVATAR_BUCKET)
      .upload(uploadedPath, Buffer.from(bytes), {
        contentType: avatarFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[AccountProfile] Avatar upload failed:', uploadError.message);
      return failure('Impossible de téléverser la photo de profil.', 500);
    }
    avatarUrl = admin.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
  } else if (parsed.data.remove_avatar) {
    avatarUrl = null;
  }

  const { data: updated, error: updateError } = await admin
    .from('profiles')
    .update({ full_name: parsed.data.full_name, avatar_url: avatarUrl })
    .eq('id', auth.user.id)
    .select('id, email, full_name, avatar_url')
    .maybeSingle();

  if (updateError || !updated) {
    if (uploadedPath) {
      const { error: cleanupError } = await admin.storage
        .from(PROFILE_AVATAR_BUCKET)
        .remove([uploadedPath]);
      if (cleanupError) {
        console.error('[AccountProfile] Failed to clean up uploaded avatar:', cleanupError.message);
      }
    }
    if (updateError) {
      console.error('[AccountProfile] Profile update failed:', updateError.message);
      return failure('Impossible d’enregistrer le profil.', 500);
    }
    return failure('Profil introuvable.', 404);
  }

  const previousPath = getOwnedAvatarPath(existing.avatar_url, auth.user.id);
  if (previousPath && previousPath !== uploadedPath && (uploadedPath || parsed.data.remove_avatar)) {
    const { error: removeError } = await admin.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove([previousPath]);
    if (removeError) {
      console.error('[AccountProfile] Failed to remove previous avatar:', removeError.message);
    }
  }

  return NextResponse.json(
    { success: true, data: updated },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
