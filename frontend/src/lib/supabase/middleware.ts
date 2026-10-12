import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPublicLoginPath, loginUrl } from '@/lib/auth/login-portals';

function isActiveAgency(value: unknown): boolean {
  const agency = Array.isArray(value) ? value[0] : value;
  if (typeof agency !== 'object' || agency === null) return false;
  const record = agency as Record<string, unknown>;
  return record.status === 'ACTIVE' && !record.archived_at;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAgencyPublic =
    isPublicLoginPath(path) || path === '/agency/join' || path.startsWith('/agency/join/');
  const protectedAdmin = path.startsWith('/admin') && !isPublicLoginPath(path);
  const protectedAgency = path.startsWith('/agency') && !isAgencyPublic;

  if (!user) {
    if (protectedAgency) {
      return NextResponse.redirect(new URL(loginUrl('agency', { redirect: path }), request.url));
    }

    if (protectedAdmin) {
      return NextResponse.redirect(new URL(loginUrl('admin', { redirect: path }), request.url));
    }

    return supabaseResponse;
  }

  if (!protectedAdmin && !protectedAgency) return supabaseResponse;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? 'CUSTOMER';
  const isPlatformAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  if (protectedAdmin && !isPlatformAdmin) {
    return NextResponse.redirect(
      new URL(loginUrl('admin', { redirect: path, error: 'forbidden' }), request.url)
    );
  }

  if (protectedAgency && !isPlatformAdmin) {
    const { data: memberRows, error } = await supabase
      .from('agency_members')
      .select('agency_id, status, agencies(status, archived_at)')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE');

    const hasActiveAgency = !error && memberRows?.some((row) => isActiveAgency(row.agencies));
    if (!hasActiveAgency) {
      const isSuspended = memberRows?.some((row) => {
        const agency = Array.isArray(row.agencies) ? row.agencies[0] : row.agencies;
        return typeof agency === 'object' && agency !== null &&
          'status' in agency && agency.status === 'SUSPENDED';
      });
      return NextResponse.redirect(
        new URL(loginUrl('agency', {
          redirect: path,
          error: isSuspended ? 'suspended' : 'forbidden',
        }), request.url)
      );
    }
  }

  return supabaseResponse;
}
