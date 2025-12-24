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
  const supabase = createClient();
  // Fetch the match to determine its stage
  const { data: match } = await supabase
    .from('matches')
    .select('stage')
    .eq('id', match_id)
    .single();
  const stage = match?.stage ?? null;
  // Parse penalties as numbers or null
  let pred_pens_home: number | null =
    pred_pens_home_raw === null || pred_pens_home_raw === ''
      ? null
      : Number(pred_pens_home_raw);
  let pred_pens_away: number | null =
    pred_pens_away_raw === null || pred_pens_away_raw === ''
      ? null
      : Number(pred_pens_away_raw);
  // Enforce penalty rules based on stage and predicted score
  if (stage === 'GROUP') {
    // Group stage: never store penalties
    pred_pens_home = null;
    pred_pens_away = null;
  } else {
    // Knockout stage
    if (pred_home !== pred_away) {
      // If predicted winner in regulation/extra time, ignore penalties
      pred_pens_home = null;
      pred_pens_away = null;
    } else {
      // Predicted draw: penalties must be present and not equal
      if (
        pred_pens_home === null ||
        pred_pens_away === null ||
        pred_pens_home === pred_pens_away
      ) {
        throw new Error('Penalties must be provided and must produce a winner');
      }
    }
  }
  await supabase.from('predictions').upsert({
    match_id,
    user_id,
    pred_home,
    pred_away,
    pred_pens_home,
    pred_pens_away,
  });
  // Trigger a revalidation of predictions pages.  Revalidate the root prediction path and group/knockout subpaths.
  revalidatePath('/predictions');
  // Do not return any value for form actions
}