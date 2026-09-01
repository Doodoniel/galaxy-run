import { useState } from 'react';
import { STORY_FULL, WORDS } from '../data/content';
import { useGame } from '../state/game';
import { Modal } from './ui';
import { speak, stopSpeaking } from '../lib/audio';

/**
 * "The text on the wall."
 *
 * In the printed lesson the story is pinned up in the corner of the room and
 * stays there for the rest of the hour: the pilots run to it during Reading
 * Race, and they check Mira's questions against it during the game. This is
 * that sheet — reachable from the top bar at any moment.
 *
 * It stays shut during Picture This, because that stage only works if the text
 * is unseen. The teacher can always override.
 */

/** Every surface form of the ten target words, longest first. */
const FORMS = [
  'chameleon',
  'galaxy',
  'dream',
  'wise',
  'owl',
  'planet',
  'spaceship',
  'adventures',
  'adventure',
  'travel',
  'friends',
].sort((a, b) => b.length - a.length);

const HIGHLIGHT = new RegExp(`\\b(${FORMS.join('|')})\\b`, 'gi');

function Marked({ text }: { text: string }) {
  const parts = text.split(HIGHLIGHT);
  return (
    <>
      {parts.map((part, i) =>
        // split() with one capture group puts the matches at the odd indexes.
        i % 2 === 1 ? (
          <b
            key={i}
            style={{
              color: 'var(--yellow)',
              fontWeight: 800,
              textShadow: '0 0 14px rgba(255,201,60,.35)',
            }}
          >
            {part}
          </b>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function StoryBook({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useGame();
  const [override, setOverride] = useState(false);
  const [reading, setReading] = useState(false);

  // Picture This is the one stage the text would ruin.
  const spoils = state.stage === 'picture' && !state.picture.revealed;
  const locked = spoils && !override;

  const close = () => {
    stopSpeaking();
    setReading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="📖 The text on the wall" width={720}>
      {locked ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <h3 style={{ fontSize: 24, margin: '8px 0' }}>Not yet, pilot.</h3>
          <p className="hint" style={{ maxWidth: 440, margin: '0 auto 18px' }}>
            Picture This only works if you have not seen the text. Listen, draw your six pictures, write the story
            from them — the original opens on the Check step.
          </p>
          <button className="btn btn--ghost btn--sm" onClick={() => setOverride(true)}>
            Teacher: open it anyway
          </button>
        </div>
      ) : (
        <div>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="hint">The ten mission words are marked in yellow.</span>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                if (reading) {
                  stopSpeaking();
                  setReading(false);
                  return;
                }
                setReading(true);
                speak(STORY_FULL.join(' '), { rate: 0.9, onEnd: () => setReading(false) });
              }}
            >
              {reading ? '⏹ Stop' : '🔈 Read it to me'}
            </button>
          </div>

          <div
            className="tile-card"
            style={{ ['--accent' as string]: 'var(--cyan)', background: 'rgba(255,255,255,.07)' }}
          >
            <span className="card-label" style={{ ['--accent' as string]: 'var(--cyan)' }}>
              Incoming transmission
            </span>
            <h3 style={{ fontSize: 'clamp(19px, 3vw, 24px)', margin: '8px 0 14px' }}>
              The Adventures of Richie the Chameleon
            </h3>
            {STORY_FULL.map((p, i) => (
              <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.7, fontSize: 'clamp(15px, 2.2vw, 18px)' }}>
                <Marked text={p} />
              </p>
            ))}
          </div>

          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            {WORDS.map((w) => (
              <span key={w.id} className="pill" style={{ fontSize: 12 }}>
                {w.word}
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
