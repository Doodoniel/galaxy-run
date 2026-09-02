import { useMemo, useState } from 'react';
import type { MeteorCard } from '../data/content';
import { Verdict, shuffle } from './ui';
import { sfx } from '../lib/audio';

/**
 * Error correction in two taps: find the wrong word, then choose the fix.
 * Splitting it that way is deliberate — noticing the mistake and knowing the
 * repair are two different skills, and the split lets the teacher see which
 * one the pilot is missing.
 */
export function MeteorTask({
  card,
  onSolved,
  showRule = true,
}: {
  card: MeteorCard;
  /** `clean` is true when the pilot found and fixed it with no wrong taps. */
  onSolved: (clean: boolean) => void;
  showRule?: boolean;
}) {
  const [found, setFound] = useState(false);
  const [missTap, setMissTap] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  const options = useMemo(() => shuffle([card.fix, ...card.distractors], card.id.length * 0.31), [card]);
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
      window.setTimeout(() => setMissTap(null), 450);
    }
  };

  const pickFix = (opt: string) => {
    setChosen(opt);
    if (opt === card.fix) {
      sfx.meteor();
      const clean = tries === 0;
      window.setTimeout(() => onSolved(clean), 700);
    } else {
      sfx.wrong();
      setTries((t) => t + 1);
      window.setTimeout(() => setChosen(null), 800);
    }
  };

  return (
    <div className="center" style={{ width: 'min(900px, 100%)' }}>
      <span className="card-label" style={{ ['--accent' as string]: 'var(--red)' }}>
        ☄️ {found ? 'now choose the fix' : 'tap the word that is wrong'}
      </span>

      <div
        className={missTap !== null ? 'shake' : undefined}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 6,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 3.6vh, 40px)',
        }}
      >
        {card.tokens.map((tok, i) => {
          const wrong = found && inWrongRange(i);
          return (
            <button
              key={i}
              onClick={() => tapToken(i)}
              disabled={found}
              style={{
                border: 'none',
                background: wrong ? 'rgba(244,68,46,.28)' : missTap === i ? 'rgba(255,255,255,.14)' : 'transparent',
                color: wrong ? '#ffb3a8' : 'inherit',
                borderRadius: 10,
                padding: '2px 8px',
                font: 'inherit',
                textDecoration: wrong ? 'line-through' : 'none',
                cursor: found ? 'default' : 'pointer',
              }}
            >
              {tok}
            </button>
          );
        })}
      </div>

      {found && (
        <div className="pop" style={{ width: 'min(760px, 100%)' }}>
          <div className="opts" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {options.map((o) => (
              <button
                key={o}
                className="opt"
                data-state={chosen === o ? (o === card.fix ? 'right' : 'wrong') : undefined}
                disabled={chosen === card.fix}
                onClick={() => pickFix(o)}
                style={{ justifyContent: 'center' }}
              >
                <span style={{ flex: 1, textAlign: 'center' }}>{o}</span>
              </button>
            ))}
          </div>

          {chosen === card.fix && showRule && (
            <div style={{ marginTop: 'calc(var(--u)*.9)' }}>
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
