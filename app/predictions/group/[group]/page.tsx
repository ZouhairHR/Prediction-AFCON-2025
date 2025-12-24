import { createClient } from '../../../../lib/supabase/server';
import PredictionForm from '../../predictionForm';
import Link from 'next/link';

// Ordered list of steps for the prediction wizard.  Groups come first (A–F),
// followed by knockout stages in the required order.
const steps: Array<{ type: 'group' | 'knockout'; code: string }> = [
  { type: 'group', code: 'A' },
  { type: 'group', code: 'B' },
  { type: 'group', code: 'C' },
  { type: 'group', code: 'D' },
  { type: 'group', code: 'E' },
  { type: 'group', code: 'F' },
  { type: 'knockout', code: 'R16' },
  { type: 'knockout', code: 'QF' },
  { type: 'knockout', code: 'SF' },
  { type: 'knockout', code: '3P' },
  { type: 'knockout', code: 'F' },
];

export default async function GroupPage({ params }: { params: { group: string } }) {
  const groupParam = (params.group || '').toUpperCase();
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return (
      <p>
        You are not logged in. Please <a href="/login">login</a> or{' '}
        <a href="/signup">sign up</a>.
      </p>
    );
  }
  // Validate group code exists in steps
  const stepIndex = steps.findIndex((s) => s.type === 'group' && s.code === groupParam);
  if (stepIndex === -1) {
    return <p>Invalid group.</p>;
  }
  // Fetch matches for this group
  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:home_team_id(id, name), away_team:away_team_id(id, name)')
    .eq('stage', 'GROUP')
    .eq('group_code', groupParam)
    .order('kickoff_at');
  // Fetch existing predictions for user
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', session.user.id);
  const predictionMap: Record<string, any> = {};
  predictions?.forEach((pr) => {
    predictionMap[pr.match_id] = pr;
  });
  // Determine navigation
  const totalSteps = steps.length;
  const title = `Group ${groupParam} (${stepIndex + 1}/${totalSteps})`;
  const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null;
  const nextStep = stepIndex < totalSteps - 1 ? steps[stepIndex + 1] : null;
  // Construct URLs for previous and next
  const prevHref = previousStep
    ? previousStep.type === 'group'
      ? `/predictions/group/${previousStep.code}`
      : `/predictions/knockout/${previousStep.code}`
    : null;
  const nextHref = nextStep
    ? nextStep.type === 'group'
      ? `/predictions/group/${nextStep.code}`
      : `/predictions/knockout/${nextStep.code}`
    : null;
  return (
    <div>
      <h2>{title}</h2>
      {!matches || matches.length === 0 ? (
        <p>No matches for this group.</p>
      ) : (
        matches.map((match: any) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        {prevHref ? <Link href={prevHref}>Back</Link> : <span />}
        {nextHref ? <Link href={nextHref}>Next</Link> : <span />}
      </div>
    </div>
  );
}