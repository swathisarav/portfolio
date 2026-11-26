import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';

/**
 * Landing gate, seen from directly above: shallow water with light
 * ripples, a sandy beach with a foamy shoreline, fish, and a boat.
 * Clicking the boat sends it out to sea, chased by a white wave that
 * washes over the screen and reveals the main page.
 */

const NAME = 'Swathi Saravanan';

const C = {
  navy: '#083A4F',
  teal: '#407E8C',
  aqua: '#C0D5D6',
  sand: '#E5E1DD',
  cream: '#F4F2EF', // same as the main page background, so the wave hands off seamlessly
  gold: '#A58D66',
  beach: '#DCC7A6',
  beachDeep: '#CDB48D',
  waterDeep: '#2D6A78',
  waterMid: '#4E929C',
  waterShallow: '#8CC3C2',
};

/* ------------------------------------------------------------------ */
/* Shoreline geometry (shared by sand, foam, boat position, fish).      */
/* ------------------------------------------------------------------ */

const VW = 1440;
const VH = 900;
const SHORE = { base: 1130, amp: 42, phase: 4.0 };

function shoreX(y: number, off = 0) {
  const t = y / VH;
  return (
    SHORE.base +
    off +
    (t - 0.5) * 90 +
    Math.sin(t * Math.PI * 1.8 + SHORE.phase) * SHORE.amp +
    Math.sin(t * Math.PI * 4.2 + SHORE.phase * 1.7) * SHORE.amp * 0.3
  );
}

function shorePath(off = 0) {
  let d = '';
  for (let y = -40; y <= VH + 40; y += 10) d += `${d ? ' L' : 'M'} ${shoreX(y, off).toFixed(1)},${y}`;
  return d;
}

const BOAT_Y = 0.42;
const SHORE_AT_BOAT = shoreX(BOAT_Y * VH) / VW;
const WATER_FRACTION = (SHORE.base - SHORE.amp - 40) / VW;

/* ------------------------------------------------------------------ */
/* Water: gradient + a network of light ripples (caustics).             */
/* ------------------------------------------------------------------ */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Smooth closed blob through points (Catmull-Rom converted to cubic Béziers). */
function blobPath(pts: [number, number][]) {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/**
 * Caustic cells: jittered points, each claiming the area closest to it
 * (a Voronoi cell), shrunk to leave a thin, varying bright gap and
 * rounded off so the light network looks organic.
 */
function makeCells(seed: number, size: number) {
  const rand = seeded(seed);
  const pts: [number, number][] = [];
  const cols = Math.ceil(VW / size) + 3;
  const rows = Math.ceil(VH / (size * 0.87)) + 3;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      pts.push([
        (i + (j % 2 ? 0.5 : 0) + (rand() - 0.5) * 0.7) * size,
        (j + (rand() - 0.5) * 0.7) * size * 0.87,
      ]);
    }
  }
  const DIRS = 16;
  return pts.map(([px, py]) => {
    const near = pts.filter(([qx, qy]) => (qx !== px || qy !== py) && Math.abs(qx - px) < size * 2.2 && Math.abs(qy - py) < size * 2.2);
    const gap = 3 + rand() * 5;
    const outline: [number, number][] = [];
    for (let k = 0; k < DIRS; k++) {
      const a = (k / DIRS) * Math.PI * 2;
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      let t = size * 1.5;
      for (const [qx, qy] of near) {
        const dx = qx - px;
        const dy = qy - py;
        const dot = ux * dx + uy * dy;
        if (dot > 0) t = Math.min(t, (dx * dx + dy * dy) / (2 * dot));
      }
      t = Math.max(2, t - gap);
      outline.push([px + ux * t, py + uy * t]);
    }
    return blobPath(outline);
  });
}

