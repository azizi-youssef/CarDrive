import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service de session indisponible.' },
        { status: 503 }
      );
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Auth] Server sign-out failed:', error);
    return NextResponse.json(
      { success: false, error: 'La fermeture de session a échoué.' },
      { status: 500 }
    );
  }
}
