import { createBrowserSupabaseClient, createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Returns a browser Supabase client.  Use this in client components to perform
 * queries and mutations.  The client is configured with your project's URL
 * and anon key via environment variables.
 */
export function getBrowserSupabaseClient() {
  return createBrowserSupabaseClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });
}

/**
 * Returns a server Supabase client bound to the current request's cookies.
 * Use this in server actions or server components to perform authorised
 * operations on behalf of the logged‑in user.
 */
export function getServerSupabaseClient() {
  return createServerSupabaseClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookies,
  });
}