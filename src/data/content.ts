/**
 * All lesson content for MISSION 01 · NEW SCHOOL GALAXY.
 *
 * Every item here is taken from the printed lesson pack:
 *   - "План урока — Galaxy Run (для учителя)"  (stages, CCQs, answer keys)
 *   - "Воркшиты для учеников — Galaxy Run"     (worksheets 1-6)
 *   - "Настольная игра Galaxy Run"             (board, WORD/METEOR/MIRA/STAR decks)
 *   - "flashcards (вводим лексику)"            (the 10 illustrations in /public/art)
 *
 * Keep this file as the single source of truth: the stages only render it.
 */

export type WordId =
  | 'chameleon'
  | 'galaxy'
  | 'dream'
  | 'wise'
  | 'owl'
  | 'planet'
  | 'spaceship'
  | 'adventure'
  | 'travel'
  | 'make_friends';

export interface Word {
  id: WordId;
  /** How the word is shown on the flashcard. */
  word: string;
  /** Syllables; the stressed one is marked with `stress`. Board note: cha·me·le·on. */
  syllables: string[];
  stress: number;
  /** Worksheet 1A definition. */
  definition: string;
  /** Yes/no Concept Checking Question from the teacher's plan. */
  ccq: { q: string; answer: boolean; because: string };
  /** WORD card taboo words from the board game deck. */
  taboo: [string, string];
  /** A model sentence using the word (from the story / worksheet 1B). */
  example: string;
  image: string;
}

export const WORDS: Word[] = [
  {
    id: 'chameleon',
    word: 'chameleon',
    syllables: ['cha', 'me', 'le', 'on'],
    stress: 1,
    definition: 'an animal that can change its colour',
    ccq: { q: 'Is it a bird?', answer: false, because: 'No — it is a lizard.' },
    taboo: ['colour', 'animal'],
    example: 'Richie is a chameleon. He can change his colour.',
    image: 'chameleon',
  },
  {
    id: 'galaxy',
    word: 'galaxy',
    syllables: ['ga', 'la', 'xy'],
    stress: 0,
    definition: 'a very big group of stars in space',
    ccq: { q: 'Is it small?', answer: false, because: 'No — a galaxy is huge.' },
    taboo: ['space', 'stars'],
    example: 'He lives in a faraway galaxy.',
    image: 'galaxy',
  },
  {
    id: 'dream',
    word: 'dream',
    syllables: ['dream'],
    stress: 0,
    definition: 'something you really want in the future',
    ccq: { q: 'Is it a hope?', answer: true, because: 'Yes — a dream is a big hope.' },
    taboo: ['sleep', 'want'],
    example: 'Richie has a big dream: he wants to speak English.',
    image: 'dream',
  },
  {
    id: 'wise',
    word: 'wise',
    syllables: ['wise'],
    stress: 0,
    definition: 'very clever, with a lot of experience',
    ccq: { q: 'Is a wise person smart?', answer: true, because: 'Yes — wise means very clever.' },
    taboo: ['clever', 'old'],
    example: 'Mira is a wise old owl.',
    image: 'wise',
  },
  {
    id: 'owl',
    word: 'owl',
    syllables: ['owl'],
    stress: 0,
    definition: 'a big bird that flies at night',
    ccq: { q: 'Does it fly at night?', answer: true, because: 'Yes — owls fly at night.' },
    taboo: ['bird', 'night'],
    example: 'A wise old owl comes to him. Her name is Mira.',
    image: 'owl',
  },
  {
    id: 'planet',
    word: 'planet',
    syllables: ['pla', 'net'],
    stress: 0,
    definition: 'a big round object that goes around a star',
    ccq: { q: 'Is it in space?', answer: true, because: 'Yes — planets are in space.' },
    taboo: ['Earth', 'round'],
    example: 'On every planet he learns new words.',
    image: 'planet',
  },
  {
    id: 'spaceship',
    word: 'spaceship',
    syllables: ['space', 'ship'],
    stress: 0,
    definition: 'a machine that flies to other planets',
    ccq: { q: 'Do people fly in it?', answer: true, because: 'Yes — people fly in a spaceship.' },
    taboo: ['fly', 'rocket'],
    example: 'Richie gets on a bright and colourful spaceship.',
    image: 'spaceship',
  },
  {
    id: 'adventure',
    word: 'adventure',
    syllables: ['ad', 'ven', 'ture'],
    stress: 1,
    definition: 'an exciting and unusual experience',
    ccq: { q: 'Is it boring?', answer: false, because: 'No — an adventure is exciting!' },
    taboo: ['exciting', 'journey'],
    example: 'Amazing adventures wait for him!',
    image: 'adventure',
  },
  {
    id: 'travel',
    word: 'to travel',
    syllables: ['tra', 'vel'],
    stress: 0,
    definition: 'to go from one place to another place',
    ccq: { q: 'Do you stay at home?', answer: false, because: 'No — you go to new places.' },
    taboo: ['go', 'country'],
    example: 'He wants to travel and see new places.',
    image: 'travel',
  },
  {
    id: 'make_friends',
    word: 'to make friends',
    syllables: ['make', 'friends'],
    stress: 0,
    definition: 'to meet people and become close to them',
    ccq: { q: 'Do you do it alone?', answer: false, because: 'No — you need other people.' },
    taboo: ['people', 'new'],
    example: 'Richie also wants to make new friends.',
    image: 'make_friends',
  },
];

