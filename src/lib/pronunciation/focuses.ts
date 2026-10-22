export type PronunciationFocus = {
  id: string;
  /** Short chip label. */
  label: string;
  /** What the coach calls the sound. */
  coach: string;
  /** How to shape the sound, shown before the learner speaks. */
  guide: string;
  /** Instruction for the phrase generator. */
  instruction: string;
  /** The sentence must match this, or we use a fallback. */
  pattern: RegExp;
  fallbacks: readonly string[];
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
    guide:
      "Rest the tip of your tongue lightly between your teeth and let air pass. 'Think' is quiet. 'This' uses your voice.",
    instruction:
      "Include several clear TH words (think, thank, three, both, this, that). Do not rely only on the word 'the'.",
    pattern:
      /\b(think|thinks|thought|three|thank|thanks|both|mouth|something|anything|this|that|these|those|there|they|them|brother|mother)\b/i,
    fallbacks: [
      "I think this tea is perfect.",
      "Thank you for these three books.",
      "They both want something sweet.",
    ],
  },
  {
    id: "h",
    label: "H",
    coach: "the starting H",
    guide:
      "Start with a small puff of air, like fogging a mirror. The H in 'home' and 'happy' is heard. It is not silent.",
    instruction:
      "Include two or three words that start with a clear H (home, happy, how, help, hope). Avoid words where H is silent.",
    pattern:
      /\b(home|house|happy|hope|help|hello|how|here|hot|hand|head|heart|have|has|had|who|whose)\b/i,
    fallbacks: [
      "I hope you have a happy home.",
      "How can I help you here?",
      "He had a hot cup in his hand.",
    ],
  },
  {
    id: "r",
    label: "R",
    coach: "the English R",
    guide:
      "Pull your tongue back a little. The tip does not touch the roof of your mouth. 'Red' starts in the middle of the mouth.",
    instruction:
      "Include several English R sounds (red, really, right, try, friend, around). Prefer words where R is easy to hear.",
    pattern:
      /\b(red|really|right|try|friend|around|read|room|great|bring|pretty|river|very|green|brown)\b/i,
    fallbacks: [
      "My friend brought a red umbrella.",
      "Try the green room on the right.",
      "The river is really pretty here.",
    ],
  },
  {
    id: "vowels",
    label: "Ship / sheep",
    coach: "short I and long EE",
    guide:
      "For 'ship', keep the mouth small and the sound short. For 'sheep', smile a little and hold the sound longer.",
    instruction:
      "Contrast the short I and the long EE. Use at least one pair such as ship/sheep, bit/beat, live/leave, or sit/seat.",
    pattern:
      /\b(ship|sheep|bit|beat|live|leave|sit|seat|fill|feel|this|these|it|eat)\b/i,
    fallbacks: [
      "The sheep are near the ship.",
      "Please sit in this seat.",
      "I live here, but I leave at three.",
    ],
  },
  {
    id: "endings",
    label: "Final sounds",
    coach: "the last consonant",
    guide:
      "Say the last sound of the word. 'Want' ends with T. 'Need' ends with D. Do not let the word fade out.",
    instruction:
      "Use everyday words that end in a clear consonant (want, need, big, stop, next, help, and, food). The ending must be audible.",
    pattern:
      /\b(want|need|big|stop|next|help|and|food|best|work|book|cup|night|friend|good)\b/i,
    fallbacks: [
      "I want a big cup of tea.",
      "We need to stop at the next shop.",
      "This book is the best one.",
    ],
  },
  {
    id: "ed",
    label: "-ed",
    coach: "the -ed ending",
    guide:
      "After T or D, -ed is an extra syllable: 'wanted' sounds like wan-tid. After other sounds it is a short T or D: 'watched', 'played'.",
    instruction:
      "Use two or three regular past verbs so -ed is easy to hear (wanted, needed, watched, played, looked, called).",
    pattern: /\b(?!red\b)\w+ed\b/i,
    fallbacks: [
      "I wanted tea and she needed coffee.",
      "We watched a film and then walked home.",
      "She called me and I looked at the clock.",
    ],
  },
  {
    id: "stress",
    label: "Stress",
    coach: "word stress",
    guide:
      "One syllable is stronger and a little longer. In 'coffee' the first part is strong. In 'hotel' the second part is strong.",
    instruction:
      "Use two or three words with a clear stress pattern (coffee, hotel, important, beautiful, today, afternoon). Keep the sentence short.",
    pattern:
      /\b(coffee|hotel|important|beautiful|today|afternoon|about|because|people|music|picture|problem|remember|computer)\b/i,
    fallbacks: [
      "The hotel coffee is important today.",
      "This picture is beautiful.",
      "I remember the music from this afternoon.",
    ],
  },
  {
    id: "w",
    label: "W",
    coach: "the W sound",
    guide:
      "Round your lips like a small kiss, then open them. 'Wine' is not 'vine'. 'We' starts with the lips, not the teeth.",
    instruction:
      "Include clear W words (we, want, water, window, walk, warm, white). Do not use V words as the focus.",
    pattern:
      /\b(we|want|wanted|water|window|walk|walked|warm|white|where|when|what|with|away|always)\b/i,
    fallbacks: [
      "We want warm water by the window.",
      "Where do we walk when it is white outside?",
      "I always want water with lunch.",
    ],
  },
];

export function getFocus(id?: string | null): PronunciationFocus {
  const found = PRONUNCIATION_FOCUSES.find((focus) => focus.id === id);
  if (found) return found;
  const index = Math.floor(Math.random() * PRONUNCIATION_FOCUSES.length);
  return PRONUNCIATION_FOCUSES[index] ?? PRONUNCIATION_FOCUSES[0]!;
}
