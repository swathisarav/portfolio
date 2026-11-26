import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { useIsMobile } from './ui/use-mobile';
import { BoatShape, BOAT_W, BOAT_H } from './Boat';

/**
 * Landing gate, seen from above: dark water deepening to the left, a pale
 * beach down the right-hand side, a few fish, and a yacht waiting near the
 * shore. Scrolling down stretches the scene like a rubber band while the tip
 * of a cone-shaped wave peeks up from below; past a point it lets go: the wave
 * surges up, the yacht rides its crest over the land and off the page, and the
 * scene is washed into the main page's background.
 */

const NAME_FIRST = 'Swathi';
const NAME_LAST = 'Saravanan';

const C = {
  ink: '#D9DCD6',
  inkSoft: '#A9ADA7',
  sea: '#1F7F82',
  seaBright: '#3FA9AA',
  foam: '#E9EDE8',
  paper: '#F4F5F2', // the main page background, so the wave hands off seamlessly
  sand: '#CDC6B6',
  sandLight: '#DBD5C7',
  sandWet: '#ADA593',
  coral: '#C48E74',
  shell: '#EAD9CC',
  gold: '#A58D66',
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

function horizontalPath(f: (x: number) => number, step = 12) {
  let d = '';
  for (let x = -40; x <= VW + 40; x += step) d += `${d ? ' L' : 'M'} ${x},${f(x).toFixed(1)}`;
  return d;
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
    <motion.g
      animate={{ x: [0, 10, 0], y: [0, -20, 0] }}
      transition={{ duration: spec.dur, repeat: Infinity, ease: 'easeInOut' }}
      opacity={spec.opacity}
    >
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
    </motion.g>
  );
}

/* ------------------------------------------------------------------ */
/* Sea + beach.                                                          */
/* ------------------------------------------------------------------ */

function Seascape() {
  const sand = `${verticalPath((y) => shoreX(y))} L ${VW + 40},${VH + 40} L ${VW + 40},-40 Z`;
  // a few rings of lace in the shore foam
  const lace = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: 8 }, () => {
      const y = rand() * VH;
      return { x: shoreX(y, -14 - rand() * 22), y, rx: 3 + rand() * 6, ry: 5 + rand() * 12 };
    });
  }, []);
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        {/* deepest on the left, shallowing towards the beach */}
        <linearGradient id="sea" x1="0" x2="1" y1="0.2" y2="0.8">
          <stop offset="0" stopColor="#04090A" />
          <stop offset="0.38" stopColor="#0B1C1F" />
          <stop offset="0.62" stopColor="#123537" />
          <stop offset="0.8" stopColor="#1D5254" />
        </linearGradient>
        <linearGradient id="beach" x1="0.6" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={C.sand} />
          <stop offset="1" stopColor={C.sandLight} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={VW + 80} height={VH + 80} fill="url(#sea)" />

      {RIBBONS.map((r, i) => (
        <Ribbon key={i} spec={r} />
      ))}

      <path d={sand} fill="url(#beach)" />
      {/* wet sand just above the waterline */}
      <path d={verticalPath((y) => shoreX(y, 12))} fill="none" stroke={C.sandWet} strokeOpacity={0.5} strokeWidth={22} vectorEffect="non-scaling-stroke" />

      {/* the foam line washing up and back */}
      <motion.g animate={{ x: [0, -10, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
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
      </motion.g>
    </svg>
  );
}

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

function Conch({ size = 26 }: { size?: number }) {
  return (
    <svg width={size * 0.6} height={size} viewBox="-8 -14 16 28">
      <path d="M 0,-13 C 6,-6 7,6 0,13 C -7,6 -6,-6 0,-13 Z" fill={C.shell} />
      {[-7, -2, 3, 8].map((y) => (
        <path key={y} d={`M -4,${y} Q 0,${y - 3} 4,${y}`} fill="none" stroke="#B89C88" strokeWidth={1} />
      ))}
    </svg>
  );
}

function Clam({ size = 24, color = '#E9D6C4' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="-14 -10 28 21">
      <ellipse cx={0} cy={0} rx={13} ry={9.5} fill={color} />
      {[-2.5, 1, 4.5].map((r) => (
        <ellipse key={r} cx={0} cy={-2 + r * 0.3} rx={13 - (r + 3) * 1.2} ry={9.5 - (r + 3) * 0.9} fill="none" stroke="#C4A58E" strokeWidth={0.9} />
      ))}
    </svg>
  );
}

function Snail({ size = 20, color = '#EFE2D2' }: { size?: number; color?: string }) {
  let d = '';
  for (let a = 0; a <= Math.PI * 5; a += 0.2) {
    const r = 1 + a * 1.25;
    d += `${d ? ' L' : 'M'} ${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44">
      <circle cx={0} cy={0} r={21} fill={color} />
      <path d={d} fill="none" stroke="#B9967C" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function SandDollar({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-15 -15 30 30">
      <circle cx={0} cy={0} r={14} fill="#E8DCC8" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return (
          <ellipse
            key={i}
            cx={Math.cos(a) * 6}
            cy={Math.sin(a) * 6}
            rx={1.4}
            ry={4}
            transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * 6} ${Math.sin(a) * 6})`}
            fill="#C9B396"
          />
        );
      })}
    </svg>
  );
}

