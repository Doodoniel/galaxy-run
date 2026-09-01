import { WORDS } from '../data/content';
import { PHASES } from '../data/lesson';
import { leaderboard, mvp, useGame } from '../state/game';
import { Stage } from '../components/Shell';
import { Planet } from '../components/Planet';
import { Rocket, Star, tap } from '../components/ui';

/**
 * Feedback. Everything the hour produced on one screen: who won the race,
 * who collected the most stars, how the crew scored in each practice
 * activity, and what goes home. Printable — the print sheet is the pilot's
 * logbook from the paper pack.
 */
export function Report() {
  const { state, reset, goto } = useGame();
  const board = leaderboard(state.pilots);
  const best = mvp(state.pilots);
  const winner = board.find((p) => p.place === 1);
  const record = Math.max(0, ...state.pilots.map((p) => p.best));

  const scored = PHASES.flatMap((p) => p.activities)
    .map((a) => ({ a, r: state.results[a.id] }))
    .filter((x) => x.r);

  return (
    <Stage
      title="Mission report"
      aside={
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--ghost btn--sm no-print" onClick={() => window.print()}>
            🖨 Print
          </button>
          <button
            className="btn btn--ghost btn--sm no-print"
            onClick={tap(() => goto('crew'))}
          >
            ↺ Replay
          </button>
          <button
            className="btn btn--bad btn--sm no-print"
            onClick={() => {
              if (confirm('Start a brand new mission? Callsigns, stars and planets will be erased.')) reset();
            }}
          >
            New mission
          </button>
        </div>
      }
      hint="“Pilots, count your stars. Mission 01 complete. Next time we fly to planet two.”"
    >
      <div
        className="report"
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 'calc(var(--u)*1.1)',
          width: 'min(1150px, 100%)',
          height: '100%',
        }}
      >
        {/* ------------------------------------------------------ podium */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'calc(var(--u)*1.1)' }}>
          <Headline accent="var(--cyan)" label="Race winner" big={winner?.callsign ?? '—'} sub="first to the New School" icon="🏫" />
          <Headline accent="var(--yellow)" label="MVP" big={best?.callsign ?? '—'} sub={`${best?.stars ?? 0} stars`} icon="⭐" />
          <Headline accent="var(--green)" label="Crew record" big={`${record} / 10`} sub="words in 60 seconds" icon="⏱" />
        </div>

        {/* ------------------------------------------------------ pilots */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(board.length, 3)}, 1fr)`,
            gap: 'calc(var(--u)*1.1)',
            minHeight: 0,
            alignContent: 'start',
            overflowY: 'auto',
          }}
        >
          {board.map((p) => {
            const mastered = WORDS.filter((w) => (p.mastery?.[w.id] ?? 0) >= 5).length;
            return (
              <div key={p.id} className="tile-card" style={{
                  ['--accent' as string]: p.colour,
                  display: 'flex',
                  gap: 'calc(var(--u)*.9)',
                  alignItems: 'flex-start',
                }}>
                <div style={{ flex: 'none', display: 'grid', placeItems: 'center', gap: 4 }}>
                  <Rocket colour={p.colour} size={30} />
                  <Planet look={p.planet} size={62} glow={false} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 2.3vh, 21px)' }}>{p.callsign}</b>
                  <div className="row" style={{ gap: 5, marginTop: 4 }}>
                    <span className="pill">
                      <Star size={12} /> {p.stars}
                    </span>
                    {p.place && <span className="pill">#{p.place}</span>}
                    <span className="pill">speed {p.best}/10</span>
                  </div>
                  <div className="hint" style={{ marginTop: 5 }}>
                    Planet <b style={{ color: 'var(--ink)' }}>{p.planet.name || '—'}</b>
                    {p.planet.pitched && ' · pitched ⭐'}
                  </div>
                  <div className="hint">Words at level 5: {mastered}/10</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ------------------------------------- crew scores + homework */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'calc(var(--u)*1.1)' }}>
          <div className="tile-card">
            <span className="card-label">How the crew scored</span>
            <div className="row" style={{ gap: 6, marginTop: 5 }}>
              {scored.length ? (
                scored.map(({ a, r }) => (
                  <span key={a.id} className="pill">
                    {a.title} <b style={{ color: 'var(--green)' }}>{r!.right}</b>/{r!.total}
                  </span>
                ))
              ) : (
                <span className="hint">No practice activities finished yet.</span>
              )}
            </div>
          </div>

          <div className="tile-card" style={{ ['--accent' as string]: 'var(--yellow)' }}>
            <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
              Homework
            </span>
            <div className="hint" style={{ marginTop: 4 }}>
              Record a 15-second voice message: the pitch of your planet. Then open <b>Memory Core</b> and push all
              ten words to level 5.
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function Headline({
  accent,
  label,
  big,
  sub,
  icon,
}: {
  accent: string;
  label: string;
  big: string;
  sub: string;
  icon: string;
}) {
  return (
    <div className="tile-card" style={{ ['--accent' as string]: accent, textAlign: 'center' }}>
      <span className="card-label" style={{ ['--accent' as string]: accent }}>
        {label}
      </span>
      <div style={{ fontSize: 'clamp(20px, 4vh, 34px)' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2.8vh, 26px)' }}>{big}</div>
      <div className="hint">{sub}</div>
    </div>
  );
}
