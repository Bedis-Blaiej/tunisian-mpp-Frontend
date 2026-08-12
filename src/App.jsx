/**
 * Pronos Tunisie — React Frontend
 * Markup/classes match the provided styles.css design system.
 * All content is wired to the real backend (no placeholder data).
 */

import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import logo from './assets/logo.png';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 0 } } });

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function errMsg(err, fallback = 'Une erreur est survenue') {
  return err?.response?.data?.detail || err?.message || fallback;
}

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

const LOGO_COLORS = ['red', 'gold', 'blue', 'white', 'orange', 'green', 'navy', 'purple'];
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}
function teamCode(name) {
  const words = (name || '').split(' ').filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}
function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase();
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return { title: "Aujourd'hui", sub: capFr(d) };
  if (sameDay(d, yesterday)) return { title: 'Hier', sub: capFr(d) };
  return { title: capFr(d), sub: null };
}
function capFr(d) {
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============ TOAST ============
const ToastCtx = createContext(() => {});
function useToast() { return useContext(ToastCtx); }

function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const notify = (text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2800);
  };
  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div className={`toast${msg ? ' show' : ''}`}>
        <i className="fa-solid fa-circle-check" />
        <span>{msg || ''}</span>
      </div>
    </ToastCtx.Provider>
  );
}

// ============ SHARED UI ============
function StateBox({ loading, error, onRetry, loadingLabel = 'Chargement…' }) {
  if (loading) {
    return (
      <div className="state-box">
        <div className="spin" />
        <p>{loadingLabel}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="state-box error">
        <p>{errMsg(error)}</p>
        {onRetry && <button className="secondary-btn" onClick={onRetry}>Réessayer</button>}
      </div>
    );
  }
  return null;
}

function TeamLogo({ name }) {
  return <div className={`team-logo ${colorFor(name)}`}>{teamCode(name)}</div>;
}

// ============ LOGIN ============
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);
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
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={logo} alt="Pronos Tunisie" />
          <strong>PRONOS <em>TUNISIE</em></strong>
          <small>Le jeu de prédictions 100% tunisien</small>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input className="auth-input" type="text" placeholder="Nom d'utilisateur" value={username}
              onChange={(e) => setUsername(e.target.value)} required />
          )}
          <input className="auth-input" type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Mot de passe" value={password}
            onChange={(e) => setPassword(e.target.value)} required />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading} className="primary-btn auth-submit">
            {loading ? 'Patiente…' : isRegister ? "Créer mon compte" : 'Se connecter'}
          </button>
        </form>

        <button className="auth-switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Déjà inscrit ? Se connecter' : "Pas encore de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  );
}

