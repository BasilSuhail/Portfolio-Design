import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function GameSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const gameStateRef = useRef<any>(null);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cleanRunnerHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI canvas scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        const displayWidth = container.clientWidth;
        const displayHeight = Math.min(400, window.innerHeight * 0.5);

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        ctx.scale(dpr, dpr);

        if (gameStateRef.current) {
          gameStateRef.current.displayWidth = displayWidth;
          gameStateRef.current.displayHeight = displayHeight;
          gameStateRef.current.groundY = displayHeight - 60;
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Colors - Ultra-minimalist Swiss Design
    const COLORS = {
      bg: "#FFFFFF",
      fg: "#1a1a1a",
      player: "#1a1a1a",
      obstacle: "#1a1a1a",
      ground: "#1a1a1a",
      text: "#1a1a1a",
      textLight: "#666666",
    };

    // Game state
    const gameState = {
      displayWidth: canvas.style.width ? parseInt(canvas.style.width) : 800,
      displayHeight: canvas.style.height ? parseInt(canvas.style.height) : 400,
      groundY: 0,
      player: {
        x: 100,
        y: 0,
        width: 20,
        height: 20,
        velocityY: 0,
        isJumping: false,
        jumpPower: -16, // High jump force for fast gameplay
        gravity: 1.0, // Heavy gravity - drops like a rock
      },
      obstacles: [] as Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }>,
      score: 0,
      distance: 0,
      speed: 4,
      obstacleTimer: 0,
      obstacleInterval: 100,
      isAI: true, // AI mode by default (attract mode)
      aiJumpTimer: 0,
    };

    gameState.groundY = gameState.displayHeight - 60;
    gameState.player.y = gameState.groundY - gameState.player.height;
    gameStateRef.current = gameState;

    // Prevent scroll on touch/space
    const preventScroll = (e: TouchEvent | KeyboardEvent) => {
      if (e instanceof TouchEvent && e.target === canvas) {
        e.preventDefault();
      }
      if (e instanceof KeyboardEvent && e.code === "Space") {
        e.preventDefault();
      }
    };

    window.addEventListener("touchstart", preventScroll, { passive: false });
    window.addEventListener("keydown", preventScroll, { passive: false });

    // Input handlers
    const handleInput = () => {
      if (gameOver) return;

      // Take control from AI
      if (gameState.isAI) {
        gameState.isAI = false;
        setIsPlaying(true);
      }

      // Jump
      if (!gameState.player.isJumping) {
        gameState.player.velocityY = gameState.player.jumpPower;
        gameState.player.isJumping = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        handleInput();
      }
    };

    const handleClick = () => {
      handleInput();
    };

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleClick);

    // Spawn obstacle
    const spawnObstacle = () => {
      const types = [
        { width: 20, height: 30 }, // Tall thin
        { width: 30, height: 20 }, // Short wide
        { width: 25, height: 25 }, // Square
      ];
      const type = types[Math.floor(Math.random() * types.length)];

      gameState.obstacles.push({
        x: gameState.displayWidth + 50,
        y: gameState.groundY - type.height,
        width: type.width,
        height: type.height,
      });
    };

    // AI logic - perfect obstacle avoidance
    const updateAI = () => {
      if (!gameState.isAI) return;

      // Find nearest obstacle
      const nearestObstacle = gameState.obstacles
        .filter(obs => obs.x > gameState.player.x)
        .sort((a, b) => a.x - b.x)[0];

      if (nearestObstacle) {
        const distanceToObstacle = nearestObstacle.x - gameState.player.x;

        // Jump when obstacle is at optimal distance
        // Adjusted for heavier gravity and higher jump (140-165px range)
        if (distanceToObstacle < 165 && distanceToObstacle > 140 && !gameState.player.isJumping) {
          gameState.player.velocityY = gameState.player.jumpPower;
          gameState.player.isJumping = true;
        }
      }
    };

    // Collision detection
    const checkCollision = (rect1: any, rect2: any) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    };

    // Game loop
    const update = () => {
      const displayWidth = gameState.displayWidth;
      const displayHeight = gameState.displayHeight;

      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Draw ground line
      ctx.strokeStyle = COLORS.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, gameState.groundY);
      ctx.lineTo(displayWidth, gameState.groundY);
      ctx.stroke();

      // AI mode overlay
      if (gameState.isAI && !gameOver) {
        ctx.fillStyle = COLORS.textLight;
        ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CLICK OR TAP TO PLAY", displayWidth / 2, 35);
        ctx.textAlign = "left";
      }

      if (!gameOver) {
        // Update AI
        updateAI();

        // Update player physics
        gameState.player.velocityY += gameState.player.gravity;
        gameState.player.y += gameState.player.velocityY;

        // Ground collision
        if (gameState.player.y >= gameState.groundY - gameState.player.height) {
          gameState.player.y = gameState.groundY - gameState.player.height;
          gameState.player.velocityY = 0;
          gameState.player.isJumping = false;
        }

        // Spawn obstacles
        gameState.obstacleTimer++;
        if (gameState.obstacleTimer > gameState.obstacleInterval) {
          spawnObstacle();
          gameState.obstacleTimer = 0;

          // Gradually increase difficulty
          if (gameState.obstacleInterval > 50) {
            gameState.obstacleInterval -= 0.5;
          }
        }

        // Update obstacles
        gameState.obstacles.forEach((obs, index) => {
          obs.x -= gameState.speed;

          // Remove off-screen obstacles
          if (obs.x + obs.width < 0) {
            gameState.obstacles.splice(index, 1);

            // Only count score when player is in control
            if (!gameState.isAI) {
              gameState.score += 10;
              setScore(gameState.score);
            }
          }

          // Check collision
          if (checkCollision(gameState.player, obs)) {
            // Only game over when player is in control
            if (!gameState.isAI) {
              setGameOver(true);
              if (gameState.score > highScore) {
                setHighScore(gameState.score);
                localStorage.setItem("cleanRunnerHighScore", gameState.score.toString());
              }
            }
          }
        });

        // Gradually increase speed
        if (gameState.speed < 8) {
          gameState.speed += 0.002;
        }

        // Update distance
        gameState.distance += gameState.speed;
      }

      // Draw obstacles
      ctx.fillStyle = COLORS.obstacle;
      gameState.obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      });

      // Draw player
      ctx.fillStyle = COLORS.player;
      ctx.fillRect(
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
      );

      // Draw score (only when player is in control)
      if (!gameState.isAI) {
        ctx.fillStyle = COLORS.text;
        ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(`${gameState.score}`, 20, 30);
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", preventScroll);
      window.removeEventListener("keydown", preventScroll);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleClick);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameOver, highScore]);

  const handleRestart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.player.y = gameStateRef.current.groundY - gameStateRef.current.player.height;
      gameStateRef.current.player.velocityY = 0;
      gameStateRef.current.player.isJumping = false;
      gameStateRef.current.obstacles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.speed = 4;
      gameStateRef.current.obstacleTimer = 0;
      gameStateRef.current.obstacleInterval = 100;
      gameStateRef.current.isAI = true; // Return to AI mode
    }
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
  };

  return (
    <section className="py-16 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-6">
          <p className="text-foreground/80 text-sm">Fancy a game?</p>
        </div>

        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-auto cursor-pointer"
              style={{ display: "block" }}
            />
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/95">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>
                    GAME OVER
                  </h3>
                  <p className="text-xl" style={{ color: "#1a1a1a" }}>
                    SCORE: {score}
                  </p>
                  {score === highScore && score > 0 && (
                    <p className="text-sm" style={{ color: "#666666" }}>
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
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>HIGH SCORE: {highScore}</span>
              {isPlaying && !gameOver && <span>CURRENT: {score}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
