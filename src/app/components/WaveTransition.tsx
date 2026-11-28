import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { animate, useMotionValue, type MotionValue } from 'motion/react';

/**
 * The wave that carries you between the beach (the gate) and the site, in the
 * spirit of a "pull to reveal":
 *
 *  - Pull and a rounded swell of water comes in from the edge of the screen,
 *    showing the other side inside it. It resists the further you pull, like a
 *    rubber band.
 *  - Let go early and it sinks back. Pull far enough and it breaks: the wave
 *    surges across and engulfs the screen, and the other side takes over.
 *
 * It works both ways. On the beach, scroll down / swipe up and the water rises
 * from the bottom to reveal the site. At the top of the site, scroll up / swipe
 * down and the dark sea pours down from the top to take you back to the beach.
 *
 * Mechanics: the gate is always the layer on top, so a single clip-path on it
 * does the reveal (it keeps the swell's side of the crest while coming back, the
 * far side while leaving), and a foam line is drawn along the crest.
 */

export type WaveMode = 'exit' | 'enter'; // exit: beach -> site, enter: site -> beach

const STORAGE_KEY = 'portfolio-unlocked';
const FOAM = '#E9EDE8';

type Wave = { rise: MotionValue<number>; hump: MotionValue<number> };

/* ------------------------------------------------------------------ */
/* State + gestures                                                     */
/* ------------------------------------------------------------------ */

