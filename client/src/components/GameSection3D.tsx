import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RotateCcw, Minimize2 } from "lucide-react";
import { LiquidGlassButton } from "./ui/liquid-glass";

// ════════════════════════════════════════════════════════════════════════════════
// GAME ENGINE (extracted from original GameSection)
// ════════════════════════════════════════════════════════════════════════════════

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const FPS = 60;
const STEP = 1 / FPS;
const SEGMENT_LENGTH = 200;
const RUMBLE_LENGTH = 3;
const LANES = 3;
const ROAD_WIDTH = 2000;
const CAMERA_HEIGHT = 1000;
const FIELD_OF_VIEW = 100;
const DRAW_DISTANCE = 200;
const FOG_DENSITY = 5;
const CENTRIFUGAL = 0.3;
const MAX_SPEED = SEGMENT_LENGTH / STEP;
const ACCEL = MAX_SPEED / 5;
const BREAKING = -MAX_SPEED;
const DECEL = -MAX_SPEED / 5;
const OFF_ROAD_DECEL = -MAX_SPEED / 2;
const OFF_ROAD_LIMIT = MAX_SPEED / 4;

const KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, A: 65, D: 68, S: 83, W: 87 };

const BACKGROUND = {
  HILLS: { x: 5, y: 5, w: 1280, h: 480 },
  SKY: { x: 5, y: 495, w: 1280, h: 480 },
  TREES: { x: 5, y: 985, w: 1280, h: 480 }
};

const SPRITES = {
  PALM_TREE: { x: 5, y: 5, w: 215, h: 540 },
  BILLBOARD08: { x: 230, y: 5, w: 385, h: 265 },
  TREE1: { x: 625, y: 5, w: 360, h: 360 },
  DEAD_TREE1: { x: 5, y: 555, w: 135, h: 332 },
  BILLBOARD09: { x: 150, y: 555, w: 328, h: 282 },
  BOULDER3: { x: 230, y: 280, w: 320, h: 220 },
  COLUMN: { x: 995, y: 5, w: 200, h: 315 },
  BILLBOARD01: { x: 625, y: 375, w: 300, h: 170 },
  BILLBOARD06: { x: 488, y: 555, w: 298, h: 190 },
  BILLBOARD05: { x: 5, y: 897, w: 298, h: 190 },
  BILLBOARD07: { x: 313, y: 897, w: 298, h: 190 },
  BOULDER2: { x: 621, y: 897, w: 298, h: 140 },
  TREE2: { x: 1205, y: 5, w: 282, h: 295 },
  BILLBOARD04: { x: 1205, y: 310, w: 268, h: 170 },
  DEAD_TREE2: { x: 1205, y: 490, w: 150, h: 260 },
  BOULDER1: { x: 1205, y: 760, w: 168, h: 248 },
  BUSH1: { x: 5, y: 1097, w: 240, h: 155 },
  CACTUS: { x: 929, y: 897, w: 235, h: 118 },
  BUSH2: { x: 255, y: 1097, w: 232, h: 152 },
  BILLBOARD03: { x: 5, y: 1262, w: 230, h: 220 },
  BILLBOARD02: { x: 245, y: 1262, w: 215, h: 220 },
  STUMP: { x: 995, y: 330, w: 195, h: 140 },
  SEMI: { x: 1365, y: 490, w: 122, h: 144 },
  TRUCK: { x: 1365, y: 644, w: 100, h: 78 },
  CAR03: { x: 1383, y: 760, w: 88, h: 55 },
  CAR02: { x: 1383, y: 825, w: 80, h: 59 },
  CAR04: { x: 1383, y: 894, w: 80, h: 57 },
  CAR01: { x: 1205, y: 1018, w: 80, h: 56 },
  PLAYER_UPHILL_LEFT: { x: 1383, y: 961, w: 80, h: 45 },
  PLAYER_UPHILL_STRAIGHT: { x: 1295, y: 1018, w: 80, h: 45 },
  PLAYER_UPHILL_RIGHT: { x: 1385, y: 1018, w: 80, h: 45 },
  PLAYER_LEFT: { x: 995, y: 480, w: 80, h: 41 },
  PLAYER_STRAIGHT: { x: 1085, y: 480, w: 80, h: 41 },
  PLAYER_RIGHT: { x: 995, y: 531, w: 80, h: 41 },
};
const SPRITE_SCALE = 0.3 * (1 / SPRITES.PLAYER_STRAIGHT.w);

type SpriteType = { x: number; y: number; w: number; h: number };
const SPRITE_BILLBOARDS: SpriteType[] = [SPRITES.BILLBOARD01, SPRITES.BILLBOARD02, SPRITES.BILLBOARD03, SPRITES.BILLBOARD04, SPRITES.BILLBOARD05, SPRITES.BILLBOARD06, SPRITES.BILLBOARD07, SPRITES.BILLBOARD08, SPRITES.BILLBOARD09];
const SPRITE_PLANTS: SpriteType[] = [SPRITES.TREE1, SPRITES.TREE2, SPRITES.DEAD_TREE1, SPRITES.DEAD_TREE2, SPRITES.PALM_TREE, SPRITES.BUSH1, SPRITES.BUSH2, SPRITES.CACTUS, SPRITES.STUMP, SPRITES.BOULDER1, SPRITES.BOULDER2, SPRITES.BOULDER3];
const SPRITE_CARS: SpriteType[] = [SPRITES.CAR01, SPRITES.CAR02, SPRITES.CAR03, SPRITES.CAR04, SPRITES.SEMI, SPRITES.TRUCK];

