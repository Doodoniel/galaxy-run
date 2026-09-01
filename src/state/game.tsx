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
 * `class`  — one screen for everybody: a projector, or a shared screen in a
 *            video call. Nobody types; the teacher (or one pilot at the
 *            keyboard) taps, and the crew answers out loud.
 * `solo`   — one learner on their own device: typing drills are switched on
 *            and the reflection fields appear, because there is somebody
 *            there to fill them in.
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
  planet: emptyPlanet(),
});

const initialState = (): MissionState => ({
  v: 2,
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
    // Older saves belong to the pre-PPP structure: start clean rather than
    // half-restoring a mission whose stages no longer exist.
    if (saved?.v !== 2) return initialState();
    return { ...initialState(), ...saved };
  } catch {
    return initialState();
  }
}

function save(state: MissionState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode, quota, disabled storage — the mission still runs */
  }
}

/* ------------------------------------------------------------------ *
 * Context
 * ------------------------------------------------------------------ */

type Recipe = (draft: MissionState) => void;

interface Ctx {
  state: MissionState;
  /** True when typing-based tasks are allowed. */
  typing: boolean;
  update: (recipe: Recipe) => void;
  reset: () => void;
  goto: (activity: ActivityId) => void;
  next: () => void;
  finish: (activity: ActivityId, result?: Result) => void;
  award: (pilotIndex: number, stars?: number) => void;
}

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionState>(load);
  const timer = useRef<number | undefined>(undefined);

  const update = useCallback((recipe: Recipe) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(state), 220);
    return () => window.clearTimeout(timer.current);
  }, [state]);

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

  const value = useMemo<Ctx>(
    () => ({ state, typing: state.mode === 'solo', update, reset, goto, next, finish, award }),
    [state, update, reset, goto, next, finish, award],
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
