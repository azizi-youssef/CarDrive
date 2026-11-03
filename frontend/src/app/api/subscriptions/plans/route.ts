import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api/server-error';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function GET() {
  try {
    const plans = await subscriptionService.getSubscriptionPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error: unknown) {
    return serverError(error, '/api/subscriptions/plans', 'Impossible de récupérer les forfaits.');
  }
}
