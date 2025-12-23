import { getSupabaseServerClient } from '../../../lib/supabaseServerClient';
import { saveMatchResult } from './actions';

/**
 * Admin Results page.  Allows admins to enter real match results, including
 * penalties if applicable.  Only users with is_admin = true may access this
 * page; others receive an unauthorized message.
 */
export default async function AdminResultsPage() {
  const supabase = getSupabaseServerClient();
  // Get current session and admin flag
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return <p>You must be logged in to access this page.</p>;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
  if (!profile || !profile.is_admin) {
    return <p>Unauthorized.  You do not have permission to view this page.</p>;
  }
  // Fetch matches with team names
  const { data: matches } = await supabase
    .from('matches')
    .select('id, stage, kickoff_at, result_home, result_away, result_pens_home, result_pens_away, home_team:home_team_id(id,name), away_team:away_team_id(id,name)')
    .order('kickoff_at');
  return (
    <div>
      <h2>Enter Real Match Results</h2>
      {!matches || matches.length === 0 ? (
        <p>No matches defined.</p>
      ) : (
        matches.map((match) => {
          // Safely extract team names because Supabase relations may return arrays
          const homeTeamName = Array.isArray(match.home_team)
            ? (match.home_team as any)?.[0]?.name
            : (match.home_team as any)?.name;
          const awayTeamName = Array.isArray(match.away_team)
            ? (match.away_team as any)?.[0]?.name
            : (match.away_team as any)?.name;
          return (
            <form
              key={match.id}
              action={saveMatchResult}
              style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              <input type="hidden" name="match_id" value={match.id} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{homeTeamName}</span>
                <input
                  type="number"
                  name="result_home"
                  min={0}
                  defaultValue={match.result_home ?? ''}
                  style={{ width: 50, textAlign: 'center' }}
                  required
                />
                <span>vs</span>
                <input
                  type="number"
                  name="result_away"
                  min={0}
                  defaultValue={match.result_away ?? ''}
                  style={{ width: 50, textAlign: 'center' }}
                  required
                />
                <span>{awayTeamName}</span>
              </div>
              {/* Penalties section for knockout stage only.  Admin can enter penalties if match is draw after regulation/extra time. */}
              {['R16', 'QF', 'SF', '3P', 'F'].includes(match.stage) && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Penalties (leave blank if match not decided by penalties)</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span>{homeTeamName}</span>
                    <input
                      type="number"
                      name="result_pens_home"
                      min={0}
                      defaultValue={match.result_pens_home ?? ''}
                      style={{ width: 50, textAlign: 'center' }}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      name="result_pens_away"
                      min={0}
                      defaultValue={match.result_pens_away ?? ''}
                      style={{ width: 50, textAlign: 'center' }}
                    />
                    <span>{awayTeamName}</span>
                  </div>
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <button type="submit">Save Result</button>
              </div>
            </form>
          );
        })
      )}
    </div>
  );
}