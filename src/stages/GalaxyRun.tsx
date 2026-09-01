import { useEffect, useMemo, useState } from 'react';
import {
  BOARD,
  METEOR_CARDS,
  MIRA_CARDS,
  STAR_CARDS,
  TILE_INFO,
  USEFUL_PHRASES,
  WILD_CARDS,
  WORDS,
  type MeteorCard,
  type MiraCard,
  type StarCard,
  type TileKind,
  type Word,
} from '../data/content';
import { useGame, type Pilot } from '../state/game';
import {
  CountdownRing,
  Modal,
  PilotChip,
  Rocket,
  StageHead,
  Star,
  StarBurst,
  WordArt,
  shuffle,
} from '../components/ui';
import { MeteorTask, STORYCHECK_METEORS } from './StoryCheck';
import { sfx, speak } from '../lib/audio';

const GAME_METEORS = METEOR_CARDS.filter((c) => !STORYCHECK_METEORS.some((s) => s.id === c.id));

type Task =
  | { kind: 'word'; word: Word | null; wild?: (typeof WILD_CARDS)[number] }
  | { kind: 'meteor'; card: MeteorCard }
  | { kind: 'mira'; card: MiraCard }
  | { kind: 'star'; card: StarCard }
  | { kind: 'boost' }
  | { kind: 'wormhole'; jump: number }
  | { kind: 'finish' };

const TILE_ICON: Record<TileKind, string> = {
  start: '🏁',
  word: '💬',
  meteor: '☄️',
  mira: '🦉',
  star: '⭐',
  boost: '⚡',
  wormhole: '🌀',
  finish: '🏫',
};

