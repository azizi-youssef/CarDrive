import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function GET() {
  const gate = await requirePlatformPermissionApi('agencies.read');
  if (gate.denied) return gate.denied;

  try {
    const [subscriptions, stats, plans] = await Promise.all([
      subscriptionService.getAllAgencySubscriptions(),
      subscriptionService.getSubscriptionStats(),
      subscriptionService.getSubscriptionPlans(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        stats,
        plans,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Impossible de charger les abonnements.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requirePlatformPermissionApi('agencies.update');
  if (gate.denied) return gate.denied;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'JSON invalide.' }, { status: 400 });
  }

  const { agencyId, planSlug } = body || {};
  if (!agencyId || !planSlug) {
    return NextResponse.json(
      { success: false, error: 'agencyId et planSlug sont requis.' },
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
      { success: false, error: error.message || 'Erreur lors de la mise à jour.' },
      { status: 500 }
    );
  }
}
