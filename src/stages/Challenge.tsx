import { useEffect, useMemo, useState } from 'react';
import { WORDS, type Word } from '../data/content';
import { useGame } from '../state/game';
import { CountdownRing, PilotChip, StageHead, Star, StarBurst, WordArt, shuffle } from '../components/ui';
import { sfx, speak } from '../lib/audio';

type Game = 'menu' | 'freeze' | 'speed';

export function Challenge() {
  const { state, next } = useGame();
  const [game, setGame] = useState<Game>('menu');

  return (
    <>
      <StageHead
        eyebrow="Stage 2 · 14–19 min"
        title="Chameleon Challenge"
        sub="A chameleon does not speak — it becomes the word. Then: sixty seconds, ten words."
        right={
          game !== 'menu' ? (
            <button className="btn btn--ghost btn--sm" onClick={() => setGame('menu')}>
              ← Back
            </button>
          ) : undefined
        }
      />

      {game === 'menu' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <GameCard
            accent="var(--green)"
            label="Game 1 · whole crew, standing"
            title="Freeze!"
            text="A card appears. You have ten seconds to become the word with your body and your face. No words. On “freeze” everybody stops."
            cta="Start Freeze"
            onClick={() => setGame('freeze')}
          />
          <GameCard
            accent="var(--yellow)"
            label="Game 2 · one pilot at a time"
            title="Speed Round"
            text="Sixty seconds. Ten words on repeat. Tap the right word as fast as you can and set the crew record."
            cta="Start Speed Round"
            onClick={() => setGame('speed')}
          />
        </div>
      )}

      {game === 'freeze' && <Freeze onDone={() => setGame('menu')} />}
      {game === 'speed' && <SpeedRound />}

      <div className="btn-row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
        <span className="hint">
          Crew record: <b style={{ color: 'var(--yellow)' }}>{Math.max(0, ...state.pilots.map((p) => p.best))}</b> /
          10 words in 60 seconds
        </span>
        <button className="btn" onClick={next}>
          Next: Picture This →
        </button>
      </div>
    </>
  );
}

function GameCard({
  accent,
  label,
  title,
  text,
  cta,
  onClick,
}: {
  accent: string;
  label: string;
  title: string;
  text: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="tile-card" style={{ ['--accent' as string]: accent }}>
      <span className="card-label" style={{ ['--accent' as string]: accent }}>
        {label}
      </span>
      <h2 style={{ fontSize: 30, margin: '6px 0 10px' }}>{title}</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{text}</p>
      <button className="btn" onClick={onClick}>
        {cta}
      </button>
    </div>
  );
}

/* ================================================================== *
 * FREEZE — 10 words, 10 seconds each, no scoring
 * ================================================================== */

