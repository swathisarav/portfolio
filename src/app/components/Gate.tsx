import { memo, useEffect, useMemo, useRef, type ReactNode, type Ref, type RefObject } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * Landing gate, seen from above: dark water deepening to the left, a pale
 * beach down the right-hand side, a few fish that scatter from the cursor, and
 * the name. Pulling up brings in the wave (see WaveTransition.tsx) that washes
 * the beach away to reveal the site.
 */

const NAME_FIRST = 'Swathi';
const NAME_LAST = 'Saravanan';

const C = {
  ink: '#D9DCD6',
  inkSoft: '#A9ADA7',
  seaBright: '#3FA9AA',
  foam: '#E9EDE8',
  sand: '#CDC6B6',
  sandLight: '#DBD5C7',
  sandWet: '#ADA593',
  coral: '#C48E74',
  shell: '#EAD9CC',
};

/* ------------------------------------------------------------------ */
/* Geometry (a 1440 x 900 box stretched to the screen).                 */
/* ------------------------------------------------------------------ */

const VW = 1440;
const VH = 900;
/**
 * The coast curves from ~60% across at the top out through the right-hand edge
 * about four-fifths of the way down, so the bottom right is open sea.
 */
function shoreFraction(t: number) {
  return 0.6 + 0.6 * t * t;
}

function shoreX(y: number, off = 0) {
  const t = y / VH;
  return VW * shoreFraction(t) + off + Math.sin(t * Math.PI * 2.0 + 0.6) * 18 + Math.sin(t * Math.PI * 4.6 + 2.1) * 6;
}

function verticalPath(f: (y: number) => number, step = 12) {
  let d = '';
  for (let y = -40; y <= VH + 40; y += step) d += `${d ? ' L' : 'M'} ${f(y).toFixed(1)},${y}`;
  return d;
}


function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------------ */
/* Foam ribbons: strands that twist around each other, one of them a    */
/* filled ribbon of varying thickness, plus a few bubbles.              */
/* ------------------------------------------------------------------ */

type RibbonSpec = { offset: number; amp: number; seed: number; strands: number; dur: number; opacity: number };

/** One incoming wave, running parallel to the coast a little way out. */
const RIBBONS: RibbonSpec[] = [{ offset: 75, amp: 16, seed: 17, strands: 3, dur: 9, opacity: 0.75 }];

