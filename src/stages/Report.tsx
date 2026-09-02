import { useState } from 'react';
import { WORDS } from '../data/content';
import { accuracy, leaderboard, mvp, sharpest, SKILLS, useGame, type Pilot } from '../state/game';
import { Stage } from '../components/Shell';
import { Certificate } from '../components/Certificate';
import { Planet } from '../components/Planet';
import { Modal, Rocket, Star, tap } from '../components/ui';

/**
 * Feedback. Two different numbers, kept apart on purpose: stars are what a
 * pilot earned by SPEAKING, accuracy is how the auto-checked questions went.
 * Underneath each pilot sits the useful part — the short list of what they
 * personally got wrong, which is also what their certificate sends home.
 */
export function Report() {
  const { state, reset, goto } = useGame();
  const [certs, setCerts] = useState(false);

  const board = leaderboard(state.pilots);
  const best = mvp(state.pilots);
  const sharp = sharpest(state.pilots);
  const winner = board.find((p) => p.place === 1);
  const record = Math.max(0, ...state.pilots.map((p) => p.best));
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Stage
      title="Mission report"
      aside={
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--sm no-print" onClick={tap(() => setCerts(true))}>
            🎖 Certificates
          </button>
          <button className="btn btn--ghost btn--sm no-print" onClick={tap(() => goto('crew'))}>
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
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 'calc(var(--u)*1.1)',
          width: 'min(1180px, 100%)',
          height: '100%',
        }}
      >
        {/* ---------------------------------------------------- the awards */}
        <div className="split" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 'calc(var(--u)*1.1)' }}>
          <Headline
            accent="var(--cyan)"
            label="Race winner"
            big={winner?.callsign ?? '—'}
            sub="first to the New School"
            icon="🏫"
          />
          <Headline
            accent="var(--yellow)"
            label="MVP · speaking"
            big={best?.callsign ?? '—'}
            sub={`${best?.stars ?? 0} stars`}
            icon="⭐"
          />
          <Headline
            accent="var(--green)"
            label="Sharpest · accuracy"
            big={sharp?.callsign ?? '—'}
            sub={sharp ? `${accuracy(sharp).right}/${accuracy(sharp).total} right` : 'not enough answers yet'}
            icon="🎯"
          />
        </div>

        {/* ---------------------------------------------------- the pilots */}
        <div
          className="split"
          style={{
            gridTemplateColumns: `repeat(${Math.min(board.length, 3)}, 1fr)`,
            gap: 'calc(var(--u)*1.1)',
            minHeight: 0,
            alignContent: 'start',
            overflowY: 'auto',
          }}
        >
          {board.map((p) => (
            <PilotCard key={p.id} pilot={p} />
          ))}
        </div>

        {/* ------------------------------------------------------ homework */}
        <div className="split" style={{ gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--u)*1.1)' }}>
          <div className="tile-card">
            <span className="card-label">Crew record</span>
            <div className="hint" style={{ marginTop: 4 }}>
              <b style={{ color: 'var(--ink)' }}>{record}/10</b> words in sixty seconds. Beat it in Mission 02.
            </div>
          </div>
          <div className="tile-card" style={{ ['--accent' as string]: 'var(--yellow)' }}>
            <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
              Homework
            </span>
            <div className="hint" style={{ marginTop: 4 }}>
              Record a 15-second voice message: the pitch of your planet. Then open <b>Memory Core</b> and push the
              words on your certificate to level 5.
            </div>
          </div>
        </div>
      </div>

      <Modal open={certs} onClose={() => setCerts(false)} title="Pilot’s certificates" width={820}>
        <div className="row no-print" style={{ justifyContent: 'space-between', marginBottom: 'calc(var(--u)*1)' }}>
          <span className="hint">One page per pilot — what they did today, and what to practise.</span>
          <button className="btn btn--sm" onClick={() => window.print()}>
            🖨 Print
          </button>
        </div>
        {board.map((p) => (
          <Certificate key={p.id} pilot={p} date={today} />
        ))}
      </Modal>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */

function PilotCard({ pilot }: { pilot: Pilot }) {
  const acc = accuracy(pilot);
  const missed = WORDS.filter((w) => pilot.missedWords?.includes(w.id));
  const rules = pilot.missedRules ?? [];

  return (
    <div
      className="tile-card"
      style={{
        ['--accent' as string]: pilot.colour,
        display: 'flex',
        gap: 'calc(var(--u)*.9)',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 'none', display: 'grid', placeItems: 'center', gap: 4 }}>
        <Rocket colour={pilot.colour} size={34} />
        <Planet look={pilot.planet} size={70} glow={false} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <b style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 2.3vh, 21px)' }}>{pilot.callsign}</b>

        <div className="row" style={{ gap: 5, marginTop: 4 }}>
          <span className="pill">
            <Star size={12} /> {pilot.stars}
          </span>
          {pilot.place && <span className="pill">#{pilot.place}</span>}
          <span className="pill">speed {pilot.best}/10</span>
          {acc.total > 0 && (
            <span className="pill" style={{ color: 'var(--green)' }}>
              🎯 {acc.right}/{acc.total}
            </span>
          )}
        </div>

        {acc.total > 0 && (
          <div className="row" style={{ gap: 4, marginTop: 6 }}>
            {SKILLS.map((s) => {
              const t = pilot.skills?.[s.id] ?? { right: 0, wrong: 0 };
              const total = t.right + t.wrong;
              if (!total) return null;
              return (
                <span key={s.id} className="pill" style={{ fontSize: 11 }} title={s.hint}>
                  {s.label} {t.right}/{total}
                </span>
              );
            })}
          </div>
        )}

        <div className="hint" style={{ marginTop: 6 }}>
          {missed.length || rules.length ? (
            <>
              <b style={{ color: 'var(--yellow)' }}>Practise:</b>{' '}
              {[missed.map((w) => w.word).join(', '), ...rules].filter(Boolean).join(' · ')}
            </>
          ) : acc.total > 0 ? (
            <span style={{ color: 'var(--green)' }}>Nothing to fix — everything asked, everything right.</span>
          ) : (
            'No questions answered yet.'
          )}
        </div>

        <div className="hint">
          Planet <b style={{ color: 'var(--ink)' }}>{pilot.planet.name || '—'}</b>
          {pilot.planet.pitched && ' · pitched ⭐'}
        </div>
      </div>
    </div>
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
      <div style={{ fontSize: 'clamp(18px, 3.4vh, 30px)' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 2.6vh, 24px)' }}>{big}</div>
      <div className="hint">{sub}</div>
    </div>
  );
}
