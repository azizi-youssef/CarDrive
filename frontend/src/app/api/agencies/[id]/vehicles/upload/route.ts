import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { detectImageType, type DetectedImage } from '@/lib/utils/image-upload';

type RouteContext = { params: Promise<{ id: string }> };

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_FILES = 10;

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'vehicles.manage');
  if (gate.denied) return gate.denied;

  // Refus précoce des requêtes manifestement trop lourdes, avant de lire le corps
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILES * MAX_FILE_SIZE + 256 * 1024) {
    return failure(`Envoi trop volumineux (${MAX_FILES} photos de 10 Mo maximum).`, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure('Formulaire multipart invalide.', 400);
  }

  const files = [...formData.getAll('files'), formData.get('file')].filter(
    (value): value is File => value instanceof File && value.size > 0
  );
  if (files.length === 0) return failure('Aucun fichier fourni.', 400);
  if (files.length > MAX_FILES) return failure(`${MAX_FILES} photos maximum par envoi.`, 400);

  // Validation complète de tous les fichiers avant le moindre téléversement (pas de fichiers orphelins)
  const validated: { buffer: Buffer; image: DetectedImage }[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return failure(
        `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo). La limite maximale est de 10 Mo.`,
        400
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    // Le format est lu dans le contenu du fichier : le type déclaré par le navigateur est ignoré
    const image = detectImageType(buffer);
    if (!image) {
      return failure('Seules les images JPEG, PNG et WebP sont acceptées.', 415);
    }
    validated.push({ buffer, image });
  }

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de stockage indisponible.', 503);

  const uploadedUrls: string[] = [];

  for (const { buffer, image } of validated) {
    const fileName = `agencies/${agencyId}/vehicles/${crypto.randomUUID()}.${image.extension}`;

    const { error: uploadError } = await supabase.storage
      .from('vehicles')
      .upload(fileName, buffer, {
        contentType: image.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[AgencyVehicleUpload] Upload error:', uploadError.message);
      return failure('Le téléversement de la photo a échoué. Réessayez.', 500);
    }

    const { data: publicUrlData } = supabase.storage
      .from('vehicles')
      .getPublicUrl(fileName);

    uploadedUrls.push(publicUrlData.publicUrl);
  }

  // Si un vehicleId est spécifié, lier automatiquement les images dans la table vehicle_images de Supabase
  const vehicleId = formData.get('vehicleId')?.toString() || request.nextUrl.searchParams.get('vehicleId');
  let insertedCount = 0;

  if (vehicleId && uploadedUrls.length > 0) {
    // Vérifier l'appartenance du véhicule à l'agence
    const { data: vehicle, error: vErr } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .eq('agency_id', agencyId)
      .maybeSingle();

    if (!vErr && vehicle) {
      // Vérifier le nombre d'images existantes
      const { count: existingCount } = await supabase
        .from('vehicle_images')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', vehicleId);

      const offset = existingCount ?? 0;
      const imagesToInsert = uploadedUrls.map((url, idx) => ({
        vehicle_id: vehicleId,
        url,
        is_primary: offset === 0 && idx === 0,
        display_order: offset + idx,
      }));

      const { error: insertErr } = await supabase.from('vehicle_images').insert(imagesToInsert);
      if (insertErr) {
        console.error('[AgencyVehicleUpload] Auto-insert into vehicle_images error:', insertErr.message);
      } else {
        insertedCount = imagesToInsert.length;
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      urls: uploadedUrls,
      vehicleId: vehicleId || null,
      insertedCount,
    },
  });
}
