import { useEffect, useMemo, useRef, useState } from 'react';
import { METEOR_CARDS, TRUE_FALSE, type MeteorCard } from '../data/content';
import { useGame } from '../state/game';
import { StageHead, Star, StarBurst, Verdict, shuffle } from '../components/ui';
import { sfx } from '../lib/audio';

/** The seven meteors the crew destroys here; Galaxy Run keeps the rest. */
export const STORYCHECK_METEORS = METEOR_CARDS.slice(0, 7);

type Task = 'tf' | 'meteor';

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function StoryCheck() {
  const { state, next } = useGame();
  const [task, setTask] = useState<Task>('tf');

  return (
    <>
      <StageHead
        eyebrow="Stage 4 · 29–36 min"
        title="Story Check"
        sub="True or false? Then destroy the meteors — every sentence has exactly one mistake."
        right={
          <div className="row" style={{ gap: 6 }}>
            <button className={`btn btn--sm ${task === 'tf' ? '' : 'btn--ghost'}`} onClick={() => setTask('tf')}>
              A · True / False
            </button>
            <button className={`btn btn--sm ${task === 'meteor' ? '' : 'btn--ghost'}`} onClick={() => setTask('meteor')}>
              B · Meteor alert
            </button>
          </div>
        }
      />

      {task === 'tf' ? <TrueFalse onDone={() => setTask('meteor')} /> : <MeteorAlert />}

      <div className="btn-row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
        <span className="hint">
          Meteors destroyed: {state.storycheck.meteorsFixed.length}/{STORYCHECK_METEORS.length}
        </span>
        <button className="btn" onClick={next}>
          Next: Galaxy Run →
        </button>
      </div>
    </>
  );
}

/* ================================================================== *
 * A · TRUE / FALSE
 * ================================================================== */

