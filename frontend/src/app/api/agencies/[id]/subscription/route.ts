import { NextRequest, NextResponse } from 'next/server';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { subscriptionService } from '@/lib/services/subscription.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'reports.read');
  if (gate.denied) return gate.denied;

  try {
    const subscription = await subscriptionService.getAgencySubscription(agencyId);
    return NextResponse.json({ success: true, data: subscription });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du chargement de l'abonnement." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: agencyId } = await context.params;
  const gate = await requireAgencyPermissionApi(agencyId, 'agencies.update');
  if (gate.denied) return gate.denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON invalide.' }, { status: 400 });
  }

  const { planSlug } = body || {};
  if (!planSlug || typeof planSlug !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Le paramètre planSlug est obligatoire.' },
      { status: 422 }
    );
  }

  try {
    const result = await subscriptionService.updateAgencyPlan(agencyId, planSlug);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result.subscription });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour de l'abonnement." },
      { status: 500 }
    );
  }
}
