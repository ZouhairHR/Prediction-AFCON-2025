import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Returns a Supabase client configured for server usage (SSR).  The client
 * binds the current request’s cookies so that authenticated sessions are
 * honoured.  Only the public anon key should be used for the runtime; the
 * service role key must never be used in runtime code.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore when called from Server Components
          }
        },
      },
    },
  );
}