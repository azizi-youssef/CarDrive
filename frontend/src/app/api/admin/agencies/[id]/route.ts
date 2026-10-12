import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  agencyArchiveSchema,
  agencyPatchSchema,
} from '@/lib/validations/agency-access';

type RouteContext = { params: Promise<{ id: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const gate = await requirePlatformPermissionApi('agencies.read');
  if (gate.denied) return gate.denied;

  const { id } = await context.params;
  const adminClient = await createAdminClient();
  const db = adminClient || (await createClient());
  if (!db) return failure('Service de données indisponible.', 503);

  const { data: agency, error } = await db
    .from('agencies')
    .select('id, name, slug, description, email, phone, whatsapp, address, city, latitude, longitude, logo_url, banner_url, status, verified, created_at, updated_at, archived_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[AdminAgencies] Detail lookup failed:', error.message);
    return failure('Impossible de charger le détail de cette agence.', 500);
  }
  if (!agency) return failure('Agence introuvable.', 404);

  const [members, vehicles, bookings] = await Promise.all([
    db
      .from('agency_members')
      .select('id, user_id, role, status, created_at')
      .eq('agency_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('vehicles')
      .select('id, brand, model, daily_price, status, created_at')
      .eq('agency_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('bookings')
      .select('id, booking_ref, status, start_date, end_date, total_price, created_at')
      .eq('agency_id', id)
      .order('created_at', { ascending: false }),
  ]);

  const memberUserIds = [...new Set((members.data ?? []).map((m) => m.user_id))];
  const { data: profiles } = memberUserIds.length
    ? await db.from('profiles').select('id, email, full_name, phone').in('id', memberUserIds)
    : { data: [] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return NextResponse.json({
    success: true,
    data: {
      ...agency,
      member_count: members.data?.length ?? 0,
      vehicle_count: vehicles.data?.length ?? 0,
      booking_count: bookings.data?.length ?? 0,
      members: (members.data ?? []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        created_at: m.created_at,
        email: profileById.get(m.user_id)?.email ?? '',
        full_name: profileById.get(m.user_id)?.full_name ?? '',
        phone: profileById.get(m.user_id)?.phone ?? '',
      })),
      vehicles: vehicles.data ?? [],
      bookings: bookings.data ?? [],
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const gate = await requirePlatformPermissionApi('agencies.update');
  if (gate.denied) return gate.denied;

  const body: unknown = await request.json().catch(() => null);
  const parsed = agencyPatchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    return failure(parsed.success ? 'Aucune modification fournie.' : parsed.error.issues.map((i) => i.message).join(', '), 400);
  }

  const { status, verified, email, ...profileFields } = parsed.data;
  if (status !== undefined || verified !== undefined) {
    const statusGate = await requirePlatformPermissionApi('agencies.suspend');
    if (statusGate.denied) return statusGate.denied;
  }

  const adminClient = await createAdminClient();
  const db = adminClient || (await createClient());
  if (!db) return failure('Service de données indisponible.', 503);

  // 1. Récupérer l'agence actuelle
  const { data: existingAgency } = await db
    .from('agencies')
    .select('id, name, email, status, verified')
    .eq('id', id)
    .maybeSingle();

  if (!existingAgency) return failure('Agence introuvable.', 404);

  // 2. Si l'email est modifié, vérifier les conflits et synchroniser avec Supabase Auth
  let updatedEmail = existingAgency.email;
  if (email && email.toLowerCase() !== existingAgency.email.toLowerCase()) {
    const normalizedNewEmail = email.trim().toLowerCase();

    const { count: conflictCount } = await db
      .from('agencies')
      .select('id', { count: 'exact', head: true })
      .ilike('email', normalizedNewEmail)
      .neq('id', id)
      .is('archived_at', null);

    if (conflictCount && conflictCount > 0) {
      return failure('Cette adresse e-mail est déjà utilisée par une autre agence.', 409);
    }

    if (adminClient) {
      // Trouver le compte propriétaire dans agency_members
      const { data: ownerMember } = await db
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', id)
        .in('role', ['agency_admin', 'AGENCY_OWNER'])
        .maybeSingle();

      if (ownerMember?.user_id) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
          ownerMember.user_id,
          { email: normalizedNewEmail, email_confirm: true }
        );

        if (authUpdateError) {
          console.warn('[AdminAgencies] Auth email update warning:', authUpdateError.message);
        }

        // Mettre à jour profiles
        await db
          .from('profiles')
          .update({ email: normalizedNewEmail, updated_at: new Date().toISOString() })
          .eq('id', ownerMember.user_id);
      }
    }

    updatedEmail = normalizedNewEmail;
  }

  // 3. Préparer les modifications de l'agence
  const finalStatus = status !== undefined ? status : existingAgency.status;
  const finalVerified = verified !== undefined ? verified : finalStatus === 'ACTIVE';

  const patchData: Record<string, unknown> = {
    ...profileFields,
    email: updatedEmail,
    status: finalStatus,
    verified: finalVerified,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedAgency, error: updateError } = await db
    .from('agencies')
    .update(patchData)
    .eq('id', id)
    .select('id, name, slug, email, phone, whatsapp, address, city, latitude, longitude, logo_url, status, verified, created_at, updated_at')
    .maybeSingle();

  if (updateError) {
    if (updateError.code === '23505') return failure('Ce slug d’agence existe déjà.', 409);
    console.error('[AdminAgencies] Update failed:', updateError.message);
    return failure('Impossible de modifier cette agence.', 500);
  }

  // 4. Si changement de statut, synchroniser les membres de l'agence
  if (status !== undefined && status !== existingAgency.status) {
    const isSuspended = status === 'SUSPENDED';
    const memberStatus = isSuspended ? 'REVOKED' : status === 'ACTIVE' ? 'ACTIVE' : 'INVITED';
    await db
      .from('agency_members')
      .update({
        status: memberStatus,
        revoked_at: isSuspended ? new Date().toISOString() : null,
      })
      .eq('agency_id', id);

    // Journaliser dans audit_logs
    await db.from('audit_logs').insert({
      user_id: gate.auth.userId,
      action: status === 'SUSPENDED' ? 'AGENCY_SUSPEND' : status === 'ACTIVE' ? 'AGENCY_ACTIVATE' : 'AGENCY_STATUS_CHANGE',
      entity_type: 'AGENCY',
      entity_id: id,
      metadata: {
        agency_name: existingAgency.name,
        previous_status: existingAgency.status,
        new_status: status,
      },
    });
  } else {
    // Audit modification standard
    await db.from('audit_logs').insert({
      user_id: gate.auth.userId,
      action: 'AGENCY_UPDATE',
      entity_type: 'AGENCY',
      entity_id: id,
      metadata: {
        agency_name: existingAgency.name,
        updated_fields: Object.keys(patchData),
      },
    });
  }

  return NextResponse.json({ success: true, data: updatedAgency });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const gate = await requirePlatformPermissionApi('agencies.delete');
  if (gate.denied) return gate.denied;

  const body: unknown = await request.json().catch(() => null);
  const parsed = agencyArchiveSchema.safeParse(body);
  if (!parsed.success) return failure('Confirmation explicite requise.', 400);

  const adminClient = await createAdminClient();
  const db = adminClient || (await createClient());
  if (!db) return failure('Service de données indisponible.', 503);

  const { data: agency, error: readError } = await db
    .from('agencies')
    .select('id, name, email, archived_at')
    .eq('id', id)
    .maybeSingle();

  if (readError) {
    console.error('[AdminAgencies] Delete lookup failed:', readError.message);
    return failure('Impossible de vérifier cette agence.', 500);
  }
  if (!agency || agency.archived_at) return failure('Agence introuvable ou déjà archivée.', 404);

  if (agency.name.trim().toLowerCase() !== parsed.data.confirmationName.trim().toLowerCase()) {
    return failure('Le nom de confirmation ne correspond pas au nom de l’agence.', 400);
  }

  // Vérifier les dépendances : réservations et véhicules
  const [{ count: bookingCount }, { count: vehicleCount }] = await Promise.all([
    db.from('bookings').select('id', { count: 'exact', head: true }).eq('agency_id', id),
    db.from('vehicles').select('id', { count: 'exact', head: true }).eq('agency_id', id),
  ]);

  const hasBookings = (bookingCount ?? 0) > 0;

  if (hasBookings) {
    // Règle métier : Ne JAMAIS supprimer physiquement une agence ayant des réservations.
    // Désactivation et archivage logique stricts.
    const now = new Date().toISOString();
    const { error: archiveError } = await db
      .from('agencies')
      .update({
        archived_at: now,
        status: 'SUSPENDED',
        verified: false,
        updated_at: now,
      })
      .eq('id', id);

    if (archiveError) {
      console.error('[AdminAgencies] Archive failed:', archiveError.message);
      return failure('Impossible d’archiver cette agence.', 500);
    }

    // Suspendre également les membres et masquer les véhicules
    await Promise.all([
      db.from('agency_members').update({ status: 'REVOKED', revoked_at: now }).eq('agency_id', id),
      db.from('vehicles').update({ status: 'BLOCKED', published: false }).eq('agency_id', id),
    ]);

    await db.from('audit_logs').insert({
      user_id: gate.auth.userId,
      action: 'AGENCY_ARCHIVED',
      entity_type: 'AGENCY',
      entity_id: id,
      metadata: {
        agency_name: agency.name,
        booking_count: bookingCount,
        reason: 'Archivage avec conservation des données historiques.',
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'archived',
      message: `L'agence "${agency.name}" a été archivée avec succès. Ses ${bookingCount} réservations historiques sont conservées.`,
    });
  }

  // Aucune réservation : suppression propre possible
  // 1. Récupérer l'utilisateur propriétaire dans agency_members
  const { data: ownerMember } = await db
    .from('agency_members')
    .select('user_id')
    .eq('agency_id', id)
    .in('role', ['agency_admin', 'AGENCY_OWNER'])
    .maybeSingle();

  // 2. Supprimer les véhicules liés s'il en reste (sans réservations)
  if ((vehicleCount ?? 0) > 0) {
    await db.from('vehicles').delete().eq('agency_id', id);
  }

  // 3. Supprimer l'agence (cascade supprime agency_members)
  const { error: deleteError } = await db.from('agencies').delete().eq('id', id);
  if (deleteError) {
    console.error('[AdminAgencies] Delete failed:', deleteError.message);
    return failure('Impossible de supprimer cette agence.', 500);
  }

  // 4. Supprimer le compte Auth et son profil si adminClient disponible
  if (ownerMember?.user_id && adminClient) {
    await adminClient.auth.admin.deleteUser(ownerMember.user_id).catch((err) => {
      console.warn('[AdminAgencies] Could not delete auth user:', err);
    });
    await db.from('profiles').delete().eq('id', ownerMember.user_id);
  }

  // 5. Journalisation
  await db.from('audit_logs').insert({
    user_id: gate.auth.userId,
    action: 'AGENCY_DELETED',
    entity_type: 'AGENCY',
    entity_id: id,
    metadata: {
      agency_name: agency.name,
      email: agency.email,
    },
  });

  return NextResponse.json({
    success: true,
    mode: 'deleted',
    message: `L'agence "${agency.name}" et son compte d'accès ont été supprimés définitivement.`,
  });
}
