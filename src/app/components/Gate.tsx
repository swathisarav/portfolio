import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock } from 'lucide-react';
import { BlockPuzzle } from './BlockPuzzle';

const NAME = 'Swathi Saravanan';

/** Folded-paper shapes that drift around the background (a nod to the origami work). */
const SHAPES = [
  { x: '8%', y: '14%', size: 70, color: '#2563eb', rot: 20, dur: 14 },
  { x: '82%', y: '10%', size: 46, color: '#111827', rot: -15, dur: 11 },
  { x: '72%', y: '78%', size: 90, color: '#93c5fd', rot: 40, dur: 17 },
  { x: '14%', y: '80%', size: 54, color: '#d1d5db', rot: -30, dur: 13 },
  { x: '46%', y: '6%', size: 34, color: '#60a5fa', rot: 10, dur: 9 },
  { x: '92%', y: '46%', size: 40, color: '#9ca3af', rot: 60, dur: 12 },
];

function FoldedShape({ size, color }: { size: number; color: string }) {
  // Two triangles sharing a crease, the second slightly darker, reads as a fold.
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,5 95,90 50,70" fill={color} opacity={0.85} />
      <polygon points="50,5 5,90 50,70" fill={color} opacity={0.55} />
    </svg>
  );
}

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [solved, setSolved] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleSolved = () => {
    setSolved(true);
    setTimeout(onUnlock, 700);
  };

  return (
    <motion.div
      key="gate"
      initial={{ y: 0 }}
      exit={{ y: '-100%', borderBottomLeftRadius: '50% 15%', borderBottomRightRadius: '50% 15%' }}
      transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1] }}
      onMouseMove={(e) =>
        setMouse({
          x: e.clientX / window.innerWidth - 0.5,
          y: e.clientY / window.innerHeight - 0.5,
        })
      }
      className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100 text-gray-900 shadow-2xl"
    >
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-blue-300/40 blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-indigo-300/40 blur-3xl"
          animate={{ x: [0, -70, 0], y: [0, -50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        {SHAPES.map((s, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: s.x,
              top: s.y,
              translateX: mouse.x * (i % 2 ? 30 : -30),
              translateY: mouse.y * (i % 2 ? 30 : -30),
            }}
          >
            <motion.div
              animate={{ y: [0, -18, 0], rotate: [s.rot, s.rot + 25, s.rot] }}
              transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FoldedShape size={s.size} color={s.color} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative min-h-full flex items-center px-6 py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1.2fr_1fr]">
          {/* About */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 text-sm uppercase tracking-wider text-blue-600"
            >
              Hello, I'm
            </motion.p>
            <h1 className="mb-6 text-5xl md:text-7xl tracking-tight" aria-label={NAME}>
              {NAME.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="inline-block"
                  initial={{ opacity: 0, y: 30, rotate: -8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.04, type: 'spring', stiffness: 300, damping: 18 }}
                  whileHover={{ y: -10, color: '#2563eb', transition: { duration: 0.15 } }}
                >
                  {ch === ' ' ? ' ' : ch}
                </motion.span>
              ))}
            </h1>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="max-w-xl space-y-4 text-lg md:text-xl text-gray-700 leading-relaxed"
            >
              <p>
                Graduate Mechanical Engineering student at the University of Pennsylvania, exploring
                the intersection of product design, engineering, and entrepreneurship.
              </p>
              <p className="text-gray-600">
                I started out building things: 3D models, simulations, and systems rooted in first
                principles. These days I'm curious about what happens when those ideas meet users,
                markets, costs, and constraints.
              </p>
            </motion.div>
            <div className="mt-10 flex gap-2">
              <motion.div className="h-1 bg-gray-900" initial={{ width: 0 }} animate={{ width: 80 }} transition={{ duration: 0.8, delay: 1.1 }} />
              <motion.div className="h-1 bg-blue-600" initial={{ width: 0 }} animate={{ width: 40 }} transition={{ duration: 0.8, delay: 1.3 }} />
              <motion.div className="h-1 bg-gray-300" initial={{ width: 0 }} animate={{ width: 20 }} transition={{ duration: 0.8, delay: 1.5 }} />
            </div>
          </div>

          {/* Puzzle card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 120, damping: 16 }}
            className="mx-auto w-full max-w-sm rounded-2xl bg-white/70 p-6 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md"
          >
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                animate={solved ? { rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] } : { rotate: [0, -6, 6, 0] }}
                transition={solved ? { duration: 0.5 } : { duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  solved ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'
                }`}
              >
                {solved ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </motion.div>
              <div>
                <h2 className="text-base">{solved ? 'Unlocked!' : 'Solve the puzzle to unlock'}</h2>
                <p className="text-sm text-gray-500">
                  {solved ? 'Come on in.' : 'Slide the blocks so the blue one escapes →'}
                </p>
              </div>
            </div>

            <BlockPuzzle onSolved={handleSolved} />

            <button
              onClick={onUnlock}
              className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              In a hurry? Skip the puzzle
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