export const wordById = (id: WordId) => WORDS.find((w) => w.id === id)!;

/* ------------------------------------------------------------------ *
 * WORKSHEET 1B · gap fill
 * ------------------------------------------------------------------ */

export interface GapSentence {
  /** `_` marks a gap. */
  parts: string[];
  answers: WordId[];
  /** What the pilot actually types / picks for each gap. */
  surface: string[];
}

export const GAP_FILL: GapSentence[] = [
  { parts: ['Richie is a ', ' . He can change his colour.'], answers: ['chameleon'], surface: ['chameleon'] },
  { parts: ['He lives in a faraway ', ' .'], answers: ['galaxy'], surface: ['galaxy'] },
  { parts: ['Richie has a big ', ' : he wants to speak English.'], answers: ['dream'], surface: ['dream'] },
  { parts: ['Mira is a ', ' old ', ' .'], answers: ['wise', 'owl'], surface: ['wise', 'owl'] },
  { parts: ['Richie gets on a bright and colourful ', ' .'], answers: ['spaceship'], surface: ['spaceship'] },
  { parts: ['He wants to ', ' and see new places.'], answers: ['travel'], surface: ['travel'] },
  { parts: ['On every ', ' he learns new words.'], answers: ['planet'], surface: ['planet'] },
  { parts: ['Amazing ', ' wait for him!'], answers: ['adventure'], surface: ['adventures'] },
];

/* ------------------------------------------------------------------ *
 * THE STORY
 * ------------------------------------------------------------------ */

/** Worksheet 2: six sentences, six drawing boxes. */
export const STORY_SENTENCES = [
  'Richie is a chameleon. He lives in a faraway galaxy.',
  'He has a dream: he wants to learn English, travel and make new friends.',
  'One day, Richie is on his favourite rock.',
  'A wise old owl comes to him. Her name is Mira.',
  'Mira says: "Go to the New School Galaxy. Every time you visit a planet, you learn new words."',
  'Richie is happy. He gets on a bright and colourful spaceship. Amazing adventures wait for him!',
];

/** Key image for each sentence, used on the "check your memory" screen. */
export const STORY_IMAGES = [
  'chameleon',
  'dream',
  'planet',
  'owl',
  'galaxy',
  'spaceship',
] as const;

/** The full text exactly as it is printed on the wall (worksheet page 8). */
export const STORY_FULL = [
  'Richie is a chameleon. He lives in a faraway galaxy. He is not an ordinary chameleon. He has a dream! Richie wants to learn English. He wants to travel. He wants to make new friends.',
  'One day, Richie is on his favourite rock. A wise old owl comes to him. Her name is Mira. She knows about Richie’s dream. She says, “Go to the New School Galaxy. You can learn English there!”',
  'Mira says, “Every time you visit a planet, you learn new words. One day, you will be very good at English!”',
  'Richie is happy. He gets on a spaceship. It is bright and colourful. Amazing adventures wait for him!',
  'Do you want to join Richie? Let’s learn English together! You are already on your way. Let’s keep going!',
];