/** A little crab seen from above. */
function Crab({ size = 34, color = '#C27F64' }: { size?: number; color?: string }) {
  const dark = '#9E3B22';
  return (
    <svg width={size} height={size * 0.8} viewBox="-24 -20 48 38">
      {/* legs */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((k) => (
          <path
            key={`${side}-${k}`}
            d={`M ${side * 9},${2 + k * 4} Q ${side * 17},${k * 5 - 1} ${side * 21},${6 + k * 5}`}
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        ))
      )}
      {/* claws */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M ${side * 7},-6 Q ${side * 12},-12 ${side * 13},-15`} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M ${side * 13},-15 C ${side * 19},-15 ${side * 20},-21 ${side * 14},-20 Z`} fill={color} />
          <path d={`M ${side * 13},-15 C ${side * 8},-17 ${side * 9},-22 ${side * 14},-20 Z`} fill={color} />
        </g>
      ))}
      {/* body */}
      <ellipse cx={0} cy={2} rx={12} ry={9.5} fill={color} />
      <path d="M -7,-1 Q 0,-5 7,-1" fill="none" stroke={dark} strokeWidth={1} opacity={0.6} />
      {/* eyes on stalks */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <line x1={side * 3.5} y1={-6} x2={side * 4.5} y2={-10.5} stroke={dark} strokeWidth={1.3} />
          <circle cx={side * 4.5} cy={-11} r={1.8} fill="#1A1A1A" />
          <circle cx={side * 4.9} cy={-11.5} r={0.6} fill="#FFF" />
        </g>
      ))}
    </svg>
  );
}