export function useWaveGate(isMobile: boolean) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  /** the gate is mounted over the site while you pull back towards the beach */
  const [entering, setEntering] = useState(false);
  const mode: WaveMode = unlocked ? 'enter' : 'exit';

  const gateRef = useRef<HTMLDivElement>(null);
  /** rubber-band distance of the current pull, in px; negative when the wave comes from the top (the gate's name moves with it) */
  const pull = useMotionValue(0);
  /** how far the water line has come in from its edge of the screen (bottom leaving, top coming back), in px */
  const rise = useMotionValue(0);
  /** how far the middle of the swell bulges out past the water line, in px */
  const hump = useMotionValue(0);
  /** the wave has broken and is running to completion */
  const surging = useRef(false);
  const wave = useMemo<Wave>(() => ({ rise, hump }), [rise, hump]);

  // Once the page underneath has swapped, the wave is spent: reset it before paint.
  useLayoutEffect(() => {
    pull.jump(0);
    rise.jump(0);
    hump.jump(0);
    surging.current = false;
  }, [unlocked, pull, rise, hump]);

  // No page scrolling behind the beach.
  useEffect(() => {
    if (unlocked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [unlocked]);

  const surge = useCallback(
    (m: WaveMode) => {
      if (surging.current) return;
      surging.current = true;
      if (m === 'enter') setEntering(true);
      // the site always starts from the top when you arrive
      if (m === 'exit') window.scrollTo({ top: 0 });
      const H = window.innerHeight;
      animate(pull, 0, { duration: 0.4, ease: 'easeOut' });
      animate(hump, Math.max(hump.get(), H * 0.22), { duration: 0.45, ease: 'easeOut' });
      animate(rise, H + 60, {
        duration: 0.9,
        ease: [0.45, 0, 0.2, 1],
        onComplete: () => {
          if (m === 'exit') {
            sessionStorage.setItem(STORAGE_KEY, '1');
            setUnlocked(true);
          } else {
            sessionStorage.removeItem(STORAGE_KEY);
            window.scrollTo({ top: 0 }); // hidden behind the beach now
            setUnlocked(false);
            setEntering(false);
          }
        },
      });
    },
    [pull, rise, hump]
  );

  useEffect(() => {
    const MAX = isMobile ? 110 : 150; // furthest the swell stretches, px
    // how much pulling it takes to break; going back asks for a bit more, so it never happens by accident
    const THRESHOLD = mode === 'exit' ? (isMobile ? 150 : 200) : isMobile ? 190 : 280;
    // ignore leftover scroll momentum from before the beach appeared
    const armedAt = performance.now() + (mode === 'exit' ? 700 : 0);
    const ready = () => !surging.current && performance.now() > armedAt;
    // leaving, you pull towards the site (down the page); coming back, you pull up past the top
    const pullSign = mode === 'exit' ? 1 : -1;
    const atTop = () => window.scrollY <= 0;

    let acc = 0;
    let releaseTimer = 0;
    // going back: only a fresh scroll at the top counts, not the momentum that brought you there
    let wheelFresh = false;
    let lastWheel = 0;
    let touchY: number | null = null;

    const stretch = (amount: number) => {
      acc = Math.max(0, amount);
      const s = MAX * (1 - Math.exp(-acc / (MAX * 1.4)));
      if (mode === 'enter' && s > 0) setEntering(true);
      [pull, rise, hump].forEach((v) => v.stop());
      pull.set(s * pullSign);
      hump.set(s * 1.5);
      rise.set(s * 0.3);
    };
    const release = () => {
      if (surging.current) return;
      // like a pull-to-reveal: it breaks when you let go past the threshold, otherwise it sinks back
      if (acc >= THRESHOLD) return surge(mode);
      acc = 0;
      const ease = { duration: 0.4, ease: 'easeOut' } as const;
      animate(pull, 0, ease);
      animate(hump, 0, ease);
      animate(rise, 0, { ...ease, onComplete: () => mode === 'enter' && !surging.current && setEntering(false) });
    };

    const onWheel = (e: WheelEvent) => {
      if (!ready()) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      window.clearTimeout(releaseTimer);
      if (mode === 'enter') {
        const now = performance.now();
        const gap = now - lastWheel;
        lastWheel = now;
        if (dy > 0 || !atTop()) {
          // scrolling down into the page (or anywhere below the top) lets go
          wheelFresh = false;
          if (acc > 0) {
            acc = 0;
            release();
          }
          return;
        }
        if (!wheelFresh) {
          if (gap < 250) return;
          wheelFresh = true;
        }
      }
      stretch(acc + dy * pullSign);
      // a wheel has no "let go", so it breaks as soon as it passes the threshold
      if (acc >= THRESHOLD) surge(mode);
      else releaseTimer = window.setTimeout(release, 180);
    };
    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      touchY = ready() && y !== undefined && (mode === 'exit' || atTop()) ? y : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      // swiping up on the beach, swiping down at the top of the site
      if (touchY !== null && y !== undefined && ready()) stretch((touchY - y) * 1.2 * pullSign);
    };
    const onTouchEnd = () => {
      if (touchY === null) return;
      touchY = null;
      release();
    };
    const onKey = (e: KeyboardEvent) => {
      if (mode === 'exit' && ready() && ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'End'].includes(e.key)) {
        e.preventDefault();
        surge('exit');
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
  }, [mode, isMobile, surge, pull, rise, hump]);

  /** Back to the beach without pulling (the nav button). */
  const relock = useCallback(() => {
    if (unlocked) surge('enter');
  }, [unlocked, surge]);

  return {
    unlocked,
    mode,
    /** the gate is on screen, fully or partly */
    gateShown: !unlocked || entering,
    /** the gate has just been mounted over the site and must start hidden */
    gateStartsHidden: unlocked && entering,
    gateRef,
    pull,
    wave,
    surging,
    relock,
  };
}

/* ------------------------------------------------------------------ */
/* The crest: clips the gate and draws the foam along the edge          */
/* ------------------------------------------------------------------ */

const HIDDEN = 'inset(100% 0 0 0)';

export function WaveCrest({
  wave,
  mode,
  gateRef,
  surging,
}: {
  wave: Wave;
  mode: WaveMode;
  gateRef: RefObject<HTMLDivElement | null>;
  surging: RefObject<boolean>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current!;
    const label = labelRef.current!;
    // The loop only runs while the wave is moving: any change to it starts the
    // loop, and the loop stops itself once the wave is back at rest.
    let raf = 0;
    let lastClip: string | null = null;
    let lastGate: HTMLDivElement | null = null;
    let idle = false;
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const setClip = (gate: HTMLDivElement | null, clip: string) => {
      if (!gate || (gate === lastGate && clip === lastClip)) return;
      gate.style.clipPath = clip;
      lastGate = gate;
      lastClip = clip;
    };

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const r = wave.rise.get();
      const h = wave.hump.get();
      const gate = gateRef.current;
      const leaving = mode === 'exit';

      if (r < 0.5 && h < 0.5) {
        // at rest: the gate is either fully there (on the beach) or fully hidden (on the site)
        setClip(gate, leaving ? '' : HIDDEN);
        if (!idle) {
          svg.style.visibility = 'hidden';
          label.style.opacity = '0';
          idle = true;
        }
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (idle) {
        svg.style.visibility = '';
        idle = false;
      }

      const W = window.innerWidth;
      const H = window.innerHeight;
      const t = now / 1000;
      const amp = Math.min(1, (r + h) / 80) * (W < 768 ? 7 : 11); // ripples grow as the wave builds
      const cx = W / 2;
      const spread = W * (W < 768 ? 0.42 : 0.3);
      const step = Math.max(12, W / 90);
      const fromTop = !leaving; // the site is left from the top
      // distance in from the wave's edge -> screen y
      const toScreen = (d: number) => (fromTop ? d : H - d);

      let crest = '';
      let crestReversed = '';
      for (let x = -20; x <= W + 20 + step; x += step) {
        const bell = Math.exp(-(((x - cx) / spread) ** 2));
        const ripple = Math.sin(x * 0.012 + t * 2.2) * 0.6 + Math.sin(x * 0.027 - t * 3.1) * 0.4;
        const pt = `${x.toFixed(1)},${toScreen(r + h * bell + amp * ripple).toFixed(1)}`;
        crest += `${crest ? ' L' : 'M'} ${pt}`;
        crestReversed = ` L ${pt}${crestReversed}`;
      }

      // The swell is the side of the crest towards the wave's edge. Coming back,
      // the gate is the swell; leaving, the gate is what the swell hasn't reached.
      const belowCrest = `path('M -20,${H + 20} L${crest.slice(1)} L ${W + 20},${H + 20} Z')`;
      const aboveCrest = `path('M -20,-20 L ${W + 20},-20${crestReversed} Z')`;
      const gateIsSwell = !leaving;
      setClip(gate, gateIsSwell === !fromTop ? belowCrest : aboveCrest);
      for (const p of pathRefs.current) p?.setAttribute('d', crest);

      // a small caption riding in the swell, just inside its peak
      const fade = Math.min(1, Math.max(0, (h - 50) / 60));
      label.style.opacity = surging.current ? '0' : String(fade);
      label.style.transform = `translate3d(${cx}px, ${toScreen(r + h - 34)}px, 0) translate(-50%, ${fromTop ? '-100%' : '0'})`;
    }

    kick();
    const offRise = wave.rise.on('change', kick);
    const offHump = wave.hump.on('change', kick);
    return () => {
      offRise();
      offHump();
      cancelAnimationFrame(raf);
    };
    // re-run on a change of side (beach <-> site): the first pass settles the gate's clip
  }, [wave, gateRef, surging, mode]);

  const leaving = mode === 'exit';
  // offsets point away from the swell, so they flip when the wave comes from the top
  const flip = leaving ? 1 : -1;
  const strokes: { stroke: string; width: number; opacity?: number; dash?: string; dy?: number }[] = [
    { stroke: FOAM, width: 4, opacity: 0.6, dash: '2 18', dy: -18 }, // spray thrown ahead of the crest
    { stroke: '#2C6264', width: 4, opacity: 0.45, dash: '0.1 14 0.1 22', dy: 12 }, // bubbles in the swell
    { stroke: FOAM, width: 22 }, // the foam
    { stroke: '#FFFFFF', width: 7 }, // its bright top
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden>
      <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible" style={{ visibility: 'hidden' }}>
        {strokes.map((s, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            fill="none"
            stroke={s.stroke}
            strokeWidth={s.width}
            strokeOpacity={s.opacity}
            strokeDasharray={s.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={s.dy ? `translate(0 ${s.dy * flip})` : undefined}
          />
        ))}
      </svg>
      <div
        ref={labelRef}
        className="absolute left-0 top-0 whitespace-nowrap text-xs md:text-sm font-semibold uppercase tracking-[0.25em] transition-opacity duration-200"
        style={{ opacity: 0, color: leaving ? '#1F7F82' : '#D9DCD6' }}
      >
        {leaving ? 'Dive in' : 'Back to the beach'}
      </div>
    </div>
  );
}
