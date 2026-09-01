import { useEffect, useState } from 'react';
import {
  GAP_FILL,
  METEOR_CARDS,
  MIRA_CARDS,
  STAGE_META,
  STAGE_ORDER,
  TRUE_FALSE,
  WORDS,
  type StageId,
} from '../data/content';
import { useGame } from '../state/game';
import { Rocket, Star } from './ui';
import { sfx } from '../lib/audio';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The teacher's side panel: the score, the answer keys and the levers that the
 * printed lesson plan gives to the teacher (golden rule, MAKE IT HARDER,
 * jumping stages when the clock runs out).
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(6,2,14,.6)', backdropFilter: 'blur(4px)' }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="pop"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(460px, 100%)',
          background: 'linear-gradient(180deg,#1d0c37,#150826)',
          borderLeft: '1px solid var(--card-line)',
          padding: 18,
          overflowY: 'auto',
          boxShadow: '-24px 0 60px rgba(0,0,0,.5)',
        }}
      >
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="eyebrow">Teacher only</div>
            <h2 style={{ fontSize: 24 }}>Mission Control</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close mission control">
            ✕
          </button>
        </div>

        {/* lesson clock */}
        <div className="tile-card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <span className="card-label">Lesson clock</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30 }}>
                {t0 === null ? '00:00' : fmt(now - t0)}
                <span className="hint" style={{ fontSize: 14 }}> / 60:00</span>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn--sm" onClick={() => setT0(t0 === null ? Date.now() : null)}>
                {t0 === null ? 'Start' : 'Stop'}
              </button>
            </div>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>
            Now: {STAGE_META[state.stage].title} · plan {STAGE_META[state.stage].minutes} min
          </div>
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 14 }}>
          {(['crew', 'keys', 'plan'] as const).map((t) => (
            <button key={t} className={`btn btn--sm ${tab === t ? '' : 'btn--ghost'}`} onClick={() => setTab(t)}>
              {t === 'crew' ? 'Crew & stars' : t === 'keys' ? 'Answer keys' : 'Stages'}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------- crew */}
        {tab === 'crew' && (
          <div className="stack">
            {state.pilots.map((p, i) => (
              <div key={p.id} className="tile-card" style={{ ['--accent' as string]: p.colour, padding: 13 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Rocket colour={p.colour} size={26} tilt={0} />
                    <b style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{p.callsign}</b>
                  </div>
                  <span className="pill">
                    <Star size={13} /> {p.stars}
                  </span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 10 }}>
                  <button
                    className="btn btn--star btn--sm"
                    onClick={() => {
                      sfx.star();
                      update((d) => {
                        d.pilots[i].stars += 1;
                      });
                    }}
                  >
                    +1 star
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      update((d) => {
                        d.pilots[i].stars = Math.max(0, d.pilots[i].stars - 1);
                      })
                    }
                  >
                    −1
                  </button>
                  <button
                    className="btn btn--bad btn--sm"
                    title="Russian on your turn — the rocket stays / goes back one tile"
                    onClick={() => {
                      sfx.wrong();
                      update((d) => {
                        d.pilots[i].pos = Math.max(0, d.pilots[i].pos - 1);
                      });
                    }}
                  >
                    Golden rule −1 tile
                  </button>
                </div>
                <div className="hint" style={{ marginTop: 6 }}>
                  tile {p.pos}/20 · shields {p.shields} · speed record {p.best}/10
                </div>
              </div>
            ))}

            <label
              style={{ display: 'flex', gap: 10, marginTop: 6, cursor: 'pointer', alignItems: 'flex-start' }}
            >
              <input
                type="checkbox"
                style={{ marginTop: 6, flex: 'none' }}
                checked={state.hard}
                onChange={(e) =>
                  update((d) => {
                    d.hard = e.target.checked;
                  })
                }
              />
              <span>
                <b>MAKE IT HARDER</b>
                <div className="hint">
                  WORD tiles: one sentence only · METEOR: say the rule too · STAR: 20 seconds instead of 15.
                </div>
              </span>
            </label>

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
          <div className="stack" style={{ gap: 10 }}>
            <Key title="Worksheet 1A · match">
              {WORDS.map((w, i) => (
                <div key={w.id}>
                  <b>{i + 1}</b> {w.word} — {w.definition}
                </div>
              ))}
            </Key>
            <Key title="Worksheet 1B · gaps">
              {GAP_FILL.map((g, i) => (
                <div key={i}>
                  <b>{i + 1}</b> {g.surface.join(' / ')}
                </div>
              ))}
            </Key>
            <Key title="Worksheet 3A · true / false">
              {TRUE_FALSE.map((t, i) => (
                <div key={i}>
                  <b>{i + 1}</b> {t.answer ? 'T' : 'F'}
                  {t.correction ? ` — ${t.correction}` : ''}
                </div>
              ))}
            </Key>
            <Key title="Meteor cards · the fix">
              {METEOR_CARDS.map((c, i) => (
                <div key={c.id}>
                  <b>{i + 1}</b> {c.tokens.join(' ')} → <span style={{ color: 'var(--green)' }}>{c.fix}</span>{' '}
                  <em className="hint">({c.rule})</em>
                </div>
              ))}
            </Key>
            <Key title="Mira cards · answers">
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

        {/* ------------------------------------------------------ stages */}
        {tab === 'plan' && (
          <div className="stack" style={{ gap: 8 }}>
            {STAGE_ORDER.map((s: StageId) => (
              <button
                key={s}
                className="choice"
                data-state={state.stage === s ? 'right' : state.done.includes(s) ? 'muted' : undefined}
                onClick={() => {
                  goto(s);
                  onClose();
                }}
              >
                <span className="choice__key">{STAGE_META[s].minutes.split('–')[0]}</span>
                <span style={{ flex: 1 }}>
                  <b>{STAGE_META[s].title}</b>
                  <div className="hint">{STAGE_META[s].sub}</div>
                </span>
                <span className="hint">{STAGE_META[s].minutes}′</span>
              </button>
            ))}
            <p className="hint">
              Short on time? Cut Picture This to four sentences and Story Check to task A. Never cut the game — that is
              the core of the lesson.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Key({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="tile-card" style={{ padding: 12 }}>
      <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-display)' }}>{title}</summary>
      <div className="stack" style={{ gap: 3, marginTop: 8, fontSize: 14 }}>
        {children}
      </div>
    </details>
  );
}