/** Scuttles sideways now and then, then rests. */
function Scuttle({ children, distance = 26, delay = 0 }: { children: ReactNode; distance?: number; delay?: number }) {
  return (
    <motion.div
      animate={{ x: [0, distance, distance, 0, 0] }}
      transition={{ duration: 7, times: [0, 0.12, 0.5, 0.62, 1], repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

/* --- more beach finds -------------------------------------------------- */

function Cowrie({ size = 18, color = '#EAD7C4' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="-11 -8 22 16">
      <ellipse cx={0} cy={0} rx={10} ry={7} fill={color} />
      <ellipse cx={-2} cy={-2} rx={5} ry={2.4} fill="#FFFFFF" opacity={0.35} />
      <path d="M -6,1.5 Q 0,3.5 6,1.5" fill="none" stroke="#8C5A3C" strokeWidth={1.1} strokeLinecap="round" />
      {[-3, 0, 3].map((x) => (
        <circle key={x} cx={x} cy={-3.5} r={0.7} fill="#B07A55" />
      ))}
    </svg>
  );
}

function Auger({ size = 26, color = '#E2CDB0' }: { size?: number; color?: string }) {
  return (
    <svg width={size * 0.4} height={size} viewBox="-5 -13 10 26">
      <path d="M 0,-12.5 L 4.5,11 Q 0,13 -4.5,11 Z" fill={color} />
      {[-7, -3, 1, 5, 9].map((y) => (
        <path key={y} d={`M ${-(y + 13) * 0.17},${y} L ${(y + 13) * 0.17},${y - 2}`} stroke="#A9754F" strokeWidth={0.9} />
      ))}
    </svg>
  );
}

function Mussel({ size = 18 }: { size?: number }) {
  return (
    <svg width={size * 0.6} height={size} viewBox="-6 -10 12 20">
      <path d="M 0,-9.5 C 6,-5 6,6 0,9.5 C -5,6 -5,-5 0,-9.5 Z" fill="#3D3B5C" />
      <path d="M 0,-7 C 3,-3 3,4 0,7" fill="none" stroke="#7F7AA8" strokeWidth={0.9} opacity={0.8} />
    </svg>
  );
}

function Seaweed({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="-20 -12 40 24">
      <path d="M -18,4 C -10,-6 -4,8 4,-2 S 14,-8 18,2" fill="none" stroke="#4F6B3A" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M -14,8 C -6,0 0,10 8,2 S 16,0 19,7" fill="none" stroke="#6F8A4A" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M -16,-2 C -10,-9 -2,-2 2,-8" fill="none" stroke="#5E7A42" strokeWidth={1.4} strokeLinecap="round" />
      {[-9, 1, 11].map((x) => (
        <ellipse key={x} cx={x} cy={x % 2 ? -3 : 3} rx={2} ry={1.3} fill="#7C9550" />
      ))}
    </svg>
  );
}

function Pebble({ size = 14, color = '#A7A39A' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="-10 -7.5 20 15">
      <ellipse cx={0} cy={0} rx={9.5} ry={7} fill={color} />
      <ellipse cx={-2.5} cy={-2.5} rx={4} ry={2} fill="#FFFFFF" opacity={0.25} />
    </svg>
  );
}

/** Dune grass: a tuft of curved blades that sways from its base. */
function DuneGrass({ size = 60, delay = 0 }: { size?: number; delay?: number }) {
  const blades = [
    { d: 'M 0,0 C -2,-14 -10,-26 -20,-34', c: '#8FA37A', w: 2.6 },
    { d: 'M 0,0 C 0,-16 -2,-30 -6,-42', c: '#6E8C5E', w: 2.8 },
    { d: 'M 0,0 C 2,-14 6,-28 4,-40', c: '#A9B98C', w: 2.4 },
    { d: 'M 0,0 C 3,-10 12,-22 22,-28', c: '#7E9A6A', w: 2.4 },
    { d: 'M 0,0 C -1,-8 -8,-16 -14,-18', c: '#A9B98C', w: 2 },
    { d: 'M 0,0 C 2,-8 8,-12 15,-14', c: '#6E8C5E', w: 2 },
  ];
  return (
    <motion.div
      style={{ originX: 0.5, originY: 1 }}
      animate={{ rotate: [-2, 2.5, -2] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <svg width={size} height={size} viewBox="-25 -45 50 47">
        {blades.map((b, i) => (
          <path key={i} d={b.d} fill="none" stroke={b.c} strokeWidth={b.w} strokeLinecap="round" />
        ))}
        <ellipse cx={0} cy={0} rx={5} ry={1.6} fill="#9C7B4E" opacity={0.6} />
      </svg>
    </motion.div>
  );
}

/** Low beach plant: a rosette of round leaves, optionally with a little pink flower. */
function BeachPlant({ size = 40, flower = true }: { size?: number; flower?: boolean }) {
  const leaves = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40">
      {leaves.map((a, i) => (
        <ellipse
          key={i}
          cx={Math.cos(a) * 9}
          cy={Math.sin(a) * 9}
          rx={7}
          ry={5}
          transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 9} ${Math.sin(a) * 9})`}
          fill={i % 2 ? '#7FA06A' : '#6A8F5C'}
        />
      ))}
      <circle cx={0} cy={0} r={5} fill="#5C7F4F" />
      {flower && (
        <g>
          {[0, 1, 2, 3, 4].map((k) => {
            const a = (k / 5) * Math.PI * 2;
            return <circle key={k} cx={Math.cos(a) * 3} cy={Math.sin(a) * 3} r={2.6} fill="#E58FA3" />;
          })}
          <circle cx={0} cy={0} r={1.6} fill="#EADCB9" />
        </g>
      )}
    </svg>
  );
}

/* --- where things lie on the beach -------------------------------------- */

type BeachItem = {
  x: number;
  b: number;
  el: ReactNode;
  rot?: number;
  z?: number;
  /** also shown on phones, where the beach is much narrower */
  phone?: boolean;
};

/** Almost bare sand: just a couple of finds on the beach. */
const BEACH_ITEMS: BeachItem[] = [
  { x: 89, b: 72, el: <Starfish size={34} color="#B59C8F" />, rot: -18, phone: true },
  { x: 83, b: 56, el: <Scallop size={24} color="#E7E3D8" />, rot: -15, phone: true },
];

function Shells({ compact = false }: { compact?: boolean }) {
  const items = useMemo(
    () =>
      BEACH_ITEMS.filter((it) => !compact || it.phone)
        .map((it) => ({ ...it, bottom: it.b }))
        // things further down the screen are nearer the viewer, so draw them last
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || b.bottom - a.bottom),
    [compact]
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((it, i) => (
        <div
          key={i}
          className="absolute drop-shadow-[0_2px_2px_rgba(0,0,0,0.22)]"
          style={{ left: `${it.x}%`, bottom: `${it.bottom}%`, transform: `translate(-50%, 50%) rotate(${it.rot ?? 0}deg)` }}
        >
          {it.el}
        </div>
      ))}
    </div>
  );
}

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

function School({ avoidRef, count = FISH_STYLES.length }: { avoidRef: React.RefObject<HTMLElement | null>; count?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fishRefs = useRef<(SVGGElement | null)[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const svg = svgRef.current!;
    let w = svg.clientWidth;
    let h = svg.clientHeight;
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

    const fish: Fish[] = FISH_STYLES.slice(0, count).map((_, i) => ({
      x: 80 + ((i * 197) % Math.max(200, w * 0.55 - 80)),
      y: 60 + ((i * 131) % Math.max(160, h - 120)),
      a: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.5,
      turn: 0,
      phase: Math.random() * 10,
    }));

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 1;
      fish.forEach((f, i) => {
        f.turn += (Math.random() - 0.5) * 0.02;
        f.turn *= 0.95;
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
        f.a += diff * (fleeing ? 0.2 : 0.07);
        f.x += Math.cos(f.a) * speed;
        f.y += Math.sin(f.a) * speed;

        const el = fishRefs.current[i];
        if (el) {
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
  }, [avoidRef, count]);

  return (
    <svg ref={svgRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {FISH_STYLES.slice(0, count).map((s, i) => (
        <g
          key={i}
          ref={(el) => {
            fishRefs.current[i] = el;
          }}
          transform="translate(-100 -100)"
        >
          <FishShape opacity={s.opacity} />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The wave: a cone of foam with its tip under the boat. It peeks up    */
/* from below while you pull, then surges up and covers everything,     */
/* with the page colour behind it so the site is there once it passes.  */
/* ------------------------------------------------------------------ */

/** Height of the cone part of the wave, in the wave's own SVG units. */
const CONE_H = 560;

function ChasingWave({ y, tipX }: { y: MotionValue<number>; tipX: number }) {
  const { edge, spray } = useMemo(() => {
    const cx = tipX * VW;
    const halfSpan = VW * 0.62;
    // 0 at the tip, rising to the full depth towards the sides; a little ruffle away from the tip
    const cone = (x: number) => {
      const d = Math.abs(x - cx);
      const ruffle = Math.min(1, d / 90) * (Math.sin(x * 0.03) * 5 + Math.sin(x * 0.011 + 2) * 7);
      return 8 + (CONE_H - 40) * Math.min(1, Math.pow(d / halfSpan, 1.2)) + ruffle;
    };
    return { edge: horizontalPath(cone, 10), spray: horizontalPath((x) => cone(x) - 20, 10) };
  }, [tipX]);
  return (
    // tall enough that, wherever the surge ends (however far you pulled first), the screen stays covered to the bottom
    <motion.div className="pointer-events-none absolute inset-x-0 top-0 z-20" style={{ y, height: '300vh' }} aria-hidden>
      <svg className="absolute inset-x-0 top-0 w-full" style={{ height: '56vh' }} viewBox={`0 0 ${VW} ${CONE_H}`} preserveAspectRatio="none">
        <path d={spray} fill="none" stroke={C.foam} strokeOpacity={0.65} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 18" vectorEffect="non-scaling-stroke" />
        {/* the page colour under the cone, edged with a band of foam */}
        <path d={`${edge} L ${VW + 40},${CONE_H + 1} L -40,${CONE_H + 1} Z`} fill={C.paper} />
        <path d={edge} fill="none" stroke={C.foam} strokeWidth={26} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={edge} fill="none" stroke="white" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path
          d={edge}
          transform="translate(0 9)"
          fill="none"
          stroke="#2C6264"
          strokeOpacity={0.45}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="0.1 14 0.1 22"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0" style={{ top: 'calc(56vh - 1px)', background: C.paper }} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

/** Left inset shared by the name and the scroll hint. */
const PAD = 'clamp(1.5rem, 9vw, 10rem)';

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [sailing, setSailing] = useState(false);
  const sailingRef = useRef(false);
  const textRef = useRef<HTMLDivElement>(null);
  const boatRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const boatScale = isMobile ? 0.62 : 0.85;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /*
   * The wave's position: `peek` is how far its tip shows while you pull,
   * `surge` (0 -> 1) carries it up over the whole screen once it lets go.
   */
  const peek = useMotionValue(0);
  const surge = useMotionValue(0);
  const waveY = useTransform([peek, surge], ([p, s]: number[]) => window.innerHeight - p - s * window.innerHeight * 1.65);
  // the cone's tip sits under the boat
  const tipX = isMobile
    ? 0.76
    : typeof window === 'undefined'
      ? 0.8
      : ((window.innerWidth + Math.min(window.innerWidth, 1152)) / 2 - 48) / window.innerWidth;

  const setSail = useCallback(() => {
    if (sailingRef.current) return;
    sailingRef.current = true;
    setSailing(true);
    // the tip shows a little more, then the wave surges up and over everything
    animate(surge, [0, 0.07, 1], { duration: 1.35, times: [0, 0.28, 1], ease: ['easeOut', [0.55, 0, 0.75, 1]] });
    // once it has washed over everything, the site takes over (whole transition stays under ~1.8s)
    window.setTimeout(onUnlock, 1350);
  }, [onUnlock, surge]);

  /*
   * Elastic scroll: scrolling down lifts the name, hint and boat like a rubber
   * band (stiffer the further you go) while the wave's tip rises from below; the
   * sea and beach stay put, so nothing behind the gate ever shows. Let go early
   * and everything eases back; pull past the threshold and it lets go.
   */
  const pull = useMotionValue(0);
  const sceneY = useTransform(pull, (v) => -v);

  /*
   * The boat rides the wave: it stays where it is (even while you pull) until
   * the wave has risen completely underneath it, i.e. its front has passed the
   * bow. From then on the boat is carried up just behind the wave's leading
   * edge, over the land and off the page.
   */
  const boatRestTop = isMobile ? 0.84 : 0.79; // boat centre, as a fraction of the screen height
  const boatHalf = (BOAT_W * boatScale) / 2; // half the boat's length (it points up)
  const boatY = useTransform(waveY, (w: number) => {
    const front = w + 0.01 * window.innerHeight; // the cone's tip sits just below the wave's top edge
    const carried = front + boatHalf + 8 - boatRestTop * window.innerHeight; // bow just behind the front
    return Math.min(0, carried);
  });
  // a little roll while it's being carried
  const boatRoll = useTransform(surge, [0, 0.15, 0.5, 1], [0, -4, 3, 0]);

  useEffect(() => {
    // ignore leftover momentum from before the page appeared
    const armedAt = performance.now() + 700;
    const ready = () => performance.now() > armedAt;
    const MAX = isMobile ? 80 : 120; // furthest the scene will stretch, in px
    const THRESHOLD = isMobile ? 150 : 200; // how much scrolling it takes to let go
    let acc = 0;
    let releaseTimer = 0;
    let touchY: number | null = null;

    const stretch = (amount: number) => {
      if (sailingRef.current) return;
      acc = Math.max(0, amount);
      const stretched = MAX * (1 - Math.exp(-acc / (MAX * 1.4)));
      pull.set(stretched);
      peek.set(stretched * 1.4);
      if (acc >= THRESHOLD) {
        setSail();
        animate(pull, 0, { duration: 0.35, ease: 'easeOut' });
      }
    };
    const springBack = () => {
      if (sailingRef.current) return;
      acc = 0;
      animate(pull, 0, { duration: 0.35, ease: 'easeOut' });
      animate(peek, 0, { duration: 0.35, ease: 'easeOut' });
    };

    const onWheel = (e: WheelEvent) => {
      if (!ready() || sailingRef.current) return;
      stretch(acc + e.deltaY);
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(springBack, 180);
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (touchY !== null && y !== undefined && ready()) stretch((touchY - y) * 1.2);
    };
    const onTouchEnd = () => {
      touchY = null;
      springBack();
    };
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'End'].includes(e.key) && ready()) {
        e.preventDefault();
        setSail();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(releaseTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [setSail, isMobile, pull, peek]);

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
    <motion.div
      key="gate"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[60] overflow-hidden"
      style={{ color: C.ink }}
    >
      <Seascape />
      <Shells compact={isMobile} />
      <School avoidRef={textRef} count={isMobile ? 4 : 7} />

      {/* Name on two lines with the label beneath; left-aligned, a little above centre */}
      <motion.div
        className="absolute inset-0 flex items-start pt-[24vh] md:items-center md:pt-0 md:pb-[12vh]"
        style={{ paddingLeft: PAD, paddingRight: '1.5rem', y: sceneY }}
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

      {/* Scroll hint, under the name */}
      <motion.div
        className="pointer-events-none absolute bottom-[7%] flex items-center gap-3 text-xs md:text-sm font-semibold uppercase tracking-[0.25em]"
        style={{ left: PAD, color: C.inkSoft, y: sceneY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: sailing ? 0 : 1 }}
        transition={{ delay: sailing ? 0 : 1.6, duration: 0.4 }}
      >
        {isMobile ? 'Swipe up to set sail' : 'Scroll to set sail'}
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        >
          <path d="M 2,4 L 7,9 L 12,4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.div>

      {/* The boat: bottom right in open sea, directly below the spot in the nav bar it
          sails up to (same maths as the nav: max-w-6xl container, px-6, w-12 button). */}
      <motion.div
        className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
        style={{
          ...(isMobile ? { left: '76%', top: '84%' } : { left: 'calc((100vw + min(100vw, 72rem)) / 2 - 3rem)', top: '79%' }),
          y: boatY,
          rotate: boatRoll,
        }}
      >
        <motion.div
          ref={boatRef}
          animate={sailing ? { y: 0 } : { y: [0, -4, 0] }}
          transition={sailing ? { duration: 0.2 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: BOAT_W, height: BOAT_H }}
        >
          <motion.div
            style={{ scale: boatScale }}
            animate={{ rotate: sailing ? 90 : [88, 92, 88] }}
            transition={sailing ? { duration: 0.4 } : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BoatShape />
          </motion.div>
        </motion.div>
      </motion.div>

      <ChasingWave y={waveY} tipX={tipX} />
    </motion.div>
  );
}
