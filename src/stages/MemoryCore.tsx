import { useEffect, useState } from 'react';
import { WORDS, type Word } from '../data/content';
import { useGame } from '../state/game';
import { Stage } from '../components/Shell';
import { PilotChip, SayIt, StarBurst, Verdict, WordArt, shuffle, tap } from '../components/ui';
import { sfx, speak } from '../lib/audio';

/**
 * MEMORY CORE — the vocabulary trainer, open at any point in the mission.
 *
 * Each word carries a mastery level 0…5 per pilot. The queue always serves
 * the weakest word next and the drill gets harder as the level rises:
 * recognise the picture → recognise the word → the meaning → by ear → spell
 * it. A wrong answer drops the level, so a shaky word keeps coming back.
 *
 * The spelling drill only appears in solo mode — nobody types on a projector.
 */

const MAX = 5;

type Drill = 'pic2word' | 'word2pic' | 'def2word' | 'listen2word' | 'type';

const BY_LEVEL: Drill[][] = [
  ['pic2word'],
  ['pic2word', 'word2pic'],
  ['word2pic', 'def2word'],
  ['def2word', 'listen2word'],
  ['listen2word', 'type'],
  ['type', 'def2word'],
];

const clean = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z ]/g, '').replace(/^(to|a|an|the)\s+/, '').replace(/\s+/g, ' ');

