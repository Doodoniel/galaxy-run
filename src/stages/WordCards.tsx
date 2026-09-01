import { useEffect, useState } from 'react';
import { WORDS } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Dots, SayIt, Syllables, Verdict, WordArt, shuffle, tap } from '../components/ui';
import { sfx, speak } from '../lib/audio';

const DRILLS = [
  { id: 'normal', label: 'Everybody', rate: 1 },
  { id: 'loud', label: 'Louder!', rate: 1 },
  { id: 'whisper', label: 'Whisper', rate: 0.8 },
  { id: 'robot', label: 'Like a robot', rate: 0.6 },
];

/**
 * Presentation of the ten words, one card at a time:
 * picture → guess → word + stress + audio → choral drill → concept check.
 * The card is never a list, so the projector always shows exactly one thing.
 */
export function WordCards() {
  const { finish } = useGame();
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [drills, setDrills] = useState<string[]>([]);
  const [ccq, setCcq] = useState<boolean | null>(null);
  const [marks, setMarks] = useState<(boolean | null)[]>(Array(WORDS.length).fill(null));
  const [freeze, setFreeze] = useState(false);

  const word = WORDS[i];
  const ccqRight = ccq !== null && ccq === word.ccq.answer;

  const reveal = () => {
    setRevealed(true);
    sfx.right();
    speak(word.word);
  };

  const answerCcq = (value: boolean) => {
    setCcq(value);
    const ok = value === word.ccq.answer;
    ok ? sfx.right() : sfx.wrong();
    setMarks((m) => m.map((v, j) => (j === i ? ok : v)));
  };

  const go = (delta: number) => {
    const n = i + delta;
    if (n < 0 || n >= WORDS.length) return;
    setI(n);
    setRevealed(false);
    setDrills([]);
    setCcq(null);
    sfx.tap();
  };

  const right = marks.filter((m) => m === true).length;
  const last = i === WORDS.length - 1;

  useEffect(() => {
    if (last && ccq !== null) finish('words', { right, total: WORDS.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, ccq]);

  if (freeze) return <FreezeRound onDone={() => setFreeze(false)} />;

  return (
    <Stage
      title="Ten words"
      step={`${i + 1} / ${WORDS.length}`}
      aside={
        <div className="row" style={{ gap: 8 }}>
          <Dots marks={marks} at={i} />
          <button className="btn btn--ghost btn--sm" onClick={tap(() => setFreeze(true))}>
            🧊 Freeze round
          </button>
        </div>
      }
      footer={
        <div className="btn-row">
          {i > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={() => go(-1)}>
              ← Back
            </button>
          )}
          {!last ? (
            <button className="btn" onClick={() => go(1)} disabled={ccq === null}>
              Next card →
            </button>
          ) : (
            <NextButton label="To the story" disabled={ccq === null} />
          )}
        </div>
      }
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(280px, 1fr)',
          gap: 'calc(var(--u) * 2)',
          alignItems: 'center',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <div key={word.id} className="flashcard pop" style={{ height: 'min(100%, 52vh)' }}>
          <WordArt word={word} size="min(260px, 32vh)" />
          <div className="flashcard__word" style={{ opacity: revealed ? 1 : 0.14 }}>
            {revealed ? word.word : '? ? ?'}
          </div>
        </div>

        <div className="col" style={{ minWidth: 0 }}>
          {!revealed ? (
            <>
              <h2 className="q" style={{ textAlign: 'left' }}>
                What is it?
              </h2>
              <p className="hint" style={{ margin: 0 }}>
                Look at the picture. Say your guess in English — then check.
              </p>
              <div>
                <button className="btn btn--lg" onClick={reveal}>
                  Show the word
                </button>
              </div>
            </>
          ) : (
            <div className="col pop" style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 'calc(var(--u)*1.1)' }}>
                <span
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4.4vh, 46px)', lineHeight: 1 }}
                >
                  {word.word}
                </span>
                <Syllables word={word} />
                <SayIt text={word.word} />
              </div>

              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 'clamp(14px, 2.1vh, 20px)' }}>
                {word.definition}
              </p>

              <div className="row" style={{ gap: 6 }}>
                {DRILLS.map((d) => {
                  const on = drills.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      className={`btn btn--sm ${on ? 'btn--good' : 'btn--ghost'}`}
                      onClick={() => {
                        sfx.tap();
                        speak(word.word, { rate: d.rate });
                        setDrills((prev) => (prev.includes(d.id) ? prev : [...prev, d.id]));
                      }}
                    >
                      {on ? '✓ ' : ''}
                      {d.label}
                    </button>
                  );
                })}
              </div>

              <div className="tile-card" style={{ padding: 'calc(var(--u)*1)' }}>
                <span className="card-label">Check it</span>
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', gap: 'calc(var(--u)*1)', marginTop: 4 }}
                >
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 2.4vh, 22px)' }}>
                    {word.ccq.q}
                  </b>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <button
                      className={`btn btn--sm ${ccq === true ? (word.ccq.answer ? 'btn--good' : 'btn--bad') : 'btn--ghost'}`}
                      onClick={() => answerCcq(true)}
                      disabled={ccq !== null}
                    >
                      Yes
                    </button>
                    <button
                      className={`btn btn--sm ${ccq === false ? (!word.ccq.answer ? 'btn--good' : 'btn--bad') : 'btn--ghost'}`}
                      onClick={() => answerCcq(false)}
                      disabled={ccq !== null}
                    >
                      No
                    </button>
                  </div>
                </div>
                {ccq !== null && (
                  <div style={{ marginTop: 'calc(var(--u)*.8)' }}>
                    <Verdict ok={ccqRight} text={word.ccq.because} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Stage>
  );
}

