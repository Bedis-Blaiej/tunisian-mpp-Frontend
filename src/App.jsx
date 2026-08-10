/**
 * Tunisian Score Prediction App — React Frontend
 * Visual system: "Matchday Coupon" (see design-system.css)
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import './design-system.css';

/** Small reusable bordered pill for any "points to gain / potential points" figure. */
function PointsPill({ children }) {
  return <span className="points-pill">{children}</span>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 0 } },
});

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function errMsg(err, fallback = 'Something went wrong') {
  return err?.response?.data?.detail || err?.message || fallback;
}

// ============ SHARED PIECES ============
function Crest({ size = 40 }) {
  return (
    <div
      className="crest bg-floodlight flex items-center justify-center font-display font-bold text-chalk shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      TN
    </div>
  );
}

function TeamBadge({ name, color }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow ${color}`}>
      {initials}
    </div>
  );
}

const BADGE_COLORS = ['bg-flag', 'bg-pitch', 'bg-amber-600', 'bg-slate-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600', 'bg-orange-600'];
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

/** The signature element: a scoreboard-style digit chip, static or editable. */
function ScoreDigit({ value, onChange, editable = false, size = 'md' }) {
  const sizes = {
    sm: 'w-9 h-9 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-14 h-14 text-2xl',
  };
  if (editable) {
    return (
      <input
        type="number" min="0" max="10" value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`scoreboard-digit rounded-md text-center font-bold ${sizes[size]}`}
        required
      />
    );
  }
  return (
    <div className={`scoreboard-digit rounded-md flex items-center justify-center font-bold ${sizes[size]}`}>
      {value}
    </div>
  );
}

function Eyebrow({ children, tone = 'pitch' }) {
  const tones = { pitch: 'text-pitch', floodlight: 'text-floodlight', flag: 'text-flag', mist: 'text-ink/55' };
  return (
    <p className={`font-display uppercase tracking-[0.2em] text-xs font-semibold ${tones[tone]} mb-1`}>
      {children}
    </p>
  );
}

function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-ink/55">
      <div className="w-8 h-8 border-4 border-pitch/20 border-t-pitch rounded-full animate-spin mb-3" />
      <p className="text-sm font-body">{label}</p>
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="bg-flag/5 border-2 border-dashed border-flag/40 rounded-ticket p-4 text-flag text-sm">
      <p className="font-display uppercase tracking-wide text-xs font-bold mb-1">Couldn't load this</p>
      <p className="mb-2 text-ink/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-flag underline font-semibold">
          Try again
        </button>
      )}
    </div>
  );
}

// ============ LOGIN ============
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const data = isRegister ? { username, email, password } : { email, password };
      const response = await api.post(endpoint, data);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(errMsg(err, 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pitch floodlight-glow flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><Crest size={56} /></div>
          <Eyebrow tone="floodlight">Tunisian Ligue 1 · 2025/26</Eyebrow>
          <h1 className="font-display text-3xl font-bold text-chalk uppercase tracking-wide">
            Predict every score.
          </h1>
          <p className="text-chalk/60 text-sm mt-1 font-body">Fill your coupon, beat your league.</p>
        </div>

        <div className="bg-chalk rounded-ticket shadow-2xl p-8 relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <input
                type="text" placeholder="Username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-ink/10 rounded-lg font-body focus:outline-none focus:border-pitch bg-white"
                required
              />
            )}
            <input
              type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-ink/10 rounded-lg font-body focus:outline-none focus:border-pitch bg-white"
              required
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-ink/10 rounded-lg font-body focus:outline-none focus:border-pitch bg-white"
              required
            />

            {error && <p className="text-flag text-sm bg-flag/10 p-2 rounded-lg font-body">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-flag text-white py-3 rounded-lg font-display uppercase tracking-wide font-bold hover:bg-flag/90 disabled:opacity-50 transition shadow-lg border-2 border-ink"
            >
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-4 text-ink/55 text-sm hover:text-pitch font-body border-2 border-transparent hover:border-pitch/20 rounded-lg py-2 transition"
          >
            {isRegister ? 'Already have an account? Log in' : 'New here? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ LEAGUES LIST ============
function LeaguesPage({ user, onSelectLeague }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [formError, setFormError] = useState('');

  const { data: leagues, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leagues', user.id],
    queryFn: async () => (await api.get('/user/leagues')).data,
  });

  const createLeague = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/leagues', { name: leagueName });
      setLeagueName('');
      setShowCreate(false);
      refetch();
    } catch (err) {
      setFormError(errMsg(err, 'Could not create league'));
    }
  };

  const joinLeague = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post(`/leagues/${inviteCode.trim().toUpperCase()}/join`);
      setInviteCode('');
      setShowJoin(false);
      refetch();
    } catch (err) {
      setFormError(errMsg(err, 'Invalid invite code'));
    }
  };

  return (
    <div className="min-h-screen bg-chalk p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
          <div>
            <Eyebrow>Your competitions</Eyebrow>
            <h1 className="font-display text-3xl font-bold text-ink uppercase tracking-wide">Leagues</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setFormError(''); }}
              className="bg-pitch text-white px-4 py-2 rounded-lg hover:bg-pitch-light font-display uppercase text-sm font-bold tracking-wide shadow border-2 border-ink"
            >
              + Create
            </button>
            <button
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setFormError(''); }}
              className="bg-flag text-white px-4 py-2 rounded-lg hover:bg-flag/90 font-display uppercase text-sm font-bold tracking-wide shadow border-2 border-ink"
            >
              + Join
            </button>
          </div>
        </div>

        {formError && <div className="mb-4"><ErrorBox message={formError} /></div>}

        {showCreate && (
          <form onSubmit={createLeague} className="bg-white p-6 rounded-ticket mb-6 shadow space-y-3 border border-ink/5">
            <input
              type="text" placeholder="League name" value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-ink/10 rounded-lg font-body"
              required
            />
            <button type="submit" className="bg-pitch text-white px-4 py-2 rounded-lg hover:bg-pitch-light font-display uppercase text-sm font-bold tracking-wide border-2 border-ink">
              Create league
            </button>
          </form>
        )}

        {showJoin && (
          <form onSubmit={joinLeague} className="bg-white p-6 rounded-ticket mb-6 shadow space-y-3 border border-ink/5">
            <input
              type="text" placeholder="INVITE CODE" value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border-2 border-ink/10 rounded-lg font-score tracking-[0.3em] text-center"
              required
            />
            <button type="submit" className="bg-flag text-white px-4 py-2 rounded-lg hover:bg-flag/90 font-display uppercase text-sm font-bold tracking-wide border-2 border-ink">
              Join league
            </button>
          </form>
        )}

        {isLoading ? (
          <Spinner label="Loading your leagues…" />
        ) : isError ? (
          <ErrorBox message={errMsg(error, 'Could not load leagues')} onRetry={refetch} />
        ) : leagues && leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leagues.map((league) => (
              <div
                key={league.id}
                onClick={() => onSelectLeague(league.id)}
                className="bg-white p-5 rounded-ticket shadow cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition border border-ink/5"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-ink uppercase truncate">{league.name}</h3>
                    <p className="text-ink/55 text-xs font-score tracking-widest mt-1">{league.invite_code}</p>
                    <p className="text-xs text-ink/55 mt-2 font-body">{league.member_count ?? '?'} member(s)</p>
                  </div>
                  <ScoreDigit value={league.my_points ?? 0} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-ticket shadow p-10 text-center text-ink/55 border-2 border-dashed border-ink/10">
            <p className="font-display uppercase tracking-wide font-bold text-ink mb-1">No leagues yet</p>
            <p className="text-sm font-body">Create one, or join a friend's with their invite code.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MATCH CARD ============
function resultFromScore(home, away) {
  if (home === '' || away === '' || home === undefined || away === undefined) return null;
  const h = parseInt(home), a = parseInt(away);
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return '1';
  if (h < a) return '2';
  return 'X';
}

function oddsForResult(match, result) {
  if (result === '1') return match.odds_home;
  if (result === 'X') return match.odds_draw;
  if (result === '2') return match.odds_away;
  return 0;
}

function MatchCard({ match, leagueId, existingPrediction, x2Status, onSaved }) {
  const [home, setHome] = useState(existingPrediction?.predicted_home_goals ?? '');
  const [away, setAway] = useState(existingPrediction?.predicted_away_goals ?? '');
  const [x2, setX2] = useState(existingPrediction?.x2_applied ?? false);
  const [editing, setEditing] = useState(!existingPrediction);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setHome(existingPrediction?.predicted_home_goals ?? '');
    setAway(existingPrediction?.predicted_away_goals ?? '');
    setX2(existingPrediction?.x2_applied ?? false);
    setEditing(!existingPrediction);
  }, [existingPrediction?.id, existingPrediction?.predicted_home_goals, existingPrediction?.predicted_away_goals, existingPrediction?.x2_applied]);

  const isFinished = match.status === 'finished';
  const isLocked = !isFinished && new Date(match.kickoff_time).getTime() - Date.now() <= 15 * 60 * 1000;
  const minutesLeft = Math.floor((new Date(match.kickoff_time).getTime() - Date.now()) / 60000);

  const predictedResult = resultFromScore(home, away);
  const potentialBase = predictedResult ? oddsForResult(match, predictedResult) : 0;
  const x2LockedByOther = x2Status?.x2_used && x2Status?.match_id !== match.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      await api.post('/predictions', {
        match_id: match.id,
        predicted_home_goals: parseInt(home),
        predicted_away_goals: parseInt(away),
        x2_apply: x2,
      }, { params: { league_id: leagueId } });
      setEditing(false);
      onSaved && onSaved();
    } catch (err) {
      setLocalError(errMsg(err, 'Could not save prediction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-ticket border p-4 transition ${isFinished ? 'bg-pitch/5 border-pitch/20' : 'bg-white border-ink/10 hover:shadow-md'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-score text-ink/55 tracking-wide">GW{match.gameweek}</span>
        <span className="text-[11px] font-score text-ink/55 tracking-wide">
          {new Date(match.kickoff_time).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge name={match.home_team} color={colorFor(match.home_team)} />
          <span className="font-display font-semibold text-ink text-sm truncate">{match.home_team}</span>
        </div>
        <span className="text-ink/55 text-xs font-score shrink-0">vs</span>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <span className="font-display font-semibold text-ink text-sm truncate text-right">{match.away_team}</span>
          <TeamBadge name={match.away_team} color={colorFor(match.away_team)} />
        </div>
      </div>

      <div className="ticket-perf" />

      {isFinished ? (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <ScoreDigit value={match.home_goals} size="md" />
            <span className="text-ink/55 font-score">-</span>
            <ScoreDigit value={match.away_goals} size="md" />
            <span className="ml-2 text-[10px] font-display uppercase tracking-wider text-pitch font-bold">Full time</span>
          </div>
          {existingPrediction && (
            <div className="text-right">
              <p className={`font-score text-xl font-bold ${existingPrediction.points_earned > 0 ? 'text-pitch' : 'text-ink/55'}`}>
                {existingPrediction.points_earned > 0 ? `+${existingPrediction.points_earned}` : '0'}
              </p>
              <p className="text-[10px] text-ink/55 font-body">points earned</p>
            </div>
          )}
        </div>
      ) : isLocked ? (
        <div className="bg-flag/5 text-flag text-sm font-semibold rounded-lg px-3 py-2 font-body">
          🔒 Locked — kickoff {minutesLeft <= 0 ? 'now' : `in ${minutesLeft} min`}
          {existingPrediction && (
            <div className="mt-1 text-ink/70 font-normal flex items-center gap-2">
              Your coupon:
              <span className="font-score font-bold">{existingPrediction.predicted_home_goals}-{existingPrediction.predicted_away_goals}</span>
              {existingPrediction.x2_applied && <span className="text-flag font-bold">×2</span>}
            </div>
          )}
        </div>
      ) : !editing ? (
        <div className="flex justify-between items-center bg-pitch/5 rounded-lg px-3 py-2">
          <div className="flex items-center gap-3">
            <ScoreDigit value={home} size="sm" />
            <span className="text-ink/55 font-score">-</span>
            <ScoreDigit value={away} size="sm" />
            {x2 && <span className="text-flag font-display font-bold text-sm">×2</span>}
          </div>
          <div className="text-right">
            <PointsPill>{potentialBase * (x2 ? 2 : 1)}+ pts</PointsPill>
            <button onClick={() => setEditing(true)} className="block mt-1 ml-auto text-pitch text-xs font-display uppercase font-bold tracking-wide border-2 border-pitch rounded-full px-3 py-0.5 hover:bg-pitch hover:text-white transition">
              Edit
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <ScoreDigit value={home} onChange={setHome} editable size="md" />
              <span className="text-ink/55 font-score font-bold">-</span>
              <ScoreDigit value={away} onChange={setAway} editable size="md" />
            </div>

            <label
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border-2 ${
                x2LockedByOther ? 'opacity-40 cursor-not-allowed border-ink/10' : 'border-flag/30 bg-flag/5 cursor-pointer'
              }`}
              title={x2LockedByOther ? `X2 already used for ${x2Status.used_for_match}` : 'Double your points for this match'}
            >
              <input type="checkbox" checked={x2} disabled={x2LockedByOther} onChange={(e) => setX2(e.target.checked)} />
              <span className="font-display font-bold text-flag">×2</span>
            </label>

            <button
              type="submit" disabled={loading}
              className="ml-auto bg-pitch text-white px-4 py-2.5 rounded-lg text-sm font-display uppercase font-bold tracking-wide hover:bg-pitch-light disabled:opacity-50 border-2 border-ink"
            >
              {loading ? 'Saving…' : 'Fill coupon'}
            </button>
          </div>

          {predictedResult && (
            <p className="text-xs text-ink/55 font-body flex items-center gap-2 flex-wrap">
              🎯 Potential <PointsPill>{potentialBase * (x2 ? 2 : 1)} pts</PointsPill> for a correct result
              {home !== '' && away !== '' && <span> · more if the exact score lands</span>}
            </p>
          )}

          {x2LockedByOther && (
            <p className="text-xs text-flag bg-flag/5 rounded px-2 py-1 font-body">
              ⚠️ ×2 already used on {x2Status.used_for_match} this gameweek
            </p>
          )}

          {localError && <p className="text-xs text-flag font-body">{localError}</p>}
        </form>
      )}

      <div className="mt-3 flex gap-4 text-[11px] font-score text-ink/55">
        <span>1: {match.odds_home}</span>
        <span>X: {match.odds_draw}</span>
        <span>2: {match.odds_away}</span>
      </div>
    </div>
  );
}

