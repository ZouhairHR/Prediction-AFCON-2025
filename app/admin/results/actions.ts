"use server";

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../../lib/supabaseServerClient';

/**
 * Server action for admins to save real match results.  Accepts form data
 * containing result_home, result_away and optional penalty scores.  Only
 * accessible to admins via row‑level security policies.
 */
export async function saveMatchResult(formData: FormData): Promise<void> {
  const match_id = formData.get('match_id') as string;
  const result_home_raw = formData.get('result_home');
  const result_away_raw = formData.get('result_away');
  const result_pens_home_raw = formData.get('result_pens_home');
  const result_pens_away_raw = formData.get('result_pens_away');
  const result_home = result_home_raw === null || result_home_raw === '' ? null : Number(result_home_raw);
  const result_away = result_away_raw === null || result_away_raw === '' ? null : Number(result_away_raw);
  const result_pens_home = result_pens_home_raw === null || result_pens_home_raw === '' ? null : Number(result_pens_home_raw);
  const result_pens_away = result_pens_away_raw === null || result_pens_away_raw === '' ? null : Number(result_pens_away_raw);
  const supabase = getSupabaseServerClient();
  await supabase
    .from('matches')
    .update({ result_home, result_away, result_pens_home, result_pens_away })
    .eq('id', match_id);
  // Revalidate both predictions and leaderboard pages since results changed
  revalidatePath('/admin/results');
  revalidatePath('/leaderboard');
  redirect('/admin/results')
}
