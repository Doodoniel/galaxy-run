import { useState } from 'react';
import { WORDS, type WordId } from '../data/content';
import { PITCH_FRAME, type PlanetLook } from '../data/lesson';
import { useGame, type PlanetSheet } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Planet } from '../components/Planet';
import { CountdownRing, PilotChip, Star, StarBurst, tap } from '../components/ui';
import { sfx } from '../lib/audio';

const TYPES: PlanetLook['type'][] = ['rocky', 'banded', 'ringed', 'icy', 'lava'];

/**
 * Production: each pilot builds a planet and sells it to Richie in fifteen
 * seconds. The pitch is a frame with blanks — nobody types it in, the pilot
 * says it out loud, which is the whole point of the task.
 */
export function MyPlanet() {
  const { state, update, finish } = useGame();
  const [who, setWho] = useState(0);
  const [pitching, setPitching] = useState(false);
  const [burst, setBurst] = useState(0);

  const pilot = state.pilots[who];
  const sheet = pilot.planet;

  const set = (patch: Partial<PlanetSheet>) => update((d) => void Object.assign(d.pilots[who].planet, patch));

  const toggleWord = (id: WordId) =>
    update((d) => {
      const w = d.pilots[who].planet.words;
      const at = w.indexOf(id);
      if (at >= 0) w.splice(at, 1);
      else if (w.length < 3) w.push(id);
    });

  const ready = sheet.name.trim().length > 0 && sheet.words.length === 3;
  const allPitched = state.pilots.every((p) => p.planet.pitched);

  return (
    <Stage
      title="My planet"
      step={`${state.pilots.filter((p) => p.planet.pitched).length} / ${state.pilots.length} pitched`}
      aside={
        <div className="row" style={{ gap: 6 }}>
          {state.pilots.map((p, i) => (
            <PilotChip
              key={p.id}
              callsign={p.callsign}
              colour={p.colour}
              active={i === who}
              onClick={tap(() => {
                setWho(i);
                setPitching(false);
              })}
            />
          ))}
        </div>
      }
      footer={
        <div className="btn-row">
          {who + 1 < state.pilots.length && (
            <button
              className="btn btn--ghost"
              onClick={tap(() => {
                setWho(who + 1);
                setPitching(false);
              })}
            >
              Next pilot →
            </button>
          )}
          <NextButton label={allPitched ? 'To the report' : 'Skip to the report'} />
        </div>
      }
    >
      <StarBurst fire={burst} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(320px, 1fr)',
          gap: 'calc(var(--u)*2)',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: 'min(1150px, 100%)',
        }}
      >
        {/* ------------------------------------------------------ planet */}
        <div className="center" style={{ gap: 'calc(var(--u)*.7)' }}>
          <div className="float">
            <Planet look={sheet} size={Math.min(300, window.innerHeight * 0.34)} />
          </div>
          <input
            className="field"
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(16px, 2.6vh, 24px)',
              maxWidth: 260,
            }}
            placeholder="Planet name"
            value={sheet.name}
            onChange={(e) => set({ name: e.target.value.slice(0, 16) })}
          />
          <div className="row" style={{ justifyContent: 'center', gap: 5 }}>
            <button
              className="btn btn--sm btn--ghost"
              onClick={tap(() => set({ type: TYPES[(TYPES.indexOf(sheet.type) + 1) % TYPES.length] }))}
            >
              🪐 {sheet.type}
            </button>
            <button className={`btn btn--sm ${sheet.ring ? '' : 'btn--ghost'}`} onClick={tap(() => set({ ring: !sheet.ring }))}>
              💍 Ring
            </button>
            <button className="btn btn--sm btn--ghost" onClick={tap(() => set({ moons: ((sheet.moons ?? 0) + 1) % 4 }))}>
              🌙 {sheet.moons ?? 0}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={359}
            value={sheet.hue}
            onChange={(e) => set({ hue: Number(e.target.value) })}
            style={{ width: 220, accentColor: `hsl(${sheet.hue} 80% 60%)` }}
            aria-label="Planet colour"
          />
        </div>

        {/* ------------------------------------------------------- pitch */}
        <div className="col" style={{ minWidth: 0 }}>
          <div>
            <span className="card-label">Three words a visitor learns there</span>
            <div className="row" style={{ gap: 5, marginTop: 5 }}>
              {WORDS.map((w) => {
                const on = sheet.words.includes(w.id);
                return (
                  <button
                    key={w.id}
                    className={`chip ${on ? 'pill--on' : ''}`}
                    style={on ? { borderColor: 'var(--phase)', background: 'color-mix(in srgb, var(--phase) 28%, transparent)', color: '#fff' } : undefined}
                    onClick={tap(() => toggleWord(w.id))}
                    disabled={!on && sheet.words.length >= 3}
                  >
                    {w.word}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tile-card">
            <span className="card-label">Say it — 15 seconds, no reading</span>
            <p style={{ fontSize: 'clamp(14px, 2.1vh, 20px)', lineHeight: 1.9, margin: '6px 0 0' }}>
              “
              {PITCH_FRAME.map((part, i) => (
                <span key={i}>
                  {part.text}{' '}
                  {part.gap && (
                    <span
                      style={{
                        display: 'inline-block',
                        minWidth: '6ch',
                        borderBottom: '2px solid var(--phase)',
                        color: 'var(--ink-faint)',
                        fontSize: '.75em',
                        textAlign: 'center',
                        margin: '0 .2em',
                      }}
                    >
                      {part.gap}
                    </span>
                  )}
                </span>
              ))}
              ”
            </p>
          </div>

          <div className="row" style={{ gap: 'calc(var(--u)*1.2)' }}>
            {!pitching ? (
              <button className="btn btn--lg" disabled={!ready} onClick={tap(() => setPitching(true))}>
                🎤 Look up. Smile. Loud — start
              </button>
            ) : (
              <>
                <CountdownRing seconds={15} running runKey={`${who}-pitch`} size={92} onDone={() => sfx.star()} />
                <div className="btn-row">
                  <button
                    className="btn btn--star"
                    onClick={() => {
                      setBurst((b) => b + 1);
                      sfx.star();
                      update((d) => {
                        d.pilots[who].planet.pitched = true;
                        d.pilots[who].stars += 2;
                      });
                      setPitching(false);
                      finish('planet', {
                        right: state.pilots.filter((p) => p.planet.pitched).length + 1,
                        total: state.pilots.length,
                      });
                    }}
                  >
                    <Star size={15} /> Pitched it — 2 stars
                  </button>
                  <button className="btn btn--ghost" onClick={tap(() => setPitching(false))}>
                    Try again
                  </button>
                </div>
              </>
            )}
            {!ready && <span className="hint">Name the planet and pick three words first.</span>}
            {sheet.pitched && (
              <span className="pill" style={{ color: 'var(--yellow)' }}>
                <Star size={13} /> pitched
              </span>
            )}
          </div>
        </div>
      </div>
    </Stage>
  );
}