/* ------------------------------------------------------------------ *
 * WORKSHEET 3A · TRUE / FALSE
 * ------------------------------------------------------------------ */

export interface TFItem {
  text: string;
  answer: boolean;
  /** Shown when the statement is false. */
  correction?: string;
}

export const TRUE_FALSE: TFItem[] = [
  { text: 'Richie lives in a faraway galaxy.', answer: true },
  { text: 'Richie is a dog.', answer: false, correction: 'He is a chameleon, not a dog.' },
  { text: 'Richie wants to learn English.', answer: true },
  { text: 'Richie wants to travel and make friends.', answer: true },
  { text: 'Mira is a young owl.', answer: false, correction: 'She is a wise old owl.' },
  { text: 'Mira tells Richie to go to the New School Galaxy.', answer: true },
  { text: 'Richie is sad.', answer: false, correction: 'He is happy.' },
  { text: 'The spaceship is bright and colourful.', answer: true },
  { text: 'The author asks the reader to join Richie.', answer: true },
  { text: 'The text says the reader should stop learning.', answer: false, correction: 'The text says: keep going.' },
];

/* ------------------------------------------------------------------ *
 * METEOR CARDS · one mistake in every sentence
 * ------------------------------------------------------------------ */

export interface MeteorCard {
  id: string;
  /** The sentence split into tappable tokens. */
  tokens: string[];
  /** Index range of the wrong token(s), inclusive. */
  wrong: [number, number];
  /** What it should say. */
  fix: string;
  /** Three choices shown after the pilot finds the mistake; `fix` is added automatically. */
  distractors: [string, string];
  /** The grammar rule behind it — the teacher writes these on the board in red. */
  rule: string;
}

export const METEOR_CARDS: MeteorCard[] = [
  {
    id: 'm1',
    tokens: ['Richie', 'live', 'in', 'a', 'faraway', 'galaxy.'],
    wrong: [1, 1],
    fix: 'lives',
    distractors: ['living', 'is live'],
    rule: 'he / she / it + verb + -s',
  },
  {
    id: 'm2',
    tokens: ['Richie', 'are', 'a', 'chameleon.'],
    wrong: [1, 1],
    fix: 'is',
    distractors: ['am', 'be'],
    rule: 'he / she / it + is',
  },
  {
    id: 'm3',
    tokens: ['Richie', 'want', 'to', 'learn', 'English.'],
    wrong: [1, 1],
    fix: 'wants',
    distractors: ['wanting', 'is want'],
    rule: 'he / she / it + verb + -s',
  },
  {
    id: 'm4',
    tokens: ['Mira', 'is', 'a', 'young', 'eagle.'],
    wrong: [3, 4],
    fix: 'wise old owl.',
    distractors: ['young owl.', 'wise old eagle.'],
    rule: 'read the text carefully',
  },
  {
    id: 'm5',
    tokens: ['Richie', 'is', 'sad', 'at', 'the', 'end.'],
    wrong: [2, 2],
    fix: 'happy',
    distractors: ['sadly', 'a sad'],
    rule: 'read the text carefully',
  },
  {
    id: 'm6',
    tokens: ['The', 'spaceship', 'are', 'bright.'],
    wrong: [2, 2],
    fix: 'is',
    distractors: ['am', 'were'],
    rule: 'one thing + is',
  },
  {
    id: 'm7',
    tokens: ['He', 'wants', 'to', 'make', 'new', 'friend.'],
    wrong: [5, 5],
    fix: 'friends.',
    distractors: ['friendes.', 'a friends.'],
    rule: 'more than one + -s',
  },
  {
    id: 'm8',
    tokens: ['Mira', 'say,', '“Go', 'to', 'the', 'New', 'School', 'Galaxy.”'],
    wrong: [1, 1],
    fix: 'says,',
    distractors: ['saying,', 'is say,'],
    rule: 'he / she / it + verb + -s',
  },
  {
    id: 'm9',
    tokens: ['Richie', 'gets', 'on', 'a', 'spaceship', 'at', 'Monday.'],
    wrong: [5, 5],
    fix: 'on',
    distractors: ['in', 'to'],
    rule: 'on + day of the week',
  },
  {
    id: 'm10',
    tokens: ['He', 'wants', 'learn', 'English.'],
    wrong: [2, 2],
    fix: 'to learn',
    distractors: ['learning', 'learns'],
    rule: 'want + to + verb',
  },
  {
    id: 'm11',
    tokens: ['Every', 'time', 'you', 'visits', 'a', 'planet,', 'you', 'learn', 'words.'],
    wrong: [3, 3],
    fix: 'visit',
    distractors: ['visiting', 'is visit'],
    rule: 'you / we / they + verb (no -s)',
  },
  {
    id: 'm12',
    tokens: ['Richie', 'has', 'a', 'dreams.'],
    wrong: [3, 3],
    fix: 'dream.',
    distractors: ['dreaming.', 'dreamses.'],
    rule: 'a + one thing',
  },
];

