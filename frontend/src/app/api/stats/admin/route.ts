import { NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { statsService } from '@/lib/services/stats.service';

export async function GET() {
  const gate = await requirePlatformPermissionApi('agencies.read');
  if (gate.denied) return gate.denied;

  try {
    const data = await statsService.getAdminStats();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
