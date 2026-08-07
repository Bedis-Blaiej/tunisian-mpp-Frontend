/**
 * Tunisian Score Prediction App - React Frontend
 * Fixed version with QueryClientProvider
 */

import React, { useState, useEffect } from 'react';

import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create QueryClient
const queryClient = new QueryClient();

// Configure axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ PAGES ============

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
      const data = isRegister
        ? { username, email, password }
        : { email, password };

      const response = await api.post(endpoint, data);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ⚽ Tunisian Score Prediction
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-gray-600 text-sm hover:text-blue-600"
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}


function LeaguesPage({ user, onSelectLeague }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Fetch user's leagues (empty for now)
const { data: leagues, isLoading, refetch } = useQuery({
    queryKey: ['leagues', user.id],
    queryFn: async () => {
      try {
        const response = await api.get('/user/leagues');
        return response.data;
      } catch (err) {
        console.error('Error fetching leagues:', err);
        return [];
      }
    },
  });

  const createLeague = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/leagues', { name: leagueName });
      setLeagueName('');
      setShowCreate(false);
      refetch();
    } catch (err) {
      alert('Error creating league: ' + err.response?.data?.detail);
    }
  };

  const joinLeague = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/leagues/${inviteCode}/join`);
      setInviteCode('');
      setShowJoin(false);
      refetch();
    } catch (err) {
      alert('Invalid invite code: ' + err.response?.data?.detail);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Leagues</h1>
          <div className="space-x-2">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create League
            </button>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              + Join League
            </button>
          </div>
        </div>

        {showCreate && (
          <form onSubmit={createLeague} className="bg-white p-6 rounded-lg mb-6 shadow">
            <input
              type="text"
              placeholder="League name"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </form>
        )}

        {showJoin && (
          <form onSubmit={joinLeague} className="bg-white p-6 rounded-lg mb-6 shadow">
            <input
              type="text"
              placeholder="Invite code (e.g., ABC123)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Join
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : leagues && leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leagues.map((league) => (
              <div
                key={league.id}
                onClick={() => onSelectLeague(league.id)}
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold text-gray-800">{league.name}</h3>
                <p className="text-gray-600 text-sm">Code: {league.invite_code}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No leagues yet. Create or join one!</p>
        )}
      </div>
    </div>
  );
}


function LeagueDetailPage({ leagueId, onBack }) {
  const [gameweek, setGameweek] = useState(1);

  // Fetch matches for this gameweek
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', gameweek],
    queryFn: async () => {
      const response = await api.get('/matches', { params: { gameweek } });
      return response.data;
    },
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', leagueId],
    queryFn: async () => {
      const response = await api.get(`/leagues/${leagueId}/standings`);
      return response.data;
    },
  });

  
  // Fetch user's predictions for this league
  const { data: userPredictions, refetch: refetchPredictions } = useQuery({
    queryKey: ['user-predictions', leagueId, gameweek],  // ← ADD gameweek to key
    queryFn: async () => {
      try {
        const response = await api.get('/user/predictions', {
          params: { league_id: leagueId }
        });
        return response.data;
      } catch (err) {
        console.error('Error fetching predictions:', err);
        return [];
      }
    },
    staleTime: 0,  // ← Don't cache, always fetch fresh
    gcTime: 0,     // ← Don't keep in memory
  });
  
  // Refetch predictions when gameweek changes
  useEffect(() => {
    refetchPredictions();
  }, [gameweek, refetchPredictions]);

  // Get prediction for a specific match
  const getPredictionForMatch = (matchId) => {
    return userPredictions?.find(p => p.match_id === matchId);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          ← Back to Leagues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gameweek {gameweek}</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => setGameweek(Math.max(1, gameweek - 1))}
                    className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                    disabled={gameweek === 1}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setGameweek(gameweek + 1)}
                    className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {matchesLoading ? (
                <p className="text-gray-600">Loading matches...</p>
              ) : matches && matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      leagueId={leagueId}
                      existingPrediction={getPredictionForMatch(match.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No matches for this gameweek</p>
              )}
            </div>
            {/* Finished Matches */}
          {matches && matches.some(m => m.status === 'finished') && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Finished Matches (GW {gameweek})</h3>
              <div className="space-y-2">
                {matches
                  .filter(m => m.status === 'finished')
                  .map(match => (
                    <div key={match.id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {match.home_team} vs {match.away_team}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(match.kickoff_time).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {match.home_goals}-{match.away_goals}
                        </p>
                        <p className="text-xs text-gray-600">Final</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          </div>
              {/* Points Breakdown Panel */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Your Points Breakdown</h3>
            
            {userPredictions && userPredictions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userPredictions.map((pred) => (
                  <div key={pred.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {pred.home_team} vs {pred.away_team}
                        </p>
                        <p className="text-sm text-gray-600">
                          You predicted: {pred.predicted_home_goals}-{pred.predicted_away_goals}
                        </p>
                        {pred.actual_home_goals !== null && (
                          <p className="text-sm text-blue-600 font-semibold">
                            Actual: {pred.actual_home_goals}-{pred.actual_away_goals}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {pred.points_earned > 0 ? (
                          <p className="text-2xl font-bold text-green-600">{pred.points_earned}</p>
                        ) : (
                          <p className="text-2xl font-bold text-gray-400">0</p>
                        )}
                        <p className="text-xs text-gray-600">points</p>
                      </div>
                    </div>

                    {/* Points Breakdown */}
                    {pred.points_earned > 0 && (
                      <div className="bg-white rounded p-2 text-sm space-y-1 border-t border-gray-200 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Base points (correct result):</span>
                          <span className="font-semibold">{pred.base_points}</span>
                        </div>
                        {pred.is_exact_match && (
                          <div className="flex justify-between text-orange-600">
                            <span>+ Exact score bonus:</span>
                            <span className="font-semibold">+{pred.exact_bonus}</span>
                          </div>
                        )}
                        {pred.x2_applied && (
                          <div className="flex justify-between text-purple-600">
                            <span>× X2 multiplier:</span>
                            <span className="font-semibold">×2</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold">
                          <span>Total:</span>
                          <span className="text-green-600">{pred.points_earned}</span>
                        </div>
                      </div>
                    )}

                    {/* Status badges */}
                    <div className="mt-2 flex gap-2">
                      {pred.is_exact_match && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                          🎯 Exact
                        </span>
                      )}
                      {pred.x2_applied && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          ⚡ X2
                        </span>
                      )}
                      {pred.match_status === "finished" && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          ✓ Finished
                        </span>
                      )}
                      {pred.match_status === "upcoming" && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          ⏳ Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No predictions yet. Submit one to see breakdown!</p>
            )}
          </div>
          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry) => {
                  // Medal emoji based on rank
                  let medal = "";
                  if (entry.rank === 1) medal = "🥇";
                  else if (entry.rank === 2) medal = "🥈";
                  else if (entry.rank === 3) medal = "🥉";
                  else medal = "#" + entry.rank;

                  // Color based on rank
                  let bgColor = "bg-white";
                  if (entry.rank === 1) bgColor = "bg-yellow-50";
                  else if (entry.rank === 2) bgColor = "bg-gray-50";
                  else if (entry.rank === 3) bgColor = "bg-orange-50";

                  return (
                    <div
                      key={entry.user_id}
                      className={`flex justify-between items-center p-3 rounded border border-gray-200 ${bgColor} hover:shadow transition`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold w-8">{medal}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{entry.username}</p>
                          <p className="text-xs text-gray-600">
                            {entry.rank === 1 ? "🔥 Leading" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{entry.points}</p>
                        <p className="text-xs text-gray-600">points</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600">No predictions yet</p>
              )}
            </div>

            {/* Leaderboard Stats */}
            {leaderboard && leaderboard.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {leaderboard[0].points}
                    </p>
                    <p className="text-gray-600">Top score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">
                      {leaderboard.length}
                    </p>
                    <p className="text-gray-600">Players</p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

  );
}


function MatchCard({ match, leagueId, existingPrediction }) {
  const [prediction, setPrediction] = useState({
    home: existingPrediction?.predicted_home_goals || '',
    away: existingPrediction?.predicted_away_goals || '',
    x2: existingPrediction?.x2_applied || false
  });
  const [submitted, setSubmitted] = useState(!!existingPrediction);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (existingPrediction) {
        setPrediction({
            home: existingPrediction.predicted_home_goals,
            away: existingPrediction.predicted_away_goals,
            x2: existingPrediction.x2_applied
        });
        setSubmitted(true);
    } else {
        setSubmitted(false);
        setPrediction({
            home: '',
            away: '',
            x2: false
        });
    }
}, [existingPrediction]);
  // Check if X2 is available in this gameweek
  const { data: x2Status } = useQuery({
    queryKey: ['x2-status', match.gameweek, leagueId],
    queryFn: async () => {
      try {
        const response = await api.get(`/predictions/x2-status/${match.gameweek}`, {
          params: { league_id: leagueId }
        });
        return response.data;
      } catch (err) {
        return { x2_used: false, used_for_match: null };
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/predictions', {
        match_id: match.id,
        predicted_home_goals: parseInt(prediction.home),
        predicted_away_goals: parseInt(prediction.away),
        x2_apply: prediction.x2,
      }, {
        params: { league_id: leagueId },
      });
      
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting prediction: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isLocked = new Date(match.kickoff_time) <= new Date();
  const timeUntilLockdown = new Date(match.kickoff_time).getTime() - Date.now();
  const minutesLeft = Math.floor(timeUntilLockdown / 60000);
  
  // X2 is disabled if already used in this gameweek AND not used on this match
  const x2Disabled = x2Status?.x2_used && !existingPrediction?.x2_applied;
  const x2Message = x2Status?.x2_used ? `X2 already used for ${x2Status.used_for_match}` : null;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow transition">
      <div className="flex justify-between items-center mb-3">
        <div className="font-semibold text-gray-800">
          {match.home_team} vs {match.away_team}
        </div>
        <div className="text-sm text-gray-600">
          {new Date(match.kickoff_time).toLocaleString()}
        </div>
      </div>

      {/* Match Status */}
      {match.status === 'finished' ? (
        <div className="text-lg font-bold text-green-600">
          Final: {match.home_goals}-{match.away_goals}
        </div>
      ) : isLocked ? (
        <div className="text-red-600 font-semibold">
          ❌ Prediction Locked (Match starting in {minutesLeft < 0 ? 'now' : minutesLeft + ' min'})
        </div>
      ) : submitted ? (
        <div>
          <div className="text-green-600 font-semibold mb-2">
            ✓ Prediction: {prediction.home}-{prediction.away} {prediction.x2 ? '(x2)' : ''}
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit prediction
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2 items-end flex-wrap">
            <input
              type="number"
              min="0"
              max="10"
              placeholder="H"
              value={prediction.home}
              onChange={(e) => setPrediction({ ...prediction, home: e.target.value })}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              required
            />
            <span className="text-gray-600">-</span>
            <input
              type="number"
              min="0"
              max="10"
              placeholder="A"
              value={prediction.away}
              onChange={(e) => setPrediction({ ...prediction, away: e.target.value })}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              required
            />
            
            {/* X2 Checkbox with Disabled State */}
            <label className={`flex items-center gap-1 text-sm ${x2Disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input
                type="checkbox"
                checked={prediction.x2}
                onChange={(e) => !x2Disabled && setPrediction({ ...prediction, x2: e.target.checked })}
                disabled={x2Disabled}
                title={x2Message || "Use X2 bonus (once per gameweek)"}
              />
              x2
            </label>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Submit'}
            </button>
          </div>
          
          {/* X2 Message */}
          {x2Message && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
              ⚠️ {x2Message} in Gameweek {match.gameweek}
            </div>
          )}
        </form>
      )}

      {/* Odds Display */}
      <div className="mt-2 text-xs text-gray-500">
        Odds: {match.odds_home} | Draw {match.odds_draw} | {match.odds_away}
      </div>
    </div>
  );
}


