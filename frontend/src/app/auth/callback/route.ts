import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/account';

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const isRelative = next.startsWith('/');
        const redirectUrl = isRelative ? `${origin}${next}` : next;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // En cas d'erreur de validation du code
  return NextResponse.redirect(`${origin}/agency/login?error=auth_failed`);
}
