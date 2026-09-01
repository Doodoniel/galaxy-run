import { useState } from 'react';
import { STORY_IMAGES, STORY_SENTENCES, wordById } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Dots, PilotChip, Star, StarBurst, WordArt, tap } from '../components/ui';
import { sfx, speak, stopSpeaking } from '../lib/audio';

/**
 * The story, in the shape the printed lesson uses: listen with no text at
 * all, one sentence at a time, then retell it from pictures.
 *
 * On paper the pilots draw those pictures themselves. On a shared screen that
 * does not work — nobody but the host can draw — so the six flashcard
 * illustrations become the storyboard instead. The listening stays blind,
 * which is the part that actually carries the learning.
 */
export function StoryTime() {
  const [step, setStep] = useState<'listen' | 'retell'>('listen');
  return step === 'listen' ? <Listen onDone={() => setStep('retell')} /> : <Retell onBack={() => setStep('listen')} />;
}

function Listen({ onDone }: { onDone: () => void }) {
  const { state, update } = useGame();
  const [i, setI] = useState(0);
  const [played, setPlayed] = useState(false);
  const [shown, setShown] = useState(false);

  const last = i === STORY_SENTENCES.length - 1;
  const marks = STORY_SENTENCES.map((_, n) => (n < state.story.heard ? true : null));

  const play = () => {
    setPlayed(true);
    speak(STORY_SENTENCES[i], { rate: 0.86 });
  };

  const go = (delta: number) => {
    stopSpeaking();
    const n = i + delta;
    if (n < 0 || n >= STORY_SENTENCES.length) return;
    setI(n);
    setPlayed(false);
    setShown(false);
    sfx.tap();
    update((d) => void (d.story.heard = Math.max(d.story.heard, n)));
  };

  return (
    <Stage
      title="Listen"
      step={`${i + 1} / ${STORY_SENTENCES.length}`}
      aside={<Dots marks={marks} at={i} />}
      footer={
        <div className="btn-row">
          {i > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={() => go(-1)}>
              ← Back
            </button>
          )}
          {!last ? (
            <button className="btn" onClick={() => go(1)} disabled={!played}>
              Next sentence →
            </button>
          ) : (
            <button
              className="btn"
              disabled={!played}
              onClick={() => {
                stopSpeaking();
                sfx.star();
                update((d) => void (d.story.heard = STORY_SENTENCES.length));
                onDone();
              }}
            >
              Now retell it →
            </button>
          )}
        </div>
      }
    >
      <div className="center" style={{ maxHeight: '100%' }}>
        <div key={i} className="pop" style={{ display: 'grid', placeItems: 'center' }}>
          <WordArt word={wordById(STORY_IMAGES[i])} size="min(260px, 32vh)" />
        </div>

        <button className="btn btn--lg" onClick={play}>
          {played ? '🔁 Play again' : `▶ Play sentence ${i + 1}`}
        </button>

        {shown ? (
          <p className="q q--sm pop" style={{ maxWidth: 'min(900px, 92vw)' }}>
            {STORY_SENTENCES[i]}
          </p>
        ) : (
          <button className="btn btn--ghost btn--sm" onClick={tap(() => setShown(true))} disabled={!played}>
            👀 Show the words
          </button>
        )}
      </div>
    </Stage>
  );
}

function Retell({ onBack }: { onBack: () => void }) {
  const { state, update, finish } = useGame();
  const [burst, setBurst] = useState(0);
  const [starred, setStarred] = useState<string[]>([]);

  const give = (index: number) => {
    const p = state.pilots[index];
    if (starred.includes(p.id)) return;
    setStarred((s) => [...s, p.id]);
    setBurst((b) => b + 1);
    sfx.star();
    update((d) => void (d.pilots[index].stars++));
    finish('story', { right: starred.length + 1, total: state.pilots.length });
  };

  return (
    <Stage
      title="Retell the story"
      hint="“Six pictures, no words. Tell me the story back. Anybody can start.”"
      aside={
        <button className="btn btn--ghost btn--sm" onClick={tap(onBack)}>
          ← Listen again
        </button>
      }
      footer={<NextButton label="To the practice" />}
    >
      <StarBurst fire={burst} />
      <div className="center" style={{ maxHeight: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 'calc(var(--u)*.9)',
            width: 'min(1100px, 100%)',
          }}
        >
          {STORY_IMAGES.map((img, n) => (
            <div
              key={img}
              className="tile-card"
              style={{ display: 'grid', placeItems: 'center', padding: 'calc(var(--u)*.7)', aspectRatio: '3/4' }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 8,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--ink-faint)',
                  fontSize: 'clamp(10px, 1.5vh, 14px)',
                }}
              >
                {n + 1}
              </span>
              <WordArt word={wordById(img)} size="min(130px, 14vh)" float={false} />
            </div>
          ))}
        </div>

        <p className="q q--sm" style={{ color: 'var(--ink-soft)' }}>
          One picture, one sentence. Who can do all six?
        </p>

        <div className="row" style={{ justifyContent: 'center' }}>
          {state.pilots.map((p, i) => (
            <button
              key={p.id}
              className={`btn btn--sm ${starred.includes(p.id) ? 'btn--good' : 'btn--star'}`}
              onClick={() => give(i)}
              disabled={starred.includes(p.id)}
            >
              <Star size={13} /> {p.callsign} {starred.includes(p.id) ? '✓' : '+1'}
            </button>
          ))}
          <PilotChip callsign="teacher decides" colour="#8879a8" />
        </div>
      </div>
    </Stage>
  );
}
