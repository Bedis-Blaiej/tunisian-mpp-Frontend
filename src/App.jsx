/**
 * Pronos Tunisie — React Frontend
 * Markup/classes match the provided styles.css design system.
 * All content is wired to the real backend (no placeholder data).
 * Available in French, English, and Tunisian Arabic — see ./i18n.js
 */

import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import logo from './assets/logo.png';
import { LanguageProvider, useLanguage } from './i18n';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 0 } } });

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function errMsg(err, fallback = 'Something went wrong') {
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

const LOCALE_MAP = { fr: 'fr-FR', en: 'en-US', ar: 'ar-TN' };
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function formatDayLabel(dateStr, lang, t) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const locale = LOCALE_MAP[lang] || 'fr-FR';
  const full = capitalize(d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }));
  if (sameDay(d, today)) return { title: t('results.today'), sub: full };
  if (sameDay(d, yesterday)) return { title: t('results.yesterday'), sub: full };
  return { title: full, sub: null };
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
function StateBox({ loading, error, onRetry, loadingLabel }) {
  const { t } = useLanguage();
  if (loading) {
    return (
      <div className="state-box">
        <div className="spin" />
        <p>{loadingLabel || t('common.loading')}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="state-box error">
        <p>{errMsg(error, t('common.error'))}</p>
        {onRetry && <button className="secondary-btn" onClick={onRetry}>{t('common.retry')}</button>}
      </div>
    );
  }
  return null;
}

// Auto-discovers every image dropped into src/assets/teams/ — no need to
// import each one by hand. Matches by a normalized "slug" of the filename
// (accents stripped, lowercased, spaces/punctuation → dashes) against the
// same slug of the team name coming from the backend.
const teamLogoFiles = import.meta.glob('./assets/teams/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG}', {
  eager: true, import: 'default',
});

function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents (é → e, etc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const teamLogoBySlug = {};
for (const path in teamLogoFiles) {
  const filename = path.split('/').pop().replace(/\.[^.]+$/, '');
  teamLogoBySlug[slugify(filename)] = teamLogoFiles[path];
}

function TeamLogo({ name }) {
  const src = teamLogoBySlug[slugify(name)];
  if (src) {
    return <img className="team-logo-img" src={src} alt={name} title={name} />;
  }
  // No matching file found — fall back to the colored-initials circle
  // instead of showing nothing.
  return <div className={`team-logo ${colorFor(name)}`}>{teamCode(name)}</div>;
}

// ============ LOGIN ============
function GoogleButton({ onCredential, onError, cancelledMsg }) {
  const ref = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google || !ref.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => {
        if (resp?.credential) onCredential(resp.credential);
        else onError && onError(cancelledMsg || 'Google sign-in cancelled');
      },
    });
    window.google.accounts.id.renderButton(ref.current, {
      theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'pill',
    });
  }, [clientId]);

  if (!clientId) return null;
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }} />;
}

function ThemeToggle({ theme, onToggle }) {
  const { t } = useLanguage();
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isLight ? t('common.switchToDark') : t('common.switchToLight')}
      title={isLight ? t('common.switchToDark') : t('common.switchToLight')}
    >
      <i className={`fa-solid ${isLight ? 'fa-moon' : 'fa-sun'}`} />
    </button>
  );
}

