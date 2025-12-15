import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Terminal } from "lucide-react";

// --- PIXEL ART ASSETS (Bitmaps) ---
// 1 = Pixel drawn, 0 = Empty
const SPRITES = {
  DINO_RUN_1: [
    [0,0,0,0,0,1,1,1,1,0],
    [0,0,0,0,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,1,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,0],
  ],
  DINO_RUN_2: [
    [0,0,0,0,0,1,1,1,1,0],
    [0,0,0,0,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,0,1,0,0,1,0,0],
    [0,0,0,0,1,0,0,1,0,0],
  ],
  CACTUS_SMALL: [
    [0,0,1,0,0,1,0],
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
  ],
  CACTUS_LARGE: [
    [0,0,0,1,1,0,0,0],
    [0,1,0,1,1,0,0,0],
    [1,1,1,1,1,0,0,0],
    [1,1,1,1,1,0,1,1],
    [0,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
  ]
};

export default function GameSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game Logic State
  const [isPlayingUser, setIsPlayingUser] = useState(false); // False = Auto Mode
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    // Load High Score
    const saved = localStorage.getItem("pixelRunnerHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    // --- CONFIG ---
    const SCALE = 4; // Size of each "pixel"
    const GROUND_Y = 160;

    // Physics
    const GRAVITY = 0.6;
    const JUMP_FORCE = -11;
    const BASE_SPEED = 5;

    const state = {
      gameActive: true,
      mode: 'AUTO' as 'AUTO' | 'USER',
      speed: BASE_SPEED,
      score: 0,
      theme: { text: '#000000', bg: '#ffffff' }, // Will update automatically
      player: {
        x: 40,
        y: 0,
        vy: 0,
        width: 10 * SCALE,
        height: 10 * SCALE,
        isGrounded: true,
        runFrame: 0,
      },
      obstacles: [] as Array<{
        x: number;
        y: number;
        type: 'SMALL' | 'LARGE';
        width: number;
        height: number;
        passed: boolean;
      }>
    };

    // Update state based on React prop
    state.mode = isPlayingUser ? 'USER' : 'AUTO';

    // --- HELPER: Draw 2D Binary Arrays ---
    const drawSprite = (
      sprite: number[][],
      x: number,
      y: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      sprite.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
          if (pixel === 1) {
            ctx.fillRect(
              x + colIndex * SCALE,
              y + rowIndex * SCALE,
              SCALE,
              SCALE
            );
          }
        });
      });
    };

    const resetGame = () => {
      state.score = 0;
      state.speed = BASE_SPEED;
      state.obstacles = [];
      state.gameActive = true;
      state.player.y = GROUND_Y - state.player.height;
      state.player.vy = 0;
      setScore(0);
    };

    const jump = () => {
      if (state.player.isGrounded) {
        state.player.vy = JUMP_FORCE;
        state.player.isGrounded = false;
      }
    };

    // --- MAIN LOOP ---
    const render = () => {
      // 1. Theme Detection (Checks every frame for seamless transition)
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // You can also check for a class on the document body if you use manual toggling
      const isDarkClass = document.documentElement.classList.contains('dark');

      if (isDark || isDarkClass) {
        state.theme = { text: '#22c55e', bg: '#0f172a' }; // Tailwind: Green-500 / Slate-900
      } else {
        state.theme = { text: '#1a1a1a', bg: '#f8fafc' }; // Tailwind: Gray-900 / Slate-50
      }

      // 2. Clear Canvas
      ctx.fillStyle = state.theme.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!state.gameActive) {
        // Static render if game over
        animationId = requestAnimationFrame(render);
        return;
      }

      // 3. Update Player Physics
      state.player.vy += GRAVITY;
      state.player.y += state.player.vy;

      // Ground Collision
      const floorY = GROUND_Y - state.player.height;
      if (state.player.y >= floorY) {
        state.player.y = floorY;
        state.player.vy = 0;
        state.player.isGrounded = true;
      }

      // 4. AI Auto-Pilot Logic
      if (state.mode === 'AUTO') {
        const nextObs = state.obstacles.find(o => o.x > state.player.x);
        if (nextObs) {
          const dist = nextObs.x - state.player.x;
          // Calculate jump based on speed (Lookahead)
          const jumpDist = state.speed * 16;
          if (dist < jumpDist && dist > 0 && state.player.isGrounded) {
            jump();
          }
        }
      }

      // 5. Spawn Obstacles
      frame++;
      // Spawn rate decreases as speed increases
      const currentSpawnRate = Math.max(60, 100 - (state.speed * 2));

      if (frame % Math.floor(currentSpawnRate) === 0) {
        if (Math.random() > 0.3) {
          const type = Math.random() > 0.6 ? 'LARGE' : 'SMALL';
          const sprite = type === 'LARGE' ? SPRITES.CACTUS_LARGE : SPRITES.CACTUS_SMALL;
          state.obstacles.push({
            x: canvas.width,
            y: GROUND_Y - (sprite.length * SCALE),
            type: type,
            width: sprite[0].length * SCALE,
            height: sprite.length * SCALE,
            passed: false
          });
        }
      }

      // 6. Update & Draw Obstacles
      // Clean up off-screen
      state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > -50);

      state.obstacles.forEach(obs => {
        obs.x -= state.speed;

        // Draw Cactus
        const sprite = obs.type === 'LARGE' ? SPRITES.CACTUS_LARGE : SPRITES.CACTUS_SMALL;
        drawSprite(sprite, obs.x, obs.y, state.theme.text);

        // Collision Check
        const hitboxPadding = 8; // Forgiveness padding
        if (
          state.player.x < obs.x + obs.width - hitboxPadding &&
          state.player.x + state.player.width > obs.x + hitboxPadding &&
          state.player.y < obs.y + obs.height - hitboxPadding &&
          state.player.y + state.player.height > obs.y + hitboxPadding
        ) {
          if (state.mode === 'USER') {
            state.gameActive = false;
            setGameOver(true);
            if (state.score > highScore) {
              setHighScore(Math.floor(state.score));
              localStorage.setItem("pixelRunnerHighScore", Math.floor(state.score).toString());
            }
          } else {
            // AI Invincibility cheat (prevents glitching)
            obs.passed = true;
          }
        }

        // Score
        if (!obs.passed && obs.x + obs.width < state.player.x) {
          obs.passed = true;
          if (state.mode === 'USER') {
             state.score += 1;
             setScore(Math.floor(state.score));
          }
        }
      });

      // 7. Draw Player (Animation Cycle)
      // Cycle frames every 10 ticks
      const isRun1 = Math.floor(frame / 8) % 2 === 0;
      const playerSprite = state.player.isGrounded
        ? (isRun1 ? SPRITES.DINO_RUN_1 : SPRITES.DINO_RUN_2)
        : SPRITES.DINO_RUN_1; // Jump pose (could add specific sprite)

      drawSprite(playerSprite, state.player.x, state.player.y, state.theme.text);

      // 8. Draw Ground Line
      ctx.fillStyle = state.theme.text;
      ctx.fillRect(0, GROUND_Y, canvas.width, 2);

      // Speed up slightly
      if (state.mode === 'USER') state.speed += 0.001;
      else state.speed = BASE_SPEED; // Constant speed for AI to look clean

      animationId = requestAnimationFrame(render);
    };

    // --- INIT ---
    // Handle High DPI
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 200 * dpr; // Fixed height
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `200px`;
      ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    render();

    // --- INPUT HANDLERS ---
    const handleInput = (e?: KeyboardEvent) => {
      e?.preventDefault();

      if (gameOver) {
        setGameOver(false);
        setIsPlayingUser(true);
        resetGame();
        return;
      }

      if (!isPlayingUser) {
        setIsPlayingUser(true);
        resetGame(); // Start fresh for fairness
        return;
      }

      jump();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") handleInput(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [isPlayingUser, gameOver, highScore]);

  return (
    <section className="w-full border-t border-border bg-background py-10 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-6">

        {/* Header Information */}
        <div className="mb-4 flex items-end justify-between font-mono">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Terminal className="h-4 w-4" />
              <h2 className="text-sm font-bold tracking-widest uppercase">
                {isPlayingUser ? "MANUAL OVERRIDE" : "AUTO-PILOT ENABLED"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPlayingUser ? "Avoid obstacles. Speed increases over time." : "System currently idle. Waiting for input."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-muted-foreground">High Score</div>
            <div className="text-xl font-bold text-foreground">{highScore.toString().padStart(5, '0')}</div>
          </div>
        </div>

        {/* Game Container */}
        <div
          ref={containerRef}
          onClick={() => {
            if (!isPlayingUser) setIsPlayingUser(true);
            else if (gameOver) {
                setGameOver(false);
                setIsPlayingUser(true);
            }
            // Note: Jump is handled by window listener to prevent double triggers
          }}
          className="relative w-full overflow-hidden rounded-md border border-border bg-card shadow-sm transition-all hover:border-primary/50 cursor-pointer"
          style={{ height: '200px' }}
        >
          <canvas ref={canvasRef} className="block h-full w-full" />

          {/* Overlay: Attract Mode */}
          {!isPlayingUser && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[2px]">
              <Button
                variant="secondary"
                className="animate-bounce shadow-lg font-mono tracking-widest gap-2"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayingUser(true);
                }}
              >
                <Play className="h-4 w-4 fill-current" />
                START GAME
              </Button>
            </div>
          )}

          {/* Overlay: Game Over */}
          {gameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <h3 className="mb-2 font-mono text-3xl font-black text-foreground">GAME OVER</h3>
              <p className="mb-6 font-mono text-lg text-muted-foreground">SCORE: {score}</p>
              <Button
                onClick={(e) => {
                    e.stopPropagation();
                    setGameOver(false);
                    setIsPlayingUser(true);
                }}
              >
                TRY AGAIN
              </Button>
            </div>
          )}

          {/* Score HUD */}
          {isPlayingUser && !gameOver && (
            <div className="absolute right-4 top-4 font-mono text-2xl font-bold text-foreground/20 select-none">
              {score.toString().padStart(5, '0')}
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
           <span>v1.0.4 // STABLE</span>
           <span>SPACE to JUMP</span>
        </div>

      </div>
    </section>
  );
}
