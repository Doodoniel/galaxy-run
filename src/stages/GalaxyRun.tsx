import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BOARD,
  METEOR_CARDS,
  MIRA_CARDS,
  STAR_CARDS,
  TILE_INFO,
  USEFUL_PHRASES,
  WORDS,
  type MeteorCard,
  type MiraCard,
  type StarCard,
  type TileKind,
  type Word,
} from '../data/content';
import { useGame, type AnswerDetail, type Pilot } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { MeteorTask } from '../components/MeteorTask';
import {
  CountdownRing,
  Modal,
  Rocket,
  Star,
  StarBurst,
  WordArt,
  shuffle,
  tap,
} from '../components/ui';
import { CHECK_METEORS } from './Check';
import { sfx, speak } from '../lib/audio';
import { artUrl } from '../lib/art';

/** The meteors the practice phase did not use. */
const GAME_METEORS = METEOR_CARDS.filter((c) => !CHECK_METEORS.some((s) => s.id === c.id));

type Task =
  | { kind: 'word'; word: Word }
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

/**
 * The board has to fit the box it is given in BOTH directions. CSS cannot do
 * that on its own here: the tiles are square, so their automatic minimum size
 * grows with the row height and pushes the last column off the screen. So the
 * size is measured and worked out once per resize.
 */
function useBoardFit(cols: number, rows: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = Math.min(1150, box.w, box.h * (cols / rows));
  return { ref, width: width > 0 ? width : undefined, height: width > 0 ? (width * rows) / cols : undefined };
}

