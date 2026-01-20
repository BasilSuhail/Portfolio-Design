import { useEffect, useRef, useState, useCallback } from "react";
import { Play, RotateCcw } from "lucide-react";

// Game constants - tuned to match Chrome Dino
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 200;
const GROUND_Y = 160;
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const INITIAL_SPEED = 6;
const MAX_SPEED = 13;
const ACCELERATION = 0.001;

// Dino dimensions
const DINO_WIDTH = 44;
const DINO_HEIGHT = 47;
const DINO_X = 50;

// Cactus types with proper sizing
const CACTUS_TYPES = [
  { w: 17, h: 35, y: GROUND_Y - 35 },   // Small single
  { w: 34, h: 35, y: GROUND_Y - 35 },   // Small double
  { w: 51, h: 35, y: GROUND_Y - 35 },   // Small triple
  { w: 25, h: 50, y: GROUND_Y - 50 },   // Large single
  { w: 50, h: 50, y: GROUND_Y - 50 },   // Large double
];

interface Obstacle {
  x: number;
  type: typeof CACTUS_TYPES[number];
}

type GameState = "waiting" | "playing" | "gameover";

export default function GameSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game state ref
  const gameRef = useRef({
    dino: { y: GROUND_Y - DINO_HEIGHT, vy: 0, jumping: false },
    obstacles: [] as Obstacle[],
    speed: INITIAL_SPEED,
    score: 0,
    groundX: 0,
    frameCount: 0,
    nextObstacleDistance: 0,
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("chromeDinoHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.dino = { y: GROUND_Y - DINO_HEIGHT, vy: 0, jumping: false };
    game.obstacles = [];
    game.speed = INITIAL_SPEED;
    game.score = 0;
    game.groundX = 0;
    game.frameCount = 0;
    game.nextObstacleDistance = 300;
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (!game.dino.jumping) {
      game.dino.vy = JUMP_VELOCITY;
      game.dino.jumping = true;
    }
  }, []);

  const handleInput = useCallback(() => {
    if (gameState === "waiting") {
      resetGame();
      setGameState("playing");
      jump();
    } else if (gameState === "gameover") {
      resetGame();
      setGameState("playing");
    } else if (gameState === "playing") {
      jump();
    }
  }, [gameState, resetGame, jump]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let animationId: number;
    const game = gameRef.current;

    const gameLoop = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const fgColor = isDark ? "#e5e5e5" : "#535353";
      const bgColor = isDark ? "#171717" : "#ffffff";

      // Clear
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === "playing") {
        // Update dino physics
        game.dino.vy += GRAVITY;
        game.dino.y += game.dino.vy;

        // Ground collision
        if (game.dino.y >= GROUND_Y - DINO_HEIGHT) {
          game.dino.y = GROUND_Y - DINO_HEIGHT;
          game.dino.vy = 0;
          game.dino.jumping = false;
        }

        // Update speed
        if (game.speed < MAX_SPEED) {
          game.speed += ACCELERATION;
        }

        // Update score
        game.frameCount++;
        if (game.frameCount % 6 === 0) {
          game.score++;
          setScore(game.score);
        }

        // Move ground
        game.groundX -= game.speed;
        if (game.groundX <= -CANVAS_WIDTH) {
          game.groundX = 0;
        }

        // Spawn obstacles
        game.nextObstacleDistance -= game.speed;
        if (game.nextObstacleDistance <= 0) {
          const type = CACTUS_TYPES[Math.floor(Math.random() * CACTUS_TYPES.length)];
          game.obstacles.push({ x: CANVAS_WIDTH, type });
          // Random gap between 300-600 pixels, scales with speed
          game.nextObstacleDistance = 300 + Math.random() * 300;
        }

        // Update obstacles
        game.obstacles = game.obstacles.filter((obs) => {
          obs.x -= game.speed;
          return obs.x > -100;
        });

        // Collision detection
        const dinoBox = {
          x: DINO_X + 5,
          y: game.dino.y + 5,
          w: DINO_WIDTH - 10,
          h: DINO_HEIGHT - 5,
        };

        for (const obs of game.obstacles) {
          const obsBox = {
            x: obs.x + 2,
            y: obs.type.y + 2,
            w: obs.type.w - 4,
            h: obs.type.h - 4,
          };

          if (
            dinoBox.x < obsBox.x + obsBox.w &&
            dinoBox.x + dinoBox.w > obsBox.x &&
            dinoBox.y < obsBox.y + obsBox.h &&
            dinoBox.y + dinoBox.h > obsBox.y
          ) {
            setGameState("gameover");
            if (game.score > highScore) {
              setHighScore(game.score);
              localStorage.setItem("chromeDinoHighScore", game.score.toString());
            }
            break;
          }
        }
      }

      // Draw ground
      ctx.fillStyle = fgColor;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 1);

      // Draw ground texture
      for (let i = 0; i < 3; i++) {
        const x = game.groundX + i * CANVAS_WIDTH;
        for (let j = 0; j < 20; j++) {
          const dotX = x + j * 50 + (i % 2) * 25;
          if (dotX > -10 && dotX < CANVAS_WIDTH + 10) {
            ctx.fillRect(dotX, GROUND_Y + 5, 2, 1);
            ctx.fillRect(dotX + 20, GROUND_Y + 10, 3, 1);
          }
        }
      }

      // Draw dino (simple rectangle representation)
      ctx.fillStyle = fgColor;
      const dinoY = game.dino.y;

      // Body
      ctx.fillRect(DINO_X + 10, dinoY + 5, 25, 30);
      // Head
      ctx.fillRect(DINO_X + 20, dinoY, 24, 20);
      // Eye (inverted)
      ctx.fillStyle = bgColor;
      ctx.fillRect(DINO_X + 36, dinoY + 5, 4, 4);
      ctx.fillStyle = fgColor;
      // Legs (animated)
      if (gameState === "playing" && !game.dino.jumping) {
        if (Math.floor(game.frameCount / 5) % 2 === 0) {
          ctx.fillRect(DINO_X + 15, dinoY + 35, 6, 12);
          ctx.fillRect(DINO_X + 25, dinoY + 38, 6, 9);
        } else {
          ctx.fillRect(DINO_X + 15, dinoY + 38, 6, 9);
          ctx.fillRect(DINO_X + 25, dinoY + 35, 6, 12);
        }
      } else {
        ctx.fillRect(DINO_X + 15, dinoY + 35, 6, 12);
        ctx.fillRect(DINO_X + 25, dinoY + 35, 6, 12);
      }
      // Tail
      ctx.fillRect(DINO_X, dinoY + 15, 15, 10);
      ctx.fillRect(DINO_X - 5, dinoY + 10, 10, 8);

      // Draw obstacles (cacti)
      ctx.fillStyle = fgColor;
      for (const obs of game.obstacles) {
        // Simple cactus shape
        const cx = obs.x;
        const cy = obs.type.y;
        const cw = obs.type.w;
        const ch = obs.type.h;

        // Main stem
        ctx.fillRect(cx + cw / 2 - 4, cy, 8, ch);

        // Arms for larger cacti
        if (ch > 40) {
          ctx.fillRect(cx, cy + 10, cw / 2 - 4, 6);
          ctx.fillRect(cx, cy + 10, 6, 20);
          ctx.fillRect(cx + cw / 2 + 4, cy + 20, cw / 2 - 4, 6);
          ctx.fillRect(cx + cw - 6, cy + 15, 6, 15);
        } else if (cw > 20) {
          // Multiple small cacti
          for (let i = 0; i < Math.floor(cw / 17); i++) {
            ctx.fillRect(cx + i * 17 + 5, cy, 8, ch);
            ctx.fillRect(cx + i * 17, cy + 8, 6, 4);
            ctx.fillRect(cx + i * 17 + 12, cy + 12, 6, 4);
          }
        } else {
          // Single small cactus with arms
          ctx.fillRect(cx, cy + 8, 6, 4);
          ctx.fillRect(cx, cy + 8, 4, 12);
          ctx.fillRect(cx + cw - 6, cy + 12, 6, 4);
          ctx.fillRect(cx + cw - 4, cy + 12, 4, 10);
        }
      }

      // Draw score
      ctx.fillStyle = fgColor;
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "right";

      if (highScore > 0) {
        ctx.fillText(`HI ${highScore.toString().padStart(5, "0")}`, CANVAS_WIDTH - 100, 25);
      }
      ctx.fillText(game.score.toString().padStart(5, "0"), CANVAS_WIDTH - 20, 25);

      // Game over text
      if (gameState === "gameover") {
        ctx.textAlign = "center";
        ctx.font = "bold 24px monospace";
        ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, 80);
        ctx.font = "14px monospace";
        ctx.fillText("Press Space to restart", CANVAS_WIDTH / 2, 105);
      }

      // Waiting state
      if (gameState === "waiting") {
        ctx.textAlign = "center";
        ctx.font = "14px monospace";
        ctx.fillText("Press Space to start", CANVAS_WIDTH / 2, 100);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, highScore]);

  return (
    <section className="mt-10 sm:mt-14" data-section="game">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-3 font-medium text-gray-800 dark:text-neutral-200">
          Take a Break
        </h2>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            Press spacebar or tap to jump
          </p>
          {gameState === "waiting" && (
            <button
              onClick={handleInput}
              className="py-1.5 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
            >
              <Play className="size-3" />
              Start
            </button>
          )}
          {gameState === "gameover" && (
            <button
              onClick={handleInput}
              className="py-1.5 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
            >
              <RotateCcw className="size-3" />
              Retry
            </button>
          )}
        </div>

        <div
          onClick={handleInput}
          className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white cursor-pointer dark:border-neutral-700 dark:bg-neutral-900"
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block w-full"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {highScore > 0 && (
          <div className="mt-2 text-right text-xs text-gray-400 dark:text-neutral-600 font-mono">
            HI {highScore.toString().padStart(5, "0")}
          </div>
        )}
      </div>
    </section>
  );
}
