import { useEffect, useMemo, useState } from 'react';
import { GAP_FILL, WORDS, type Word } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Dots, Verdict, WordArt, shuffle, tap } from '../components/ui';
import { sfx, speak } from '../lib/audio';

/**
 * Controlled practice of the ten words in two rounds:
 * meaning → word, then the word back into a sentence.
 *
 * Both rounds are one item at a time and answered by tapping, never typing:
 * on a shared screen the whole class has to be able to call the answer out
 * while one person clicks.
 */
export function Vocab() {
  const [round, setRound] = useState<1 | 2>(1);
  const [r1, setR1] = useState(0);
  return round === 1 ? (
    <Meanings
      onDone={(right) => {
        setR1(right);
        setRound(2);
      }}
    />
  ) : (
    <Gaps carried={r1} onBack={() => setRound(1)} />
  );
}

/* ------------------------------------------------- round 1 · meanings */

function Meanings({ onDone }: { onDone: (right: number) => void }) {
  const { answer: answerTurn } = useGame();
  const order = useMemo(() => shuffle(WORDS, 0.42), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [marks, setMarks] = useState<(boolean | null)[]>(Array(WORDS.length).fill(null));

  const word = order[i];
  const options = useMemo(
    () => shuffle([word, ...shuffle(WORDS.filter((w) => w.id !== word.id), i * 0.17).slice(0, 3)], i * 0.53),
    [word, i],
  );

  const right = marks.filter((m) => m === true).length;
  const last = i === order.length - 1;

  const choose = (w: Word) => {
    if (picked) return;
    const ok = w.id === word.id;
    setPicked(w.id);
    ok ? sfx.right() : sfx.wrong();
    speak(word.word);
    setMarks((m) => m.map((v, j) => (j === i ? ok : v)));
    answerTurn(ok, { skill: 'vocabulary', word: word.id });
  };

  const go = () => {
    if (last) {
      sfx.star();
      onDone(right);
      return;
    }
    setI(i + 1);
    setPicked(null);
    sfx.tap();
  };

  return (
    <Stage
      title="Which word means this?"
      step={`${i + 1} / ${order.length}`}
      turn
      aside={<Dots marks={marks} at={i} />}
      footer={
        <button className="btn" onClick={go} disabled={!picked}>
          {last ? 'Round 2: sentences →' : 'Next →'}
        </button>
      }
    >
      <div className="center" style={{ maxHeight: '100%' }}>
        <p key={word.id} className="q pop" style={{ maxWidth: 'min(900px, 92vw)' }}>
          “{word.definition}”
        </p>

        <div className="opts opts--2">
          {options.map((o, n) => (
            <button
              key={o.id}
              className="opt"
              data-state={picked ? (o.id === word.id ? 'right' : picked === o.id ? 'wrong' : 'muted') : undefined}
              disabled={!!picked}
              onClick={() => choose(o)}
            >
              <span className="opt__key">{String.fromCharCode(65 + n)}</span>
              <span style={{ flex: 1 }}>{o.word}</span>
              {picked && o.id === word.id && <WordArt word={o} size="min(58px, 7vh)" float={false} />}
            </button>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------ round 2 · sentences */

function Gaps({ carried, onBack }: { carried: number; onBack: () => void }) {
  const { finish, answer: answerTurn } = useGame();
  const [i, setI] = useState(0);
  const [filled, setFilled] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  /** Whether this sentence has already cost the pilot a wrong chip. */
  const [slipped, setSlipped] = useState(false);
  const [marks, setMarks] = useState<(boolean | null)[]>(Array(GAP_FILL.length).fill(null));

  const item = GAP_FILL[i];
  const solved = filled.length === item.surface.length;
  const fullSentence = item.parts.map((part, c) => part + (item.surface[c] ?? '')).join('');
  const last = i === GAP_FILL.length - 1;

  /** The answers for this sentence, plus three decoys, in a stable order. */
  const bank = useMemo(() => {
    const others = GAP_FILL.flatMap((g) => g.surface).filter((s) => !item.surface.includes(s));
    return shuffle([...item.surface, ...shuffle(others, i * 0.31).slice(0, 4)], i * 0.77);
  }, [i, item]);

  const pick = (chip: string) => {
    if (solved) return;
    const expected = item.surface[filled.length];
    if (chip === expected) {
      sfx.right();
      const next = [...filled, chip];
      setFilled(next);
      if (next.length === item.surface.length) {
        const clean = !slipped;
        setMarks((m) => m.map((v, j) => (j === i ? clean : v)));
        answerTurn(clean, { skill: 'vocabulary', word: item.answers[0] });
      }
    } else {
      sfx.wrong();
      setWrong(chip);
      setSlipped(true);
      window.setTimeout(() => setWrong(null), 450);
      setMarks((m) => m.map((v, j) => (j === i ? false : v)));
    }
  };

  // The last sentence has no "next", so bank the score the moment it is solved.
  useEffect(() => {
    if (!last || !solved) return;
    sfx.star();
    finish('vocab', {
      right: carried + marks.filter((m) => m === true).length,
      total: WORDS.length + GAP_FILL.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, solved]);

  const go = () => {
    setI(i + 1);
    setFilled([]);
    setWrong(null);
    setSlipped(false);
    sfx.tap();
  };

  return (
    <Stage
      title="Complete the sentence"
      step={`${i + 1} / ${GAP_FILL.length}`}
      turn
      aside={
        <div className="row" style={{ gap: 8 }}>
          <Dots marks={marks} at={i} />
          <button className="btn btn--ghost btn--sm" onClick={tap(onBack)}>
            ← Round 1
          </button>
        </div>
      }
      footer={last && solved ? <NextButton label="To the story check" /> : (
        <button className="btn" onClick={go} disabled={!solved}>
          Next →
        </button>
      )}
    >
      <div className="center" style={{ maxHeight: '100%' }}>
        <p key={i} className="q pop" style={{ maxWidth: 'min(1000px, 94vw)', lineHeight: 1.5 }}>
          {item.parts.map((part, c) => (
            <span key={c}>
              {part}
              {c < item.surface.length && (
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: '5.5ch',
                    padding: '0 .3em',
                    borderBottom: `3px solid ${filled[c] ? 'var(--green)' : 'var(--phase)'}`,
                    color: filled[c] ? 'var(--green)' : 'transparent',
                  }}
                >
                  {filled[c] ?? '···'}
                </span>
              )}
            </span>
          ))}
        </p>

        <div className="row" style={{ justifyContent: 'center', maxWidth: 'min(900px, 94vw)' }}>
          {bank.map((chip) => (
            <button
              key={chip}
              className={`chip ${wrong === chip ? 'shake' : ''}`}
              style={wrong === chip ? { borderColor: 'var(--red)', background: 'rgba(244,68,46,.2)' } : undefined}
              disabled={filled.includes(chip) || solved}
              onClick={() => pick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {solved && <Verdict ok text={fullSentence} />}
      </div>
    </Stage>
  );
}
