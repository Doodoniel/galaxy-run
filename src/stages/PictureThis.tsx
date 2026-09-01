import { useEffect, useRef, useState } from 'react';
import { STORY_FULL, STORY_IMAGES, STORY_SENTENCES, wordById } from '../data/content';
import { useGame } from '../state/game';
import { CountdownRing, StageHead, Star, Verdict, WordArt } from '../components/ui';
import { sfx, speak, stopSpeaking } from '../lib/audio';

type Step = 'listen' | 'write' | 'check';

export function PictureThis() {
  const { next } = useGame();
  const [step, setStep] = useState<Step>('listen');

  return (
    <>
      <StageHead
        eyebrow="Stage 3 · 19–29 min"
        title="Picture This"
        sub="Listen. Draw only — no words, no letters. Ugly drawings are perfect. Then rebuild the story from your pictures."
        right={
          <div className="row" style={{ gap: 6 }}>
            {(['listen', 'write', 'check'] as Step[]).map((s, i) => (
              <button
                key={s}
                className={`btn btn--sm ${step === s ? '' : 'btn--ghost'}`}
                onClick={() => {
                  stopSpeaking();
                  sfx.tap();
                  setStep(s);
                }}
              >
                {i + 1} · {s === 'listen' ? 'Listen & draw' : s === 'write' ? 'Write it' : 'Check'}
              </button>
            ))}
          </div>
        }
      />

      {step === 'listen' && <ListenAndDraw onDone={() => setStep('write')} />}
      {step === 'write' && <WriteItBack onDone={() => setStep('check')} />}
      {step === 'check' && <CheckIt />}

      <div className="btn-row" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => { stopSpeaking(); next(); }}>
          Next: Story Check →
        </button>
      </div>
    </>
  );
}

/* ================================================================== *
 * Drawing box
 * ================================================================== */

