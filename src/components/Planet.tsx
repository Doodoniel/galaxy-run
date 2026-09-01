import { useId, useMemo } from 'react';
import type { PlanetLook } from '../data/lesson';

/**
 * A drawn planet.
 *
 * Five families — rocky, banded, ringed, icy, lava — each built from the same
 * parts: a lit surface, a terminator that puts the light in one corner, an
 * atmosphere halo, an optional tilted ring drawn in two halves so the planet
 * sits *inside* it, and moons. The surface detail is seeded from the hue, so
 * the same planet always comes back the same.
 */

function rng(seed: number) {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const R = 62;
const CX = 100;
const CY = 100;

interface Feature {
  x: number;
  y: number;
  rx: number;
  ry: number;
  o: number;
}

function craters(seed: number, n: number): Feature[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => {
    // Keep features inside the disc by sampling in polar coordinates.
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * (R - 14);
    const r = 4 + rand() * 11;
    return { x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, rx: r, ry: r * (0.6 + rand() * 0.3), o: 0.18 + rand() * 0.3 };
  });
}

export function Planet({
  look,
  size = 160,
  spin = false,
  glow = true,
}: {
  look: PlanetLook;
  size?: number;
  spin?: boolean;
  glow?: boolean;
}) {
  const uid = useId().replace(/[:]/g, '');
  const { type, hue } = look;
  const ring = look.ring ?? type === 'ringed';
  const moons = look.moons ?? 0;

  const light = `hsl(${hue} 92% 74%)`;
  const mid = `hsl(${hue} 78% 52%)`;
  const dark = `hsl(${(hue + 22) % 360} 68% 26%)`;
  const ink = `hsl(${(hue + 200) % 360} 60% 22%)`;
  const ringColour = `hsl(${(hue + 40) % 360} 85% 70%)`;

  const detail = useMemo(() => craters(hue * 97 + type.length * 31, 9), [hue, type]);

  const surface = () => {
    switch (type) {
      case 'rocky':
        return (
          <g opacity="0.5">
            {detail.slice(0, 7).map((c, i) => (
              <g key={i}>
                <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={ink} opacity={c.o} />
                <ellipse cx={c.x} cy={c.y - c.ry * 0.35} rx={c.rx * 0.8} ry={c.ry * 0.5} fill={light} opacity={c.o * 0.5} />
              </g>
            ))}
          </g>
        );

      case 'banded':
        return (
          <g>
            {[-42, -26, -10, 8, 26, 44].map((y, i) => (
              <ellipse
                key={i}
                cx={CX}
                cy={CY + y}
                rx={R}
                ry={5 + (i % 3) * 2.6}
                fill={i % 2 ? ink : light}
                opacity={i % 2 ? 0.3 : 0.24}
              />
            ))}
            <ellipse cx={CX + 22} cy={CY + 12} rx={16} ry={9} fill={`hsl(${(hue + 330) % 360} 85% 62%)`} opacity="0.75" />
            <ellipse cx={CX + 22} cy={CY + 12} rx={8} ry={4.5} fill={light} opacity="0.5" />
          </g>
        );

      case 'icy':
        return (
          <g>
            <ellipse cx={CX} cy={CY - 52} rx={40} ry={16} fill="#fff" opacity="0.72" />
            <ellipse cx={CX} cy={CY + 54} rx={34} ry={13} fill="#fff" opacity="0.6" />
            {detail.slice(0, 5).map((c, i) => (
              <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx * 1.5} ry={c.ry * 0.5} fill="#fff" opacity={c.o * 0.5} />
            ))}
          </g>
        );

      case 'lava':
        return (
          <g>
            {detail.slice(0, 6).map((c, i) => (
              <path
                key={i}
                d={`M${c.x - c.rx} ${c.y} q${c.rx} ${-c.ry * 1.6} ${c.rx * 2} 0 q${-c.rx} ${c.ry * 1.1} ${-c.rx * 2} 0`}
                fill={`hsl(${(hue + 12) % 360} 100% 62%)`}
                opacity={0.5 + c.o}
              />
            ))}
            <circle cx={CX - 18} cy={CY + 22} r={9} fill={`hsl(${(hue + 18) % 360} 100% 70%)`} opacity="0.9" />
          </g>
        );

      case 'ringed':
      default:
        return (
          <g opacity="0.42">
            {[-34, -12, 14, 38].map((y, i) => (
              <ellipse key={i} cx={CX} cy={CY + y} rx={R} ry={7 - i} fill={i % 2 ? ink : light} />
            ))}
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={spin ? 'planet-spin' : undefined}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`s-${uid}`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor={light} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <radialGradient id={`t-${uid}`} cx="30%" cy="26%" r="76%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#050110" stopOpacity="0.66" />
        </radialGradient>
        <radialGradient id={`h-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor={mid} stopOpacity="0" />
          <stop offset="82%" stopColor={mid} stopOpacity="0.28" />
          <stop offset="100%" stopColor={mid} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`r-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={ringColour} stopOpacity="0.25" />
          <stop offset="35%" stopColor={ringColour} stopOpacity="0.95" />
          <stop offset="65%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="100%" stopColor={ringColour} stopOpacity="0.25" />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        {/* Only the lower half of the ring passes in front of the planet. */}
        <clipPath id={`f-${uid}`}>
          <rect x="0" y={CY} width="200" height="100" />
        </clipPath>
      </defs>

      {glow && <circle cx={CX} cy={CY} r={R + 26} fill={`url(#h-${uid})`} />}

      {ring && (
        <g transform={`rotate(-17 ${CX} ${CY})`} opacity="0.85">
          <ellipse cx={CX} cy={CY} rx={R + 34} ry={R * 0.31} fill="none" stroke={`url(#r-${uid})`} strokeWidth="9" />
        </g>
      )}

      <circle cx={CX} cy={CY} r={R} fill={`url(#s-${uid})`} />
      <g clipPath={`url(#c-${uid})`}>{surface()}</g>
      <circle cx={CX} cy={CY} r={R} fill={`url(#t-${uid})`} />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" />

      {ring && (
        <g clipPath={`url(#f-${uid})`}>
          <g transform={`rotate(-17 ${CX} ${CY})`} opacity="0.95">
            <ellipse cx={CX} cy={CY} rx={R + 34} ry={R * 0.31} fill="none" stroke={`url(#r-${uid})`} strokeWidth="9" />
          </g>
        </g>
      )}

      {Array.from({ length: moons }, (_, i) => {
        const a = -0.7 + i * 1.5;
        const d = R + 46 + i * 9;
        return (
          <circle
            key={i}
            cx={CX + Math.cos(a) * d}
            cy={CY + Math.sin(a) * d * 0.55}
            r={6 - i}
            fill={`hsl(${(hue + 180) % 360} 22% 88%)`}
            stroke="#0d0620"
            strokeOpacity="0.35"
          />
        );
      })}
    </svg>
  );
}

/**
 * Two big planets drifting behind everything. Purely decorative, and skipped
 * on small screens where they would only crowd the content.
 */
export function PlanetBackdrop({ look }: { look: PlanetLook }) {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__near">
        <Planet look={look} size={520} spin />
      </div>
      <div className="backdrop__far">
        <Planet look={{ type: 'rocky', hue: (look.hue + 140) % 360, moons: 0 }} size={190} glow={false} />
      </div>
    </div>
  );
}
