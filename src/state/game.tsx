import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { WORDS, type WordId } from '../data/content';
import { ALL_ACTIVITIES, nextActivity, type ActivityId } from '../data/lesson';
import type { PlanetLook } from '../data/lesson';

/* ------------------------------------------------------------------ *
 * How the mission is being run
 * ------------------------------------------------------------------ */

/**
 * Both modes have a teacher in them — what changes is how many pilots there
 * are and who is holding the keyboard.
 *
 * `class` — 2 to 6 pilots round one screen: a projector, or a shared screen in
 *           a call. Nobody types, because only one person can; answers are
 *           tapped and called out loud, and the turn passes round the crew.
 * `solo`  — a one-to-one lesson. One pilot with their own keyboard, sharing
 *           their screen, so they type their answers instead of picking them
 *           off a list. Recall beats recognition when it is just the two of
 *           you and there is time to think.
 */
export type Mode = 'class' | 'solo';

export const PILOT_COLOURS = [
  { id: 'red', hex: '#f4442e', name: 'Red' },
  { id: 'cyan', hex: '#4fc3f7', name: 'Cyan' },
  { id: 'green', hex: '#3fbf5a', name: 'Green' },
  { id: 'yellow', hex: '#ffc93c', name: 'Yellow' },
  { id: 'pink', hex: '#ff5cc8', name: 'Pink' },
  { id: 'violet', hex: '#a855f7', name: 'Violet' },
];

export interface PlanetSheet extends PlanetLook {
  name: string;
  /** Three mission words the visitor learns there — picked, never typed. */
  words: WordId[];
  pitched: boolean;
}

/**
 * Two different things are worth knowing about a pilot, and mixing them into
 * one number hides both:
 *   - stars are the currency of SPEAKING, exactly as in the printed game;
 *   - accuracy is what the auto-checked tasks measure.
 * Accuracy and fluency are often different children.
 */
export type SkillId = 'vocabulary' | 'comprehension' | 'grammar';

export interface Tally {
  right: number;
  wrong: number;
}

export const SKILLS: { id: SkillId; label: string; hint: string }[] = [
  { id: 'vocabulary', label: 'Vocabulary', hint: 'the ten words and their meanings' },
  { id: 'comprehension', label: 'Story', hint: 'true / false and Mira’s questions' },
  { id: 'grammar', label: 'Grammar', hint: 'the meteor corrections' },
];

export interface Pilot {
  id: string;
  callsign: string;
  colour: string;
  /** Board position 0…20. */
  pos: number;
  stars: number;
  shields: number;
  /** Finishing place in the race, 1-based; null while still flying. */
  place: number | null;
  /** Best Speed Round score (words in 60 seconds). */
  best: number;
  /** Vocabulary mastery, 0…5 per word — drives the Memory Core queue. */
  mastery: Record<string, number>;
  /** Right / wrong on the auto-checked tasks, per skill. */
  skills: Record<SkillId, Tally>;
  /** Words this pilot got wrong at least once — their review list. */
  missedWords: WordId[];
  /** Grammar rules they tripped on, taken from the meteor cards. */
  missedRules: string[];
  planet: PlanetSheet;
}

export interface Result {
  right: number;
  total: number;
  ms?: number;
}

export interface MissionState {
  v: number;
  mode: Mode;
  activity: ActivityId;
  done: ActivityId[];
  pilots: Pilot[];
  /** Whose turn it is during turn-based activities. */
  turn: number;
  hard: boolean;
  muted: boolean;
  /** What the crew scored, per activity — the feedback phase reads this. */
  results: Partial<Record<ActivityId, Result>>;
  story: { heard: number; retold: boolean };
  run: {
    round: number;
    log: string[];
    usedWord: string[];
    usedMeteor: string[];
    usedMira: string[];
    usedStar: string[];
  };
}

const emptyPlanet = (): PlanetSheet => ({
  name: '',
  type: 'rocky',
  hue: Math.floor(Math.random() * 360),
  ring: true,
  moons: 1,
  words: [],
  pitched: false,
});

