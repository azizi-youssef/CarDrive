import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    // Supabase non configuré : laisser passer pour la démo / local dev
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  );

  // IMPORTANT: Ne pas exécuter de logique entre createServerClient et
  // supabase.auth.getUser(). Un simple getSession() peut être spoofé.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protection des routes Agency et Admin si Supabase est actif
  if (!user) {
    if (path.startsWith('/agency') && !path.startsWith('/agency/login')) {
      const url = request.nextUrl.clone();
      url.pathname = '/agency/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', path);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