function Ribbon({ spec }: { spec: RibbonSpec }) {
  const { strands, ribbon, bubbles } = useMemo(() => {
    const rand = seeded(spec.seed);
    const f1 = 0.005 + rand() * 0.002;
    const f2 = 0.014 + rand() * 0.004;
    const strandFns = Array.from({ length: spec.strands }, (_, k) => {
      const p1 = rand() * 6;
      const p2 = rand() * 6;
      const drift = (k - spec.strands / 2) * 7;
      const a = spec.amp * (0.7 + rand() * 0.5);
      return (y: number) => shoreX(y, -spec.offset) + drift + Math.sin(y * f1 + p1 * 0.35) * a + Math.sin(y * f2 + p2) * a * 0.35;
    });
    const thick = (y: number) => 2 + 6 * (0.5 + 0.5 * Math.sin(y * 0.012 + spec.seed));
    const edge = strandFns[0];
    let ribbonD = verticalPath(edge);
    for (let y = VH + 40; y >= -40; y -= 12) ribbonD += ` L ${(edge(y) + thick(y)).toFixed(1)},${y}`;
    ribbonD += ' Z';
    const bubbleList = Array.from({ length: 6 }, () => {
      const y = rand() * VH;
      const f = strandFns[Math.floor(rand() * strandFns.length)];
      return { x: f(y) + (rand() - 0.5) * 30, y, r: 2 + rand() * 4 };
    });
    return { strands: strandFns.map((f) => verticalPath(f)), ribbon: ribbonD, bubbles: bubbleList };
  }, [spec]);

  return (
    <g>
      <path d={ribbon} fill={C.foam} opacity={0.9} />
      {strands.map((d, k) => (
        <path
          key={k}
          d={d}
          fill="none"
          stroke={C.foam}
          strokeOpacity={k === 0 ? 0.9 : 0.35 + (k % 3) * 0.2}
          strokeWidth={k % 2 ? 1.2 : 2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {bubbles.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="none" stroke={C.foam} strokeOpacity={0.6} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Sea + beach.                                                          */
/* ------------------------------------------------------------------ */

/**
 * Drawn as stacked layers: the still sea and sand are painted once, and the
 * moving foam sits in its own layers that slide with CSS animations. The
 * browser then only moves finished pictures around on the GPU instead of
 * repainting a full-screen SVG on every frame (which is what made it stutter).
 */
const Seascape = memo(function Seascape() {
  const sand = `${verticalPath((y) => shoreX(y))} L ${VW + 40},${VH + 40} L ${VW + 40},-40 Z`;
  // a few rings of lace in the shore foam
  const lace = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: 8 }, () => {
      const y = rand() * VH;
      return { x: shoreX(y, -14 - rand() * 22), y, rx: 3 + rand() * 6, ry: 5 + rand() * 12 };
    });
  }, []);
  const layer = { className: 'absolute inset-0 h-full w-full', viewBox: `0 0 ${VW} ${VH}`, preserveAspectRatio: 'none' as const };
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg {...layer}>
        <defs>
          {/* deepest on the left, shallowing towards the beach */}
          <linearGradient id="sea" x1="0" x2="1" y1="0.2" y2="0.8">
            <stop offset="0" stopColor="#04090A" />
            <stop offset="0.38" stopColor="#0B1C1F" />
            <stop offset="0.62" stopColor="#123537" />
            <stop offset="0.8" stopColor="#1D5254" />
          </linearGradient>
        </defs>
        <rect x={-40} y={-40} width={VW + 80} height={VH + 80} fill="url(#sea)" />
      </svg>

      {/* the incoming wave, drifting (see .gate-drift in index.css) */}
      {RIBBONS.map((r, i) => (
        <div key={i} className="gate-drift absolute inset-0" style={{ opacity: r.opacity, animationDuration: `${r.dur}s` }}>
          <svg {...layer}>
            <Ribbon spec={r} />
          </svg>
        </div>
      ))}

      <svg {...layer}>
        <defs>
          <linearGradient id="beach" x1="0.6" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={C.sand} />
            <stop offset="1" stopColor={C.sandLight} />
          </linearGradient>
        </defs>
        <path d={sand} fill="url(#beach)" />
        {/* wet sand just above the waterline */}
        <path d={verticalPath((y) => shoreX(y, 12))} fill="none" stroke={C.sandWet} strokeOpacity={0.5} strokeWidth={22} vectorEffect="non-scaling-stroke" />
      </svg>

      {/* the foam line washing up and back (see .gate-wash in index.css) */}
      <div className="gate-wash absolute inset-0">
      <svg {...layer}>
        <path d={verticalPath((y) => shoreX(y, -4))} fill="none" stroke={C.foam} strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path
          d={verticalPath((y) => shoreX(y, -5))}
          fill="none"
          stroke="#2C6264"
          strokeOpacity={0.7}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="0.1 13 0.1 21"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={verticalPath((y) => shoreX(y, -30) + Math.sin(y * 0.04) * 5)}
          fill="none"
          stroke={C.foam}
          strokeOpacity={0.75}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {lace.map((l, i) => (
          <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} fill="none" stroke={C.foam} strokeOpacity={0.7} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      </div>
    </div>
  );
});

/* Shells and a starfish on the sand (kept out of the stretched SVG so they never distort). */

function Starfish({ size = 34, color = C.coral }: { size?: number; color?: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 7 : 17;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return (
    <svg width={size} height={size} viewBox="-19 -19 38 38">
      <polygon points={pts.join(' ')} fill={color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={Math.cos(a) * 9} cy={Math.sin(a) * 9} r={1.2} fill="#F0C9B5" />;
      })}
    </svg>
  );
}

function Scallop({ size = 30, color = C.shell }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="-16 -16 32 27">
      <path d="M 0,9 L -14,-4 C -12,-14 12,-14 14,-4 Z" fill={color} />
      {[-10, -5, 0, 5, 10].map((x) => (
        <line key={x} x1={0} y1={9} x2={x} y2={-11} stroke="#C8A898" strokeWidth={1} />
      ))}
      <rect x={-4} y={7} width={8} height={4} rx={1.5} fill={color} />
    </svg>
  );
}

/* --- where things lie on the beach -------------------------------------- */

type BeachItem = {
  /** position, as % of the screen from the left / from the bottom */
  x: number;
  b: number;
  el: ReactNode;
  rot?: number;
};

/** Almost bare sand: just a couple of finds on the beach. */
const BEACH_ITEMS: BeachItem[] = [
  { x: 89, b: 72, el: <Starfish size={34} color="#B59C8F" />, rot: -18 },
  { x: 83, b: 56, el: <Scallop size={24} color="#E7E3D8" />, rot: -15 },
];

const Shells = memo(function Shells() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {BEACH_ITEMS.map((it, i) => (
        <div
          key={i}
          className="absolute drop-shadow-[0_2px_2px_rgba(0,0,0,0.22)]"
          style={{ left: `${it.x}%`, bottom: `${it.b}%`, transform: `translate(-50%, 50%) rotate(${it.rot ?? 0}deg)` }}
        >
          {it.el}
        </div>
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Fish, seen from above.                                               */
/* ------------------------------------------------------------------ */

/** Dark silhouettes, as if glimpsed through the water from above. */
const FISH_STYLES: { size: number; opacity: number }[] = [
  { size: 1.9, opacity: 0.55 }, // big
  { size: 0.55, opacity: 0.5 }, // small fry
  { size: 1.2, opacity: 0.55 },
  { size: 0.75, opacity: 0.45 },
  { size: 2.4, opacity: 0.5 }, // the biggest, drifting deep
  { size: 0.45, opacity: 0.5 },
  { size: 1.0, opacity: 0.5 },
  { size: 0.65, opacity: 0.45 },
];

const SILHOUETTE = '#02141A';
const FISH_BODY = 'M 24,0 C 21,-6.5 8,-9 -6,-6 C -13,-4 -18,-1.5 -19,0 C -18,1.5 -13,4 -6,6 C 8,9 21,6.5 24,0 Z';
const FISH_TAIL = 'M -16,0 C -22,-5 -30,-10 -34,-9 C -30,-4 -30,4 -34,9 C -30,10 -22,5 -16,0 Z';

function FishShape({ opacity }: { opacity: number }) {
  // Facing right, centred on the origin: one flat shape, no details.
  return (
    <g fill={SILHOUETTE} opacity={opacity}>
      <path d={FISH_TAIL} />
      <path d="M 9,-6 C 6,-14 -2,-17 -6,-16 C -3,-12 -2,-8 -1,-6 Z" />
      <path d="M 9,6 C 6,14 -2,17 -6,16 C -3,12 -2,8 -1,6 Z" />
      <path d="M -6,-5 L -12,-9 L -10,-3 Z" />
      <path d="M -6,5 L -12,9 L -10,3 Z" />
      <path d={FISH_BODY} />
    </g>
  );
}

type Fish = { x: number; y: number; a: number; speed: number; turn: number; phase: number };

const School = memo(function School({ avoidRef, count = FISH_STYLES.length }: { avoidRef: RefObject<HTMLElement | null>; count?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const fishRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const box = boxRef.current!;
    // Layout is read only when something actually changes size (the window, or the
    // name once its web font arrives), never inside the animation loop.
    let w = 0;
    let h = 0;
    let origin = { left: 0, top: 0 };
    let avoid = { l: 0, t: 0, r: 0, b: 0 };
    const measure = () => {
      const o = box.getBoundingClientRect();
      w = o.width;
      h = o.height;
      origin = o;
      const el = avoidRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 30;
      avoid = { l: r.left - o.left - pad, t: r.top - o.top - pad, r: r.right - o.left + pad, b: r.bottom - o.top + pad };
    };
    measure();
    const resizes = new ResizeObserver(measure);
    resizes.observe(box);
    if (avoidRef.current) resizes.observe(avoidRef.current);
    const onMove = (e: PointerEvent) => {
      mouse.current = { x: e.clientX - origin.left, y: e.clientY - origin.top };
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const fish: Fish[] = FISH_STYLES.slice(0, count).map((_, i) => ({
      x: 80 + ((i * 197) % Math.max(200, w * 0.55 - 80)),
      y: 60 + ((i * 131) % Math.max(160, h - 120)),
      a: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.5,
      turn: 0,
      phase: Math.random() * 10,
    }));

    // Speeds are tuned in "60 fps frames"; `k` scales each step by the real time
    // elapsed, so the fish swim at the same pace on 60, 120 or 144 Hz screens.
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const k = Math.min(3, (now - last) / (1000 / 60)); // capped, so a background tab doesn't teleport them
      last = now;
      t += k;
      fish.forEach((f, i) => {
        f.turn += (Math.random() - 0.5) * 0.02 * k;
        f.turn *= Math.pow(0.95, k);
        let target = f.a + f.turn;
        let speed = f.speed;

        const dx = f.x - mouse.current.x;
        const dy = f.y - mouse.current.y;
        const dist = Math.hypot(dx, dy);
        const fleeing = dist < 150;
        if (fleeing) {
          target = Math.atan2(dy, dx);
          speed = f.speed + (150 - dist) / 30;
        }

        if (!fleeing && f.x > avoid.l && f.x < avoid.r && f.y > avoid.t && f.y < avoid.b) {
          const toTop = f.y - avoid.t;
          const toBottom = avoid.b - f.y;
          const toRight = avoid.r - f.x;
          const m = Math.min(toTop, toBottom, toRight);
          target = m === toRight ? 0 : toTop < toBottom ? -Math.PI / 2 : Math.PI / 2;
          speed = f.speed + 1.2;
        }

        const margin = 50;
        if (f.x < margin) target = 0;
        else if (f.x > Math.min(w - margin, w * shoreFraction(f.y / h) - 40)) target = Math.PI;
        if (f.y < margin) target = Math.PI / 2;
        else if (f.y > h - margin) target = -Math.PI / 2;

        let diff = target - f.a;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        f.a += diff * (1 - Math.pow(1 - (fleeing ? 0.2 : 0.07), k));
        f.x += Math.cos(f.a) * speed * k;
        f.y += Math.sin(f.a) * speed * k;

        const el = fishRefs.current[i];
        if (el) {
          const wiggle = Math.sin(t * 0.15 * (1 + speed * 0.3) + f.phase) * 6;
          const deg = (f.a * 180) / Math.PI + wiggle;
          // GPU-only: each fish is drawn once, then just slid and turned
          el.style.transform = `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0) rotate(${deg.toFixed(1)}deg)`;
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      resizes.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [avoidRef, count]);

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {FISH_STYLES.slice(0, count).map((s, i) => (
        <div
          key={i}
          ref={(el) => {
            fishRefs.current[i] = el;
          }}
          className="absolute left-0 top-0"
          style={{ transform: 'translate3d(-200px, -200px, 0)', transformOrigin: '0 0', willChange: 'transform' }}
        >
          {/* drawn at its final size (rather than scaled by the transform) so it stays crisp */}
          <svg
            width={80 * s.size}
            height={40 * s.size}
            viewBox="-40 -20 80 40"
            className="absolute overflow-visible"
            style={{ left: -40 * s.size, top: -20 * s.size }}
          >
            <FishShape opacity={s.opacity} />
          </svg>
        </div>
      ))}
    </div>
  );
});

/** Left inset shared by the name and the scroll hint. */
const PAD = 'clamp(1.5rem, 9vw, 10rem)';

/**
 * The beach. Its exit (and its return) is the wave in WaveTransition.tsx; this
 * component is just the scene. `pull` is how far the current pull has
 * stretched, so the name can lift with it like a rubber band.
 */
export function Gate({
  rootRef,
  pull,
  startHidden = false,
}: {
  rootRef: Ref<HTMLDivElement>;
  pull: MotionValue<number>;
  /** mounted over the site for the wave to reveal: start fully clipped away */
  startHidden?: boolean;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const sceneY = useTransform(pull, (v) => -v * 0.6);
  const hintOpacity = useTransform(pull, (v) => 1 - Math.min(1, Math.abs(v) / 40));

  const letters = (word: string, offset: number, color?: string) =>
    word.split('').map((ch, i) => (
      <motion.span
        key={`${word}-${i}`}
        aria-hidden
        className="inline-block"
        style={color ? { color } : undefined}
        initial={{ opacity: 0, y: 30, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.25 + (offset + i) * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
        whileHover={{ y: -10, transition: { duration: 0.15 } }}
      >
        {ch}
      </motion.span>
    ));

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] overflow-hidden"
      style={{ color: C.ink, clipPath: startHidden ? 'inset(100% 0 0 0)' : undefined }}
    >
      <Seascape />
      <Shells />
      <School avoidRef={textRef} count={isMobile ? 4 : 7} />

      {/* Name on two lines with the label beneath; left-aligned, a little above centre */}
      <motion.div
        className="absolute inset-0 flex items-start pt-[24vh] md:items-center md:pt-0 md:pb-[12vh]"
        style={{ paddingLeft: PAD, paddingRight: '1.5rem', y: sceneY, willChange: 'transform' }}
      >
        <div ref={textRef} className="w-fit max-w-full">
          <h1
            className="font-display font-bold uppercase leading-[0.92] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem, 8.5vw, 8.5rem)' }}
            aria-label={`${NAME_FIRST} ${NAME_LAST}`}
          >
            <span className="block whitespace-nowrap">{letters(NAME_FIRST, 0)}</span>
            <span className="block whitespace-nowrap">{letters(NAME_LAST, NAME_FIRST.length, C.seaBright)}</span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex w-full items-center gap-3 md:gap-4 text-xs md:text-base font-semibold uppercase tracking-[0.14em] md:tracking-[0.2em]"
            style={{ color: C.seaBright }}
          >
            <span className="h-px flex-1" style={{ background: C.seaBright }} />
            Portfolio website
            <span className="h-px flex-1" style={{ background: C.seaBright }} />
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll hint, under the name: fades in, and out again as soon as you start pulling */}
      <motion.div
        className="pointer-events-none absolute bottom-[7%]"
        style={{ left: PAD, y: sceneY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.4 }}
      >
        <motion.div
          className="flex items-center gap-3 text-xs md:text-sm font-semibold uppercase tracking-[0.25em]"
          style={{ color: C.inkSoft, opacity: hintOpacity }}
        >
          {isMobile ? 'Swipe up to dive in' : 'Scroll to dive in'}
          <svg width="14" height="14" viewBox="0 0 14 14" className="gate-bob" aria-hidden>
            <path d="M 2,4 L 7,9 L 12,4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