function Caustics({ id, seed, size, opacity }: { id: string; seed: number; size: number; opacity: number }) {
  const cells = useMemo(() => makeCells(seed, size), [seed, size]);
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <mask id={id}>
          <rect x={-100} y={-100} width={VW + 200} height={VH + 200} fill="white" />
          {cells.map((d, i) => (
            <path key={i} d={d} fill="black" />
          ))}
        </mask>
      </defs>
      {/* the light network is whatever lies between the cells */}
      <rect x={-100} y={-100} width={VW + 200} height={VH + 200} fill="white" opacity={opacity} mask={`url(#${id})`} />
    </svg>
  );
}

function Water() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(100deg, ${C.waterDeep} 0%, ${C.waterMid} 45%, ${C.waterShallow} 80%)`,
        }}
      />
      {/* light ripples on the bottom, drifting slowly */}
      <motion.div
        className="absolute -inset-10 will-change-transform"
        animate={{ x: [0, -18, 0], y: [0, 10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Caustics id="caustic-a" seed={11} size={105} opacity={0.55} />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Beach + foamy shoreline.                                             */
/* ------------------------------------------------------------------ */

function Beach() {
  const sand = `${shorePath()} L ${VW + 50},${VH + 40} L ${VW + 50},-40 Z`;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="sand" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.75" stopColor={C.beachDeep} />
          <stop offset="1" stopColor={C.beach} />
        </linearGradient>
      </defs>
      <path d={sand} fill="url(#sand)" />
      {/* wet sand just above the waterline */}
      <path d={shorePath(14)} fill="none" stroke={C.beachDeep} strokeWidth={26} strokeOpacity={0.6} vectorEffect="non-scaling-stroke" />

      {/* foam washing in and out */}
      <motion.g animate={{ x: [0, -16, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
        {/* thin trailing line of foam in the water */}
        <path
          d={shorePath(-34)}
          fill="none"
          stroke={C.cream}
          strokeOpacity={0.55}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="40 10 6 12"
          vectorEffect="non-scaling-stroke"
        />
        {/* the main foam band */}
        <path d={shorePath(-4)} fill="none" stroke={C.cream} strokeWidth={20} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {/* bubbles: little holes in the foam */}
        <path
          d={shorePath(-6)}
          fill="none"
          stroke={C.waterShallow}
          strokeOpacity={0.8}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="0.1 15 0.1 9"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={shorePath(0)}
          fill="none"
          stroke={C.beachDeep}
          strokeOpacity={0.55}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="0.1 21 0.1 13"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Fish, seen from above, with shadows on the sandy bottom.             */
/* ------------------------------------------------------------------ */

const FISH_STYLES: { body: string; fin: string; spots: string | null; size: number }[] = [
  { body: C.cream, fin: C.gold, spots: C.gold, size: 1.15 },
  { body: C.gold, fin: '#8C7550', spots: C.cream, size: 0.9 },
  { body: C.navy, fin: C.teal, spots: null, size: 0.75 },
  { body: C.cream, fin: C.aqua, spots: C.navy, size: 0.85 },
  { body: C.gold, fin: C.cream, spots: null, size: 0.7 },
  { body: C.cream, fin: C.gold, spots: '#C9744F', size: 1.25 },
  { body: C.navy, fin: C.aqua, spots: C.cream, size: 0.95 },
  { body: C.aqua, fin: C.cream, spots: null, size: 0.8 },
];

const FISH_BODY = 'M 22,0 C 19,-7 6,-9.5 -8,-6 C -14,-4 -18,-1.5 -19,0 C -18,1.5 -14,4 -8,6 C 6,9.5 19,7 22,0 Z';
const FISH_TAIL = 'M -17,0 C -23,-6 -30,-9 -33,-7 C -29,-3 -29,3 -33,7 C -30,9 -23,6 -17,0 Z';

function FishShape({ body, fin, spots }: { body: string; fin: string; spots: string | null }) {
  // Facing right, centred on the origin.
  return (
    <g>
      {/* shadow on the bottom */}
      <g transform="translate(7 10)" opacity={0.18}>
        <path d={FISH_TAIL} fill={C.navy} />
        <path d={FISH_BODY} fill={C.navy} />
      </g>
      <path d={FISH_TAIL} fill={fin} />
      <ellipse cx={6} cy={-8} rx={6} ry={2.5} transform="rotate(-25 6 -8)" fill={fin} />
      <ellipse cx={6} cy={8} rx={6} ry={2.5} transform="rotate(25 6 8)" fill={fin} />
      <path d={FISH_BODY} fill={body} />
      {spots && (
        <>
          <circle cx={2} cy={-2} r={3} fill={spots} />
          <circle cx={-8} cy={2} r={2.2} fill={spots} />
        </>
      )}
      <path d="M 8,0 L -12,0" stroke={fin} strokeOpacity={0.6} strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={16} cy={-3.2} r={1.3} fill={C.navy} />
      <circle cx={16} cy={3.2} r={1.3} fill={C.navy} />
    </g>
  );
}

type Fish = { x: number; y: number; a: number; speed: number; turn: number; phase: number };

function School({ avoidRef }: { avoidRef: React.RefObject<HTMLElement | null> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fishRefs = useRef<(SVGGElement | null)[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const svg = svgRef.current!;
    let w = svg.clientWidth;
    let h = svg.clientHeight;
    // Fish steer around the name + one-liner so the text stays readable.
    let avoid = { l: 0, t: 0, r: 0, b: 0 };
    const measure = () => {
      const el = avoidRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const o = svg.getBoundingClientRect();
      const pad = 30;
      avoid = { l: r.left - o.left - pad, t: r.top - o.top - pad, r: r.right - o.left + pad, b: r.bottom - o.top + pad };
    };
    measure();
    const measureTimer = window.setTimeout(measure, 1500);
    const onResize = () => {
      w = svg.clientWidth;
      h = svg.clientHeight;
      measure();
    };
    const onMove = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);

    const fish: Fish[] = FISH_STYLES.map((_, i) => ({
      x: 80 + ((i * 173) % Math.max(200, w * 0.6)),
      y: 70 + ((i * 211) % Math.max(200, h - 140)),
      a: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.5,
      turn: 0,
      phase: Math.random() * 10,
    }));

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 1;
      const oceanRight = w * WATER_FRACTION - 30;
      fish.forEach((f, i) => {
        f.turn += (Math.random() - 0.5) * 0.02;
        f.turn *= 0.95;
        let target = f.a + f.turn;
        let speed = f.speed;

        // flee the cursor
        const dx = f.x - mouse.current.x;
        const dy = f.y - mouse.current.y;
        const dist = Math.hypot(dx, dy);
        const fleeing = dist < 150;
        if (fleeing) {
          target = Math.atan2(dy, dx);
          speed = f.speed + (150 - dist) / 30;
        }

        // swim around the text block
        if (!fleeing && f.x > avoid.l && f.x < avoid.r && f.y > avoid.t && f.y < avoid.b) {
          const toTop = f.y - avoid.t;
          const toBottom = avoid.b - f.y;
          const toRight = avoid.r - f.x;
          const m = Math.min(toTop, toBottom, toRight);
          target = m === toRight ? 0 : toTop < toBottom ? -Math.PI / 2 : Math.PI / 2;
          speed = f.speed + 1.2;
        }

        // stay in the water
        const margin = 50;
        if (f.x < margin) target = 0;
        else if (f.x > oceanRight) target = Math.PI;
        if (f.y < margin) target = Math.PI / 2;
        else if (f.y > h - margin) target = -Math.PI / 2;

        let diff = target - f.a;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        f.a += diff * (fleeing ? 0.2 : 0.07);

        f.x += Math.cos(f.a) * speed;
        f.y += Math.sin(f.a) * speed;

        const el = fishRefs.current[i];
        if (el) {
          // seen from above there is no upside-down: just rotate, plus a little tail wiggle
          const wiggle = Math.sin(t * 0.15 * (1 + speed * 0.3) + f.phase) * 6;
          const deg = (f.a * 180) / Math.PI + wiggle;
          const s = FISH_STYLES[i].size;
          el.setAttribute('transform', `translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${s})`);
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(measureTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [avoidRef]);

  return (
    <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {FISH_STYLES.map((s, i) => (
        <g
          key={i}
          ref={(el) => {
            fishRefs.current[i] = el;
          }}
          transform="translate(-100 -100)"
        >
          <FishShape body={s.body} fin={s.fin} spots={s.spots} />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Boat, seen from above (bow pointing left, out to sea).               */
/* ------------------------------------------------------------------ */

function BoatShape() {
  return (
    <svg width="180" height="84" viewBox="-6 -6 180 84" aria-hidden>
      {/* shadow on the water */}
      <path
        d="M 6,40 C 26,14 70,10 130,12 L 150,14 C 160,16 164,26 164,40 C 164,54 160,64 150,66 L 130,68 C 70,70 26,66 6,40 Z"
        fill={C.navy}
        opacity={0.2}
      />
      {/* hull */}
      <path
        d="M 0,34 C 20,8 64,4 124,6 L 144,8 C 154,10 158,20 158,34 C 158,48 154,58 144,60 L 124,62 C 64,64 20,60 0,34 Z"
        fill={C.cream}
        stroke={C.navy}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* deck */}
      <path
        d="M 16,34 C 32,16 68,13 122,15 L 140,17 C 147,19 149,26 149,34 C 149,42 147,49 140,51 L 122,53 C 68,55 32,52 16,34 Z"
        fill={C.sand}
      />
      {/* gold trim along the deck */}
      <path d="M 24,34 L 72,34" stroke={C.gold} strokeWidth={2} strokeLinecap="round" strokeDasharray="1 7" />
      {/* cabin roof */}
      <rect x={78} y={19} width={52} height={30} rx={7} fill={C.navy} />
      <rect x={84} y={24} width={40} height={20} rx={4} fill={C.teal} />
      <line x1={84} y1={34} x2={124} y2={34} stroke={C.aqua} strokeWidth={1.5} />
      {/* bow rope coil */}
      <circle cx={34} cy={34} r={4} fill="none" stroke={C.gold} strokeWidth={2} />
    </svg>
  );
}

/** A jagged vertical line used for the wave's foamy front. */
function waveEdge(height: number, amp: number, seed: number) {
  const rand = seeded(seed);
  let d = '';
  for (let y = -20; y <= height + 20; y += 20) {
    const x = amp + Math.sin(y / 60 + seed) * amp * 0.6 + (rand() - 0.5) * amp * 0.5;
    d += `${d ? ' L' : 'M'} ${x.toFixed(1)},${y}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* The chasing wave: a wall of white foam rolling in from the beach.    */
