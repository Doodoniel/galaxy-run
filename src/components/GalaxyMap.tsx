import { PHASES, phaseOf, type ActivityId } from '../data/lesson';
import { accuracy, useGame } from '../state/game';
import { Planet } from './Planet';
import { Rocket, Star, tap } from './ui';
import { sfx } from '../lib/audio';

/**
 * The flight path: five planets, one per phase of the lesson. It is the whole
 * plan of the hour in one glance — where we are, what is behind us, what is
 * still ahead — and it doubles as the navigation.
 */
export function PhaseMap() {
  const { state, goto } = useGame();
  const current = phaseOf(state.activity);

  return (
    <nav className="phasemap" aria-label="Lesson phases">
      {PHASES.map((p, i) => {
        const active = p.id === current.id;
        const done = p.activities.every((a) => state.done.includes(a.id));
        return (
          <button
            key={p.id}
            className="phasemap__node"
            data-active={active}
            data-done={done}
            style={{ ['--phase' as string]: p.colour }}
            onClick={() => {
              sfx.tap();
              goto(p.activities[0].id);
            }}
            title={`${i + 1} · ${p.stage} — ${p.title} · ${p.minutes} min`}
          >
            <span className="phasemap__orb">
              <Planet look={p.planet} size={active ? 46 : 34} glow={active} />
              {done && !active && <span className="phasemap__tick">✓</span>}
            </span>
            <span className="phasemap__label">{p.stage}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** The activities inside the current phase, plus the line the teacher says. */
export function ActivityBar() {
  const { state, goto, setTurn } = useGame();
  const phase = phaseOf(state.activity);
  const index = PHASES.findIndex((p) => p.id === phase.id) + 1;
  const onTurn = state.turn % Math.max(1, state.pilots.length);

  return (
    <div className="actbar" style={{ ['--phase' as string]: phase.colour }}>
      <span className="actbar__phase">
        <b>{index}</b> {phase.stage}
      </span>

      <div className="actbar__tabs">
        {phase.activities.map((a) => (
          <button
            key={a.id}
            data-active={a.id === state.activity}
            data-done={state.done.includes(a.id)}
            onClick={() => {
              sfx.tap();
              goto(a.id as ActivityId);
            }}
            title={`${a.sub} · ${a.minutes} min`}
          >
            {a.title}
          </button>
        ))}
      </div>

      <div className="actbar__crew" title="Click a pilot to hand them the turn">
        {state.pilots.map((p, i) => {
          const acc = accuracy(p);
          return (
            <button
              key={p.id}
              className="crewchip"
              data-active={i === onTurn}
              style={{ ['--pilot' as string]: p.colour }}
              onClick={tap(() => setTurn(i))}
              title={`${p.callsign || 'pilot'} — ${p.stars} stars${acc.total ? `, ${acc.right}/${acc.total} correct` : ''}`}
            >
              <Rocket colour={p.colour} size={14} />
              <b>{p.callsign || '—'}</b>
              <span>
                <Star size={10} /> {p.stars}
              </span>
              {acc.total > 0 && (
                <span className="crewchip__acc">
                  {acc.right}/{acc.total}
                </span>
              )}
              {p.place && <i>#{p.place}</i>}
            </button>
          );
        })}
      </div>
      <span className="actbar__min">{phase.minutes}′</span>
    </div>
  );
}
