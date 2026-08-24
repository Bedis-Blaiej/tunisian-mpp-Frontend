/**
 * i18n — three languages: French, English, Tunisian Arabic.
 * Functional/UI strings use clear standard Arabic (MSA) so they read
 * naturally to any Arabic speaker; catchy/marketing lines (login hero,
 * empty states, encouraging toasts) use Tunisian Derja on purpose.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGS = {
  fr: { label: 'Français', short: 'FR', dir: 'ltr' },
};

const translations = {
  fr: {
    common: {
      loading: 'Chargement…', retry: 'Réessayer', cancel: 'Annuler', edit: 'Modifier',
      back: '← Retour', logout: 'Se déconnecter', admin: 'Admin', myProfile: 'Mon profil',
      official: 'Officielle', private: 'Privée', save: 'Enregistrer', error: 'Une erreur est survenue',
      switchToLight: 'Passer au thème clair', switchToDark: 'Passer au thème sombre',
    },
    nav: { predictions: 'Mes pronos', results: 'Résultats', standings: 'Classements', leagues: 'Mes ligues', profile: 'Profil', rules: 'Règles', admin: 'Admin' },
    login: {
      badge: '100% tunisien',
      headline1: 'Tu crois tout savoir',
      headline2em: 'Ligue 1',
      headline2suffix: ' ?',
      sub: "Prouve-le. Pronostique le score de chaque match, cumule des points et grimpe au classement avec tes potes. Gratuit, ça prend 30 secondes.",
      h1: 'Points calculés en direct, dès le coup de sifflet final',
      h2: 'Crée ta ligue privée ou défie tout le pays',
      h3: 'Score exact = bonus, ×2 une fois par journée',
      previewLabel: 'Ton profil, après quelques journées',
      previewName: 'MedAmine92',
      previewSince: 'Membre depuis septembre',
      previewPredictions: 'Pronostics', previewCorrect: 'Corrects', previewPoints: 'Points',
      previewPerf: '64% de réussite sur les 15 derniers matchs',
      brandTag: 'Le jeu de prédictions 100% tunisien',
      or: 'ou',
      username: "Nom d'utilisateur", email: 'Email', password: 'Mot de passe',
      createAccount: 'Créer mon compte', signIn: 'Se connecter', pleaseWait: 'Patiente…',
      alreadyAccount: 'Déjà inscrit ? Se connecter', noAccount: "Pas encore de compte ? S'inscrire",
      googleCancelled: 'Connexion Google annulée',
      codePlaceholder: 'Code à 6 chiffres',
      verifying: 'Vérification…', verifyAndLogin: 'Vérifier et me connecter',
      resendCode: 'Renvoyer le code',
      codeSentTo: (email) => `Un code de vérification a été envoyé à ${email}.`,
      codeJustSent: 'Un code de vérification vient d\u2019être envoyé.',
      codeResent: 'Nouveau code envoyé.',
      couldNotSendCode: "Impossible d'envoyer le code — réessaie dans un instant.",
    },
    predictions: {
      preparingLeague: 'Préparation de ta ligue…',
      journee: (n) => `Journée ${n}`,
      heroTitle: 'À toi de jouer.',
      heroSub: 'Prédisez les scores, cumulez des points et grimpez au classement.',
      roundLabel: 'Journée',
      myScore: 'Mon score', thisRound: 'Cette journée', openPredictions: 'Pronostics ouverts',
      progress: 'Progression',
      sectionTitle: 'Les matchs à pronostiquer', sectionSub: 'Un score exact rapporte plus de points.',
      deadline: "Verrouillage : 15 min avant le coup d'envoi",
      loadingMatches: 'Chargement des matchs…',
      noMatches: 'Aucun match programmé pour cette journée.',
      saveBarNote: "Tes pronostics sont enregistrés automatiquement, modifiables jusqu'au coup d'envoi.",
      matchCount: (n) => `${n} match${n > 1 ? 's' : ''}`,
    },
    matchCard: {
      home: 'Domicile', away: 'Extérieur', yourScore: 'Ta prédiction', locked: 'Verrouillé',
      x2Active: '×2 activé', activeWord: 'activé', doubleTitle: (m) => `×2 déjà utilisé sur ${m}`, doubleHint: 'Doubler les points de ce match',
      x2Used: (m) => `×2 déjà utilisé sur ${m}`,
      saving: 'Enregistrement…', saved: '✓ Enregistré',
      won: (n) => `Tu as gagné`, wonPts: (n) => `+${n} pts`, exactTag: ' · score exact 🎯',
      missed: 'Pronostic manqué', zeroPt: '0 pt',
      correctResult: 'Issue correcte : ', exactBonus: ' · score exact : bonus surprise',
      accordingToResult: ' selon le résultat',
    },
    results: {
      eyebrow: 'Historique', title: 'Les résultats.',
      sub: 'Retrouve les scores officiels et découvre tes performances',
      subIn: (name) => ` dans ${name}`,
      all: 'Tout', mine: 'Mes pronos',
      loading: 'Chargement des résultats…',
      noResults: 'Aucun résultat pour le moment.',
      notFinished: 'Pas terminé',
      today: "Aujourd'hui", yesterday: 'Hier',
      matchesFinished: (n) => `${n} match${n > 1 ? 's' : ''} terminé${n > 1 ? 's' : ''}`,
      matchesListed: (n) => `${n} match${n > 1 ? 's' : ''}`,
    },
    standings: {
      preparingLeague: 'Préparation de ta ligue…',
      title: 'Classements.', sub: 'Compare ta progression avec les meilleurs pronostiqueurs.',
      loading: 'Chargement du classement…',
      itsYou: "C'est toi 👑", currentLeader: 'Leader actuel',
      points: 'points', rank: 'Rang', player: 'Joueur', pointsCol: 'Points', me: 'Moi',
      nobodyYet: "Personne n'a encore de points dans cette ligue.",
    },
    leagues: {
      eyebrow: 'Communauté', title: 'Mes ligues.', sub: 'Crée une ligue privée ou rejoins celle de tes amis.',
      createLeague: 'Créer une ligue', leagueNamePh: 'Nom de la ligue', create: 'Créer',
      haveCode: "Tu as un code d'invitation ?", haveCodeSub: 'Entre le code reçu pour rejoindre une ligue privée.',
      codePh: 'Ex. AB12CD', join: 'Rejoindre',
      activeLeagues: 'Mes ligues actives',
      competitions: (n) => `${n} compétition(s) à laquelle tu participes`,
      loading: 'Chargement de tes ligues…',
      noLeagues: "Aucune ligue pour l'instant — crées-en une ou rejoins celle d'un ami.",
      members: (n) => `${n} membre(s)`,
      of: 'sur',
      createdSuccess: 'Ligue créée avec succès 🎉',
      createFailed: 'Impossible de créer la ligue',
      enterCode: "Entre un code d'invitation.",
      joinedLeague: (code) => `Tu as rejoint la ligue ${code} ✅`,
      invalidCode: 'Code invalide',
      officialTag: 'Officielle',
    },
    profile: {
      eyebrow: 'Mon espace', title: 'Mon profil.', sub: 'Ton historique, tes performances et ton évolution.',
      loading: 'Chargement du profil…',
      memberSince: 'Membre depuis', leaguesLabel: 'Ligues', totalPoints: 'Total points',
      predictionsLabel: 'Pronostics', correctLabel: 'Corrects', exactScoresLabel: 'Scores exacts',
      performance: 'Performance', last: (n) => `Sur tes ${n} derniers pronostics joués`,
      exactScore: 'Score exact', correctResult: 'Issue correcte', wrong: 'Faux',
    },
    rules: {
      eyebrow: 'À lire avant de jouer', title: 'Règles du jeu.', sub: 'Comment gagner des points, en 6 idées simples.',
      r1t: '1. Pronostique un score', r1d: 'Avant chaque match, entre le score exact que tu imagines pour les deux équipes. Un pronostic par match.',
      r2t: '2. Verrouillage 15 min avant', r2d: "Tu peux modifier ton pronostic autant de fois que tu veux, jusqu'à 15 minutes avant le coup d'envoi. Ensuite, c'est figé.",
      r3t: '3. Bonne issue = points', r3d: 'Si tu devines juste le résultat (victoire domicile, nul ou victoire extérieur), tu gagnes des points. Plus le résultat est surprenant, plus il en rapporte.',
      r4t: '4. Score exact = bonus', r4d: 'Si en plus le score est pile le bon, tu reçois un bonus. Moins il y a de joueurs à avoir trouvé ce score exact, plus le bonus est gros.',
      r5t: '5. Le joker ×2', r5d: 'Une fois par journée, tu peux activer ×2 sur un match pour doubler les points qu\'il te rapporte. Un seul match à la fois.',
      r6t: '6. Un seul score, partout', r6d: 'Tes points sont les mêmes dans toutes tes ligues — la Tunisian League et celles que tu crées ou rejoins. Chaque ligue n\'est qu\'un classement différent du même score.',
      exampleTitle: 'Exemple concret', exampleSub: 'Du pronostic aux points gagnés.',
      exMatch: 'Espérance de Tunis 2 – 1 Club Africain',
      exOdds: 'Cotes du match : 1 → 65 pts · X → 72 pts · 2 → 110 pts. Tu as pronostiqué 2-1 avec le joker ×2 activé.',
      exPredicted: 'Résultat pronostiqué', exActual: 'Résultat réel', exHomeWin: 'Victoire domicile (2-1)',
      exCorrect: 'Issue correcte', exExactBonus: 'Score exact deviné (bonus de rareté)', exJoker: 'Joker ×2 activé',
      exTotal: 'Total gagné sur ce match',
    },
    admin: {
      eyebrow: 'Zone admin', title: 'Tableau de bord.',
      matchResults: 'Résultats des matchs', manageLeagues: 'Gérer les ligues',
      finished: (n) => `Terminés (${n})`, upcoming: (n) => `À venir (${n})`,
      noUpcoming: 'Aucun match à venir pour cette journée.',
      reset: 'Réinitialiser', confirmReset: (h, a) => `Réinitialiser ${h} vs ${a} ?`,
      validate: 'Valider le résultat', cancel: 'Annuler',
      resultSaved: (n) => `Résultat enregistré · ${n} pronostics mis à jour`,
      confirmDelete: (name) => `Supprimer la ligue "${name}" ? Cette action est irréversible.`,
      delete: 'Supprimer', noLeagues: 'Aucune ligue.',
      by: 'par',
      sendReminder: 'Envoyer un reminder',
      notificationSent: (n) => `Email envoyé à ${n} utilisateurs`,
    },
    footer: { tagline: 'Le terrain des pronostiqueurs tunisiens.', copyright: '© 2026 Pronos Tunisie' },
    activeLeague: 'Ligue active', change: 'changer',
  },

};

const LanguageCtx = createContext({ lang: 'fr', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'fr');

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', LANGS[lang]?.dir || 'ltr');
  }, [lang]);

  const setLang = (next) => {
    if (!LANGS[next]) return;
    localStorage.setItem('lang', next);
    setLangState(next);
  };

  const t = (path, ...args) => {
    const dict = translations[lang] || translations.fr;
    const node = path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), dict);
    if (node === undefined) return path;
    return typeof node === 'function' ? node(...args) : node;
  };

  return (
    <LanguageCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageCtx.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageCtx);
}

export function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className="lang-switcher">
      {Object.entries(LANGS).map(([code, meta]) => (
        <button
          key={code}
          className={`lang-btn${lang === code ? ' active' : ''}`}
          onClick={() => setLang(code)}
          title={meta.label}
        >
          {meta.short}
        </button>
      ))}
    </div>
  );
}