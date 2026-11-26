import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Float, PresentationControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DioramaId } from './items';

const C = {
  navy: '#083A4F',
  gold: '#A58D66',
  aqua: '#C0D5D6',
  teal: '#407E8C',
  sand: '#E5E1DD',
  cream: '#F4F2EF',
  rock: '#8E9EA1',
  rockDark: '#6F8387',
  pine: '#2F6B5E',
  pineDark: '#1F5449',
  pineLight: '#4F8A72',
  bark: '#6E5B42',
};

const DEFAULT_CAM = new THREE.Vector3(0, 2.85, 12);
const DEFAULT_LOOK = new THREE.Vector3(0, 0.05, 0);
/** When focused, the camera sits here relative to the object... */
const FOCUS_OFFSET = new THREE.Vector3(1.6, 1.3, 4.6);
/** ...and looks a bit to the right of it, so the object sits left of the popup. */
const FOCUS_LOOK_SHIFT = new THREE.Vector3(1.5, 0, 0);

type Ctx = {
  hovered: DioramaId | null;
  selected: DioramaId | null;
  setHovered: (id: DioramaId | null) => void;
  select: (id: DioramaId, center: THREE.Vector3) => void;
};
const SceneCtx = createContext<Ctx>(null!);

/* ------------------------------------------------------------------ */
/* Fading: everything except the hovered/selected object goes pale.    */
/* ------------------------------------------------------------------ */

const WHITE = new THREE.Color('#ffffff');

function useFade(ref: React.RefObject<THREE.Group | null>, faded: boolean) {
  const amount = useRef(0);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = faded ? 1 : 0;
    const next = THREE.MathUtils.damp(amount.current, target, 8, dt);
    if (Math.abs(next - amount.current) < 0.0005 && next === target) return;
    amount.current = Math.abs(next - target) < 0.001 ? target : next;
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat.userData.baseColor) {
        mat.userData.baseColor = mat.color.clone();
        mat.transparent = true;
      }
      mat.color.copy(mat.userData.baseColor).lerp(WHITE, amount.current * 0.55);
      mat.opacity = 1 - amount.current * 0.45;
    });
  });
}

/** Non-interactive scenery: fades whenever something is hovered or open. */
function Scenery({ children }: { children: ReactNode }) {
  const { hovered, selected } = useContext(SceneCtx);
  const ref = useRef<THREE.Group>(null);
  useFade(ref, hovered !== null || selected !== null);
  return <group ref={ref}>{children}</group>;
}

/** Clickable object: lifts on hover, keeps its colour while the rest fade. */
function Selectable({
  id,
  children,
  position,
}: {
  id: DioramaId;
  children: ReactNode;
  position?: [number, number, number];
}) {
  const { hovered, selected, setHovered, select } = useContext(SceneCtx);
  const ref = useRef<THREE.Group>(null);
  const lift = useRef<THREE.Group>(null);
  const active = selected ? selected === id : hovered === id;
  const faded = selected ? selected !== id : hovered !== null && hovered !== id;
  useFade(ref, faded);

  useFrame((_, dt) => {
    if (!lift.current) return;
    lift.current.position.y = THREE.MathUtils.damp(lift.current.position.y, active ? 0.18 : 0, 8, dt);
    const s = THREE.MathUtils.damp(lift.current.scale.x, active ? 1.04 : 1, 8, dt);
    lift.current.scale.setScalar(s);
  });

  return (
    <group
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (selected) return;
        setHovered(id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = '';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > 6) return; // it was a drag, not a click
        const center = new THREE.Box3().setFromObject(ref.current!).getCenter(new THREE.Vector3());
        document.body.style.cursor = '';
        select(id, center);
      }}
    >
      <group ref={lift}>{children}</group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Camera: eases to the selected object, and back when closed.         */
/* ------------------------------------------------------------------ */

