import { useEffect, useState } from 'react';
import { STAGE_META, STAGE_ORDER, WORDS, type StageId } from './data/content';
import { GameProvider, useGame } from './state/game';
import { Starfield } from './components/Starfield';
import { MissionControl } from './components/MissionControl';
import { StoryBook } from './components/StoryBook';
import { LiftOff } from './stages/LiftOff';
import { WordLab } from './stages/WordLab';
import { Challenge } from './stages/Challenge';
import { PictureThis } from './stages/PictureThis';
import { StoryCheck } from './stages/StoryCheck';
import { GalaxyRun } from './stages/GalaxyRun';
import { MyPlanet } from './stages/MyPlanet';
import { Landing } from './stages/Landing';
import { MemoryCore } from './stages/MemoryCore';
import { isMuted, setMuted, sfx, stopSpeaking } from './lib/audio';

export default function App() {
  return (
    <GameProvider>
      <Starfield />
      <Mission />
    </GameProvider>
  );
}

function Mission() {
  const { state, goto } = useGame();
  const [control, setControl] = useState(false);
  const [memory, setMemory] = useState(false);
  const [story, setStory] = useState(false);
  const [mute, setMute] = useState(isMuted());

  useEffect(() => {
    setMuted(state.muted);
    setMute(state.muted);
  }, [state.muted]);

  // Warm the ten illustrations up front: a WORD card must be readable the
  // instant it is revealed, not a second later.
  useEffect(() => {
    WORDS.forEach((w) => {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}art/${w.image}.webp`;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (typing) return;
      if (e.key.toLowerCase() === 't') setControl((c) => !c);
      if (e.key.toLowerCase() === 'm') setMemory((m) => !m);
      if (e.key.toLowerCase() === 's') setStory((s) => !s);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const stage = state.stage;

  return (
    <>
      <header className="topbar">
        <span className="topbar__brand">
          <b>Galaxy&nbsp;Run</b> · Mission&nbsp;01
        </span>

        <nav className="stagestrip" aria-label="Mission stages">
          {STAGE_ORDER.map((s: StageId) => (
            <button
              key={s}
              data-state={s === stage ? 'current' : state.done.includes(s) ? 'done' : 'todo'}
              onClick={() => {
                stopSpeaking();
                sfx.tap();
                goto(s);
                setMemory(false);
              }}
              title={`${STAGE_META[s].title} · ${STAGE_META[s].minutes} min`}
            >
              {STAGE_META[s].title}
            </button>
          ))}
        </nav>

        <span className="topbar__spacer" />

        <button
          className={`btn btn--sm ${memory ? '' : 'btn--ghost'}`}
          onClick={() => {
            stopSpeaking();
            sfx.tap();
            setMemory((m) => !m);
          }}
          title="Vocabulary trainer (M)"
        >
          🧠 <span className="hide-sm">Memory Core</span>
        </button>

        <button
          className={`btn btn--sm ${story ? '' : 'btn--ghost'}`}
          onClick={() => {
            sfx.tap();
            setStory((s) => !s);
          }}
          title="The story text (S)"
        >
          📖 <span className="hide-sm">Story</span>
        </button>

        <button
          className="icon-btn"
          data-on={!mute}
          onClick={() => {
            const nextMuted = !mute;
            setMuted(nextMuted);
            setMute(nextMuted);
            if (nextMuted) stopSpeaking();
            else sfx.tap();
          }}
          aria-label={mute ? 'Sound off' : 'Sound on'}
          title="Sound"
        >
          {mute ? '🔇' : '🔊'}
        </button>

        <button className="icon-btn" onClick={() => setControl(true)} aria-label="Mission control" title="Mission control (T)">
          🛰
        </button>
      </header>

      <main className="shell">
        {memory ? (
          <MemoryCore onClose={() => setMemory(false)} />
        ) : (
          <>
            {stage === 'liftoff' && <LiftOff />}
            {stage === 'wordlab' && <WordLab />}
            {stage === 'challenge' && <Challenge />}
            {stage === 'picture' && <PictureThis />}
            {stage === 'storycheck' && <StoryCheck />}
            {stage === 'run' && <GalaxyRun />}
            {stage === 'planet' && <MyPlanet />}
            {stage === 'landing' && <Landing />}
          </>
        )}
      </main>

      <StoryBook open={story} onClose={() => setStory(false)} />
      <MissionControl open={control} onClose={() => setControl(false)} />
    </>
  );
}
