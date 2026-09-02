import { useState } from 'react';
import { OBJECTIVES } from '../data/lesson';
import { makePilot, PILOT_COLOURS, useGame, type Mode } from '../state/game';
import { Modal, Rocket, tap } from '../components/ui';
import { artUrl } from '../lib/art';
import { NextButton, Stage } from '../components/Shell';

const IDEAS = ['Falcon', 'Nova', 'Comet', 'Orbit', 'Blaze', 'Echo'];

const MODES: { id: Mode; icon: string; label: string; blurb: string }[] = [
  {
    id: 'class',
    icon: '📽',
    label: 'Class',
    blurb: 'One screen for everybody — projector or shared screen. Nobody types; the crew answers out loud.',
  },
  {
    id: 'solo',
    icon: '🧑‍🚀',
    label: 'Solo',
    blurb: 'One learner on their own device. Typing drills and the spelling round are switched on.',
  },
];

export function Crew() {
  const { state, update } = useGame();
  const [showAims, setShowAims] = useState(false);

  const pilots = state.pilots;
  const ready = pilots.every((p) => p.callsign.trim().length > 0);

  const setMode = (mode: Mode) =>
    update((d) => {
      d.mode = mode;
      // Solo is one pilot by definition; class needs at least two to race.
      if (mode === 'solo') d.pilots = [d.pilots[0]];
      else if (d.pilots.length < 2) d.pilots.push(makePilot(1));
    });

  return (
    <Stage
      title="Mission Briefing"
      aside={
        <button className="btn btn--ghost btn--sm" onClick={tap(() => setShowAims(true))}>
          🎯 Aims
        </button>
      }
      footer={<NextButton label={ready ? 'Launch' : 'Callsigns first'} disabled={!ready} />}
    >
      <div
        className="split"
        style={{
          gridTemplateColumns: 'minmax(240px, 0.85fr) 1.15fr',
          gap: 'calc(var(--u) * 1.6)',
          width: 'min(1180px, 100%)',
          alignItems: 'stretch',
          maxHeight: '100%',
        }}
      >
        {/* ------------------------------------------------------ briefing */}
        <div className="tile-card" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*.8)' }}>
          <span className="card-label">Today’s flight</span>
          <div className="row" style={{ flexWrap: 'nowrap', gap: 'calc(var(--u)*1)' }}>
            <img
              src={artUrl('chameleon')}
              alt="Richie the chameleon"
              className="word-art float"
              style={{ width: 'clamp(76px, 14vh, 140px)', height: 'auto', flex: 'none' }}
            />
            <p style={{ margin: 0, fontSize: 'clamp(13px, 1.95vh, 18px)' }}>
              Richie the chameleon has one dream: to speak English, travel and make friends. Today you fly with him.
            </p>
          </div>
          <div className="col" style={{ gap: 6 }}>
            {[
              '10 new words',
              'Read the story, then retell it',
              'Win Galaxy Run',
              'Pitch your own planet in 15 seconds',
            ].map((t, i) => (
              <span key={t} className="pill">
                <b style={{ color: 'var(--phase)' }}>{i + 1}</b> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------- crew */}
        <div className="tile-card" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--u)*.9)', minHeight: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="card-label">How are we playing?</span>
            {state.mode === 'class' && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={tap(() => update((d) => void (d.pilots.length < 6 && d.pilots.push(makePilot(d.pilots.length)))))}
                disabled={pilots.length >= 6}
              >
                + pilot ({pilots.length}/6)
              </button>
            )}
          </div>

          <div className="row" style={{ gap: 'calc(var(--u)*.7)', flexWrap: 'nowrap' }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                className="tile-card"
                onClick={tap(() => setMode(m.id))}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: 'calc(var(--u)*.9)',
                  borderColor: state.mode === m.id ? 'var(--phase)' : 'var(--card-line)',
                  background: state.mode === m.id ? 'color-mix(in srgb, var(--phase) 18%, transparent)' : undefined,
                  color: 'inherit',
                }}
              >
                <b style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px, 2vh, 18px)' }}>
                  {m.icon} {m.label}
                </b>
                <div className="hint" style={{ marginTop: 2 }}>
                  {m.blurb}
                </div>
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: 'calc(var(--u)*.7)',
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {pilots.map((p, i) => (
              <div key={p.id} className="col" style={{ gap: 5 }}>
                <div className="row" style={{ gap: 7, flexWrap: 'nowrap' }}>
                  <Rocket colour={p.colour} size={26} />
                  <input
                    className="field"
                    value={p.callsign}
                    placeholder={IDEAS[i % IDEAS.length]}
                    onChange={(e) => update((d) => void (d.pilots[i].callsign = e.target.value.slice(0, 12)))}
                    aria-label={`Callsign for pilot ${i + 1}`}
                  />
                  {pilots.length > 1 && (
                    <button
                      className="icon-btn"
                      style={{ width: 24, height: 24, fontSize: 11, flex: 'none' }}
                      onClick={tap(() => update((d) => void d.pilots.splice(i, 1)))}
                      aria-label={`Remove pilot ${i + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, paddingLeft: 33 }}>
                  {PILOT_COLOURS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update((d) => void (d.pilots[i].colour = c.hex))}
                      aria-label={c.name}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: c.hex,
                        border: p.colour === c.hex ? '2px solid #fff' : '1px solid rgba(255,255,255,.25)',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="hint" style={{ margin: 0 }}>
            Not real names — a callsign. Stuck? {IDEAS.slice(0, 4).join(' · ')}
          </p>
        </div>
      </div>

      <Modal open={showAims} onClose={() => setShowAims(false)} title="What the pilots can do by 60:00">
        <div className="col" style={{ gap: 8 }}>
          {OBJECTIVES.map((o) => (
            <div key={o.code} className="tile-card" style={{ padding: 'calc(var(--u)*.9)' }}>
              <span className="card-label">{o.code}</span>
              <div>{o.text}</div>
            </div>
          ))}
        </div>
        <p className="hint" style={{ marginBottom: 0 }}>
          The mission runs in five phases: lead-in → presentation → controlled practice → production → feedback.
          The planets in the top bar are those phases; click one to jump.
        </p>
      </Modal>
    </Stage>
  );
}
