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
  | 'warmup'
  | 'recall'
  | 'reboot'
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
    "id": "leadin",
    "stage": "Lead-in",
    "title": "Welcome back",
    "aim": "Feel safe, reconnect and ask for help in English.",
    "minutes": "0–8",
    "colour": "#4fc3f7",
    "planet": {
      "type": "icy",
      "hue": 195,
      "moons": 1
    },
    "activities": [
      {
        "id": "crew",
        "title": "Crew",
        "sub": "Choose a nickname and an answer mode",
        "minutes": "0–2",
        "says": "Welcome back! Today we wake up our English. Mistakes are welcome."
      },
      {
        "id": "warmup",
        "title": "Radio check",
        "sub": "Hello → introductions → ask for help → one summer memory",
        "minutes": "2–8",
        "says": "Ask your partner. Listen, answer, then ask: And you?"
      }
    ]
  },
  {
    "id": "presentation",
    "stage": "Presentation",
    "title": "Remember together",
    "aim": "Reconnect meaning, form and pronunciation before asking for accuracy.",
    "minutes": "8–25",
    "colour": "#a855f7",
    "planet": {
      "type": "banded",
      "hue": 275,
      "ring": true
    },
    "activities": [
      {
        "id": "words",
        "title": "Word lab",
        "sub": "Guess, reveal, listen and say. Space words are story support.",
        "minutes": "8–14",
        "says": "Look at the picture. Any ideas? Listen. Say it like a friendly robot!"
      },
      {
        "id": "story",
        "title": "Richie’s story",
        "sub": "Read or listen, then retell with pictures",
        "minutes": "14–18",
        "says": "Why does Richie want English? Listen for his dream. Then check the pictures."
      },
      {
        "id": "recall",
        "title": "Memory reboot",
        "sub": "Six short examples: habits, now, food, comparisons, past and plans",
        "minutes": "18–25",
        "says": "Let’s remember together. Look at the time word. What does the sentence mean?"
      }
    ]
  },
  {
    "id": "practice",
    "stage": "Practice",
    "title": "Repair & play",
    "aim": "Supported retrieval with explanations. Board tasks are mixed practice, not free production.",
    "minutes": "25–44",
    "colour": "#3fbf5a",
    "planet": {
      "type": "rocky",
      "hue": 130,
      "moons": 2
    },
    "activities": [
      {
        "id": "vocab",
        "title": "Words in use",
        "sub": "Meaning and gap-fill; use hints when needed",
        "minutes": "25–28",
        "says": "Choose the word, then say the whole sentence."
      },
      {
        "id": "check",
        "title": "Story & meteors",
        "sub": "Check meaning and repair sentences",
        "minutes": "28–31",
        "says": "Find the mistake. Use the example if you need help."
      },
      {
        "id": "reboot",
        "title": "Power up",
        "sub": "Twelve GoGetter 2 review questions with feedback and repair",
        "minutes": "31–37",
        "says": "Think first. Choose an answer. Explain it together. Mistakes help us choose what to practise."
      },
      {
        "id": "speed",
        "title": "Word boost",
        "sub": "Optional: ten pictures, with or without a timer",
        "minutes": "Optional",
        "says": "Choose relaxed practice or a timed challenge. Both are good practice."
      },
      {
        "id": "run",
        "title": "Galaxy Run",
        "sub": "Roll → read the task → speak or answer → next pilot",
        "minutes": "37–44",
        "says": "Let’s play a few rounds. Help each other. We can finish the game another day."
      }
    ]
  },
  {
    "id": "production",
    "stage": "Production",
    "title": "Create your adventure",
    "aim": "Use English for an original message, exchange information and make a shared choice.",
    "minutes": "44–56",
    "colour": "#ffc93c",
    "planet": {
      "type": "lava",
      "hue": 28,
      "ring": true,
      "moons": 1
    },
    "activities": [
      {
        "id": "planet",
        "title": "My planet",
        "sub": "Design → prepare → invite → ask → choose a visit",
        "minutes": "44–56",
        "says": "Your planet, your ideas. Invite a visitor. They ask a question and choose where to go."
      }
    ]
  },
  {
    "id": "feedback",
    "stage": "Feedback",
    "title": "Celebrate & reflect",
    "aim": "Separate game rewards from learning evidence. Identify one next step.",
    "minutes": "56–60",
    "colour": "#ff5cc8",
    "planet": {
      "type": "ringed",
      "hue": 320,
      "ring": true,
      "moons": 2
    },
    "activities": [
      {
        "id": "report",
        "title": "Mission report",
        "sub": "Personal results, can-do reflection and a small next step",
        "minutes": "56–60",
        "says": "What can you say now? What helped you? Choose one thing to practise next."
      }
    ]
  }
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
{code:'Words',text:'Recognise story words and reuse familiar GoGetter 2 language with support.'},
{code:'Meaning',text:'Understand the main idea and details in a short illustrated story.'},
{code:'Grammar',text:'Recall routines, actions now, quantities, comparisons, past events and plans.'},
{code:'Interaction',text:'Ask for help, invite a visitor, ask and answer a follow-up question.'},
{code:'Production',text:'Describe an imaginary planet, share a past event and make a plan; then write 3–5 sentences.'},
];