export const makePilot = (i: number, callsign = ''): Pilot => ({
  id: `p${i + 1}-${Math.random().toString(36).slice(2, 7)}`,
  callsign,
  colour: PILOT_COLOURS[i % PILOT_COLOURS.length].hex,
  pos: 0,
  stars: 0,
  shields: 0,
  place: null,
  best: 0,
  mastery: Object.fromEntries(WORDS.map((w) => [w.id, 0])),
  skills: {
    vocabulary: { right: 0, wrong: 0 },
    comprehension: { right: 0, wrong: 0 },
    grammar: { right: 0, wrong: 0 },
  },
  missedWords: [],
  missedRules: [],
  planet: emptyPlanet(),
});

const initialState = (): MissionState => ({
  v: 3,
  mode: 'class',
  activity: 'crew',
  done: [],
  pilots: [makePilot(0), makePilot(1)],
  turn: 0,
  hard: false,
  muted: false,
  results: {},
  story: { heard: 0, retold: false },
  run: { round: 1, log: [], usedWord: [], usedMeteor: [], usedMira: [], usedStar: [] },
});

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

const KEY = 'galaxy-run-mission-01';

function load(): MissionState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const saved = JSON.parse(raw) as MissionState;
    // An older save belongs to a mission with a different shape: start clean
    // rather than half-restoring it.
    if (saved?.v !== 3) return initialState();
    return { ...initialState(), ...saved };
  } catch {
    return initialState();
  }
}

function save(json: string) {
  try {
    localStorage.setItem(KEY, json);
  } catch {
    /* private mode, quota, disabled storage — the mission still runs */
  }
}

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

type Recipe = (draft: MissionState) => void;

/** What an auto-checked answer tells us about the pilot who gave it. */
export interface AnswerDetail {
  skill: SkillId;
  /** The word the item was about, if any — it goes on the review list. */
  word?: WordId;
  /** The grammar rule the item was about, if any. */
  rule?: string;
}

