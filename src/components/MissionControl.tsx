import { useEffect, useState } from 'react';
import { GAP_FILL, METEOR_CARDS, MIRA_CARDS, TRUE_FALSE, WORDS } from '../data/content';
import { PHASES, activityOf, phaseOf } from '../data/lesson';
import { useGame, type Mode } from '../state/game';
import { Rocket, Star, tap } from './ui';
import { sfx } from '../lib/audio';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The teacher's side panel: the score, the answer keys, the lesson clock and
 * the levers the printed plan hands the teacher — the golden rule, MAKE IT
 * HARDER, and jumping phases when the clock runs out.
 */
export function MissionControl({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update, goto, reset } = useGame();
  const [tab, setTab] = useState<'crew' | 'keys' | 'plan'>('crew');
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (t0 === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [t0]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const here = activityOf(state.activity);
  const phase = phaseOf(state.activity);

  return (
    <div className="scrim" style={{ padding: 0, placeItems: 'stretch' }} onClick={onClose}>
      <aside className="drawer pop" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow">Teacher only</div>
            <h2 style={{ fontSize: 'clamp(17px, 2.6vh, 23px)' }}>Mission Control</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close mission control">
            ✕
          </button>
        </div>

        {/* lesson clock */}
        <div className="tile-card" style={{ marginTop: 'calc(var(--u)*.9)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <span className="card-label">Lesson clock</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3.4vh, 30px)' }}>
                {t0 === null ? '00:00' : fmt(now - t0)}
                <span className="hint"> / 60:00</span>
              </div>
            </div>
            <button className="btn btn--sm" onClick={() => setT0(t0 === null ? Date.now() : null)}>
              {t0 === null ? 'Start' : 'Stop'}
            </button>
          </div>
          <div className="hint" style={{ marginTop: 4 }}>
            {phase.stage} · {here.title} · plan {here.minutes} min
          </div>
        </div>

        {/* mode */}
        <div className="row" style={{ gap: 6, marginTop: 'calc(var(--u)*.9)' }}>
          {(['class', 'solo'] as Mode[]).map((m) => (
            <button
              key={m}
              className={`btn btn--sm ${state.mode === m ? '' : 'btn--ghost'}`}
              onClick={tap(() => update((d) => void (d.mode = m)))}
            >
              {m === 'class' ? '📽 Class' : '🧑‍🚀 Solo'}
            </button>
          ))}
          <span className="hint">
            {state.mode === 'class' ? '2–6 pilots, tap only' : 'one pilot, typed answers'}
          </span>
        </div>

        <div className="row" style={{ gap: 6, margin: 'calc(var(--u)*.9) 0' }}>
          {(['crew', 'keys', 'plan'] as const).map((t) => (
            <button key={t} className={`btn btn--sm ${tab === t ? '' : 'btn--ghost'}`} onClick={tap(() => setTab(t))}>
              {t === 'crew' ? 'Crew & stars' : t === 'keys' ? 'Answer keys' : 'The plan'}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------- crew */}
        {tab === 'crew' && (
          <div className="col">
            {state.pilots.map((p, i) => (
              <div key={p.id} className="tile-card" style={{ ['--accent' as string]: p.colour }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="row" style={{ gap: 8 }}>
                    <Rocket colour={p.colour} size={24} />
                    <b style={{ fontFamily: 'var(--font-display)' }}>{p.callsign}</b>
                  </span>
                  <span className="pill">
                    <Star size={12} /> {p.stars}
                  </span>
                </div>
                <div className="row" style={{ gap: 5, marginTop: 8 }}>
                  <button
                    className="btn btn--star btn--sm"
                    onClick={() => {
                      sfx.star();
                      update((d) => void d.pilots[i].stars++);
                    }}
                  >
                    +1 star
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => update((d) => void (d.pilots[i].stars = Math.max(0, d.pilots[i].stars - 1)))}
                  >
                    −1
                  </button>
                  <button
                    className="btn btn--bad btn--sm"
                    title="Russian on your turn — the rocket goes back one tile"
                    onClick={() => {
                      sfx.wrong();
                      update((d) => void (d.pilots[i].pos = Math.max(0, d.pilots[i].pos - 1)));
                    }}
                  >
                    Golden rule −1
                  </button>
                </div>
                <div className="hint" style={{ marginTop: 5 }}>
                  tile {p.pos}/20 · shields {p.shields} · speed {p.best}/10
                </div>
              </div>
            ))}

            <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                style={{ marginTop: 5, flex: 'none' }}
                checked={state.hard}
                onChange={(e) => update((d) => void (d.hard = e.target.checked))}
              />
              <span>
                <b>MAKE IT HARDER</b>
                <div className="hint">
                  WORD: one sentence only · METEOR: name the rule · STAR: 20 seconds instead of 15.
                </div>
              </span>
            </label>

            <div className="tile-card" style={{ ['--accent' as string]: 'var(--cyan)' }}>
              <span className="card-label" style={{ ['--accent' as string]: 'var(--cyan)' }}>
                Sharing your screen?
              </span>
              <p className="hint" style={{ margin: '4px 0 8px' }}>
                This panel is part of the page — share this window and the crew sees it, answer keys and all. Open a
                second window, keep it on your own screen, and share only the first. Both windows run the same
                mission and stay in step.
              </p>
              <button
                className="btn btn--sm"
                onClick={() => {
                  sfx.tap();
                  window.open(`${location.pathname}${location.search}#control`, 'galaxy-run-control', 'width=560,height=940');
                }}
              >
                🪟 Open a second window
              </button>
            </div>

            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                if (confirm('Erase the whole mission and start again?')) reset();
              }}
            >
              Reset the whole mission
            </button>
          </div>
        )}

        {/* ------------------------------------------------------- keys */}
        {tab === 'keys' && (
          <div className="col" style={{ gap: 8 }}>
            <Key title="Words & meanings">
              {WORDS.map((w, i) => (
                <div key={w.id}>
                  <b>{i + 1}</b> {w.word} — {w.definition}
                </div>
              ))}
            </Key>
            <Key title="Sentences · the missing words">
              {GAP_FILL.map((g, i) => (
                <div key={i}>
                  <b>{i + 1}</b> {g.surface.join(' / ')}
                </div>
              ))}
            </Key>
            <Key title="True / false">
              {TRUE_FALSE.map((t, i) => (
                <div key={i}>
                  <b>{i + 1}</b> {t.answer ? 'T' : 'F'}
                  {t.correction ? ` — ${t.correction}` : ''}
                </div>
              ))}
            </Key>
            <Key title="Meteors · the fix">
              {METEOR_CARDS.map((c, i) => (
                <div key={c.id}>
                  <b>{i + 1}</b> {c.tokens.join(' ')} → <span style={{ color: 'var(--green)' }}>{c.fix}</span>{' '}
                  <em className="hint">({c.rule})</em>
                </div>
              ))}
            </Key>
            <Key title="Mira · story answers">
              {MIRA_CARDS.map((c, i) => (
                <div key={c.id}>
                  <b>{i + 1}</b> {c.q} — <span style={{ color: 'var(--green)' }}>{c.a}</span>
                </div>
              ))}
            </Key>
            <p className="hint">
              WORD and STAR cards have no right answer: the star is for trying to speak English, not for accuracy.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------- plan */}
        {tab === 'plan' && (
          <div className="col" style={{ gap: 10 }}>
            {PHASES.map((p, n) => (
              <div key={p.id} className="tile-card" style={{ ['--accent' as string]: p.colour }}>
                <span className="card-label" style={{ ['--accent' as string]: p.colour }}>
                  {n + 1} · {p.stage} · {p.minutes} min
                </span>
                <b style={{ fontFamily: 'var(--font-display)', display: 'block' }}>{p.title}</b>
                <div className="hint">{p.aim}</div>
                <div className="col" style={{ gap: 4, marginTop: 6 }}>
                  {p.activities.map((a) => (
                    <button
                      key={a.id}
                      className="opt"
                      style={{ padding: '6px 10px', fontSize: 'clamp(12px,1.7vh,15px)' }}
                      data-state={state.activity === a.id ? 'right' : state.done.includes(a.id) ? 'muted' : undefined}
                      onClick={() => {
                        goto(a.id);
                        onClose();
                      }}
                    >
                      <span style={{ flex: 1 }}>
                        <b>{a.title}</b>
                        <div className="hint">{a.sub}</div>
                      </span>
                      <span className="hint">{a.minutes}′</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="hint">
              Short on time? Cut the story retell and the speed round. Never cut Galaxy Run — the production phase is
              the point of the hour.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Key({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="tile-card" style={{ padding: 'calc(var(--u)*.9)' }}>
      <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-display)' }}>{title}</summary>
      <div className="col" style={{ gap: 2, marginTop: 6, fontSize: 'clamp(12px,1.7vh,14px)' }}>
        {children}
      </div>
    </details>
  );
}
