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
    const saved = localStorage.getItem("orbitDefenseHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Colors - Neon Cyberpunk
    const COLORS = {
      bg: "#050505",
      core: "#00FFFF",
      corePulse: "#0088FF",
      shield: "#00FFFF",
      enemy: "#FF3366",
      enemyTrail: "#FF6699",
      particle: "#FFCC00",
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
      core: {
        radius: 40,
        pulsePhase: 0,
      },
      shield: {
        angle: 0,
        targetAngle: 0,
        radius: 100,
        arcLength: Math.PI / 3, // 60 degrees
        thickness: 8,
        rotationSpeed: 0.1,
      },
      enemies: [] as Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        speed: number;
        trail: Array<{ x: number; y: number; alpha: number }>;
      }>,
      particles: [] as Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        maxLife: number;
      }>,
      score: 0,
      spawnTimer: 0,
      spawnInterval: 90,
      keysPressed: new Set<string>(),
      touchSide: null as "left" | "right" | null,
      isAnimating: true,
    };

    gameStateRef.current = gameState;

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.code)) {
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
      const touchX = touch.clientX - rect.left;
      gameState.touchSide = touchX < canvas.width / 2 ? "left" : "right";
    };

    const handleTouchEnd = () => {
      gameState.touchSide = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    // Spawn enemy
    const spawnEnemy = () => {
      const side = Math.floor(Math.random() * 4);
      let x, y, angle;

      // Spawn from random edge
      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width;
          y = -20;
          break;
        case 1: // Right
          x = canvas.width + 20;
          y = Math.random() * canvas.height;
          break;
        case 2: // Bottom
          x = Math.random() * canvas.width;
          y = canvas.height + 20;
          break;
        default: // Left
          x = -20;
          y = Math.random() * canvas.height;
      }

      // Calculate direction toward center
      angle = Math.atan2(gameState.centerY - y, gameState.centerX - x);
      const speed = 2 + Math.random() * 1.5;

      gameState.enemies.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 8,
        speed: speed,
        trail: [],
      });
    };

    // Create particles
    const createParticles = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.random() * Math.PI * 2);
        const speed = 2 + Math.random() * 3;
        gameState.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          maxLife: 30,
        });
      }
    };

    // Split enemy into two smaller ones
    const splitEnemy = (enemy: any) => {
      if (enemy.radius < 4) return; // Don't split if too small

      const angle1 = Math.atan2(enemy.vy, enemy.vx) + Math.PI / 4;
      const angle2 = Math.atan2(enemy.vy, enemy.vx) - Math.PI / 4;
      const newRadius = enemy.radius * 0.7;
      const newSpeed = enemy.speed * 1.2;

      gameState.enemies.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle1) * newSpeed,
        vy: Math.sin(angle1) * newSpeed,
        radius: newRadius,
        speed: newSpeed,
        trail: [],
      });

      gameState.enemies.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle2) * newSpeed,
        vy: Math.sin(angle2) * newSpeed,
        radius: newRadius,
        speed: newSpeed,
        trail: [],
      });
    };

    // Check shield collision
    const checkShieldCollision = (enemy: any) => {
      const dx = enemy.x - gameState.centerX;
      const dy = enemy.y - gameState.centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const angleToEnemy = Math.atan2(dy, dx);

      // Check if enemy is at shield radius
      const radiusDiff = Math.abs(distFromCenter - gameState.shield.radius);
      if (radiusDiff < enemy.radius + gameState.shield.thickness) {
        // Check if angle is within shield arc
        let angleDiff = angleToEnemy - gameState.shield.angle;
        // Normalize angle difference to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const halfArc = gameState.shield.arcLength / 2;
        if (Math.abs(angleDiff) < halfArc) {
          return true;
        }
      }
      return false;
    };

    // Draw core with pulse
    const drawCore = () => {
      gameState.core.pulsePhase += 0.05;
      const pulseSize = Math.sin(gameState.core.pulsePhase) * 5;

      // Outer glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = COLORS.corePulse;
      ctx.fillStyle = COLORS.corePulse;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(
        gameState.centerX,
        gameState.centerY,
        gameState.core.radius + pulseSize + 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalAlpha = 1;

      // Core circle
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.core;
      ctx.fillStyle = COLORS.core;
      ctx.beginPath();
      ctx.arc(
        gameState.centerX,
        gameState.centerY,
        gameState.core.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Inner detail
      ctx.fillStyle = "#050505";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(
        gameState.centerX,
        gameState.centerY,
        gameState.core.radius * 0.6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    // Draw shield
    const drawShield = () => {
      const startAngle = gameState.shield.angle - gameState.shield.arcLength / 2;
      const endAngle = gameState.shield.angle + gameState.shield.arcLength / 2;

      ctx.strokeStyle = COLORS.shield;
      ctx.lineWidth = gameState.shield.thickness;
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.shield;

      ctx.beginPath();
      ctx.arc(
        gameState.centerX,
        gameState.centerY,
        gameState.shield.radius,
        startAngle,
        endAngle
      );
      ctx.stroke();

      // Shield caps
      ctx.fillStyle = COLORS.shield;
      ctx.shadowBlur = 10;
      const capSize = 6;

      // Start cap
      const startX = gameState.centerX + Math.cos(startAngle) * gameState.shield.radius;
      const startY = gameState.centerY + Math.sin(startAngle) * gameState.shield.radius;
      ctx.beginPath();
      ctx.arc(startX, startY, capSize, 0, Math.PI * 2);
      ctx.fill();

      // End cap
      const endX = gameState.centerX + Math.cos(endAngle) * gameState.shield.radius;
      const endY = gameState.centerY + Math.sin(endAngle) * gameState.shield.radius;
      ctx.beginPath();
      ctx.arc(endX, endY, capSize, 0, Math.PI * 2);
      ctx.fill();
    };

    // Game loop
    const update = () => {
      gameState.centerX = canvas.width / 2;
      gameState.centerY = canvas.height / 2;

      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw core
      drawCore();

      // Idle animation
      if (gameState.isAnimating && !gameStarted) {
        gameState.shield.angle += 0.02;
        drawShield();

        ctx.fillStyle = COLORS.core;
        ctx.font = "28px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.core;
        ctx.fillText("ORBIT DEFENSE", canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.shadowBlur = 15;
        ctx.fillText("PRESS START", canvas.width / 2, canvas.height / 2 + 80);
        ctx.font = "14px 'JetBrains Mono', monospace";
        ctx.fillText("← → ARROWS / TAP SIDES", canvas.width / 2, canvas.height / 2 + 110);
        ctx.textAlign = "left";

        gameLoopRef.current = requestAnimationFrame(update);
        return;
      }

      if (gameStarted && !gameOver) {
        // Shield rotation (smooth lerp)
        if (gameState.keysPressed.has("ArrowLeft") || gameState.touchSide === "left") {
          gameState.shield.targetAngle -= gameState.shield.rotationSpeed;
        }
        if (gameState.keysPressed.has("ArrowRight") || gameState.touchSide === "right") {
          gameState.shield.targetAngle += gameState.shield.rotationSpeed;
        }

        // Smooth angle interpolation
        gameState.shield.angle += (gameState.shield.targetAngle - gameState.shield.angle) * 0.2;

        // Spawn enemies
        gameState.spawnTimer++;
        if (gameState.spawnTimer > gameState.spawnInterval) {
          spawnEnemy();
          gameState.spawnTimer = 0;
          // Increase difficulty
          if (gameState.spawnInterval > 30) {
            gameState.spawnInterval -= 0.5;
          }
        }

        // Update enemies
        gameState.enemies.forEach((enemy, index) => {
          // Update trail
          enemy.trail.push({ x: enemy.x, y: enemy.y, alpha: 1 });
          if (enemy.trail.length > 8) enemy.trail.shift();
          enemy.trail.forEach((t) => (t.alpha -= 0.125));

          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Check core collision (game over)
          const dx = enemy.x - gameState.centerX;
          const dy = enemy.y - gameState.centerY;
          const distFromCenter = Math.sqrt(dx * dx + dy * dy);

          if (distFromCenter < gameState.core.radius + enemy.radius) {
            createParticles(enemy.x, enemy.y, 20);
            setGameOver(true);
            if (gameState.score > highScore) {
              setHighScore(gameState.score);
              localStorage.setItem("orbitDefenseHighScore", gameState.score.toString());
            }
            return;
          }

          // Check shield collision
          if (checkShieldCollision(enemy)) {
            // Bounce back
            const bounceAngle = Math.atan2(dy, dx);
            enemy.speed *= 1.1; // Increase speed on bounce
            enemy.vx = Math.cos(bounceAngle) * enemy.speed;
            enemy.vy = Math.sin(bounceAngle) * enemy.speed;

            createParticles(enemy.x, enemy.y, 8);

            // Score
            gameState.score += 10;
            setScore(gameState.score);

            // 20% chance to split
            if (Math.random() < 0.2) {
              splitEnemy(enemy);
              gameState.enemies.splice(index, 1);
            }
          }

          // Remove if too far
          if (
            enemy.x < -50 ||
            enemy.x > canvas.width + 50 ||
            enemy.y < -50 ||
            enemy.y > canvas.height + 50
          ) {
            gameState.enemies.splice(index, 1);
          }
        });

        // Update particles
        gameState.particles.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.life--;
          if (p.life <= 0) {
            gameState.particles.splice(index, 1);
          }
        });
      }

      // Draw enemies
      gameState.enemies.forEach((enemy) => {
        // Draw trail
        enemy.trail.forEach((t) => {
          if (t.alpha > 0) {
            ctx.fillStyle = COLORS.enemyTrail;
            ctx.globalAlpha = t.alpha * 0.5;
            ctx.shadowBlur = 5;
            ctx.shadowColor = COLORS.enemyTrail;
            ctx.beginPath();
            ctx.arc(t.x, t.y, enemy.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;

        // Draw enemy
        ctx.fillStyle = COLORS.enemy;
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.enemy;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = "#FF6699";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particles
      gameState.particles.forEach((p) => {
        ctx.fillStyle = COLORS.particle;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.particle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw shield
      drawShield();

      // Draw score
      if (gameStarted) {
        ctx.fillStyle = COLORS.core;
        ctx.font = "22px 'JetBrains Mono', monospace";
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.core;
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 40);
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
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
      gameStateRef.current.particles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.spawnTimer = 0;
      gameStateRef.current.spawnInterval = 90;
      gameStateRef.current.shield.angle = 0;
      gameStateRef.current.shield.targetAngle = 0;
    }
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const handleRestart = () => {
    if (gameStateRef.current) {
      gameStateRef.current.isAnimating = false;
      gameStateRef.current.enemies = [];
      gameStateRef.current.particles = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.spawnTimer = 0;
      gameStateRef.current.spawnInterval = 90;
      gameStateRef.current.shield.angle = 0;
      gameStateRef.current.shield.targetAngle = 0;
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
            Orbit Defense - Protect the core from incoming enemies
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
                    <p className="text-sm font-mono" style={{ color: "#FF3366" }}>
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
