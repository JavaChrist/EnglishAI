export type PronunciationFocus = {
  id: string;
  /** Short chip label. */
  label: string;
  /** What the coach calls the sound. */
  coach: string;
  /** Same label, for learners below B2. */
  coachFr: string;
  /** How to shape the sound, shown before the learner speaks. */
  guide: string;
  /** Same guide, in simple French, for learners below B2. */
  guideFr: string;
  /** Instruction for the phrase generator. */
  instruction: string;
  /** The sentence must match this, or we use a fallback. */
  pattern: RegExp;
  fallbacks: readonly { sentence: string; translation: string }[];
};

/**
 * Sounds French speakers of English most often need. Guides stay concrete
 * (mouth, breath, voice) and never say a sound is "wrong".
 */
export const PRONUNCIATION_FOCUSES: readonly PronunciationFocus[] = [
  {
    id: "th",
    label: "TH",
    coach: "the TH sound",
    coachFr: "le son TH",
    guide:
      "Rest the tip of your tongue lightly between your teeth and let air pass. 'Think' is quiet. 'This' uses your voice.",
    guideFr:
      "Pose le bout de la langue entre les dents et laisse passer l'air. Think est sans voix. This utilise la voix.",
    instruction:
      "Include several clear TH words (think, thank, three, both, this, that). Do not rely only on the word 'the'.",
    pattern:
      /\b(think|thinks|thought|three|thank|thanks|both|mouth|something|anything|this|that|these|those|there|they|them|brother|mother)\b/i,
    fallbacks: [
      { sentence: "I think this tea is perfect.", translation: "Je pense que ce thé est parfait." },
      { sentence: "Thank you for these three books.", translation: "Merci pour ces trois livres." },
      { sentence: "They both want something sweet.", translation: "Ils veulent tous les deux quelque chose de sucré." },
    ],
  },
  {
    id: "h",
    label: "H",
    coach: "the starting H",
    coachFr: "le H du début",
    guide:
      "Start with a small puff of air, like fogging a mirror. The H in 'home' and 'happy' is heard. It is not silent.",
    guideFr:
      "Commence par un petit souffle, comme pour faire de la buée. Le H de home et de happy s'entend. Il n'est pas muet.",
    instruction:
      "Include two or three words that start with a clear H (home, happy, how, help, hope). Avoid words where H is silent.",
    pattern:
      /\b(home|house|happy|hope|help|hello|how|here|hot|hand|head|heart|have|has|had|who|whose)\b/i,
    fallbacks: [
      { sentence: "I hope you have a happy home.", translation: "J'espère que tu as une maison heureuse." },
      { sentence: "How can I help you here?", translation: "Comment puis-je t'aider ici ?" },
      { sentence: "He had a hot cup in his hand.", translation: "Il avait une tasse chaude dans la main." },
    ],
  },
  {
    id: "r",
    label: "R",
    coach: "the English R",
    coachFr: "le R anglais",
    guide:
      "Pull your tongue back a little. The tip does not touch the roof of your mouth. 'Red' starts in the middle of the mouth.",
    guideFr:
      "Ramène un peu la langue vers l'arrière. La pointe ne touche pas le palais. Red commence au milieu de la bouche.",
    instruction:
      "Include several English R sounds (red, really, right, try, friend, around). Prefer words where R is easy to hear.",
    pattern:
      /\b(red|really|right|try|friend|around|read|room|great|bring|pretty|river|very|green|brown)\b/i,
    fallbacks: [
      { sentence: "My friend brought a red umbrella.", translation: "Mon ami a apporté un parapluie rouge." },
      { sentence: "Try the green room on the right.", translation: "Essaie la pièce verte sur la droite." },
      { sentence: "The river is really pretty here.", translation: "La rivière est vraiment jolie ici." },
    ],
  },
  {
    id: "vowels",
    label: "Ship / sheep",
    coach: "short I and long EE",
    coachFr: "le I court et le EE long",
    guide:
      "For 'ship', keep the mouth small and the sound short. For 'sheep', smile a little and hold the sound longer.",
    guideFr:
      "Pour ship, garde la bouche petite et le son court. Pour sheep, esquisse un sourire et tiens le son plus longtemps.",
    instruction:
      "Contrast the short I and the long EE. Use at least one pair such as ship/sheep, bit/beat, live/leave, or sit/seat.",
    pattern:
      /\b(ship|sheep|bit|beat|live|leave|sit|seat|fill|feel|this|these|it|eat)\b/i,
    fallbacks: [
      { sentence: "The sheep are near the ship.", translation: "Les moutons sont près du bateau." },
      { sentence: "Please sit in this seat.", translation: "Assieds-toi sur ce siège, s'il te plaît." },
      { sentence: "I live here, but I leave at three.", translation: "J'habite ici, mais je pars à trois heures." },
    ],
  },
  {
    id: "endings",
    label: "Final sounds",
    coach: "the last consonant",
    coachFr: "la consonne finale",
    guide:
      "Say the last sound of the word. 'Want' ends with T. 'Need' ends with D. Do not let the word fade out.",
    guideFr:
      "Prononce le dernier son du mot. Want finit par T. Need finit par D. Ne laisse pas le mot s'éteindre.",
    instruction:
      "Use everyday words that end in a clear consonant (want, need, big, stop, next, help, and, food). The ending must be audible.",
    pattern:
      /\b(want|need|big|stop|next|help|and|food|best|work|book|cup|night|friend|good)\b/i,
    fallbacks: [
      { sentence: "I want a big cup of tea.", translation: "Je veux une grande tasse de thé." },
      { sentence: "We need to stop at the next shop.", translation: "Nous devons nous arrêter à la prochaine boutique." },
      { sentence: "This book is the best one.", translation: "Ce livre est le meilleur." },
    ],
  },
  {
    id: "ed",
    label: "-ed",
    coach: "the -ed ending",
    coachFr: "la terminaison -ed",
    guide:
      "After T or D, -ed is an extra syllable: 'wanted' sounds like wan-tid. After other sounds it is a short T or D: 'watched', 'played'.",
    guideFr:
      "Après T ou D, -ed est une syllabe en plus : wanted se dit wan-tid. Après les autres sons, c'est un T ou un D bref : watched, played.",
    instruction:
      "Use two or three regular past verbs so -ed is easy to hear (wanted, needed, watched, played, looked, called).",
    pattern: /\b(?!red\b)\w+ed\b/i,
    fallbacks: [
      { sentence: "I wanted tea and she needed coffee.", translation: "Je voulais du thé et elle avait besoin d'un café." },
      { sentence: "We watched a film and then walked home.", translation: "Nous avons regardé un film, puis nous sommes rentrés à pied." },
      { sentence: "She called me and I looked at the clock.", translation: "Elle m'a appelé et j'ai regardé l'horloge." },
    ],
  },
  {
    id: "stress",
    label: "Stress",
    coach: "word stress",
    coachFr: "l'accent du mot",
    guide:
      "One syllable is stronger and a little longer. In 'coffee' the first part is strong. In 'hotel' the second part is strong.",
    guideFr:
      "Une syllabe est plus forte et un peu plus longue. Dans coffee, c'est le début. Dans hotel, c'est la fin.",
    instruction:
      "Use two or three words with a clear stress pattern (coffee, hotel, important, beautiful, today, afternoon). Keep the sentence short.",
    pattern:
      /\b(coffee|hotel|important|beautiful|today|afternoon|about|because|people|music|picture|problem|remember|computer)\b/i,
    fallbacks: [
      { sentence: "The hotel coffee is important today.", translation: "Le café de l'hôtel est important aujourd'hui." },
      { sentence: "This picture is beautiful.", translation: "Cette photo est belle." },
      { sentence: "I remember the music from this afternoon.", translation: "Je me souviens de la musique de cet après-midi." },
    ],
  },
  {
    id: "w",
    label: "W",
    coach: "the W sound",
    coachFr: "le son W",
    guide:
      "Round your lips like a small kiss, then open them. 'Wine' is not 'vine'. 'We' starts with the lips, not the teeth.",
    guideFr:
      "Arrondis les lèvres comme pour un petit bisou, puis ouvre-les. Wine n'est pas vine. We commence avec les lèvres, pas les dents.",
    instruction:
      "Include clear W words (we, want, water, window, walk, warm, white). Do not use V words as the focus.",
    pattern:
      /\b(we|want|wanted|water|window|walk|walked|warm|white|where|when|what|with|away|always)\b/i,
    fallbacks: [
      { sentence: "We want warm water by the window.", translation: "Nous voulons de l'eau tiède près de la fenêtre." },
      { sentence: "Where do we walk when it is white outside?", translation: "Où marchons-nous quand il fait blanc dehors ?" },
      { sentence: "I always want water with lunch.", translation: "Je veux toujours de l'eau au déjeuner." },
    ],
  },
];

export function getFocus(id?: string | null): PronunciationFocus {
  const found = PRONUNCIATION_FOCUSES.find((focus) => focus.id === id);
  if (found) return found;
  const index = Math.floor(Math.random() * PRONUNCIATION_FOCUSES.length);
  return PRONUNCIATION_FOCUSES[index] ?? PRONUNCIATION_FOCUSES[0]!;
}
