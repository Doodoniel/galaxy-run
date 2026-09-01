import { useState } from 'react';
import { OBJECTIVES } from '../data/content';
import { makePilot, PILOT_COLOURS, useGame } from '../state/game';
import { Modal, Rocket, StageHead } from '../components/ui';
import { sfx } from '../lib/audio';

const CALLSIGN_IDEAS = ['Falcon', 'Nova', 'Comet', 'Orbit', 'Blaze', 'Echo', 'Vega', 'Astro', 'Pixel', 'Storm'];

export function LiftOff() {
  const { state, update, next } = useGame();
  const [showObjectives, setShowObjectives] = useState(false);
  const [launching, setLaunching] = useState(false);

  const pilots = state.pilots;
  const ready = pilots.length >= 1 && pilots.every((p) => p.callsign.trim().length > 0);

  const setCallsign = (i: number, value: string) =>
    update((d) => {
      d.pilots[i].callsign = value.slice(0, 12);
    });

  const setColour = (i: number, hex: string) =>
    update((d) => {
      d.pilots[i].colour = hex;
    });

  const addPilot = () => {
    sfx.tap();
    update((d) => {
      if (d.pilots.length < 6) d.pilots.push(makePilot(d.pilots.length));
    });
  };

  const removePilot = (i: number) => {
    sfx.tap();
    update((d) => {
      if (d.pilots.length > 1) d.pilots.splice(i, 1);
    });
  };

  const launch = () => {
    sfx.launch();
    setLaunching(true);
    window.setTimeout(next, 1400);
  };

  return (
    <>
      <StageHead
        eyebrow="Stage 0 · 0–4 min"
        title="Lift-off"
        sub="This is not a lesson. This is Mission 01. Pick a callsign — a cool English nickname — and take your rocket."
        right={
          <button className="btn btn--ghost btn--sm" onClick={() => setShowObjectives(true)}>
            🎯 Mission objectives
          </button>
        }
      />

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 18, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <img
            src={`${import.meta.env.BASE_URL}art/chameleon.webp`}
            alt="Richie the chameleon"
            width={120}
            className="word-art float"
            style={{ flex: 'none', width: 'clamp(84px, 16vw, 130px)' }}
          />
          <div>
            <div className="eyebrow">Mission briefing</div>
            <p style={{ marginTop: 6, fontSize: 'clamp(15px, 2.2vw, 19px)' }}>
              Richie the chameleon has one dream: to speak English, travel and make friends. Today you fly with him.
              Learn <b>10 new words</b>, survive a <b>meteor storm of mistakes</b>, win <b>GALAXY RUN</b> and design
              your own planet.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              {['10 new words', 'Read & retell the story', 'Win the board game', 'Pitch your planet in 15 sec'].map(
                (t, i) => (
                  <span key={t} className="pill">
                    <b style={{ color: 'var(--violet)' }}>{i + 1}</b> {t}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="eyebrow">Crew</div>
            <h2 style={{ fontSize: 24 }}>Who is flying today?</h2>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={addPilot} disabled={pilots.length >= 6}>
            + Add pilot ({pilots.length}/6)
          </button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))' }}>
          {pilots.map((p, i) => (
            <div key={p.id} className="tile-card" style={{ ['--accent' as string]: p.colour, padding: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="card-label" style={{ ['--accent' as string]: p.colour }}>
                  Pilot {i + 1}
                </span>
                {pilots.length > 1 && (
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28, fontSize: 13 }}
                    onClick={() => removePilot(i)}
                    aria-label={`Remove pilot ${i + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                <div style={{ flex: 'none' }}>
                  <Rocket colour={p.colour} size={44} tilt={0} />
                </div>
                <input
                  className="field"
                  value={p.callsign}
                  placeholder={CALLSIGN_IDEAS[i % CALLSIGN_IDEAS.length]}
                  onChange={(e) => setCallsign(i, e.target.value)}
                  aria-label={`Callsign for pilot ${i + 1}`}
                />
              </div>

              <div className="row" style={{ gap: 6, marginTop: 12 }}>
                {PILOT_COLOURS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColour(i, c.hex)}
                    aria-label={c.name}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: c.hex,
                      border: p.colour === c.hex ? '3px solid #fff' : '2px solid rgba(255,255,255,.25)',
                      boxShadow: p.colour === c.hex ? `0 0 12px ${c.hex}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="hint" style={{ marginTop: 14 }}>
          Not your real name — a callsign. Stuck? Try {CALLSIGN_IDEAS.slice(0, 4).join(' · ')}.
        </p>
      </div>

      <div className="btn-row" style={{ marginTop: 22, justifyContent: 'center' }}>
        <button className="btn btn--lg" onClick={launch} disabled={!ready || launching}>
          {launching ? 'Lift-off…' : '🚀 Start the mission'}
        </button>
      </div>
      {!ready && (
        <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
          Every pilot needs a callsign before we launch.
        </p>
      )}

      {launching && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 95,
            pointerEvents: 'none',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}art/spaceship.webp`}
            alt=""
            width={220}
            style={{ animation: 'launch 1.4s cubic-bezier(.5,0,.75,0) forwards' }}
          />
          <style>{`@keyframes launch{0%{transform:translateY(30vh) scale(.6);opacity:0}
            25%{opacity:1}100%{transform:translateY(-110vh) scale(1.25);opacity:0}}`}</style>
        </div>
      )}

      <Modal open={showObjectives} onClose={() => setShowObjectives(false)} title="Mission objectives">
        <p className="hint" style={{ marginTop: 0 }}>
          What every pilot should be able to do by the end of the mission — the learning outcomes from the lesson plan.
        </p>
        <div className="stack" style={{ gap: 10 }}>
          {OBJECTIVES.map((o) => (
            <div key={o.code} className="tile-card" style={{ padding: 14 }}>
              <span className="card-label">{o.code}</span>
              <div style={{ marginTop: 4 }}>{o.text}</div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