// ============ MAIN APP WITH QUERY CLIENT PROVIDER ============
function AdminPage({ user, onBack }) {
  const [gameweek, setGameweek] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch matches
  const { data: matches } = useQuery({
    queryKey: ['admin-matches', gameweek],
    queryFn: async () => {
      const response = await api.get('/matches', { params: { gameweek } });
      return response.data.filter(m => m.status !== 'finished');
    },
  });

  const handleSetResult = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.put(
        `/admin/matches/${selectedMatch.id}/result`,
        null,
        {
          params: {
            home_goals: parseInt(homeGoals),
            away_goals: parseInt(awayGoals)
          }
        }
      );

      setMessage(`✅ Result set: ${selectedMatch.home_team} ${homeGoals}-${awayGoals} ${selectedMatch.away_team}`);
      setSelectedMatch(null);
      setHomeGoals('');
      setAwayGoals('');
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Admin Dashboard</h1>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Select Gameweek:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGameweek(Math.max(1, gameweek - 1))}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                ← Prev
              </button>
              <span className="px-4 py-1 bg-blue-100 rounded font-bold">GW {gameweek}</span>
              <button
                onClick={() => setGameweek(gameweek + 1)}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Upcoming Matches (GW {gameweek})</h2>
            <div className="space-y-2">
              {matches?.map(match => (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`p-4 border rounded cursor-pointer transition ${
                    selectedMatch?.id === match.id
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{match.home_team} vs {match.away_team}</span>
                    <span className="text-sm text-gray-600">{new Date(match.kickoff_time).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedMatch && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold mb-4">Set Result: {selectedMatch.home_team} vs {selectedMatch.away_team}</h3>
              
              <form onSubmit={handleSetResult} className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold mb-1">{selectedMatch.home_team} Goals:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={homeGoals}
                      onChange={(e) => setHomeGoals(e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded text-center text-2xl font-bold"
                      required
                    />
                  </div>

                  <span className="text-2xl font-bold">-</span>

                  <div>
                    <label className="block text-sm font-semibold mb-1">{selectedMatch.away_team} Goals:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={awayGoals}
                      onChange={(e) => setAwayGoals(e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded text-center text-2xl font-bold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Setting...' : 'Set Result'}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [user, setUser] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);

  // Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Refetch predictions when user changes
  useEffect(() => {
    if (user) {
      queryClient.refetchQueries();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

return (
  <QueryClientProvider client={queryClient}>
    <div>
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">⚽ Tunisian Score Prediction</h1>
          <div className="flex items-center gap-4">
            <span>{user.username}</span>
            {/* Admin button - only show if username is "admin" */}
            {user.username === "admin" && (
              <button
                onClick={() => setSelectedLeague('admin')}
                className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 text-sm"
              >
                ⚙️ Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

{selectedLeague === 'admin' ? (
  <AdminPage user={user} onBack={() => setSelectedLeague(null)} />
) : selectedLeague ? (
  <LeagueDetailPage
    leagueId={selectedLeague}
    onBack={() => setSelectedLeague(null)}
  />
) : (
  <LeaguesPage user={user} onSelectLeague={setSelectedLeague} />
)}
      </div>
    </QueryClientProvider>
  );
}