function useColumns() {
  const [cols, setCols] = useState(() => (window.innerWidth < 820 ? 4 : 7));
  useEffect(() => {
    const onResize = () => setCols(window.innerWidth < 820 ? 4 : 7);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
}

export function GalaxyRun() {
  const { state, update, record } = useGame();
  const [die, setDie] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [moving, setMoving] = useState(false);
  const [burst, setBurst] = useState(0);
  const [rules, setRules] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const cols = useColumns();
  const rows = Math.ceil(BOARD.length / cols);
  const fit = useBoardFit(cols, rows);
  const pilots = state.pilots;
  const turn = state.turn % pilots.length;
  const pilot = pilots[turn];
  const raceOver = pilots.every((p) => p.place);

  const log = (line: string) =>
    update((d) => {
      d.run.log.unshift(line);
      d.run.log = d.run.log.slice(0, 30);
    });

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
      await new Promise((r) => window.setTimeout(r, 150));
      const at = p + dir;
      update((d) => void (d.pilots[turn].pos = at));
      sfx.move();
    }
    setMoving(false);
    onArrive(final);
  };

  const drawFor = (kind: TileKind): Task => {
    const pull = <T extends { id: string }>(deck: T[], used: string[], keep: (ids: string[]) => void): T => {
      const fresh = deck.filter((c) => !used.includes(c.id));
      const pool = fresh.length ? fresh : deck;
      const card = pool[Math.floor(Math.random() * pool.length)];
      keep(fresh.length ? [...used, card.id] : [card.id]);
      return card;
    };

    if (kind === 'word') {
      const word = pull(WORDS, state.run.usedWord, (ids) => update((d) => void (d.run.usedWord = ids)));
      return { kind: 'word', word };
    }
    if (kind === 'meteor') {
      const card = pull(GAME_METEORS, state.run.usedMeteor, (ids) => update((d) => void (d.run.usedMeteor = ids)));
      return { kind: 'meteor', card };
    }
    if (kind === 'mira') {
      const card = pull(MIRA_CARDS, state.run.usedMira, (ids) => update((d) => void (d.run.usedMira = ids)));
      return { kind: 'mira', card };
    }
    const card = pull(STAR_CARDS, state.run.usedStar, (ids) => update((d) => void (d.run.usedStar = ids)));
    return { kind: 'star', card };
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
      log(`🏫 ${pilot.callsign} reached the NEW SCHOOL — place ${place}`);
      setTask({ kind: 'finish' });
      return;
    }
    if (tile.kind === 'boost') {
      sfx.star();
      update((d) => void (d.pilots[turn].shields++));
      log(`⚡ ${pilot.callsign} caught a boost`);
      setTask({ kind: 'boost' });
      return;
    }
    if (tile.kind === 'wormhole') {
      sfx.wormhole();
      setTask({ kind: 'wormhole', jump: tile.jump! });
      return;
    }
    if (tile.kind === 'start') {
      endTurn();
      return;
    }
    setTask(drawFor(tile.kind));
  };

  const roll = () => {
    if (rolling || moving || task || raceOver) return;
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

  const succeed = (line: string) => {
    update((d) => void (d.pilots[turn].stars++));
    setBurst((b) => b + 1);
    sfx.star();
    log(`⭐ ${pilot.callsign}: ${line}`);
    endTurn();
  };

  const fail = (line: string, penalty = 0) => {
    log(`✖ ${pilot.callsign}: ${line}`);
    if (penalty) {
      if (pilot.shields > 0) {
        update((d) => void d.pilots[turn].shields--);
        setNote('🛡️ Shield used — the rocket stays.');
      } else {
        update((d) => void (d.pilots[turn].pos = Math.max(0, d.pilots[turn].pos - penalty)));
        setNote(`Back ${penalty} tiles.`);
      }
      window.setTimeout(() => setNote(null), 2200);
    }
    endTurn();
  };

  const positions = useMemo(
    () =>
      BOARD.map((t) => {
        const row = Math.floor(t.n / cols);
        const inRow = t.n % cols;
        return { ...t, col: (row % 2 === 0 ? inRow : cols - 1 - inRow) + 1, row: rows - row };
      }),
    [cols, rows],
  );

  return (
    <Stage
      title="Galaxy Run"
      step={raceOver ? 'race over' : undefined}
      turn={!raceOver}
      aside={
        <button className="btn btn--ghost btn--sm" onClick={tap(() => setRules(true))}>
          📖 Rules
        </button>
      }
      hint={note ?? undefined}
      footer={
        <div className="row" style={{ gap: 'calc(var(--u)*1.1)', flexWrap: 'nowrap' }}>
          <span
            aria-label="die"
            style={{
              width: 'clamp(38px, 6vh, 54px)',
              height: 'clamp(38px, 6vh, 54px)',
              borderRadius: 12,
              background: 'linear-gradient(160deg,#fff,#ded7ee)',
              color: '#22103f',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 3.2vh, 30px)',
              transform: rolling ? 'rotate(12deg) scale(1.06)' : 'none',
              transition: 'transform .12s',
            }}
          >
            {die ?? '·'}
          </span>
          {raceOver ? (
            <NextButton label="To My Planet" />
          ) : (
            <button className="btn btn--lg" onClick={roll} disabled={rolling || moving || !!task}>
              {rolling ? 'Rolling…' : moving ? 'Flying…' : 'Roll'}
            </button>
          )}
          <NextButton label="Skip ahead" />
        </div>
      }
    >
      <StarBurst fire={burst} />

      {/* The board is sized by the height it is given, so the whole route is
          always on screen — a projector is short, not narrow. */}
      <div ref={fit.ref} style={{ height: '100%', width: '100%', display: 'grid', placeItems: 'center' }}>
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            width: fit.width,
            height: fit.height,
          }}
        >
        {positions.map((t) => {
          const info = TILE_INFO[t.kind];
          const here = pilots.filter((p) => p.pos === t.n);
          const isCurrent = pilot.pos === t.n && !raceOver;
          return (
            <div
              key={t.n}
              className="tile"
              style={{
                gridColumn: t.col,
                gridRow: t.row,
                background: `linear-gradient(160deg, ${info.colour}2e, ${info.colour}12)`,
                borderColor: isCurrent ? info.colour : undefined,
                boxShadow: isCurrent ? `0 0 22px ${info.colour}88` : undefined,
              }}
              title={`${info.label} — ${info.task}`}
            >
              {t.kind !== 'start' && t.kind !== 'finish' && <span className="tile__n">{t.n}</span>}
              <span style={{ textAlign: 'center', lineHeight: 1.05 }}>
                <span className="tile__icon">{TILE_ICON[t.kind]}</span>
                <span className="tile__label" style={{ color: info.colour, display: 'block' }}>
                  {info.label}
                </span>
              </span>
              {here.length > 0 && (
                <span className="tile__rockets">
                  {here.map((p) => (
                    <span key={p.id} className="pop" title={p.callsign} style={{ marginLeft: -4 }}>
                      <Rocket colour={p.colour} size={20} />
                    </span>
                  ))}
                </span>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <TaskModal
        task={task}
        pilot={pilot}
        hard={state.hard}
        onClose={() => setTask(null)}
        onRecord={record}
        onSucceed={succeed}
        onFail={fail}
        onContinue={(delta) => {
          if (!delta) {
            endTurn();
            return;
          }
          setTask(null);
          void stepTo(pilot.pos + delta, (final) => {
            const tile = BOARD[final];
            if (final >= 20 || ['word', 'meteor', 'mira', 'star'].includes(tile.kind)) arrive(final);
            else endTurn();
          });
        }}
      />

      <Modal open={rules} onClose={() => setRules(false)} title="How to play">
        <div className="col" style={{ gap: 8 }}>
          {(Object.keys(TILE_INFO) as TileKind[])
            .filter((k) => k !== 'start')
            .map((k) => (
              <div key={k} className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                <span style={{ fontSize: 20, flex: 'none' }}>{TILE_ICON[k]}</span>
                <div>
                  <b style={{ color: TILE_INFO[k].colour, fontFamily: 'var(--font-display)' }}>{TILE_INFO[k].label}</b>
                  <div className="hint">{TILE_INFO[k].task}</div>
                </div>
              </div>
            ))}
          <div className="tile-card" style={{ ['--accent' as string]: 'var(--yellow)' }}>
            <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
              The golden rule
            </span>
            <p style={{ margin: '4px 0 0' }}>
              English only. Try, make mistakes, keep flying. A good answer is one star — first rocket to the NEW
              SCHOOL wins the race, most stars wins the MVP badge.
            </p>
          </div>
        </div>
      </Modal>
    </Stage>
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
  onRecord,
  onSucceed,
  onFail,
  onContinue,
}: {
  task: Task | null;
  pilot: Pilot;
  hard: boolean;
  onClose: () => void;
  onRecord: (correct: boolean, detail: AnswerDetail) => void;
  onSucceed: (line: string) => void;
  onFail: (line: string, penalty?: number) => void;
  onContinue: (delta: number) => void;
}) {
  if (!task) return null;

  const title = {
    word: '💬 WORD — describe it',
    meteor: '☄️ METEOR — fix the mistake',
    mira: '🦉 MIRA — story question',
    star: '⭐ STAR — speak!',
    boost: '⚡ BOOST',
    wormhole: '🌀 WORMHOLE',
    finish: '🏫 NEW SCHOOL',
  }[task.kind];

  return (
    <Modal open onClose={onClose} title={`${pilot.callsign} · ${title}`} width={760}>
      {task.kind === 'word' && <WordTile task={task} hard={hard} onSucceed={onSucceed} onFail={onFail} />}

      {task.kind === 'meteor' && (
        <>
          <MeteorTask
            card={task.card}
            showRule={hard}
            onSolved={(clean) => {
              onRecord(clean, { skill: 'grammar', rule: task.card.rule });
              onSucceed(`fixed “${task.card.tokens[task.card.wrong[0]]}” → “${task.card.fix}”`);
            }}
          />
          <div className="btn-row" style={{ marginTop: 'calc(var(--u)*1)' }}>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                onRecord(false, { skill: 'grammar', rule: task.card.rule });
                onFail('could not fix the meteor', 2);
              }}
            >
              Give up — go back 2
            </button>
          </div>
        </>
      )}

      {task.kind === 'mira' && (
        <MiraTile card={task.card} onRecord={onRecord} onSucceed={onSucceed} onFail={onFail} />
      )}
      {task.kind === 'star' && <StarTile card={task.card} hard={hard} onSucceed={onSucceed} onFail={onFail} />}

      {task.kind === 'boost' && (
        <div className="center">
          <div style={{ fontSize: 46 }}>⚡</div>
          <p className="q q--sm">Free move! Fly two tiles forward — and take a shield.</p>
          <button className="btn btn--lg" onClick={() => onContinue(2)}>
            Fly +2 →
          </button>
        </div>
      )}

      {task.kind === 'wormhole' && (
        <div className="center">
          <div style={{ fontSize: 46 }}>🌀</div>
          <p className="q q--sm">
            The wormhole pulls you {task.jump > 0 ? 'forward' : 'back'} {Math.abs(task.jump)} tiles. No card, no star.
          </p>
          <button className="btn btn--lg" onClick={() => onContinue(task.jump)}>
            {task.jump > 0 ? 'Jump forward' : 'Fall back'} →
          </button>
        </div>
      )}

      {task.kind === 'finish' && (
        <div className="center">
          <div style={{ fontSize: 52 }}>🏫</div>
          <h3 className="q q--sm">Welcome to the New School Galaxy, {pilot.callsign}!</h3>
          <p className="hint">+2 stars for landing. The other pilots keep flying.</p>
          <button className="btn btn--lg" onClick={() => onContinue(0)}>
            Continue the race →
          </button>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------- WORD */

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

  const word = task.word;

  if (!revealed) {
    return (
      <div className="center">
        <p className="q q--sm">Only you look at the card. Describe the word — the crew guesses.</p>
        <button
          className="btn btn--lg"
          onClick={tap(() => {
            setRevealed(true);
            setRunning(true);
          })}
        >
          👀 Show my card
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'calc(var(--u)*1.4)', alignItems: 'center' }}>
      <div
        style={{
          background: 'linear-gradient(180deg,#fbfaff,#e9e4f5)',
          borderRadius: 'var(--r-md)',
          padding: 'calc(var(--u)*.9)',
          display: 'grid',
          placeItems: 'center',
          color: '#22103f',
          width: 'clamp(140px, 22vh, 200px)',
        }}
      >
        <WordArt word={word} size="min(150px, 20vh)" float={false} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(17px, 2.6vh, 24px)', color: '#1a0a33' }}>
          {word.word}
        </div>
        <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#b03a2e', marginTop: 4 }}>DON’T SAY</div>
        <div style={{ fontWeight: 800, color: '#7a2018' }}>{word.taboo.join(' · ')}</div>
      </div>

      <div className="col">
        <CountdownRing
          seconds={hard ? 30 : 45}
          running={running}
          runKey={word.id}
          size={96}
          label={hard ? 'one sentence only' : 'describe it'}
        />
        <div className="row" style={{ gap: 5 }}>
          {USEFUL_PHRASES.slice(0, 4).map((p) => (
            <span key={p} className="pill">
              {p}
            </span>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn btn--star" onClick={() => onSucceed(`described “${word.word}”`)}>
            <Star size={15} /> Good — 1 star
          </button>
          <button className="btn btn--ghost" onClick={() => onFail(`could not describe “${word.word}”`)}>
            No star
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- MIRA */

function MiraTile({
  card,
  onRecord,
  onSucceed,
  onFail,
}: {
  card: MiraCard;
  onRecord: (correct: boolean, detail: AnswerDetail) => void;
  onSucceed: (line: string) => void;
  onFail: (line: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(
    () => (card.options ? shuffle([card.a, ...card.options], card.id.length * 0.53) : []),
    [card],
  );

  if (!card.options) {
    return (
      <div className="center">
        <h3 className="q q--sm">{card.q}</h3>
        <p className="hint">Any true sentence about the story counts.</p>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn--star" onClick={() => onSucceed('answered Mira from memory')}>
            <Star size={15} /> Good — 1 star
          </button>
          <button className="btn btn--ghost" onClick={() => onFail('could not answer Mira')}>
            No star
          </button>
        </div>
      </div>
    );
  }

  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === card.a;
    onRecord(ok, { skill: 'comprehension' });
    if (ok) {
      sfx.right();
      window.setTimeout(() => onSucceed(`answered “${card.q}”`), 700);
    } else sfx.wrong();
  };

  return (
    <div className="col">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <img
          src={artUrl('owl')}
          alt="Mira the owl"
          width={76}
          className="word-art"
          style={{ flex: 'none', width: 76, height: 76 }}
        />
        <h3 className="q q--sm" style={{ flex: 1, textAlign: 'left' }}>
          {card.q}
        </h3>
        <button className="icon-btn" onClick={() => speak(card.q)} aria-label="Listen to the question">
          🔈
        </button>
      </div>
      <div className="opts">
        {options.map((o, i) => (
          <button
            key={o}
            className="opt"
            data-state={picked ? (o === card.a ? 'right' : picked === o ? 'wrong' : 'muted') : undefined}
            disabled={picked === card.a}
            onClick={() => choose(o)}
          >
            <span className="opt__key">{String.fromCharCode(65 + i)}</span>
            <span style={{ flex: 1 }}>{o}</span>
          </button>
        ))}
      </div>
      {picked && picked !== card.a && (
        <button className="btn btn--ghost btn--sm" onClick={() => onFail('missed the story question')}>
          Skip — no star
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- STAR */

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
  const seconds = hard ? 20 : 15;

  return (
    <div className="center">
      <span className="card-label" style={{ ['--accent' as string]: 'var(--yellow)' }}>
        {seconds} seconds · no stopping
      </span>
      <h3 className="q q--sm">{card.prompt}</h3>
      <div className="row" style={{ justifyContent: 'center' }}>
        {card.support.map((s) => (
          <span key={s} className="pill">
            {s}
          </span>
        ))}
      </div>
      <CountdownRing seconds={seconds} running={running} runKey={card.id} size={120} onDone={() => sfx.star()} />
      <div className="btn-row" style={{ justifyContent: 'center' }}>
        {!running ? (
          <button className="btn btn--lg" onClick={tap(() => setRunning(true))}>
            Speak — from now!
          </button>
        ) : (
          <>
            <button className="btn btn--star" onClick={() => onSucceed(`spoke ${seconds}s`)}>
              <Star size={15} /> Made it — 1 star
            </button>
            <button className="btn btn--ghost" onClick={() => onFail('stopped before the buzzer')}>
              Stopped early
            </button>
          </>
        )}
      </div>
    </div>
  );
}