/* ------------------------------------------------------------------ *
 * MIRA CARDS · story questions
 * ------------------------------------------------------------------ */

export interface MiraCard {
  id: string;
  q: string;
  a: string;
  options?: [string, string, string];
}

export const MIRA_CARDS: MiraCard[] = [
  { id: 'q1', q: 'Where does Richie live?', a: 'In a faraway galaxy.', options: ['On planet Earth.', 'In the New School.', 'On a spaceship.'] },
  { id: 'q2', q: 'What does Richie want to learn?', a: 'English.', options: ['Spanish.', 'Maths.', 'Music.'] },
  { id: 'q3', q: 'Why does Richie want to learn English?', a: 'To travel and make new friends.', options: ['To fly a spaceship.', 'To sleep better.', 'To change his colour.'] },
  { id: 'q4', q: 'What is the owl’s name?', a: 'Mira.', options: ['Richie.', 'Nova.', 'Luna.'] },
  { id: 'q5', q: 'Where does Mira tell Richie to go?', a: 'To the New School Galaxy.', options: ['To his favourite rock.', 'Back home.', 'To planet Earth.'] },
  { id: 'q6', q: 'What does Richie learn on each planet?', a: 'New words.', options: ['New colours.', 'New games.', 'New friends only.'] },
  { id: 'q7', q: 'How does Richie feel at the end?', a: 'Happy.', options: ['Sad.', 'Angry.', 'Tired.'] },
  { id: 'q8', q: 'What is the spaceship like?', a: 'Bright and colourful.', options: ['Dark and old.', 'Small and grey.', 'Slow and quiet.'] },
  { id: 'q9', q: 'Who is wise in the story?', a: 'Mira, the old owl.', options: ['Richie.', 'The reader.', 'The spaceship.'] },
  { id: 'q10', q: 'Where is Richie sitting when Mira comes?', a: 'On his favourite rock.', options: ['On the spaceship.', 'In the school.', 'Under a tree.'] },
  { id: 'q11', q: 'What does the text ask the reader to do?', a: 'To join Richie and keep going.', options: ['To stop learning.', 'To draw a planet.', 'To go to sleep.'] },
  { id: 'q12', q: 'Say one sentence about Richie from memory.', a: 'Any true sentence about the story.' },
];

/* ------------------------------------------------------------------ *
 * STAR CARDS · 15 seconds of English
 * ------------------------------------------------------------------ */

export interface StarCard {
  id: string;
  prompt: string;
  /** Sentence starters shown on screen — the board's USEFUL column. */
  support: string[];
}

