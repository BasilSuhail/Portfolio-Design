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

    // Colors - Realistic tunnel aesthetic
    const COLORS = {
      bg: "#0a0a12",
      player: "#4CAF50", // Green
      enemy: "#FF5722", // Orange-red
      grid: "#64B5F6", // Light blue
      laser: "#FFC107", // Amber/gold
      tunnel: "#1a1a2e",
      tunnelLight: "#16213e",
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
        segment: 0,
        z: 1.0, // Player is at front of tunnel
      },
      enemies: [] as Array<{
        segment: number;
        z: number;
        speed: number;
      }>,
      lasers: [] as Array<{
        segment: number;
        z: number;
        speed: number;
      }>,
      particles: [] as Array<{
        segment: number;
        z: number;
        angle: number;
        speed: number;
        life: number;
      }>,
      stars: [] as Array<{
        segment: number;
        z: number;
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
      segments: 16, // Number of tunnel segments
      tunnelSpeed: 0.01, // Tunnel rotation speed (doubled)
      tunnelRotation: 0,
    };

    gameStateRef.current = gameState;

    // Initialize starfield
    for (let i = 0; i < 100; i++) {
      gameState.stars.push({
        segment: Math.floor(Math.random() * gameState.segments),
        z: Math.random() * 0.9 + 0.1,
        speed: 0.004 + Math.random() * 0.006, // Doubled speed
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

    // Project 3D point to 2D screen with proper perspective
    const project3D = (segment: number, z: number, offset = 0) => {
      const perspective = 400; // Focal length
      const scale = perspective / (perspective + z * 600 - 200);

      const angle = ((segment + offset) / gameState.segments) * Math.PI * 2 + gameState.tunnelRotation;
      const radius = Math.min(canvas.width, canvas.height) * 0.4 * scale;

      return {
        x: gameState.centerX + Math.cos(angle) * radius,
        y: gameState.centerY + Math.sin(angle) * radius,
        scale: scale,
        z: z,
      };
    };

    // Draw 3D tunnel with proper depth
    const drawTunnel = () => {
      const zLayers = 15; // More layers for smoother look

      // Draw tunnel faces (polygons between rings)
      for (let layer = 0; layer < zLayers - 1; layer++) {
        const z1 = layer / zLayers;
        const z2 = (layer + 1) / zLayers;

        for (let seg = 0; seg < gameState.segments; seg++) {
          const p1 = project3D(seg, z1);
          const p2 = project3D(seg + 1, z1);
          const p3 = project3D(seg + 1, z2);
          const p4 = project3D(seg, z2);

          // Fill polygon with realistic gradient
          const depth = 1 - z1;
          const r = Math.floor(22 + depth * 40); // Dark blue-grey
          const g = Math.floor(33 + depth * 50);
          const b = Math.floor(62 + depth * 80);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.fill();

          // Draw grid lines
          ctx.strokeStyle = COLORS.grid;
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 2;
          ctx.shadowColor = COLORS.grid;
          ctx.globalAlpha = 0.5 * depth;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // Draw radial lines (subtle glow)
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 5;
      ctx.shadowColor = COLORS.grid;

      for (let seg = 0; seg < gameState.segments; seg++) {
        ctx.beginPath();
        const front = project3D(seg, 0.95);
        const back = project3D(seg, 0);
        ctx.moveTo(front.x, front.y);
        ctx.lineTo(back.x, back.y);
        ctx.globalAlpha = 0.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    // Draw player as a 3D claw at the front
    const drawPlayer = () => {
      const seg = gameState.player.segment;
      const pos = project3D(seg, gameState.player.z);
      const posL = project3D(seg - 0.3, gameState.player.z);
      const posR = project3D(seg + 0.3, gameState.player.z);
      const posBack = project3D(seg, gameState.player.z - 0.05);

      ctx.strokeStyle = COLORS.player;
      ctx.fillStyle = COLORS.player;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.player;

      // Draw filled claw shape
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(posL.x, posL.y);
      ctx.lineTo(posBack.x, posBack.y);
      ctx.lineTo(posR.x, posR.y);
      ctx.closePath();
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();

      // Draw center dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    // Draw 3D enemy
    const drawEnemy = (segment: number, z: number) => {
      const pos = project3D(segment, z);
      const size = 12 * pos.scale;

      ctx.strokeStyle = COLORS.enemy;
      ctx.fillStyle = COLORS.enemy;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = COLORS.enemy;

      // Draw diamond shape
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - size);
      ctx.lineTo(pos.x + size, pos.y);
      ctx.lineTo(pos.x, pos.y + size);
      ctx.lineTo(pos.x - size, pos.y);
      ctx.closePath();
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();

      // Inner square
      const innerSize = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - innerSize);
      ctx.lineTo(pos.x + innerSize, pos.y);
      ctx.lineTo(pos.x, pos.y + innerSize);
      ctx.lineTo(pos.x - innerSize, pos.y);
      ctx.closePath();
      ctx.stroke();
    };

    // Draw 3D laser
    const drawLaser = (segment: number, z: number) => {
      const pos1 = project3D(segment, z);
      const pos2 = project3D(segment, z - 0.08);

      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.laser;

      ctx.beginPath();
      ctx.moveTo(pos1.x, pos1.y);
      ctx.lineTo(pos2.x, pos2.y);
      ctx.stroke();

      // Add glow point
      ctx.fillStyle = COLORS.laser;
      ctx.beginPath();
      ctx.arc(pos1.x, pos1.y, 3, 0, Math.PI * 2);
      ctx.fill();
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
      ctx.drawImage(tempCanvas, -3, 0);
      ctx.drawImage(tempCanvas, 3, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // Spawn enemy
    const spawnEnemy = () => {
      const segment = Math.floor(Math.random() * gameState.segments);
      gameState.enemies.push({
        segment: segment,
        z: 0.05,
        speed: 0.012 + Math.random() * 0.008, // Faster enemies
      });
    };

    // Fire laser
    const fireLaser = () => {
      gameState.lasers.push({
        segment: gameState.player.segment,
        z: gameState.player.z,
        speed: 0.025, // Faster lasers
      });
    };

    // Create explosion particles
    const createExplosion = (segment: number, z: number) => {
      for (let i = 0; i < 12; i++) {
        gameState.particles.push({
          segment: segment,
          z: z,
          angle: (i / 12) * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.01,
          life: 30,
        });
      }
    };

    // Game loop
    const update = () => {
      gameState.centerX = canvas.width / 2;
      gameState.centerY = canvas.height / 2;

      // Screen shake
      if (gameState.screenShake > 0) {
        gameState.screenShake--;
        gameState.shakeX = (Math.random() - 0.5) * 15;
        gameState.shakeY = (Math.random() - 0.5) * 15;
      } else {
        gameState.shakeX = 0;
        gameState.shakeY = 0;
      }

      // Clear canvas
      ctx.save();
      ctx.translate(gameState.shakeX, gameState.shakeY);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotate tunnel
      gameState.tunnelRotation += gameState.tunnelSpeed;

      // Draw stars in tunnel (brighter, more visible)
      ctx.fillStyle = "#ffffff";
      gameState.stars.forEach((star) => {
        star.z += star.speed;
        if (star.z > 1) {
          star.z = 0.05;
          star.segment = Math.floor(Math.random() * gameState.segments);
        }
        const pos = project3D(star.segment, star.z);
        const brightness = (1 - star.z) * 0.7;
        ctx.globalAlpha = brightness;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#ffffff";
        ctx.fillRect(pos.x - 1.5, pos.y - 1.5, 3, 3);
      });
      ctx.globalAlpha = 1;

      // Draw 3D tunnel
      drawTunnel();

      // Idle animation
      if (gameState.isAnimating && !gameStarted) {
        gameState.player.segment = 8 + Math.sin(Date.now() / 800) * 3;
        drawPlayer();

        ctx.fillStyle = COLORS.player;
        ctx.font = "28px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.player;
        ctx.fillText("NEON TEMPEST", canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.shadowBlur = 15;
        ctx.fillText("PRESS START", canvas.width / 2, canvas.height / 2 + 10);
        ctx.font = "14px 'JetBrains Mono', monospace";
        ctx.fillText("← → TO MOVE • SPACE TO SHOOT", canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = "left";

        ctx.restore();
        gameLoopRef.current = requestAnimationFrame(update);
        return;
      }

      if (gameStarted && !gameOver) {
        // Player movement (faster, more responsive)
        if (gameState.keysPressed.has("ArrowLeft")) {
          gameState.player.segment -= 0.25;
        }
        if (gameState.keysPressed.has("ArrowRight")) {
          gameState.player.segment += 0.25;
        }

        // Wrap around
        if (gameState.player.segment < 0) gameState.player.segment += gameState.segments;
        if (gameState.player.segment >= gameState.segments) gameState.player.segment -= gameState.segments;

        // Touch controls
        if (gameState.touchX !== null) {
          if (gameState.touchX < canvas.width / 3) {
            gameState.player.segment -= 0.25;
          } else if (gameState.touchX > (canvas.width * 2) / 3) {
            gameState.player.segment += 0.25;
          }
        }

        // Shooting
        if (gameState.keysPressed.has("Space")) {
          if (gameState.fireTimer === 0) {
            fireLaser();
            gameState.fireTimer = 8;
          }
        }

        // Auto-fire for mobile
        if (gameState.autoFire) {
          if (gameState.fireTimer === 0) {
            fireLaser();
            gameState.fireTimer = 8;
          }
        }

        if (gameState.fireTimer > 0) gameState.fireTimer--;

        // Spawn enemies
        gameState.spawnTimer++;
        if (gameState.spawnTimer > 70 - Math.min(gameState.score / 3, 45)) {
          spawnEnemy();
          gameState.spawnTimer = 0;
        }

        // Update enemies
        gameState.enemies.forEach((enemy, index) => {
          enemy.z += enemy.speed;

          // Enemy reached player
          if (enemy.z >= gameState.player.z - 0.05) {
            const segDiff = Math.abs(enemy.segment - gameState.player.segment);
            const wrappedDiff = Math.min(segDiff, gameState.segments - segDiff);

            if (wrappedDiff < 0.8) {
              gameState.screenShake = 25;
              createExplosion(enemy.segment, enemy.z);
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
          laser.z -= laser.speed;

          if (laser.z < 0.05) {
            gameState.lasers.splice(index, 1);
          }

          // Check collision with enemies
          gameState.enemies.forEach((enemy, eIndex) => {
            const segDiff = Math.abs(laser.segment - enemy.segment);
            const wrappedDiff = Math.min(segDiff, gameState.segments - segDiff);
            const zDiff = Math.abs(laser.z - enemy.z);

            if (wrappedDiff < 0.5 && zDiff < 0.08) {
              createExplosion(enemy.segment, enemy.z);
              gameState.enemies.splice(eIndex, 1);
              gameState.lasers.splice(index, 1);
              gameState.score += 10;
              setScore(gameState.score);
            }
          });
        });

        // Update particles
        gameState.particles.forEach((p, index) => {
          p.segment += Math.cos(p.angle) * 0.3;
          p.z += Math.sin(p.angle) * 0.01;
          p.life--;
          if (p.life <= 0 || p.z > 1 || p.z < 0) {
            gameState.particles.splice(index, 1);
          }
        });
      }

      // Draw enemies
      gameState.enemies.forEach((enemy) => {
        drawEnemy(enemy.segment, enemy.z);
      });

      // Draw lasers
      gameState.lasers.forEach((laser) => {
        drawLaser(laser.segment, laser.z);
      });

      // Draw particles
      ctx.strokeStyle = COLORS.enemy;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      gameState.particles.forEach((p) => {
        const pos = project3D(p.segment, p.z);
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Draw player
      drawPlayer();

      // Draw score
      if (gameStarted) {
        ctx.fillStyle = COLORS.player;
        ctx.font = "22px 'JetBrains Mono', monospace";
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.player;
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 40);
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
      gameStateRef.current.player.segment = 8;
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
      gameStateRef.current.player.segment = 8;
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
