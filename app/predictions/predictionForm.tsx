"use client";

import { useState, useEffect } from 'react';
import { savePrediction } from './actions';

interface Match {
  id: string;
  stage: string;
  kickoff_at: string;
  home_team: any;
  away_team: any;
}

interface Prediction {
  match_id: string;
  pred_home: number;
  pred_away: number;
  pred_pens_home: number | null;
  pred_pens_away: number | null;
}

export default function PredictionForm({
  match,
  prediction,
  userId,
}: {
  match: Match;
  prediction: Prediction | null;
  userId: string;
}) {
  const [predHome, setPredHome] = useState<number | ''>(prediction?.pred_home ?? '');
  const [predAway, setPredAway] = useState<number | ''>(prediction?.pred_away ?? '');
  const [predPensHome, setPredPensHome] = useState<number | ''>(prediction?.pred_pens_home ?? '');
  const [predPensAway, setPredPensAway] = useState<number | ''>(prediction?.pred_pens_away ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const DEADLINE_UTC = new Date('2025-12-26T12:00:00.000Z');
  const locked = new Date() >= DEADLINE_UTC;
  const isGroupStage = match.stage === 'GROUP';
  const drawAfter120 =
    !isGroupStage &&
    predHome !== '' &&
    predAway !== '' &&
    Number(predHome) === Number(predAway);

  // Reset penalties when the score changes from a draw to non‑draw or when it is group stage
  useEffect(() => {
    if (!drawAfter120) {
      setPredPensHome('');
      setPredPensAway('');
    }
  }, [drawAfter120, isGroupStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('match_id', match.id);
    formData.append('user_id', userId);
    formData.append('pred_home', String(predHome));
    formData.append('pred_away', String(predAway));
    // Only append penalties for knockout matches when draw predicted
    if (drawAfter120) {
      formData.append('pred_pens_home', predPensHome === '' ? '' : String(predPensHome));
      formData.append('pred_pens_away', predPensAway === '' ? '' : String(predPensAway));
    }
    await savePrediction(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
      {/* For knockout stages, indicate that scores are after extra time */}
      {!isGroupStage && (
        <p style={{ margin: 0, marginBottom: '0.5rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
          Score is after extra time (120’)
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{Array.isArray(match.home_team) ? match.home_team?.[0]?.name : match.home_team?.name}</span>
        <input
          type="number"
          min={0}
          value={predHome}
          onChange={(e) => setPredHome(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={locked}
          style={{ width: 50, textAlign: 'center' }}
          required
        />
        <span>vs</span>
        <input
          type="number"
          min={0}
          value={predAway}
          onChange={(e) => setPredAway(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={locked}
          style={{ width: 50, textAlign: 'center' }}
          required
        />
        <span>{Array.isArray(match.away_team) ? match.away_team?.[0]?.name : match.away_team?.name}</span>
      </div>
      {/* Show penalty inputs only for knockout draws */}
      {drawAfter120 && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>If draw after 120’, enter penalties</strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <span>{Array.isArray(match.home_team) ? match.home_team?.[0]?.name : match.home_team?.name}</span>
            <input
              type="number"
              min={0}
              value={predPensHome}
              onChange={(e) => setPredPensHome(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={locked}
              style={{ width: 50, textAlign: 'center' }}
              required
            />
            <span>–</span>
            <input
              type="number"
              min={0}
              value={predPensAway}
              onChange={(e) => setPredPensAway(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={locked}
              style={{ width: 50, textAlign: 'center' }}
              required
            />
            <span>{Array.isArray(match.away_team) ? match.away_team?.[0]?.name : match.away_team?.name}</span>
          </div>
        </div>
      )}
      <div style={{ marginTop: '0.5rem' }}>
        <button type="submit" disabled={locked || isSubmitting}>
          {locked ? 'Locked' : isSubmitting ? 'Saving...' : prediction ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