function CameraRig({ focus }: { focus: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const look = useRef(DEFAULT_LOOK.clone());
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 3);
    if (focus) {
      pos.copy(focus).add(FOCUS_OFFSET);
      target.copy(focus).add(FOCUS_LOOK_SHIFT);
    } else {
      pos.copy(DEFAULT_CAM);
      target.copy(DEFAULT_LOOK);
    }
    camera.position.lerp(pos, k);
    look.current.lerp(target, k);
    camera.lookAt(look.current);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Scene pieces                                                         */
/* ------------------------------------------------------------------ */

function Mat({ color, rough = 0.85 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} flatShading />;
}

function Pine({ position, scale = 1, tone = C.pine }: { position: [number, number, number]; scale?: number; tone?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.3, 6]} />
        <Mat color={C.bark} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.32, 0.7, 7]} />
        <Mat color={tone} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <coneGeometry args={[0.24, 0.55, 7]} />
        <Mat color={tone} />
      </mesh>
    </group>
  );
}

/** Deterministic pseudo-random so the forest is the same on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Forest() {
  const trees = useMemo(() => {
    const rand = seeded(7);
    const tones = [C.pine, C.pineDark, C.pineLight];
    const blocked = (x: number, z: number) =>
      (x > -1.6 && x < 0.8 && z > 0.9 && z < 2.5) || // camper
      (x > 0.9 && x < 2.6 && z > 0.7 && z < 2.3) || // arch
      (x > 3.0 && z < -0.4) || // towers
      (x > -0.8 && x < 2.6 && z < 0.4) || // board & ring
      (x < -1.2 && z < 0.1); // mountain faces
    const out: { p: [number, number, number]; s: number; t: string }[] = [];
    let guard = 0;
    while (out.length < 40 && guard++ < 2000) {
      const x = -5 + rand() * 10;
      const z = -2.4 + rand() * 5.2;
      if (blocked(x, z)) continue;
      // Denser on the left, under the mountains, like the reference.
      if (x > 0 && rand() < 0.45) continue;
      if (out.some((t) => Math.hypot(t.p[0] - x, t.p[2] - z) < 0.42)) continue;
      out.push({ p: [x, 0, z], s: 0.75 + rand() * 0.7, t: tones[Math.floor(rand() * 3)] });
    }
    return out;
  }, []);
  return (
    <>
      {trees.map((t, i) => (
        <Pine key={i} position={t.p} scale={t.s} tone={t.t} />
      ))}
    </>
  );
}

function Mountains() {
  const peaks: { p: [number, number, number]; r: number; h: number; c: string }[] = [
    { p: [-3.5, 0, -1.9], r: 1.5, h: 5.0, c: C.rock },
    { p: [-2.0, 0, -2.2], r: 1.1, h: 3.6, c: C.rockDark },
    { p: [-4.6, 0, -1.0], r: 1.0, h: 3.0, c: C.rockDark },
    { p: [-2.7, 0, -0.9], r: 0.8, h: 2.1, c: C.rock },
  ];
  return (
    <>
      {peaks.map((m, i) => (
        <group key={i} position={m.p}>
          <mesh position={[0, m.h / 2, 0]} rotation={[0, i * 0.7, 0]} castShadow receiveShadow>
            <coneGeometry args={[m.r, m.h, 7, 1]} />
            <Mat color={m.c} />
          </mesh>
          {/* snow cap */}
          <mesh position={[0, m.h - m.h * 0.12, 0]} rotation={[0, i * 0.7, 0]}>
            <coneGeometry args={[m.r * 0.26, m.h * 0.25, 6]} />
            <Mat color={C.cream} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Wave() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(5.2, 1.5, 60, 1);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];
    const a = new THREE.Color(C.teal);
    const b = new THREE.Color(C.cream);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const t = (x + 2.6) / 5.2;
      pos.setZ(i, Math.sin(x * 1.1) * 0.5);
      pos.setY(i, pos.getY(i) + Math.sin(x * 0.9 + 1.2) * 0.45);
      const c = a.clone().lerp(b, t);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geom} position={[-0.4, 2.1, -2.6]} rotation={[0, 0.1, 0.06]} castShadow>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.6} />
    </mesh>
  );
}

