import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const checks: Record<string, string> = {
    app: 'ok',
    supabase: 'configured',
    database: 'checking',
  };

  try {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.from('platform_settings').select('id').limit(1);
      checks.database = error ? 'error' : 'ok';
    } else {
      checks.supabase = 'misconfigured';
      checks.database = 'skipped';
    }
  } catch (err) {
    checks.database = 'error';
    checks.supabase = 'error';
  }

  const healthy = checks.database === 'ok';
  return NextResponse.json(
    { success: healthy, checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
