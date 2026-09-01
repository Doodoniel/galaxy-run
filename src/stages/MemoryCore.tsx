import { useEffect, useState } from 'react';
import { WORDS, type Word } from '../data/content';
import { useGame } from '../state/game';
import { PilotChip, SayIt, StageHead, StarBurst, Verdict, WordArt, shuffle } from '../components/ui';
import { sfx, speak } from '../lib/audio';

/**
 * MEMORY CORE — the vocabulary trainer.
 *
 * Each word carries a mastery level 0…5 per pilot. The queue always serves the
 * weakest word next, and the exercise type gets harder as mastery grows:
 * recognise the picture → recognise the word → the meaning → by ear → spell it.
 * A wrong answer drops the level, so a shaky word keeps coming back.
 */

const MAX = 5;

type Drill = 'pic2word' | 'word2pic' | 'def2word' | 'listen2word' | 'type';

const DRILL_FOR_LEVEL: Drill[][] = [
  ['pic2word'],
  ['pic2word', 'word2pic'],
  ['word2pic', 'def2word'],
  ['def2word', 'listen2word'],
  ['listen2word', 'type'],
  ['type', 'def2word'],
];

const TIERS = [
  { at: 2, label: 'I can say it' },
  { at: 4, label: 'I know what it means' },
  { at: 5, label: 'I can use it in a sentence' },
];

const clean = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z ]/g, '').replace(/^(to|a|an|the)\s+/, '').replace(/\s+/g, ' ');