function LoginPage({ onLogin, theme, onToggleTheme }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login'); // login | register | verify | forgot | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const finishLogin = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    onLogin(data.user);
  };

  const handleGoogle = async (idToken) => {
    setError(''); setLoading(true);
    try {
      const response = await api.post('/auth/google', { id_token: idToken });
      finishLogin(response.data);
    } catch (err) {
      setError(errMsg(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      finishLogin(response.data);
    } catch (err) {
      if (err?.response?.status === 403) {
        setMode('verify');
        try {
          await api.post('/auth/resend-code', { email });
          setInfo(t('login.codeJustSent'));
        } catch (resendErr) {
          setError(errMsg(resendErr, t('login.couldNotSendCode')));
        }
      } else {
        setError(errMsg(err, t('common.error')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', { username, email, password });
      setInfo(t('login.codeSentTo', email));
      setMode('verify');
    } catch (err) {
      setError(errMsg(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      finishLogin(response.data);
    } catch (err) {
      setError(errMsg(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(''); setInfo('');
    try {
      await api.post('/auth/resend-code', { email });
      setInfo(t('login.codeResent'));
    } catch (err) {
      setError(errMsg(err, t('common.error')));
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setInfo(t('login.resetCodeSent'));
      setMode('reset');
    } catch (err) {
      setError(errMsg(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    
    if (newPassword !== confirmPassword) {
      setError(t('login.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setError(t('login.passwordTooShort'));
      setLoading(false);
      return;
    }
    
    try {
      await api.post('/auth/reset-password', { email, reset_code: resetCode, new_password: newPassword });
      setInfo(t('login.passwordResetSuccess'));
      setTimeout(() => {
        setMode('login');
        setEmail('');
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setInfo('');
      }, 2000);
    } catch (err) {
      setError(errMsg(err, t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-pitch">
          <span className="pitch-badge"><i className="fa-solid fa-star" /> {t('login.badge')}</span>
          <h1>{t('login.headline1')}<br /><em>{t('login.headline2em')}</em>{t('login.headline2suffix')}</h1>
          <p className="pitch-sub">{t('login.sub')}</p>

          <div className="pitch-highlights">
            <div><i className="fa-solid fa-bolt" /> {t('login.h1')}</div>
            <div><i className="fa-solid fa-users" /> {t('login.h2')}</div>
            <div><i className="fa-solid fa-bullseye" /> {t('login.h3')}</div>
          </div>

          <div className="hero-preview">
            <p className="hp-label">{t('login.previewLabel')}</p>
            <div className="hp-profile-head">
              <span className="avatar-demo">BD</span><b>Bedis</b>
            </div>
            <div className="hp-stats">
              <span>🏆 {t('login.previewRank')}</span> <strong>42 pts</strong>
            </div>
            <p className="hp-label" style={{ marginBottom: 0 }}>{t('login.previewPerf')}</p>
          </div>
        </div>

        <div className="auth-card">
        <div className="auth-card-controls">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div className="auth-brand">
          <img src={logo} alt="Pronos Tunisie" />
          <strong>PRONOS <em>TUNISIE</em></strong>
          <small>{t('login.brandTag')}</small>
        </div>

        {mode === 'verify' ? (
          <form onSubmit={handleVerify}>
            {info && <div className="auth-error" style={{ color: 'var(--green)', background: 'rgba(66,201,138,.1)' }}>{info}</div>}
            <input className="auth-input" type="email" value={email} disabled style={{ opacity: .6 }} />
            <input
              className="auth-input" type="text" inputMode="numeric" maxLength={6}
              placeholder={t('login.codePlaceholder')} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: 18, fontWeight: 800 }}
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" disabled={loading} className="primary-btn auth-submit">
              {loading ? t('login.verifying') : t('login.verifyAndLogin')}
            </button>
            <button type="button" className="auth-switch" onClick={handleResend}>{t('login.resendCode')}</button>
            <button type="button" className="auth-switch" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
              {t('common.back')}
            </button>
          </form>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword}>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>{t('login.forgotPasswordDesc')}</p>
            <input className="auth-input" type="email" placeholder={t('login.email')} value={email}
              onChange={(e) => setEmail(e.target.value)} required />
            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-error" style={{ color: 'var(--green)', background: 'rgba(66,201,138,.1)' }}>{info}</div>}
            <button type="submit" disabled={loading} className="primary-btn auth-submit">
              {loading ? t('login.pleaseWait') : t('login.sendResetCode')}
            </button>
            <button type="button" className="auth-switch" onClick={() => { setMode('login'); setError(''); setInfo(''); }}>
              {t('common.back')}
            </button>
          </form>
        ) : mode === 'reset' ? (
          <form onSubmit={handleResetPassword}>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>{t('login.enterResetCode')}</p>
            <input className="auth-input" type="email" value={email} disabled style={{ opacity: .6 }} />
            <input className="auth-input" type="text" inputMode="numeric" maxLength={6} placeholder={t('login.resetCodePlaceholder')}
              value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))} required
              style={{ textAlign: 'center', letterSpacing: '6px', fontSize: 18, fontWeight: 800 }} />
            <input className="auth-input" type="password" placeholder={t('login.newPassword')} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            <input className="auth-input" type="password" placeholder={t('login.confirmPassword')} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-error" style={{ color: 'var(--green)', background: 'rgba(66,201,138,.1)' }}>{info}</div>}
            <button type="submit" disabled={loading} className="primary-btn auth-submit">
              {loading ? t('login.pleaseWait') : t('login.resetPassword')}
            </button>
            <button type="button" className="auth-switch" onClick={() => { setMode('forgot'); setError(''); setInfo(''); setResetCode(''); setNewPassword(''); setConfirmPassword(''); }}>
              {t('common.back')}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={mode === 'register' ? handleRegister : handleLogin}>
              {mode === 'register' && (
                <input className="auth-input" type="text" placeholder={t('login.username')} value={username}
                  onChange={(e) => setUsername(e.target.value)} required />
              )}
              <input className="auth-input" type="email" placeholder={t('login.email')} value={email}
                onChange={(e) => setEmail(e.target.value)} required />
              <input className="auth-input" type="password" placeholder={t('login.password')} value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6} />

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" disabled={loading} className="primary-btn auth-submit">
                {loading ? t('login.pleaseWait') : mode === 'register' ? t('login.createAccount') : t('login.signIn')}
              </button>
            </form>

            {mode === 'login' && (
              <button type="button" className="auth-switch" style={{ fontSize: 10 }} onClick={() => { setMode('forgot'); setError(''); }}>
                {t('login.forgotPassword')}
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px', color: 'var(--muted)', fontSize: 10 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              {t('login.or')}
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <GoogleButton onCredential={handleGoogle} onError={setError} cancelledMsg={t('login.googleCancelled')} />

            <button className="auth-switch" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
              {mode === 'register' ? t('login.alreadyAccount') : t('login.noAccount')}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
function MatchCard({ match, leagueId, existingPrediction, x2Status, featured, onSaved }) {
  const { t, lang } = useLanguage();
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
      setStatus(errMsg(err, t('common.error')));
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
        <span>{new Date(match.kickoff_time).toLocaleDateString(LOCALE_MAP[lang], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="league-tag">J.{match.gameweek}</span>
      </div>

      <div className="teams">
        <div className="team">
          <TeamLogo name={match.home_team} />
          <strong>{match.home_team}</strong>
          <small>{t('matchCard.home')}</small>
        </div>

        <div className="prediction-box">
          <label>{t('matchCard.yourScore')}</label>
          {isFinished ? (
            <div className="score-inputs">
              <input value={match.home_goals} disabled />
              <span>–</span>
              <input value={match.away_goals} disabled />
            </div>
          ) : isLocked ? (
            <div className="locked-chip"><i className="fa-solid fa-lock" /> {t('matchCard.locked')}</div>
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
                  title={x2LockedByOther ? t('matchCard.doubleTitle', x2Status.used_for_match) : t('matchCard.doubleHint')}
                >
                  ×2 {x2 ? t('matchCard.activeWord') : ''}
                </button>
              </div>
              {x2LockedByOther && <p className="x2-note">{t('matchCard.x2Used', x2Status.used_for_match)}</p>}
              <div className={`save-indicator ${status === 'ok' ? 'ok' : status && status !== 'saving' ? 'err' : ''}`}>
                {status === 'saving' ? t('matchCard.saving') : status === 'ok' ? t('matchCard.saved') : status && status !== '' ? status : ''}
              </div>
            </>
          )}
        </div>

        <div className="team">
          <TeamLogo name={match.away_team} />
          <strong>{match.away_team}</strong>
          <small>{t('matchCard.away')}</small>
        </div>
      </div>

      {isFinished ? (
        existingPrediction && (
          <div className="points-rule">
            <i className="fa-solid fa-star" />
            {existingPrediction.points_earned > 0
              ? <span>{t('matchCard.won')} <b>{t('matchCard.wonPts', existingPrediction.points_earned)}</b>{existingPrediction.is_exact_match ? t('matchCard.exactTag') : ''}</span>
              : <span>{t('matchCard.missed')} · <b>{t('matchCard.zeroPt')}</b></span>}
          </div>
        )
      ) : (
        <div className="points-rule">
          <i className="fa-solid fa-star" />
          {predictedResult
            ? <span>{t('matchCard.correctResult')}<b>{potential}{x2 ? ' × 2' : ''} pts</b>{t('matchCard.exactBonus')}</span>
            : <span>{t('matchCard.correctResult')}<b>{match.odds_home}/{match.odds_draw}/{match.odds_away} pts</b>{t('matchCard.accordingToResult')}</span>}
        </div>
      )}
    </article>
  );
}

// ============ MES PRONOS ============
function PredictionsPage({ league, user }) {
  const { t } = useLanguage();
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
    return <StateBox loading loadingLabel={t('predictions.preparingLeague')} />;
  }

  return (
    <section className="page active">
      <div className="hero-row">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-fire" /> {league.name} · {t('predictions.journee', gameweek)}</p>
          <h1>{t('predictions.heroTitle')}</h1>
          <p className="page-intro">{t('predictions.heroSub')}</p>
        </div>
        <div className="round-selector">
          <button className="round-arrow" onClick={() => setGameweek((g) => Math.max(1, g - 1))}><i className="fa-solid fa-chevron-left" /></button>
          <div><small>{t('predictions.roundLabel')}</small><strong>{String(gameweek).padStart(2, '0')}</strong></div>
          <button className="round-arrow" onClick={() => setGameweek((g) => g + 1)}><i className="fa-solid fa-chevron-right" /></button>
        </div>
      </div>

      <div className="stat-strip">
        <div className="mini-stat">
          <span className="stat-icon"><i className="fa-solid fa-trophy" /></span>
          <div><small>{t('predictions.myScore')}</small><strong>{myScore} pts</strong></div>
        </div>
        <div className="mini-stat">
          <span className="stat-icon"><i className="fa-solid fa-chart-line" /></span>
          <div><small>{t('predictions.thisRound')}</small><strong>{gwPoints > 0 ? '+' : ''}{gwPoints} pts</strong></div>
        </div>
        <div className="mini-stat">
          <span className="stat-icon"><i className="fa-solid fa-clock" /></span>
          <div><small>{t('predictions.openPredictions')}</small><strong>{t('predictions.matchCount', openCount)}</strong></div>
        </div>
        <div className="round-progress">
          <div className="progress-label"><span>{t('predictions.progress')}</span><b>{doneCount} / {totalCount || 0}</b></div>
          <div className="progress"><span style={{ width: `${progressPct}%` }} /></div>
        </div>
      </div>

      <div className="section-heading">
        <div><h2>{t('predictions.sectionTitle')}</h2><span>{t('predictions.sectionSub')}</span></div>
        <span className="deadline"><i className="fa-regular fa-clock" /> {t('predictions.deadline')}</span>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel={t('predictions.loadingMatches')} />

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
          <div className="empty-state">{t('predictions.noMatches')}</div>
        )
      )}

      <div className="save-bar">
        <div><i className="fa-solid fa-circle-info" /><span>{t('predictions.saveBarNote')}</span></div>
      </div>
    </section>
  );
}

// ============ RÉSULTATS ============
function ResultsPage({ league }) {
  const { t, lang } = useLanguage();
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

  const visible = filter === 'mine'
    ? (allMatches || []).filter((m) => findPrediction(m.id))
    : (allMatches || []);

  // Group by gameweek and sort ascending (1, 2, 3...)
  const groups = {};
  visible.forEach((m) => {
    const gwKey = m.gameweek || 0;
    if (!groups[gwKey]) groups[gwKey] = [];
    groups[gwKey].push(m);
  });
  const sortedGameweeks = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-flag-checkered" /> {t('results.eyebrow')}</p>
          <h1>{t('results.title')}</h1>
          <p className="page-intro">{t('results.sub')}{league ? t('results.subIn', league.name) : ''}.</p>
        </div>
        <div className="filter-pills">
          <button className={`pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>{t('results.all')}</button>
          <button className={`pill${filter === 'mine' ? ' active' : ''}`} onClick={() => setFilter('mine')}>{t('results.mine')}</button>
        </div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel={t('results.loading')} />

      {!isLoading && !isError && (
        sortedGameweeks.length > 0 ? sortedGameweeks.map((gw) => {
          const gwMatches = groups[gw].sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
          const gwScore = gwMatches.reduce((s, m) => s + (findPrediction(m.id)?.points_earned || 0), 0);
          return (
            <div className="result-day" key={gw}>
              <div className="day-heading">
                <div><b>{t('predictions.journee', gw)}</b><span>{t('results.matchesListed', gwMatches.length)}</span></div>
                <span className={`day-score${gwScore === 0 ? ' muted' : ''}`}>{gwScore > 0 ? `+${gwScore} pts` : '0 pt'}</span>
              </div>
              <div className="result-list">
                {gwMatches.map((m) => {
                  const pred = findPrediction(m.id);
                  return (
                    <div key={m.id}>
                      <div className="result-row">
                        <span className="result-time">{new Date(m.kickoff_time).toLocaleTimeString(LOCALE_MAP[lang], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="result-team"><b>{m.home_team}</b></div>
                        <div className="score-column">
                          <strong className={`final-score${m.status !== 'finished' ? ' pending' : ''}`}>
                            {m.status === 'finished' ? `${m.home_goals} — ${m.away_goals}` : t('results.notFinished')}
                          </strong>
                          {pred && m.status === 'finished' && (
                            <div className="user-prediction-badge">{t('matchCard.yourScore')}: {pred.predicted_home_goals}—{pred.predicted_away_goals}</div>
                          )}
                        </div>
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }) : (
          <div className="empty-state">{t('results.noResults')}</div>
        )
      )}
    </section>
  );
}

// ============ CLASSEMENTS ============
function StandingsPage({ league, user }) {
  const { t, lang } = useLanguage();
  const [selectedUser, setSelectedUser] = useState(null);
  const { data: standings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leaderboard', league?.id],
    queryFn: async () => (await api.get(`/leagues/${league.id}/leaderboard`)).data,
    enabled: !!league,
  });

  const { data: selectedUserPredictions, isLoading: predLoading } = useQuery({
    queryKey: ['user-predictions', selectedUser?.user_id],
    queryFn: async () => selectedUser ? (await api.get(`/users/${selectedUser.user_id}/predictions/finished`)).data : [],
    enabled: !!selectedUser,
  });

  if (!league) {
    return <StateBox loading loadingLabel={t('standings.preparingLeague')} />;
  }

  const leader = standings?.[0];
  const rest = standings?.slice(1) || [];

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-ranking-star" /> {league.name}</p>
          <h1>{t('standings.title')}</h1>
          <p className="page-intro">{t('standings.sub')}</p>
        </div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel={t('standings.loading')} />

      {!isLoading && !isError && standings && standings.length > 0 && (
        <>
          {leader && (
            <div className="leader-card" style={{ cursor: leader.user_id !== user.id ? 'pointer' : 'default' }} onClick={() => leader.user_id !== user.id && setSelectedUser(leader)}>
              <div className="leader-position">1</div>
              <div className="leader-avatar">{initials(leader.username)}</div>
              <div className="leader-info"><b>{leader.username}</b><span>{leader.user_id === user.id ? t('standings.itsYou') : t('standings.currentLeader')}</span></div>
              <div className="leader-score"><strong>{leader.points}</strong><span>{t('standings.points')}</span></div>
              <div className="leader-medal">🏆</div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="table-card">
              <div className="table-head cols-3"><span>{t('standings.rank')}</span><span>{t('standings.player')}</span><span>{t('standings.pointsCol')}</span></div>
              {rest.map((entry, idx) => {
                const getMedal = () => {
                  if (entry.rank === 2) return '🥈';
                  if (entry.rank === 3) return '🥉';
                  return null;
                };
                const medal = getMedal();
                return (
                  <div className={`standing-row cols-3${entry.user_id === user.id ? ' current' : ''}${medal ? ' medal' : ''}`} key={entry.user_id} style={{ cursor: entry.user_id !== user.id ? 'pointer' : 'default' }} onClick={() => entry.user_id !== user.id && setSelectedUser(entry)}>
                    <span className="rank">{medal || entry.rank}</span>
                    <div className="player-cell">
                      <span className="avatar small">{initials(entry.username)}</span>
                      <b>{entry.username}</b>
                      {entry.user_id === user.id && <em>{t('standings.me')}</em>}
                    </div>
                    <strong>{entry.points}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && (!standings || standings.length === 0) && (
        <div className="empty-state">{t('standings.nobodyYet')}</div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedUser.username}</h2>
                <p>{t('standings.predictions')}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            {predLoading && <StateBox loading loadingLabel={t('common.loading')} />}

            {!predLoading && selectedUserPredictions && selectedUserPredictions.length > 0 && (
              <div className="user-predictions-list">
                {selectedUserPredictions.map((pred) => (
                  <div className="pred-item" key={pred.id}>
                    <div className="pred-gw">J.{pred.gameweek}</div>
                    <div className="pred-match">
                      <span className="team">{pred.home_team}</span>
                      <span className="score-actual">{pred.actual_home_goals} — {pred.actual_away_goals}</span>
                      <span className="team away">{pred.away_team}</span>
                    </div>
                    <div className="pred-prediction">
                      <span className="label">{t('matchCard.yourScore')}:</span>
                      <span className="score">{pred.predicted_home_goals} — {pred.predicted_away_goals}</span>
                    </div>
                    <div className={`pred-points${pred.points_earned > 0 ? ' positive' : ''}`}>
                      {pred.points_earned > 0 ? `+${pred.points_earned}` : '0'} {pred.is_exact_match && pred.points_earned > 0 ? '🎯' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!predLoading && (!selectedUserPredictions || selectedUserPredictions.length === 0) && (
              <div className="empty-state">{t('standings.noPredictions')}</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ============ MES LIGUES ============
function LeagueCard({ league, user, onOpen }) {
  const { t } = useLanguage();
  const { data: standings } = useQuery({
    queryKey: ['leaderboard', league.id],
    queryFn: async () => (await api.get(`/leagues/${league.id}/leaderboard`)).data,
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
            ? <span className="public">{t('leagues.officialTag')}</span>
            : <span className="private">{t('common.private')} · {league.invite_code}</span>}
        </div>
        <p>{t('leagues.members', league.member_count ?? '?')}</p>
        <div className="league-bottom">
          <b>{rankLabel} <small>{t('leagues.of')} {standings?.length ?? '?'}</small></b>
          <button className="icon-btn" onClick={() => onOpen(league)}><i className="fa-solid fa-arrow-right" /></button>
        </div>
      </div>
    </article>
  );
}

function LeaguesPage({ user, onOpenLeague }) {
  const { t } = useLanguage();
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
      notify(t('leagues.createdSuccess'));
      refetch();
    } catch (err) {
      notify(errMsg(err, t('leagues.createFailed')));
    }
  };

  const join = async () => {
    if (!code.trim()) { notify(t('leagues.enterCode')); return; }
    try {
      await api.post(`/leagues/invite/${code.trim().toUpperCase()}/join`);
      notify(t('leagues.joinedLeague', code.toUpperCase()));
      setCode('');
      refetch();
    } catch (err) {
      notify(errMsg(err, t('leagues.invalidCode')));
    }
  };

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-users" /> {t('leagues.eyebrow')}</p>
          <h1>{t('leagues.title')}</h1>
          <p className="page-intro">{t('leagues.sub')}</p>
        </div>
        <button className="primary-btn" onClick={() => setShowCreate(!showCreate)}><i className="fa-solid fa-plus" /> {t('leagues.createLeague')}</button>
      </div>

      {showCreate && (
        <div className="create-box">
          <input placeholder={t('leagues.leagueNamePh')} value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()} />
          <button className="primary-btn" onClick={create}>{t('leagues.create')}</button>
        </div>
      )}

      <div className="join-box">
        <div className="join-icon"><i className="fa-solid fa-ticket" /></div>
        <div><h3>{t('leagues.haveCode')}</h3><p>{t('leagues.haveCodeSub')}</p></div>
        <div className="join-input">
          <input placeholder={t('leagues.codePh')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && join()} />
          <button className="secondary-btn" onClick={join}>{t('leagues.join')}</button>
        </div>
      </div>

      <div className="section-heading">
        <div><h2>{t('leagues.activeLeagues')}</h2><span>{t('leagues.competitions', leagues?.length ?? 0)}</span></div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel={t('leagues.loading')} />

      {!isLoading && !isError && (
        leagues && leagues.length > 0 ? (
          <div className="league-grid">
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} user={user} onOpen={onOpenLeague} />
            ))}
          </div>
        ) : (
          <div className="empty-state">{t('leagues.noLeagues')}</div>
        )
      )}
    </section>
  );
}

// ============ PROFIL ============
function ProfilePage({ user }) {
  const { t, lang } = useLanguage();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profile-stats', user.id],
    queryFn: async () => {
      const leagues = (await api.get('/user/leagues')).data;
      // Predictions are account-wide now — fetch once, not once per league
      // (looping was silently duplicating every prediction N times).
      let allPreds = [];
      try { allPreds = (await api.get('/user/predictions')).data; } catch { /* ignore */ }

      const finished = allPreds.filter((p) => p.match_status === 'finished');
      const exact = finished.filter((p) => p.is_exact_match).length;
      const correct = finished.filter((p) => p.points_earned > 0 && !p.is_exact_match).length;
      const miss = finished.filter((p) => p.points_earned === 0).length;
      const totalPoints = finished.reduce((s, p) => s + p.points_earned, 0);
      return { leagues, totalPredictions: allPreds.length, finishedCount: finished.length, exact, correct, miss, totalPoints };
    },
  });

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(LOCALE_MAP[lang], { month: 'long', year: 'numeric' })
    : '—';

  const perfPct = data && data.finishedCount > 0 ? Math.round(((data.exact + data.correct) / data.finishedCount) * 100) : 0;

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-user" /> {t('profile.eyebrow')}</p>
          <h1>{t('profile.title')}</h1>
          <p className="page-intro">{t('profile.sub')}</p>
        </div>
      </div>

      <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} loadingLabel={t('profile.loading')} />

      {!isLoading && !isError && data && (
        <div className="profile-layout">
          <article className="profile-card">
            <div className="profile-avatar">{initials(user.username)}</div>
            <h2>{user.username}</h2>
            <span className="username">@{user.username}</span>
            <div className="profile-divider" />
            <div className="profile-meta"><span><i className="fa-solid fa-calendar" /> {t('profile.memberSince')}</span><b>{memberSince}</b></div>
            <div className="profile-meta"><span><i className="fa-solid fa-users" /> {t('profile.leaguesLabel')}</span><b>{data.leagues.length}</b></div>
            <div className="profile-meta"><span><i className="fa-solid fa-star" /> {t('profile.totalPoints')}</span><b>{data.totalPoints}</b></div>
          </article>

          <div className="profile-stats">
            <div className="stat-card"><span><i className="fa-solid fa-bullseye" /></span><div><small>{t('profile.predictionsLabel')}</small><strong>{data.totalPredictions}</strong></div></div>
            <div className="stat-card"><span><i className="fa-solid fa-circle-check" /></span><div><small>{t('profile.correctLabel')}</small><strong>{data.exact + data.correct}</strong></div></div>
            <div className="stat-card"><span><i className="fa-solid fa-crosshairs" /></span><div><small>{t('profile.exactScoresLabel')}</small><strong>{data.exact}</strong></div></div>
            <div className="stat-card"><span><i className="fa-solid fa-star" /></span><div><small>{t('profile.totalPoints')}</small><strong>{data.totalPoints}</strong></div></div>
          </div>

          <article className="performance-card">
            <div className="card-title">
              <div><h3>{t('profile.performance')}</h3><span>{t('profile.last', data.finishedCount)}</span></div>
              <b>{perfPct}%</b>
            </div>
            <div className="performance-bar"><span style={{ width: `${perfPct}%` }} /></div>
            <div className="performance-legend">
              <span><i className="dot exact-dot" /> {t('profile.exactScore')} <b>{data.exact}</b></span>
              <span><i className="dot correct-dot" /> {t('profile.correctResult')} <b>{data.correct}</b></span>
              <span><i className="dot miss-dot" /> {t('profile.wrong')} <b>{data.miss}</b></span>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

// ============ RÈGLES DU JEU ============
function RulesPage() {
  const { t } = useLanguage();
  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-book" /> {t('rules.eyebrow')}</p>
          <h1>{t('rules.title')}</h1>
          <p className="page-intro">{t('rules.sub')}</p>
        </div>
      </div>

      <div className="rules-grid">
        <div className="rule-card">
          <div className="rule-icon"><i className="fa-solid fa-pen" /></div>
          <h3>{t('rules.r1t')}</h3>
          <p>{t('rules.r1d')}</p>
        </div>

        <div className="rule-card">
          <div className="rule-icon"><i className="fa-solid fa-lock" /></div>
          <h3>{t('rules.r2t')}</h3>
          <p>{t('rules.r2d')}</p>
        </div>

        <div className="rule-card">
          <div className="rule-icon"><i className="fa-solid fa-check" /></div>
          <h3>{t('rules.r3t')}</h3>
          <p>{t('rules.r3d')}</p>
        </div>

        <div className="rule-card">
          <div className="rule-icon"><i className="fa-solid fa-bullseye" /></div>
          <h3>{t('rules.r4t')}</h3>
          <p>{t('rules.r4d')}</p>
        </div>

        <div className="rule-card">
          <div className="rule-icon"><i className="fa-solid fa-bolt" /></div>
          <h3>{t('rules.r5t')}</h3>
          <p>{t('rules.r5d')}</p>
        </div>

        <div className="rule-card">
          <div className="rule-icon"><i className="fa-solid fa-trophy" /></div>
          <h3>{t('rules.r6t')}</h3>
          <p>{t('rules.r6d')}</p>
        </div>
      </div>

      <div className="section-heading">
        <div><h2>{t('rules.exampleTitle')}</h2><span>{t('rules.exampleSub')}</span></div>
      </div>

      <div className="example-card">
        <h3>{t('rules.exMatch')}</h3>
        <p className="example-sub">{t('rules.exOdds')}</p>

        <div className="example-row"><span>{t('rules.exPredicted')}</span><b>{t('rules.exHomeWin')}</b></div>
        <div className="example-row"><span>{t('rules.exActual')}</span><b>{t('rules.exHomeWin')}</b></div>
        <div className="example-row"><span>{t('rules.exCorrect')}</span><b>+65 pts</b></div>
        <div className="example-row"><span>{t('rules.exExactBonus')}</span><b>+20 pts</b></div>
        <div className="example-row"><span>{t('rules.exJoker')}</span><b>× 2</b></div>

        <div className="example-total">
          <span>{t('rules.exTotal')}</span>
          <strong>170 pts</strong>
        </div>
      </div>
    </section>
  );
}

// ============ ADMIN ============
function AdminPage({ user }) {
  const { t, lang } = useLanguage();
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
      setBanner({ ok: true, text: t('admin.resultSaved', res.data.predictions_updated) });
      setSelected(null); setHomeGoals(''); setAwayGoals('');
      refetch();
    } catch (err) {
      setBanner({ ok: false, text: errMsg(err, t('common.error')) });
    }
  };

  const resetResult = async (match) => {
    if (!window.confirm(t('admin.confirmReset', match.home_team, match.away_team))) return;
    try {
      const res = await api.put(`/admin/matches/${match.id}/reset`);
      setBanner({ ok: true, text: `${res.data.message} · ${res.data.predictions_reset}` });
      refetch();
    } catch (err) {
      setBanner({ ok: false, text: errMsg(err, t('common.error')) });
    }
  };

  const deleteLeague = async (league) => {
    if (!window.confirm(t('admin.confirmDelete', league.name))) return;
    try {
      const res = await api.delete(`/leagues/${league.id}`);
      notify(`${res.data.message}`);
      refetchLeagues();
    } catch (err) {
      notify(errMsg(err, t('common.error')));
    }
  };

  return (
    <section className="page active">
      <div className="hero-row compact">
        <div>
          <p className="eyebrow"><i className="fa-solid fa-shield-halved" /> {t('admin.eyebrow')}</p>
          <h1>{t('admin.title')}</h1>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'matches' ? ' active' : ''}`} onClick={() => { setTab('matches'); setBanner(null); }}>{t('admin.matchResults')}</button>
        <button className={`admin-tab${tab === 'leagues' ? ' active' : ''}`} onClick={() => { setTab('leagues'); setBanner(null); }}>{t('admin.manageLeagues')}</button>
      </div>

      {banner && <div className={`admin-banner ${banner.ok ? 'ok' : 'err'}`}>{banner.text}</div>}

      {tab === 'matches' && (
        <>
          <div className="round-selector" style={{ marginBottom: 18 }}>
            <button className="round-arrow" onClick={() => setGameweek((g) => Math.max(1, g - 1))}><i className="fa-solid fa-chevron-left" /></button>
            <div><small>{t('predictions.roundLabel')}</small><strong>{String(gameweek).padStart(2, '0')}</strong></div>
            <button className="round-arrow" onClick={() => setGameweek((g) => g + 1)}><i className="fa-solid fa-chevron-right" /></button>
          </div>

          <StateBox loading={isLoading} error={isError ? error : null} onRetry={refetch} />

          {!isLoading && !isError && (
            <>
              {finished.length > 0 && (
                <>
                  <h2 style={{ fontSize: 14, marginBottom: 10 }}>{t('admin.finished', finished.length)}</h2>
                  {finished.map((m) => (
                    <div className="admin-row done" key={m.id}>
                      <div><b>{m.home_team} vs {m.away_team}</b><div style={{ color: 'var(--muted)', fontSize: 11 }}>{m.home_goals} — {m.away_goals}</div></div>
                      <button className="secondary-btn" onClick={() => resetResult(m)}><i className="fa-solid fa-rotate-left" /> {t('admin.reset')}</button>
                    </div>
                  ))}
                </>
              )}

              <h2 style={{ fontSize: 14, margin: '18px 0 10px' }}>{t('admin.upcoming', upcoming.length)}</h2>
              {upcoming.length === 0 && <div className="empty-state">{t('admin.noUpcoming')}</div>}
              {upcoming.map((m) => (
                <div key={m.id} className={`admin-row${selected?.id === m.id ? ' selected' : ''}`} onClick={() => setSelected(m)}>
                  <b>{m.home_team} vs {m.away_team}</b>
                  <span style={{ color: 'var(--muted)', fontSize: 10 }}>{new Date(m.kickoff_time).toLocaleString(LOCALE_MAP[lang])}</span>
                </div>
              ))}

              {selected && (
                <form className="admin-result-form" onSubmit={setResult}>
                  <b>{selected.home_team}</b>
                  <input type="number" min="0" max="20" value={homeGoals} onChange={(e) => setHomeGoals(e.target.value)} required />
                  <span>—</span>
                  <input type="number" min="0" max="20" value={awayGoals} onChange={(e) => setAwayGoals(e.target.value)} required />
                  <b>{selected.away_team}</b>
                  <button type="submit" className="primary-btn">{t('admin.validate')}</button>
                  <button type="button" className="secondary-btn" onClick={() => setSelected(null)}>{t('admin.cancel')}</button>
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
              <p>{league.invite_code} · {t('admin.by')} {league.creator}</p>
              <p>{t('leagues.members', league.members)} · {league.predictions}</p>
              <button className="danger-btn" onClick={() => deleteLeague(league)}>
                <i className="fa-solid fa-trash" /> {t('admin.delete')}
              </button>
            </div>
          ))}
          {(!leagues || leagues.length === 0) && <div className="empty-state">{t('admin.noLeagues')}</div>}
        </div>
      )}
    </section>
  );
}

// ============ APP SHELL ============
const TAB_DEFS = [
  { key: 'predictions', icon: 'fa-bullseye' },
  { key: 'results', icon: 'fa-flag-checkered' },
  { key: 'standings', icon: 'fa-ranking-star' },
  { key: 'leagues', icon: 'fa-users' },
  { key: 'profile', icon: 'fa-user' },
  { key: 'rules', icon: 'fa-book' },
];

function AppShell() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('predictions');
  const [league, setLeague] = useState(null); // {id, name, invite_code, ...}
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  const selectTab = (nextTab) => {
    setTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLeague = (l) => { setLeague(l); selectTab('predictions'); };

  const toggleTheme = () => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light');

  if (!user) return <LoginPage onLogin={setUser} theme={theme} onToggleTheme={toggleTheme} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); selectTab('predictions'); }}>
          <img src={logo} alt="Pronos Tunisie" />
          <span className="brand-copy">
            <strong>PRONOS <em>TUNISIE</em></strong>
            <small>{t('login.brandTag')}</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navigation principale">
          {TAB_DEFS.map((d) => (
            <button type="button" key={d.key} className={`nav-item${tab === d.key ? ' active' : ''}`} onClick={() => selectTab(d.key)} aria-current={tab === d.key ? 'page' : undefined}>
              <i className={`fa-solid ${d.icon}`} /><span>{t(`nav.${d.key}`)}</span>
            </button>
          ))}
          {user.is_admin && (
            <button type="button" className={`nav-item${tab === 'admin' ? ' active' : ''}`} onClick={() => selectTab('admin')} aria-current={tab === 'admin' ? 'page' : undefined}>
              <i className="fa-solid fa-shield-halved" /><span>{t('nav.admin')}</span>
            </button>
          )}
        </nav>

        <div className="header-controls">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="profile-mini" onClick={() => selectTab('profile')} aria-label={t('common.myProfile')} title={t('common.myProfile')}>
            <span className="avatar">{initials(user.username)}</span>
            <span className="online-dot" />
          </button>
          <button className="logout-btn" onClick={handleLogout} aria-label={t('common.logout')} title={t('common.logout')}>
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </header>

      <main>
        {league && tab !== 'leagues' && tab !== 'profile' && tab !== 'admin' && tab !== 'rules' && (
          <p style={{ color: 'var(--muted)', fontSize: 10, marginBottom: -14 }}>
            {t('activeLeague')} : <b style={{ color: 'white' }}>{league.name}</b> ·{' '}
            <button className="link-btn" onClick={() => selectTab('leagues')}>{t('change')}</button>
          </p>
        )}

        {tab === 'predictions' && <PredictionsPage league={league} user={user} />}
        {tab === 'results' && <ResultsPage league={league} />}
        {tab === 'standings' && <StandingsPage league={league} user={user} />}
        {tab === 'leagues' && <LeaguesPage user={user} onOpenLeague={openLeague} />}
        {tab === 'profile' && <ProfilePage user={user} />}
        {tab === 'rules' && <RulesPage />}
        {tab === 'admin' && user.is_admin && <AdminPage user={user} />}
      </main>

      <footer className="footer">
        <div><b>PRONOS TUNISIE</b><span>{t('footer.tagline')}</span></div>
        <span>{t('footer.copyright')}</span>
      </footer>

      <nav className={`mobile-nav${user.is_admin ? ' with-admin' : ''}`} aria-label="Navigation mobile">
        {TAB_DEFS.map((d) => (
          <button type="button" key={d.key} className={`nav-item${tab === d.key ? ' active' : ''}`} onClick={() => selectTab(d.key)} aria-current={tab === d.key ? 'page' : undefined}>
            <i className={`fa-solid ${d.icon}`} /><span>{t(`nav.${d.key}`)}</span>
          </button>
        ))}
        {user.is_admin && (
          <button type="button" className={`nav-item${tab === 'admin' ? ' active' : ''}`} onClick={() => selectTab('admin')} aria-current={tab === 'admin' ? 'page' : undefined}>
            <i className="fa-solid fa-shield-halved" /><span>{t('nav.admin')}</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}