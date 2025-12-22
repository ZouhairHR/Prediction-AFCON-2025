import { getSupabaseServerClient } from '../../lib/supabaseServerClient';

/**
 * Leaderboard page.  Displays total points per user sorted descending.  It
 * reads from the v_leaderboard view and joins the profiles table to get
 * participant names and usernames.
 */
export default async function LeaderboardPage() {
  const supabase = getSupabaseServerClient();
  const { data: leaderboard } = await supabase
    .from('v_leaderboard')
    .select('user_id, total_points');
  if (!leaderboard) {
    return <p>Leaderboard not available.</p>;
  }
  // Fetch user info for leaderboard entries
  const userIds = leaderboard.map((lb) => lb.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .in('id', userIds);
  const profileMap: Record<string, { full_name: string; username: string }> = {};
  profiles?.forEach((p) => {
    profileMap[p.id] = { full_name: p.full_name, username: p.username };
  });
  const sorted = [...leaderboard].sort((a, b) => b.total_points - a.total_points);
  return (
    <div>
      <h2>Leaderboard</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Rank</th>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Participant</th>
            <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, index) => {
            const profile = profileMap[entry.user_id] || { full_name: entry.user_id, username: '' };
            return (
              <tr key={entry.user_id}>
                <td style={{ padding: '0.5rem' }}>{index + 1}</td>
                <td style={{ padding: '0.5rem' }}>
                  {profile.full_name} ({profile.username})
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{entry.total_points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}