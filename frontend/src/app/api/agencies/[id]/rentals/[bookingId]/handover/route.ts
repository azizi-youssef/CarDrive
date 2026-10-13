import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string; bookingId: string }> };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

const handoverSchema = z.object({
  type: z.enum(['PICKUP', 'RETURN']),
  mileage: z.coerce.number().int().min(0, 'Le kilométrage est requis et doit être positif'),
  fuelLevel: z.enum(['EMPTY', '1/4', '1/2', '3/4', 'FULL']).default('FULL'),
  cleanliness: z.enum(['CLEAN', 'NORMAL', 'DIRTY']).default('CLEAN'),
  checklist: z
    .object({
      spareTire: z.boolean().default(true),
      jack: z.boolean().default(true),
      registrationDoc: z.boolean().default(true),
      insuranceDoc: z.boolean().default(true),
      safetyKit: z.boolean().default(true),
    })
    .default({
      spareTire: true,
      jack: true,
      registrationDoc: true,
      insuranceDoc: true,
      safetyKit: true,
    }),
  notes: z.string().trim().optional(),
  damagesDescription: z.string().trim().optional(),
  depositReturned: z.boolean().optional().default(true),
  depositDeduction: z.coerce.number().min(0).optional().default(0),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: agencyId, bookingId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'bookings.manage');
  if (gate.denied) return gate.denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure('Corps de requête JSON invalide.', 400);
  }

  const parsed = handoverSchema.safeParse(body);
  if (!parsed.success) {
    return failure(parsed.error.issues.map((i) => i.message).join(', '), 422);
  }

  const input = parsed.data;
  const supabase = await createAdminClient();
  if (!supabase) return failure('Service de base de données indisponible.', 503);

  // 1. Récupérer la réservation
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, reference, booking_ref, vehicle_id, agency_id, status, total_price, deposit_amount')
    .eq('id', bookingId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  if (bErr || !booking) {
    return failure('Réservation introuvable pour cette agence.', 404);
  }

  const nowIso = new Date().toISOString();
  const actorRole = 'AGENCY_MANAGER';
  const actorId = gate.auth.userId;

  if (input.type === 'PICKUP') {
    // Validation du départ : le statut passe à ACTIVE
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'ACTIVE',
        updated_at: nowIso,
      })
      .eq('id', bookingId);

    if (updateErr) {
      return failure(`Erreur mise à jour départ: ${updateErr.message}`, 500);
    }

    // Mettre à jour le véhicule en RENTED et synchroniser son compteur
    if (booking.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({
          status: 'RENTED',
          mileage: input.mileage,
          updated_at: nowIso,
        })
        .eq('id', booking.vehicle_id);
    }

    // Journaliser dans booking_events
    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      actor_id: actorId,
      actor_role: actorRole,
      event_type: 'RENTAL_STARTED',
      metadata: {
        type: 'PICKUP',
        mileage: input.mileage,
        fuelLevel: input.fuelLevel,
        cleanliness: input.cleanliness,
        checklist: input.checklist,
        notes: input.notes,
        timestamp: nowIso,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Véhicule remis au client. Location en cours.',
      status: 'ACTIVE',
    });
  } else {
    // Validation du retour : le statut passe à COMPLETED
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'COMPLETED',
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', bookingId);

    if (updateErr) {
      return failure(`Erreur mise à jour retour: ${updateErr.message}`, 500);
    }

    // Mettre à jour le véhicule en AVAILABLE avec son nouveau compteur
    if (booking.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({
          status: 'AVAILABLE',
          mileage: input.mileage,
          updated_at: nowIso,
        })
        .eq('id', booking.vehicle_id);
    }

    // Journaliser dans booking_events
    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      actor_id: actorId,
      actor_role: actorRole,
      event_type: 'RENTAL_COMPLETED',
      metadata: {
        type: 'RETURN',
        mileage: input.mileage,
        fuelLevel: input.fuelLevel,
        cleanliness: input.cleanliness,
        checklist: input.checklist,
        damagesDescription: input.damagesDescription,
        depositReturned: input.depositReturned,
        depositDeduction: input.depositDeduction,
        notes: input.notes,
        timestamp: nowIso,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Véhicule restitué et inspecté. Réservation finalisée.',
      status: 'COMPLETED',
    });
  }
}
