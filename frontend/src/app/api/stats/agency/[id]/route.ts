import { NextResponse } from 'next/server';
import { serverError } from '@/lib/api/server-error';
import { requireAgencyPermissionApi } from '@/lib/auth/access-api';
import { statsService } from '@/lib/services/stats.service';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const gate = await requireAgencyPermissionApi(id, 'reports.read');
  if (gate.denied) return gate.denied;

  try {
    const data = await statsService.getAgencyStats(id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return serverError(error, '/api/stats/agency/[id]');
  }
}
