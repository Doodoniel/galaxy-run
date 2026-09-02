import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Word } from '../data/content';
import { sfx, speak } from '../lib/audio';
import { artUrl } from '../lib/art';
import { sameWord } from '../lib/text';

/* ------------------------------------------------------------------ stars */

export function Star({ size = 18, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg
      className={filled ? 'star' : 'star star--off'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.6l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.9 6.2 20.2l1.5-6.5-5-4.4 6.6-.6z" />
    </svg>
  );
}

/* --------------------------------------------------------------- artwork */

export function WordArt({
  word,
  size = 200,
  float = true,
}: {
  word: Word;
  /** A number is pixels; a string is any CSS length, e.g. "min(260px, 32vh)". */
  size?: number | string;
  float?: boolean;
}) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <div
      className={float ? 'float' : undefined}
      style={{
        width: dim,
        height: dim,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        // Never bigger than the slot it was given…
        maxWidth: '100%',
        maxHeight: '100%',
        // …and always the first thing to give way, so an illustration can
        // never end up sitting on top of a button.
        minWidth: 0,
        minHeight: 0,
        flex: '0 1 auto',
      }}
    >
      <img
        className="word-art art-fit"
        src={artUrl(word.image)}
        alt={word.word}
        decoding="async"
      />
    </div>
  );
}

export function Syllables({ word }: { word: Word }) {
  if (word.syllables.length < 2) return null;
  return (
    <span className="syllables">
      {word.syllables.map((s, i) => (
        <span key={i} data-stress={i === word.stress}>
          {s}
          {i < word.syllables.length - 1 && <b style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>·</b>}
        </span>
      ))}
    </span>
  );
}

export function SayIt({ text, label = 'Say it' }: { text: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn btn--ghost btn--sm"
      onClick={() => {
        setBusy(true);
        speak(text, { onEnd: () => setBusy(false) });
      }}
      aria-label={`Listen: ${text}`}
    >
      {busy ? '🔊' : '🔈'} {label}
    </button>
  );
}

/* --------------------------------------------------------------- options */