function TrueFalse({ onDone }: { onDone: () => void }) {
  const { state, update } = useGame();
  const started = useRef<number>(Date.now());
  const [now, setNow] = useState(Date.now());
  const checked = state.storycheck.tfChecked;

  useEffect(() => {
    if (checked) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [checked]);

  const answers = state.storycheck.tf;
  const answered = answers.filter((a) => a !== null).length;
  const right = TRUE_FALSE.filter((t, i) => answers[i] === t.answer).length;
  const elapsed = checked ? state.storycheck.tfMs : now - started.current;

  const pick = (i: number, value: boolean) => {
    if (checked) return;
    sfx.tap();
    update((d) => {
      d.storycheck.tf[i] = value;
    });
  };

  const check = () => {
    update((d) => {
      d.storycheck.tfChecked = true;
      d.storycheck.tfMs = Date.now() - started.current;
    });
    right === TRUE_FALSE.length ? sfx.star() : sfx.tap();
  };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Task A</div>
          <h2 style={{ fontSize: 24 }}>Circle T or F</h2>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill">⏱ {fmt(elapsed)}</span>
          <span className="pill">
            {answered}/{TRUE_FALSE.length} answered
          </span>
        </div>
      </div>

      <div className="stack" style={{ gap: 8 }}>
        {TRUE_FALSE.map((item, i) => {
          const given = answers[i];
          const ok = given === item.answer;
          return (
            <div
              key={i}
              className="choice"
              data-state={checked ? (ok ? 'right' : 'wrong') : undefined}
              style={{ cursor: 'default' }}
            >
              <span className="choice__key">{i + 1}</span>
              <span style={{ flex: 1 }}>
                {item.text}
                {checked && !ok && item.correction && (
                  <em style={{ display: 'block', color: 'var(--yellow)', fontSize: 14, marginTop: 3 }}>
                    → {item.correction}
                  </em>
                )}
                {checked && !ok && !item.correction && (
                  <em style={{ display: 'block', color: 'var(--yellow)', fontSize: 14, marginTop: 3 }}>
                    → This one is true.
                  </em>
                )}
              </span>
              <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                <button
                  className={`btn btn--sm ${given === true ? (checked ? (ok ? 'btn--good' : 'btn--bad') : '') : 'btn--ghost'}`}
                  onClick={() => pick(i, true)}
                >
                  T
                </button>
                <button
                  className={`btn btn--sm ${given === false ? (checked ? (ok ? 'btn--good' : 'btn--bad') : '') : 'btn--ghost'}`}
                  onClick={() => pick(i, false)}
                >
                  F
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="btn-row" style={{ marginTop: 18 }}>
        <button className="btn" onClick={check} disabled={answered < TRUE_FALSE.length || checked}>
          Check — stop the clock
        </button>
        {checked && (
          <>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                started.current = Date.now();
                update((d) => {
                  d.storycheck.tf = Array(10).fill(null);
                  d.storycheck.tfChecked = false;
                });
              }}
            >
              Try again
            </button>
            <button className="btn btn--star" onClick={onDone}>
              To the meteors →
            </button>
          </>
        )}
      </div>

      {checked && (
        <div style={{ marginTop: 14 }}>
          <Verdict
            ok={right === TRUE_FALSE.length}
            text={`${right} of ${TRUE_FALSE.length} correct in ${fmt(state.storycheck.tfMs)}. ${
              right === TRUE_FALSE.length ? 'Perfect run!' : 'Read the yellow corrections and try again.'
            }`}
          />
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * B · METEOR ALERT — find the mistake, then fix it
 * ================================================================== */

export function MeteorTask({
  card,
  onSolved,
  onFailed,
  compact,
}: {
  card: MeteorCard;
  onSolved: () => void;
  onFailed?: () => void;
  compact?: boolean;
}) {
  const [found, setFound] = useState(false);
  const [missTap, setMissTap] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  const options = useMemo(
    () => shuffle([card.fix, ...card.distractors], card.id.length * 0.31),
    [card.id],
  );

  const inWrongRange = (i: number) => i >= card.wrong[0] && i <= card.wrong[1];

  const tapToken = (i: number) => {
    if (found) return;
    if (inWrongRange(i)) {
      sfx.right();
      setFound(true);
    } else {
      sfx.wrong();
      setTries((t) => t + 1);
      setMissTap(i);
      window.setTimeout(() => setMissTap(null), 500);
    }
  };

  const pickFix = (opt: string) => {
    setChosen(opt);
    if (opt === card.fix) {
      sfx.meteor();
      window.setTimeout(onSolved, 650);
    } else {
      sfx.wrong();
      setTries((t) => t + 1);
      onFailed?.();
      window.setTimeout(() => setChosen(null), 900);
    }
  };

  return (
    <div className="tile-card" style={{ ['--accent' as string]: 'var(--red)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="card-label" style={{ ['--accent' as string]: 'var(--red)' }}>
          ☄️ Meteor
        </span>
        {!compact && <span className="hint">{found ? 'Now choose the fix' : 'Tap the word that is wrong'}</span>}
      </div>

      <div
        className={`row ${missTap !== null ? 'shake' : ''}`}
        style={{ gap: 7, margin: '14px 0 4px', fontSize: 'clamp(17px, 2.6vw, 23px)' }}
      >
        {card.tokens.map((tok, i) => {
          const isWrong = inWrongRange(i);
          const state = found && isWrong ? 'bad' : missTap === i ? 'miss' : 'plain';
          return (
            <button
              key={i}
              onClick={() => tapToken(i)}
              disabled={found}
              style={{
                border: 'none',
                background:
                  state === 'bad' ? 'rgba(244,68,46,.3)' : state === 'miss' ? 'rgba(255,255,255,.16)' : 'transparent',
                color: state === 'bad' ? '#ffb3a8' : 'inherit',
                borderBottom: state === 'bad' ? '2px solid var(--red)' : '2px solid transparent',
                borderRadius: 8,
                padding: '3px 6px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                textDecoration: state === 'bad' ? 'line-through' : 'none',
                cursor: found ? 'default' : 'pointer',
              }}
            >
              {tok}
            </button>
          );
        })}
      </div>

      {found && (
        <div className="pop" style={{ marginTop: 12 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            {options.map((o) => (
              <button
                key={o}
                className="choice"
                data-state={chosen === o ? (o === card.fix ? 'right' : 'wrong') : undefined}
                disabled={chosen === card.fix}
                onClick={() => pickFix(o)}
              >
                <span style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>{o}</span>
              </button>
            ))}
          </div>
          {chosen === card.fix && (
            <div style={{ marginTop: 12 }}>
              <Verdict ok text={`Rule: ${card.rule}`} />
            </div>
          )}
          {tries > 1 && chosen !== card.fix && (
            <p className="hint" style={{ marginTop: 8 }}>
              Hint — the rule is: <b style={{ color: 'var(--yellow)' }}>{card.rule}</b>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MeteorAlert() {
  const { state, update } = useGame();
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);
  const started = useRef(Date.now());

  const cards = STORYCHECK_METEORS;
  const card = cards[i];
  const doneAll = state.storycheck.meteorsFixed.length >= cards.length;

  const solved = () => {
    setBurst((b) => b + 1);
    update((d) => {
      if (!d.storycheck.meteorsFixed.includes(card.id)) d.storycheck.meteorsFixed.push(card.id);
      d.storycheck.meteorMs = Date.now() - started.current;
    });
    window.setTimeout(() => {
      if (i + 1 < cards.length) setI(i + 1);
      else sfx.fanfare();
    }, 500);
  };

  return (
    <div className="panel">
      <StarBurst fire={burst} />
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Task B</div>
          <h2 style={{ fontSize: 24 }}>Meteor alert!</h2>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill">
            <Star size={14} /> {state.storycheck.meteorsFixed.length}/{cards.length}
          </span>
          {state.storycheck.meteorMs > 0 && <span className="pill">⏱ {fmt(state.storycheck.meteorMs)}</span>}
        </div>
      </div>

      {doneAll && i === cards.length - 1 ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 54 }}>🛡️</div>
          <h2 style={{ fontSize: 30 }}>All meteors destroyed</h2>
          <p className="hint">Speed record: {fmt(state.storycheck.meteorMs)}. The route to the New School is clear.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 18 }}>
            {[...new Set(cards.map((c) => c.rule))].map((r) => (
              <div key={r} className="pill" style={{ justifyContent: 'center' }}>
                ✅ {r}
              </div>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 16 }} onClick={() => { setI(0); started.current = Date.now(); update((d) => { d.storycheck.meteorsFixed = []; }); }}>
            Run the storm again
          </button>
        </div>
      ) : (
        <>
          <MeteorTask key={card.id} card={card} onSolved={solved} />
          <div className="row" style={{ gap: 6, marginTop: 14 }}>
            {cards.map((c, n) => (
              <span
                key={c.id}
                title={`Meteor ${n + 1}`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 13,
                  background: state.storycheck.meteorsFixed.includes(c.id)
                    ? 'rgba(63,191,90,.28)'
                    : n === i
                      ? 'rgba(244,68,46,.3)'
                      : 'rgba(255,255,255,.07)',
                  border: `1px solid ${n === i ? 'var(--red)' : 'var(--card-line)'}`,
                }}
              >
                {state.storycheck.meteorsFixed.includes(c.id) ? '✓' : n + 1}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