// ============ MATCH CARD (Mes pronos) ============
function MatchCard({ match, leagueId, existingPrediction, x2Status, featured, onSaved }) {
  const [home, setHome] = useState(existingPrediction?.predicted_home_goals ?? '');
  const [away, setAway] = useState(existingPrediction?.predicted_away_goals ?? '');
  const [x2, setX2] = useState(existingPrediction?.x2_applied ?? false);
  const [status, setStatus] = useState(existingPrediction ? 'ok' : '');
  const lastSaved = useRef(existingPrediction ? `${existingPrediction.predicted_home_goals}-${existingPrediction.predicted_away_goals}-${existingPrediction.x2_applied}` : null);

  useEffect(() => {
    setHome(existingPrediction?.predicted_home_goals ?? '');
    setAway(existingPrediction?.predicted_away_goals ?? '');
    setX2(existingPrediction?.x2_applied ?? false);
    lastSaved.current = existingPrediction ? `${existingPrediction.predicted_home_goals}-${existingPrediction.predicted_away_goals}-${existingPrediction.x2_applied}` : null;
    setStatus(existingPrediction ? 'ok' : '');
  }, [existingPrediction?.id, existingPrediction?.predicted_home_goals, existingPrediction?.predicted_away_goals, existingPrediction?.x2_applied]);

  const isFinished = match.status === 'finished';
  const isLocked = !isFinished && new Date(match.kickoff_time).getTime() - Date.now() <= 15 * 60 * 1000;
  const predictedResult = resultFromScore(home, away);
  const potential = predictedResult ? oddsForResult(match, predictedResult) : 0;
  const x2LockedByOther = x2Status?.x2_used && x2Status?.match_id !== match.id;

  const save = async (nextHome, nextAway, nextX2) => {
    const key = `${nextHome}-${nextAway}-${nextX2}`;
    if (key === lastSaved.current) return;
    setStatus('saving');
    try {
      await api.post('/predictions', {
        match_id: match.id,
        predicted_home_goals: parseInt(nextHome),
        predicted_away_goals: parseInt(nextAway),
        x2_apply: nextX2,
      });
      lastSaved.current = key;
      setStatus('ok');
      onSaved && onSaved();
    } catch (err) {
      setStatus('err');
      setStatus(errMsg(err));
    }
  };

  const handleBlur = () => {
    if (home !== '' && away !== '' && !isNaN(parseInt(home)) && !isNaN(parseInt(away))) {
      save(home, away, x2);
    }
  };

  const toggleX2 = (checked) => {
    setX2(checked);
    if (home !== '' && away !== '') save(home, away, checked);
  };

  return (
    <article className={`match-card${featured ? ' featured' : ''}`}>
      <div className="match-meta">
        <span>{new Date(match.kickoff_time).toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="league-tag">J.{match.gameweek}</span>
      </div>

      <div className="teams">
        <div className="team">
          <TeamLogo name={match.home_team} />
          <strong>{match.home_team}</strong>
          <small>Domicile</small>
        </div>

        <div className="prediction-box">
          <label>Ton score</label>
          {isFinished ? (
            <div className="score-inputs">
              <input value={match.home_goals} disabled />
              <span>–</span>
              <input value={match.away_goals} disabled />
            </div>
          ) : isLocked ? (
            <div className="locked-chip"><i className="fa-solid fa-lock" /> Verrouillé</div>
          ) : (
            <>
              <div className="score-inputs">
                <input type="number" min="0" max="20" placeholder="0" value={home}
                  onChange={(e) => setHome(e.target.value)} onBlur={handleBlur} />
                <span>–</span>
                <input type="number" min="0" max="20" placeholder="0" value={away}
                  onChange={(e) => setAway(e.target.value)} onBlur={handleBlur} />
              </div>
              <div className="x2-row">
                <button
                  type="button"
                  className={`x2-chip${x2 ? ' active' : ''}`}
                  disabled={x2LockedByOther}
                  onClick={() => toggleX2(!x2)}
                  title={x2LockedByOther ? `×2 déjà utilisé sur ${x2Status.used_for_match}` : 'Doubler les points de ce match'}
                >
                  ×2 {x2 ? 'activé' : ''}
                </button>
              </div>
              {x2LockedByOther && <p className="x2-note">×2 déjà utilisé sur {x2Status.used_for_match}</p>}
              <div className={`save-indicator ${status === 'ok' ? 'ok' : status && status !== 'saving' ? 'err' : ''}`}>
                {status === 'saving' ? 'Enregistrement…' : status === 'ok' ? '✓ Enregistré' : status && status !== '' ? status : ''}
              </div>
            </>
          )}
        </div>

        <div className="team">
          <TeamLogo name={match.away_team} />
          <strong>{match.away_team}</strong>
          <small>Extérieur</small>
        </div>
      </div>

      {isFinished ? (
        existingPrediction && (
          <div className="points-rule">
            <i className="fa-solid fa-star" />
            {existingPrediction.points_earned > 0
              ? <span>Tu as gagné <b>+{existingPrediction.points_earned} pts</b>{existingPrediction.is_exact_match ? ' · score exact 🎯' : ''}</span>
              : <span>Pronostic manqué · <b>0 pt</b></span>}
          </div>
        )
      ) : (
        <div className="points-rule">
          <i className="fa-solid fa-star" />
          {predictedResult
            ? <span>Issue correcte : <b>{potential}{x2 ? ' × 2' : ''} pts</b> · score exact : bonus surprise</span>
            : <span>Issue correcte : <b>{match.odds_home}/{match.odds_draw}/{match.odds_away} pts</b> selon le résultat</span>}
        </div>
      )}
    </article>
  );
}

// ============ MES PRONOS ============
function PredictionsPage({ league, user }) {
  const [gameweek, setGameweek] = useState(1);

  const { data: matches, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['matches', gameweek],
    queryFn: async () => (await api.get('/matches', { params: { gameweek } })).data,
  });

  // Predictions and X2 status are account-wide now, not tied to a league.
  const { data: predictions, refetch: refetchPredictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      try { return (await api.get('/user/predictions')).data; }
      catch { return []; }
    },
  });

  const { data: x2Status, refetch: refetchX2 } = useQuery({
    queryKey: ['x2-status', gameweek],
    queryFn: async () => {
      try { return (await api.get(`/predictions/x2-status/${gameweek}`)).data; }
      catch { return { x2_used: false }; }
    },
  });

  const { data: standings } = useQuery({
    queryKey: ['leaderboard', league?.id],
    queryFn: async () => (await api.get(`/leagues/${league.id}/standings`)).data,
    enabled: !!league,
  });

  const onSaved = () => { refetchPredictions(); refetchX2(); };

  const findPrediction = (matchId) => predictions?.find((p) => p.match_id === matchId);
  const myScore = standings?.find((s) => s.user_id === user.id)?.points ?? 0;
  const gwPoints = (predictions || [])
    .filter((p) => p.gameweek === gameweek && p.match_status === 'finished')
    .reduce((s, p) => s + p.points_earned, 0);
  const openCount = (matches || []).filter((m) => m.status !== 'finished' && !findPrediction(m.id)).length;
  const totalCount = (matches || []).length;
  const doneCount = totalCount - openCount;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (!league) {
    return <StateBox loading loadingLabel="Préparation de ta ligue…" />;
  }

  return (
    <section className="page active">
      <div className="hero-row">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-fire" /> {league.name} · Journée {gameweek}</p>
          <h1>À toi de jouer.</h1>
          <p className="page-intro">Prédisez les scores, cumulez des points et grimpez au classement.</p>
        </div>
        <div className="round-selector">
          <button className="round-arrow" onClick={() => setGameweek((g) => Math.max(1, g - 1))}><i className="fa-solid fa-chevron-left" /></button>
          <div><small>Journée</small><strong>{String(gameweek).padStart(2, '0')}</strong></div>
          <button className="round-arrow" onClick={() => setGameweek((g) => g + 1)}><i className="fa-solid fa-chevron-right" /></button>
        </div>
      </div>

      <div className="stat-strip">
        <div className="mini-stat">
          <span className="stat-icon"><i className="fa-solid fa-trophy" /></span>
          <div><small>Mon score</small><strong>{myScore} pts</strong></div>
        </div>
        <div className="mini-stat">
          <span className="stat-icon"><i className="fa-solid fa-chart-line" /></span>
          <div><small>Cette journée</small><strong>{gwPoints > 0 ? '+' : ''}{gwPoints} pts</strong></div>
        </div>
        <div className="mini-stat">
          <span className="stat-icon"><i className="fa-solid fa-clock" /></span>
          <div><small>Pronostics ouverts</small><strong>{openCount} match{openCount > 1 ? 's' : ''}</strong></div>
        </div>
        <div className="round-progress">
          <div className="progress-label"><span>Progression</span><b>{doneCount} / {totalCount || 0}</b></div>
          <div className="progress"><span style={{ width: `${progressPct}%` }} /></div>
        </div>
      </div>

      <div className="section-heading">
        <div><h2>Les matchs à pronostiquer</h2><span>Un score exact rapporte plus de points.</span></div>
        <span className="deadline"><i className="fa-regular fa-clock" /> Verrouillage : 15 min avant le coup d'envoi</span>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel="Chargement des matchs…" />

      {!isLoading && !isError && (
        matches && matches.length > 0 ? (
          <div className="matches-grid">
            {matches.map((match, i) => (
              <MatchCard
                key={match.id} match={match} leagueId={league.id} featured={i === 0}
                existingPrediction={findPrediction(match.id)} x2Status={x2Status} onSaved={onSaved}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Aucun match programmé pour cette journée.</div>
        )
      )}

      <div className="save-bar">
        <div><i className="fa-solid fa-circle-info" /><span>Tes pronostics sont enregistrés automatiquement, modifiables jusqu'au coup d'envoi.</span></div>
      </div>
    </section>
  );
}

// ============ RÉSULTATS ============
function ResultsPage({ league }) {
  const [filter, setFilter] = useState('all'); // all | mine

  const { data: allMatches, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['all-matches'],
    queryFn: async () => (await api.get('/matches')).data,
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      try { return (await api.get('/user/predictions')).data; }
      catch { return []; }
    },
  });

  const findPrediction = (matchId) => predictions?.find((p) => p.match_id === matchId);

  const finished = (allMatches || []).filter((m) => m.status === 'finished');
  const visible = filter === 'mine' ? finished.filter((m) => findPrediction(m.id)) : finished;

  const groups = {};
  visible.forEach((m) => {
    const dayKey = new Date(m.kickoff_time).toDateString();
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(m);
  });
  const sortedDays = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-flag-checkered" /> Historique</p>
          <h1>Les résultats.</h1>
          <p className="page-intro">Retrouve les scores officiels et découvre tes performances{league ? ` dans ${league.name}` : ''}.</p>
        </div>
        <div className="filter-pills">
          <button className={`pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Tout</button>
          <button className={`pill${filter === 'mine' ? ' active' : ''}`} onClick={() => setFilter('mine')}>Mes pronos</button>
        </div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel="Chargement des résultats…" />

      {!isLoading && !isError && (
        sortedDays.length > 0 ? sortedDays.map((dayKey) => {
          const dayMatches = groups[dayKey].sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
          const { title, sub } = formatDayLabel(dayKey);
          const dayScore = dayMatches.reduce((s, m) => s + (findPrediction(m.id)?.points_earned || 0), 0);
          return (
            <div className="result-day" key={dayKey}>
              <div className="day-heading">
                <div><b>{title}</b>{sub && <span>{sub}</span>}<span>{dayMatches.length} match{dayMatches.length > 1 ? 's' : ''} terminé{dayMatches.length > 1 ? 's' : ''}</span></div>
                <span className={`day-score${dayScore === 0 ? ' muted' : ''}`}>{dayScore > 0 ? `+${dayScore} pts` : '0 pt'}</span>
              </div>
              <div className="result-list">
                {dayMatches.map((m) => {
                  const pred = findPrediction(m.id);
                  return (
                    <div className="result-row" key={m.id}>
                      <span className="result-time">{new Date(m.kickoff_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="result-team"><b>{m.home_team}</b></div>
                      <strong className="final-score">{m.home_goals} — {m.away_goals}</strong>
                      <div className="result-team away"><b>{m.away_team}</b></div>
                      {pred ? (
                        pred.points_earned > 0 ? (
                          <span className={`prediction-result ${pred.is_exact_match ? 'exact' : 'correct'}`}>
                            <i className={`fa-solid ${pred.is_exact_match ? 'fa-bullseye' : 'fa-check'}`} /> +{pred.points_earned}
                          </span>
                        ) : (
                          <span className="prediction-result miss"><i className="fa-solid fa-xmark" /> 0</span>
                        )
                      ) : (
                        <span className="prediction-result miss" style={{ opacity: .4 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }) : (
          <div className="empty-state">Aucun résultat pour le moment.</div>
        )
      )}
    </section>
  );
}

// ============ CLASSEMENTS ============
function StandingsPage({ league, user }) {
  const { data: standings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leaderboard', league?.id],
    queryFn: async () => (await api.get(`/leagues/${league.id}/standings`)).data,
    enabled: !!league,
  });

  if (!league) {
    return <StateBox loading loadingLabel="Préparation de ta ligue…" />;
  }

  const leader = standings?.[0];
  const rest = standings?.slice(1) || [];

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-ranking-star" /> {league.name}</p>
          <h1>Classements.</h1>
          <p className="page-intro">Compare ta progression avec les meilleurs pronostiqueurs.</p>
        </div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel="Chargement du classement…" />

      {!isLoading && !isError && standings && standings.length > 0 && (
        <>
          {leader && (
            <div className="leader-card">
              <div className="leader-position">1</div>
              <div className="leader-avatar">{initials(leader.username)}</div>
              <div className="leader-info"><b>{leader.username}</b><span>{leader.user_id === user.id ? "C'est toi 👑" : 'Leader actuel'}</span></div>
              <div className="leader-score"><strong>{leader.points}</strong><span>points</span></div>
              <div className="leader-medal">🏆</div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="table-card">
              <div className="table-head cols-3"><span>Rang</span><span>Joueur</span><span>Points</span></div>
              {rest.map((entry) => (
                <div className={`standing-row cols-3${entry.user_id === user.id ? ' current' : ''}`} key={entry.user_id}>
                  <span className="rank">{entry.rank}</span>
                  <div className="player-cell">
                    <span className="avatar small">{initials(entry.username)}</span>
                    <b>{entry.username}</b>
                    {entry.user_id === user.id && <em>Moi</em>}
                  </div>
                  <strong>{entry.points}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && (!standings || standings.length === 0) && (
        <div className="empty-state">Personne n'a encore de points dans cette ligue.</div>
      )}
    </section>
  );
}

// ============ MES LIGUES ============
function LeagueCard({ league, user, onOpen }) {
  const { data: standings } = useQuery({
    queryKey: ['leaderboard', league.id],
    queryFn: async () => (await api.get(`/leagues/${league.id}/standings`)).data,
  });
  const idx = standings?.findIndex((s) => s.user_id === user.id);
  const rankLabel = standings && idx !== undefined && idx >= 0 ? `${idx + 1}e` : '—';
  const isOfficial = league.name === 'Tunisian League';
  const cover = isOfficial ? 'dark-cover' : ['red-cover', 'gold-cover'][Math.abs(league.name.charCodeAt(0)) % 2];
  const emoji = isOfficial ? '🇹🇳' : ['🏆', '⚽'][Math.abs(league.name.charCodeAt(0)) % 2];

  return (
    <article className="league-card">
      <div className={`league-cover ${cover}`}><span>{emoji}</span></div>
      <div className="league-body">
        <div className="league-title">
          <h3>{league.name}</h3>
          {isOfficial
            ? <span className="public">Officielle</span>
            : <span className="private">Privée · {league.invite_code}</span>}
        </div>
        <p>{league.member_count ?? '?'} membre(s)</p>
        <div className="league-bottom">
          <b>{rankLabel} <small>sur {standings?.length ?? '?'}</small></b>
          <button className="icon-btn" onClick={() => onOpen(league)}><i className="fa-solid fa-arrow-right" /></button>
        </div>
      </div>
    </article>
  );
}

function LeaguesPage({ user, onOpenLeague }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const notify = useToast();

  const { data: leagues, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leagues', user.id],
    queryFn: async () => (await api.get('/user/leagues')).data,
  });

  const create = async () => {
    if (!name.trim()) return;
    try {
      await api.post('/leagues', { name: name.trim() });
      setName(''); setShowCreate(false);
      notify('Ligue créée avec succès 🎉');
      refetch();
    } catch (err) {
      notify(errMsg(err, 'Impossible de créer la ligue'));
    }
  };

  const join = async () => {
    if (!code.trim()) { notify("Entre un code d'invitation."); return; }
    try {
      await api.post(`/leagues/${code.trim().toUpperCase()}/join`);
      notify(`Tu as rejoint la ligue ${code.toUpperCase()} ✅`);
      setCode('');
      refetch();
    } catch (err) {
      notify(errMsg(err, 'Code invalide'));
    }
  };

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-users" /> Communauté</p>
          <h1>Mes ligues.</h1>
          <p className="page-intro">Crée une ligue privée ou rejoins celle de tes amis.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowCreate(!showCreate)}><i className="fa-solid fa-plus" /> Créer une ligue</button>
      </div>

      {showCreate && (
        <div className="create-box">
          <input placeholder="Nom de la ligue" value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()} />
          <button className="primary-btn" onClick={create}>Créer</button>
        </div>
      )}

      <div className="join-box">
        <div className="join-icon"><i className="fa-solid fa-ticket" /></div>
        <div><h3>Tu as un code d'invitation ?</h3><p>Entre le code reçu pour rejoindre une ligue privée.</p></div>
        <div className="join-input">
          <input placeholder="Ex. AB12CD" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && join()} />
          <button className="secondary-btn" onClick={join}>Rejoindre</button>
        </div>
      </div>

      <div className="section-heading">
        <div><h2>Mes ligues actives</h2><span>{leagues?.length ?? 0} compétition(s) à laquelle tu participes</span></div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel="Chargement de tes ligues…" />

      {!isLoading && !isError && (
        leagues && leagues.length > 0 ? (
          <div className="league-grid">
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} user={user} onOpen={onOpenLeague} />
            ))}
          </div>
        ) : (
          <div className="empty-state">Aucune ligue pour l'instant — crées-en une ou rejoins celle d'un ami.</div>
        )
      )}
    </section>
  );
}

// ============ PROFIL ============
function ProfilePage({ user }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profile-stats', user.id],
    queryFn: async () => {
      const leagues = (await api.get('/user/leagues')).data;
      const allPreds = [];
      for (const league of leagues) {
        try {
          const preds = (await api.get('/user/predictions')).data;
          allPreds.push(...preds);
        } catch { /* skip */ }
      }
      const finished = allPreds.filter((p) => p.match_status === 'finished');
      const exact = finished.filter((p) => p.is_exact_match).length;
      const correct = finished.filter((p) => p.points_earned > 0 && !p.is_exact_match).length;
      const miss = finished.filter((p) => p.points_earned === 0).length;
      const totalPoints = finished.reduce((s, p) => s + p.points_earned, 0);
      return { leagues, totalPredictions: allPreds.length, finishedCount: finished.length, exact, correct, miss, totalPoints };
    },
  });

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  const perfPct = data && data.finishedCount > 0 ? Math.round(((data.exact + data.correct) / data.finishedCount) * 100) : 0;

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-user" /> Mon espace</p>
          <h1>Mon profil.</h1>
          <p className="page-intro">Ton historique, tes performances et ton évolution.</p>
        </div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel="Chargement du profil…" />

      {!isLoading && !isError && data && (
        <div className="profile-layout">
          <article className="profile-card">
            <div className="profile-avatar">{initials(user.username)}</div>
            <h2>{user.username}</h2>
            <span className="username">@{user.username}</span>
            <div className="profile-divider" />
            <div className="profile-meta"><span><i className="fa-solid fa-calendar" /> Membre depuis</span><b>{memberSince}</b></div>
            <div className="profile-meta"><span><i className="fa-solid fa-users" /> Ligues</span><b>{data.leagues.length}</b></div>
            <div className="profile-meta"><span><i className="fa-solid fa-star" /> Total points</span><b>{data.totalPoints}</b></div>
          </article>

          <div className="profile-stats">
            <div className="stat-card"><span><i className="fa-solid fa-bullseye" /></span><div><small>Pronostics</small><strong>{data.totalPredictions}</strong></div></div>
            <div className="stat-card"><span><i className="fa-solid fa-circle-check" /></span><div><small>Corrects</small><strong>{data.exact + data.correct}</strong></div></div>
            <div className="stat-card"><span><i className="fa-solid fa-crosshairs" /></span><div><small>Scores exacts</small><strong>{data.exact}</strong></div></div>
            <div className="stat-card"><span><i className="fa-solid fa-star" /></span><div><small>Total points</small><strong>{data.totalPoints}</strong></div></div>
          </div>

          <article className="performance-card">
            <div className="card-title">
              <div><h3>Performance</h3><span>Sur tes {data.finishedCount} derniers pronostics joués</span></div>
              <b>{perfPct}%</b>
            </div>
            <div className="performance-bar"><span style={{ width: `${perfPct}%` }} /></div>
            <div className="performance-legend">
              <span><i className="dot exact-dot" /> Score exact <b>{data.exact}</b></span>
              <span><i className="dot correct-dot" /> Issue correcte <b>{data.correct}</b></span>
              <span><i className="dot miss-dot" /> Faux <b>{data.miss}</b></span>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

// ============ ADMIN ============
function AdminPage({ user }) {
  const [tab, setTab] = useState('matches');
  const [gameweek, setGameweek] = useState(1);
  const [selected, setSelected] = useState(null);
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [banner, setBanner] = useState(null);
  const notify = useToast();

  const { data: matches, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-matches', gameweek],
    queryFn: async () => (await api.get('/matches', { params: { gameweek } })).data,
  });

  const { data: leagues, refetch: refetchLeagues } = useQuery({
    queryKey: ['admin-leagues'],
    queryFn: async () => (await api.get('/admin/leagues')).data,
    enabled: tab === 'leagues',
  });

  const finished = (matches || []).filter((m) => m.status === 'finished');
  const upcoming = (matches || []).filter((m) => m.status !== 'finished');

  const setResult = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/admin/matches/${selected.id}/result`, null, {
        params: { home_goals: parseInt(homeGoals), away_goals: parseInt(awayGoals) },
      });
      setBanner({ ok: true, text: `Résultat enregistré · ${res.data.predictions_updated} pronostics mis à jour` });
      setSelected(null); setHomeGoals(''); setAwayGoals('');
      refetch();
    } catch (err) {
      setBanner({ ok: false, text: errMsg(err) });
    }
  };

  const resetResult = async (match) => {
    if (!window.confirm(`Réinitialiser ${match.home_team} vs ${match.away_team} ?`)) return;
    try {
      const res = await api.put(`/admin/matches/${match.id}/reset`);
      setBanner({ ok: true, text: `${res.data.message} · ${res.data.predictions_reset} pronostics réinitialisés` });
      refetch();
    } catch (err) {
      setBanner({ ok: false, text: errMsg(err) });
    }
  };

  const deleteLeague = async (league) => {
    if (!window.confirm(`Supprimer la ligue "${league.name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await api.delete(`/leagues/${league.id}`);
      notify(`${res.data.message}`);
      refetchLeagues();
    } catch (err) {
      notify(errMsg(err));
    }
  };

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-shield-halved" /> Zone admin</p>
          <h1>Tableau de bord.</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'matches' ? ' active' : ''}`} onClick={() => { setTab('matches'); setBanner(null); }}>Résultats des matchs</button>
        <button className={`admin-tab${tab === 'leagues' ? ' active' : ''}`} onClick={() => { setTab('leagues'); setBanner(null); }}>Gérer les ligues</button>
      </div>

      {banner && <div className={`admin-banner ${banner.ok ? 'ok' : 'err'}`}>{banner.text}</div>}

      {tab === 'matches' && (
        <>
          <div className="round-selector" style={{ marginBottom: 18 }}>
            <button className="round-arrow" onClick={() => setGameweek((g) => Math.max(1, g - 1))}><i className="fa-solid fa-chevron-left" /></button>
            <div><small>Journée</small><strong>{String(gameweek).padStart(2, '0')}</strong></div>
            <button className="round-arrow" onClick={() => setGameweek((g) => g + 1)}><i className="fa-solid fa-chevron-right" /></button>
          </div>

          <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} />

          {!isLoading && !isError && (
            <>
              {finished.length > 0 && (
                <>
                  <h2 style={{ fontSize: 14, marginBottom: 10 }}>Terminés ({finished.length})</h2>
                  {finished.map((m) => (
                    <div className="admin-row done" key={m.id}>
                      <div><b>{m.home_team} vs {m.away_team}</b><div style={{ color: 'var(--muted)', fontSize: 11 }}>{m.home_goals} — {m.away_goals}</div></div>
                      <button className="secondary-btn" onClick={() => resetResult(m)}><i className="fa-solid fa-rotate-left" /> Réinitialiser</button>
                    </div>
                  ))}
                </>
              )}

              <h2 style={{ fontSize: 14, margin: '18px 0 10px' }}>À venir ({upcoming.length})</h2>
              {upcoming.length === 0 && <div className="empty-state">Aucun match à venir pour cette journée.</div>}
              {upcoming.map((m) => (
                <div key={m.id} className={`admin-row${selected?.id === m.id ? ' selected' : ''}`} onClick={() => setSelected(m)}>
                  <b>{m.home_team} vs {m.away_team}</b>
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>{new Date(m.kickoff_time).toLocaleString('fr-FR')}</span>
                </div>
              ))}

              {selected && (
                <form className="admin-result-form" onSubmit={setResult}>
                  <b>{selected.home_team}</b>
                  <input type="number" min="0" max="20" value={homeGoals} onChange={(e) => setHomeGoals(e.target.value)} required />
                  <span>—</span>
                  <input type="number" min="0" max="20" value={awayGoals} onChange={(e) => setAwayGoals(e.target.value)} required />
                  <b>{selected.away_team}</b>
                  <button type="submit" className="primary-btn">Valider le résultat</button>
                  <button type="button" className="secondary-btn" onClick={() => setSelected(null)}>Annuler</button>
                </form>
              )}
            </>
          )}
        </>
      )}

      {tab === 'leagues' && (
        <div className="league-grid">
          {leagues?.map((league) => (
            <div className="league-admin-card" key={league.id}>
              <h4>{league.name}</h4>
              <p>{league.invite_code} · par {league.creator}</p>
              <p>{league.members} membre(s) · {league.predictions} pronostic(s)</p>
              <button className="danger-btn" onClick={() => deleteLeague(league)}>
                <i className="fa-solid fa-trash" /> Supprimer
              </button>
            </div>
          ))}
          {(!leagues || leagues.length === 0) && <div className="empty-state">Aucune ligue.</div>}
        </div>
      )}
    </section>
  );
}

