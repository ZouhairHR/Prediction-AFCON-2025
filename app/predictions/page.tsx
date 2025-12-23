import { createClient } from '../../lib/supabase/server';
import PredictionForm from './predictionForm';

/**
 * Predictions page.  This server component fetches all matches and the
 * logged‑in user’s existing predictions, then renders a list of fixtures with
 * editable inputs for scores.  Editing is disabled after the match’s
 * kickoff time.  Predictions are saved via a client action in the
 * PredictionForm component.
 */
export default async function PredictionsPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    // Redirect to login if not authenticated
    return (
      <p>
        You are not logged in.  Please <a href="/login">login</a> or{' '}
        <a href="/signup">sign up</a>.
      </p>
    );
  }
  // Fetch matches and existing predictions for the user
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(id, name), away_team:away_team_id(id, name)')
    .order('kickoff_at');
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', session.user.id);
  const predictionMap: Record<string, any> = {};
  predictions?.forEach((pr) => {
    predictionMap[pr.match_id] = pr;
  });
  return (
    <div>
      <h2>Your Predictions</h2>
      {!matches || matches.length === 0 ? (
        <p>No matches loaded yet.</p>
      ) : (
        matches.map((match) => {
          const pr = predictionMap[match.id] || null;
          return (
            <PredictionForm
              key={match.id}
              match={match}
              prediction={pr}
              userId={session.user.id}
            />
          );
        })
      )}
    </div>
  );
}