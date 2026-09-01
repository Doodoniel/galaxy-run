import { useState } from 'react';
import { PITCH_TEMPLATE } from '../data/content';
import { useGame, type PlanetSheet } from '../state/game';
import { CountdownRing, PilotChip, StageHead, Star, StarBurst } from '../components/ui';
import { sfx } from '../lib/audio';

/* A generated planet: hue, surface pattern, ring and moons. */
export function PlanetArt({ sheet, size = 220 }: { sheet: PlanetSheet; size?: number }) {
  const h = sheet.hue;
  const id = `p${h}-${sheet.pattern}`;
  const blobs =
    sheet.pattern === 0
      ? [
          [32, 38, 15],
          [62, 60, 11],
          [46, 74, 8],
        ]
      : sheet.pattern === 1
        ? [
            [50, 30, 20],
            [30, 66, 13],
            [72, 52, 9],
          ]
        : [
            [40, 44, 9],
            [64, 34, 7],
            [36, 68, 10],
            [66, 70, 6],
          ];

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label={sheet.name || 'your planet'}>
      <defs>
        <radialGradient id={`grad-${id}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor={`hsl(${h} 95% 78%)`} />
          <stop offset="60%" stopColor={`hsl(${h} 80% 55%)`} />
          <stop offset="100%" stopColor={`hsl(${(h + 25) % 360} 70% 32%)`} />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <circle cx="60" cy="60" r="36" />
        </clipPath>
      </defs>

      {sheet.ring && (
        <ellipse
          cx="60"
          cy="62"
          rx="54"
          ry="15"
          fill="none"
          stroke={`hsl(${(h + 40) % 360} 85% 68%)`}
          strokeWidth="6"
          opacity="0.55"
          transform="rotate(-18 60 62)"
        />
      )}

      <circle cx="60" cy="60" r="36" fill={`url(#grad-${id})`} />
      <g clipPath={`url(#clip-${id})`} opacity="0.42">
        {blobs.map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.7} fill={`hsl(${(h + 200) % 360} 70% 30%)`} />
        ))}
      </g>
      <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.4" />

      {sheet.ring && (
        <path
          d="M14 55 A54 15 0 0 0 106 69"
          fill="none"
          stroke={`hsl(${(h + 40) % 360} 85% 74%)`}
          strokeWidth="6"
          opacity="0.9"
          transform="rotate(-18 60 62)"
        />
      )}

      {Array.from({ length: sheet.moons }, (_, i) => (
        <circle
          key={i}
          cx={18 + i * 12}
          cy={22 + (i % 2) * 76}
          r={4.5 - i * 0.6}
          fill={`hsl(${(h + 180) % 360} 30% 88%)`}
        />
      ))}
    </svg>
  );
}