// ============ APP SHELL ============
const TABS = [
  { key: 'predictions', label: 'Mes pronos', icon: 'fa-bullseye' },
  { key: 'results', label: 'Résultats', icon: 'fa-flag-checkered' },
  { key: 'standings', label: 'Classements', icon: 'fa-ranking-star' },
  { key: 'leagues', label: 'Mes ligues', icon: 'fa-users' },
  { key: 'profile', label: 'Profil', icon: 'fa-user' },
];

function AppShell() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('predictions');
  const [league, setLeague] = useState(null); // {id, name, invite_code, ...}

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch { /* ignore */ } }
  }, []);

  // Every account is auto-enrolled in the "Tunisian League" on the backend,
  // so pick it as the active league right after login — Mes pronos works
  // immediately, no need to create or join anything first.
  useEffect(() => {
    if (!user || league) return;
    let cancelled = false;
    api.get('/user/leagues').then((res) => {
      if (cancelled) return;
      const tunisian = res.data.find((l) => l.name === 'Tunisian League');
      setLeague(tunisian || res.data[0] || null);
    }).catch(() => { /* will retry once user opens Mes ligues */ });
    return () => { cancelled = true; };
  }, [user, league]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLeague(null);
    setTab('predictions');
  };

  const openLeague = (l) => { setLeague(l); setTab('predictions'); };

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setTab('predictions'); }}>
          <img src={logo} alt="Pronos Tunisie" />
          <span className="brand-copy">
            <strong>PRONOS <em>TUNISIE</em></strong>
            <small>Le jeu de prédictions 100% tunisien</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navigation principale">
          {TABS.map((t) => (
            <button key={t.key} className={`nav-item${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`fa-solid ${t.icon}`} /><span>{t.label}</span>
            </button>
          ))}
          {user.username === 'admin' && (
            <button className={`nav-item${tab === 'admin' ? ' active' : ''}`} onClick={() => setTab('admin')}>
              <i className="fa-solid fa-shield-halved" /><span>Admin</span>
            </button>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="profile-mini" onClick={() => setTab('profile')} aria-label="Mon profil" title="Mon profil">
            <span className="avatar">{initials(user.username)}</span>
            <span className="online-dot" />
          </button>
          <button className="logout-btn" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </header>

      <main>
        {league && tab !== 'leagues' && tab !== 'profile' && tab !== 'admin' && (
          <p style={{ color: 'var(--muted)', fontSize: 10, marginBottom: -14 }}>
            Ligue active : <b style={{ color: 'white' }}>{league.name}</b> ·{' '}
            <button className="link-btn" onClick={() => setTab('leagues')}>changer</button>
          </p>
        )}

        {tab === 'predictions' && <PredictionsPage league={league} user={user} />}
        {tab === 'results' && <ResultsPage league={league} />}
        {tab === 'standings' && <StandingsPage league={league} user={user} />}
        {tab === 'leagues' && <LeaguesPage user={user} onOpenLeague={openLeague} />}
        {tab === 'profile' && <ProfilePage user={user} />}
        {tab === 'admin' && user.username === 'admin' && <AdminPage user={user} />}
      </main>

      <footer className="footer">
        <div><b>PRONOS TUNISIE</b><span>Le terrain des pronostiqueurs tunisiens.</span></div>
        <span>© 2026 Pronos Tunisie</span>
      </footer>

      <nav className="mobile-nav">
        {TABS.map((t) => (
          <button key={t.key} className={`nav-item${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <i className={`fa-solid ${t.icon}`} /><span>{t.label.split(' ')[t.label.split(' ').length - 1]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </QueryClientProvider>
  );
}