function Freeze({ onDone }: { onDone: () => void }) {
  const order = useMemo(() => shuffle(WORDS, Math.random()), []);
  const [i, setI] = useState(-1);
  const [phase, setPhase] = useState<'idle' | 'count' | 'freeze'>('idle');
  const [count, setCount] = useState(3);

  const word = order[Math.max(0, i)];

  useEffect(() => {
    if (phase !== 'count') return;
    if (count === 0) {
      setPhase('freeze');
      sfx.star();
      return;
    }
    const id = window.setTimeout(() => {
      sfx.tick();
      setCount((c) => c - 1);
    }, 900);
    return () => window.clearTimeout(id);
  }, [phase, count]);

  const start = () => {
    sfx.tap();
    setI(0);
    setPhase('idle');
  };

  const runWord = () => {
    setPhase('count');
    setCount(3);
    sfx.tap();
  };

  const nextWord = () => {
    if (i + 1 >= order.length) {
      sfx.fanfare();
      onDone();
      return;
    }
    setI(i + 1);
    setPhase('idle');
  };

  if (i < 0) {
    return (
      <div className="panel" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 32 }}>New rule: a chameleon does not speak.</h2>
        <p style={{ color: 'var(--ink-soft)', maxWidth: 560, margin: '10px auto 20px' }}>
          Everybody stand up. A card appears, then a countdown: <b>three… two… one… freeze!</b> Become the word with
          your body. Hold the pose. Ten words, no talking.
        </p>
        <button className="btn btn--lg" onClick={start}>
          Ready — first word
        </button>
      </div>
    );
  }

  return (
    <div className="panel" style={{ textAlign: 'center', minHeight: 420, display: 'grid', placeItems: 'center' }}>
      <div>
        <div className="hint" style={{ marginBottom: 10 }}>
          Word {i + 1} of {order.length}
        </div>

        {phase === 'idle' && (
          <div className="pop">
            <WordArt word={word} size={200} />
            <div className="word-title" style={{ marginTop: 8 }}>
              {word.word}
            </div>
            <button className="btn btn--lg" style={{ marginTop: 18 }} onClick={runWord}>
              Three, two, one…
            </button>
          </div>
        )}

        {phase === 'count' && (
          <div
            key={count}
            className="pop"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(90px, 22vw, 190px)', lineHeight: 1 }}
          >
            {count === 0 ? 'FREEZE!' : count}
          </div>
        )}

        {phase === 'freeze' && (
          <div className="pop">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(44px, 9vw, 86px)',
                color: 'var(--yellow)',
                textShadow: '0 0 40px rgba(255,201,60,.6)',
              }}
            >
              {word.word}
            </div>
            <p className="hint" style={{ marginTop: 6 }}>
              Hold the pose. Two seconds — that is the shot.
            </p>
            <button className="btn btn--lg" style={{ marginTop: 16 }} onClick={nextWord}>
              {i + 1 >= order.length ? 'Finish · 10 words in 5 minutes' : 'Next word →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== *
 * SPEED ROUND — 60 seconds, tap the word
 * ================================================================== */

interface Question {
  word: Word;
  options: Word[];
}

function buildQueue(): Question[] {
  const rounds: Question[] = [];
  for (let r = 0; r < 6; r++) {
    for (const w of shuffle(WORDS, Math.random())) {
      const others = shuffle(
        WORDS.filter((x) => x.id !== w.id),
        Math.random(),
      ).slice(0, 3);
      rounds.push({ word: w, options: shuffle([w, ...others], Math.random()) });
    }
  }
  return rounds;
}

function SpeedRound() {
  const { state, update } = useGame();
  const [pilot, setPilot] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'run' | 'over'>('ready');
  const [queue, setQueue] = useState<Question[]>([]);
  const [at, setAt] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null);
  const [burst, setBurst] = useState(0);
  const [runKey, setRunKey] = useState(0);

  const current = queue[at];
  const p = state.pilots[pilot];

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
      speak(current.word.word);
    }
    window.setTimeout(() => setFlash(null), 180);
    setAt((a) => a + 1);
  };

  const finish = () => {
    setPhase('over');
    sfx.fanfare();
    const record = score > (p?.best ?? 0);
    if (record) {
      setBurst((b) => b + 1);
      update((d) => {
        d.pilots[pilot].best = score;
      });
    }
  };

  return (
    <div className="panel">
      <StarBurst fire={burst} />

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="row" style={{ gap: 8 }}>
          {state.pilots.map((pp, i) => (
            <button
              key={pp.id}
              onClick={() => {
                if (phase === 'run') return;
                sfx.tap();
                setPilot(i);
                setPhase('ready');
              }}
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <PilotChip callsign={pp.callsign} colour={pp.colour} active={i === pilot} stars={pp.best} />
            </button>
          ))}
        </div>
        <span className="pill">
          <Star size={14} /> record {p?.best ?? 0}
        </span>
      </div>

      {phase === 'ready' && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <h2 style={{ fontSize: 32 }}>Sixty seconds. Ten words. Ready?</h2>
          <p className="hint" style={{ maxWidth: 520, margin: '8px auto 20px' }}>
            <b style={{ color: 'var(--ink)' }}>{p?.callsign}</b>, look at the picture and tap the English word. Say it
            out loud at the same time — the crew is listening.
          </p>
          <button className="btn btn--lg" onClick={start}>
            Go!
          </button>
        </div>
      )}

      {phase === 'run' && current && (
        <div
          className="grid"
          style={{ gridTemplateColumns: 'minmax(160px, 260px) 1fr', gap: 24, alignItems: 'center' }}
        >
          <div style={{ display: 'grid', placeItems: 'center', gap: 10 }}>
            <CountdownRing seconds={60} running runKey={runKey} onDone={finish} size={120} />
            <div className="pill">
              <Star size={14} /> {score}
            </div>
          </div>

          <div>
            <div
              key={at}
              className="pop"
              style={{
                display: 'grid',
                placeItems: 'center',
                background:
                  flash === 'ok'
                    ? 'rgba(63,191,90,.2)'
                    : flash === 'no'
                      ? 'rgba(244,68,46,.2)'
                      : 'rgba(255,255,255,.05)',
                borderRadius: 'var(--r-lg)',
                padding: 14,
                transition: 'background .15s',
              }}
            >
              <WordArt word={current.word} size={176} float={false} />
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginTop: 14 }}>
              {current.options.map((o) => (
                <button key={o.id} className="btn btn--ghost" onClick={() => answer(o)}>
                  {o.word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'over' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div className="eyebrow">Time!</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 12vw, 110px)', lineHeight: 1 }}>
            {score}
          </div>
          <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>
            correct in 60 seconds{misses > 0 && ` · ${misses} misses`}
          </p>
          {score >= (p?.best ?? 0) && score > 0 && (
            <p style={{ color: 'var(--yellow)', fontFamily: 'var(--font-display)', fontSize: 22 }}>
              ⭐ New record for {p?.callsign}!
            </p>
          )}
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 14 }}>
            <button className="btn" onClick={start}>
              Beat it — run again
            </button>
            {pilot + 1 < state.pilots.length && (
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setPilot(pilot + 1);
                  setPhase('ready');
                }}
              >
                Next pilot: {state.pilots[pilot + 1].callsign} →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