/* ------------------------------------------------------------------ */

function ChasingWave() {
  const edge = useMemo(() => waveEdge(VH, 40, 3), []);
  const edge2 = useMemo(() => waveEdge(VH, 40, 7), []);
  return (
    <motion.div
      className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[140vw]"
      initial={{ x: '100vw' }}
      animate={{ x: '-20vw' }}
      transition={{ duration: 2.0, ease: [0.55, 0, 0.75, 1] }}
      aria-hidden
    >
      <svg className="absolute inset-y-0 left-0 h-full w-[140px]" viewBox={`0 0 140 ${VH}`} preserveAspectRatio="none">
        {/* scattered spray ahead of the wave */}
        <path
          d={edge2}
          transform="translate(-14 0)"
          fill="none"
          stroke={C.cream}
          strokeOpacity={0.7}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="2 18"
          vectorEffect="non-scaling-stroke"
        />
        {/* the foamy front */}
        <path d={`${edge} L 141,${VH + 20} L 141,-20 Z`} fill={C.cream} />
        <path d={edge} fill="none" stroke="white" strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {/* bubbles in the foam */}
        <path
          d={edge}
          transform="translate(16 0)"
          fill="none"
          stroke={C.waterShallow}
          strokeOpacity={0.5}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="0.1 14 0.1 22"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-y-0 left-[139px] right-0" style={{ background: C.cream }} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [sailing, setSailing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const setSail = () => {
    if (sailing) return;
    setSailing(true);
    // Once the wave has washed over everything, hand off to the main page.
    setTimeout(onUnlock, 2050);
  };

  return (
    <motion.div
      key="gate"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[60] overflow-hidden text-cream"
    >
      <Water />
      <Beach />
      <School avoidRef={textRef} />

      {/* Name + one-liner */}
      <div
        className="relative flex h-full items-center px-8 md:px-16"
        style={{ paddingRight: `calc(${(1 - SHORE_AT_BOAT) * 100}% + 2rem)` }}
      >
        <div ref={textRef} className="max-w-3xl" style={{ textShadow: '0 1px 12px rgba(8,58,79,0.35)' }}>
          <h1 className="mb-6 text-5xl md:text-7xl tracking-tight" aria-label={NAME}>
            {NAME.split('').map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block"
                initial={{ opacity: 0, y: 30, rotate: -8 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.2 + i * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
                whileHover={{ y: -10, color: C.navy, transition: { duration: 0.15 } }}
              >
                {ch === ' ' ? ' ' : ch}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="max-w-2xl text-xl md:text-2xl leading-relaxed text-cream/95"
          >
            I love creating things, and I love it even more when they’re useful to people. I’m
            currently a graduate student at the University of Pennsylvania.
          </motion.p>
          <div className="mt-10 flex gap-2">
            <motion.div className="h-1 bg-cream" initial={{ width: 0 }} animate={{ width: 80 }} transition={{ duration: 0.8, delay: 1.1 }} />
            <motion.div className="h-1 bg-gold" initial={{ width: 0 }} animate={{ width: 40 }} transition={{ duration: 0.8, delay: 1.3 }} />
            <motion.div className="h-1 bg-navy" initial={{ width: 0 }} animate={{ width: 20 }} transition={{ duration: 0.8, delay: 1.5 }} />
          </div>
        </div>
      </div>

      {/* Boat, resting on the shoreline */}
      <div
        className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${SHORE_AT_BOAT * 100}%`, top: `${BOAT_Y * 100}%` }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: sailing ? 0 : 1 }}
          transition={{ delay: sailing ? 0 : 2 }}
          className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap text-sm tracking-wider text-cream"
          style={{ textShadow: '0 1px 8px rgba(8,58,79,0.4)' }}
        >
          Click the boat to set sail →
        </motion.p>
        <motion.button
          onClick={setSail}
          aria-label="Set sail and enter the site"
          className="relative block cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold"
          animate={sailing ? { x: '-75vw', rotate: [0, -4, 2, -3, 0] } : { rotate: [-2, 2, -2], x: [0, -3, 0] }}
          transition={
            sailing ? { duration: 1.7, ease: [0.25, 0.1, 0.4, 1] } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }
          whileHover={sailing ? undefined : { scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* V-shaped wake spreading behind the boat */}
          {sailing && (
            <motion.svg
              className="pointer-events-none absolute left-[70%] top-1/2 -translate-y-1/2"
              width="260"
              height="140"
              viewBox="0 0 260 140"
              style={{ originX: 0 }}
              initial={{ opacity: 0, scaleX: 0.1, scaleY: 0.3 }}
              animate={{ opacity: 0.85, scaleX: 1, scaleY: 1 }}
              transition={{ duration: 0.7 }}
              aria-hidden
            >
              <path d="M 0,70 Q 120,52 260,6" fill="none" stroke={C.cream} strokeWidth={3} strokeLinecap="round" strokeDasharray="14 8" />
              <path d="M 0,70 Q 120,88 260,134" fill="none" stroke={C.cream} strokeWidth={3} strokeLinecap="round" strokeDasharray="14 8" />
              <path d="M 10,70 L 200,70" stroke={C.cream} strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />
            </motion.svg>
          )}
          <BoatShape />
        </motion.button>
      </div>

      {sailing && <ChasingWave />}
    </motion.div>
  );
}
