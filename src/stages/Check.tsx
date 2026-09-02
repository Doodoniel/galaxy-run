import { useEffect, useState } from 'react';
import { METEOR_CARDS, TRUE_FALSE } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { MeteorTask } from '../components/MeteorTask';
import { Dots, StarBurst, Verdict, tap } from '../components/ui';
import { sfx } from '../lib/audio';

/** The seven meteors the crew destroys here; Galaxy Run keeps the other five. */
export const CHECK_METEORS = METEOR_CARDS.slice(0, 7);

/**
 * Comprehension then form: true/false about the story, then the meteor storm
 * of one-mistake sentences. One item at a time, so a projector always shows
 * a single big sentence rather than a list nobody at the back can read.
 */
export function Check() {
  const [round, setRound] = useState<1 | 2>(1);
  const [r1, setR1] = useState(0);
  return round === 1 ? (
    <TrueFalse
      onDone={(right) => {
        setR1(right);
        setRound(2);
      }}
    />
  ) : (
    <Meteors carried={r1} onBack={() => setRound(1)} />
  );
}

/* ------------------------------------------------ round 1 · true/false */

function TrueFalse({ onDone }: { onDone: (right: number) => void }) {
  const { answer: answerTurn } = useGame();
  const [i, setI] = useState(0);
  const [given, setGiven] = useState<boolean | null>(null);
  const [marks, setMarks] = useState<(boolean | null)[]>(Array(TRUE_FALSE.length).fill(null));

  const item = TRUE_FALSE[i];
  const ok = given !== null && given === item.answer;
  const right = marks.filter((m) => m === true).length;
  const last = i === TRUE_FALSE.length - 1;

  const answer = (value: boolean) => {
    if (given !== null) return;
    setGiven(value);
    const correct = value === item.answer;
    correct ? sfx.right() : sfx.wrong();
    setMarks((m) => m.map((v, j) => (j === i ? correct : v)));
    answerTurn(correct, { skill: 'comprehension' });
  };

  return (
    <Stage
      title="True or false?"
      step={`${i + 1} / ${TRUE_FALSE.length}`}
      turn
      aside={<Dots marks={marks} at={i} />}
      footer={
        <button
          className="btn"
          disabled={given === null}
          onClick={() => {
            if (last) {
              sfx.star();
              onDone(right);
              return;
            }
            setI(i + 1);
            setGiven(null);
            sfx.tap();
          }}
        >
          {last ? 'Meteor storm →' : 'Next →'}
        </button>
      }
    >
      <div className="center" style={{ maxHeight: '100%' }}>
        <p key={i} className="q pop" style={{ maxWidth: 'min(1000px, 94vw)' }}>
          {item.text}
        </p>

        <div className="row" style={{ justifyContent: 'center', gap: 'calc(var(--u)*1.4)' }}>
          <button
            className={`btn btn--lg ${given === true ? (item.answer ? 'btn--good' : 'btn--bad') : 'btn--ghost'}`}
            onClick={() => answer(true)}
            disabled={given !== null}
          >
            TRUE
          </button>
          <button
            className={`btn btn--lg ${given === false ? (!item.answer ? 'btn--good' : 'btn--bad') : 'btn--ghost'}`}
            onClick={() => answer(false)}
            disabled={given !== null}
          >
            FALSE
          </button>
        </div>

        {given !== null && (
          <Verdict
            ok={ok}
            text={item.answer ? 'True — that is what the text says.' : (item.correction ?? 'False.')}
          />
        )}
      </div>
    </Stage>
  );
}

/* --------------------------------------------------- round 2 · meteors */

function Meteors({ carried, onBack }: { carried: number; onBack: () => void }) {
  const { finish, answer: answerTurn } = useGame();
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);
  const [cleared, setCleared] = useState(0);

  const last = i === CHECK_METEORS.length - 1;
  const done = cleared >= CHECK_METEORS.length;

  useEffect(() => {
    if (!done) return;
    sfx.fanfare();
    finish('check', { right: carried + cleared, total: TRUE_FALSE.length + CHECK_METEORS.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const solved = (clean: boolean) => {
    answerTurn(clean, { skill: 'grammar', rule: CHECK_METEORS[i].rule });
    setBurst((b) => b + 1);
    setCleared((c) => c + 1);
    window.setTimeout(() => {
      if (!last) setI((n) => n + 1);
    }, 500);
  };

  return (
    <Stage
      title="Meteor alert"
      step={`${Math.min(cleared + 1, CHECK_METEORS.length)} / ${CHECK_METEORS.length}`}
      turn
      aside={
        <div className="row" style={{ gap: 8 }}>
          <Dots marks={CHECK_METEORS.map((_, n) => (n < cleared ? true : null))} at={i} />
          <button className="btn btn--ghost btn--sm" onClick={tap(onBack)}>
            ← True / false
          </button>
        </div>
      }
      footer={done ? <NextButton label="To the speed round" /> : undefined}
    >
      <StarBurst fire={burst} />
      {done ? (
        <div className="center pop">
          <div style={{ fontSize: 'clamp(40px, 9vh, 80px)' }}>🛡️</div>
          <h2 className="q">All meteors destroyed</h2>
          <div className="row" style={{ justifyContent: 'center' }}>
            {[...new Set(CHECK_METEORS.map((c) => c.rule))].map((r) => (
              <span key={r} className="pill">
                ✅ {r}
              </span>
            ))}
          </div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={tap(() => {
              setI(0);
              setCleared(0);
            })}
          >
            Run the storm again
          </button>
        </div>
      ) : (
        <MeteorTask key={CHECK_METEORS[i].id} card={CHECK_METEORS[i]} onSolved={solved} />
      )}
    </Stage>
  );
}