export function Opt({
  children,
  onClick,
  state,
  hotkey,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  state?: 'right' | 'wrong' | 'muted';
  hotkey?: string;
  disabled?: boolean;
}) {
  return (
    <button className="opt" data-state={state} onClick={onClick} disabled={disabled}>
      {hotkey && <span className="opt__key">{hotkey}</span>}
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

/**
 * Type the answer instead of picking it off a list — what a one-to-one lesson
 * gets, because there is one keyboard and one pilot to use it. Recall is
 * harder than recognition, which is the point.
 *
 * Spelling has to be right; case, articles and punctuation do not.
 */
export function TypeAnswer({
  answer,
  choices,
  placeholder = 'type it',
  onSubmit,
}: {
  answer: string;
  /** What the hint offers when the pilot is stuck — already shuffled. */
  choices?: string[];
  placeholder?: string;
  onSubmit: (correct: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [hint, setHint] = useState(false);

  const settle = (given: string) => {
    if (verdict !== 'idle' || !given.trim()) return;
    const ok = sameWord(given, answer);
    setVerdict(ok ? 'right' : 'wrong');
    ok ? sfx.right() : sfx.wrong();
    onSubmit(ok);
  };

  const submit = () => settle(value);

  return (
    <div className="center" style={{ gap: 'calc(var(--u)*.7)', width: '100%' }}>
      <div className="row" style={{ justifyContent: 'center', flexWrap: 'nowrap' }}>
        <input
          className="field"
          style={{ maxWidth: 340, textAlign: 'center', fontSize: 'clamp(16px, 2.6vh, 24px)' }}
          value={value}
          placeholder={placeholder}
          autoFocus
          disabled={verdict !== 'idle'}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          aria-label="Type your answer"
        />
        <button className="btn" onClick={submit} disabled={verdict !== 'idle' || !value.trim()}>
          Check
        </button>
      </div>

      {verdict === 'idle' ? (
        hint && choices?.length ? (
          <div className="opts opts--2 pop" style={{ width: 'min(620px, 100%)' }}>
            {choices.map((c) => (
              <button key={c} className="opt" style={{ justifyContent: 'center' }} onClick={() => settle(c)}>
                {c}
              </button>
            ))}
          </div>
        ) : (
          <button className="btn btn--ghost btn--sm" onClick={() => setHint(true)} disabled={!choices?.length}>
            💡 Hint
          </button>
        )
      ) : (
        <Verdict ok={verdict === 'right'} text={verdict === 'right' ? `Yes — ${answer}` : `It is “${answer}”`} />
      )}
    </div>
  );
}

/** Progress dots for a one-question-at-a-time task. */
export function Dots({ marks, at }: { marks: (boolean | null)[]; at: number }) {
  return (
    <div className="dots" aria-hidden="true">
      {marks.map((m, i) => (
        <i key={i} data-state={i === at ? 'now' : m === true ? 'right' : m === false ? 'wrong' : undefined} />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- timer */

/**
 * Countdown ring. Calls `onDone` once when it reaches zero.
 * `runKey` restarts the clock whenever it changes.
 */
export function CountdownRing({
  seconds,
  running,
  runKey,
  onDone,
  size = 120,
  label,
}: {
  seconds: number;
  running: boolean;
  runKey: string | number;
  onDone?: () => void;
  size?: number;
  label?: string;
}) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(false);

  useEffect(() => {
    setLeft(seconds);
    done.current = false;
  }, [runKey, seconds]);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const from = left;
    const id = window.setInterval(() => {
      const next = Math.max(0, from - (Date.now() - started) / 1000);
      setLeft(next);
      if (next <= 0 && !done.current) {
        done.current = true;
        window.clearInterval(id);
        onDone?.();
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, runKey]);

  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const pct = seconds ? left / seconds : 0;
  const danger = left <= 5;

  return (
    <div style={{ width: size, textAlign: 'center' }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.12)" strokeWidth="7" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={danger ? 'var(--red)' : 'var(--yellow)'}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .12s linear' }}
        />
        <text
          x="50%"
          y="53%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-display)"
          fontSize={size * 0.34}
          fill={danger ? 'var(--red)' : 'var(--ink)'}
        >
          {Math.ceil(left)}
        </text>
      </svg>
      {label && (
        <div className="hint" style={{ marginTop: 2 }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- feedback */

export function Verdict({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className="pop"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 'calc(var(--u) * .7) calc(var(--u) * 1.2)',
        borderRadius: 'var(--r-md)',
        background: ok ? 'rgba(63,191,90,.16)' : 'rgba(244,68,46,.16)',
        border: `1px solid ${ok ? 'var(--green)' : 'var(--red)'}`,
        color: ok ? '#b8f5c5' : '#ffc4bb',
        fontWeight: 700,
        fontSize: 'clamp(13px, 1.9vh, 18px)',
      }}
    >
      <span>{ok ? '✅' : '☄️'}</span>
      <span>{text}</span>
    </div>
  );
}

/* --------------------------------------------------------------- rockets */

export function Rocket({ colour, size = 34, tilt = 0 }: { colour: string; size?: number; tilt?: number }) {
  const id = colour.replace('#', '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      <defs>
        <linearGradient id={`fl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#ff6a2b" />
        </linearGradient>
      </defs>
      <path d="M32 60c-4-4-6-8-6-12h12c0 4-2 8-6 12z" fill={`url(#fl-${id})`} />
      <path d="M32 3c8 7 12 17 12 28v10H20V31C20 20 24 10 32 3z" fill={colour} stroke="#0d0620" strokeWidth="3" />
      <path d="M20 33 10 46v6l10-6z" fill={colour} stroke="#0d0620" strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 33l10 13v6l-10-6z" fill={colour} stroke="#0d0620" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="32" cy="26" r="7" fill="#bfe9ff" stroke="#0d0620" strokeWidth="3" />
    </svg>
  );
}

export function PilotChip({
  callsign,
  colour,
  stars,
  active,
  onClick,
}: {
  callsign: string;
  colour: string;
  stars?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <span
      className="pill"
      style={{
        borderColor: active ? colour : 'var(--card-line)',
        background: active ? `${colour}26` : 'rgba(255,255,255,.06)',
        color: active ? '#fff' : 'var(--ink-soft)',
        boxShadow: active ? `0 0 16px ${colour}55` : 'none',
      }}
    >
      <Rocket colour={colour} size={16} />
      <b style={{ fontFamily: 'var(--font-display)' }}>{callsign || '—'}</b>
      {stars !== undefined && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Star size={12} /> {stars}
        </span>
      )}
    </span>
  );

  if (!onClick) return body;
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', padding: 0 }}>
      {body}
    </button>
  );
}

/* ------------------------------------------------------------ starburst */

/** A quick shower of stars, fired when a pilot earns one. */
export function StarBurst({ fire }: { fire: number }) {
  const [items, setItems] = useState<{ id: number; x: number; d: number }[]>([]);

  useEffect(() => {
    if (!fire) return;
    setItems(
      Array.from({ length: 14 }, (_, i) => ({ id: fire * 100 + i, x: 12 + Math.random() * 76, d: Math.random() * 0.35 })),
    );
    const id = window.setTimeout(() => setItems([]), 1500);
    return () => window.clearTimeout(id);
  }, [fire]);

  if (!items.length) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90 }} aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.id}
          style={{ position: 'absolute', left: `${it.x}%`, top: '55%', animation: `burst 1.2s ${it.d}s ease-out both` }}
        >
          <Star size={20 + Math.random() * 16} />
        </span>
      ))}
      <style>{`@keyframes burst{0%{opacity:0;transform:translateY(0) scale(.3) rotate(0)}
        18%{opacity:1}100%{opacity:0;transform:translateY(-44vh) scale(1.15) rotate(220deg)}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 640,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal pop" onClick={(e) => e.stopPropagation()} style={{ width: `min(${width}px, 100%)` }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'calc(var(--u)*1)' }}>
          <h2 style={{ fontSize: 'clamp(17px, 2.6vh, 24px)' }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- utilities */

export function shuffle<T>(list: T[], seed = Math.random()) {
  const arr = [...list];
  let s = Math.floor(seed * 100000) + 1;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Fires `sfx.tap` and runs the handler — used by the many small buttons. */
export function tap(fn: () => void) {
  return () => {
    sfx.tap();
    fn();
  };
}
