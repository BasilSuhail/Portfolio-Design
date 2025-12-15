import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Play, RotateCcw } from "lucide-react";

export default function GameSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const gameStateRef = useRef<any>(null);

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("spaceRunnerHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize game when expanded
  useEffect(() => {
    if (!isExpanded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = Math.min(500, window.innerHeight * 0.6);
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Game state
    const gameState = {
      player: {
        x: 100,
        y: canvas.height / 2,
        width: 40,
        height: 30,
        speed: 5,
        velocityY: 0,
        trail: [] as { x: number; y: number; alpha: number }[],
      },
      obstacles: [] as { x: number; y: number; width: number; height: number; speed: number; rotation: number }[],
      particles: [] as { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[],
      stars: [] as { x: number; y: number; size: number; speed: number }[],
      score: 0,
      isAnimating: true,
      keysPressed: new Set<string>(),
      touchY: null as number | null,
    };

    gameStateRef.current = gameState;

    // Initialize stars for background
    for (let i = 0; i < 50; i++) {
      gameState.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
      });
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "w", "s", "W", "S"].includes(e.key)) {
        e.preventDefault();
        gameState.keysPressed.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.keysPressed.delete(e.key.toLowerCase());
    };

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      gameState.touchY = touch.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      gameState.touchY = touch.clientY - rect.top;
    };

    const handleTouchEnd = () => {
      gameState.touchY = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    // Draw spaceship
    const drawShip = (x: number, y: number, rotation = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Ship body (gray triangle)
      ctx.fillStyle = "#9ca3af";
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();

      // Cockpit (blue)
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(5, -6);
      ctx.lineTo(5, 6);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      if (!gameState.isAnimating || gameStarted) {
        ctx.fillStyle = `rgba(251, 191, 36, ${0.6 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(-10, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Draw asteroid
    const drawAsteroid = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      ctx.strokeStyle = "#78716c";
      ctx.fillStyle = "#57534e";
      ctx.lineWidth = 2;

      const points = 8;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = size * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // Game loop
    const update = () => {
      const { player, obstacles, particles, stars } = gameState;

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars.forEach((star) => {
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;

        ctx.fillStyle = `rgba(255, 255, 255, ${star.size / 3})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Handle player movement
      if (gameStarted && !gameOver) {
        // Keyboard controls
        if (gameState.keysPressed.has("arrowup") || gameState.keysPressed.has("w")) {
          player.velocityY = -player.speed;
        } else if (gameState.keysPressed.has("arrowdown") || gameState.keysPressed.has("s")) {
          player.velocityY = player.speed;
        } else {
          player.velocityY *= 0.9; // Smooth deceleration
        }

        // Touch controls
        if (gameState.touchY !== null) {
          const targetY = gameState.touchY;
          const diff = targetY - player.y;
          player.velocityY = diff * 0.1;
        }

        player.y += player.velocityY;

        // Boundary check
        if (player.y < player.height / 2) player.y = player.height / 2;
        if (player.y > canvas.height - player.height / 2)
          player.y = canvas.height - player.height / 2;

        // Add trail
        player.trail.push({ x: player.x, y: player.y, alpha: 1 });
        if (player.trail.length > 10) player.trail.shift();

        // Update trail alpha
        player.trail.forEach((t, i) => {
          t.alpha = i / player.trail.length;
        });

        // Spawn obstacles
        if (Math.random() < 0.02) {
          obstacles.push({
            x: canvas.width + 50,
            y: Math.random() * canvas.height,
            width: 30 + Math.random() * 30,
            height: 30 + Math.random() * 30,
            speed: 3 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
          });
        }

        // Update obstacles
        obstacles.forEach((obs, index) => {
          obs.x -= obs.speed;
          obs.rotation += 0.02;

          // Remove off-screen obstacles
          if (obs.x < -100) {
            obstacles.splice(index, 1);
            gameState.score += 10;
            setScore(gameState.score);
          }

          // Collision detection
          const dx = player.x - obs.x;
          const dy = player.y - obs.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < (obs.width / 2 + player.width / 2)) {
            // Game over - create explosion particles
            for (let i = 0; i < 30; i++) {
              particles.push({
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                alpha: 1,
                size: Math.random() * 4 + 2,
              });
            }
            setGameOver(true);

            // Update high score
            if (gameState.score > highScore) {
              setHighScore(gameState.score);
              localStorage.setItem("spaceRunnerHighScore", gameState.score.toString());
            }
          }
        });
      }

      // Idle animation (ship wobbles)
      if (gameState.isAnimating && !gameStarted) {
        player.y = canvas.height / 2 + Math.sin(Date.now() / 500) * 20;
      }

      // Draw trail
      player.trail.forEach((t) => {
        ctx.fillStyle = `rgba(96, 165, 250, ${t.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(t.x - 15, t.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw player
      drawShip(player.x, player.y);

      // Draw obstacles
      obstacles.forEach((obs) => {
        drawAsteroid(obs.x, obs.y, obs.width / 2, obs.rotation);
      });

      // Update and draw particles
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.vy += 0.2; // Gravity

        if (p.alpha <= 0) {
          particles.splice(index, 1);
          return;
        }

        ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw score
      if (gameStarted) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px 'JetBrains Mono', monospace";
        ctx.fillText(`Score: ${gameState.score}`, 20, 40);
      }

      // Draw start message
      if (!gameStarted && !gameOver) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "20px 'Open Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Press START to play", canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText("Use ↑↓ or W/S keys to move", canvas.width / 2, canvas.height / 2 + 90);
        ctx.textAlign = "left";
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isExpanded, gameStarted, gameOver, highScore]);

  const handleStart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.isAnimating = false;
      gameStateRef.current.obstacles = [];
      gameStateRef.current.particles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.player.trail = [];
      if (canvasRef.current) {
        gameStateRef.current.player.y = canvasRef.current.height / 2;
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
      gameStateRef.current.particles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.player.trail = [];
      if (canvasRef.current) {
        gameStateRef.current.player.y = canvasRef.current.height / 2;
      }
    }
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  return (
    <section className="py-16 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
              GAME
            </span>
            <h2 className="text-2xl font-semibold mb-2">Fancy a game?</h2>
            <p className="text-foreground/80 text-sm">
              Take a break and try this retro space runner game
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                Hide <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border bg-black">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ display: "block" }}
              />
              {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center space-y-4">
                    <h3 className="text-3xl font-bold text-white">Game Over!</h3>
                    <p className="text-xl text-white">Score: {score}</p>
                    {score === highScore && score > 0 && (
                      <p className="text-amber-400 text-sm">New High Score!</p>
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
                <span>High Score: {highScore}</span>
                {gameStarted && !gameOver && <span>Current: {score}</span>}
              </div>
              {!gameStarted && !gameOver && (
                <Button onClick={handleStart} className="gap-2">
                  <Play className="w-4 h-4" />
                  Start Game
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