function useColumns() {
  const [cols, setCols] = useState(() => (window.innerWidth < 760 ? 3 : 7));
  useEffect(() => {
    const onResize = () => setCols(window.innerWidth < 760 ? 3 : 7);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
}

export function GalaxyRun() {
  const { state, update, next } = useGame();
  const [die, setDie] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [moving, setMoving] = useState(false);
  const [burst, setBurst] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const cols = useColumns();
  const pilots = state.pilots;
  const turn = state.turn % pilots.length;
  const pilot = pilots[turn];
  const racing = pilots.filter((p) => !p.place);
  const raceOver = racing.length === 0;

  const log = (line: string) =>
    update((d) => {
      d.run.log.unshift(line);
      d.run.log = d.run.log.slice(0, 40);
    });

  /* ------------------------------------------------------------ turn flow */

  const endTurn = () => {
    setTask(null);
    setDie(null);
    update((d) => {
      let n = d.turn;
      for (let i = 0; i < d.pilots.length; i++) {
        n = (n + 1) % d.pilots.length;
        if (!d.pilots[n].place) break;
      }
      d.turn = n;
      d.run.round += 1;
    });
  };

  const stepTo = async (target: number, onArrive: (final: number) => void) => {
    setMoving(true);
    const from = pilot.pos;
    const final = Math.min(20, Math.max(0, target));
    const dir = final > from ? 1 : -1;
    for (let p = from; p !== final; p += dir) {
      await new Promise((r) => window.setTimeout(r, 170));
      const at = p + dir;
      update((d) => {
        d.pilots[turn].pos = at;
      });
      sfx.move();
    }
    setMoving(false);
    onArrive(final);
  };

  const drawFor = (kind: TileKind): Task => {
    if (kind === 'word') {
      const usedWild = Math.random() < 0.15;
      if (usedWild) return { kind: 'word', word: null, wild: WILD_CARDS[Math.floor(Math.random() * 2)] };
      const fresh = WORDS.filter((w) => !state.run.usedWord.includes(w.id));
      const pool = fresh.length ? fresh : WORDS;
      const word = pool[Math.floor(Math.random() * pool.length)];
      update((d) => {
        if (!d.run.usedWord.includes(word.id)) d.run.usedWord.push(word.id);
        else d.run.usedWord = [word.id];
      });
      return { kind: 'word', word };
    }
    if (kind === 'meteor') {
      const fresh = GAME_METEORS.filter((c) => !state.run.usedMeteor.includes(c.id));
      const pool = fresh.length ? fresh : GAME_METEORS;
      const card = pool[Math.floor(Math.random() * pool.length)];
      update((d) => {
        if (fresh.length) d.run.usedMeteor.push(card.id);
        else d.run.usedMeteor = [card.id];
      });
      return { kind: 'meteor', card };
    }
    if (kind === 'mira') {
      const fresh = MIRA_CARDS.filter((c) => !state.run.usedMira.includes(c.id));
      const pool = fresh.length ? fresh : MIRA_CARDS;
      const card = pool[Math.floor(Math.random() * pool.length)];
      update((d) => {
        if (fresh.length) d.run.usedMira.push(card.id);
        else d.run.usedMira = [card.id];
      });
      return { kind: 'mira', card };
    }
    const fresh = STAR_CARDS.filter((c) => !state.run.usedStar.includes(c.id));
    const pool = fresh.length ? fresh : STAR_CARDS;
    const card = pool[Math.floor(Math.random() * pool.length)];
    update((d) => {
      if (fresh.length) d.run.usedStar.push(card.id);
      else d.run.usedStar = [card.id];
    });
    return { kind: 'star', card };
  };

  const roll = () => {
    if (rolling || moving || task) return;
    setRolling(true);
    sfx.roll();
    let ticks = 0;
    const id = window.setInterval(() => {
      setDie(1 + Math.floor(Math.random() * 6));
      if (++ticks > 9) {
        window.clearInterval(id);
        const value = 1 + Math.floor(Math.random() * 6);
        setDie(value);
        setRolling(false);
        log(`${pilot.callsign} rolled ${value}`);
        void stepTo(pilot.pos + value, arrive);
      }
    }, 70);
  };

  const arrive = (at: number) => {
    const tile = BOARD[at];
    if (at >= 20) {
      const place = pilots.filter((p) => p.place).length + 1;
      update((d) => {
        d.pilots[turn].place = place;
        d.pilots[turn].stars += 2;
      });
      sfx.fanfare();
      setBurst((b) => b + 1);
      log(`🏫 ${pilot.callsign} reached the NEW SCHOOL — place ${place}! (+2 stars)`);
      setTask({ kind: 'finish' });
      return;
    }
    if (tile.kind === 'boost') {
      sfx.star();
      log(`⚡ ${pilot.callsign} caught a boost: +2 tiles and a shield`);
      update((d) => {
        d.pilots[turn].shields += 1;
      });
      setTask({ kind: 'boost' });
      return;
    }
    if (tile.kind === 'wormhole') {
      sfx.wormhole();
      log(`🌀 ${pilot.callsign} fell into a wormhole: ${tile.jump! > 0 ? '+' : ''}${tile.jump}`);
      setTask({ kind: 'wormhole', jump: tile.jump! });
      return;
    }
    if (tile.kind === 'start') {
      endTurn();
      return;
    }
    setTask(drawFor(tile.kind));
  };

  /* --------------------------------------------------------- task results */

  const giveStar = (n = 1) => {
    update((d) => {
      d.pilots[turn].stars += n;
    });
    setBurst((b) => b + 1);
    sfx.star();
  };

  const succeed = (line: string) => {
    giveStar();
    log(`⭐ ${pilot.callsign}: ${line}`);
    endTurn();
  };

  const fail = (line: string, penalty = 0) => {
    log(`✖ ${pilot.callsign}: ${line}`);
    if (penalty) {
      if (pilot.shields > 0) {
        update((d) => {
          d.pilots[turn].shields -= 1;
        });
        setNote('🛡️ Shield used — your rocket stays where it is.');
      } else {
        update((d) => {
          d.pilots[turn].pos = Math.max(0, d.pilots[turn].pos - penalty);
        });
        setNote(`Back ${penalty} tiles.`);
      }
      window.setTimeout(() => setNote(null), 2200);
    }
    endTurn();
  };

  /* ------------------------------------------------------------ rendering */

  const positions = useMemo(() => {
    return BOARD.map((t) => {
      const row = Math.floor(t.n / cols);
      const inRow = t.n % cols;
      const col = row % 2 === 0 ? inRow : cols - 1 - inRow;
      const rows = Math.ceil(BOARD.length / cols);
      return { ...t, col: col + 1, row: rows - row };
    });
  }, [cols]);

  const rowsTotal = Math.ceil(BOARD.length / cols);

  return (
    <>
      <StarBurst fire={burst} />
      <StageHead
        eyebrow="Stage 5 · 36–53 min · the core of the mission"
        title="Galaxy Run"
        sub="Roll, land, speak. English only — Russian on your turn and your rocket stays where it is."
        right={
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowRules(true)}>
              📖 How to play
            </button>
            {state.hard && <span className="pill" style={{ color: 'var(--red)' }}>HARD MODE</span>}
          </div>
        }
      />

      {/* scoreboard */}
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        {pilots.map((p, i) => (
          <div key={p.id} style={{ position: 'relative' }}>
            <PilotChip
              callsign={p.callsign}
              colour={p.colour}
              stars={p.stars}
              active={i === turn && !raceOver}
            />
            {p.place && (
              <span
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -6,
                  background: 'var(--yellow)',
                  color: '#3a1e00',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '1px 6px',
                }}
              >
                #{p.place}
              </span>
            )}
            {p.shields > 0 && (
              <span style={{ position: 'absolute', bottom: -6, right: -4, fontSize: 13 }}>🛡️{p.shields}</span>
            )}
          </div>
        ))}
      </div>

      {/* board */}
      <div className="panel" style={{ padding: 'clamp(12px, 2vw, 22px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rowsTotal}, auto)`,
            gap: 'clamp(6px, 1vw, 12px)',
          }}
        >
          {positions.map((t) => {
            const info = TILE_INFO[t.kind];
            const here = pilots.filter((p) => p.pos === t.n);
            const isCurrent = pilot.pos === t.n;
            return (
              <div
                key={t.n}
                style={{
                  gridColumn: t.col,
                  gridRow: t.row,
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--r-md)',
                  background: `linear-gradient(160deg, ${info.colour}2e, ${info.colour}12)`,
                  border: `1px solid ${isCurrent ? info.colour : 'rgba(255,255,255,.14)'}`,
                  boxShadow: isCurrent ? `0 0 22px ${info.colour}88` : 'none',
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 4,
                  transition: 'box-shadow .25s, border-color .25s',
                }}
                title={`${info.label} — ${info.task}`}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 7,
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,.45)',
                  }}
                >
                  {t.kind === 'start' ? '' : t.kind === 'finish' ? '' : t.n}
                </span>
                <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
                  <div style={{ fontSize: 'clamp(16px, 2.6vw, 24px)' }}>{TILE_ICON[t.kind]}</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(7px, 1.1vw, 11px)',
                      letterSpacing: '.08em',
                      color: info.colour,
                      marginTop: 2,
                    }}
                  >
                    {info.label}
                  </div>
                </div>

                {here.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      display: 'flex',
                      gap: -4,
                      justifyContent: 'center',
                      width: '100%',
                    }}
                  >
                    {here.map((p) => (
                      <span key={p.id} className="pop" title={p.callsign} style={{ marginLeft: -4 }}>
                        <Rocket colour={p.colour} size={24} tilt={0} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* turn controls */}
      {!raceOver ? (
        <div className="panel panel--tight" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row" style={{ gap: 12 }}>
              <Rocket colour={pilot.colour} size={38} tilt={0} />
              <div>
                <div className="eyebrow">Whose turn?</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>{pilot.callsign}</div>
              </div>
            </div>

            <div className="row" style={{ gap: 14 }}>
              <div
                aria-label="die"
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 14,
                  background: 'linear-gradient(160deg,#fff,#ded7ee)',
                  color: '#22103f',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  boxShadow: 'var(--shadow-lift)',
                  transform: rolling ? 'rotate(12deg) scale(1.06)' : 'none',
                  transition: 'transform .12s',
                }}
              >
                {die ?? '·'}
              </div>
              <button className="btn btn--lg" onClick={roll} disabled={rolling || moving || !!task}>
                {rolling ? 'Rolling…' : moving ? 'Flying…' : 'Roll the die'}
              </button>
            </div>
          </div>
          {note && (
            <p className="pop" style={{ marginBottom: 0, marginTop: 10, color: 'var(--yellow)', fontWeight: 700 }}>
              {note}
            </p>
          )}
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 16, textAlign: 'center' }}>
          <h2 style={{ fontSize: 30 }}>🏫 Everybody has landed at the New School</h2>
          <p className="hint">Take your logbooks to the landing stage and count the stars.</p>
        </div>
      )}

      {/* activity log */}
      {state.run.log.length > 0 && (
        <details className="panel panel--tight" style={{ marginTop: 14 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--ink-soft)' }}>Flight log</summary>
          <div className="stack" style={{ gap: 4, marginTop: 10 }}>
            {state.run.log.slice(0, 12).map((l, i) => (
              <div key={i} className="hint" style={{ fontSize: 13 }}>
                {l}
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="btn-row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => {
            if (!confirm('Reset the race? Stars stay, rockets go back to START.')) return;
            update((d) => {
              d.pilots.forEach((p) => {
                p.pos = 0;
                p.place = null;
              });
              d.turn = 0;
              d.run.log = [];
            });
          }}
        >
          Reset the race
        </button>
        <button className="btn" onClick={next}>
          Next: My Planet →
        </button>
      </div>

      {/* ------------------------------------------------------- task modal */}
      <TaskModal
        task={task}
        pilot={pilot}
        hard={state.hard}
        onClose={() => setTask(null)}
        onSucceed={succeed}
        onFail={fail}
        onContinue={(delta) => {
          if (delta) {
            void stepTo(pilot.pos + delta, (final) => {
              const tile = BOARD[final];
              if (final >= 20 || ['word', 'meteor', 'mira', 'star'].includes(tile.kind)) {
                arrive(final);
              } else {
                endTurn();
              }
            });
            setTask(null);
          } else {
            endTurn();
          }
        }}
      />

      <Modal open={showRules} onClose={() => setShowRules(false)} title="How to play Galaxy Run">
        <div className="stack" style={{ gap: 10 }}>
          {(Object.keys(TILE_INFO) as TileKind[])
            .filter((k) => k !== 'start')
            .map((k) => (
              <div key={k} className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                <span style={{ fontSize: 22, flex: 'none' }}>{TILE_ICON[k]}</span>
                <div>
                  <b style={{ color: TILE_INFO[k].colour, fontFamily: 'var(--font-display)' }}>{TILE_INFO[k].label}</b>
                  <div className="hint">{TILE_INFO[k].task}</div>
                </div>
              </div>
            ))}
          <div className="tile-card" style={{ ['--accent' as string]: 'var(--yellow)', marginTop: 6 }}>
            <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
              The golden rule
            </span>
            <p style={{ margin: '6px 0 0' }}>
              English only. Try, make mistakes, keep flying. A good answer is one star — the first rocket at the NEW
              SCHOOL wins the race, the most stars wins the MVP badge. You can win one, or both.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ================================================================== *
 * The task modal
 * ================================================================== */

function TaskModal({
  task,
  pilot,
  hard,
  onClose,
  onSucceed,
  onFail,
  onContinue,
}: {
  task: Task | null;
  pilot: Pilot;
  hard: boolean;
  onClose: () => void;
  onSucceed: (line: string) => void;
  onFail: (line: string, penalty?: number) => void;
  onContinue: (delta: number) => void;
}) {
  if (!task) return null;

  const title =
    task.kind === 'word'
      ? '💬 WORD — describe it'
      : task.kind === 'meteor'
        ? '☄️ METEOR — fix the mistake'
        : task.kind === 'mira'
          ? '🦉 MIRA — story question'
          : task.kind === 'star'
            ? '⭐ STAR — speak!'
            : task.kind === 'boost'
              ? '⚡ BOOST'
              : task.kind === 'wormhole'
                ? '🌀 WORMHOLE'
                : '🏫 NEW SCHOOL';

  return (
    <Modal open onClose={onClose} title={`${pilot.callsign} · ${title}`} width={720}>
      {task.kind === 'word' && <WordTile task={task} hard={hard} onSucceed={onSucceed} onFail={onFail} />}
      {task.kind === 'meteor' && (
        <MeteorTask
          card={task.card}
          onSolved={() => onSucceed(`fixed “${task.card.tokens[task.card.wrong[0]]}” → “${task.card.fix}”`)}
          onFailed={() => undefined}
        />
      )}
      {task.kind === 'meteor' && (
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => onFail('could not fix the meteor', 2)}>
            Give up — go back 2
          </button>
        </div>
      )}
      {task.kind === 'mira' && <MiraTile card={task.card} onSucceed={onSucceed} onFail={onFail} />}
      {task.kind === 'star' && <StarTile card={task.card} hard={hard} onSucceed={onSucceed} onFail={onFail} />}

      {task.kind === 'boost' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 54 }}>⚡</div>
          <p style={{ fontSize: 19 }}>Free move! Fly two tiles forward — and take a shield for a bad landing.</p>
          <button className="btn btn--lg" onClick={() => onContinue(2)}>
            Fly +2 →
          </button>
        </div>
      )}

      {task.kind === 'wormhole' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 54 }}>🌀</div>
          <p style={{ fontSize: 19 }}>
            The wormhole pulls you {task.jump > 0 ? 'forward' : 'back'} {Math.abs(task.jump)} tiles. No card, no star.
          </p>
          <button className="btn btn--lg" onClick={() => onContinue(task.jump)}>
            {task.jump > 0 ? 'Jump forward' : 'Fall back'} {Math.abs(task.jump)} →
          </button>
        </div>
      )}

      {task.kind === 'finish' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60 }}>🏫</div>
          <h3 style={{ fontSize: 26 }}>Welcome to the New School Galaxy, {pilot.callsign}!</h3>
          <p className="hint">+2 stars for landing. The other pilots keep flying.</p>
          <button className="btn btn--lg" onClick={() => onContinue(0)}>
            Continue the race →
          </button>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------- WORD tile */

