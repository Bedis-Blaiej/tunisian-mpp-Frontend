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

  // Fetch matches
  const { data: matches } = useQuery({
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          ← Back
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

              <div className="space-y-4">
                {matches && matches.length > 0 ? (
                  matches.map((match) => (
                    <MatchCard key={match.id} match={match} leagueId={leagueId} />
                  ))
                ) : (
                  <p className="text-gray-600">No matches for this gameweek</p>
                )}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry) => (
                  <div key={entry.user_id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold text-gray-800">#{entry.rank} {entry.username}</p>
                    </div>
                    <p className="text-blue-600 font-bold">{entry.points}pts</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-sm">No predictions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function MatchCard({ match, leagueId }) {
  const [prediction, setPrediction] = useState({ home: '', away: '', x2: false });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      alert('Error submitting prediction: ' + err.response?.data?.detail);
    }
  };

  const isLocked = new Date(match.kickoff_time) <= new Date();

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

      {match.status === 'finished' ? (
        <div className="text-lg font-bold text-green-600">
          Final: {match.home_goals}-{match.away_goals}
        </div>
      ) : submitted ? (
        <div className="text-green-600 font-semibold">✓ Prediction submitted</div>
      ) : isLocked ? (
        <div className="text-red-600 font-semibold">Match locked</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2 items-end">
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
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={prediction.x2}
                onChange={(e) => setPrediction({ ...prediction, x2: e.target.checked })}
              />
              x2
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-semibold"
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


// ============ MAIN APP WITH QUERY CLIENT PROVIDER ============

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {selectedLeague ? (
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