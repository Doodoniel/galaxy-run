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
import type { StageId, WordId } from '../data/content';
import { STAGE_ORDER, WORDS } from '../data/content';

/* ------------------------------------------------------------------ *
 * Shape of the mission
 * ------------------------------------------------------------------ */

export const PILOT_COLOURS = [
  { id: 'red', hex: '#f4442e', name: 'Red' },
  { id: 'cyan', hex: '#4fc3f7', name: 'Cyan' },
  { id: 'green', hex: '#3fbf5a', name: 'Green' },
  { id: 'yellow', hex: '#ffc93c', name: 'Yellow' },
  { id: 'pink', hex: '#ff5cc8', name: 'Pink' },
  { id: 'violet', hex: '#a855f7', name: 'Violet' },
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
  /** Best Chameleon Challenge score (words in 60 seconds). */
  best: number;
  /** Vocabulary mastery, 0…5 per word — drives the Memory Core queue. */
  mastery: Record<string, number>;
  planet: PlanetSheet;
  /** Worksheet 6 — the pilot's own notes. */
  logbook: { bestMoment: string; oneWord: string; questions: [string, string, string] };
}

export interface PlanetSheet {
  name: string;
  hue: number;
  ring: boolean;
  pattern: number;
  moons: number;
  words: [string, string, string];
  rule: string;
  people: string;
  pitch: Record<string, string>;
  pitched: boolean;
}

export interface MissionState {
  v: number;
  started: boolean;
  stage: StageId;
  pilots: Pilot[];
  /** Whose turn it is during turn-based stages. */
  turn: number;
  hard: boolean;
  muted: boolean;
  /** Stages the crew has completed. */
  done: StageId[];

  wordlab: {
    introduced: string[];
    ccq: Record<string, boolean>;
    matched: Record<string, boolean>;
    gaps: Record<string, string>;
    gapsChecked: boolean;
  };

  picture: {
    heard: number;
    drawings: (string | null)[];
    retell: string;
    remembered: number | null;
    revealed: boolean;
  };

  storycheck: {
    tf: (boolean | null)[];
    tfChecked: boolean;
    tfMs: number;
    meteorsFixed: string[];
    meteorMs: number;
  };

  run: {
    started: boolean;
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
  hue: Math.floor(Math.random() * 360),
  ring: true,
  pattern: 0,
  moons: 1,
  words: ['', '', ''],
  rule: '',
  people: '',
  pitch: {},
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
  logbook: { bestMoment: '', oneWord: '', questions: ['', '', ''] },
});

const initialState = (): MissionState => ({
  v: 1,
  started: false,
  stage: 'liftoff',
  pilots: [makePilot(0), makePilot(1)],
  turn: 0,
  hard: false,
  muted: false,
  done: [],
  wordlab: { introduced: [], ccq: {}, matched: {}, gaps: {}, gapsChecked: false },
  picture: { heard: 0, drawings: [null, null, null, null, null, null], retell: '', remembered: null, revealed: false },
  storycheck: { tf: Array(10).fill(null), tfChecked: false, tfMs: 0, meteorsFixed: [], meteorMs: 0 },
  run: { started: false, round: 1, log: [], usedWord: [], usedMeteor: [], usedMira: [], usedStar: [] },
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
    if (saved?.v !== 1) return initialState();
    // Merge over a fresh state so a new field never lands as undefined.
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
  update: (recipe: Recipe) => void;
  reset: () => void;
  goto: (stage: StageId) => void;
  next: () => void;
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
    (stage: StageId) => {
      update((d) => {
        d.stage = stage;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    },
    [update],
  );

  const next = useCallback(() => {
    update((d) => {
      if (!d.done.includes(d.stage)) d.done.push(d.stage);
      const i = STAGE_ORDER.indexOf(d.stage);
      d.stage = STAGE_ORDER[Math.min(i + 1, STAGE_ORDER.length - 1)];
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [update]);

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
    () => ({ state, update, reset, goto, next, award }),
    [state, update, reset, goto, next, award],
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

export function crewMastery(pilots: Pilot[], id: WordId) {
  if (!pilots.length) return 0;
  return pilots.reduce((sum, p) => sum + masteryOf(p, id), 0) / pilots.length;
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
