import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  const gate = await requirePlatformPermissionApi('reports.read');
  if (gate.denied) return gate.denied;

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get('pageSize') ?? '25', 10) || 25));
  const search = (params.get('q') ?? '').trim().slice(0, 100);
  const action = (params.get('action') ?? 'ALL').trim();
  const entityType = (params.get('entity_type') ?? 'ALL').trim();

  const adminClient = await createAdminClient();
  const db = adminClient || (await createClient());
  if (!db) return failure('Service de données indisponible.', 503);

  try {
    let query = db
      .from('audit_logs')
      .select('id, user_id, action, entity_type, entity_id, metadata, created_at, profiles(email, full_name)', { count: 'exact' });

    if (action !== 'ALL') {
      query = query.eq('action', action);
    }

    if (entityType !== 'ALL') {
      query = query.eq('entity_type', entityType);
    }

    if (search) {
      const escaped = search.replace(/[\\%_,()]/g, '\\$&');
      query = query.or(`action.ilike.%${escaped}%,entity_type.ilike.%${escaped}%,entity_id.ilike.%${escaped}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      // If table doesn't have profiles relation or audit_logs table is missing, fail safely
      console.warn('[AuditAPI] Query error:', error.message);
      // Fallback simple query without join
      const fallback = await db
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fallback.error) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }

      return NextResponse.json({
        success: true,
        data: fallback.data ?? [],
        pagination: {
          page,
          pageSize,
          total: fallback.count ?? 0,
          totalPages: Math.ceil((fallback.count ?? 0) / pageSize),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur interne';
    return failure(msg, 500);
  }
}