export function MyPlanet() {
  const { state, update, next } = useGame();
  const [who, setWho] = useState(0);
  const [pitching, setPitching] = useState(false);
  const [burst, setBurst] = useState(0);

  const pilot = state.pilots[who];
  const sheet = pilot.planet;

  const setSheet = (patch: Partial<PlanetSheet>) =>
    update((d) => {
      Object.assign(d.pilots[who].planet, patch);
    });

  const setPitch = (gap: string, value: string) =>
    update((d) => {
      d.pilots[who].planet.pitch[gap] = value;
    });

  const filled = PITCH_TEMPLATE.filter((p) => p.gap).every((p) => (sheet.pitch[p.gap!] ?? '').trim());

  return (
    <>
      <StarBurst fire={burst} />
      <StageHead
        eyebrow="Stage 6 · 53–58 min"
        title="My Planet"
        sub="Richie visits your planet next. Design it, name it — then sell it to him in fifteen seconds of English."
        right={
          <div className="row" style={{ gap: 6 }}>
            {state.pilots.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  sfx.tap();
                  setWho(i);
                  setPitching(false);
                }}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                <PilotChip callsign={p.callsign} colour={p.colour} active={i === who} compact />
              </button>
            ))}
          </div>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* ---------------------------------------------------- designer */}
        <div className="panel">
          <div className="eyebrow">Design it</div>
          <div style={{ display: 'grid', placeItems: 'center', margin: '10px 0 16px' }}>
            <div className="float">
              <PlanetArt sheet={sheet} size={220} />
            </div>
            <input
              className="field"
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                maxWidth: 300,
                marginTop: 10,
              }}
              placeholder="Planet name"
              value={sheet.name}
              onChange={(e) => setSheet({ name: e.target.value.slice(0, 18) })}
            />
          </div>

          <label className="hint">Colour</label>
          <input
            type="range"
            min={0}
            max={359}
            value={sheet.hue}
            onChange={(e) => setSheet({ hue: Number(e.target.value) })}
            style={{ width: '100%', accentColor: `hsl(${sheet.hue} 80% 60%)` }}
          />

          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className={`btn btn--sm ${sheet.ring ? '' : 'btn--ghost'}`} onClick={() => setSheet({ ring: !sheet.ring })}>
              💍 Ring
            </button>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => setSheet({ pattern: (sheet.pattern + 1) % 3 })}
            >
              🎨 Surface
            </button>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => setSheet({ moons: (sheet.moons + 1) % 4 })}
            >
              🌙 Moons: {sheet.moons}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------ details */}
        <div className="panel">
          <div className="eyebrow">Fill the sheet</div>
          <div className="stack" style={{ marginTop: 10 }}>
            <div>
              <label className="hint">3 words you learn there</label>
              <div className="row" style={{ gap: 8, marginTop: 4 }}>
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    className="field"
                    style={{ flex: 1, minWidth: 90 }}
                    placeholder={`word ${i + 1}`}
                    value={sheet.words[i]}
                    onChange={(e) =>
                      update((d) => {
                        d.pilots[who].planet.words[i] = e.target.value;
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="hint">One rule on my planet</label>
              <input
                className="field"
                placeholder="You must speak English every day."
                value={sheet.rule}
                onChange={(e) => setSheet({ rule: e.target.value })}
              />
            </div>
            <div>
              <label className="hint">The people there are…</label>
              <input
                className="field"
                placeholder="friendly, green and very fast"
                value={sheet.people}
                onChange={(e) => setSheet({ people: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- pitch */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="eyebrow">Task B · 15-second pitch</div>
            <h2 style={{ fontSize: 24 }}>Fill the gaps, then say it — no reading!</h2>
          </div>
          {sheet.pitched && (
            <span className="pill" style={{ color: 'var(--yellow)' }}>
              <Star size={14} /> pitched
            </span>
          )}
        </div>

        <p style={{ fontSize: 'clamp(16px, 2.4vw, 20px)', lineHeight: 2.2 }}>
          “
          {PITCH_TEMPLATE.map((part, i) => (
            <span key={i}>
              {part.text}
              {part.gap && (
                <input
                  className="gap-input"
                  style={{ width: `${Math.max(8, (sheet.pitch[part.gap] ?? '').length + 3)}ch` }}
                  placeholder={part.hint}
                  value={sheet.pitch[part.gap] ?? ''}
                  onChange={(e) => setPitch(part.gap!, e.target.value)}
                  aria-label={part.hint}
                />
              )}
            </span>
          ))}
          ”
        </p>

        <div className="row" style={{ gap: 18, marginTop: 12, alignItems: 'center' }}>
          {!pitching ? (
            <button
              className="btn btn--lg"
              disabled={!filled}
              onClick={() => {
                setPitching(true);
                sfx.tap();
              }}
            >
              🎤 Look up. Smile. Loud. — start
            </button>
          ) : (
            <>
              <CountdownRing seconds={15} running runKey={`${who}-pitch`} size={110} onDone={() => sfx.star()} />
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
                  }}
                >
                  <Star size={16} /> Pitched it — 2 stars
                </button>
                <button className="btn btn--ghost" onClick={() => setPitching(false)}>
                  Try again
                </button>
              </div>
            </>
          )}
          {!filled && <span className="hint">Fill every gap first.</span>}
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 22, justifyContent: 'space-between' }}>
        {who + 1 < state.pilots.length ? (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setWho(who + 1);
              setPitching(false);
            }}
          >
            Next pilot: {state.pilots[who + 1].callsign} →
          </button>
        ) : (
          <span className="hint">All pilots have a planet.</span>
        )}
        <button className="btn" onClick={next}>
          Next: Landing →
        </button>
      </div>
    </>
  );
}
