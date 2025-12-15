import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

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
    const BASE_SPEED = 6;

    const state = {
      gameActive: true,
      mode: 'AUTO' as 'AUTO' | 'USER',
      speed: BASE_SPEED,
      score: 0,
      theme: { text: '#535353', bg: '#ffffff' }, // Chrome Dino colors
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
      // 1. Theme Detection - Google Chrome Dino style
      const isDarkClass = document.documentElement.classList.contains('dark');

      if (isDarkClass) {
        // Dark mode: White dino on dark background (inverted)
        state.theme = { text: '#ffffff', bg: '#0a0a0a' };
      } else {
        // Light mode: Dark gray dino on white background (original Chrome)
        state.theme = { text: '#535353', bg: '#ffffff' };
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
          // Calculate jump based on current speed (dynamic lookahead)
          const jumpDist = state.speed * 15;
          if (dist < jumpDist && dist > 0 && state.player.isGrounded) {
            jump();
          }
        }
      }

      // 5. Spawn Obstacles - MORE FREQUENT
      frame++;
      // Much more aggressive spawning
      const currentSpawnRate = Math.max(40, 70 - Math.floor(state.speed * 1.5));

      if (frame % Math.floor(currentSpawnRate) === 0) {
        // 80% spawn chance (was 70%)
        if (Math.random() > 0.2) {
          const type = Math.random() > 0.5 ? 'LARGE' : 'SMALL';
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
        const hitboxPadding = 6; // Slightly tighter for more challenge
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
      const isRun1 = Math.floor(frame / 8) % 2 === 0;
      const playerSprite = state.player.isGrounded
        ? (isRun1 ? SPRITES.DINO_RUN_1 : SPRITES.DINO_RUN_2)
        : SPRITES.DINO_RUN_1;

      drawSprite(playerSprite, state.player.x, state.player.y, state.theme.text);

      // 8. Draw Ground Line
      ctx.fillStyle = state.theme.text;
      ctx.fillRect(0, GROUND_Y, canvas.width, 2);

      // Speed up progressively - FASTER ACCELERATION
      if (state.mode === 'USER') {
        state.speed += 0.005; // Increased from 0.001
        // Cap at reasonable max
        if (state.speed > 15) state.speed = 15;
      } else {
        state.speed = BASE_SPEED; // Constant speed for AI to look clean
      }

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
    <section className="py-16 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">

        {/* Minimal Header */}
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-foreground/80">Want to play?</p>
          {!isPlayingUser && !gameOver && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPlayingUser(true)}
              className="gap-2"
            >
              <Play className="h-3 w-3" />
              Start
            </Button>
          )}
        </div>

        {/* Game Container */}
        <div
          ref={containerRef}
          onClick={() => {
            if (gameOver) {
              setGameOver(false);
              setIsPlayingUser(true);
            }
          }}
          className="relative w-full overflow-hidden rounded-lg border border-border bg-background cursor-pointer"
          style={{ height: '200px' }}
        >
          <canvas ref={canvasRef} className="block h-full w-full" />

          {/* Overlay: Game Over */}
          {gameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95">
              <h3 className="mb-2 text-2xl font-bold text-foreground">Game Over</h3>
              <p className="mb-4 text-muted-foreground">Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="mb-4 text-sm text-primary">New High Score!</p>
              )}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setGameOver(false);
                  setIsPlayingUser(true);
                }}
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Score HUD - Minimal */}
          {isPlayingUser && !gameOver && (
            <div className="absolute right-4 top-4 text-lg font-mono text-foreground/30 select-none">
              {score.toString().padStart(5, '0')}
            </div>
          )}
        </div>

        {/* High Score - Minimal */}
        {highScore > 0 && (
          <div className="mt-2 text-right text-xs text-muted-foreground font-mono">
            HI {highScore.toString().padStart(5, '0')}
          </div>
        )}

      </div>
    </section>
  );
}
