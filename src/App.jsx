/**
 * Tunisian Score Prediction App - React Frontend
 * Cleaned, bug-fixed, and visually enhanced version
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
    },
  },
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

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function TeamBadge({ name, color }) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow ${color}`}
    >
      {initials(name)}
    </div>
  );
}

const BADGE_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-purple-500', 'bg-pink-500', 'bg-cyan-600', 'bg-orange-500',
];
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
      <p className="font-semibold mb-1">⚠️ Couldn't load this</p>
      <p className="mb-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-red-800 underline font-semibold">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-extrabold text-gray-800">Tunisian Score Prediction</h1>
          <p className="text-gray-500 text-sm mt-1">Predict scores, climb the leaderboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text" placeholder="Username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-gray-600 text-sm hover:text-blue-600"
        >
          {isRegister ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">My Leagues</h1>
            <p className="text-gray-500 text-sm">Welcome back, {user.username} 👋</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setFormError(''); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-semibold shadow"
            >
              + Create League
            </button>
            <button
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setFormError(''); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-semibold shadow"
            >
              + Join League
            </button>
          </div>
        </div>

        {formError && <div className="mb-4"><ErrorBox message={formError} /></div>}

        {showCreate && (
          <form onSubmit={createLeague} className="bg-white p-6 rounded-2xl mb-6 shadow space-y-3">
            <input
              type="text" placeholder="League name" value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-semibold">
              Create
            </button>
          </form>
        )}

        {showJoin && (
          <form onSubmit={joinLeague} className="bg-white p-6 rounded-2xl mb-6 shadow space-y-3">
            <input
              type="text" placeholder="Invite code (e.g., ABC123)" value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl tracking-widest font-mono"
              required
            />
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 font-semibold">
              Join
            </button>
          </form>
        )}

        {isLoading ? (
          <Spinner label="Loading your leagues..." />
        ) : isError ? (
          <ErrorBox message={errMsg(error, 'Could not load leagues')} onRetry={refetch} />
        ) : leagues && leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leagues.map((league) => (
              <div
                key={league.id}
                onClick={() => onSelectLeague(league.id)}
                className="bg-white p-6 rounded-2xl shadow cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{league.name}</h3>
                    <p className="text-gray-500 text-sm font-mono mt-1">Code: {league.invite_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-blue-600">{league.my_points ?? 0}</p>
                    <p className="text-xs text-gray-500">your points</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">{league.member_count ?? '?'} member(s)</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
            No leagues yet — create one or join with a friend's invite code!
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
    <div className={`rounded-2xl border p-4 transition ${isFinished ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:shadow'}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <TeamBadge name={match.home_team} color={colorFor(match.home_team)} />
          <span className="font-semibold text-gray-800 text-sm">{match.home_team}</span>
          <span className="text-gray-400 text-xs px-1">vs</span>
          <span className="font-semibold text-gray-800 text-sm">{match.away_team}</span>
          <TeamBadge name={match.away_team} color={colorFor(match.away_team)} />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(match.kickoff_time).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isFinished ? (
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block bg-emerald-600 text-white text-xl font-extrabold px-3 py-1 rounded-lg">
              {match.home_goals} - {match.away_goals}
            </span>
            <span className="ml-2 text-xs text-emerald-700 font-semibold">FULL TIME</span>
          </div>
          {existingPrediction && (
            <div className="text-right">
              <p className="text-2xl font-extrabold text-emerald-700">
                {existingPrediction.points_earned > 0 ? `+${existingPrediction.points_earned}` : '0'}
              </p>
              <p className="text-xs text-gray-500">points earned</p>
            </div>
          )}
        </div>
      ) : isLocked ? (
        <div className="bg-red-50 text-red-700 text-sm font-semibold rounded-lg px-3 py-2">
          🔒 Predictions locked — kickoff {minutesLeft <= 0 ? 'now' : `in ${minutesLeft} min`}
          {existingPrediction && (
            <div className="mt-1 text-gray-700 font-normal">
              Your prediction: {existingPrediction.predicted_home_goals}-{existingPrediction.predicted_away_goals}
              {existingPrediction.x2_applied && <span className="ml-1 text-purple-700 font-semibold">×2</span>}
            </div>
          )}
        </div>
      ) : !editing ? (
        <div className="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
          <div>
            <p className="text-emerald-700 font-bold">
              ✓ You predicted {home}-{away} {x2 && <span className="text-purple-700">(×2)</span>}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Worth {potentialBase * (x2 ? 2 : 1)}+ pts if correct
            </p>
          </div>
          <button onClick={() => setEditing(true)} className="text-blue-700 text-sm font-semibold hover:underline">
            Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="10" placeholder="0" value={home}
                onChange={(e) => setHome(e.target.value)}
                className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center text-lg font-bold"
                required
              />
              <span className="text-gray-400 font-bold">-</span>
              <input
                type="number" min="0" max="10" placeholder="0" value={away}
                onChange={(e) => setAway(e.target.value)}
                className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center text-lg font-bold"
                required
              />
            </div>

            <label
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg border ${
                x2LockedByOther ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-purple-200 bg-purple-50 cursor-pointer'
              }`}
              title={x2LockedByOther ? `X2 already used for ${x2Status.used_for_match}` : 'Double your points for this match'}
            >
              <input
                type="checkbox" checked={x2}
                disabled={x2LockedByOther}
                onChange={(e) => setX2(e.target.checked)}
              />
              <span className="font-bold text-purple-700">×2</span>
            </label>

            <button
              type="submit" disabled={loading}
              className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save prediction'}
            </button>
          </div>

          {predictedResult && (
            <p className="text-xs text-gray-500">
              🎯 Potential: <span className="font-semibold text-gray-700">{potentialBase * (x2 ? 2 : 1)} pts</span> for a correct result
              {home !== '' && away !== '' && <span> (plus a bonus if the exact score is right)</span>}
            </p>
          )}

          {x2LockedByOther && (
            <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
              ⚠️ ×2 already used on {x2Status.used_for_match} this gameweek
            </p>
          )}

          {localError && <p className="text-xs text-red-600">{localError}</p>}
        </form>
      )}

      <div className="mt-3 flex gap-3 text-[11px] text-gray-400">
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
  const [tab, setTab] = useState('matches');

  const {
    data: matches, isLoading: matchesLoading, isError: matchesError, error: matchesErr, refetch: refetchMatches,
  } = useQuery({
    queryKey: ['matches', gameweek],
    queryFn: async () => (await api.get('/matches', { params: { gameweek } })).data,
  });

  const {
    data: leaderboard, isLoading: lbLoading, isError: lbError, error: lbErr, refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ['leaderboard', leagueId],
    queryFn: async () => (await api.get(`/leagues/${leagueId}/standings`)).data,
  });

  const {
    data: userPredictions, refetch: refetchPredictions,
  } = useQuery({
    queryKey: ['user-predictions', leagueId],
    queryFn: async () => {
      try {
        return (await api.get('/user/predictions', { params: { league_id: leagueId } })).data;
      } catch {
        return [];
      }
    },
  });

  const { data: x2Status, refetch: refetchX2 } = useQuery({
    queryKey: ['x2-status', leagueId, gameweek],
    queryFn: async () => {
      try {
        return (await api.get(`/predictions/x2-status/${gameweek}`, { params: { league_id: leagueId } })).data;
      } catch {
        return { x2_used: false };
      }
    },
  });

  const refetchAll = () => {
    refetchPredictions();
    refetchLeaderboard();
    refetchX2();
  };

  const getPredictionForMatch = (matchId) => userPredictions?.find((p) => p.match_id === matchId);

  const myTotalPotential = (userPredictions || [])
    .filter((p) => p.match_status !== 'finished')
    .reduce((sum, p) => sum + (p.potential_base_points || 0) * (p.x2_multiplier || 1), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-4 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 font-semibold shadow-sm">
          ← Back to Leagues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <h2 className="text-2xl font-extrabold text-gray-800">Gameweek {gameweek}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setGameweek((g) => Math.max(1, g - 1))} className="bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-semibold text-sm">
                    ← Prev
                  </button>
                  <button onClick={() => setGameweek((g) => g + 1)} className="bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-semibold text-sm">
                    Next →
                  </button>
                </div>
              </div>

              {myTotalPotential > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm text-gray-700">
                    🎯 You could earn up to <span className="font-extrabold text-blue-700">{myTotalPotential} pts</span> from your live predictions this gameweek
                  </p>
                </div>
              )}

              {matchesLoading ? (
                <Spinner label="Loading matches..." />
              ) : matchesError ? (
                <ErrorBox message={errMsg(matchesErr, 'Could not load matches')} onRetry={refetchMatches} />
              ) : matches && matches.length > 0 ? (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      leagueId={leagueId}
                      existingPrediction={getPredictionForMatch(match.id)}
                      x2Status={x2Status}
                      onSaved={refetchAll}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No matches scheduled for this gameweek yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 h-fit">
            <h3 className="text-xl font-extrabold text-gray-800 mb-4">🏆 Leaderboard</h3>

            {lbLoading ? (
              <Spinner label="Loading standings..." />
            ) : lbError ? (
              <ErrorBox message={errMsg(lbErr, 'Could not load leaderboard')} onRetry={refetchLeaderboard} />
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
                  const bg = entry.rank === 1 ? 'bg-yellow-50 border-yellow-200' : entry.rank === 2 ? 'bg-gray-50 border-gray-200' : entry.rank === 3 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100';
                  return (
                    <div key={entry.user_id} className={`flex justify-between items-center p-3 rounded-xl border ${bg}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold w-7 text-center">{medal}</span>
                        <span className="font-semibold text-gray-800 text-sm">{entry.username}</span>
                      </div>
                      <span className="text-lg font-extrabold text-blue-600">{entry.points}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No points yet — be the first to score!</p>
            )}
          </div>
        </div>

        {/* Points breakdown */}
        <div className="bg-white rounded-2xl shadow p-6 mt-6">
          <h3 className="text-xl font-extrabold text-gray-800 mb-4">📊 Your Predictions Breakdown</h3>
          {userPredictions && userPredictions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userPredictions
                .slice()
                .sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time))
                .map((pred) => (
                  <div key={pred.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{pred.home_team} vs {pred.away_team}</p>
                        <p className="text-xs text-gray-500">GW{pred.gameweek} · You: {pred.predicted_home_goals}-{pred.predicted_away_goals}</p>
                        {pred.match_status === 'finished' && (
                          <p className="text-xs text-blue-600 font-semibold">Actual: {pred.actual_home_goals}-{pred.actual_away_goals}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {pred.match_status === 'finished' ? (
                          <p className={`text-xl font-extrabold ${pred.points_earned > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{pred.points_earned}</p>
                        ) : (
                          <p className="text-xl font-extrabold text-blue-500">
                            {(pred.potential_base_points || 0) * (pred.x2_multiplier || 1)}<span className="text-xs text-gray-400">*</span>
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500">{pred.match_status === 'finished' ? 'earned' : 'potential'}</p>
                      </div>
                    </div>

                    {pred.match_status === 'finished' && pred.points_earned > 0 && (
                      <div className="bg-white rounded-lg p-2 text-xs space-y-0.5 border-t border-gray-200 mt-2">
                        <div className="flex justify-between"><span className="text-gray-600">Base (correct result)</span><span className="font-semibold">{pred.base_points}</span></div>
                        {pred.is_exact_match && (
                          <div className="flex justify-between text-orange-600"><span>+ Exact score bonus</span><span className="font-semibold">+{pred.exact_bonus}</span></div>
                        )}
                        {pred.x2_applied && (
                          <div className="flex justify-between text-purple-600"><span>× X2 multiplier</span><span className="font-semibold">×2</span></div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex gap-1 flex-wrap">
                      {pred.is_exact_match && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">🎯 Exact</span>}
                      {pred.x2_applied && <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">⚡ X2</span>}
                      {pred.match_status === 'finished' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">✓ Finished</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">⏳ Upcoming</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No predictions yet. Submit one above to see it here!</p>
          )}
          <p className="text-[11px] text-gray-400 mt-3">* Potential points assume a correct result; an exact-score bonus may add more.</p>
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
  const [message, setMessage] = useState(null); // {type: 'success'|'error', text}

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
      setSelectedMatch(null);
      setHomeGoals('');
      setAwayGoals('');
      refetchMatches();
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, 'Could not set result') });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (match) => {
    if (!window.confirm(`Reset result for ${match.home_team} vs ${match.away_team}? All related points will be recalculated.`)) return;
    try {
      const response = await api.put(`/admin/matches/${match.id}/reset`);
      setMessage({ type: 'success', text: `${response.data.message} · ${response.data.predictions_reset} predictions reset` });
      refetchMatches();
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, 'Could not reset result') });
    }
  };

  const handleDeleteLeague = async (leagueId, leagueName) => {
    if (!window.confirm(`Delete league "${leagueName}"? This removes all its predictions and members. This cannot be undone.`)) return;
    try {
      const response = await api.delete(`/leagues/${leagueId}`);
      setMessage({ type: 'success', text: `${response.data.message} · ${response.data.deleted_members} members, ${response.data.deleted_predictions} predictions removed` });
      refetchLeagues();
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, 'Could not delete league') });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-4 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 font-semibold shadow-sm">
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-extrabold text-gray-800 mb-6">⚙️ Admin Dashboard</h1>

          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {[['matches', '📋 Match Results'], ['leagues', '🗑️ Manage Leagues']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setMessage(null); }}
                className={`px-4 py-2 font-semibold text-sm border-b-2 -mb-px transition ${
                  tab === key ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {message && (
            <div className={`mb-6 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
            </div>
          )}

          {tab === 'matches' && (
            <div>
              <div className="flex gap-2 items-center mb-6">
                <button onClick={() => setGameweek((g) => Math.max(1, g - 1))} className="bg-gray-100 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-gray-200">← Prev</button>
                <span className="px-4 py-1.5 bg-blue-100 rounded-lg font-bold text-blue-800 text-sm">GW {gameweek}</span>
                <button onClick={() => setGameweek((g) => g + 1)} className="bg-gray-100 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-gray-200">Next →</button>
              </div>

              {matchesLoading ? (
                <Spinner label="Loading matches..." />
              ) : matchesError ? (
                <ErrorBox message={errMsg(matchesErr, 'Could not load matches')} onRetry={refetchMatches} />
              ) : (
                <>
                  {finished.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold mb-3 text-emerald-700">✓ Finished ({finished.length})</h2>
                      <div className="space-y-2">
                        {finished.map((match) => (
                          <div key={match.id} className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{match.home_team} vs {match.away_team}</p>
                              <p className="text-2xl font-extrabold text-emerald-700">{match.home_goals}-{match.away_goals}</p>
                            </div>
                            <button onClick={() => handleReset(match)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-700">
                              ↶ Reset
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h2 className="text-lg font-bold mb-3 text-gray-800">Upcoming ({upcoming.length})</h2>
                  <div className="space-y-2 mb-6">
                    {upcoming.length === 0 && <p className="text-gray-500 text-sm">No upcoming matches this gameweek.</p>}
                    {upcoming.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => setSelectedMatch(match)}
                        className={`p-4 border rounded-xl cursor-pointer transition ${
                          selectedMatch?.id === match.id ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-semibold text-sm">{match.home_team} vs {match.away_team}</span>
                          <span className="text-xs text-gray-500">{new Date(match.kickoff_time).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMatch && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h3 className="font-bold mb-4">Set result: {selectedMatch.home_team} vs {selectedMatch.away_team}</h3>
                      <form onSubmit={handleSetResult} className="flex flex-wrap gap-4 items-end">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600">{selectedMatch.home_team}</label>
                          <input type="number" min="0" max="10" value={homeGoals} onChange={(e) => setHomeGoals(e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-xl font-bold" required />
                        </div>
                        <span className="text-xl font-bold pb-2">-</span>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600">{selectedMatch.away_team}</label>
                          <input type="number" min="0" max="10" value={awayGoals} onChange={(e) => setAwayGoals(e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-xl font-bold" required />
                        </div>
                        <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50">
                          {loading ? 'Setting...' : 'Set Result'}
                        </button>
                        <button type="button" onClick={() => setSelectedMatch(null)} className="text-gray-500 text-sm hover:underline">
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
                <Spinner label="Loading leagues..." />
              ) : leaguesError ? (
                <ErrorBox message={errMsg(leaguesErr, 'Could not load leagues')} onRetry={refetchLeagues} />
              ) : (
                <>
                  <h2 className="text-lg font-bold mb-4">All Leagues ({allLeagues?.length || 0})</h2>
                  {allLeagues && allLeagues.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allLeagues.map((league) => (
                        <div key={league.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800">{league.name}</h3>
                              <p className="text-xs text-gray-500 font-mono">{league.invite_code}</p>
                              <p className="text-xs text-gray-500">by {league.creator}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-extrabold text-blue-600">{league.members}</p>
                              <p className="text-[10px] text-gray-500">members</p>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap text-xs mb-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{league.predictions} predictions</span>
                          </div>
                          <button onClick={() => handleDeleteLeague(league.id, league.name)} className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">
                            🗑️ Delete League
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No leagues found.</p>
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-extrabold flex items-center gap-2">⚽ Tunisian Score Prediction</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold hidden sm:block">{user.username}</span>
            {user.username === 'admin' && (
              <button onClick={() => setSelectedLeague('admin')} className="bg-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-700 text-sm font-semibold">
                ⚙️ Admin
              </button>
            )}
            <button onClick={handleLogout} className="bg-red-600/90 px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-semibold">
              Logout
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