/* ================================================================== *
 * FREEZE — the whole crew becomes the word. No scoring, pure energy.
 * ================================================================== */

function FreezeRound({ onDone }: { onDone: () => void }) {
  const [order] = useState(() => shuffle(WORDS, Math.random()));
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'count' | 'freeze'>('idle');
  const [count, setCount] = useState(3);

  const word = order[i];

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

  return (
    <Stage
      title="Freeze!"
      step={`${i + 1} / ${order.length}`}
      hint="“A chameleon does not speak — it becomes the word. Ten seconds. Three, two, one — freeze!”"
      footer={
        <button className="btn btn--ghost" onClick={onDone}>
          ← Back to the cards
        </button>
      }
    >
      <div className="center">
        {phase === 'idle' && (
          <div className="center pop">
            <WordArt word={word} size="min(220px, 24vh)" />
            <div className="q">{word.word}</div>
            <button
              className="btn btn--lg"
              onClick={() => {
                setPhase('count');
                setCount(3);
                sfx.tap();
              }}
            >
              Three, two, one…
            </button>
          </div>
        )}

        {phase === 'count' && (
          <div
            key={count}
            className="pop"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(70px, 26vh, 220px)', lineHeight: 1 }}
          >
            {count === 0 ? 'FREEZE!' : count}
          </div>
        )}

        {phase === 'freeze' && (
          <div className="center pop">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(34px, 10vh, 96px)',
                color: 'var(--yellow)',
                textShadow: '0 0 40px rgba(255,201,60,.6)',
              }}
            >
              {word.word}
            </div>
            <p className="hint">Hold the pose. Two seconds — that is the shot.</p>
            <button
              className="btn btn--lg"
              onClick={() => {
                if (i + 1 >= order.length) {
                  sfx.fanfare();
                  onDone();
                  return;
                }
                setI(i + 1);
                setPhase('idle');
              }}
            >
              {i + 1 >= order.length ? 'Finish · 10 words' : 'Next word →'}
            </button>
          </div>
        )}
      </div>
    </Stage>
  );
}