const getColors = (isDark: boolean) => ({
  SKY: isDark ? '#1a1a2e' : '#72D7EE',
  TREE: isDark ? '#0a3d0a' : '#005108',
  FOG: isDark ? '#0a3d0a' : '#005108',
  LIGHT: { road: isDark ? '#3a3a3a' : '#6B6B6B', grass: isDark ? '#0a5a0a' : '#10AA10', rumble: isDark ? '#333333' : '#555555', lane: isDark ? '#888888' : '#CCCCCC' },
  DARK: { road: isDark ? '#333333' : '#696969', grass: isDark ? '#085008' : '#009A00', rumble: isDark ? '#777777' : '#BBBBBB', lane: null as string | null },
  START: { road: 'white', grass: 'white', rumble: 'white', lane: null as string | null },
  FINISH: { road: 'black', grass: 'black', rumble: 'black', lane: null as string | null }
});

const ROAD = {
  LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
  HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
  CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
};

// Game utility functions
const timestamp = () => new Date().getTime();
const toInt = (obj: unknown, def = 0) => { if (obj !== null && obj !== undefined) { const x = parseInt(String(obj), 10); if (!isNaN(x)) return x; } return def; };
const limit = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const randomInt = (min: number, max: number) => Math.round(interpolate(min, max, Math.random()));
const randomChoice = <T,>(options: T[]): T => options[randomInt(0, options.length - 1)];
const percentRemaining = (n: number, total: number) => (n % total) / total;
const accelerate = (v: number, accel: number, dt: number) => v + (accel * dt);
const interpolate = (a: number, b: number, percent: number) => a + (b - a) * percent;
const easeIn = (a: number, b: number, percent: number) => a + (b - a) * Math.pow(percent, 2);
const easeInOut = (a: number, b: number, percent: number) => a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
const exponentialFog = (distance: number, density: number) => 1 / (Math.pow(Math.E, (distance * distance * density)));
const increase = (start: number, increment: number, max: number) => { let result = start + increment; while (result >= max) result -= max; while (result < 0) result += max; return result; };

// ════════════════════════════════════════════════════════════════════════════════
// 3D RETRO PC SETUP COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

interface RetroPCProps {
  gameCanvasRef: React.RefObject<HTMLCanvasElement>;
  isZoomed: boolean;
  onScreenClick: () => void;
}

