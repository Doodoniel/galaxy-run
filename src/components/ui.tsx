import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Word } from '../data/content';
import { sfx, speak } from '../lib/audio';

/* ------------------------------------------------------------------ stars */

export function Stars({ n, max = 0, size = 18 }: { n: number; max?: number; size?: number }) {
  const total = Math.max(max, n);
  return (
    <span className="starline" aria-label={`${n} stars`}>
      {Array.from({ length: total }, (_, i) => (
        <Star key={i} size={size} filled={i < n} />
      ))}
      {total === 0 && <Star size={size} filled={false} />}
    </span>
  );
}

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

/* ---------------------------------------------------------------- header */

export function StageHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <header className="stage-head">
      <div style={{ flex: 1, minWidth: 240 }}>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </header>
  );
}

/* --------------------------------------------------------------- artwork */

export function WordArt({ word, size = 200, float = true }: { word: Word; size?: number; float?: boolean }) {
  return (
    <div
      className={float ? 'float' : undefined}
      style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}
    >
      <img
        className="word-art"
        src={`${import.meta.env.BASE_URL}art/${word.image}.webp`}
        alt={word.word}
        width={size}
        height={size}
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

/* ---------------------------------------------------------------- choice */

export function Choice({
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
    <button className="choice" data-state={state} onClick={onClick} disabled={disabled}>
      {hotkey && <span className="choice__key">{hotkey}</span>}
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

/* --------------------------------------------------------------- progress */

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <i style={{ width: `${pct}%` }} />
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
  size = 128,
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
      } else if (next <= 3.02 && Math.ceil(next) !== Math.ceil(next + 0.1)) {
        sfx.tick();
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
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-display)"
          fontSize={size * 0.32}
          fill={danger ? 'var(--red)' : 'var(--ink)'}
        >
          {Math.ceil(left)}
        </text>
      </svg>
      {label && <div className="hint" style={{ marginTop: 4 }}>{label}</div>}
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
        padding: '12px 16px',
        borderRadius: 'var(--r-md)',
        background: ok ? 'rgba(63,191,90,.16)' : 'rgba(244,68,46,.16)',
        border: `1px solid ${ok ? 'var(--green)' : 'var(--red)'}`,
        color: ok ? '#b8f5c5' : '#ffc4bb',
        fontWeight: 700,
      }}
    >
      <span style={{ fontSize: 20 }}>{ok ? '✅' : '☄️'}</span>
      <span>{text}</span>
    </div>
  );
}

/* --------------------------------------------------------------- rockets */

export function Rocket({ colour, size = 34, tilt = -45 }: { colour: string; size?: number; tilt?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden="true">
      <defs>
        <linearGradient id={`fl-${colour.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd76a" />
          <stop offset="1" stopColor="#ff6a2b" />
        </linearGradient>
      </defs>
      <path d="M32 60c-4-4-6-8-6-12h12c0 4-2 8-6 12z" fill={`url(#fl-${colour.slice(1)})`} />
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
  compact,
}: {
  callsign: string;
  colour: string;
  stars?: number;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className="pill"
      style={{
        borderColor: active ? colour : 'var(--card-line)',
        background: active ? `${colour}22` : 'rgba(255,255,255,.06)',
        color: active ? '#fff' : 'var(--ink-soft)',
        boxShadow: active ? `0 0 18px ${colour}55` : 'none',
        padding: compact ? '3px 10px' : '5px 13px',
      }}
    >
      <Rocket colour={colour} size={compact ? 15 : 18} tilt={0} />
      <b style={{ fontFamily: 'var(--font-display)' }}>{callsign || '—'}</b>
      {stars !== undefined && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Star size={13} /> {stars}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ starburst */

/** A quick shower of stars, fired when a pilot earns one. */
export function StarBurst({ fire }: { fire: number }) {
  const [items, setItems] = useState<{ id: number; x: number; d: number }[]>([]);
  useEffect(() => {
    if (!fire) return;
    const batch = Array.from({ length: 14 }, (_, i) => ({
      id: fire * 100 + i,
      x: 12 + Math.random() * 76,
      d: Math.random() * 0.35,
    }));
    setItems(batch);
    const id = window.setTimeout(() => setItems([]), 1500);
    return () => window.clearTimeout(id);
  }, [fire]);

  if (!items.length) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90 }} aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.id}
          style={{
            position: 'absolute',
            left: `${it.x}%`,
            top: '52%',
            animation: `burst 1.2s ${it.d}s cubic-bezier(.2,.7,.3,1) both`,
          }}
        >
          <Star size={22 + Math.random() * 16} />
        </span>
      ))}
      <style>{`@keyframes burst{0%{opacity:0;transform:translateY(0) scale(.3) rotate(0)}
        18%{opacity:1}100%{opacity:0;transform:translateY(-46vh) scale(1.15) rotate(220deg)}}`}</style>
    </div>
  );
}

/* ------------------------------------------------------------- utilities */

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(6,2,14,.72)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        className="panel pop"
        onClick={(e) => e.stopPropagation()}
        style={{ width: `min(${width}px, 100%)`, background: 'rgba(24,10,44,.96)', maxHeight: '86dvh', overflowY: 'auto' }}
      >
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 24 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