function Board() {
  return (
    <group position={[0.9, 2.5, -1.9]}>
      <RoundedBox args={[3.8, 2.5, 0.12]} radius={0.04} castShadow receiveShadow>
        <Mat color={C.cream} rough={0.6} />
      </RoundedBox>
      {/* "text" lines */}
      {[
        [-1.1, 0.75, 1.1],
        [-1.25, 0.55, 0.8],
        [-1.2, 0.38, 0.9],
        [0.75, -0.05, 1.0],
        [0.6, -0.25, 0.7],
      ].map(([x, y, w], i) => (
        <mesh key={i} position={[x, y, 0.07]}>
          <boxGeometry args={[w, 0.07, 0.01]} />
          <Mat color={i === 3 ? C.navy : C.teal} />
        </mesh>
      ))}
      {/* round buttons */}
      {[
        [1.25, 0.85, C.gold],
        [-1.45, -0.55, C.aqua],
        [-1.15, -0.55, C.teal],
      ].map(([x, y, c], i) => (
        <mesh key={i} position={[x as number, y as number, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 20]} />
          <Mat color={c as string} />
        </mesh>
      ))}
    </group>
  );
}

function Towers() {
  const towers = [
    { x: 3.3, z: -1.0, h: 1.9, c: C.cream },
    { x: 3.85, z: -1.4, h: 2.9, c: C.sand },
    { x: 4.4, z: -1.1, h: 3.6, c: C.cream },
    { x: 4.95, z: -1.6, h: 2.5, c: C.sand },
  ];
  return (
    <>
      {towers.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, t.h, 0.5]} />
            <Mat color={t.c} rough={0.6} />
          </mesh>
          {/* window slits */}
          {Array.from({ length: Math.floor(t.h / 0.6) }, (_, j) => (
            <mesh key={j} position={[-0.08, 0.5 + j * 0.6, 0.252]}>
              <boxGeometry args={[0.18, 0.06, 0.01]} />
              <Mat color={j % 2 ? C.teal : C.gold} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function Camper() {
  return (
    <group position={[-0.4, 0, 1.7]} rotation={[0, -0.25, 0]}>
      <RoundedBox args={[1.7, 0.8, 0.9]} radius={0.28} smoothness={6} position={[0, 0.56, 0]} castShadow>
        <Mat color={C.cream} rough={0.5} />
      </RoundedBox>
      {/* windows */}
      <mesh position={[0.35, 0.68, 0.455]}>
        <boxGeometry args={[0.7, 0.24, 0.01]} />
        <Mat color={C.navy} rough={0.3} />
      </mesh>
      <mesh position={[0.86, 0.66, 0]}>
        <boxGeometry args={[0.01, 0.26, 0.6]} />
        <Mat color={C.navy} rough={0.3} />
      </mesh>
      {/* stripe */}
      <mesh position={[0, 0.42, 0.455]}>
        <boxGeometry args={[1.4, 0.06, 0.01]} />
        <Mat color={C.gold} />
      </mesh>
      {/* wheels */}
      {[
        [-0.5, 0.42],
        [0.5, 0.42],
        [-0.5, -0.42],
        [0.5, -0.42],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.17, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.12, 16]} />
          <Mat color={C.navy} />
        </mesh>
      ))}
    </group>
  );
}

function Arch() {
  return (
    <group position={[1.75, 0, 1.5]} rotation={[0, -0.35, 0]}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.6, 0.24, 18, 40, Math.PI]} />
        <Mat color={C.sand} rough={0.6} />
      </mesh>
      <mesh position={[0, 0, -0.45]} castShadow>
        <torusGeometry args={[0.6, 0.24, 18, 40, Math.PI]} />
        <Mat color={C.cream} rough={0.6} />
      </mesh>
      <mesh position={[0, 0.02, -0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.0, 0.5]} />
        <Mat color={C.gold} />
      </mesh>
    </group>
  );
}