function RetroPC({ gameCanvasRef, isZoomed, onScreenClick }: RetroPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenMeshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const floatOffset = useRef(0);

  // Target camera positions
  const zoomedPos = new THREE.Vector3(0, 0.6, 2.2);
  const normalPos = new THREE.Vector3(0.3, 0.8, 4.5);

  // Create texture from game canvas
  useEffect(() => {
    if (gameCanvasRef.current) {
      textureRef.current = new THREE.CanvasTexture(gameCanvasRef.current);
      textureRef.current.minFilter = THREE.LinearFilter;
      textureRef.current.magFilter = THREE.LinearFilter;
    }
  }, [gameCanvasRef]);

  // Update texture and screen material when texture is ready
  useEffect(() => {
    if (textureRef.current && screenMeshRef.current) {
      (screenMeshRef.current.material as THREE.MeshBasicMaterial).map = textureRef.current;
      (screenMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }, [textureRef.current]);

  // Update texture, camera, and float animation every frame
  useFrame(() => {
    // Update game texture
    if (textureRef.current && gameCanvasRef.current) {
      textureRef.current.needsUpdate = true;
    }

    // Smooth camera transition
    const targetPos = isZoomed ? zoomedPos : normalPos;
    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(0, 0.4, 0);

    // Subtle float animation when not zoomed
    if (groupRef.current && !isZoomed) {
      floatOffset.current += 0.015;
      groupRef.current.rotation.y = Math.sin(floatOffset.current * 0.5) * 0.03;
    }
  });

  // Colors
  const caseColor = "#d4d0c8"; // Classic beige/off-white PC color
  const darkAccent = "#2a2a2a";
  const ventColor = "#1a1a1a";

  return (
    <group ref={groupRef}>
      {/* ═══════════════════════════════════════════════════════════════════════
          CRT MONITOR
      ═══════════════════════════════════════════════════════════════════════ */}
      <group position={[0, 0.85, 0]}>
        {/* Monitor body - chunky CRT style */}
        <mesh position={[0, 0, -0.3]}>
          <boxGeometry args={[1.8, 1.5, 1.1]} />
          <meshStandardMaterial color={caseColor} roughness={0.4} />
        </mesh>

        {/* Monitor front bezel */}
        <mesh position={[0, 0, 0.26]}>
          <boxGeometry args={[1.9, 1.6, 0.05]} />
          <meshStandardMaterial color={caseColor} roughness={0.3} />
        </mesh>

        {/* Screen inset/frame - dark border around screen */}
        <mesh position={[0, 0.05, 0.28]}>
          <boxGeometry args={[1.5, 1.15, 0.02]} />
          <meshStandardMaterial color={darkAccent} roughness={0.2} />
        </mesh>

        {/* Actual game screen */}
        <mesh
          ref={screenMeshRef}
          position={[0, 0.05, 0.295]}
          onClick={(e) => {
            e.stopPropagation();
            onScreenClick();
          }}
        >
          <planeGeometry args={[1.4, 1.05]} />
          <meshBasicMaterial color="#111111" />
        </mesh>

        {/* Screen glass reflection */}
        <mesh position={[0, 0.05, 0.3]}>
          <planeGeometry args={[1.4, 1.05]} />
          <meshStandardMaterial
            color="#88ccff"
            transparent
            opacity={0.08}
            roughness={0.1}
          />
        </mesh>

        {/* Monitor bottom panel with controls */}
        <mesh position={[0, -0.65, 0.15]}>
          <boxGeometry args={[1.9, 0.25, 0.3]} />
          <meshStandardMaterial color={caseColor} roughness={0.3} />
        </mesh>

        {/* Power button */}
        <mesh position={[0.7, -0.65, 0.32]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial color="#333333" roughness={0.3} />
        </mesh>

        {/* Power LED */}
        <mesh position={[0.55, -0.65, 0.32]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>

        {/* Adjustment buttons */}
        {[-0.3, -0.15, 0, 0.15].map((x, i) => (
          <mesh key={i} position={[x, -0.65, 0.32]}>
            <boxGeometry args={[0.08, 0.06, 0.02]} />
            <meshStandardMaterial color="#444444" roughness={0.4} />
          </mesh>
        ))}

        {/* Brand logo area */}
        <mesh position={[0, -0.55, 0.29]}>
          <boxGeometry args={[0.4, 0.08, 0.01]} />
          <meshStandardMaterial color="#888888" roughness={0.6} />
        </mesh>

        {/* Back vents */}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0, -0.86]}>
            <boxGeometry args={[0.15, 1.0, 0.02]} />
            <meshStandardMaterial color={ventColor} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════════════════════
          PC TOWER
      ═══════════════════════════════════════════════════════════════════════ */}
      <group position={[1.5, 0.5, -0.2]}>
        {/* Main tower body */}
        <mesh>
          <boxGeometry args={[0.45, 1.1, 0.9]} />
          <meshStandardMaterial color={caseColor} roughness={0.4} />
        </mesh>

        {/* Front panel */}
        <mesh position={[0.23, 0, 0]}>
          <boxGeometry args={[0.02, 1.08, 0.88]} />
          <meshStandardMaterial color={caseColor} roughness={0.35} />
        </mesh>

        {/* CD/DVD drive bay */}
        <mesh position={[0.24, 0.35, 0]}>
          <boxGeometry args={[0.02, 0.12, 0.7]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.3} />
        </mesh>
        <mesh position={[0.25, 0.35, 0.25]}>
          <boxGeometry args={[0.01, 0.02, 0.04]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Floppy drive bay */}
        <mesh position={[0.24, 0.15, 0]}>
          <boxGeometry args={[0.02, 0.08, 0.5]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.3} />
        </mesh>
        <mesh position={[0.25, 0.15, 0]}>
          <boxGeometry args={[0.01, 0.04, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Power button */}
        <mesh position={[0.24, -0.25, 0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.3} />
        </mesh>

        {/* Reset button */}
        <mesh position={[0.24, -0.25, 0]}>
          <boxGeometry args={[0.02, 0.04, 0.06]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} />
        </mesh>

        {/* Power LED */}
        <mesh position={[0.25, -0.25, -0.15]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>

        {/* HDD LED */}
        <mesh position={[0.25, -0.25, -0.22]}>
          <sphereGeometry args={[0.012, 16, 16]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={1} />
        </mesh>

        {/* Front bottom vents */}
        <mesh position={[0.24, -0.45, 0]}>
          <boxGeometry args={[0.02, 0.15, 0.6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>

        {/* Side panel lines */}
        {[-0.35, -0.15, 0.05, 0.25].map((y, i) => (
          <mesh key={i} position={[-0.23, y, 0]}>
            <boxGeometry args={[0.01, 0.02, 0.85]} />
            <meshStandardMaterial color="#c0bdb5" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════════════════════
          KEYBOARD
      ═══════════════════════════════════════════════════════════════════════ */}
      <group position={[0, -0.02, 1.2]}>
        {/* Keyboard base */}
        <mesh>
          <boxGeometry args={[1.3, 0.06, 0.45]} />
          <meshStandardMaterial color={caseColor} roughness={0.4} />
        </mesh>

        {/* Key area (dark) */}
        <mesh position={[0, 0.035, -0.02]}>
          <boxGeometry args={[1.2, 0.02, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>

        {/* Individual key rows */}
        {[0.12, 0.04, -0.04, -0.12].map((z, rowIdx) => (
          <group key={rowIdx} position={[0, 0.05, z]}>
            {Array.from({ length: 14 - rowIdx }).map((_, i) => (
              <mesh key={i} position={[-0.52 + i * 0.08, 0, 0]}>
                <boxGeometry args={[0.065, 0.03, 0.07]} />
                <meshStandardMaterial
                  color={rowIdx === 3 && i > 3 && i < 10 ? "#e8e4dc" : "#d4d0c8"}
                  roughness={0.5}
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* Spacebar */}
        <mesh position={[0, 0.05, -0.12]}>
          <boxGeometry args={[0.4, 0.03, 0.07]} />
          <meshStandardMaterial color="#d4d0c8" roughness={0.5} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOUSE
      ═══════════════════════════════════════════════════════════════════════ */}
      <group position={[0.9, 0, 1.1]}>
        {/* Mouse body */}
        <mesh>
          <boxGeometry args={[0.15, 0.08, 0.25]} />
          <meshStandardMaterial color={caseColor} roughness={0.4} />
        </mesh>
        {/* Left button */}
        <mesh position={[-0.035, 0.045, -0.05]}>
          <boxGeometry args={[0.06, 0.02, 0.1]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.35} />
        </mesh>
        {/* Right button */}
        <mesh position={[0.035, 0.045, -0.05]}>
          <boxGeometry args={[0.06, 0.02, 0.1]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.35} />
        </mesh>
        {/* Scroll wheel */}
        <mesh position={[0, 0.05, -0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.03, 12]} />
          <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
        {/* Mouse cable */}
        <mesh position={[0, 0.02, -0.15]}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESK
      ═══════════════════════════════════════════════════════════════════════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.05, 0.5]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#3d2817" roughness={0.7} />
      </mesh>

      {/* Desk edge highlight */}
      <mesh position={[0.5, -0.04, 2]}>
        <boxGeometry args={[4, 0.02, 0.05]} />
        <meshStandardMaterial color="#4a3423" roughness={0.6} />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════════
          CABLES (decorative)
      ═══════════════════════════════════════════════════════════════════════ */}
      {/* Monitor cable */}
      <mesh position={[0.5, 0, -0.8]}>
        <cylinderGeometry args={[0.015, 0.015, 1, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Keyboard cable */}
      <mesh position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.5, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

type GameState = "waiting" | "playing" | "gameover";

export default function GameSection3D() {
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [lastLapTime, setLastLapTime] = useState<number | null>(null);
  const [fastLapTime, setFastLapTime] = useState<number | null>(null);

  // Game state ref (same as original)
  const gameRef = useRef({
    segments: [] as any[],
    cars: [] as any[],
    trackLength: 0,
    position: 0,
    speed: 0,
    playerX: 0,
    playerZ: 0,
    cameraDepth: 0,
    resolution: CANVAS_HEIGHT / 480,
    skyOffset: 0,
    hillOffset: 0,
    treeOffset: 0,
    currentLapTime: 0,
    lastLapTime: null as number | null,
    keyLeft: false,
    keyRight: false,
    keyFaster: false,
    keySlower: false,
    background: null as HTMLImageElement | null,
    sprites: null as HTMLImageElement | null,
    imagesLoaded: false
  });

  // Load fastest lap time
  useEffect(() => {
    const saved = localStorage.getItem("racerFastLapTime");
    if (saved) setFastLapTime(parseFloat(saved));
  }, []);

  // Load images
  useEffect(() => {
    const game = gameRef.current;
    const bgImg = new Image();
    const sprImg = new Image();
    let loaded = 0;

    const onLoad = () => {
      loaded++;
      if (loaded === 2) {
        game.background = bgImg;
        game.sprites = sprImg;
        game.imagesLoaded = true;
      }
    };

    bgImg.onload = onLoad;
    sprImg.onload = onLoad;
    bgImg.src = "/uploads/background.png";
    sprImg.src = "/uploads/sprites.png";
  }, []);

  // Build road (simplified - same logic as original)
  const buildRoad = useCallback(() => {
    const game = gameRef.current;
    const isDark = document.documentElement.classList.contains("dark");
    const COLORS = getColors(isDark);
    game.segments = [];

    const lastY = () => game.segments.length === 0 ? 0 : game.segments[game.segments.length - 1].p2.world.y;

    const addSegment = (curve: number, y: number) => {
      const n = game.segments.length;
      game.segments.push({
        index: n,
        p1: { world: { y: lastY(), z: n * SEGMENT_LENGTH }, camera: {}, screen: {} },
        p2: { world: { y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
        curve: curve,
        sprites: [],
        cars: [],
        color: Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.DARK : COLORS.LIGHT
      });
    };

    const addRoad = (enter: number, hold: number, leave: number, curve: number, y: number) => {
      const startY = lastY();
      const endY = startY + (toInt(y, 0) * SEGMENT_LENGTH);
      const total = enter + hold + leave;
      for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
      for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
      for (let n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
    };

    const addStraight = (num = ROAD.LENGTH.MEDIUM) => addRoad(num, num, num, 0, 0);
    const addHill = (num = ROAD.LENGTH.MEDIUM, height = ROAD.HILL.MEDIUM) => addRoad(num, num, num, 0, height);
    const addCurve = (num = ROAD.LENGTH.MEDIUM, curve = ROAD.CURVE.MEDIUM, height = ROAD.HILL.NONE) => addRoad(num, num, num, curve, height);
    const addLowRollingHills = (num = ROAD.LENGTH.SHORT, height = ROAD.HILL.LOW) => {
      addRoad(num, num, num, 0, height / 2);
      addRoad(num, num, num, 0, -height);
      addRoad(num, num, num, ROAD.CURVE.EASY, height);
      addRoad(num, num, num, 0, 0);
      addRoad(num, num, num, -ROAD.CURVE.EASY, height / 2);
      addRoad(num, num, num, 0, 0);
    };
    const addSCurves = () => {
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.NONE);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.EASY, -ROAD.HILL.LOW);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.MEDIUM);
      addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
    };
    const addBumps = () => {
      addRoad(10, 10, 10, 0, 5); addRoad(10, 10, 10, 0, -2); addRoad(10, 10, 10, 0, -5);
      addRoad(10, 10, 10, 0, 8); addRoad(10, 10, 10, 0, 5); addRoad(10, 10, 10, 0, -7);
      addRoad(10, 10, 10, 0, 5); addRoad(10, 10, 10, 0, -2);
    };
    const addDownhillToEnd = (num = 200) => addRoad(num, num, num, -ROAD.CURVE.EASY, -lastY() / SEGMENT_LENGTH);

    // Build track
    addStraight(ROAD.LENGTH.SHORT);
    addLowRollingHills();
    addSCurves();
    addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
    addBumps();
    addLowRollingHills();
    addCurve(ROAD.LENGTH.LONG * 2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    addStraight();
    addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
    addSCurves();
    addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
    addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
    addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
    addBumps();
    addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
    addStraight();
    addSCurves();
    addDownhillToEnd();

    // Add sprites to segments
    const addSprite = (n: number, sprite: SpriteType, offset: number) => {
      if (n < game.segments.length) game.segments[n].sprites.push({ source: sprite, offset });
    };

    for (let n = 10; n < 200; n += 4 + Math.floor(n / 100)) {
      addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5);
      addSprite(n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
    }
    for (let n = 250; n < 1000; n += 5) {
      addSprite(n, SPRITES.COLUMN, 1.1);
      addSprite(n + randomInt(0, 5), SPRITES.TREE1, -1 - (Math.random() * 2));
    }
    for (let n = 200; n < game.segments.length; n += 3) {
      addSprite(n, randomChoice(SPRITE_PLANTS), randomChoice([1, -1]) * (2 + Math.random() * 5));
    }

    // Add cars
    game.cars = [];
    for (let n = 0; n < 100; n++) {
      const carOffset = Math.random() * randomChoice([-0.8, 0.8]);
      const z = Math.floor(Math.random() * game.segments.length) * SEGMENT_LENGTH;
      const sprite = randomChoice(SPRITE_CARS);
      const carSpeed = MAX_SPEED / 4 + Math.random() * MAX_SPEED / (sprite === SPRITES.SEMI ? 4 : 2);
      const car = { offset: carOffset, z, sprite, speed: carSpeed };
      const segment = game.segments[Math.floor(z / SEGMENT_LENGTH) % game.segments.length];
      segment.cars.push(car);
      game.cars.push(car);
    }

    // Mark start/finish
    const findSeg = (z: number) => game.segments[Math.floor(z / SEGMENT_LENGTH) % game.segments.length];
    const startIdx = findSeg(game.playerZ).index;
    if (startIdx + 2 < game.segments.length) game.segments[startIdx + 2].color = COLORS.START;
    if (startIdx + 3 < game.segments.length) game.segments[startIdx + 3].color = COLORS.START;
    for (let n = 0; n < RUMBLE_LENGTH; n++) game.segments[game.segments.length - 1 - n].color = COLORS.FINISH;

    game.trackLength = game.segments.length * SEGMENT_LENGTH;
  }, []);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.cameraDepth = 1 / Math.tan((FIELD_OF_VIEW / 2) * Math.PI / 180);
    game.playerZ = CAMERA_HEIGHT * game.cameraDepth;
    game.resolution = CANVAS_HEIGHT / 480;
    game.position = 0;
    game.speed = 0;
    game.playerX = 0;
    game.skyOffset = 0;
    game.hillOffset = 0;
    game.treeOffset = 0;
    game.currentLapTime = 0;
    game.lastLapTime = null;
    game.keyLeft = false;
    game.keyRight = false;
    game.keyFaster = false;
    game.keySlower = false;
    buildRoad();
    setCurrentSpeed(0);
    setCurrentLapTime(0);
    setLastLapTime(null);
  }, [buildRoad]);

  const handleStart = useCallback(() => {
    if (gameRef.current.imagesLoaded) {
      resetGame();
      setGameState("playing");
      setIsZoomed(true);
    }
  }, [resetGame]);

  const handleScreenClick = useCallback(() => {
    if (gameState === "waiting") {
      handleStart();
    } else {
      setIsZoomed(!isZoomed);
    }
  }, [gameState, isZoomed, handleStart]);

  // Keyboard handler
  useEffect(() => {
    const game = gameRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!isZoomed) return;

      if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A) { game.keyLeft = true; e.preventDefault(); }
      if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D) { game.keyRight = true; e.preventDefault(); }
      if (e.keyCode === KEY.UP || e.keyCode === KEY.W) { game.keyFaster = true; e.preventDefault(); }
      if (e.keyCode === KEY.DOWN || e.keyCode === KEY.S) { game.keySlower = true; e.preventDefault(); }

      if (gameState === "waiting" && game.imagesLoaded) {
        if ([KEY.UP, KEY.W].includes(e.keyCode)) handleStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A) game.keyLeft = false;
      if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D) game.keyRight = false;
      if (e.keyCode === KEY.UP || e.keyCode === KEY.W) game.keyFaster = false;
      if (e.keyCode === KEY.DOWN || e.keyCode === KEY.S) game.keySlower = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, isZoomed, handleStart]);

  // Game loop - renders to offscreen canvas
  useEffect(() => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const game = gameRef.current;

    let animationId: number;
    let lastTime = timestamp();
    let gdt = 0;

    const findSegment = (z: number) => game.segments[Math.floor(z / SEGMENT_LENGTH) % game.segments.length];

    const project = (p: any, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number) => {
      p.camera.x = (p.world.x || 0) - cameraX;
      p.camera.y = (p.world.y || 0) - cameraY;
      p.camera.z = (p.world.z || 0) - cameraZ;
      p.screen.scale = cameraDepth / p.camera.z!;
      p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x! * width / 2));
      p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y! * height / 2));
      p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
    };

    const overlap = (x1: number, w1: number, x2: number, w2: number, percent = 1) => {
      const half = percent / 2;
      return !((x1 + w1 * half) < (x2 - w2 * half) || (x1 - w1 * half) > (x2 + w2 * half));
    };

    const renderPolygon = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fill();
    };

    const renderSegment = (ctx: CanvasRenderingContext2D, width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, fog: number, color: any) => {
      const r1 = w1 / Math.max(6, 2 * lanes), r2 = w2 / Math.max(6, 2 * lanes);
      const l1 = w1 / Math.max(32, 8 * lanes), l2 = w2 / Math.max(32, 8 * lanes);
      ctx.fillStyle = color.grass;
      ctx.fillRect(0, y2, width, y1 - y2);
      renderPolygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
      renderPolygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
      renderPolygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);
      if (color.lane) {
        const lanew1 = w1 * 2 / lanes, lanew2 = w2 * 2 / lanes;
        let lanex1 = x1 - w1 + lanew1, lanex2 = x2 - w2 + lanew2;
        for (let lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
          renderPolygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
        }
      }
      if (fog < 1) { ctx.globalAlpha = 1 - fog; ctx.fillRect(0, y1, width, y2 - y1); ctx.globalAlpha = 1; }
    };

    const renderBackground = (ctx: CanvasRenderingContext2D, background: HTMLImageElement, width: number, height: number, layer: typeof BACKGROUND.SKY, rotation = 0, offset = 0) => {
      const imageW = layer.w / 2, imageH = layer.h;
      const sourceX = layer.x + Math.floor(layer.w * rotation);
      const sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
      const destW = Math.floor(width * (sourceW / imageW));
      ctx.drawImage(background, sourceX, layer.y, sourceW, imageH, 0, offset, destW, height);
      if (sourceW < imageW) ctx.drawImage(background, layer.x, layer.y, imageW - sourceW, imageH, destW - 1, offset, width - destW, height);
    };

    const renderSprite = (ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, sprites: HTMLImageElement, sprite: SpriteType, scale: number, destX: number, destY: number, offsetX = 0, offsetY = 0, clipY?: number) => {
      const destW = (sprite.w * scale * width / 2) * (SPRITE_SCALE * roadWidth);
      const destH = (sprite.h * scale * width / 2) * (SPRITE_SCALE * roadWidth);
      destX = destX + (destW * offsetX);
      destY = destY + (destH * offsetY);
      const clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
      if (clipH < destH) ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX, destY, destW, destH - clipH);
    };

    const renderPlayer = (ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, sprites: HTMLImageElement, speedPercent: number, scale: number, destX: number, destY: number, steer: number, updown: number) => {
      const bounce = (1.5 * Math.random() * speedPercent * resolution) * randomChoice([-1, 1]);
      let sprite;
      if (steer < 0) sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
      else if (steer > 0) sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
      else sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
      renderSprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
    };

    const update = (dt: number) => {
      if (game.segments.length === 0) return;
      const playerSegment = findSegment(game.position + game.playerZ);
      const playerW = SPRITES.PLAYER_STRAIGHT.w * SPRITE_SCALE;
      const speedPercent = game.speed / MAX_SPEED;
      const dx = dt * 2 * speedPercent;
      const startPosition = game.position;

      // Update cars
      for (const car of game.cars) {
        const oldSegment = findSegment(car.z);
        car.z = increase(car.z, dt * car.speed, game.trackLength);
        car.percent = percentRemaining(car.z, SEGMENT_LENGTH);
        const newSegment = findSegment(car.z);
        if (oldSegment !== newSegment) {
          const index = oldSegment.cars.indexOf(car);
          if (index >= 0) oldSegment.cars.splice(index, 1);
          newSegment.cars.push(car);
        }
      }

      game.position = increase(game.position, dt * game.speed, game.trackLength);
      if (game.keyLeft) game.playerX -= dx;
      else if (game.keyRight) game.playerX += dx;
      game.playerX -= dx * speedPercent * playerSegment.curve * CENTRIFUGAL;

      if (game.keyFaster) game.speed = accelerate(game.speed, ACCEL, dt);
      else if (game.keySlower) game.speed = accelerate(game.speed, BREAKING, dt);
      else game.speed = accelerate(game.speed, DECEL, dt);

      if ((game.playerX < -1) || (game.playerX > 1)) {
        if (game.speed > OFF_ROAD_LIMIT) game.speed = accelerate(game.speed, OFF_ROAD_DECEL, dt);
        for (const spriteObj of playerSegment.sprites) {
          const spriteW = spriteObj.source.w * SPRITE_SCALE;
          if (overlap(game.playerX, playerW, spriteObj.offset + spriteW / 2 * (spriteObj.offset > 0 ? 1 : -1), spriteW)) {
            game.speed = MAX_SPEED / 5;
            game.position = increase(playerSegment.p1.world.z, -game.playerZ, game.trackLength);
            break;
          }
        }
      }

      for (const car of playerSegment.cars) {
        const carW = car.sprite.w * SPRITE_SCALE;
        if (game.speed > car.speed && overlap(game.playerX, playerW, car.offset, carW, 0.8)) {
          game.speed = car.speed * (car.speed / game.speed);
          game.position = increase(car.z, -game.playerZ, game.trackLength);
          break;
        }
      }

      game.playerX = limit(game.playerX, -3, 3);
      game.speed = limit(game.speed, 0, MAX_SPEED);
      game.skyOffset = increase(game.skyOffset, 0.001 * playerSegment.curve * (game.position - startPosition) / SEGMENT_LENGTH, 1);
      game.hillOffset = increase(game.hillOffset, 0.002 * playerSegment.curve * (game.position - startPosition) / SEGMENT_LENGTH, 1);
      game.treeOffset = increase(game.treeOffset, 0.003 * playerSegment.curve * (game.position - startPosition) / SEGMENT_LENGTH, 1);

      if (game.position > game.playerZ) {
        if (game.currentLapTime && (startPosition < game.playerZ)) {
          game.lastLapTime = game.currentLapTime;
          game.currentLapTime = 0;
          setLastLapTime(game.lastLapTime);
          const savedFast = localStorage.getItem("racerFastLapTime");
          const currentFast = savedFast ? parseFloat(savedFast) : 180;
          if (game.lastLapTime <= currentFast) {
            localStorage.setItem("racerFastLapTime", game.lastLapTime.toString());
            setFastLapTime(game.lastLapTime);
          }
        } else {
          game.currentLapTime += dt;
        }
      }

      setCurrentSpeed(Math.round(game.speed / 100));
      setCurrentLapTime(game.currentLapTime);
    };

    const render = () => {
      if (!game.background || !game.sprites || game.segments.length === 0) return;
      const isDark = document.documentElement.classList.contains("dark");
      const COLORS = getColors(isDark);

      const baseSegment = findSegment(game.position);
      const basePercent = percentRemaining(game.position, SEGMENT_LENGTH);
      const playerSegment = findSegment(game.position + game.playerZ);
      const playerPercent = percentRemaining(game.position + game.playerZ, SEGMENT_LENGTH);
      const playerY = interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
      let maxy = CANVAS_HEIGHT;
      let x = 0, dx = -(baseSegment.curve * basePercent);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      renderBackground(ctx, game.background, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND.SKY, game.skyOffset, game.resolution * 0.001 * playerY);
      renderBackground(ctx, game.background, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND.HILLS, game.hillOffset, game.resolution * 0.002 * playerY);
      renderBackground(ctx, game.background, CANVAS_WIDTH, CANVAS_HEIGHT, BACKGROUND.TREES, game.treeOffset, game.resolution * 0.003 * playerY);

      for (let n = 0; n < DRAW_DISTANCE; n++) {
        const segment = game.segments[(baseSegment.index + n) % game.segments.length];
        segment.looped = segment.index < baseSegment.index;
        segment.fog = exponentialFog(n / DRAW_DISTANCE, FOG_DENSITY);
        segment.clip = maxy;

        project(segment.p1, (game.playerX * ROAD_WIDTH) - x, playerY + CAMERA_HEIGHT, game.position - (segment.looped ? game.trackLength : 0), game.cameraDepth, CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_WIDTH);
        project(segment.p2, (game.playerX * ROAD_WIDTH) - x - dx, playerY + CAMERA_HEIGHT, game.position - (segment.looped ? game.trackLength : 0), game.cameraDepth, CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_WIDTH);

        x = x + dx;
        dx = dx + segment.curve;

        if ((segment.p1.camera.z! <= game.cameraDepth) || (segment.p2.screen.y! >= segment.p1.screen.y!) || (segment.p2.screen.y! >= maxy)) continue;

        ctx.fillStyle = COLORS.FOG;
        renderSegment(ctx, CANVAS_WIDTH, LANES, segment.p1.screen.x!, segment.p1.screen.y!, segment.p1.screen.w!, segment.p2.screen.x!, segment.p2.screen.y!, segment.p2.screen.w!, segment.fog, segment.color);
        maxy = segment.p1.screen.y!;
      }

      for (let n = (DRAW_DISTANCE - 1); n > 0; n--) {
        const segment = game.segments[(baseSegment.index + n) % game.segments.length];
        for (const car of segment.cars) {
          const spriteScale = interpolate(segment.p1.screen.scale!, segment.p2.screen.scale!, car.percent || 0);
          const spriteX = interpolate(segment.p1.screen.x!, segment.p2.screen.x!, car.percent || 0) + (spriteScale * car.offset * ROAD_WIDTH * CANVAS_WIDTH / 2);
          const spriteY = interpolate(segment.p1.screen.y!, segment.p2.screen.y!, car.percent || 0);
          renderSprite(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, game.resolution, ROAD_WIDTH, game.sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
        }
        for (const spriteObj of segment.sprites) {
          const spriteScale = segment.p1.screen.scale!;
          const spriteX = segment.p1.screen.x! + (spriteScale * spriteObj.offset * ROAD_WIDTH * CANVAS_WIDTH / 2);
          const spriteY = segment.p1.screen.y!;
          renderSprite(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, game.resolution, ROAD_WIDTH, game.sprites, spriteObj.source, spriteScale, spriteX, spriteY, (spriteObj.offset < 0 ? -1 : 0), -1, segment.clip);
        }
        if (segment === playerSegment) {
          renderPlayer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, game.resolution, ROAD_WIDTH, game.sprites, game.speed / MAX_SPEED, game.cameraDepth / game.playerZ, CANVAS_WIDTH / 2,
            (CANVAS_HEIGHT / 2) - (game.cameraDepth / game.playerZ * interpolate(playerSegment.p1.camera.y!, playerSegment.p2.camera.y!, playerPercent) * CANVAS_HEIGHT / 2),
            game.speed * (game.keyLeft ? -1 : game.keyRight ? 1 : 0), playerSegment.p2.world.y - playerSegment.p1.world.y);
        }
      }
    };

    const gameLoop = () => {
      const now = timestamp();
      const dt = Math.min(1, (now - lastTime) / 1000);
      gdt = gdt + dt;

      if (gameState === "playing") {
        while (gdt > STEP) { gdt -= STEP; update(STEP); }
      }

      if (game.imagesLoaded) {
        if (gameState === "waiting") {
          const isDark = document.documentElement.classList.contains("dark");
          ctx.fillStyle = isDark ? "#171717" : "#ffffff";
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.fillStyle = isDark ? "#e5e5e5" : "#535353";
          ctx.font = "bold 28px monospace";
          ctx.textAlign = "center";
          ctx.fillText("RETRO RACER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
          ctx.font = "16px monospace";
          ctx.fillText("Click the screen to play", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
          ctx.font = "14px monospace";
          ctx.fillStyle = isDark ? "#888888" : "#777777";
          ctx.fillText("WASD or Arrow Keys to drive", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        } else {
          render();
        }
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        ctx.fillStyle = isDark ? "#171717" : "#ffffff";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = isDark ? "#e5e5e5" : "#535353";
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Loading...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      lastTime = now;
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  const formatTime = (dt: number) => {
    const minutes = Math.floor(dt / 60);
    const seconds = Math.floor(dt - (minutes * 60));
    const tenths = Math.floor(10 * (dt - Math.floor(dt)));
    return minutes > 0 ? `${minutes}.${seconds < 10 ? "0" : ""}${seconds}.${tenths}` : `${seconds}.${tenths}`;
  };

  return (
    <section className="mt-10 sm:mt-14" data-section="game">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-3 font-medium text-gray-800 dark:text-neutral-200">
          Take a Break
        </h2>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            {isZoomed ? "WASD or Arrow Keys to drive" : "Click the monitor to play"}
          </p>
          <div className="flex gap-2">
            {isZoomed && (
              <LiquidGlassButton onClick={() => setIsZoomed(false)} size="sm">
                <Minimize2 className="size-3" />
                Zoom Out
              </LiquidGlassButton>
            )}
            {gameState === "playing" && (
              <LiquidGlassButton onClick={() => { setGameState("waiting"); setIsZoomed(false); }} size="sm">
                <RotateCcw className="size-3" />
                Reset
              </LiquidGlassButton>
            )}
          </div>
        </div>

        {/* 3D Canvas Container */}
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700 bg-gradient-to-b from-neutral-900 to-neutral-950">
          {/* Offscreen game canvas (hidden) */}
          <canvas
            ref={offscreenCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="hidden"
          />

          {/* 3D Scene */}
          <Canvas
            camera={{ position: [0.3, 0.8, 4.5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.4} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <pointLight position={[-5, 3, -5]} intensity={0.3} color="#4488ff" />
              <spotLight
                position={[0, 5, 3]}
                angle={0.4}
                penumbra={0.5}
                intensity={0.6}
                castShadow
              />

              <RetroPC
                gameCanvasRef={offscreenCanvasRef}
                isZoomed={isZoomed}
                onScreenClick={handleScreenClick}
              />
            </Suspense>
          </Canvas>

          {/* HUD Overlay when zoomed and playing */}
          {isZoomed && gameState === "playing" && (
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start text-xs font-mono pointer-events-none">
              <div className="bg-black/60 text-white px-2 py-1 rounded backdrop-blur-sm">
                {currentSpeed} mph
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="bg-black/60 text-white px-2 py-1 rounded backdrop-blur-sm">
                  Time: {formatTime(currentLapTime)}
                </div>
                {lastLapTime !== null && (
                  <div className="bg-black/60 text-white px-2 py-1 rounded backdrop-blur-sm">
                    Last: {formatTime(lastLapTime)}
                  </div>
                )}
                {fastLapTime !== null && (
                  <div className="bg-black/60 text-green-400 px-2 py-1 rounded backdrop-blur-sm">
                    Best: {formatTime(fastLapTime)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Click hint when not zoomed */}
          {!isZoomed && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/60 font-mono pointer-events-none">
              Click the screen to play
            </div>
          )}
        </div>

        {fastLapTime !== null && gameState !== "playing" && (
          <div className="mt-2 text-right text-xs text-gray-400 dark:text-neutral-600 font-mono">
            Best Lap: {formatTime(fastLapTime)}
          </div>
        )}
      </div>
    </section>
  );
}