export function MemoryCore({ onClose }: { onClose?: () => void }) {
  const { state, update } = useGame();
  const [who, setWho] = useState(0);
  const [current, setCurrent] = useState<{ word: Word; drill: Drill; options: Word[] } | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [burst, setBurst] = useState(0);
  const [streak, setStreak] = useState(0);
  const [session, setSession] = useState({ seen: 0, right: 0 });

  const pilot = state.pilots[who];
  const mastery = (id: string) => pilot?.mastery?.[id] ?? 0;
  const total = WORDS.reduce((s, w) => s + mastery(w.id), 0);
  const learned = WORDS.filter((w) => mastery(w.id) >= MAX).length;

  const pickNext = () => {
    const sorted = [...WORDS].sort((a, b) => {
      const d = mastery(a.id) - mastery(b.id);
      return d !== 0 ? d : Math.random() - 0.5;
    });
    // Take one of the three weakest so the same card never repeats twice in a row.
    const pool = sorted.slice(0, 3).filter((w) => w.id !== current?.word.id);
    const word = (pool.length ? pool : sorted)[Math.floor(Math.random() * Math.max(1, pool.length))] ?? sorted[0];
    const level = Math.min(MAX, mastery(word.id));
    const drills = DRILL_FOR_LEVEL[level];
    const drill = drills[Math.floor(Math.random() * drills.length)];
    const others = shuffle(
      WORDS.filter((w) => w.id !== word.id),
      Math.random(),
    ).slice(0, 3);
    setCurrent({ word, drill, options: shuffle([word, ...others], Math.random()) });
    setAnswer(null);
    setTyped('');
    if (drill === 'listen2word') window.setTimeout(() => speak(word.word), 320);
  };

  useEffect(() => {
    if (!current) pickNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who]);

  const grade = (ok: boolean) => {
    if (!current) return;
    setSession((s) => ({ seen: s.seen + 1, right: s.right + (ok ? 1 : 0) }));
    if (ok) {
      sfx.right();
      setStreak((s) => s + 1);
      const before = mastery(current.word.id);
      update((d) => {
        const m = d.pilots[who].mastery;
        m[current.word.id] = Math.min(MAX, (m[current.word.id] ?? 0) + 1);
      });
      if (before + 1 >= MAX) {
        setBurst((b) => b + 1);
        sfx.star();
      }
    } else {
      sfx.wrong();
      setStreak(0);
      update((d) => {
        const m = d.pilots[who].mastery;
        m[current.word.id] = Math.max(0, (m[current.word.id] ?? 0) - 1);
      });
      speak(current.word.word);
    }
  };

  const choose = (w: Word) => {
    if (answer) return;
    setAnswer(w.id);
    grade(w.id === current!.word.id);
  };

  const submitTyped = () => {
    if (answer) return;
    const ok = clean(typed) === clean(current!.word.word);
    setAnswer(ok ? current!.word.id : 'typed-wrong');
    grade(ok);
  };

  if (!pilot) return null;

  return (
    <>
      <StarBurst fire={burst} />
      <StageHead
        eyebrow="Vocabulary trainer · play it any time"
        title="Memory Core"
        sub="Ten words, five levels each. The weakest word always comes back first."
        right={
          <div className="row" style={{ gap: 6 }}>
            {state.pilots.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  sfx.tap();
                  setWho(i);
                  setCurrent(null);
                }}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                <PilotChip callsign={p.callsign} colour={p.colour} active={i === who} compact />
              </button>
            ))}
            {onClose && (
              <button className="btn btn--ghost btn--sm" onClick={onClose}>
                ✕ Close
              </button>
            )}
          </div>
        }
      />

      {/* ------------------------------------------------------- progress */}
      <div className="panel panel--tight" style={{ marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="eyebrow">Word bank · {learned}/10 mastered</span>
          <span className="row" style={{ gap: 8 }}>
            {streak >= 3 && <span className="pill" style={{ color: 'var(--orange)' }}>🔥 {streak} in a row</span>}
            <span className="pill">
              {session.right}/{session.seen} this session
            </span>
          </span>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 8 }}
        >
          {WORDS.map((w) => {
            const m = mastery(w.id);
            return (
              <div
                key={w.id}
                title={`${w.word} — level ${m}/5`}
                style={{
                  padding: '6px 8px',
                  borderRadius: 10,
                  background: m >= MAX ? 'rgba(63,191,90,.18)' : 'rgba(255,255,255,.05)',
                  border: `1px solid ${m >= MAX ? 'var(--green)' : 'var(--card-line)'}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {w.word}
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                  {Array.from({ length: MAX }, (_, i) => (
                    <i
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: i < m ? (m >= MAX ? 'var(--green)' : 'var(--violet)') : 'rgba(255,255,255,.14)',
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="row" style={{ gap: 10, marginTop: 10 }}>
          {TIERS.map((t) => (
            <span key={t.label} className="pill" style={{ fontSize: 12 }}>
              {WORDS.filter((w) => mastery(w.id) >= t.at).length}/10 · {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- drill */}
      {current && (
        <div className="panel" key={`${current.word.id}-${session.seen}`}>
          <DrillView
            drill={current.drill}
            word={current.word}
            options={current.options}
            answer={answer}
            typed={typed}
            setTyped={setTyped}
            onChoose={choose}
            onSubmit={submitTyped}
          />

          {answer && (
            <div className="stack pop" style={{ marginTop: 18 }}>
              <Verdict
                ok={answer === current.word.id}
                text={
                  answer === current.word.id
                    ? `${current.word.word} — ${current.word.definition}`
                    : `The word is “${current.word.word}” — ${current.word.definition}`
                }
              />
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontStyle: 'italic' }}>{current.word.example}</p>
              <div className="row" style={{ gap: 10 }}>
                <SayIt text={current.word.word} />
                <button className="btn" onClick={pickNext}>
                  Next word →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {total >= WORDS.length * MAX && (
        <div className="panel pop" style={{ marginTop: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 50 }}>🏆</div>
          <h2 style={{ fontSize: 28 }}>Word bank complete, {pilot.callsign}!</h2>
          <p className="hint">All ten words at level 5. Try them in a sentence on a STAR tile.</p>
        </div>
      )}
    </>
  );
}

function DrillView({
  drill,
  word,
  options,
  answer,
  typed,
  setTyped,
  onChoose,
  onSubmit,
}: {
  drill: Drill;
  word: Word;
  options: Word[];
  answer: string | null;
  typed: string;
  setTyped: (v: string) => void;
  onChoose: (w: Word) => void;
  onSubmit: () => void;
}) {
  const prompt = {
    pic2word: 'What is it?',
    word2pic: 'Which picture is it?',
    def2word: 'Which word means this?',
    listen2word: 'Listen. Which word do you hear?',
    type: 'Type the word.',
  }[drill];

  const state = (w: Word) =>
    !answer ? undefined : w.id === word.id ? 'right' : answer === w.id ? 'wrong' : 'muted';

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 'clamp(20px, 3.2vw, 28px)' }}>{prompt}</h2>
        <span className="pill">{drill === 'type' ? 'level 5' : `drill: ${drill.replace('2', ' → ')}`}</span>
      </div>

      {drill === 'pic2word' && (
        <div style={{ display: 'grid', placeItems: 'center', gap: 18 }}>
          <WordArt word={word} size={180} />
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', width: '100%' }}>
            {options.map((o) => (
              <button key={o.id} className="choice" data-state={state(o)} onClick={() => onChoose(o)} disabled={!!answer}>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 18 }}>
                  {o.word}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {drill === 'word2pic' && (
        <div style={{ display: 'grid', placeItems: 'center', gap: 18 }}>
          <div className="word-title">{word.word}</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', width: '100%' }}>
            {options.map((o) => (
              <button
                key={o.id}
                className="choice"
                data-state={state(o)}
                onClick={() => onChoose(o)}
                disabled={!!answer}
                style={{ justifyContent: 'center', padding: 10 }}
              >
                <WordArt word={o} size={110} float={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {drill === 'def2word' && (
        <div className="stack">
          <p style={{ fontSize: 'clamp(19px, 3vw, 26px)', textAlign: 'center', margin: '8px 0 14px' }}>
            “{word.definition}”
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {options.map((o) => (
              <button key={o.id} className="choice" data-state={state(o)} onClick={() => onChoose(o)} disabled={!!answer}>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 18 }}>
                  {o.word}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {drill === 'listen2word' && (
        <div className="stack" style={{ alignItems: 'center' }}>
          <button className="btn btn--lg" onClick={() => speak(word.word)}>
            🔊 Play again
          </button>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', width: '100%' }}>
            {options.map((o) => (
              <button key={o.id} className="choice" data-state={state(o)} onClick={() => onChoose(o)} disabled={!!answer}>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 18 }}>
                  {o.word}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {drill === 'type' && (
        <div className="stack" style={{ alignItems: 'center' }}>
          <WordArt word={word} size={150} />
          <p style={{ color: 'var(--ink-soft)', textAlign: 'center', margin: 0 }}>{word.definition}</p>
          <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
            <input
              className="field"
              style={{ maxWidth: 280, textAlign: 'center', fontSize: 20 }}
              placeholder="type it"
              value={typed}
              autoFocus
              disabled={!!answer}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
            <button className="btn" onClick={onSubmit} disabled={!!answer || !typed.trim()}>
              Check
            </button>
          </div>
          {!answer && (
            <span className="hint">
              First letter: <b>{word.word[0]}</b> · {word.word.replace(/[a-z]/g, '_').replace(/_/g, '·')} letters
            </span>
          )}
        </div>
      )}
    </>
  );
}
