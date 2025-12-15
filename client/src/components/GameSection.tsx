import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";

export default function GameSection() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const gameStateRef = useRef<any>(null);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pixelShifterHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Colors
    const COLORS = {
      bg: "#050505",
      player: "#39ff14",
      floor: "#ffffff",
      obstacle: "#ff00ff",
      gap: "#050505",
    };

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        // Responsive height: larger on mobile
        const isMobile = window.innerWidth < 768;
        canvas.height = isMobile ? Math.min(400, window.innerHeight * 0.5) : 350;
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Prevent scroll on touch
    const preventScroll = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    canvas.addEventListener("touchstart", preventScroll, { passive: false });
    canvas.addEventListener("touchmove", preventScroll, { passive: false });

    // Game state
    const gameState = {
      player: {
        x: 100,
        y: 0,
        width: 30,
        height: 30,
        velocityY: 0,
        gravity: 0.8,
        jumpPower: -15,
        isOnGround: false,
        glitchTimer: 0,
      },
      floor: {
        y: 0, // Will be set based on canvas height
        height: 40,
      },
      obstacles: [] as Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: "block" | "gap";
        scored?: boolean;
      }>,
      speed: 6,
      baseSpeed: 6,
      distance: 0,
      score: 0,
      lastObstacleX: 0,
      difficultyTimer: 0,
      isAnimating: true,
      glitchActive: false,
      deathGlitchTimer: 0,
    };

    gameStateRef.current = gameState;

    // Set floor position
    gameState.floor.y = canvas.height - gameState.floor.height;
    gameState.player.y = gameState.floor.y - gameState.player.height;

    // Glitch effect functions
    const applyGlitch = (intensity = 1) => {
      const slices = Math.floor(5 * intensity);
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0);

      for (let i = 0; i < slices; i++) {
        const y = Math.random() * canvas.height;
        const h = Math.random() * 30 + 10;
        const offset = (Math.random() - 0.5) * 20 * intensity;

        ctx.drawImage(
          tempCanvas,
          0,
          y,
          canvas.width,
          h,
          offset,
          y,
          canvas.width,
          h
        );
      }

      // Digital noise
      if (intensity > 1) {
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? COLORS.player : COLORS.obstacle;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 50,
            Math.random() * 5
          );
          ctx.globalAlpha = 1;
        }
      }
    };

    const applyRGBSplit = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0);

      ctx.globalCompositeOperation = "screen";

      // Red channel
      ctx.globalAlpha = 0.5;
      ctx.drawImage(tempCanvas, -5, 0);

      // Blue channel
      ctx.drawImage(tempCanvas, 5, 0);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // Jump handler
    const jump = () => {
      if (gameState.isAnimating && !gameStarted) return;
      if (!gameStarted || gameOver) return;

      if (gameState.player.isOnGround) {
        gameState.player.velocityY = gameState.player.jumpPower;
        gameState.player.isOnGround = false;
        gameState.player.glitchTimer = 3; // Trigger glitch on jump
      }
    };

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => jump();
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleTouch);

    // Spawn obstacles
    const spawnObstacle = () => {
      const types = ["block", "gap"] as const;
      const type = types[Math.floor(Math.random() * types.length)];

      if (type === "block") {
        gameState.obstacles.push({
          x: canvas.width + 50,
          y: gameState.floor.y - 40,
          width: 30,
          height: 40,
          type: "block",
        });
      } else {
        // Gap
        gameState.obstacles.push({
          x: canvas.width + 50,
          y: gameState.floor.y,
          width: 80 + Math.random() * 40,
          height: gameState.floor.height,
          type: "gap",
        });
      }

      gameState.lastObstacleX = canvas.width + 50;
    };

    // Draw player with glitch trail
    const drawPlayer = () => {
      // Glitch trail
      if (gameState.player.glitchTimer > 0) {
        ctx.fillStyle = COLORS.player;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(
          gameState.player.x + (Math.random() - 0.5) * 4,
          gameState.player.y + (Math.random() - 0.5) * 4,
          gameState.player.width,
          gameState.player.height
        );
        ctx.globalAlpha = 1;
      }

      // Main player
      ctx.fillStyle = COLORS.player;
      ctx.fillRect(
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
      );

      // Pixel detail
      ctx.fillStyle = "#050505";
      ctx.fillRect(
        gameState.player.x + 10,
        gameState.player.y + 10,
        10,
        10
      );
    };

    // Game loop
    const update = () => {
      const { player, floor, obstacles } = gameState;

      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Idle animation
      if (gameState.isAnimating && !gameStarted) {
        const pulse = Math.sin(Date.now() / 200) * 5;
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(
          canvas.width / 2 - 15,
          canvas.height / 2 - 15 + pulse,
          30,
          30
        );

        // Animated text
        ctx.fillStyle = COLORS.player;
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("PRESS START", canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText("SPACE / TAP TO JUMP", canvas.width / 2, canvas.height / 2 + 90);
        ctx.textAlign = "left";

        gameLoopRef.current = requestAnimationFrame(update);
        return;
      }

      if (gameStarted && !gameOver) {
        // Update difficulty
        gameState.difficultyTimer++;
        if (gameState.difficultyTimer % 600 === 0) {
          // Every 10 seconds (at 60fps)
          gameState.speed = gameState.baseSpeed * (1 + gameState.difficultyTimer / 6000);
        }

        // Player physics
        player.velocityY += player.gravity;
        player.y += player.velocityY;

        // Ground collision
        if (player.y >= floor.y - player.height) {
          player.y = floor.y - player.height;
          player.velocityY = 0;
          player.isOnGround = true;
          if (player.glitchTimer === 0) {
            player.glitchTimer = 2; // Landing glitch
          }
        } else {
          player.isOnGround = false;
        }

        // Spawn obstacles
        if (
          obstacles.length === 0 ||
          gameState.lastObstacleX < canvas.width - 200 - Math.random() * 200
        ) {
          spawnObstacle();
        }

        // Update obstacles
        obstacles.forEach((obs, index) => {
          obs.x -= gameState.speed;

          // Scoring
          if (obs.x + obs.width < player.x && !obs.scored) {
            obs.scored = true;
            gameState.score += 10;
            gameState.distance++;
            setScore(gameState.score);
          }

          // Remove off-screen
          if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
          }

          // Collision detection
          if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x
          ) {
            if (obs.type === "block") {
              // Hit block
              if (
                player.y + player.height > obs.y &&
                player.y < obs.y + obs.height
              ) {
                gameState.deathGlitchTimer = 30;
                setGameOver(true);
                if (gameState.score > highScore) {
                  setHighScore(gameState.score);
                  localStorage.setItem("pixelShifterHighScore", gameState.score.toString());
                }
              }
            } else if (obs.type === "gap") {
              // Fell in gap
              if (player.isOnGround) {
                gameState.deathGlitchTimer = 30;
                setGameOver(true);
                if (gameState.score > highScore) {
                  setHighScore(gameState.score);
                  localStorage.setItem("pixelShifterHighScore", gameState.score.toString());
                }
              }
            }
          }
        });

        // Update glitch timer
        if (player.glitchTimer > 0) player.glitchTimer--;
      }

      // Draw floor
      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(0, floor.y, canvas.width, floor.height);

      // Draw floor pattern
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(x, floor.y + 5, 10, 5);
      }

      // Draw obstacles
      obstacles.forEach((obs) => {
        if (obs.type === "block") {
          ctx.fillStyle = COLORS.obstacle;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

          // Block detail
          ctx.fillStyle = COLORS.player;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(obs.x + 5, obs.y + 5, 5, 5);
          ctx.fillRect(obs.x + 15, obs.y + 15, 5, 5);
          ctx.globalAlpha = 1;
        } else {
          // Gap (draw as absence of floor)
          ctx.fillStyle = COLORS.gap;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      });

      // Draw player
      drawPlayer();

      // Draw score
      if (gameStarted) {
        ctx.fillStyle = COLORS.player;
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.fillText(`DISTANCE: ${Math.floor(gameState.distance)}`, 20, 35);
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 60);
      }

      // Apply glitch effects
      if (player.glitchTimer > 0) {
        applyGlitch(0.5);
      }

      // Death glitch
      if (gameState.deathGlitchTimer > 0) {
        gameState.deathGlitchTimer--;
        applyRGBSplit();
        applyGlitch(2);
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("touchstart", preventScroll);
      canvas.removeEventListener("touchmove", preventScroll);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, highScore]);

  const handleStart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.isAnimating = false;
      gameStateRef.current.obstacles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.distance = 0;
      gameStateRef.current.speed = gameStateRef.current.baseSpeed;
      gameStateRef.current.difficultyTimer = 0;
      gameStateRef.current.deathGlitchTimer = 0;
      gameStateRef.current.player.glitchTimer = 0;
      if (canvasRef.current) {
        const floor = gameStateRef.current.floor;
        gameStateRef.current.player.y = floor.y - gameStateRef.current.player.height;
        gameStateRef.current.player.velocityY = 0;
        gameStateRef.current.player.isOnGround = true;
      }
    }
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleRestart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.isAnimating = false;
      gameStateRef.current.obstacles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.distance = 0;
      gameStateRef.current.speed = gameStateRef.current.baseSpeed;
      gameStateRef.current.difficultyTimer = 0;
      gameStateRef.current.deathGlitchTimer = 0;
      gameStateRef.current.player.glitchTimer = 0;
      if (canvasRef.current) {
        const floor = gameStateRef.current.floor;
        gameStateRef.current.player.y = floor.y - gameStateRef.current.player.height;
        gameStateRef.current.player.velocityY = 0;
        gameStateRef.current.player.isOnGround = true;
      }
    }
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <section className="py-16 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-6">
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            GAME
          </span>
          <h2 className="text-2xl font-semibold mb-2">Fancy a game?</h2>
          <p className="text-foreground/80 text-sm">
            Pixel Shifter: A cyberpunk glitch runner
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border bg-black">
            <canvas
              ref={canvasRef}
              className="w-full h-auto cursor-pointer"
              style={{ display: "block" }}
            />
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center space-y-4">
                  <h3
                    className="text-3xl font-bold font-mono"
                    style={{ color: "#39ff14" }}
                  >
                    GAME OVER
                  </h3>
                  <p className="text-xl text-white font-mono">SCORE: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="text-sm font-mono" style={{ color: "#ff00ff" }}>
                      NEW HIGH SCORE!
                    </p>
                  )}
                  <Button onClick={handleRestart} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-muted-foreground font-mono">
              <span>HIGH SCORE: {highScore}</span>
              {gameStarted && !gameOver && <span>CURRENT: {score}</span>}
            </div>
            {!gameStarted && !gameOver && (
              <Button onClick={handleStart} className="gap-2">
                <Play className="w-4 h-4" />
                Start Game
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