interface Ctx {
  state: MissionState;
  /** True when typing-based tasks are allowed. */
  typing: boolean;
  /** The pilot on turn. One queue runs through the whole mission. */
  pilot: Pilot;
  update: (recipe: Recipe) => void;
  reset: () => void;
  goto: (activity: ActivityId) => void;
  next: () => void;
  finish: (activity: ActivityId, result?: Result) => void;
  award: (pilotIndex: number, stars?: number) => void;
  /** Record an auto-checked answer against the pilot on turn. */
  record: (correct: boolean, detail: AnswerDetail) => void;
  /** Record it and hand the turn on — what the practice activities use. */
  answer: (correct: boolean, detail: AnswerDetail) => void;
  /** Hand the turn on without scoring — for the teacher-judged tasks. */
  passTurn: () => void;
  /** Put a named pilot on turn, so the teacher can ask whoever they like. */
  setTurn: (pilotIndex: number) => void;
  /** Put a word on the pilot's review list without touching their accuracy. */
  flagWord: (word: WordId) => void;
}

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionState>(load);
  const timer = useRef<number | undefined>(undefined);
  /** The last thing this window put in storage — used to ignore its own echo. */
  const written = useRef('');

  const update = useCallback((recipe: Recipe) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const json = JSON.stringify(state);
      written.current = json;
      save(json);
    }, 220);
    return () => window.clearTimeout(timer.current);
  }, [state]);

  /**
   * Keep every window of the mission in step.
   *
   * A shared screen shows whatever is in the shared window — Mission Control
   * included, answer keys and all. The way out is a second window the teacher
   * keeps to themselves, and for that the two have to stay in sync. The
   * `storage` event fires in every OTHER window of the same origin, so one
   * window's save is another window's update, with no server in the middle.
   */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue || e.newValue === written.current) return;
      try {
        const incoming = JSON.parse(e.newValue) as MissionState;
        if (incoming?.v !== 3) return;
        written.current = e.newValue;
        setState({ ...initialState(), ...incoming });
      } catch {
        /* a half-written value from another tab — the next one will be whole */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(initialState());
  }, []);

  const goto = useCallback(
    (activity: ActivityId) => update((d) => void (d.activity = activity)),
    [update],
  );

  /** Mark the current activity done and move on. */
  const next = useCallback(() => {
    update((d) => {
      if (!d.done.includes(d.activity)) d.done.push(d.activity);
      d.activity = nextActivity(d.activity) ?? ALL_ACTIVITIES[ALL_ACTIVITIES.length - 1];
    });
  }, [update]);

  const finish = useCallback(
    (activity: ActivityId, result?: Result) => {
      update((d) => {
        if (!d.done.includes(activity)) d.done.push(activity);
        if (result) d.results[activity] = result;
      });
    },
    [update],
  );

  const award = useCallback(
    (pilotIndex: number, stars = 1) => {
      update((d) => {
        const p = d.pilots[pilotIndex];
        if (p) p.stars = Math.max(0, p.stars + stars);
      });
    },
    [update],
  );

  const onTurn = (d: MissionState) => d.pilots[d.turn % Math.max(1, d.pilots.length)];

  const passTurn = useCallback(
    () => update((d) => void (d.turn = (d.turn + 1) % Math.max(1, d.pilots.length))),
    [update],
  );

  const setTurn = useCallback(
    (pilotIndex: number) => update((d) => void (d.turn = pilotIndex % Math.max(1, d.pilots.length))),
    [update],
  );

  const record = useCallback(
    (correct: boolean, detail: AnswerDetail) => {
      update((d) => {
        const p = onTurn(d);
        if (!p) return;
        const tally = p.skills[detail.skill];
        if (correct) tally.right += 1;
        else tally.wrong += 1;
        if (!correct && detail.word && !p.missedWords.includes(detail.word)) p.missedWords.push(detail.word);
        if (!correct && detail.rule && !p.missedRules.includes(detail.rule)) p.missedRules.push(detail.rule);
      });
    },
    [update],
  );

  const answer = useCallback(
    (correct: boolean, detail: AnswerDetail) => {
      update((d) => {
        const p = onTurn(d);
        if (p) {
          const tally = p.skills[detail.skill];
          if (correct) tally.right += 1;
          else tally.wrong += 1;
          if (!correct && detail.word && !p.missedWords.includes(detail.word)) p.missedWords.push(detail.word);
          if (!correct && detail.rule && !p.missedRules.includes(detail.rule)) p.missedRules.push(detail.rule);
        }
        d.turn = (d.turn + 1) % Math.max(1, d.pilots.length);
      });
    },
    [update],
  );

  const flagWord = useCallback(
    (word: WordId) => {
      update((d) => {
        const p = onTurn(d);
        if (p && !p.missedWords.includes(word)) p.missedWords.push(word);
      });
    },
    [update],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      typing: state.mode === 'solo',
      pilot: state.pilots[state.turn % Math.max(1, state.pilots.length)],
      update,
      reset,
      goto,
      next,
      finish,
      award,
      record,
      answer,
      passTurn,
      setTurn,
      flagWord,
    }),
    [state, update, reset, goto, next, finish, award, record, answer, passTurn, setTurn, flagWord],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export function masteryOf(pilot: Pilot | undefined, id: WordId) {
  return pilot?.mastery?.[id] ?? 0;
}

export function leaderboard(pilots: Pilot[]) {
  return [...pilots].sort((a, b) => {
    if (a.place && b.place) return a.place - b.place;
    if (a.place) return -1;
    if (b.place) return 1;
    if (b.pos !== a.pos) return b.pos - a.pos;
    return b.stars - a.stars;
  });
}

export function mvp(pilots: Pilot[]) {
  return [...pilots].sort((a, b) => b.stars - a.stars)[0];
}

/** Right / total across every auto-checked task. */
export function accuracy(p: Pilot) {
  const right = SKILLS.reduce((n, s) => n + (p.skills?.[s.id]?.right ?? 0), 0);
  const wrong = SKILLS.reduce((n, s) => n + (p.skills?.[s.id]?.wrong ?? 0), 0);
  return { right, total: right + wrong };
}

/** The pilot who answered most accurately — needs a few answers to count. */
export function sharpest(pilots: Pilot[]) {
  const scored = pilots.map((p) => ({ p, a: accuracy(p) })).filter((x) => x.a.total >= 3);
  if (!scored.length) return undefined;
  return scored.sort((x, y) => y.a.right / y.a.total - x.a.right / x.a.total)[0].p;
}
