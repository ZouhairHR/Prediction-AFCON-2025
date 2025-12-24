import { redirect } from 'next/navigation';

/**
 * Predictions page.  This server component fetches all matches and the
 * logged‑in user’s existing predictions, then renders a list of fixtures with
 * editable inputs for scores.  Editing is disabled after the match’s
 * kickoff time.  Predictions are saved via a client action in the
 * PredictionForm component.
 */
export default function PredictionsPage() {
  // Redirect to the first step of the prediction wizard (Group A)
  redirect('/predictions/group/A');
}