import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a Supabase client for use in the browser.  Uses the public anon
 * key.  Client components should call this function to perform queries
 * on behalf of the logged‑in user.
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}