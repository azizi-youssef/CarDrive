import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSafeRedirect, loginUrl } from '@/lib/auth/login-portals';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next');
  const next = isSafeRedirect(requestedNext) ? requestedNext : '/account';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fail = () => {
    const response = NextResponse.redirect(
      new URL(loginUrl('client', { redirect: next, error: 'auth_failed' }), origin)
    );
    response.headers.set('Cache-Control', 'no-store');
    return response;
  };

  if (!code || !supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return fail();
  }

  const response = NextResponse.redirect(new URL(next, origin));
  response.headers.set('Cache-Control', 'no-store');

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    },
  });

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error('[AuthCallback] OAuth session exchange failed:', exchangeError.message);
      return fail();
    }

    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
      console.error('[AuthCallback] Session verification failed after code exchange.');
      return fail();
    }
  } catch {
    console.error('[AuthCallback] OAuth callback request failed.');
    return fail();
  }

  return response;
}