export function MemoryCore({ onClose }: { onClose: () => void }) {
  const { state, typing, update } = useGame();
  const [who, setWho] = useState(0);
  const [current, setCurrent] = useState<{ word: Word; drill: Drill; options: Word[] } | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [burst, setBurst] = useState(0);
  const [streak, setStreak] = useState(0);

  const pilot = state.pilots[who];
  const level = (id: string) => pilot?.mastery?.[id] ?? 0;
  const learned = WORDS.filter((w) => level(w.id) >= MAX).length;

  const pickNext = () => {
    const sorted = [...WORDS].sort((a, b) => level(a.id) - level(b.id) || Math.random() - 0.5);
    const pool = sorted.slice(0, 3).filter((w) => w.id !== current?.word.id);
    const word = (pool.length ? pool : sorted)[Math.floor(Math.random() * Math.max(1, pool.length))] ?? sorted[0];
    let drills = BY_LEVEL[Math.min(MAX, level(word.id))];
    if (!typing) drills = drills.filter((d) => d !== 'type');
    if (!drills.length) drills = ['def2word'];
    const drill = drills[Math.floor(Math.random() * drills.length)];
    const others = shuffle(WORDS.filter((w) => w.id !== word.id), Math.random()).slice(0, 3);
    setCurrent({ word, drill, options: shuffle([word, ...others], Math.random()) });
    setAnswer(null);
    setTyped('');
    if (drill === 'listen2word') window.setTimeout(() => speak(word.word), 320);
  };

  useEffect(() => {
    setCurrent(null);
  }, [who]);

  useEffect(() => {
    if (!current) pickNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const grade = (ok: boolean) => {
    if (!current) return;
    if (ok) {
      sfx.right();
      setStreak((s) => s + 1);
      const before = level(current.word.id);
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

  if (!pilot || !current) return null;

  const choose = (w: Word) => {
    if (answer) return;
    setAnswer(w.id);
    grade(w.id === current.word.id);
  };

  const submit = () => {
    if (answer) return;
    const ok = clean(typed) === clean(current.word.word);
    setAnswer(ok ? current.word.id : 'typed-wrong');
    grade(ok);
  };

  const optState = (w: Word) =>
    !answer ? undefined : w.id === current.word.id ? 'right' : answer === w.id ? 'wrong' : 'muted';

  const prompt = {
    pic2word: 'What is it?',
    word2pic: 'Which picture is it?',
    def2word: 'Which word means this?',
    listen2word: 'Listen. Which word do you hear?',
    type: 'Type the word.',
  }[current.drill];

  return (
    <Stage
      title="Memory Core"
      step={`${learned} / 10 mastered`}
      hint="Ten words, five levels each. The weakest word always comes back first."
      aside={
        <div className="row" style={{ gap: 6 }}>
          {streak >= 3 && <span className="pill" style={{ color: 'var(--orange)' }}>🔥 {streak}</span>}
          {state.pilots.length > 1 &&
            state.pilots.map((p, i) => (
              <PilotChip key={p.id} callsign={p.callsign} colour={p.colour} active={i === who} onClick={tap(() => setWho(i))} />
            ))}
          <button className="btn btn--ghost btn--sm" onClick={tap(onClose)}>
            ✕ Close
          </button>
        </div>
      }
      footer={
        answer ? (
          <div className="btn-row">
            <SayIt text={current.word.word} />
            <button className="btn" onClick={pickNext}>
              Next word →
            </button>
          </div>
        ) : undefined
      }
    >
      <StarBurst fire={burst} />

      <div className="col" style={{ height: '100%', minHeight: 0 }}>
        {/* word bank */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
          {WORDS.map((w) => {
            const m = level(w.id);
            return (
              <div
                key={w.id}
                title={`${w.word} — level ${m}/5`}
                style={{
                  padding: '4px 6px',
                  borderRadius: 8,
                  background: m >= MAX ? 'rgba(63,191,90,.18)' : 'rgba(255,255,255,.05)',
                  border: `1px solid ${m >= MAX ? 'var(--green)' : 'var(--card-line)'}`,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.3vh, 12px)',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {w.word}
                </div>
                <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                  {Array.from({ length: MAX }, (_, n) => (
                    <i
                      key={n}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        background: n < m ? (m >= MAX ? 'var(--green)' : 'var(--violet)') : 'rgba(255,255,255,.14)',
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* the drill */}
        <div className="center" style={{ flex: 1, minHeight: 0, justifyContent: 'center' }}>
          <h2 className="q q--sm">{prompt}</h2>

          {current.drill === 'pic2word' && <WordArt word={current.word} size="min(170px, 22vh)" />}
          {current.drill === 'word2pic' && <div className="q">{current.word.word}</div>}
          {current.drill === 'def2word' && (
            <p className="q q--sm" style={{ maxWidth: 'min(800px, 92vw)' }}>
              “{current.word.definition}”
            </p>
          )}
          {current.drill === 'listen2word' && (
            <button className="btn btn--lg" onClick={() => speak(current.word.word)}>
              🔊 Play again
            </button>
          )}
          {current.drill === 'type' && (
            <>
              <WordArt word={current.word} size="min(130px, 18vh)" />
              <p className="hint" style={{ margin: 0 }}>
                {current.word.definition}
              </p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <input
                  className="field"
                  style={{ maxWidth: 260, textAlign: 'center', fontSize: 'clamp(15px,2.3vh,20px)' }}
                  placeholder="type it"
                  value={typed}
                  autoFocus
                  disabled={!!answer}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <button className="btn" onClick={submit} disabled={!!answer || !typed.trim()}>
                  Check
                </button>
              </div>
            </>
          )}

          {current.drill !== 'type' && (
            <div className={`opts ${current.drill === 'word2pic' ? '' : 'opts--2'}`} style={
              current.drill === 'word2pic' ? { gridTemplateColumns: 'repeat(4, 1fr)' } : undefined
            }>
              {current.options.map((o) => (
                <button
                  key={o.id}
                  className="opt"
                  data-state={optState(o)}
                  disabled={!!answer}
                  onClick={() => choose(o)}
                  style={{ justifyContent: 'center' }}
                >
                  {current.drill === 'word2pic' ? <WordArt word={o} size="min(120px, 16vh)" float={false} /> : o.word}
                </button>
              ))}
            </div>
          )}

          {answer && (
            <Verdict
              ok={answer === current.word.id}
              text={
                answer === current.word.id
                  ? `${current.word.word} — ${current.word.definition}`
                  : `The word is “${current.word.word}”`
              }
            />
          )}
        </div>
      </div>
    </Stage>
  );
}
