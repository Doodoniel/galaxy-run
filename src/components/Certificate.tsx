import { WORDS } from '../data/content';
import { METEOR_CARDS } from '../data/content';
import { accuracy, SKILLS, type Pilot } from '../state/game';
import { Planet } from './Planet';
import { Rocket, Star } from './ui';

/**
 * The pilot's certificate — the thing that goes home in a school bag.
 *
 * It is deliberately honest about what it claims. With a crew taking turns,
 * one pilot only answers two or three vocabulary items, so a certificate that
 * ticked off "words I can use" would be inventing evidence. Instead it reports
 * what actually happened — stars earned for speaking, accuracy on the
 * questions this pilot was asked — and turns the mistakes into a short,
 * specific list of what to practise before Mission 02.
 *
 * Printed black-on-white: no dark backgrounds to eat a school's toner.
 */
export function Certificate({ pilot, date }: { pilot: Pilot; date: string }) {
  const acc = accuracy(pilot);
  const missedWords = WORDS.filter((w) => pilot.missedWords?.includes(w.id));
  const missedRules = pilot.missedRules ?? [];
  const spotless = acc.total > 0 && !missedWords.length && !missedRules.length;

  return (
    <article className="certificate">
      <header className="certificate__head">
        <span className="certificate__brand">New School Galaxy · Mission 01</span>
        <h2>Pilot’s Certificate</h2>
      </header>

      <div className="certificate__hero">
        <span className="certificate__rocket">
          <Rocket colour={pilot.colour} size={62} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="certificate__name">{pilot.callsign || '—'}</div>
          <div className="certificate__date">{date}</div>
        </div>
        <div className="certificate__planet">
          <Planet look={pilot.planet} size={104} glow={false} />
          <span>{pilot.planet.name || 'unnamed planet'}</span>
        </div>
      </div>

      <div className="certificate__stats">
        <Stat big={`${pilot.stars}`} label="stars for speaking" icon={<Star size={15} />} />
        <Stat big={pilot.place ? `#${pilot.place}` : '—'} label="place in the race" />
        <Stat big={`${pilot.best}/10`} label="words in 60 seconds" />
        <Stat big={acc.total ? `${acc.right}/${acc.total}` : '—'} label="questions right" />
      </div>

      {acc.total > 0 && (
        <section className="certificate__block">
          <h3>How it went</h3>
          <div className="certificate__skills">
            {SKILLS.map((s) => {
              const t = pilot.skills?.[s.id] ?? { right: 0, wrong: 0 };
              const total = t.right + t.wrong;
              return (
                <div key={s.id}>
                  <b>{s.label}</b>
                  <span>{total ? `${t.right}/${total}` : 'not asked'}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="certificate__block">
        <h3>What to practise before Mission 02</h3>
        {spotless ? (
          <p className="certificate__clean">
            Everything you were asked, you got right. Next time, aim for the STAR tiles — fifteen seconds without
            stopping.
          </p>
        ) : missedWords.length || missedRules.length ? (
          <ul>
            {missedWords.length > 0 && (
              <li>
                <b>Words:</b> {missedWords.map((w) => w.word).join(', ')}
              </li>
            )}
            {missedRules.map((r) => (
              <li key={r}>
                <b>Grammar:</b> {r}
                {(() => {
                  const example = METEOR_CARDS.find((c) => c.rule === r);
                  return example ? <em> — e.g. “{example.fix}”</em> : null;
                })()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="certificate__clean">
            Say the ten mission words out loud at home, and record your fifteen-second planet pitch.
          </p>
        )}
      </section>

      <section className="certificate__block">
        <h3>The ten mission words</h3>
        <p className="certificate__words">
          {WORDS.map((w) => (
            <span key={w.id} data-missed={pilot.missedWords?.includes(w.id)}>
              {w.word}
            </span>
          ))}
        </p>
      </section>

      <footer className="certificate__foot">
        <span>Teacher ______________________</span>
        <span>Mission 02 — next flight</span>
      </footer>
    </article>
  );
}

function Stat({ big, label, icon }: { big: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="certificate__stat">
      <b>
        {icon} {big}
      </b>
      <span>{label}</span>
    </div>
  );
}
