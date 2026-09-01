import { useMemo, useRef, useState } from 'react';
import { GAP_FILL, USEFUL_PHRASES, WORDS, type Word } from '../data/content';
import { useGame } from '../state/game';
import { Progress, SayIt, StageHead, Star, Syllables, Verdict, WordArt, shuffle } from '../components/ui';
import { sfx, speak } from '../lib/audio';

type Step = 'cards' | 'match' | 'gaps';

const STEPS: { id: Step; label: string }[] = [
  { id: 'cards', label: '1 · Flashcards' },
  { id: 'match', label: '2 · Match' },
  { id: 'gaps', label: '3 · Complete' },
];

export function WordLab() {
  const { state, next } = useGame();
  const [step, setStep] = useState<Step>('cards');

  const introduced = state.wordlab.introduced.length;
  const matched = Object.values(state.wordlab.matched).filter(Boolean).length;

  return (
    <>
      <StageHead
        eyebrow="Stage 1 · 4–14 min"
        title="Word Lab"
        sub="Ten words: see them, say them, then use them."
        right={
          <div className="row" style={{ gap: 6 }}>
            {STEPS.map((s) => (
              <button
                key={s.id}
                className={`btn btn--sm ${step === s.id ? '' : 'btn--ghost'}`}
                onClick={() => {
                  sfx.tap();
                  setStep(s.id);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      />

      {step === 'cards' && <Flashcards onDone={() => setStep('match')} />}
      {step === 'match' && <MatchTask onDone={() => setStep('gaps')} />}
      {step === 'gaps' && <GapTask />}

      <div className="btn-row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
        <span className="hint">
          {introduced}/10 words introduced · {matched}/10 matched
        </span>
        <button className="btn" onClick={next}>
          Next: Chameleon Challenge →
        </button>
      </div>
    </>
  );
}

/* ================================================================== *
 * 1 · FLASHCARDS — recognise, drill, concept-check
 * ================================================================== */

const DRILLS = [
  { id: 'normal', label: 'Everybody', hint: 'normal voice' },
  { id: 'loud', label: 'Louder!', hint: 'shout it' },
  { id: 'whisper', label: 'Whisper', hint: 'very quietly' },
  { id: 'robot', label: 'Like a robot', hint: 'ro-bot voice' },
];

function Flashcards({ onDone }: { onDone: () => void }) {
  const { update } = useGame();
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [drills, setDrills] = useState<string[]>([]);
  const [ccq, setCcq] = useState<boolean | null>(null);

  const word = WORDS[i];
  const ccqRight = ccq !== null && ccq === word.ccq.answer;

  const reveal = () => {
    setRevealed(true);
    sfx.right();
    speak(word.word);
    update((d) => {
      if (!d.wordlab.introduced.includes(word.id)) d.wordlab.introduced.push(word.id);
    });
  };

  const answerCcq = (value: boolean) => {
    setCcq(value);
    if (value === word.ccq.answer) {
      sfx.right();
      update((d) => {
        d.wordlab.ccq[word.id] = true;
      });
    } else {
      sfx.wrong();
    }
  };

  const go = (delta: number) => {
    const n = i + delta;
    if (n < 0) return;
    if (n >= WORDS.length) {
      sfx.star();
      onDone();
      return;
    }
    setI(n);
    setRevealed(false);
    setDrills([]);
    setCcq(null);
    sfx.move();
  };

  return (
    <div className="panel">
      <Progress value={i + (revealed ? 1 : 0)} max={WORDS.length} />

      <div
        className="grid"
        style={{ gridTemplateColumns: 'minmax(200px, 320px) 1fr', gap: 26, marginTop: 20, alignItems: 'center' }}
      >
        <div
          key={word.id}
          className="pop"
          style={{
            background: 'linear-gradient(180deg,#fbfaff,#e9e4f5)',
            borderRadius: 'var(--r-lg)',
            padding: 18,
            display: 'grid',
            placeItems: 'center',
            aspectRatio: '3 / 4',
            boxShadow: 'var(--shadow-lift)',
            border: '3px solid rgba(255,255,255,.6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 10,
              border: '2px dashed rgba(108,43,217,.28)',
              borderRadius: 'var(--r-md)',
            }}
          />
          <WordArt word={word} size={210} />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3vw, 32px)',
              color: revealed ? '#1a0a33' : 'transparent',
              textShadow: revealed ? 'none' : '0 0 18px rgba(26,10,51,.55)',
              transition: 'color .3s',
              userSelect: revealed ? 'auto' : 'none',
            }}
          >
            {revealed ? word.word : '? ? ? ?'}
          </div>
        </div>

        <div className="stack">
          {!revealed ? (
            <>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)' }}>Card {i + 1}. What is it?</h2>
              <p className="hint">Look at the picture. Say your guess in English — then check.</p>
              <div className="btn-row">
                <button className="btn btn--lg" onClick={reveal}>
                  Show the word
                </button>
                {i > 0 && (
                  <button className="btn btn--ghost btn--sm" onClick={() => go(-1)}>
                    ← Back
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="stack pop">
              <div>
                <div className="word-title">{word.word}</div>
                <div className="row" style={{ gap: 14, marginTop: 10 }}>
                  <Syllables word={word} />
                  <SayIt text={word.word} />
                </div>
              </div>

              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 18 }}>{word.definition}</p>

              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Choral drill
                </div>
                <div className="row" style={{ gap: 8 }}>
                  {DRILLS.map((d) => {
                    const on = drills.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        className={`btn btn--sm ${on ? 'btn--good' : 'btn--ghost'}`}
                        onClick={() => {
                          sfx.tap();
                          speak(word.word, { rate: d.id === 'robot' ? 0.6 : d.id === 'whisper' ? 0.8 : 1 });
                          setDrills((prev) => (prev.includes(d.id) ? prev : [...prev, d.id]));
                        }}
                        title={d.hint}
                      >
                        {on ? '✓ ' : ''}
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="tile-card" style={{ padding: 16 }}>
                <span className="card-label">Check your understanding</span>
                <div style={{ fontSize: 20, margin: '6px 0 12px', fontFamily: 'var(--font-display)' }}>
                  {word.ccq.q}
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <button
                    className={`btn ${ccq === true ? (word.ccq.answer ? 'btn--good' : 'btn--bad') : 'btn--ghost'}`}
                    onClick={() => answerCcq(true)}
                    disabled={ccq !== null}
                  >
                    Yes
                  </button>
                  <button
                    className={`btn ${ccq === false ? (!word.ccq.answer ? 'btn--good' : 'btn--bad') : 'btn--ghost'}`}
                    onClick={() => answerCcq(false)}
                    disabled={ccq !== null}
                  >
                    No
                  </button>
                </div>
                {ccq !== null && (
                  <div style={{ marginTop: 12 }}>
                    <Verdict ok={ccqRight} text={word.ccq.because} />
                  </div>
                )}
              </div>

              <div className="btn-row">
                <button className="btn" onClick={() => go(1)} disabled={ccq === null}>
                  {i === WORDS.length - 1 ? 'All ten words ✓' : 'Next card →'}
                </button>
                {i > 0 && (
                  <button className="btn btn--ghost btn--sm" onClick={() => go(-1)}>
                    ← Back
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 2 · MATCH — worksheet 1, task A
 * ================================================================== */

function MatchTask({ onDone }: { onDone: () => void }) {
  const { state, update } = useGame();
  const [picked, setPicked] = useState<Word | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const defs = useMemo(() => shuffle(WORDS, 0.42), []);
  const done = state.wordlab.matched;
  const solved = Object.values(done).filter(Boolean).length;

  const tryMatch = (target: Word) => {
    if (!picked) return;
    if (picked.id === target.id) {
      sfx.right();
      setPicked(null);
      update((d) => {
        d.wordlab.matched[target.id] = true;
      });
      if (solved + 1 === WORDS.length) window.setTimeout(() => sfx.star(), 260);
    } else {
      sfx.wrong();
      setWrong(target.id);
      window.setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Task A</div>
          <h2 style={{ fontSize: 24 }}>Match the word to the meaning</h2>
        </div>
        <span className="pill">
          <Star size={14} /> {solved}/10
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        <div className="stack" style={{ gap: 8 }}>
          {WORDS.map((w) => {
            const isDone = !!done[w.id];
            return (
              <button
                key={w.id}
                className="choice"
                data-state={isDone ? 'right' : picked?.id === w.id ? undefined : undefined}
                style={{
                  borderColor: picked?.id === w.id ? 'var(--violet)' : undefined,
                  background: picked?.id === w.id ? 'rgba(168,85,247,.22)' : undefined,
                  opacity: isDone ? 0.55 : 1,
                }}
                disabled={isDone}
                onClick={() => {
                  sfx.tap();
                  setPicked(w);
                  speak(w.word);
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}art/${w.image}.webp`}
                  alt=""
                  width={34}
                  height={34}
                  style={{ objectFit: 'contain', flex: 'none' }}
                />
                <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 18 }}>{w.word}</span>
                {isDone && <span className="star">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          {defs.map((w, idx) => {
            const isDone = !!done[w.id];
            return (
              <button
                key={w.id}
                className={`choice ${wrong === w.id ? 'shake' : ''}`}
                data-state={isDone ? 'right' : wrong === w.id ? 'wrong' : undefined}
                disabled={isDone || !picked}
                onClick={() => tryMatch(w)}
                style={{ opacity: isDone ? 0.55 : 1 }}
              >
                <span className="choice__key">{String.fromCharCode(97 + idx)}</span>
                <span style={{ flex: 1 }}>{w.definition}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="hint" style={{ marginTop: 14 }}>
        {picked ? (
          <>
            Now find the meaning of <b style={{ color: 'var(--violet)' }}>{picked.word}</b>.
          </>
        ) : (
          'Tap a word on the left, then its meaning on the right.'
        )}
      </p>

      {solved === WORDS.length && (
        <div className="pop" style={{ marginTop: 16 }}>
          <Verdict ok text="All ten matched. Ready for the sentences?" />
          <button className="btn" style={{ marginTop: 12 }} onClick={onDone}>
            Task B: complete the sentences →
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * 3 · GAPS — worksheet 1, task B
 * ================================================================== */

const normalise = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]/g, '')
    .replace(/^(to|a|an|the)\s+/, '');

function GapTask() {
  const { state, update } = useGame();
  const focused = useRef<string | null>(null);
  const gaps = state.wordlab.gaps;
  const checked = state.wordlab.gapsChecked;

  const key = (row: number, col: number) => `${row}-${col}`;

  const isRight = (row: number, col: number) => {
    const expect = GAP_FILL[row].surface[col];
    return normalise(gaps[key(row, col)] ?? '') === normalise(expect);
  };

  const totalGaps = GAP_FILL.reduce((n, g) => n + g.surface.length, 0);
  const rightCount = GAP_FILL.reduce(
    (n, g, r) => n + g.surface.filter((_, c) => isRight(r, c)).length,
    0,
  );

  const bank = useMemo(() => shuffle(GAP_FILL.flatMap((g) => g.surface), 0.77), []);

  const fillFocused = (value: string) => {
    const k = focused.current;
    if (!k) return;
    sfx.tap();
    update((d) => {
      d.wordlab.gaps[k] = value;
    });
  };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Task B</div>
          <h2 style={{ fontSize: 24 }}>Complete the sentences</h2>
        </div>
        <span className="pill">
          {rightCount}/{totalGaps} correct
        </span>
      </div>

      <div className="row" style={{ gap: 6, marginBottom: 18 }}>
        {bank.map((w, i) => (
          <button key={`${w}-${i}`} className="pill" onMouseDown={(e) => e.preventDefault()} onClick={() => fillFocused(w)}>
            {w}
          </button>
        ))}
      </div>

      <ol className="stack" style={{ gap: 14, paddingLeft: 22, margin: 0 }}>
        {GAP_FILL.map((g, r) => (
          <li key={r} style={{ fontSize: 'clamp(16px, 2.2vw, 19px)', lineHeight: 2 }}>
            {g.parts.map((part, c) => (
              <span key={c}>
                {part}
                {c < g.surface.length && (
                  <input
                    className="gap-input"
                    value={gaps[key(r, c)] ?? ''}
                    data-ok={checked ? isRight(r, c) : undefined}
                    onFocus={() => (focused.current = key(r, c))}
                    onChange={(e) =>
                      update((d) => {
                        d.wordlab.gaps[key(r, c)] = e.target.value;
                      })
                    }
                    aria-label={`Gap ${r + 1}.${c + 1}`}
                  />
                )}
              </span>
            ))}
          </li>
        ))}
      </ol>

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button
          className="btn"
          onClick={() => {
            update((d) => {
              d.wordlab.gapsChecked = true;
            });
            rightCount === totalGaps ? sfx.star() : sfx.tap();
          }}
        >
          Check my answers
        </button>
        {checked && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() =>
              update((d) => {
                d.wordlab.gapsChecked = false;
                d.wordlab.gaps = {};
              })
            }
          >
            Clear and try again
          </button>
        )}
      </div>

      {checked && (
        <div style={{ marginTop: 14 }}>
          <Verdict
            ok={rightCount === totalGaps}
            text={
              rightCount === totalGaps
                ? 'Every sentence is correct. Word Lab complete!'
                : `${rightCount} of ${totalGaps} correct. Fix the red ones and check again.`
            }
          />
        </div>
      )}

      <div className="tile-card" style={{ marginTop: 20, ['--accent' as string]: 'var(--cyan)' }}>
        <span className="card-label" style={{ ['--accent' as string]: 'var(--cyan)' }}>
          Useful — keep these on screen
        </span>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          {USEFUL_PHRASES.map((p) => (
            <span key={p} className="pill">
              {p}
            </span>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 8, marginBottom: 0 }}>
          You will need these to describe words on the WORD tiles in Galaxy Run.
        </p>
      </div>
    </div>
  );
}
