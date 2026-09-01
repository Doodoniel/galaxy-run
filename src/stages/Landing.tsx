import { WORDS } from '../data/content';
import { leaderboard, mvp, useGame } from '../state/game';
import { PilotChip, Rocket, StageHead, Star } from '../components/ui';
import { PlanetArt } from './MyPlanet';
import { sfx } from '../lib/audio';

const TIERS = [
  { at: 2, label: 'I can say it' },
  { at: 4, label: 'I know what it means' },
  { at: 5, label: 'I can use it in a sentence' },
];

export function Landing() {
  const { state, update, goto, reset } = useGame();
  const board = leaderboard(state.pilots);
  const best = mvp(state.pilots);
  const winner = board.find((p) => p.place === 1);

  return (
    <>
      <StageHead
        eyebrow="Stage 7 · 58–60 min"
        title="Landing"
        sub="Pilots, count your stars. Mission 01 complete."
        right={
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            🖨 Print the logbooks
          </button>
        }
      />

      {/* ------------------------------------------------------- podium */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 20 }}>
        <div className="tile-card" style={{ ['--accent' as string]: 'var(--cyan)', textAlign: 'center' }}>
          <span className="card-label" style={{ ['--accent' as string]: 'var(--cyan)' }}>
            Race winner
          </span>
          <div style={{ fontSize: 44, margin: '6px 0' }}>🏫</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>{winner?.callsign ?? '—'}</div>
          <p className="hint" style={{ margin: 0 }}>first rocket at the New School</p>
        </div>

        <div className="tile-card" style={{ ['--accent' as string]: 'var(--yellow)', textAlign: 'center' }}>
          <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
            MVP of the mission
          </span>
          <div style={{ fontSize: 44, margin: '6px 0' }}>⭐</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>{best?.callsign ?? '—'}</div>
          <p className="hint" style={{ margin: 0 }}>{best?.stars ?? 0} stars</p>
        </div>

        <div className="tile-card" style={{ ['--accent' as string]: 'var(--green)', textAlign: 'center' }}>
          <span className="card-label" style={{ ['--accent' as string]: 'var(--green)' }}>
            Crew record
          </span>
          <div style={{ fontSize: 44, margin: '6px 0' }}>⏱</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>
            {Math.max(0, ...state.pilots.map((p) => p.best))} / 10
          </div>
          <p className="hint" style={{ margin: 0 }}>words in 60 seconds — beat it next mission</p>
        </div>
      </div>

      {/* ----------------------------------------------------- logbooks */}
      <div className="stack" style={{ gap: 18 }}>
        {board.map((p) => {
          const idx = state.pilots.findIndex((x) => x.id === p.id);
          const mastery = (id: string) => p.mastery?.[id] ?? 0;
          return (
            <div key={p.id} className="panel logbook">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="row" style={{ gap: 12 }}>
                  <Rocket colour={p.colour} size={40} tilt={0} />
                  <div>
                    <div className="eyebrow">Pilot’s logbook</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>{p.callsign}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  {p.place && <span className="pill">place #{p.place}</span>}
                  <span className="pill" style={{ fontSize: 17 }}>
                    <Star size={16} /> {p.stars} stars
                  </span>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    Word check
                  </div>
                  <div className="stack" style={{ gap: 5 }}>
                    {WORDS.map((w) => (
                      <div key={w.id} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <span style={{ flex: 1, fontSize: 14 }}>{w.word}</span>
                        {TIERS.map((t) => (
                          <span
                            key={t.at}
                            title={t.label}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 5,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 12,
                              background: mastery(w.id) >= t.at ? 'rgba(63,191,90,.25)' : 'rgba(255,255,255,.06)',
                              border: `1px solid ${mastery(w.id) >= t.at ? 'var(--green)' : 'var(--card-line)'}`,
                            }}
                          >
                            {mastery(w.id) >= t.at ? '✓' : ''}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 8 }}>
                    {TIERS.map((t) => (
                      <span key={t.at} className="hint" style={{ fontSize: 11 }}>
                        ▪ {t.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="stack">
                  <div>
                    <label className="hint">My best moment today</label>
                    <input
                      className="field"
                      value={p.logbook?.bestMoment ?? ''}
                      onChange={(e) =>
                        update((d) => {
                          d.pilots[idx].logbook.bestMoment = e.target.value;
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="hint">One word I will not forget</label>
                    <input
                      className="field"
                      value={p.logbook?.oneWord ?? ''}
                      onChange={(e) =>
                        update((d) => {
                          d.pilots[idx].logbook.oneWord = e.target.value;
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="hint">Homework · 3 questions you want to ask Richie</label>
                    <div className="stack" style={{ gap: 6, marginTop: 4 }}>
                      {[0, 1, 2].map((q) => (
                        <input
                          key={q}
                          className="field"
                          placeholder={`Question ${q + 1}…`}
                          value={p.logbook?.questions?.[q] ?? ''}
                          onChange={(e) =>
                            update((d) => {
                              d.pilots[idx].logbook.questions[q] = e.target.value;
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    My planet
                  </div>
                  <PlanetArt sheet={p.planet} size={150} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 4 }}>
                    {p.planet.name || '—'}
                  </div>
                  {p.planet.pitched && <span className="pill" style={{ marginTop: 6 }}>⭐ pitched in 15 sec</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ----------------------------------------------------- homework */}
      <div className="panel" style={{ marginTop: 20 }}>
        <div className="eyebrow">Homework</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 10 }}>
          <div className="tile-card">
            <span className="card-label">Written</span>
            <p style={{ margin: '6px 0 0' }}>
              Word bank: three words — translation — your own sentence. Plus three questions for Richie.
            </p>
          </div>
          <div className="tile-card" style={{ ['--accent' as string]: 'var(--yellow)' }}>
            <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
              Spoken
            </span>
            <p style={{ margin: '6px 0 0' }}>
              Record a 15-second voice message: the pitch of your planet. Send it before the next mission.
            </p>
          </div>
          <div className="tile-card" style={{ ['--accent' as string]: 'var(--cyan)' }}>
            <span className="card-label" style={{ ['--accent' as string]: 'var(--cyan)' }}>
              Optional
            </span>
            <p style={{ margin: '6px 0 0' }}>
              Open <b>Memory Core</b> at home and push all ten words to level 5.
            </p>
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 8 }}>
          {state.pilots.map((p) => (
            <PilotChip key={p.id} callsign={p.callsign} colour={p.colour} stars={p.stars} compact />
          ))}
        </div>
        <div className="btn-row">
          <button
            className="btn btn--ghost"
            onClick={() => {
              sfx.tap();
              goto('wordlab');
            }}
          >
            ↺ Replay a stage
          </button>
          <button
            className="btn btn--bad"
            onClick={() => {
              if (confirm('Start a brand new mission? All callsigns, stars and planets will be erased.')) reset();
            }}
          >
            New mission
          </button>
        </div>
      </div>

      <p className="hint" style={{ textAlign: 'center', marginTop: 26 }}>
        “Mission 01 complete. Next time we fly to planet two.”
      </p>
    </>
  );
}