function Stones() {
  const stones: { p: [number, number, number]; s: number; c: string }[] = [
    { p: [-4.2, 4.6, -0.8], s: 0.32, c: C.sand },
    { p: [-3.4, 5.2, -0.2], s: 0.22, c: C.cream },
    { p: [-4.7, 5.4, -1.2], s: 0.18, c: C.aqua },
    { p: [3.6, 4.6, -0.6], s: 0.42, c: C.sand },
    { p: [2.7, 5.1, -0.2], s: 0.2, c: C.aqua },
  ];
  return (
    <>
      {stones.map((st, i) => (
        <Float key={i} speed={1.4 + i * 0.2} rotationIntensity={0.6} floatIntensity={0.8}>
          <mesh position={st.p} scale={[st.s, st.s * 0.72, st.s]} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <Mat color={st.c} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Base() {
  return (
    <group>
      <mesh position={[0, -0.2, 0.1]} receiveShadow>
        <boxGeometry args={[11.4, 0.4, 6.4]} />
        <Mat color={C.cream} rough={0.7} />
      </mesh>
      {/* grass layer */}
      <mesh position={[0, 0.005, 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.2, 6.2]} />
        <Mat color="#9DB8A4" />
      </mesh>
      {/* gold trim */}
      <mesh position={[0, -0.32, 3.31]}>
        <boxGeometry args={[11.4, 0.06, 0.02]} />
        <Mat color={C.gold} />
      </mesh>
    </group>
  );
}

function SmallBits() {
  return (
    <>
      {/* ring sculpture */}
      <mesh position={[2.6, 0.55, -0.2]} rotation={[0, -0.5, 0]} castShadow>
        <torusGeometry args={[0.45, 0.12, 16, 40]} />
        <Mat color={C.gold} rough={0.5} />
      </mesh>
      {/* bench */}
      <group position={[-2.1, 0, 2.3]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.8, 0.06, 0.25]} />
          <Mat color={C.bark} />
        </mesh>
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.13, 0]}>
            <boxGeometry args={[0.06, 0.26, 0.22]} />
            <Mat color={C.bark} />
          </mesh>
        ))}
      </group>
      {/* little sign block */}
      <RoundedBox args={[0.8, 0.55, 0.5]} radius={0.06} position={[4.4, 0.28, 2.3]} castShadow>
        <Mat color={C.cream} rough={0.6} />
      </RoundedBox>
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function DioramaScene({
  selected,
  onSelect,
}: {
  selected: DioramaId | null;
  onSelect: (id: DioramaId) => void;
}) {
  const [hovered, setHoveredRaw] = useState<DioramaId | null>(null);
  const [dragging, setDragging] = useState(false);
  const setHovered = (id: DioramaId | null) => setHoveredRaw(dragging ? null : id);
  const [focus, setFocus] = useState<THREE.Vector3 | null>(null);

  const ctx: Ctx = {
    hovered,
    selected,
    setHovered,
    select: (id, center) => {
      setHovered(null);
      setFocus(center);
      onSelect(id);
    },
  };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: DEFAULT_CAM.toArray(), fov: 51 }}
      onPointerMissed={() => setHoveredRaw(null)}
      onPointerDown={() => {
        setDragging(true);
        setHoveredRaw(null);
        const up = () => {
          setDragging(false);
          window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointerup', up);
      }}
    >
      <SceneCtx.Provider value={ctx}>
        <CameraRig focus={selected ? focus : null} />
        <hemisphereLight args={[C.aqua, C.sand, 0.55]} />
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[-6, 7, 5]}
          intensity={1.15}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[6, 3, 4]} intensity={0.35} />

        <PresentationControls
          global
          enabled={!selected}
          snap
          speed={1.2}
          rotation={[0.04, 0, 0]}
          polar={[-0.06, 0.09]}
          azimuth={[-0.25, 0.25]}
          config={{ mass: 1, tension: 170, friction: 22 }}
        >
          <group position={[0, -0.6, 0]}>
            <Scenery>
              <Base />
              <Forest />
              <Wave />
              <SmallBits />
            </Scenery>
            <Selectable id="mountains">
              <Mountains />
            </Selectable>
            <Selectable id="panel">
              <Board />
            </Selectable>
            <Selectable id="columns">
              <Towers />
            </Selectable>
            <Selectable id="van">
              <Camper />
            </Selectable>
            <Selectable id="arch">
              <Arch />
            </Selectable>
            <Selectable id="stones">
              <Stones />
            </Selectable>
          </group>
        </PresentationControls>

        <ContactShadows position={[0, -1.05, 0]} opacity={0.35} scale={16} blur={2.5} far={3} />
      </SceneCtx.Provider>
    </Canvas>
  );
}
