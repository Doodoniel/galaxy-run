/**
 * The shape of the lesson.
 *
 * Five phases in PPP order — lead-in → presentation → controlled practice →
 * production → feedback. A stand-in teacher can pick the mission up cold and
 * read this table straight off the screen: what the phase is for, how long it
 * takes, and the exact English sentence that launches each activity.
 *
 * `content.ts` holds *what* is taught; this file holds *how the hour runs*.
 */

export type PhaseId = 'leadin' | 'presentation' | 'practice' | 'production' | 'feedback';

export type ActivityId =
  | 'crew'
  | 'words'
  | 'story'
  | 'vocab'
  | 'check'
  | 'speed'
  | 'run'
  | 'planet'
  | 'report';

export interface PlanetLook {
  type: 'rocky' | 'banded' | 'ringed' | 'icy' | 'lava';
  hue: number;
  ring?: boolean;
  moons?: number;
}

export interface Activity {
  id: ActivityId;
  title: string;
  /** One line: what the pilots actually do. */
  sub: string;
  minutes: string;
  /** What the teacher says to launch it — lifted from the printed plan. */
  says: string;
}

export interface Phase {
  id: PhaseId;
  /** The methodology label, so a stand-in teacher knows where they are. */
  stage: string;
  title: string;
  aim: string;
  minutes: string;
  colour: string;
  planet: PlanetLook;
  activities: Activity[];
}

export const PHASES: Phase[] = [
  {
    id: 'leadin',
    stage: 'Lead-in',
    title: 'Mission Briefing',
    aim: 'Set the frame, hand out callsigns, English from the first second.',
    minutes: '0–4',
    colour: '#4fc3f7',
    planet: { type: 'icy', hue: 195, moons: 1 },
    activities: [
      {
        id: 'crew',
        title: 'Crew',
        sub: 'Callsigns, rockets, and what today is about',
        minutes: '0–4',
        says: '“Welcome back, pilots! This is not a lesson. This is Mission 01. You need a callsign — a cool English nickname. Sixty seconds. Go!”',
      },
    ],
  },
  {
    id: 'presentation',
    stage: 'Presentation',
    title: 'Word Lab & Story',
    aim: 'Meet the ten words, then meet them again inside a story.',
    minutes: '4–20',
    colour: '#a855f7',
    planet: { type: 'banded', hue: 275, ring: true },
    activities: [
      {
        id: 'words',
        title: 'Ten words',
        sub: 'Picture → word → drill → concept check',
        minutes: '4–14',
        says: '“Card one. What is it? … It’s a chameleon. Everybody: chameleon. Again, louder. Now whisper it.”',
      },
      {
        id: 'story',
        title: 'The story',
        sub: 'Listen with no text, then retell it from the pictures',
        minutes: '14–20',
        says: '“Listen. No text, no writing — just listen. Then you tell the story back from the pictures.”',
      },
    ],
  },
  {
    id: 'practice',
    stage: 'Controlled practice',
    title: 'Check & Drill',
    aim: 'Accuracy first — meaning, then form, then speed.',
    minutes: '20–36',
    colour: '#3fbf5a',
    planet: { type: 'rocky', hue: 130, moons: 2 },
    activities: [
      {
        id: 'vocab',
        title: 'Vocabulary',
        sub: 'Meanings, then the words back in sentences',
        minutes: '20–26',
        says: '“Which word means this? … Now put the missing word back into the sentence.”',
      },
      {
        id: 'check',
        title: 'Story check',
        sub: 'True or false, then destroy the meteors',
        minutes: '26–32',
        says: '“True or false? … Careful: every meteor sentence has exactly one mistake. Find it, fix it.”',
      },
      {
        id: 'speed',
        title: 'Speed round',
        sub: 'Sixty seconds, ten words, one pilot at a time',
        minutes: '32–36',
        says: '“Sixty seconds. Ten words. Shout it out. Ready? Go!”',
      },
    ],
  },
  {
    id: 'production',
    stage: 'Production',
    title: 'Now Speak',
    aim: 'Free speaking: the words and the grammar go into the pilots’ own mouths.',
    minutes: '36–58',
    colour: '#ffc93c',
    planet: { type: 'lava', hue: 28, ring: true, moons: 1 },
    activities: [
      {
        id: 'run',
        title: 'Galaxy Run',
        sub: 'The board race — describe, fix, answer, speak 15 seconds',
        minutes: '36–53',
        says: '“Purple — describe a word. Red — fix a mistake. Green owl — answer about Richie. Yellow — speak fifteen seconds.”',
      },
      {
        id: 'planet',
        title: 'My planet',
        sub: 'Design a planet and sell it to Richie in 15 seconds',
        minutes: '53–58',
        says: '“Richie visits your planet next. Design it, name it — then sell it to him. Look up. Smile. Loud.”',
      },
    ],
  },
  {
    id: 'feedback',
    stage: 'Feedback',
    title: 'Landing',
    aim: 'Make the result visible: stars, MVP, what each pilot can now do.',
    minutes: '58–60',
    colour: '#ff5cc8',
    planet: { type: 'ringed', hue: 320, ring: true, moons: 2 },
    activities: [
      {
        id: 'report',
        title: 'Mission report',
        sub: 'Stars, MVP, word check, homework',
        minutes: '58–60',
        says: '“Pilots, count your stars. Mission 01 complete. Next time we fly to planet two.”',
      },
    ],
  },
];

export const ALL_ACTIVITIES: ActivityId[] = PHASES.flatMap((p) => p.activities.map((a) => a.id));

export const phaseOf = (id: ActivityId) => PHASES.find((p) => p.activities.some((a) => a.id === id))!;

export const activityOf = (id: ActivityId) => phaseOf(id).activities.find((a) => a.id === id)!;

export function nextActivity(id: ActivityId): ActivityId | null {
  const i = ALL_ACTIVITIES.indexOf(id);
  return i >= 0 && i < ALL_ACTIVITIES.length - 1 ? ALL_ACTIVITIES[i + 1] : null;
}

/* ------------------------------------------------------------------ *
 * MY PLANET · worksheet 5
 * ------------------------------------------------------------------ */

/**
 * The pitch frame. On a projector nobody types this in — the pilot says it
 * aloud and the blanks stay blank, exactly like the printed worksheet.
 */
export const PITCH_FRAME: { text: string; gap: string | null }[] = [
  { text: 'Hello, Richie! Welcome to planet', gap: 'your planet' },
  { text: '. It is', gap: 'adjective' },
  { text: 'and', gap: 'adjective' },
  { text: '. On my planet you can', gap: 'do something' },
  { text: '. You will learn the words', gap: 'word' },
  { text: ',', gap: 'word' },
  { text: 'and', gap: 'word' },
  { text: '. Come to my planet and', gap: 'invitation' },
  { text: '!', gap: null },
];

/* ------------------------------------------------------------------ *
 * MISSION OBJECTIVES · shown to the teacher
 * ------------------------------------------------------------------ */

export const OBJECTIVES = [
  { code: 'Vocabulary', text: '10 new words: recognise them, say them, use them in a sentence.' },
  { code: 'Reading', text: 'Understand a short illustrated story and check true / false statements.' },
  { code: 'Listening', text: 'Follow a 6-sentence story without the text and retell it from pictures.' },
  { code: 'Grammar', text: 'Present Simple -s, is / are, want + to + verb, a / plural.' },
  { code: 'Speaking', text: 'Talk for 15 seconds on a familiar topic without stopping.' },
];
