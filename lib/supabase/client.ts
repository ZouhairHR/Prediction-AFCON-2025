import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a Supabase client for use in the browser.  Use this in client
 * components and hooks to perform queries and mutations.  It uses the
 * publishable anon key so it is safe to be bundled on the client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}