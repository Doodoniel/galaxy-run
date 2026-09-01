import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  r: number;
  tw: number;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * The living background: three parallax layers of stars that drift slowly,
 * twinkle, and are crossed by the occasional comet. Everything is drawn on a
 * single canvas so the DOM stays light even on a classroom projector.
 */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Star[] = [];
    let shooters: Shooter[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let t = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 5200);
      stars = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.4 + z * 1.5,
          tw: Math.random() * Math.PI * 2,
        };
      });
    };

    const frame = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.y += reduced ? 0 : (0.03 + s.z * 0.13);
        if (s.y > h + 2) {
          s.y = -2;
          s.x = Math.random() * w;
        }
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.02 + s.tw);
        const alpha = (0.25 + s.z * 0.7) * twinkle;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.z > 0.82 ? '#dcd0ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.9) {
          ctx.globalAlpha = alpha * 0.35;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduced && Math.random() < 0.0035 && shooters.length < 2) {
        const fromLeft = Math.random() > 0.5;
        shooters.push({
          x: fromLeft ? -40 : w + 40,
          y: Math.random() * h * 0.6,
          vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 4),
          vy: 1.8 + Math.random() * 1.6,
          life: 1,
        });
      }

      shooters = shooters.filter((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.006;
        if (s.life <= 0) return false;
        const tail = 22;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail * 0.5, s.y - s.vy * tail * 0.5);
        grad.addColorStop(0, `rgba(255,240,200,${0.85 * s.life})`);
        grad.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * tail * 0.5, s.y - s.vy * tail * 0.5);
        ctx.stroke();
        return s.x > -160 && s.x < w + 160 && s.y < h + 160;
      });

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    resize();
    frame();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <div className="nebula" />
      <canvas ref={ref} className="starfield" aria-hidden="true" />
    </>
  );
}
