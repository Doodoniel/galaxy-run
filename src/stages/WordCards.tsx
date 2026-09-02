import { useEffect, useState } from 'react';
import { WORDS } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Dots, SayIt, Syllables, Verdict, WordArt } from '../components/ui';
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

  return (
    <Stage
      title="Ten words"
      step={`${i + 1} / ${WORDS.length}`}
      aside={<Dots marks={marks} at={i} />}
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
        className="split"
        style={{
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
