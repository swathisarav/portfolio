import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Sliding-block puzzle: drag the blue block out through the exit on the right.
 * Horizontal blocks slide left/right, vertical blocks slide up/down.
 * To change the puzzle, edit SIZE / EXIT_ROW / START_BLOCKS.
 */

type Block = {
  id: string;
  row: number;
  col: number;
  len: number;
  dir: 'h' | 'v';
  isKey?: boolean;
};

const SIZE = 5;
const EXIT_ROW = 2;

const START_BLOCKS: Block[] = [
  { id: 'key', row: 2, col: 0, len: 2, dir: 'h', isKey: true },
  { id: 'a', row: 1, col: 2, len: 2, dir: 'v' },
  { id: 'b', row: 1, col: 4, len: 2, dir: 'v' },
  { id: 'c', row: 0, col: 3, len: 2, dir: 'h' },
  { id: 'd', row: 3, col: 2, len: 3, dir: 'h' },
  { id: 'e', row: 3, col: 0, len: 2, dir: 'v' },
];

const BLOCK_STYLES: Record<string, string> = {
  a: 'bg-gray-900',
  b: 'bg-gray-700',
  c: 'bg-gray-300',
  d: 'bg-gray-800',
  e: 'bg-gray-400',
};

function cellsOf(b: Block): [number, number][] {
  return Array.from({ length: b.len }, (_, i) =>
    b.dir === 'h' ? [b.row, b.col + i] : [b.row + i, b.col]
  );
}

/** How far a block can move backward (negative) and forward (positive). */
function moveRange(blocks: Block[], b: Block): [number, number] {
  const occupied = new Set<string>();
  for (const other of blocks) {
    if (other.id === b.id) continue;
    for (const [r, c] of cellsOf(other)) occupied.add(`${r},${c}`);
  }
  const free = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < SIZE && c < SIZE && !occupied.has(`${r},${c}`);

  let back = 0;
  let fwd = 0;
  if (b.dir === 'h') {
    while (free(b.row, b.col - back - 1)) back++;
    while (free(b.row, b.col + b.len + fwd)) fwd++;
  } else {
    while (free(b.row - back - 1, b.col)) back++;
    while (free(b.row + b.len + fwd, b.col)) fwd++;
  }
  return [-back, fwd];
}

const pct = (cells: number) => `${(cells / SIZE) * 100}%`;

