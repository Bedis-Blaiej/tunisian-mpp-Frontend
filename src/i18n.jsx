/**
 * i18n — three languages: French, English, Tunisian Arabic.
 * Functional/UI strings use clear standard Arabic (MSA) so they read
 * naturally to any Arabic speaker; catchy/marketing lines (login hero,
 * empty states, encouraging toasts) use Tunisian Derja on purpose.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGS = {
  fr: { label: 'Français', short: 'FR', dir: 'ltr' },
  en: { label: 'English', short: 'EN', dir: 'ltr' },
  ar: { label: 'العربية', short: 'AR', dir: 'rtl' },
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
      home: 'Domicile', away: 'Extérieur', yourScore: 'Ton score', locked: 'Verrouillé',
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
      predictions: 'Ses pronos', noPredictions: 'Aucun pronostic sur les matchs terminés.',
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
    },
    footer: { tagline: 'Le terrain des pronostiqueurs tunisiens.', copyright: '© 2026 Pronos Tunisie' },
    activeLeague: 'Ligue active', change: 'changer',
  },

  en: {
    common: {
      loading: 'Loading…', retry: 'Retry', cancel: 'Cancel', edit: 'Edit',
      back: '← Back', logout: 'Log out', admin: 'Admin', myProfile: 'My profile',
      official: 'Official', private: 'Private', save: 'Save', error: 'Something went wrong',
      switchToLight: 'Switch to light theme', switchToDark: 'Switch to dark theme',
    },
    nav: { predictions: 'Predictions', results: 'Results', standings: 'Standings', leagues: 'My leagues', profile: 'Profile', rules: 'Rules', admin: 'Admin' },
    login: {
      badge: '100% Tunisian',
      headline1: 'Think you know it all',
      headline2em: 'Ligue 1',
      headline2suffix: '?',
      sub: 'Prove it. Predict the score of every match, rack up points, and climb the leaderboard with your friends. Free, takes 30 seconds.',
      h1: 'Points calculated live, right when the final whistle blows',
      h2: 'Create your private league or take on the whole country',
      h3: 'Exact score = bonus, ×2 joker once per matchday',
      previewLabel: 'Your profile, after a few matchdays',
      previewName: 'MedAmine92',
      previewSince: 'Member since September',
      previewPredictions: 'Predictions', previewCorrect: 'Correct', previewPoints: 'Points',
      previewPerf: '64% success rate over the last 15 matches',
      brandTag: "Tunisia's own score-prediction game",
      or: 'or',
      username: 'Username', email: 'Email', password: 'Password',
      createAccount: 'Create account', signIn: 'Sign in', pleaseWait: 'One sec…',
      alreadyAccount: 'Already have an account? Sign in', noAccount: "Don't have an account? Sign up",
      googleCancelled: 'Google sign-in cancelled',
      codePlaceholder: '6-digit code',
      verifying: 'Verifying…', verifyAndLogin: 'Verify and log in',
      resendCode: 'Resend code',
      codeSentTo: (email) => `A verification code was sent to ${email}.`,
      codeJustSent: 'A verification code was just sent.',
      codeResent: 'New code sent.',
      couldNotSendCode: "Couldn't send the code — try again in a moment.",
    },
    predictions: {
      preparingLeague: 'Setting up your league…',
      journee: (n) => `Matchday ${n}`,
      heroTitle: 'Your turn to play.',
      heroSub: 'Predict the scores, rack up points, and climb the leaderboard.',
      roundLabel: 'Matchday',
      myScore: 'My score', thisRound: 'This matchday', openPredictions: 'Open predictions',
      progress: 'Progress',
      sectionTitle: 'Matches to predict', sectionSub: 'An exact score earns you more points.',
      deadline: 'Locks 15 min before kickoff',
      loadingMatches: 'Loading matches…',
      noMatches: 'No matches scheduled for this matchday.',
      saveBarNote: 'Your predictions save automatically and can be edited until kickoff.',
      matchCount: (n) => `${n} match${n > 1 ? 'es' : ''}`,
    },
    matchCard: {
      home: 'Home', away: 'Away', yourScore: 'Your score', locked: 'Locked',
      x2Active: '×2 active', activeWord: 'active', doubleTitle: (m) => `×2 already used on ${m}`, doubleHint: 'Double the points for this match',
      x2Used: (m) => `×2 already used on ${m}`,
      saving: 'Saving…', saved: '✓ Saved',
      won: () => `You earned`, wonPts: (n) => `+${n} pts`, exactTag: ' · exact score 🎯',
      missed: 'Missed prediction', zeroPt: '0 pt',
      correctResult: 'Correct outcome: ', exactBonus: ' · exact score: surprise bonus',
      accordingToResult: ' depending on the result',
    },
    results: {
      eyebrow: 'History', title: 'Results.',
      sub: 'Check the official scores and see how you did',
      subIn: (name) => ` in ${name}`,
      all: 'All', mine: 'My predictions',
      loading: 'Loading results…',
      noResults: 'No results yet.',
      notFinished: 'Not finished',
      today: 'Today', yesterday: 'Yesterday',
      matchesFinished: (n) => `${n} match${n > 1 ? 'es' : ''} finished`,
      matchesListed: (n) => `${n} match${n > 1 ? 'es' : ''}`,
    },
    standings: {
      preparingLeague: 'Setting up your league…',
      title: 'Standings.', sub: 'Compare your progress with the best predictors.',
      loading: 'Loading standings…',
      itsYou: "That's you 👑", currentLeader: 'Current leader',
      points: 'points', rank: 'Rank', player: 'Player', pointsCol: 'Points', me: 'Me',
      nobodyYet: 'Nobody has scored any points in this league yet.',
      predictions: 'Their predictions', noPredictions: 'No predictions on finished matches.',
    },
    leagues: {
      eyebrow: 'Community', title: 'My leagues.', sub: "Create a private league or join a friend's.",
      createLeague: 'Create a league', leagueNamePh: 'League name', create: 'Create',
      haveCode: 'Got an invite code?', haveCodeSub: 'Enter the code you received to join a private league.',
      codePh: 'E.g. AB12CD', join: 'Join',
      activeLeagues: 'My active leagues',
      competitions: (n) => `${n} competition(s) you're part of`,
      loading: 'Loading your leagues…',
      noLeagues: "No leagues yet — create one or join a friend's.",
      members: (n) => `${n} member(s)`,
      of: 'of',
      createdSuccess: 'League created successfully 🎉',
      createFailed: "Couldn't create the league",
      enterCode: 'Enter an invite code.',
      joinedLeague: (code) => `You joined league ${code} ✅`,
      invalidCode: 'Invalid code',
      officialTag: 'Official',
    },
    profile: {
      eyebrow: 'My space', title: 'My profile.', sub: 'Your history, performance, and progress.',
      loading: 'Loading profile…',
      memberSince: 'Member since', leaguesLabel: 'Leagues', totalPoints: 'Total points',
      predictionsLabel: 'Predictions', correctLabel: 'Correct', exactScoresLabel: 'Exact scores',
      performance: 'Performance', last: (n) => `Over your last ${n} predictions played`,
      exactScore: 'Exact score', correctResult: 'Correct outcome', wrong: 'Wrong',
    },
    rules: {
      eyebrow: 'Read before you play', title: 'Game rules.', sub: 'How to earn points, in 6 simple ideas.',
      r1t: '1. Predict a score', r1d: 'Before each match, enter the exact score you expect for both teams. One prediction per match.',
      r2t: '2. Locks 15 min before kickoff', r2d: 'You can change your prediction as many times as you like, up until 15 minutes before kickoff. After that, it\'s locked in.',
      r3t: '3. Right outcome = points', r3d: 'Guess the correct outcome (home win, draw, or away win) and you earn points. The more surprising the result, the more it pays.',
      r4t: '4. Exact score = bonus', r4d: 'Nail the exact score too and you get a bonus on top. The fewer players who guessed that exact score, the bigger the bonus.',
      r5t: '5. The ×2 joker', r5d: 'Once per matchday, you can activate ×2 on one match to double the points it earns you. Only one match at a time.',
      r6t: '6. One score, everywhere', r6d: "Your points are the same across every league you're in — the Tunisian League and any you create or join. Each league is just a different leaderboard over the same score.",
      exampleTitle: 'Worked example', exampleSub: 'From prediction to points earned.',
      exMatch: 'Espérance de Tunis 2 – 1 Club Africain',
      exOdds: 'Match odds: 1 → 65 pts · X → 72 pts · 2 → 110 pts. You predicted 2-1 with the ×2 joker active.',
      exPredicted: 'Predicted outcome', exActual: 'Actual outcome', exHomeWin: 'Home win (2-1)',
      exCorrect: 'Correct outcome', exExactBonus: 'Exact score guessed (rarity bonus)', exJoker: '×2 joker active',
      exTotal: 'Total earned on this match',
    },
    admin: {
      eyebrow: 'Admin zone', title: 'Dashboard.',
      matchResults: 'Match results', manageLeagues: 'Manage leagues',
      finished: (n) => `Finished (${n})`, upcoming: (n) => `Upcoming (${n})`,
      noUpcoming: 'No upcoming matches for this matchday.',
      reset: 'Reset', confirmReset: (h, a) => `Reset ${h} vs ${a}?`,
      validate: 'Confirm result', cancel: 'Cancel',
      resultSaved: (n) => `Result saved · ${n} predictions updated`,
      confirmDelete: (name) => `Delete league "${name}"? This can't be undone.`,
      delete: 'Delete', noLeagues: 'No leagues.',
      by: 'by',
    },
    footer: { tagline: 'Where Tunisian predictors compete.', copyright: '© 2026 Pronos Tunisie' },
    activeLeague: 'Active league', change: 'change',
  },

  ar: {
    common: {
      loading: 'يتحمّل…', retry: 'عاود المحاولة', cancel: 'إلغاء', edit: 'تعديل',
      back: '← رجوع', logout: 'خروج', admin: 'أدمين', myProfile: 'البروفايل متاعي',
      official: 'رسمية', private: 'خاصة', save: 'حفظ', error: 'صار خطأ',
      switchToLight: 'بدّل للثيم الفاتح', switchToDark: 'بدّل للثيم الغامق',
    },
    nav: { predictions: 'التوقعات', results: 'النتائج', standings: 'الترتيب', leagues: 'ليڨاتي', profile: 'البروفايل', rules: 'القوانين', admin: 'أدمين' },
    login: {
      badge: '١٠٠٪ تونسي',
      headline1: 'تحسب تعرف الكل',
      headline2em: 'ليڨ 1',
      headline2suffix: '؟',
      sub: 'ثبّت روحك. حط تخمينتك في نتيجة كل ماتش، لملّم النقاط، واطلع في الترتيب مع صحابك. مجانية، وتاخذ ٣٠ ثانية.',
      h1: 'النقاط تتحسب دغري، عالفور كي يخلص الماتش',
      h2: 'اعمل ليڨ خاصة بيك ولا تحدى تونس الكل',
      h3: 'النتيجة بالظبط = بونيس، وجوكار ×٢ مرة وحدة في الجولة',
      previewLabel: 'البروفايل متاعك، بعد شوية جولات',
      previewName: 'MedAmine92',
      previewSince: 'عضو من شهر سبتمبر',
      previewPredictions: 'توقعات', previewCorrect: 'صحيحة', previewPoints: 'نقاط',
      previewPerf: '٦٤٪ نجاح في آخر ١٥ ماتش',
      brandTag: 'لعبة التوقعات ١٠٠٪ تونسية',
      or: 'ولا',
      username: 'اسم المستخدم', email: 'البريد الإلكتروني', password: 'كلمة السر',
      createAccount: 'أعمل حساب', signIn: 'دخول', pleaseWait: 'ثوني…',
      alreadyAccount: 'عندك حساب؟ دخول', noAccount: 'ماعندكش حساب؟ سجّل',
      googleCancelled: 'تلغى الدخول بجوجل',
      codePlaceholder: 'الكود متاع ٦ أرقام',
      verifying: 'يتثبّت…', verifyAndLogin: 'تثبيت والدخول',
      resendCode: 'ابعثلي الكود من جديد',
      codeSentTo: (email) => `تبعث كود تثبيت لـ ${email}.`,
      codeJustSent: 'توّا تبعث كود تثبيت.',
      codeResent: 'تبعث كود جديد.',
      couldNotSendCode: 'ما نجمناش نبعثو الكود — عاود شوية أخرى.',
    },
    predictions: {
      preparingLeague: 'نحضرو الليڨ متاعك…',
      journee: (n) => `الجولة ${n}`,
      heroTitle: 'توّا دورك تلعب.',
      heroSub: 'خمّن النتائج، لملّم النقاط، واطلع في الترتيب.',
      roundLabel: 'الجولة',
      myScore: 'نقاطي', thisRound: 'هاذي الجولة', openPredictions: 'توقعات باقية',
      progress: 'التقدّم',
      sectionTitle: 'الماتشات لي لازم تخمّن فيها', sectionSub: 'النتيجة بالظبط تعطيك نقاط أكثر.',
      deadline: 'الغلق: ١٥ دقيقة قبل بداية الماتش',
      loadingMatches: 'يتحمّلو الماتشات…',
      noMatches: 'ما فما حتى ماتش في هاذي الجولة.',
      saveBarNote: 'توقعاتك تتسجل وحدها، تنجم تبدلها لحد بداية الماتش.',
      matchCount: (n) => `${n} ماتش`,
    },
    matchCard: {
      home: 'مضيف', away: 'زائر', yourScore: 'النتيجة متاعك', locked: 'مسكّر',
      x2Active: '×٢ مفعّل', activeWord: 'مفعّل', doubleTitle: (m) => `×٢ متسنّي على ${m}`, doubleHint: 'ضاعف نقاط هاذا الماتش',
      x2Used: (m) => `×٢ متسنّي على ${m}`,
      saving: 'يتسجّل…', saved: '✓ تسجّل',
      won: () => `ربحت`, wonPts: (n) => `+${n} نقطة`, exactTag: ' · نتيجة بالظبط 🎯',
      missed: 'توقّع خايب', zeroPt: '٠ نقطة',
      correctResult: 'نتيجة صحيحة: ', exactBonus: ' · نتيجة بالظبط: بونيس مفاجأة',
      accordingToResult: ' حسب النتيجة',
    },
    results: {
      eyebrow: 'التاريخ', title: 'النتائج.',
      sub: 'شوف النتائج الرسمية واكتشف كيفاش لعبت',
      subIn: (name) => ` في ${name}`,
      all: 'الكل', mine: 'توقعاتي',
      loading: 'تتحمّل النتائج…',
      noResults: 'ما فما حتى نتيجة لتوّة.',
      notFinished: 'ما خلصش',
      today: 'اليوم', yesterday: 'البارح',
      matchesFinished: (n) => `${n} ماتش خلص`,
      matchesListed: (n) => `${n} ماتش`,
    },
    standings: {
      preparingLeague: 'نحضرو الليڨ متاعك…',
      title: 'الترتيب.', sub: 'قارن تقدّمك مع أحسن المتوقعين.',
      loading: 'يتحمّل الترتيب…',
      itsYou: 'هذا إنتي 👑', currentLeader: 'الأول توّا',
      points: 'نقطة', rank: 'الرتبة', player: 'اللاعب', pointsCol: 'النقاط', me: 'أنا',
      nobodyYet: 'حتى حد ما عندو نقاط في هاذي الليڨ لتوّة.',
      predictions: 'نتوقعاتو', noPredictions: 'ما فما نتوقعات على الماتشات الخلصت.',
    },
    leagues: {
      eyebrow: 'الجماعة', title: 'ليڨاتي.', sub: 'اعمل ليڨ خاصة بيك ولا انضم لواحدة متاع صاحبك.',
      createLeague: 'اعمل ليڨ', leagueNamePh: 'اسم الليڨ', create: 'اعمل',
      haveCode: 'عندك كود دعوة؟', haveCodeSub: 'دخّل الكود لي وصلك باش تنضم لليڨ خاصة.',
      codePh: 'مثال: AB12CD', join: 'انضم',
      activeLeagues: 'ليڨاتي الفعّالة',
      competitions: (n) => `${n} مسابقة موجود فيها`,
      loading: 'تتحمّل ليڨاتك…',
      noLeagues: 'ما فما حتى ليڨ لتوّة — اعمل وحدة ولا انضم لواحدة متاع صاحبك.',
      members: (n) => `${n} عضو`,
      of: 'من',
      createdSuccess: 'الليڨ تعملت بنجاح 🎉',
      createFailed: 'ما نجمناش نعملو الليڨ',
      enterCode: 'دخّل كود دعوة.',
      joinedLeague: (code) => `انضمّيت لليڨ ${code} ✅`,
      invalidCode: 'كود غالط',
      officialTag: 'رسمية',
    },
    profile: {
      eyebrow: 'الفضاء متاعي', title: 'البروفايل متاعي.', sub: 'التاريخ متاعك، أداءك، وتطورك.',
      loading: 'يتحمّل البروفايل…',
      memberSince: 'عضو من', leaguesLabel: 'ليڨات', totalPoints: 'مجموع النقاط',
      predictionsLabel: 'توقعات', correctLabel: 'صحيحة', exactScoresLabel: 'نتائج بالظبط',
      performance: 'الأداء', last: (n) => `في آخر ${n} توقع لعبتهم`,
      exactScore: 'نتيجة بالظبط', correctResult: 'نتيجة صحيحة', wrong: 'خايب',
    },
    rules: {
      eyebrow: 'اقرا قبل ما تلعب', title: 'قوانين اللعبة.', sub: 'كيفاش تربح نقاط، في ٦ أفكار بسيطة.',
      r1t: '١. خمّن نتيجة', r1d: 'قبل كل ماتش، دخّل النتيجة لي تتصورها للفريقين. توقّع واحد لكل ماتش.',
      r2t: '٢. الغلق ١٥ دقيقة قبل', r2d: 'تنجم تبدل توقعك قد ما تحب، لحد ١٥ دقيقة قبل بداية الماتش. من بعد، يتسكّر.',
      r3t: '٣. نتيجة صحيحة = نقاط', r3d: 'إذا خمّنت صحيح (فوز المضيف، تعادل، ولا فوز الزائر) تربح نقاط. كل ما النتيجة تكون مفاجئة كل ما تربح أكثر.',
      r4t: '٤. نتيجة بالظبط = بونيس', r4d: 'إذا زدت خمّنت النتيجة بالظبط، تاخذ بونيس زيادة. كل ما عدد اللي خمّنوها قليل، كل ما البونيس يكبر.',
      r5t: '٥. جوكار ×٢', r5d: 'مرة وحدة في الجولة، تنجم تفعّل ×٢ على ماتش باش تضاعف النقاط متاعو. ماتش واحد في كل مرة.',
      r6t: '٦. نقاط وحدة، في كل مكان', r6d: 'نقاطك كيف كيف في كل الليڨات متاعك — Tunisian League وأي ليڨ تعملها ولا تنضم ليها. كل ليڨ غير ترتيب مختلف على نفس النقاط.',
      exampleTitle: 'مثال واقعي', exampleSub: 'من التوقع للنقاط لي تربحها.',
      exMatch: 'الترجي الرياضي التونسي 2 – 1 النادي الإفريقي',
      exOdds: 'كوتة الماتش: 1 ← ٦٥ نقطة · X ← ٧٢ نقطة · 2 ← ١١٠ نقطة. خمّنت 2-1 مع جوكار ×٢ مفعّل.',
      exPredicted: 'النتيجة لي خمّنتها', exActual: 'النتيجة الحقيقية', exHomeWin: 'فوز المضيف (2-1)',
      exCorrect: 'نتيجة صحيحة', exExactBonus: 'خمّنت النتيجة بالظبط (بونيس الندرة)', exJoker: 'جوكار ×٢ مفعّل',
      exTotal: 'المجموع لي ربحتو في هاذا الماتش',
    },
    admin: {
      eyebrow: 'منطقة الأدمين', title: 'لوحة التحكم.',
      matchResults: 'نتائج الماتشات', manageLeagues: 'تسيير الليڨات',
      finished: (n) => `خلصو (${n})`, upcoming: (n) => `جايين (${n})`,
      noUpcoming: 'ما فما حتى ماتش جاي في هاذي الجولة.',
      reset: 'رجّع من جديد', confirmReset: (h, a) => `ترجّع ${h} ضد ${a}؟`,
      validate: 'أكّد النتيجة', cancel: 'إلغاء',
      resultSaved: (n) => `النتيجة تسجّلت · ${n} توقع تحدّث`,
      confirmDelete: (name) => `تحذف الليڨ "${name}"؟ هاذا ما يترجّعش.`,
      delete: 'حذف', noLeagues: 'ما فما حتى ليڨ.',
      by: 'من',
    },
    footer: { tagline: 'أرض المتوقعين التوانسة.', copyright: '© 2026 Pronos Tunisie' },
    activeLeague: 'الليڨ الفعّالة', change: 'بدّل',
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