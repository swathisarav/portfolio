import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useIsMobile } from './ui/use-mobile';

/**
 * Landing gate, seen from above: deep water fading to teal, ribbons of
 * white foam, and a golden beach along the bottom with shells. Clicking
 * the boat sends it out to sea, chased by a wave that rolls up the
 * screen; behind the foam is the main page's background, so the site
 * simply appears.
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
const SHORE_Y = 0.8 * VH;

function shoreY(x: number, off = 0) {
  const t = x / VW;
  return SHORE_Y + off + Math.sin(t * Math.PI * 2.2 + 0.6) * 26 + Math.sin(t * Math.PI * 5.3 + 2.1) * 9;
}

function horizontalPath(f: (x: number) => number, step = 12) {
  let d = '';
  for (let x = -40; x <= VW + 40; x += step) d += `${d ? ' L' : 'M'} ${x},${f(x).toFixed(1)}`;
  return d;
}

const BOAT_X = 0.82;
const BOAT_Y = 0.4;
const WATER_FRACTION = (SHORE_Y - 40) / VH;

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

type RibbonSpec = { y: number; amp: number; seed: number; strands: number; dur: number; opacity: number };

const RIBBONS: RibbonSpec[] = [
  { y: 0.72, amp: 22, seed: 17, strands: 3, dur: 9, opacity: 0.75 },
];

function Ribbon({ spec }: { spec: RibbonSpec }) {
  const { strands, ribbon, bubbles } = useMemo(() => {
    const rand = seeded(spec.seed);
    const f1 = 0.004 + rand() * 0.002;
    const f2 = 0.011 + rand() * 0.004;
    const base = spec.y * VH;
    const strandFns = Array.from({ length: spec.strands }, (_, k) => {
      const p1 = rand() * 6;
      const p2 = rand() * 6;
      const drift = (k - spec.strands / 2) * 7;
      const a = spec.amp * (0.7 + rand() * 0.5);
      return (x: number) => base + drift + Math.sin(x * f1 + p1 * 0.35) * a + Math.sin(x * f2 + p2) * a * 0.35;
    });
    const thick = (x: number) => 2 + 6 * (0.5 + 0.5 * Math.sin(x * 0.009 + spec.seed));
    const top = strandFns[0];
    let ribbonD = horizontalPath(top);
    for (let x = VW + 40; x >= -40; x -= 12) ribbonD += ` L ${x},${(top(x) + thick(x)).toFixed(1)}`;
    ribbonD += ' Z';
    const bubbleList = Array.from({ length: 7 }, () => {
      const x = rand() * VW;
      const f = strandFns[Math.floor(rand() * strandFns.length)];
      return { x, y: f(x) + (rand() - 0.5) * 30, r: 2 + rand() * 4 };
    });
    return { strands: strandFns.map((f) => horizontalPath(f)), ribbon: ribbonD, bubbles: bubbleList };
  }, [spec]);

  return (
    <motion.g
      animate={{ y: [0, 10, 0], x: [0, -24, 0] }}
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
  const sand = `${horizontalPath((x) => shoreY(x))} L ${VW + 40},${VH + 40} L -40,${VH + 40} Z`;
  // little rings of lace in the shore foam
  const lace = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: 8 }, () => {
      const x = rand() * VW;
      return { x, y: shoreY(x, -14 - rand() * 22), rx: 5 + rand() * 12, ry: 3 + rand() * 6 };
    });
  }, []);
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#04090A" />
          <stop offset="0.35" stopColor="#0B1C1F" />
          <stop offset="0.62" stopColor="#123537" />
          <stop offset="0.78" stopColor="#1D5254" />
        </linearGradient>
        <linearGradient id="beach" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.72" stopColor={C.sand} />
          <stop offset="1" stopColor={C.sandLight} />
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={VW + 80} height={VH + 80} fill="url(#sea)" />

      {RIBBONS.map((r, i) => (
        <Ribbon key={i} spec={r} />
      ))}

      <path d={sand} fill="url(#beach)" />
      {/* wet sand just below the waterline */}
      <path d={horizontalPath((x) => shoreY(x, 12))} fill="none" stroke={C.sandWet} strokeOpacity={0.5} strokeWidth={22} vectorEffect="non-scaling-stroke" />

      {/* the foam line washing up and back */}
      <motion.g animate={{ y: [0, 10, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
        <path d={horizontalPath((x) => shoreY(x, -4))} fill="none" stroke={C.foam} strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path
          d={horizontalPath((x) => shoreY(x, -5))}
          fill="none"
          stroke="#2C6264"
          strokeOpacity={0.7}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="0.1 13 0.1 21"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={horizontalPath((x) => shoreY(x, -30) + Math.sin(x * 0.03) * 5)}
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

/** Height of the waterline above the bottom of the screen at x (both in %). */
function shoreBottom(xPct: number) {
  return 100 - (shoreY((xPct / 100) * VW) / VH) * 100;
}

type BeachItem = {
  x: number;
  b: number | ((x: number) => number);
  el: ReactNode;
  rot?: number;
  z?: number;
  /** also shown on phones, where the beach is much narrower */
  phone?: boolean;
};

/** Along the wrack line: just above the foam, where the tide leaves things. */
const tide = (off: number) => (x: number) => shoreBottom(x) - off;

/** Almost bare sand: just a couple of finds in the right corner. */
const BEACH_ITEMS: BeachItem[] = [
  { x: 86, b: 6.5, el: <Starfish size={34} color="#B59C8F" />, rot: -18, phone: true },
  { x: 90.5, b: 3.2, el: <Scallop size={24} color="#E7E3D8" />, rot: -15, phone: true },
];

function Shells({ compact = false }: { compact?: boolean }) {
  const items = useMemo(
    () =>
      BEACH_ITEMS.filter((it) => !compact || it.phone)
        .map((it) => ({ ...it, bottom: typeof it.b === 'function' ? it.b(it.x) : it.b }))
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
      x: 80 + ((i * 197) % Math.max(200, w - 160)),
      y: 60 + ((i * 131) % Math.max(160, h * WATER_FRACTION - 120)),
      a: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.5,
      turn: 0,
      phase: Math.random() * 10,
    }));

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 1;
      const waterBottom = h * WATER_FRACTION - 30;
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
        else if (f.x > w - margin) target = Math.PI;
        if (f.y < margin) target = Math.PI / 2;
        else if (f.y > waterBottom) target = -Math.PI / 2;

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
/* Yacht, seen from above, bow on the left.                             */
/* ------------------------------------------------------------------ */

const WOOD = '#B5A48A';
const WOOD_LINE = '#9C8C73';
const GLASS = '#111517';

function BoatShape() {
  return (
    <svg width="220" height="80" viewBox="0 0 220 80" aria-hidden className="relative">
      {/* shadow on the water */}
      <path
        d="M 10,48 C 30,24 66,16 116,15 L 204,16 Q 218,17 218,30 L 218,66 Q 218,79 204,80 L 116,81 C 66,80 30,72 10,48 Z"
        fill="#000"
        opacity={0.28}
      />
      {/* white hull */}
      <path
        d="M 4,40 C 24,16 60,8 110,7 L 200,8 Q 214,9 214,22 L 214,58 Q 214,71 200,72 L 110,73 C 60,72 24,64 4,40 Z"
        fill="#FBFBF8"
        stroke="#C9CFCF"
        strokeWidth={1.2}
      />
      {/* wooden deck */}
      <path
        d="M 16,40 C 34,21 64,14 110,13 L 196,14 Q 206,15 206,25 L 206,55 Q 206,65 196,66 L 110,67 C 64,66 34,59 16,40 Z"
        fill={WOOD}
      />
      {[28, 34, 46, 52].map((y) => (
        <line key={y} x1={44} y1={y} x2={204} y2={y} stroke={WOOD_LINE} strokeWidth={0.7} opacity={0.7} />
      ))}
      {/* bow fittings */}
      <path d="M 24,40 L 46,40" stroke="#76684F" strokeWidth={2} strokeLinecap="round" />
      <rect x={48} y={36} width={6} height={8} rx={1.5} fill={GLASS} />
      {/* stern swim platform */}
      <rect x={206} y={22} width={9} height={36} rx={2} fill="#A39279" />
      {/* main cabin */}
      <path
        d="M 62,40 C 72,26 92,21 122,21 L 186,21 Q 196,21 196,31 L 196,49 Q 196,59 186,59 L 122,59 C 92,59 72,54 62,40 Z"
        fill="#FFFFFF"
        stroke="#D5DBDB"
        strokeWidth={1}
      />
      {/* windscreen + window bands */}
      <path d="M 72,40 C 79,30 89,27 102,26.5 L 102,53.5 C 89,53 79,50 72,40 Z" fill={GLASS} />
      <rect x={116} y={23} width={10} height={34} rx={1.5} fill={GLASS} />
      <rect x={168} y={23} width={8} height={34} rx={1.5} fill={GLASS} />
      {/* flybridge on top */}
      <rect x={130} y={28} width={32} height={24} rx={5} fill="#F2F3F1" stroke="#D5DBDB" strokeWidth={1} />
      <rect x={136} y={33} width={7} height={14} rx={2} fill={GLASS} />
      <circle cx={153} cy={40} r={3} fill="#D5DBDB" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The chasing wave: sweeps in from the right along the coast, with the */
/* page colour behind its foamy front.                                  */
/* ------------------------------------------------------------------ */

function verticalPath(f: (y: number) => number, step = 20) {
  let d = '';
  for (let y = -20; y <= VH + 20; y += step) d += `${d ? ' L' : 'M'} ${f(y).toFixed(1)},${y}`;
  return d;
}

function ChasingWave() {
  const { edge, spray } = useMemo(() => {
    const rand = seeded(21);
    const f = (y: number) => 40 + Math.sin(y * 0.01 + 1) * 22 + Math.sin(y * 0.035) * 8 + (rand() - 0.5) * 6;
    const g = (y: number) => 12 + Math.sin(y * 0.013 + 3) * 14;
    return { edge: verticalPath(f), spray: verticalPath(g) };
  }, []);
  return (
    <motion.div
      className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[140vw]"
      initial={{ x: '100vw' }}
      animate={{ x: '-20vw' }}
      transition={{ duration: 2.0, ease: [0.55, 0, 0.75, 1] }}
      aria-hidden
    >
      <svg className="absolute inset-y-0 left-0 h-full w-[120px]" viewBox={`0 0 120 ${VH}`} preserveAspectRatio="none">
        <path d={spray} fill="none" stroke={C.foam} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 20" vectorEffect="non-scaling-stroke" />
        {/* a band of foam, then the page colour */}
        <path d={`${edge} L 121,${VH + 20} L 121,-20 Z`} fill={C.foam} />
        <path d={edge} fill="none" stroke="white" strokeWidth={8} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={edge} transform="translate(14 0)" fill="none" stroke="#2C6264" strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" strokeDasharray="0.1 14 0.1 22" vectorEffect="non-scaling-stroke" />
        <path d={`M 96,-20 L 121,-20 L 121,${VH + 20} L 96,${VH + 20} Z`} fill={C.paper} />
      </svg>
      <div className="absolute inset-y-0 left-[119px] right-0" style={{ background: C.paper }} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [sailing, setSailing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
    setTimeout(onUnlock, 2050);
  };

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
    <motion.div key="gate" exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[60] overflow-hidden" style={{ color: C.ink }}>
      <Seascape />
      <Shells compact={isMobile} />
      <School avoidRef={textRef} count={isMobile ? 4 : 7} />

      {/* Name on two lines, with the label beneath spanning its width */}
      {/* centred in the open water above the shore (on phones, a little higher, leaving room for the boat) */}
      <div className="absolute inset-x-0 top-0 bottom-[40%] md:bottom-[30%] flex items-center px-6">
        <div className="mx-auto w-full max-w-6xl">
        <div ref={textRef} className="w-fit max-w-full">
          <h1
            className="font-display text-5xl sm:text-6xl md:text-8xl font-bold uppercase leading-[0.95] tracking-tight"
            aria-label={`${NAME_FIRST} ${NAME_LAST}`}
          >
            <span className="block whitespace-nowrap">{letters(NAME_FIRST, 0)}</span>
            <span className="block whitespace-nowrap">{letters(NAME_LAST, NAME_FIRST.length, C.seaBright)}</span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex w-full items-center gap-4 text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.seaBright }}
          >
            <span className="h-px flex-1" style={{ background: C.seaBright }} />
            Portfolio website
            <span className="h-px flex-1" style={{ background: C.seaBright }} />
          </motion.p>
        </div>
        </div>
      </div>

      {/* Boat out in the water on the right, bow pointing along the coast */}
      <div
        className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
        style={isMobile ? { left: '50%', top: '63%', scale: 0.8 } : { left: `${BOAT_X * 100}%`, top: `${BOAT_Y * 100}%` }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: sailing ? 0 : 1 }}
          transition={{ delay: sailing ? 0 : 2 }}
          className="pointer-events-none absolute bottom-full left-1/2 mb-12 -translate-x-1/2 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.2em]"
          style={{ color: C.ink, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
        >
          Click the boat to set sail
        </motion.p>
        <motion.button
          onClick={setSail}
          aria-label="Set sail and enter the site"
          className="relative block h-[80px] w-[220px] cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#3FA9AA]"
          animate={sailing ? { x: '-110vw', rotate: [0, -3, 2, -2, 0] } : { rotate: [-2, 2, -2], x: [0, -3, 0] }}
          transition={sailing ? { duration: 2.0, ease: [0.4, 0.05, 0.6, 1] } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={sailing ? undefined : { scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* boat (bow on the left) */}
          <div className="absolute inset-0">
            <BoatShape />
          </div>
        </motion.button>
      </div>

      {sailing && <ChasingWave />}
    </motion.div>
  );
}
