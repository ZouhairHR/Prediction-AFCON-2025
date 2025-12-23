import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Returns a Supabase client configured for server usage.  It binds the
 * current request's cookies so that authenticated sessions are honoured.
 * On the server we can use either the service role key (with RLS still
 * enforced) or the anon key.  The service role key should be stored in
 * a secure environment variable `SUPABASE_SERVICE_ROLE_KEY`.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(supabaseUrl, supabaseKey, { cookies: () => cookieStore });
}