export const STAR_CARDS: StarCard[] = [
  { id: 's1', prompt: 'Name 3 things you can see in space.', support: ['I can see…', 'There is / There are…'] },
  { id: 's2', prompt: 'Talk about your dream. Start: “My dream is…”', support: ['My dream is to…', 'I want to…'] },
  { id: 's3', prompt: 'Describe your perfect planet. 3 sentences.', support: ['My planet is…', 'On my planet you can…'] },
  { id: 's4', prompt: 'Say 3 things you want to do this school year.', support: ['This year I want to…', 'I want to learn…'] },
  { id: 's5', prompt: 'Name 3 ways to make friends.', support: ['You can…', 'It is good to…'] },
  { id: 's6', prompt: 'Would you travel to space? Why / why not?', support: ['Yes, because…', 'No, because…'] },
  { id: 's7', prompt: 'Describe a wise person you know.', support: ['He / She is…', 'He / She knows…'] },
  { id: 's8', prompt: 'Name 3 things you take on a spaceship.', support: ['I take…', 'I need… because…'] },
  { id: 's9', prompt: 'Say 3 English words you learned today.', support: ['Today I learned…', 'It means…'] },
  { id: 's10', prompt: 'Finish: “An adventure is when…”', support: ['An adventure is when…', 'For example…'] },
  { id: 's11', prompt: 'Name 2 animals that change colour or hide.', support: ['A … can…', 'It hides in…'] },
  { id: 's12', prompt: 'Teach your crew one English word you know.', support: ['My word is…', 'It means…', 'For example…'] },
];

/** The USEFUL column from the teacher's board — supports for WORD tiles. */
export const USEFUL_PHRASES = [
  'It’s a thing that…',
  'It’s a person who…',
  'It’s when you…',
  'It looks like…',
  'You use it to…',
  'It’s the opposite of…',
];

/* ------------------------------------------------------------------ *
 * WILD cards from the WORD deck
 * ------------------------------------------------------------------ */

export const WILD_CARDS = [
  { id: 'w1', task: 'Mime any word from the mission. No talking!' },
  { id: 'w2', task: 'Draw any word in 15 seconds. Your crew guesses.' },
];

/* ------------------------------------------------------------------ *
 * THE BOARD · 20 tiles from START to NEW SCHOOL
 * ------------------------------------------------------------------ */

export type TileKind = 'start' | 'word' | 'meteor' | 'mira' | 'star' | 'boost' | 'wormhole' | 'finish';

export interface Tile {
  n: number;
  kind: TileKind;
  /** For wormholes: +3 or -3. */
  jump?: number;
}

export const BOARD: Tile[] = [
  { n: 0, kind: 'start' },
  { n: 1, kind: 'word' },
  { n: 2, kind: 'meteor' },
  { n: 3, kind: 'mira' },
  { n: 4, kind: 'word' },
  { n: 5, kind: 'star' },
  { n: 6, kind: 'meteor' },
  { n: 7, kind: 'wormhole', jump: 3 },
  { n: 8, kind: 'mira' },
  { n: 9, kind: 'word' },
  { n: 10, kind: 'boost' },
  { n: 11, kind: 'meteor' },
  { n: 12, kind: 'star' },
  { n: 13, kind: 'mira' },
  { n: 14, kind: 'word' },
  { n: 15, kind: 'meteor' },
  { n: 16, kind: 'boost' },
  { n: 17, kind: 'mira' },
  { n: 18, kind: 'star' },
  { n: 19, kind: 'wormhole', jump: -3 },
  { n: 20, kind: 'finish' },
];

export const TILE_INFO: Record<TileKind, { label: string; task: string; colour: string }> = {
  start: { label: 'START', task: 'All rockets start here.', colour: '#8b8fa8' },
  word: { label: 'WORD', task: 'Describe the word. Never say the taboo words.', colour: '#a855f7' },
  meteor: { label: 'METEOR', task: 'One mistake in the sentence. Fix it.', colour: '#f4442e' },
  mira: { label: 'MIRA', task: 'Answer a question about Richie’s story.', colour: '#3fbf5a' },
  star: { label: 'STAR', task: 'Speak for 15 seconds. No stopping!', colour: '#ffc93c' },
  boost: { label: 'BOOST', task: 'Free move: fly 2 tiles forward.', colour: '#4fc3f7' },
  wormhole: { label: 'WORMHOLE', task: 'Jump +3 or −3. No card, no star.', colour: '#ff5cc8' },
  finish: { label: 'NEW SCHOOL', task: 'The first rocket here wins the race.', colour: '#ffffff' },
};

