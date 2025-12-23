"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase/server';

/**
 * Server action to save or update a prediction.  It uses upsert semantics
 * so that a user can modify their prediction until kickoff.  After saving
 * the prediction, it revalidates the predictions page.
 */
export async function savePrediction(formData: FormData): Promise<void> {
  const match_id = formData.get('match_id') as string;
  const user_id = formData.get('user_id') as string;
  const pred_home = Number(formData.get('pred_home'));
  const pred_away = Number(formData.get('pred_away'));
  const pred_pens_home_raw = formData.get('pred_pens_home');
  const pred_pens_away_raw = formData.get('pred_pens_away');
  const pred_pens_home = pred_pens_home_raw === null || pred_pens_home_raw === '' ? null : Number(pred_pens_home_raw);
  const pred_pens_away = pred_pens_away_raw === null || pred_pens_away_raw === '' ? null : Number(pred_pens_away_raw);
  const supabase = createClient();
  await supabase.from('predictions').upsert({
    match_id,
    user_id,
    pred_home,
    pred_away,
    pred_pens_home,
    pred_pens_away,
  });
  // Trigger a revalidation of the predictions page so that the updated
  // prediction is reflected on the server side.
  revalidatePath('/predictions');
  // Do not return any value for form actions
}