// ============ LEAGUE DETAIL ============
function LeagueDetailPage({ leagueId, onBack }) {
  const [gameweek, setGameweek] = useState(1);

  const { data: matches, isLoading: matchesLoading, isError: matchesError, error: matchesErr, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', gameweek],
    queryFn: async () => (await api.get('/matches', { params: { gameweek } })).data,
  });

  const { data: leaderboard, isLoading: lbLoading, isError: lbError, error: lbErr, refetch: refetchLeaderboard } = useQuery({
    queryKey: ['leaderboard', leagueId],
    queryFn: async () => (await api.get(`/leagues/${leagueId}/standings`)).data,
  });

  const { data: userPredictions, refetch: refetchPredictions } = useQuery({
    queryKey: ['user-predictions', leagueId],
    queryFn: async () => {
      try { return (await api.get('/user/predictions', { params: { league_id: leagueId } })).data; }
      catch { return []; }
    },
  });

  const { data: x2Status, refetch: refetchX2 } = useQuery({
    queryKey: ['x2-status', leagueId, gameweek],
    queryFn: async () => {
      try { return (await api.get(`/predictions/x2-status/${gameweek}`, { params: { league_id: leagueId } })).data; }
      catch { return { x2_used: false }; }
    },
  });

  const refetchAll = () => { refetchPredictions(); refetchLeaderboard(); refetchX2(); };
  const getPredictionForMatch = (matchId) => userPredictions?.find((p) => p.match_id === matchId);

  const myTotalPotential = (userPredictions || [])
    .filter((p) => p.match_status !== 'finished')
    .reduce((sum, p) => sum + (p.potential_base_points || 0) * (p.x2_multiplier || 1), 0);

  return (
    <div className="min-h-screen bg-chalk p-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-4 bg-white border-2 border-ink text-ink px-4 py-2 rounded-lg hover:bg-ink/5 font-display uppercase text-sm font-bold tracking-wide">
          ← Leagues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-ticket shadow p-6 border border-ink/5">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div>
                  <Eyebrow>This week's coupon</Eyebrow>
                  <h2 className="font-display text-2xl font-bold text-ink uppercase">Gameweek {gameweek}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setGameweek((g) => Math.max(1, g - 1))} className="bg-ink/5 border-2 border-ink px-3 py-1.5 rounded-lg hover:bg-ink/10 font-display text-xs font-bold uppercase tracking-wide">← Prev</button>
                  <button onClick={() => setGameweek((g) => g + 1)} className="bg-ink/5 border-2 border-ink px-3 py-1.5 rounded-lg hover:bg-ink/10 font-display text-xs font-bold uppercase tracking-wide">Next →</button>
                </div>
              </div>

              {myTotalPotential > 0 && (
                <div className="bg-floodlight/15 border-2 border-floodlight/40 rounded-lg px-4 py-3 mb-4">
                  <p className="text-sm text-ink font-body flex items-center gap-2 flex-wrap">
                    🎯 Live coupon worth up to <PointsPill>{myTotalPotential} pts</PointsPill> this gameweek
                  </p>
                </div>
              )}

              {matchesLoading ? (
                <Spinner label="Loading matches…" />
              ) : matchesError ? (
                <ErrorBox message={errMsg(matchesErr, 'Could not load matches')} onRetry={refetchMatches} />
              ) : matches && matches.length > 0 ? (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id} match={match} leagueId={leagueId}
                      existingPrediction={getPredictionForMatch(match.id)}
                      x2Status={x2Status} onSaved={refetchAll}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-ink/55 text-center py-8 font-body">No matches scheduled for this gameweek yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-ticket shadow p-6 h-fit border border-ink/5">
            <Eyebrow tone="flag">Standings</Eyebrow>
            <h3 className="font-display text-xl font-bold text-ink uppercase mb-4">Leaderboard</h3>

            {lbLoading ? (
              <Spinner label="Loading standings…" />
            ) : lbError ? (
              <ErrorBox message={errMsg(lbErr, 'Could not load leaderboard')} onRetry={refetchLeaderboard} />
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                  const bg = entry.rank <= 3 ? 'bg-floodlight/10 border-floodlight/30' : 'bg-white border-ink/5';
                  return (
                    <div key={entry.user_id} className={`flex justify-between items-center p-3 rounded-lg border ${bg}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 text-center font-display font-bold text-ink text-sm">{medal || `#${entry.rank}`}</span>
                        <span className="font-body font-semibold text-ink text-sm truncate">{entry.username}</span>
                      </div>
                      <ScoreDigit value={entry.points} size="sm" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-ink/55 text-sm font-body">No points yet — be the first to score.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-ticket shadow p-6 mt-6 border border-ink/5">
          <Eyebrow>Your coupon, match by match</Eyebrow>
          <h3 className="font-display text-xl font-bold text-ink uppercase mb-4">Predictions breakdown</h3>

          {userPredictions && userPredictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userPredictions
                .slice()
                .sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time))
                .map((pred) => (
                  <div key={pred.id} className="border border-ink/10 rounded-lg p-3 bg-chalk">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-ink text-sm truncate">{pred.home_team} vs {pred.away_team}</p>
                        <p className="text-xs text-ink/55 font-body">GW{pred.gameweek} · You: <span className="font-score">{pred.predicted_home_goals}-{pred.predicted_away_goals}</span></p>
                        {pred.match_status === 'finished' && (
                          <p className="text-xs text-pitch font-score font-semibold">Actual: {pred.actual_home_goals}-{pred.actual_away_goals}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {pred.match_status === 'finished' ? (
                          <p className={`font-score text-xl font-bold ${pred.points_earned > 0 ? 'text-pitch' : 'text-ink/55'}`}>{pred.points_earned}</p>
                        ) : (
                          <PointsPill>
                            {(pred.potential_base_points || 0) * (pred.x2_multiplier || 1)}<span className="text-[10px]">*</span>
                          </PointsPill>
                        )}
                        <p className="text-[10px] text-ink/55 font-body">{pred.match_status === 'finished' ? 'earned' : 'potential'}</p>
                      </div>
                    </div>

                    {pred.match_status === 'finished' && pred.points_earned > 0 && (
                      <div className="bg-white rounded-lg p-2 text-xs space-y-0.5 border-t border-ink/10 mt-2 font-body">
                        <div className="flex justify-between"><span className="text-ink/55">Base (correct result)</span><span className="font-score font-semibold">{pred.base_points}</span></div>
                        {pred.is_exact_match && (
                          <div className="flex justify-between text-floodlight-dark"><span>+ Exact score bonus</span><span className="font-score font-semibold">+{pred.exact_bonus}</span></div>
                        )}
                        {pred.x2_applied && (
                          <div className="flex justify-between text-flag"><span>× X2 multiplier</span><span className="font-score font-semibold">×2</span></div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex gap-1 flex-wrap">
                      {pred.is_exact_match && <span className="bg-floodlight/20 text-ink text-[10px] px-2 py-0.5 rounded-full font-display font-bold uppercase">🎯 Exact</span>}
                      {pred.x2_applied && <span className="bg-flag/10 text-flag text-[10px] px-2 py-0.5 rounded-full font-display font-bold uppercase">×2</span>}
                      {pred.match_status === 'finished'
                        ? <span className="bg-pitch/10 text-pitch text-[10px] px-2 py-0.5 rounded-full font-display font-bold uppercase">Finished</span>
                        : <span className="bg-ink/5 text-ink/55 text-[10px] px-2 py-0.5 rounded-full font-display font-bold uppercase">Upcoming</span>}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-ink/55 text-sm font-body">No predictions yet. Fill in a score above to see it here.</p>
          )}
          <p className="text-[11px] text-ink/55 mt-3 font-body">* Assumes a correct result; an exact-score bonus may add more.</p>
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN ============
function AdminPage({ onBack }) {
  const [tab, setTab] = useState('matches');
  const [gameweek, setGameweek] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { data: matches, isLoading: matchesLoading, isError: matchesError, error: matchesErr, refetch: refetchMatches } = useQuery({
    queryKey: ['admin-matches', gameweek],
    queryFn: async () => (await api.get('/matches', { params: { gameweek } })).data,
  });

  const { data: allLeagues, isLoading: leaguesLoading, isError: leaguesError, error: leaguesErr, refetch: refetchLeagues } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => (await api.get('/admin/leagues')).data,
    enabled: tab === 'leagues',
  });

  const finished = (matches || []).filter((m) => m.status === 'finished');
  const upcoming = (matches || []).filter((m) => m.status !== 'finished');

  const handleSetResult = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await api.put(`/admin/matches/${selectedMatch.id}/result`, null, {
        params: { home_goals: parseInt(homeGoals), away_goals: parseInt(awayGoals) },
      });
      setMessage({ type: 'success', text: `Result set: ${selectedMatch.home_team} ${homeGoals}-${awayGoals} ${selectedMatch.away_team} · ${response.data.predictions_updated} predictions updated` });
      setSelectedMatch(null); setHomeGoals(''); setAwayGoals('');
      refetchMatches();
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, 'Could not set result') });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (match) => {
    if (!window.confirm(`Reset result for ${match.home_team} vs ${match.away_team}? Points will be recalculated.`)) return;
    try {
      const response = await api.put(`/admin/matches/${match.id}/reset`);
      setMessage({ type: 'success', text: `${response.data.message} · ${response.data.predictions_reset} predictions reset` });
      refetchMatches();
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, 'Could not reset result') });
    }
  };

  const handleDeleteLeague = async (leagueId, leagueName) => {
    if (!window.confirm(`Delete league "${leagueName}"? This removes all its predictions and members.`)) return;
    try {
      const response = await api.delete(`/leagues/${leagueId}`);
      setMessage({ type: 'success', text: `${response.data.message} · ${response.data.deleted_members} members, ${response.data.deleted_predictions} predictions removed` });
      refetchLeagues();
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, 'Could not delete league') });
    }
  };

  return (
    <div className="min-h-screen bg-chalk p-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-4 bg-white border-2 border-ink text-ink px-4 py-2 rounded-lg hover:bg-ink/5 font-display uppercase text-sm font-bold tracking-wide">
          ← Back
        </button>

        <div className="bg-white rounded-ticket shadow p-6 border border-ink/5">
          <Eyebrow tone="flag">Control room</Eyebrow>
          <h1 className="font-display text-2xl font-bold text-ink uppercase mb-6">Admin dashboard</h1>

          <div className="flex gap-2 mb-6 border-b-2 border-ink/10">
            {[['matches', 'Match results'], ['leagues', 'Manage leagues']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setMessage(null); }}
                className={`px-4 py-2 font-display uppercase text-xs font-bold tracking-wide border-b-2 -mb-0.5 transition ${
                  tab === key ? 'text-flag border-flag' : 'text-ink/55 border-transparent hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {message && (
            <div className={`mb-6 p-3 rounded-lg text-sm font-body ${message.type === 'success' ? 'bg-pitch/10 text-pitch border border-pitch/30' : 'bg-flag/10 text-flag border border-flag/30'}`}>
              {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
            </div>
          )}

          {tab === 'matches' && (
            <div>
              <div className="flex gap-2 items-center mb-6">
                <button onClick={() => setGameweek((g) => Math.max(1, g - 1))} className="bg-ink/5 border-2 border-ink px-3 py-1.5 rounded-lg font-display text-xs font-bold uppercase hover:bg-ink/10">← Prev</button>
                <span className="px-4 py-1.5 bg-floodlight/20 border-2 border-floodlight rounded-lg font-score font-bold text-ink text-sm">GW {gameweek}</span>
                <button onClick={() => setGameweek((g) => g + 1)} className="bg-ink/5 border-2 border-ink px-3 py-1.5 rounded-lg font-display text-xs font-bold uppercase hover:bg-ink/10">Next →</button>
              </div>

              {matchesLoading ? (
                <Spinner label="Loading matches…" />
              ) : matchesError ? (
                <ErrorBox message={errMsg(matchesErr, 'Could not load matches')} onRetry={refetchMatches} />
              ) : (
                <>
                  {finished.length > 0 && (
                    <div className="mb-6">
                      <h2 className="font-display text-sm font-bold uppercase mb-3 text-pitch tracking-wide">Finished ({finished.length})</h2>
                      <div className="space-y-2">
                        {finished.map((match) => (
                          <div key={match.id} className="p-4 rounded-lg bg-pitch/5 border border-pitch/20 flex justify-between items-center">
                            <div>
                              <p className="font-display font-semibold text-ink text-sm">{match.home_team} vs {match.away_team}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <ScoreDigit value={match.home_goals} size="sm" />
                                <span className="text-ink/55 font-score">-</span>
                                <ScoreDigit value={match.away_goals} size="sm" />
                              </div>
                            </div>
                            <button onClick={() => handleReset(match)} className="bg-flag text-white px-4 py-2 rounded-lg font-display uppercase text-xs font-bold tracking-wide hover:bg-flag/90 border-2 border-ink">
                              ↶ Reset
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h2 className="font-display text-sm font-bold uppercase mb-3 text-ink tracking-wide">Upcoming ({upcoming.length})</h2>
                  <div className="space-y-2 mb-6">
                    {upcoming.length === 0 && <p className="text-ink/55 text-sm font-body">No upcoming matches this gameweek.</p>}
                    {upcoming.map((match) => (
                      <div
                        key={match.id} onClick={() => setSelectedMatch(match)}
                        className={`p-4 border rounded-lg cursor-pointer transition ${
                          selectedMatch?.id === match.id ? 'bg-floodlight/10 border-floodlight' : 'bg-white border-ink/10 hover:bg-ink/5'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-body font-semibold text-sm">{match.home_team} vs {match.away_team}</span>
                          <span className="text-xs text-ink/55 font-score">{new Date(match.kickoff_time).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMatch && (
                    <div className="bg-floodlight/10 p-6 rounded-lg border-2 border-floodlight/40">
                      <h3 className="font-display font-bold uppercase mb-4 text-sm">Set result: {selectedMatch.home_team} vs {selectedMatch.away_team}</h3>
                      <form onSubmit={handleSetResult} className="flex flex-wrap gap-4 items-center">
                        <ScoreDigit value={homeGoals} onChange={setHomeGoals} editable size="lg" />
                        <span className="font-score text-xl font-bold text-ink/55">-</span>
                        <ScoreDigit value={awayGoals} onChange={setAwayGoals} editable size="lg" />
                        <button type="submit" disabled={loading} className="bg-pitch text-white px-6 py-3 rounded-lg font-display uppercase text-sm font-bold tracking-wide hover:bg-pitch-light disabled:opacity-50 border-2 border-ink">
                          {loading ? 'Setting…' : 'Set result'}
                        </button>
                        <button type="button" onClick={() => setSelectedMatch(null)} className="text-ink/55 text-sm hover:underline font-body border-2 border-mist rounded-lg px-4 py-3 hover:bg-mist/10">
                          Cancel
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'leagues' && (
            <div>
              {leaguesLoading ? (
                <Spinner label="Loading leagues…" />
              ) : leaguesError ? (
                <ErrorBox message={errMsg(leaguesErr, 'Could not load leagues')} onRetry={refetchLeagues} />
              ) : (
                <>
                  <h2 className="font-display text-sm font-bold uppercase mb-4 text-ink tracking-wide">All leagues ({allLeagues?.length || 0})</h2>
                  {allLeagues && allLeagues.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allLeagues.map((league) => (
                        <div key={league.id} className="bg-chalk border border-ink/10 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0">
                              <h3 className="font-display font-semibold text-ink truncate">{league.name}</h3>
                              <p className="text-xs text-ink/55 font-score">{league.invite_code}</p>
                              <p className="text-xs text-ink/55 font-body">by {league.creator}</p>
                            </div>
                            <ScoreDigit value={league.members} size="sm" />
                          </div>
                          <div className="flex gap-1 flex-wrap text-xs mb-3">
                            <span className="bg-pitch/10 text-pitch px-2 py-0.5 rounded-full font-body">{league.predictions} predictions</span>
                          </div>
                          <button onClick={() => handleDeleteLeague(league.id, league.name)} className="w-full bg-flag text-white px-3 py-2 rounded-lg hover:bg-flag/90 font-display uppercase text-xs font-bold tracking-wide border-2 border-ink">
                            🗑️ Delete league
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink/55 text-sm font-body">No leagues found.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ APP ROOT ============
function AppShell() {
  const [user, setUser] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedLeague(null);
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-chalk">
      <nav className="bg-pitch text-chalk p-4 shadow-lg border-b-4 border-floodlight">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crest size={34} />
            <div>
              <p className="font-display font-bold uppercase tracking-wide text-sm leading-none">Prono TN</p>
              <p className="text-[10px] text-chalk/60 font-body">Tunisian Ligue 1 predictions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-body font-semibold hidden sm:block">{user.username}</span>
            {user.username === 'admin' && (
              <button onClick={() => setSelectedLeague('admin')} className="bg-floodlight text-chalk px-3 py-1.5 rounded-lg hover:opacity-90 text-xs font-display font-bold uppercase tracking-wide border-2 border-ink">Admin</button>
            )}
            <button onClick={handleLogout} className="bg-flag px-3 py-1.5 rounded-lg hover:bg-flag/90 text-xs font-display font-bold uppercase tracking-wide border-2 border-ink">
              Log out
            </button>
          </div>
        </div>
      </nav>

      {selectedLeague === 'admin' ? (
        <AdminPage onBack={() => setSelectedLeague(null)} />
      ) : selectedLeague ? (
        <LeagueDetailPage leagueId={selectedLeague} onBack={() => setSelectedLeague(null)} />
      ) : (
        <LeaguesPage user={user} onSelectLeague={setSelectedLeague} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
