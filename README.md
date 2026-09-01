# Galaxy Run · Mission 01

An interactive online version of the **New School Galaxy · Mission 01** lesson (Prepare 2, Pre-A1 → A1).
Everything the printed pack contains — the ten flashcards, worksheets 1–6, the *Galaxy Run* board game with
its four card decks, and the teacher's answer keys — is playable in the browser for **1 to 6 pilots** on one
shared screen.

The interface is English-only by design: it is part of the lesson's golden rule.

---

## The mission

| Stage | What happens | Source |
| --- | --- | --- |
| **Lift-off** | Callsigns, rocket colours, mission briefing, learning objectives | Lesson plan, stage 0 |
| **Word Lab** | Flashcards → choral drill → CCQ → match → gap-fill | Worksheet 1 A/B |
| **Chameleon Challenge** | *Freeze!* (mime, 10 words) and the 60-second **Speed Round** with a crew record | Lesson plan, stage 2 + video hook 2 |
| **Picture This** | The story read aloud sentence by sentence, six drawing boxes, retell, then check | Worksheet 2 |
| **Story Check** | True/false against the clock, then interactive **Meteor Alert** error correction | Worksheet 3 A/B |
| **Galaxy Run** | The 20-tile race: WORD · METEOR · MIRA · STAR · BOOST · WORMHOLE | Board game |
| **My Planet** | Planet designer, sheet, and the 15-second pitch timer | Worksheet 5 |
| **Landing** | Race winner, MVP, per-pilot logbook, printable, homework | Worksheet 6 |

Two things live outside the stage order:

- **🧠 Memory Core** (top bar, or press `M`) — the vocabulary trainer. Every word carries a mastery level
  0–5 per pilot, and the drill type gets harder as the level rises: picture → word → meaning → by ear →
  spell it. A wrong answer drops the level, so a shaky word keeps coming back. This is the mode to set as
  homework.
- **🛰 Mission Control** (top bar, or press `T`) — teacher only. Lesson clock against the 60-minute plan,
  stars per pilot (`+1` / `−1`), the golden-rule penalty, `MAKE IT HARDER`, every answer key, and a jump to
  any stage.

## How grading works

Anything that can be checked automatically is checked automatically: matching, gap-fill, true/false, meteor
corrections, Mira's story questions, and every Memory Core drill.

Anything spoken — WORD tiles ("describe it"), STAR tiles ("speak for 15 seconds"), the wild cards and the
planet pitch — runs a timer and on-screen support phrases, then leaves the verdict to the teacher:
**⭐ Good — 1 star** or **No star**. There is no crew voting and no speech recognition; the teacher decides.

## Speech

Word pronunciation and the story audio use the browser's built-in English voice (Web Speech API). Chrome and
Edge sound best. If a device has no English voice the game still works — everything is on screen, and the
teacher reads aloud as in the printed plan.

## Saving

Progress lives in `localStorage` on the device that is running the game: callsigns, stars, positions,
drawings, planets and word mastery all survive a reload. *Reset the whole mission* in Mission Control clears
it. Nothing leaves the browser and there is no server.

---

## Running it

```bash
npm install
npm run dev
```

Build a production bundle:

```bash
npm run build
```

## Deploying to GitHub Pages

`vite.config.ts` uses `base: './'`, so the build works from any repository path — no configuration needed for
the repo name.

1. Create a repository and push this folder to `main`.
2. In the repository, open **Settings → Pages** and set **Source: GitHub Actions**.
3. Push. `.github/workflows/deploy.yml` builds and publishes on every push to `main`.

The published URL is `https://<user>.github.io/<repo>/`.

## Artwork

The ten illustrations in `public/art` are extracted from the course flashcard deck
(`flashcards (вводим лексику).pdf`) with their backgrounds removed. Everything else — rockets, planets, the
starfield, the board — is drawn in code.

## Project layout

```
src/
  data/content.ts        all lesson content: words, story, cards, board, keys
  state/game.tsx         mission state + localStorage persistence
  lib/audio.ts           synthesised sound effects and speech
  components/            starfield, shared UI, Mission Control
  stages/                one file per stage of the lesson
```

`src/data/content.ts` is the single source of truth — the stages only render it. To add a card, change a
question or fix a key, edit that file and nothing else.
