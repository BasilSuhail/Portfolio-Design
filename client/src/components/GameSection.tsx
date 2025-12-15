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
    const saved = localStorage.getItem("neonTempestHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Colors
    const COLORS = {
      bg: "#050505",
      player: "#00FFFF",
      enemy: "#FF00FF",
      grid: "#BF00FF",
      laser: "#00FFFF",
    };

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
      centerX: canvas.width / 2,
      centerY: canvas.height / 2,
      player: {
        angle: 0,
        rotation: 0,
        radius: Math.min(canvas.width, canvas.height) * 0.45,
      },
      enemies: [] as Array<{
        angle: number;
        depth: number;
        speed: number;
      }>,
      lasers: [] as Array<{
        angle: number;
        depth: number;
        speed: number;
      }>,
      particles: [] as Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
      }>,
      stars: [] as Array<{
        angle: number;
        depth: number;
        speed: number;
      }>,
      score: 0,
      spawnTimer: 0,
      keysPressed: new Set<string>(),
      touchX: null as number | null,
      screenShake: 0,
      shakeX: 0,
      shakeY: 0,
      isAnimating: true,
      autoFire: false,
      fireTimer: 0,
      tunnelSegments: 16,
      tunnelDepth: 10,
    };

    gameStateRef.current = gameState;

    // Initialize starfield
    for (let i = 0; i < 100; i++) {
      gameState.stars.push({
        angle: Math.random() * Math.PI * 2,
        depth: Math.random() * 400,
        speed: 0.5 + Math.random() * 1.5,
      });
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
        gameState.keysPressed.add(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.keysPressed.delete(e.code);
    };

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      gameState.touchX = touch.clientX - rect.left;
      gameState.autoFire = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      gameState.touchX = touch.clientX - rect.left;
    };

    const handleTouchEnd = () => {
      gameState.touchX = null;
      gameState.autoFire = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);

    // Helper: Project polar to screen
    const project = (angle: number, depth: number) => {
      const scale = 1 - depth / 500;
      const radius = gameState.player.radius * scale;
      return {
        x: gameState.centerX + Math.cos(angle) * radius,
        y: gameState.centerY + Math.sin(angle) * radius,
        scale: scale,
      };
    };

    // Draw tunnel grid
    const drawTunnel = () => {
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      ctx.shadowColor = COLORS.grid;

      // Radial lines
      for (let i = 0; i < gameState.tunnelSegments; i++) {
        const angle = (i / gameState.tunnelSegments) * Math.PI * 2;
        ctx.beginPath();
        const start = project(angle, 0);
        const end = project(angle, 400);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      // Circular rings
      for (let d = 0; d < 400; d += 50) {
        ctx.beginPath();
        for (let i = 0; i <= gameState.tunnelSegments; i++) {
          const angle = (i / gameState.tunnelSegments) * Math.PI * 2;
          const pos = project(angle, d);
          if (i === 0) ctx.moveTo(pos.x, pos.y);
          else ctx.lineTo(pos.x, pos.y);
        }
        ctx.stroke();
      }
    };

    // Draw player claw
    const drawPlayer = () => {
      const pos = project(gameState.player.angle, 400);
      ctx.strokeStyle = COLORS.player;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.player;

      ctx.beginPath();
      // Claw shape
      const size = 15;
      ctx.moveTo(pos.x - size, pos.y - size);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineTo(pos.x - size, pos.y + size);
      ctx.moveTo(pos.x + size, pos.y - size);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineTo(pos.x + size, pos.y + size);
      ctx.stroke();
    };

    // RGB Split effect
    const applyRGBSplit = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCtx.drawImage(canvas, 0, 0);

      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.5;
      ctx.drawImage(tempCanvas, -2, 0);
      ctx.drawImage(tempCanvas, 2, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // Spawn enemy
    const spawnEnemy = () => {
      const angle =
        (Math.floor(Math.random() * gameState.tunnelSegments) /
          gameState.tunnelSegments) *
        Math.PI *
        2;
      gameState.enemies.push({
        angle: angle,
        depth: 0,
        speed: 2 + Math.random(),
      });
    };

    // Fire laser
    const fireLaser = () => {
      gameState.lasers.push({
        angle: gameState.player.angle,
        depth: 400,
        speed: 8,
      });
    };

    // Create explosion particles
    const createExplosion = (angle: number, depth: number) => {
      const pos = project(angle, depth);
      for (let i = 0; i < 15; i++) {
        const speed = 2 + Math.random() * 3;
        const particleAngle = Math.random() * Math.PI * 2;
        gameState.particles.push({
          x: pos.x,
          y: pos.y,
          vx: Math.cos(particleAngle) * speed,
          vy: Math.sin(particleAngle) * speed,
          life: 30,
        });
      }
    };

    // Game loop
    const update = () => {
      // Update center based on canvas size
      gameState.centerX = canvas.width / 2;
      gameState.centerY = canvas.height / 2;
      gameState.player.radius = Math.min(canvas.width, canvas.height) * 0.45;

      // Screen shake
      if (gameState.screenShake > 0) {
        gameState.screenShake--;
        gameState.shakeX = (Math.random() - 0.5) * 10;
        gameState.shakeY = (Math.random() - 0.5) * 10;
      } else {
        gameState.shakeX = 0;
        gameState.shakeY = 0;
      }

      // Clear canvas
      ctx.save();
      ctx.translate(gameState.shakeX, gameState.shakeY);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starfield
      ctx.fillStyle = COLORS.grid;
      ctx.shadowBlur = 2;
      gameState.stars.forEach((star) => {
        star.depth += star.speed;
        if (star.depth > 400) {
          star.depth = 0;
          star.angle = Math.random() * Math.PI * 2;
        }
        const pos = project(star.angle, star.depth);
        ctx.globalAlpha = 0.3 * pos.scale;
        ctx.fillRect(pos.x, pos.y, 2, 2);
      });
      ctx.globalAlpha = 1;

      // Draw tunnel
      drawTunnel();

      // Idle animation
      if (gameState.isAnimating && !gameStarted) {
        gameState.player.angle = Math.sin(Date.now() / 1000) * 0.5;
        drawPlayer();

        ctx.fillStyle = COLORS.player;
        ctx.font = "24px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.player;
        ctx.fillText("NEON TEMPEST", canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.fillText("PRESS START", canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText("← → ARROWS / SPACE TO SHOOT", canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = "left";

        ctx.restore();
        gameLoopRef.current = requestAnimationFrame(update);
        return;
      }

      if (gameStarted && !gameOver) {
        // Player movement
        if (gameState.keysPressed.has("ArrowLeft")) {
          gameState.player.angle -= 0.08;
        }
        if (gameState.keysPressed.has("ArrowRight")) {
          gameState.player.angle += 0.08;
        }

        // Touch controls
        if (gameState.touchX !== null) {
          if (gameState.touchX < canvas.width / 3) {
            gameState.player.angle -= 0.08;
          } else if (gameState.touchX > (canvas.width * 2) / 3) {
            gameState.player.angle += 0.08;
          }
        }

        // Shooting
        if (gameState.keysPressed.has("Space")) {
          if (gameState.fireTimer === 0) {
            fireLaser();
            gameState.fireTimer = 10;
          }
        }

        // Auto-fire for mobile
        if (gameState.autoFire) {
          if (gameState.fireTimer === 0) {
            fireLaser();
            gameState.fireTimer = 10;
          }
        }

        if (gameState.fireTimer > 0) gameState.fireTimer--;

        // Spawn enemies
        gameState.spawnTimer++;
        if (gameState.spawnTimer > 60 - Math.min(gameState.score / 5, 40)) {
          spawnEnemy();
          gameState.spawnTimer = 0;
        }

        // Update enemies
        gameState.enemies.forEach((enemy, index) => {
          enemy.depth += enemy.speed;

          // Enemy reached player
          if (enemy.depth > 400) {
            const angleDiff = Math.abs(enemy.angle - gameState.player.angle);
            if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) {
              // Hit!
              gameState.screenShake = 20;
              createExplosion(enemy.angle, 400);
              setGameOver(true);
              if (gameState.score > highScore) {
                setHighScore(gameState.score);
                localStorage.setItem("neonTempestHighScore", gameState.score.toString());
              }
            }
            gameState.enemies.splice(index, 1);
          }
        });

        // Update lasers
        gameState.lasers.forEach((laser, index) => {
          laser.depth -= laser.speed;

          if (laser.depth < 0) {
            gameState.lasers.splice(index, 1);
          }

          // Check collision with enemies
          gameState.enemies.forEach((enemy, eIndex) => {
            const angleDiff = Math.abs(laser.angle - enemy.angle);
            const depthDiff = Math.abs(laser.depth - enemy.depth);
            if ((angleDiff < 0.2 || angleDiff > Math.PI * 2 - 0.2) && depthDiff < 30) {
              createExplosion(enemy.angle, enemy.depth);
              gameState.enemies.splice(eIndex, 1);
              gameState.lasers.splice(index, 1);
              gameState.score += 10;
              setScore(gameState.score);
            }
          });
        });

        // Update particles
        gameState.particles.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) {
            gameState.particles.splice(index, 1);
          }
        });
      }

      // Draw enemies
      ctx.strokeStyle = COLORS.enemy;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.enemy;
      gameState.enemies.forEach((enemy) => {
        const pos = project(enemy.angle, enemy.depth);
        const size = 10 * pos.scale;
        ctx.beginPath();
        ctx.moveTo(pos.x - size, pos.y - size);
        ctx.lineTo(pos.x + size, pos.y - size);
        ctx.lineTo(pos.x + size, pos.y + size);
        ctx.lineTo(pos.x - size, pos.y + size);
        ctx.closePath();
        ctx.stroke();
      });

      // Draw lasers
      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.laser;
      gameState.lasers.forEach((laser) => {
        const pos = project(laser.angle, laser.depth);
        const pos2 = project(laser.angle, laser.depth - 20);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.stroke();
      });

      // Draw particles
      ctx.strokeStyle = COLORS.enemy;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      gameState.particles.forEach((p) => {
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Draw player
      drawPlayer();

      // Draw score
      if (gameStarted) {
        ctx.fillStyle = COLORS.player;
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.shadowBlur = 10;
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 35);
      }

      // RGB Split on death
      if (gameState.screenShake > 0) {
        applyRGBSplit();
      }

      ctx.restore();
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
      canvas.removeEventListener("touchstart", preventScroll);
      canvas.removeEventListener("touchmove", preventScroll);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, highScore]);

  const handleStart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.isAnimating = false;
      gameStateRef.current.enemies = [];
      gameStateRef.current.lasers = [];
      gameStateRef.current.particles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.spawnTimer = 0;
      gameStateRef.current.screenShake = 0;
      gameStateRef.current.player.angle = 0;
    }
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleRestart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.isAnimating = false;
      gameStateRef.current.enemies = [];
      gameStateRef.current.lasers = [];
      gameStateRef.current.particles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.spawnTimer = 0;
      gameStateRef.current.screenShake = 0;
      gameStateRef.current.player.angle = 0;
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
            Neon Tempest - A retro 3D tunnel shooter
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
                    style={{ color: "#00FFFF" }}
                  >
                    GAME OVER
                  </h3>
                  <p className="text-xl text-white font-mono">SCORE: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="text-sm font-mono" style={{ color: "#FF00FF" }}>
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
