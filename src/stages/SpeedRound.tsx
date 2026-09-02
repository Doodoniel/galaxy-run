import { useState } from 'react';
import { WORDS, type Word } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { CountdownRing, Star, StarBurst, WordArt, shuffle, tap } from '../components/ui';
import { sfx, speak } from '../lib/audio';

interface Question {
  word: Word;
  options: Word[];
}

function buildQueue(): Question[] {
  const out: Question[] = [];
  for (let r = 0; r < 6; r++) {
    for (const w of shuffle(WORDS, Math.random())) {
      const others = shuffle(WORDS.filter((x) => x.id !== w.id), Math.random()).slice(0, 3);
      out.push({ word: w, options: shuffle([w, ...others], Math.random()) });
    }
  }
  return out;
}

/**
 * Sixty seconds, ten words on repeat, one pilot at a time. The score is the
 * crew record from the printed plan — the group beats its own number next
 * mission, which is what turns vocabulary into a serial.
 */
export function SpeedRound() {
  const { state, update, finish, flagWord, passTurn } = useGame();
  const pilot = state.turn % Math.max(1, state.pilots.length);
  const [phase, setPhase] = useState<'ready' | 'run' | 'over'>('ready');
  const [queue, setQueue] = useState<Question[]>([]);
  const [at, setAt] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null);
  const [burst, setBurst] = useState(0);
  const [runKey, setRunKey] = useState(0);

  const p = state.pilots[pilot];
  const current = queue[at];
  const record = Math.max(0, ...state.pilots.map((x) => x.best));

  const start = () => {
    setQueue(buildQueue());
    setAt(0);
    setScore(0);
    setMisses(0);
    setRunKey((k) => k + 1);
    setPhase('run');
    sfx.launch();
  };

  const answer = (choice: Word) => {
    if (phase !== 'run' || !current) return;
    if (choice.id === current.word.id) {
      sfx.right();
      setScore((s) => s + 1);
      setFlash('ok');
    } else {
      sfx.wrong();
      setMisses((m) => m + 1);
      setFlash('no');
      flagWord(current.word.id);
      speak(current.word.word);
    }
    window.setTimeout(() => setFlash(null), 160);
    setAt((a) => a + 1);
  };

  const stop = () => {
    setPhase('over');
    sfx.fanfare();
    if (score > (p?.best ?? 0)) {
      setBurst((b) => b + 1);
      update((d) => void (d.pilots[pilot].best = score));
    }
    finish('speed', { right: score, total: 10 });
  };

  return (
    <Stage
      title="Speed round"
      step={phase === 'run' ? `${score} correct` : `record ${record} / 10`}
      turn
      footer={phase === 'over' ? <NextButton label="To Galaxy Run" /> : undefined}
    >
      <StarBurst fire={burst} />

      {phase === 'ready' && (
        <div className="center">
          <h2 className="q">Sixty seconds. Ten words.</h2>
          <p className="hint" style={{ maxWidth: 560 }}>
            <b style={{ color: 'var(--ink)' }}>{p?.callsign}</b> — look at the picture and tap the English word. Say
            it out loud at the same time; the crew is listening.
          </p>
          <button className="btn btn--lg" onClick={start}>
            Go!
          </button>
        </div>
      )}

      {/* One centred column: clock, picture, answers — all on the same axis,
          so nothing sits off to one side on a projector. */}
      {phase === 'run' && current && (
        <div className="center" style={{ width: '100%' }}>
          <div className="row" style={{ justifyContent: 'center', gap: 'calc(var(--u)*1.4)' }}>
            <CountdownRing seconds={60} running runKey={runKey} onDone={stop} size={92} />
            <span className="pill" style={{ fontSize: 'clamp(14px, 2.2vh, 20px)' }}>
              <Star size={15} /> {score}
            </span>
          </div>

          <div
            key={at}
            className="pop"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 'min(880px, 100%)',
              borderRadius: 'var(--r-lg)',
              background:
                flash === 'ok' ? 'rgba(63,191,90,.2)' : flash === 'no' ? 'rgba(244,68,46,.2)' : 'rgba(255,255,255,.05)',
              transition: 'background .15s',
              padding: 'calc(var(--u)*.8)',
            }}
          >
            <WordArt word={current.word} size="min(200px, 24vh)" float={false} />
          </div>

          <div className="opts opts--2">
            {current.options.map((o) => (
              <button key={o.id} className="opt" style={{ justifyContent: 'center' }} onClick={() => answer(o)}>
                {o.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'over' && (
        <div className="center">
          <div className="eyebrow">Time!</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(52px, 16vh, 130px)', lineHeight: 1 }}>
            {score}
          </div>
          <p className="hint">
            correct in 60 seconds{misses > 0 && ` · ${misses} misses`}
          </p>
          {score >= (p?.best ?? 0) && score > 0 && (
            <p style={{ color: 'var(--yellow)', fontFamily: 'var(--font-display)', fontSize: 'clamp(16px,2.6vh,24px)' }}>
              ⭐ New record for {p?.callsign}!
            </p>
          )}
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={start}>
              Beat it — run again
            </button>
            {state.pilots.length > 1 && (
              <button
                className="btn btn--ghost"
                onClick={tap(() => {
                  passTurn();
                  setPhase('ready');
                })}
              >
                Next pilot →
              </button>
            )}
          </div>
        </div>
      )}
    </Stage>
  );
}
