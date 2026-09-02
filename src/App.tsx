import { useEffect, useState } from 'react';
import { WORDS } from './data/content';
import { phaseOf } from './data/lesson';
import { GameProvider, useGame } from './state/game';
import { Starfield } from './components/Starfield';
import { PlanetBackdrop } from './components/Planet';
import { ActivityBar, PhaseMap } from './components/GalaxyMap';
import { MissionControl } from './components/MissionControl';
import { StoryBook } from './components/StoryBook';
import { useFullscreen } from './components/Shell';
import { Crew } from './stages/Crew';
import { WordCards } from './stages/WordCards';
import { StoryTime } from './stages/StoryTime';
import { Vocab } from './stages/Vocab';
import { Check } from './stages/Check';
import { SpeedRound } from './stages/SpeedRound';
import { GalaxyRun } from './stages/GalaxyRun';
import { MyPlanet } from './stages/MyPlanet';
import { Report } from './stages/Report';
import { MemoryCore } from './stages/MemoryCore';
import { setMuted, sfx, stopSpeaking } from './lib/audio';
import { artUrl } from './lib/art';
import { tap } from './components/ui';

export default function App() {
  return (
    <GameProvider>
      <Starfield />
      <Mission />
    </GameProvider>
  );
}

function Mission() {
  const { state, update } = useGame();
  // A window opened as the teacher's own console starts with the panel up.
  const [control, setControl] = useState(() => location.hash === '#control');
  const [memory, setMemory] = useState(false);
  const [story, setStory] = useState(false);
  const full = useFullscreen();

  const phase = phaseOf(state.activity);

  useEffect(() => setMuted(state.muted), [state.muted]);

  // Warm the ten illustrations up front: a card must be readable the instant
  // it is revealed, not a second later.
  useEffect(() => {
    WORDS.forEach((w) => {
      const img = new Image();
      img.src = artUrl(w.image);
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 't') setControl((c) => !c);
      if (k === 'm') setMemory((m) => !m);
      if (k === 's') setStory((s) => !s);
      if (k === 'f') full.toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  return (
    <div style={{ ['--phase' as string]: phase.colour, display: 'contents' }}>
      <PlanetBackdrop look={phase.planet} />

      <header className="topbar">
        <span className="brand">
          <b>Galaxy Run</b> Mission 01
        </span>

        <PhaseMap />
        <span className="grow" />

        <button
          className="btn btn--ghost btn--sm"
          onClick={tap(() => update((d) => void (d.mode = d.mode === 'class' ? 'solo' : 'class')))}
          title="Class = 2–6 pilots on one screen, tapping. Solo = one-to-one, the pilot types."
        >
          {state.mode === 'class' ? '📽' : '🧑‍🚀'} <span className="hide-sm">{state.mode}</span>
        </button>

        <button
          className={`btn btn--sm ${story ? '' : 'btn--ghost'}`}
          onClick={tap(() => setStory((s) => !s))}
          title="The story text (S)"
        >
          📖 <span className="hide-sm">Story</span>
        </button>

        <button
          className={`btn btn--sm ${memory ? '' : 'btn--ghost'}`}
          onClick={() => {
            stopSpeaking();
            sfx.tap();
            setMemory((m) => !m);
          }}
          title="Vocabulary trainer (M)"
        >
          🧠 <span className="hide-sm">Memory</span>
        </button>

        <button className="icon-btn" data-on={full.on} onClick={full.toggle} title="Fullscreen (F)" aria-label="Fullscreen">
          {full.on ? '⛶' : '⛶'}
        </button>

        <button
          className="icon-btn"
          data-on={!state.muted}
          onClick={() => {
            update((d) => void (d.muted = !d.muted));
            if (state.muted) sfx.tap();
            else stopSpeaking();
          }}
          aria-label={state.muted ? 'Sound off' : 'Sound on'}
        >
          {state.muted ? '🔇' : '🔊'}
        </button>

        <button className="icon-btn" onClick={() => setControl(true)} title="Mission control (T)" aria-label="Mission control">
          🛰
        </button>
      </header>

      {!memory && <ActivityBar />}

      {memory ? (
        <MemoryCore onClose={() => setMemory(false)} />
      ) : (
        <>
          {state.activity === 'crew' && <Crew />}
          {state.activity === 'words' && <WordCards />}
          {state.activity === 'story' && <StoryTime />}
          {state.activity === 'vocab' && <Vocab />}
          {state.activity === 'check' && <Check />}
          {state.activity === 'speed' && <SpeedRound />}
          {state.activity === 'run' && <GalaxyRun />}
          {state.activity === 'planet' && <MyPlanet />}
          {state.activity === 'report' && <Report />}
        </>
      )}

      <StoryBook open={story} onClose={() => setStory(false)} />
      <MissionControl open={control} onClose={() => setControl(false)} />
    </div>
  );
}
