import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'vehicles.manage');
  if (gate.denied) return gate.denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return failure('Formulaire multipart invalide.', 400);
  }

  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) {
    // Vérifier également le champ singulier 'file'
    const single = formData.get('file') as File | null;
    if (single) {
      files.push(single);
    } else {
      return failure('Aucun fichier fourni.', 400);
    }
  }

  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de stockage indisponible.', 503);

  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return failure(
        `Type de fichier non autorisé : ${file.type}. Seuls JPEG, PNG et WebP sont acceptés.`,
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return failure(
        `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo). La limite maximale est de 10 Mo.`,
        400
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    const randomKey = Math.random().toString(36).substring(2, 10);
    const fileName = `agencies/${agencyId}/vehicles/${Date.now()}-${randomKey}.${cleanExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('vehicles')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[AgencyVehicleUpload] Upload error:', uploadError.message);
      return failure(`Échec de téléversement : ${uploadError.message}`, 500);
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
