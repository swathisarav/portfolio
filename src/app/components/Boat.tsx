/**
 * The yacht, seen from above with its bow on the left. Shared by the
 * landing gate (large, turned to point up) and the nav bar (tiny, where
 * it is the button that takes you back to the beach).
 */

const WOOD = '#B5A48A';
const WOOD_LINE = '#9C8C73';
const GLASS = '#111517';

/** Natural size of the drawing. */
export const BOAT_W = 220;
export const BOAT_H = 80;

export function BoatShape({
  width = BOAT_W,
  shadow = true,
  outline,
}: {
  width?: number;
  shadow?: boolean;
  /** darker hull outline, for when the boat is drawn tiny on a light background */
  outline?: string;
}) {
  return (
    <svg width={width} height={(width * BOAT_H) / BOAT_W} viewBox={`0 0 ${BOAT_W} ${BOAT_H}`} aria-hidden className="relative block overflow-visible">
      {shadow && (
        <path
          d="M 10,48 C 30,24 66,16 116,15 L 204,16 Q 218,17 218,30 L 218,66 Q 218,79 204,80 L 116,81 C 66,80 30,72 10,48 Z"
          fill="#000"
          opacity={0.28}
        />
      )}
      {/* white hull */}
      <path
        d="M 4,40 C 24,16 60,8 110,7 L 200,8 Q 214,9 214,22 L 214,58 Q 214,71 200,72 L 110,73 C 60,72 24,64 4,40 Z"
        fill="#FBFBF8"
        stroke={outline ?? '#B9C0C0'}
        strokeWidth={outline ? 7 : 1.4}
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
