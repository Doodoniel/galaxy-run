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
| 1 | **Lead-in** · Mission Briefing | Callsigns, rockets, mode, what today is about | 0–4 |
| 2 | **Presentation** · Word Lab & Story | Ten words one card at a time (picture → word → stress → drill → concept check, plus an optional *Freeze!* round). Then the story: six sentences heard with **no text**, then retold from a six-picture storyboard | 4–20 |
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
  this is that sheet, with the ten target words marked and a "read it to me" button. It stays locked during
  the listening step, with a teacher override.
- **🧠 Memory Core** (`M`) — the vocabulary trainer. Every word carries a mastery level 0–5 per pilot and the
  drill gets harder as the level rises: picture → word → meaning → by ear → spell it. A wrong answer drops
  the level, so a shaky word keeps coming back. This is the mode to set as homework.
- **🛰 Mission Control** (`T`) — teacher only. Lesson clock against the 60-minute plan, stars per pilot
  (`+1` / `−1`), the golden-rule penalty, `MAKE IT HARDER`, every answer key, and the whole plan with a jump
  to any activity.

## How grading works

Anything checkable is checked automatically: vocabulary, gap-fill, true/false, meteor corrections, Mira's
story questions, and every Memory Core drill. The scores land on the mission report.

Anything spoken — WORD tiles, STAR tiles, the story retell, the planet pitch — runs a timer with on-screen
support phrases and then leaves the verdict to the teacher: **⭐ 1 star** or **no star**. No crew voting, no
speech recognition.

## Speech and saving

Pronunciation and the story audio use the browser's built-in English voice (Web Speech API); Chrome and Edge
sound best. If a device has no English voice everything still works — the teacher reads aloud, as in the
printed plan.

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
