import { NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function GET() {
  try {
    const plans = await subscriptionService.getSubscriptionPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Impossible de récupérer les forfaits.' },
      { status: 500 }
    );
  }
}
