import { STORY_FULL, WORDS } from '../data/content';
import { Modal } from './ui';

/**
 * "The text on the wall."
 *
 * In the printed lesson the story is pinned up in the corner of the room for
 * the whole hour: the pilots check Mira's questions against it during the
 * game, and the teacher reads from it. This is that sheet, reachable from the
 * top bar at any moment.
 *
 * It is for reading, not for listening. A browser voice reading five
 * paragraphs sounds worse than any teacher, so there is no playback here —
 * single sentences have their own 🔈 on the story screen.
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
  // split() with one capture group puts the matches at the odd indexes.
  return (
    <>
      {text.split(HIGHLIGHT).map((part, i) =>
        i % 2 === 1 ? (
          <b key={i} style={{ color: 'var(--yellow)', fontWeight: 800, textShadow: '0 0 14px rgba(255,201,60,.35)' }}>
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
  return (
    <Modal open={open} onClose={onClose} title="📖 The text on the wall" width={760}>
      <div
        className="tile-card"
        style={{ ['--accent' as string]: 'var(--cyan)', background: 'rgba(255,255,255,.07)' }}
      >
        <span className="card-label" style={{ ['--accent' as string]: 'var(--cyan)' }}>
          Incoming transmission
        </span>
        <h3 style={{ fontSize: 'clamp(18px, 2.9vh, 26px)', margin: '6px 0 12px' }}>
          The Adventures of Richie the Chameleon
        </h3>
        {STORY_FULL.map((p, i) => (
          <p
            key={i}
            style={{
              margin: '0 0 12px',
              lineHeight: 1.75,
              fontSize: 'clamp(15px, 2.2vh, 19px)',
              maxWidth: '62ch',
            }}
          >
            <Marked text={p} />
          </p>
        ))}
      </div>

      <div className="row" style={{ gap: 6, marginTop: 'calc(var(--u)*1)' }}>
        <span className="hint" style={{ marginRight: 4 }}>
          The ten mission words are marked:
        </span>
        {WORDS.map((w) => (
          <span key={w.id} className="pill" style={{ fontSize: 12 }}>
            {w.word}
          </span>
        ))}
      </div>
    </Modal>
  );
}