export function BlockPuzzle({ onSolved }: { onSolved: () => void }) {
  const [blocks, setBlocks] = useState<Block[]>(START_BLOCKS);
  const [moves, setMoves] = useState(0);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const [escaped, setEscaped] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    id: string;
    startX: number;
    startY: number;
    range: [number, number];
    cellPx: number;
  } | null>(null);

  const commit = (id: string, delta: number) => {
    if (delta === 0) return;
    const next = blocks.map((b) =>
      b.id !== id ? b : b.dir === 'h' ? { ...b, col: b.col + delta } : { ...b, row: b.row + delta }
    );
    setBlocks(next);
    setMoves((m) => m + 1);
    const key = next.find((b) => b.isKey)!;
    if (key.col + key.len === SIZE) {
      // Let the block slide out through the exit, then unlock.
      setTimeout(() => setEscaped(true), 150);
      setTimeout(onSolved, 900);
    }
  };

  const onPointerDown = (e: React.PointerEvent, b: Block) => {
    if (escaped) return;
    const board = boardRef.current;
    if (!board) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragInfo.current = {
      id: b.id,
      startX: e.clientX,
      startY: e.clientY,
      range: moveRange(blocks, b),
      cellPx: board.getBoundingClientRect().width / SIZE,
    };
    setDrag({ id: b.id, offset: 0 });
  };

  const onPointerMove = (e: React.PointerEvent, b: Block) => {
    const info = dragInfo.current;
    if (!info || info.id !== b.id) return;
    const px = b.dir === 'h' ? e.clientX - info.startX : e.clientY - info.startY;
    const offset = Math.max(info.range[0], Math.min(info.range[1], px / info.cellPx));
    setDrag({ id: b.id, offset });
  };

  const onPointerUp = (b: Block) => {
    const info = dragInfo.current;
    if (!info || info.id !== b.id) return;
    const delta = Math.round(drag?.offset ?? 0);
    dragInfo.current = null;
    setDrag(null);
    commit(b.id, delta);
  };

  const onKeyDown = (e: React.KeyboardEvent, b: Block) => {
    if (escaped) return;
    const dirs: Record<string, number> =
      b.dir === 'h' ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 };
    const step = dirs[e.key];
    if (!step) return;
    e.preventDefault();
    const [min, max] = moveRange(blocks, b);
    if (step >= min && step <= max) commit(b.id, step);
  };

  const reset = () => {
    setBlocks(START_BLOCKS);
    setMoves(0);
    setEscaped(false);
  };

  return (
    <div className="select-none">
      <div className="relative overflow-hidden pr-3" style={{ touchAction: 'none' }}>
        {/* Board */}
        <div
          ref={boardRef}
          className="relative aspect-square w-full rounded-xl bg-white/60 ring-1 ring-gray-900/10 shadow-inner"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(17,24,39,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,24,39,0.06) 1px, transparent 1px)',
            backgroundSize: `${100 / SIZE}% ${100 / SIZE}%`,
          }}
        >
          {/* Exit slot */}
          <div
            className="absolute -right-3 w-3 rounded-r-md bg-blue-600/20 flex items-center"
            style={{ top: pct(EXIT_ROW), height: pct(1) }}
          >
            <div className="h-1/2 w-1 bg-blue-600 rounded-full animate-pulse ml-1" />
          </div>

          {blocks.map((b) => {
            const isDragging = drag?.id === b.id;
            const offset = isDragging ? drag!.offset : 0;
            const escapeShift = b.isKey && escaped ? SIZE : 0;
            const col = b.col + (b.dir === 'h' ? offset + escapeShift : 0);
            const row = b.row + (b.dir === 'v' ? offset : 0);
            return (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                aria-label={
                  b.isKey
                    ? 'Blue key block. Use left and right arrows to slide it.'
                    : `Block, slides ${b.dir === 'h' ? 'left and right' : 'up and down'}`
                }
                onPointerDown={(e) => onPointerDown(e, b)}
                onPointerMove={(e) => onPointerMove(e, b)}
                onPointerUp={() => onPointerUp(b)}
                onPointerCancel={() => onPointerUp(b)}
                onKeyDown={(e) => onKeyDown(e, b)}
                className={`absolute p-1 outline-none focus-visible:z-10 ${
                  b.dir === 'h' ? 'cursor-ew-resize' : 'cursor-ns-resize'
                }`}
                style={{
                  left: pct(col),
                  top: pct(row),
                  width: pct(b.dir === 'h' ? b.len : 1),
                  height: pct(b.dir === 'v' ? b.len : 1),
                  transition: isDragging
                    ? 'none'
                    : escaped && b.isKey
                    ? 'left 700ms cubic-bezier(.5,0,.75,0), opacity 700ms'
                    : 'left 160ms ease-out, top 160ms ease-out',
                  opacity: b.isKey && escaped ? 0 : 1,
                }}
              >
                <div
                  className={`h-full w-full rounded-lg shadow-md transition-transform ${
                    isDragging ? 'scale-[1.03] shadow-lg' : ''
                  } ${
                    b.isKey
                      ? 'bg-blue-600 ring-2 ring-blue-300/60'
                      : BLOCK_STYLES[b.id] ?? 'bg-gray-500'
                  } [:focus-visible>&]:ring-4 [:focus-visible>&]:ring-blue-400`}
                >
                  {b.isKey && (
                    <div className="flex h-full items-center justify-end pr-3 text-white/90 text-lg">
                      →
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Moves: {moves}</span>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}
