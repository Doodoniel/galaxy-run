import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { activityOf } from '../data/lesson';
import { useGame } from '../state/game';

/**
 * Every activity is one screen. The frame is fixed: title row, a body that
 * fills whatever is left, and a footer. Nothing scrolls — if a task has ten
 * items, it shows them one at a time rather than growing a page, because a
 * projector has no scrollbar and a shared screen makes scrolling unreadable.
 */
export function Stage({
  title,
  step,
  aside,
  children,
  footer,
  hint,
}: {
  title: string;
  /** Small progress marker: "3 / 10". */
  step?: string;
  /** Controls that belong to the title row. */
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Overrides the teacher's line in the footer. */
  hint?: ReactNode;
}) {
  const { state } = useGame();
  const say = activityOf(state.activity).says;

  return (
    <section className="stage">
      <header className="stage__top">
        <h1>{title}</h1>
        {step && <span className="stage__step">{step}</span>}
        <span className="stage__gap" />
        {aside}
      </header>

      <div className="stage__body">{children}</div>

      <footer className="stage__foot">
        <span className="stage__say">{hint ?? (state.mode === 'class' ? say : null)}</span>
        <span className="stage__gap" />
        {footer}
      </footer>
    </section>
  );
}

/** The "on to the next activity" button every stage ends with. */
export function NextButton({ label, disabled }: { label?: string; disabled?: boolean }) {
  const { next } = useGame();
  return (
    <button className="btn" onClick={next} disabled={disabled}>
      {label ?? 'Next'} →
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Fullscreen
 * ------------------------------------------------------------------ */

export function useFullscreen() {
  const [on, setOn] = useState(() => !!document.fullscreenElement);

  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

  return { on, toggle };
}