function WordTile({
  task,
  hard,
  onSucceed,
  onFail,
}: {
  task: Extract<Task, { kind: 'word' }>;
  hard: boolean;
  onSucceed: (line: string) => void;
  onFail: (line: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [running, setRunning] = useState(false);

  if (task.wild) {
    return (
      <div style={{ textAlign: 'center' }}>
        <span className="card-label">Wild card</span>
        <h3 style={{ fontSize: 26, margin: '8px 0 14px' }}>{task.wild.task}</h3>
        <CountdownRing seconds={20} running={running} runKey={task.wild.id} size={110} label="20 seconds" />
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 14 }}>
          {!running ? (
            <button className="btn" onClick={() => setRunning(true)}>
              Start
            </button>
          ) : (
            <>
              <button className="btn btn--star" onClick={() => onSucceed('wild card done')}>
                <Star size={16} /> Crew guessed it — 1 star
              </button>
              <button className="btn btn--ghost" onClick={() => onFail('wild card missed')}>
                No star
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const word = task.word!;

  return (
    <div>
      {!revealed ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <p style={{ fontSize: 18 }}>
            Only you look at the card. Describe the word — your crew guesses. Never say the taboo words.
          </p>
          <button
            className="btn btn--lg"
            onClick={() => {
              setRevealed(true);
              setRunning(true);
              sfx.tap();
            }}
          >
            👀 Show my card
          </button>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(140px, 200px) 1fr', gap: 20, alignItems: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(180deg,#fbfaff,#e9e4f5)',
              borderRadius: 'var(--r-md)',
              padding: 12,
              display: 'grid',
              placeItems: 'center',
              color: '#22103f',
            }}
          >
            <WordArt word={word} size={116} float={false} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#1a0a33', lineHeight: 1.1 }}>
              {word.word}
            </div>
            <div style={{ fontSize: 12, letterSpacing: '.16em', color: '#b03a2e', marginTop: 6 }}>DON’T SAY</div>
            <div style={{ fontWeight: 800, color: '#7a2018' }}>{word.taboo.join(' · ')}</div>
          </div>

          <div className="stack">
            <CountdownRing
              seconds={hard ? 30 : 45}
              running={running}
              runKey={word.id}
              size={104}
              label={hard ? 'one sentence only' : 'describe it'}
            />
            <div>
              <div className="eyebrow">Useful</div>
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                {USEFUL_PHRASES.slice(0, 4).map((p) => (
                  <span key={p} className="pill" style={{ fontSize: 12 }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn--star" onClick={() => onSucceed(`described “${word.word}”`)}>
                <Star size={16} /> Good — 1 star
              </button>
              <button className="btn btn--ghost" onClick={() => onFail(`could not describe “${word.word}”`)}>
                No star
              </button>
            </div>
            <p className="hint" style={{ margin: 0 }}>
              Teacher decides: a fair description in English earns the star.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- MIRA tile */

function MiraTile({
  card,
  onSucceed,
  onFail,
}: {
  card: MiraCard;
  onSucceed: (line: string) => void;
  onFail: (line: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(
    () => (card.options ? shuffle([card.a, ...card.options], card.id.length * 0.53) : []),
    [card.id],
  );

  if (!card.options) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: 26, marginBottom: 8 }}>{card.q}</h3>
        <p className="hint">Any true sentence about the story counts.</p>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button className="btn btn--star" onClick={() => onSucceed('answered Mira from memory')}>
            <Star size={16} /> Good — 1 star
          </button>
          <button className="btn btn--ghost" onClick={() => onFail('could not answer Mira')}>
            No star
          </button>
        </div>
      </div>
    );
  }

  const choose = (o: string) => {
    setPicked(o);
    if (o === card.a) {
      sfx.right();
      window.setTimeout(() => onSucceed(`answered “${card.q}”`), 700);
    } else {
      sfx.wrong();
    }
  };

  return (
    <div>
      <div className="row" style={{ gap: 14, marginBottom: 14 }}>
        <img
          src={`${import.meta.env.BASE_URL}art/owl.webp`}
          alt="Mira the owl"
          width={64}
          className="word-art"
          style={{ flex: 'none' }}
        />
        <h3 style={{ fontSize: 'clamp(19px, 3vw, 26px)', flex: 1 }}>{card.q}</h3>
        <button className="icon-btn" onClick={() => speak(card.q)} aria-label="Listen to the question">
          🔈
        </button>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {options.map((o, i) => (
          <button
            key={o}
            className="choice"
            data-state={picked ? (o === card.a ? 'right' : picked === o ? 'wrong' : 'muted') : undefined}
            disabled={picked === card.a}
            onClick={() => choose(o)}
          >
            <span className="choice__key">{String.fromCharCode(65 + i)}</span>
            <span style={{ flex: 1 }}>{o}</span>
          </button>
        ))}
      </div>
      {picked && picked !== card.a && (
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => onFail('missed the story question')}>
            Skip — no star
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- STAR tile */

function StarTile({
  card,
  hard,
  onSucceed,
  onFail,
}: {
  card: StarCard;
  hard: boolean;
  onSucceed: (line: string) => void;
  onFail: (line: string) => void;
}) {
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const seconds = hard ? 20 : 15;

  return (
    <div style={{ textAlign: 'center' }}>
      <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
        {seconds} seconds · no stopping
      </span>
      <h3 style={{ fontSize: 'clamp(20px, 3.4vw, 28px)', margin: '10px 0 14px' }}>{card.prompt}</h3>

      <div className="row" style={{ justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {card.support.map((s) => (
          <span key={s} className="pill">
            {s}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        <CountdownRing
          seconds={seconds}
          running={running}
          runKey={card.id}
          size={140}
          onDone={() => {
            setOver(true);
            sfx.star();
          }}
        />
      </div>

      <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>
        {!running ? (
          <button
            className="btn btn--lg"
            onClick={() => {
              setRunning(true);
              sfx.tap();
            }}
          >
            Speak — from now!
          </button>
        ) : (
          <>
            <button className="btn btn--star" onClick={() => onSucceed(`spoke ${seconds}s: ${card.prompt}`)}>
              <Star size={16} /> Made it — 1 star
            </button>
            <button className="btn btn--ghost" onClick={() => onFail('stopped before the buzzer')}>
              Stopped early
            </button>
          </>
        )}
      </div>
      {over && <p className="hint" style={{ marginTop: 10 }}>Time! Teacher decides: did the pilot keep going in English?</p>}
    </div>
  );
}
