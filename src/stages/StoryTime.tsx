import { useState } from 'react';
import { STORY_IMAGES, STORY_SENTENCES, wordById } from '../data/content';
import { useGame } from '../state/game';
import { NextButton, Stage } from '../components/Shell';
import { Dots, PilotChip, Star, StarBurst, WordArt, tap } from '../components/ui';
import { sfx, speak, stopSpeaking } from '../lib/audio';

/**
 * The story, as a shared reading.
 *
 * The printed lesson has the teacher read it aloud one sentence at a time
 * while the pilots draw. Neither half survives a shared screen — nobody but
 * the host can draw, and a browser voice reading five paragraphs sounds worse
 * than any teacher. So this is a big picture book instead: one spread per
 * sentence, picture on the left, sentence on the right, the teacher reading
 * and the crew repeating. Then the text goes away and they retell it from the
 * six pictures alone, which is where the learning actually happens.
 *
 * The small 🔈 on each spread speaks that one sentence — short enough for the
 * browser voice to handle, and there for a pilot working alone at home.
 */
export function StoryTime() {
  const [step, setStep] = useState<'read' | 'retell'>('read');
  return step === 'read' ? <Read onDone={() => setStep('retell')} /> : <Retell onBack={() => setStep('read')} />;
}

function Read({ onDone }: { onDone: () => void }) {
  const { state, update } = useGame();
  const [i, setI] = useState(0);

  const last = i === STORY_SENTENCES.length - 1;
  const marks = STORY_SENTENCES.map((_, n) => (n < state.story.heard ? true : null));

  const go = (delta: number) => {
    stopSpeaking();
    const n = i + delta;
    if (n < 0 || n >= STORY_SENTENCES.length) return;
    setI(n);
    sfx.tap();
    update((d) => void (d.story.heard = Math.max(d.story.heard, n)));
  };

  return (
    <Stage
      title="The story"
      step={`${i + 1} / ${STORY_SENTENCES.length}`}
      aside={<Dots marks={marks} at={i} />}
      hint="“Look at the picture. Listen to me, then read it back to me — all together.”"
      footer={
        <div className="btn-row">
          {i > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={() => go(-1)}>
              ← Back
            </button>
          )}
          {!last ? (
            <button className="btn" onClick={() => go(1)}>
              Next sentence →
            </button>
          ) : (
            <button
              className="btn"
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
      {/* Picture and words side by side: nothing can ever sit on top of the
          buttons, however short the screen is. */}
      <div
        key={i}
        className="pop"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(300px, 620px)',
          gap: 'calc(var(--u) * 2.4)',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(1150px, 100%)',
          height: '100%',
        }}
      >
        <WordArt word={wordById(STORY_IMAGES[i])} size="min(320px, 42vh)" />

        <div className="col" style={{ minWidth: 0, gap: 'calc(var(--u)*1.1)' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 6vh, 60px)',
              lineHeight: 1,
              color: 'var(--phase)',
              opacity: 0.55,
            }}
          >
            {i + 1}
          </span>

          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(20px, 3.6vh, 40px)',
              lineHeight: 1.28,
            }}
          >
            {STORY_SENTENCES[i]}
          </p>

          <div>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => speak(STORY_SENTENCES[i], { rate: 0.86 })}
              title="Hear this one sentence"
            >
              🔈 Hear it
            </button>
          </div>
        </div>
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
          ← Read it again
        </button>
      }
      footer={<NextButton label="To the practice" />}
    >
      <StarBurst fire={burst} />
      <div className="center" style={{ width: '100%' }}>
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
              style={{
                display: 'grid',
                placeItems: 'center',
                padding: 'calc(var(--u)*.7)',
                aspectRatio: '3/4',
                maxHeight: '46vh',
              }}
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
              <WordArt word={wordById(img)} size="min(130px, 16vh)" float={false} />
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
