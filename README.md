# Galaxy Run · Mission 01

An interactive online version of the **New School Galaxy · Mission 01** lesson (Prepare 2, Pre-A1 → A1),
built to be run on a projector or a shared screen for **1 to 6 pilots**.

Two rules shape the whole app:

1. **Nothing scrolls.** The page is exactly one viewport tall. An activity with ten items shows them one at a
   time — a projector has no scrollbar, and a shared screen makes scrolling unreadable. There is a
   fullscreen button (or press `F`).
2. **Nobody types** unless the mission is in solo mode. Every answer is a tap, so one person can drive while
   the whole class calls the answer out loud.

The interface is English-only by design: it is part of the lesson's golden rule.

---

## The hour, in five phases

The lesson runs as **PPP** — lead-in, presentation, controlled practice, production, feedback. The five
planets in the top bar *are* those phases: they show where the class is, what is done, and what is still
ahead, and clicking one jumps there.

| # | Phase | What happens | Min |
| --- | --- | --- | --- |
| 1 | **Lead-in** · Mission Briefing | Callsigns, rockets, mode, what today is about — then the launch | 0–4 |
| 2 | **Presentation** · Word Lab & Story | Ten words one card at a time: picture → word → stress → choral drill → concept check. Then the story as a **shared reading**: six spreads, picture and sentence side by side, the teacher reads and the crew reads back — then the text goes away and they retell it from the six pictures alone | 4–20 |
| 3 | **Controlled practice** · Check & Drill | Vocabulary (meaning → word, then the word back into a sentence), Story check (true/false, then the meteor storm of one-mistake sentences), Speed round (60 seconds, ten words, per pilot) | 20–36 |
| 4 | **Production** · Now Speak | Galaxy Run — the 20-tile board race: WORD · METEOR · MIRA · STAR · BOOST · WORMHOLE. Then My Planet: design one, pitch it in fifteen seconds | 36–58 |
| 5 | **Feedback** · Landing | Race winner, MVP, crew record, per-pilot report, homework, printable | 58–60 |

Every activity carries the sentence the teacher says to launch it — it sits along the bottom of the screen in
class mode, so a stand-in teacher can read the lesson straight off the projector.

## Two modes

| | **📽 Class** (default) | **🧑‍🚀 Solo** |
| --- | --- | --- |
| Who | Projector, or a shared screen in a call | One learner on their own device |
| Pilots | 2–6 | 1 |
| Typing | None — everything is a tap | Typing drills and the spelling round are on |
| Speaking tasks | Timer + on-screen support, teacher awards the star | Same, self-assessed |

Switch it on the briefing screen or from the top bar at any time.

## Always available

- **📖 Story** (`S`) — the text on the wall. In the printed lesson the story is pinned up for the whole hour;
  this is that sheet, with the ten target words marked. Reading only — no playback.
- **🧠 Memory Core** (`M`) — the vocabulary trainer. Every word carries a mastery level 0–5 per pilot and the
  drill gets harder as the level rises: picture → word → meaning → by ear → spell it. A wrong answer drops
  the level, so a shaky word keeps coming back. This is the mode to set as homework.
- **🛰 Mission Control** (`T`) — teacher only. Lesson clock against the 60-minute plan, stars per pilot
  (`+1` / `−1`), the golden-rule penalty, `MAKE IT HARDER`, every answer key, and the whole plan with a jump
  to any activity.

## Sharing your screen

Mission Control is part of the page: share the window it is open in and the crew sees it, answer keys and all.
The way round it costs nothing —

1. In Mission Control, press **🪟 Open a second window**.
2. Keep that window on your own screen and share only the first one (every call app can share a single window
   or tab rather than the whole desktop).

Both windows run the same mission and stay in step through the browser's own storage events — award a star,
jump a phase or flip the mode in your window and the shared one follows within a moment. No server involved,
and it only works between windows of the same browser on the same computer.

## Whose turn it is

One queue runs through the whole mission, not just the board. The pilot on turn is named in the title row of
every activity, and the crew strip in the bar shows everyone with their score, so the quiet pilot at the back
gets asked as often as the loud one. Two levers when that gets in the way:

- **⏭ next to the name** hands the turn on — for a pilot who is stuck, or out of the room.
- **Click any pilot in the crew strip** to put them on turn, when you want to ask someone in particular.

## Two scores, kept apart

| | What it measures | Who decides |
| --- | --- | --- |
| **⭐ Stars** | Speaking — WORD and STAR tiles, Mira from memory, the story retell, the planet pitch | You, with ⭐ / no star |
| **🎯 Accuracy** | The auto-checked questions the pilot was actually asked | The app |

They are deliberately not one number. Every correct true/false would otherwise be worth as much as fifteen
seconds of unbroken English, and the MVP badge would go to whoever clicks fastest rather than whoever talks
most — the wrong prize for a speaking lesson. Accuracy and fluency are also often *different children*, and
seeing which is which is the useful part.

Accuracy is broken down into **Vocabulary**, **Story** and **Grammar**, and every wrong answer adds the word
or the grammar rule to that pilot's personal review list.

## Certificates

The mission report ends with **🎖 Certificates** — one printable page per pilot: callsign, their planet,
stars, place, speed record, accuracy per skill, and a short specific list of *what to practise before Mission
02* built from what they actually got wrong. It prints black-on-white, one pilot per page.

It claims nothing it cannot back up. With a crew taking turns each pilot only answers a handful of items, so
the certificate reports what happened rather than ticking off words nobody tested.

## How grading works

Anything checkable is checked automatically: vocabulary, gap-fill, true/false, meteor corrections, Mira's
story questions, and every Memory Core drill.

Anything spoken — WORD tiles, STAR tiles, the story retell, the planet pitch — runs a timer with on-screen
support phrases and then leaves the verdict to the teacher: **⭐ 1 star** or **no star**. No crew voting, no
speech recognition.

## Speech and saving

Speech is used for **single words and single sentences only** — a browser voice reading five paragraphs
sounds worse than any teacher, so there is no whole-story playback anywhere. Words have a 🔈 on the
flashcards and in Memory Core; each story spread has a 🔈 for that one sentence, mainly for a pilot working
alone at home. In class the teacher reads. Chrome and Edge sound best; with no English voice installed
everything still works.

Progress lives in `localStorage` on the device running the game and survives a reload. *Reset the whole
mission* in Mission Control clears it. Nothing leaves the browser; there is no server.

---

## Running it

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages

`vite.config.ts` uses `base: './'`, so the build works from any repository path.

1. Push to `main`.
2. **Settings → Pages → Source: GitHub Actions**.
3. `.github/workflows/deploy.yml` builds and publishes on every push.

## Artwork

The ten illustrations in `public/art` come from the course flashcard deck
(`flashcards (вводим лексику).pdf`), extracted with their backgrounds removed. Everything else — the
planets, rockets, board, starfield and comets — is drawn in code (`src/components/Planet.tsx`,
`Starfield.tsx`, `ui.tsx`).

## Project layout

```
src/
  data/content.ts     what is taught: words, story, cards, board, answer keys
  data/lesson.ts      how the hour runs: the five phases and their activities
  state/game.tsx      mission state, modes, localStorage persistence
  lib/audio.ts        synthesised sound effects and speech
  components/         shell, phase map, planets, starfield, shared UI, teacher panel
  stages/             one file per activity
```

`content.ts` and `lesson.ts` are the single source of truth — the stages only render them. To change a card,
a question, a key or the running order, edit those two files and nothing else.