function DrawBox({
  value,
  onChange,
  height = 230,
  colour = '#2a1348',
}: {
  value: string | null;
  onChange: (data: string | null) => void;
  height?: number;
  colour?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth;
    cv.width = w * dpr;
    cv.height = height * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fdfcff';
    ctx.fillRect(0, 0, w, height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, height);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const p = pos(e);
    ctx.strokeStyle = erasing ? '#fdfcff' : colour;
    ctx.lineWidth = erasing ? 22 : 3.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(ref.current!.toDataURL('image/png'));
  };

  const clear = () => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#fdfcff';
    ctx.fillRect(0, 0, cv.clientWidth, height);
    onChange(null);
    sfx.tap();
  };

  return (
    <div>
      <canvas
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        style={{
          width: '100%',
          height,
          borderRadius: 'var(--r-md)',
          background: '#fdfcff',
          touchAction: 'none',
          cursor: 'crosshair',
          display: 'block',
          border: '2px solid rgba(255,255,255,.2)',
        }}
      />
      <div className="row" style={{ gap: 6, marginTop: 8 }}>
        <button className={`btn btn--sm ${erasing ? 'btn--ghost' : ''}`} onClick={() => setErasing(false)}>
          ✏️ Draw
        </button>
        <button className={`btn btn--sm ${erasing ? '' : 'btn--ghost'}`} onClick={() => setErasing(true)}>
          🩹 Erase
        </button>
        <button className="btn btn--ghost btn--sm" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 1 · Listen and draw
 * ================================================================== */

function ListenAndDraw({ onDone }: { onDone: () => void }) {
  const { state, update } = useGame();
  const [i, setI] = useState(state.picture.heard);
  const [played, setPlayed] = useState(false);
  const [timing, setTiming] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const play = () => {
    setPlayed(true);
    setTiming(false);
    speak(STORY_SENTENCES[i], {
      rate: 0.86,
      onEnd: () => {
        setRunKey((k) => k + 1);
        setTiming(true);
      },
    });
  };

  const go = (delta: number) => {
    stopSpeaking();
    const n = i + delta;
    if (n >= STORY_SENTENCES.length) {
      sfx.star();
      onDone();
      return;
    }
    if (n < 0) return;
    setI(n);
    setPlayed(false);
    setTiming(false);
    update((d) => {
      d.picture.heard = Math.max(d.picture.heard, n);
    });
  };

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Box {i + 1} of 6</div>
          <h2 style={{ fontSize: 24 }}>Listen, then draw one quick picture</h2>
        </div>
        <span className="pill">Draw only · no words, no letters</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: 22, alignItems: 'start' }}>
        <div className="stack">
          <button className="btn btn--lg" onClick={play}>
            {played ? '🔁 Play again' : '▶ Play sentence ' + (i + 1)}
          </button>
          <CountdownRing
            seconds={15}
            running={timing}
            runKey={runKey}
            size={110}
            label="drawing time"
            onDone={() => sfx.tick()}
          />
          <p className="hint" style={{ margin: 0 }}>
            The text stays hidden on purpose. Your pictures are the only notes you get.
          </p>
        </div>

        <div>
          <DrawBox
            key={i}
            height={260}
            value={state.picture.drawings[i]}
            onChange={(data) =>
              update((d) => {
                d.picture.drawings[i] = data;
              })
            }
          />
          <div className="btn-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => go(-1)} disabled={i === 0}>
              ← Previous
            </button>
            <button className="btn" onClick={() => go(1)}>
              {i === STORY_SENTENCES.length - 1 ? 'All six drawn →' : 'Next sentence →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * 2 · Write it back
 * ================================================================== */

function WriteItBack({ onDone }: { onDone: () => void }) {
  const { state, update } = useGame();
  const [eyes, setEyes] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [writing, setWriting] = useState(false);

  const words = state.picture.retell.trim() ? state.picture.retell.trim().split(/\s+/).length : 0;

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Task B</div>
          <h2 style={{ fontSize: 24 }}>Close your eyes. See the story. Now write it.</h2>
        </div>
        <span className="pill">{words} words</span>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        {state.picture.drawings.map((d, i) =>
          d ? (
            <img
              key={i}
              src={d}
              alt={`Your drawing ${i + 1}`}
              style={{
                width: 108,
                height: 76,
                objectFit: 'cover',
                borderRadius: 10,
                border: '2px solid rgba(255,255,255,.2)',
              }}
            />
          ) : (
            <div
              key={i}
              style={{
                width: 108,
                height: 76,
                borderRadius: 10,
                border: '2px dashed rgba(255,255,255,.16)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink-faint)',
                fontSize: 13,
              }}
            >
              box {i + 1}
            </div>
          ),
        )}
      </div>

      {!eyes ? (
        <button
          className="btn"
          onClick={() => {
            setEyes(true);
            sfx.tap();
            window.setTimeout(() => {
              setWriting(true);
              setRunKey((k) => k + 1);
              sfx.right();
            }, 5000);
          }}
        >
          👀 Close your eyes for five seconds
        </button>
      ) : (
        <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <textarea
              className="field"
              rows={9}
              placeholder="Richie is a…"
              value={state.picture.retell}
              onChange={(e) =>
                update((d) => {
                  d.picture.retell = e.target.value;
                })
              }
            />
          </div>
          <CountdownRing seconds={240} running={writing} runKey={runKey} size={104} label="4 minutes" />
        </div>
      )}

      {eyes && (
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={onDone} disabled={words < 3}>
            Now check the original →
          </button>
          <span className="hint">Compare with your partner first: what did they remember and you didn’t?</span>
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * 3 · Check against the original
 * ================================================================== */

function CheckIt() {
  const { state, update } = useGame();
  const [ticks, setTicks] = useState<boolean[]>(Array(6).fill(false));
  const revealed = state.picture.revealed;
  const score = ticks.filter(Boolean).length;

  return (
    <div className="panel">
      {!revealed ? (
        <div style={{ textAlign: 'center', padding: '26px 0' }}>
          <h2 style={{ fontSize: 28 }}>Incoming transmission</h2>
          <p className="hint" style={{ maxWidth: 520, margin: '8px auto 20px' }}>
            The original text is on the wall. Open it, read it, and add the words you forgot in a different colour.
          </p>
          <button
            className="btn btn--lg"
            onClick={() => {
              sfx.launch();
              update((d) => {
                d.picture.revealed = true;
              });
            }}
          >
            📡 Open the original text
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
          <div>
            <div className="eyebrow">The original</div>
            <div
              className="tile-card"
              style={{ marginTop: 8, background: 'rgba(255,255,255,.07)', ['--accent' as string]: 'var(--cyan)' }}
            >
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>
                The Adventures of Richie the Chameleon
              </h3>
              {STORY_FULL.map((p, i) => (
                <p key={i} style={{ margin: '0 0 10px', lineHeight: 1.65 }}>
                  {p}
                </p>
              ))}
              <button className="btn btn--ghost btn--sm" onClick={() => speak(STORY_FULL.join(' '), { rate: 0.9 })}>
                🔈 Read it to me
              </button>
            </div>
          </div>

          <div>
            <div className="eyebrow">How many sentences did you remember?</div>
            <div className="stack" style={{ gap: 8, marginTop: 8 }}>
              {STORY_SENTENCES.map((s, i) => (
                <button
                  key={i}
                  className="choice"
                  data-state={ticks[i] ? 'right' : undefined}
                  onClick={() => {
                    sfx.tap();
                    setTicks((t) => t.map((v, j) => (j === i ? !v : v)));
                  }}
                >
                  <span style={{ flex: 'none', width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
                    <WordArt word={wordById(STORY_IMAGES[i])} size={36} float={false} />
                  </span>
                  <span style={{ flex: 1, fontSize: 15 }}>{s}</span>
                  <span style={{ flex: 'none' }}>{ticks[i] ? '✅' : '⬜'}</span>
                </button>
              ))}
            </div>

            <div className="row" style={{ marginTop: 14, gap: 12 }}>
              <span className="pill" style={{ fontSize: 18 }}>
                <Star size={16} /> {score} / 6
              </span>
              <button
                className="btn"
                onClick={() => {
                  score >= 5 ? sfx.star() : sfx.tap();
                  update((d) => {
                    d.picture.remembered = score;
                  });
                }}
              >
                Save my score
              </button>
            </div>

            {state.picture.remembered !== null && (
              <div style={{ marginTop: 12 }}>
                <Verdict
                  ok={state.picture.remembered >= 4}
                  text={
                    state.picture.remembered >= 5
                      ? 'Excellent memory — your pictures did the work.'
                      : state.picture.remembered >= 4
                        ? 'Good. Read the text once more and try to retell it out loud.'
                        : 'Try again: look only at your drawings and retell the story aloud.'
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
