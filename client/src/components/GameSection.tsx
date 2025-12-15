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

    // Disable smoothing for pixelated look
    ctx.imageSmoothingEnabled = false;

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
        ctx.imageSmoothingEnabled = false; // Reapply after scaling

        if (gameStateRef.current) {
          gameStateRef.current.displayWidth = displayWidth;
          gameStateRef.current.displayHeight = displayHeight;
          gameStateRef.current.groundY = displayHeight - 60;
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Detect theme from document
    const getTheme = () => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    };

    // Colors based on theme
    const getColors = () => {
      const theme = getTheme();
      if (theme === 'dark') {
        return {
          bg: "#0a0a0a",
          fg: "#ffffff",
          player: "#00ff00",
          obstacle: "#ff3366",
          ground: "#ffffff",
          text: "#ffffff",
          textLight: "#888888",
        };
      } else {
        return {
          bg: "#ffffff",
          fg: "#1a1a1a",
          player: "#2563eb",
          obstacle: "#1a1a1a",
          ground: "#1a1a1a",
          text: "#1a1a1a",
          textLight: "#666666",
        };
      }
    };

    // Game state
    const gameState = {
      displayWidth: canvas.style.width ? parseInt(canvas.style.width) : 800,
      displayHeight: canvas.style.height ? parseInt(canvas.style.height) : 400,
      groundY: 0,
      player: {
        x: 100,
        y: 0,
        width: 24,
        height: 24,
        velocityY: 0,
        isJumping: false,
        jumpPower: -14,
        gravity: 0.8,
        animFrame: 0,
        animTimer: 0,
      },
      obstacles: [] as Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        type: 'cactus' | 'bird' | 'rock';
      }>,
      clouds: [] as Array<{
        x: number;
        y: number;
        width: number;
        speed: number;
      }>,
      score: 0,
      distance: 0,
      speed: 6,
      obstacleTimer: 0,
      obstacleInterval: 80,
      isAI: true,
      groundOffset: 0,
    };

    gameState.groundY = gameState.displayHeight - 60;
    gameState.player.y = gameState.groundY - gameState.player.height;
    gameStateRef.current = gameState;

    // Generate initial clouds
    for (let i = 0; i < 3; i++) {
      gameState.clouds.push({
        x: Math.random() * gameState.displayWidth,
        y: 40 + Math.random() * 80,
        width: 40 + Math.random() * 40,
        speed: 0.5 + Math.random() * 0.5,
      });
    }

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
      const types: Array<{ type: 'cactus' | 'bird' | 'rock'; width: number; height: number }> = [
        { type: 'cactus', width: 20, height: 40 },
        { type: 'bird', width: 32, height: 20 },
        { type: 'rock', width: 28, height: 24 },
      ];
      const config = types[Math.floor(Math.random() * types.length)];

      // Bird flies at different height
      const yPos = config.type === 'bird'
        ? gameState.groundY - config.height - 30 - Math.random() * 20
        : gameState.groundY - config.height;

      gameState.obstacles.push({
        x: gameState.displayWidth + 50,
        y: yPos,
        width: config.width,
        height: config.height,
        type: config.type,
      });
    };

    // Draw pixelated player (running animation)
    const drawPlayer = (x: number, y: number, frame: number, colors: any) => {
      ctx.fillStyle = colors.player;

      // Simple running animation - 2 frames
      if (frame === 0) {
        // Frame 1 - left leg forward
        ctx.fillRect(x + 6, y, 12, 8); // Head
        ctx.fillRect(x + 4, y + 8, 16, 10); // Body
        ctx.fillRect(x + 2, y + 18, 8, 6); // Left leg (forward)
        ctx.fillRect(x + 14, y + 18, 8, 6); // Right leg (back)
      } else {
        // Frame 2 - right leg forward
        ctx.fillRect(x + 6, y, 12, 8); // Head
        ctx.fillRect(x + 4, y + 8, 16, 10); // Body
        ctx.fillRect(x + 2, y + 18, 8, 6); // Left leg (back)
        ctx.fillRect(x + 14, y + 18, 8, 6); // Right leg (forward)
      }
    };

    // Draw pixelated obstacles
    const drawCactus = (x: number, y: number, colors: any) => {
      ctx.fillStyle = colors.obstacle;
      ctx.fillRect(x + 6, y, 8, 40); // Main trunk
      ctx.fillRect(x, y + 10, 6, 15); // Left arm
      ctx.fillRect(x + 14, y + 10, 6, 15); // Right arm
    };

    const drawBird = (x: number, y: number, frame: number, colors: any) => {
      ctx.fillStyle = colors.obstacle;
      // Flapping animation
      if (frame % 20 < 10) {
        ctx.fillRect(x + 10, y + 6, 12, 8); // Body
        ctx.fillRect(x, y, 10, 6); // Left wing (up)
        ctx.fillRect(x + 22, y, 10, 6); // Right wing (up)
      } else {
        ctx.fillRect(x + 10, y + 6, 12, 8); // Body
        ctx.fillRect(x, y + 8, 10, 6); // Left wing (down)
        ctx.fillRect(x + 22, y + 8, 10, 6); // Right wing (down)
      }
    };

    const drawRock = (x: number, y: number, colors: any) => {
      ctx.fillStyle = colors.obstacle;
      ctx.fillRect(x + 4, y, 20, 8);
      ctx.fillRect(x, y + 8, 28, 16);
    };

    // Draw cloud
    const drawCloud = (x: number, y: number, width: number, colors: any) => {
      ctx.fillStyle = colors.textLight;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y + 4, width * 0.3, 8);
      ctx.fillRect(x + width * 0.2, y, width * 0.6, 12);
      ctx.fillRect(x + width * 0.5, y + 4, width * 0.3, 8);
      ctx.globalAlpha = 1;
    };

    // AI logic - perfect obstacle avoidance with proper collision detection
    const updateAI = () => {
      if (!gameState.isAI) return;

      // Find nearest obstacle
      const nearestObstacle = gameState.obstacles
        .filter(obs => obs.x > gameState.player.x)
        .sort((a, b) => a.x - b.x)[0];

      if (nearestObstacle) {
        const distanceToObstacle = nearestObstacle.x - (gameState.player.x + gameState.player.width);

        // Only jump if obstacle will collide with player
        // Birds need jump, ground obstacles need jump
        const willCollide = nearestObstacle.y + nearestObstacle.height > gameState.groundY - gameState.player.height;

        if (willCollide && distanceToObstacle < 120 && distanceToObstacle > 80 && !gameState.player.isJumping) {
          gameState.player.velocityY = gameState.player.jumpPower;
          gameState.player.isJumping = true;
        }
      }
    };

    // Collision detection - pixel perfect
    const checkCollision = (player: any, obstacle: any) => {
      // Add small hitbox padding for fair gameplay
      const padding = 4;
      return (
        player.x + padding < obstacle.x + obstacle.width &&
        player.x + player.width - padding > obstacle.x &&
        player.y + padding < obstacle.y + obstacle.height &&
        player.y + player.height - padding > obstacle.y
      );
    };

    // Game loop
    let frameCount = 0;
    const update = () => {
      frameCount++;
      const displayWidth = gameState.displayWidth;
      const displayHeight = gameState.displayHeight;
      const COLORS = getColors();

      // Clear canvas
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Draw clouds
      gameState.clouds.forEach((cloud, index) => {
        drawCloud(cloud.x, cloud.y, cloud.width, COLORS);
        cloud.x -= cloud.speed;

        // Reset cloud position
        if (cloud.x + cloud.width < 0) {
          cloud.x = displayWidth + Math.random() * 100;
          cloud.y = 40 + Math.random() * 80;
        }
      });

      // Draw ground with dashes (pixelated effect)
      ctx.strokeStyle = COLORS.ground;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -gameState.groundOffset;
      ctx.beginPath();
      ctx.moveTo(0, gameState.groundY);
      ctx.lineTo(displayWidth, gameState.groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      // AI mode overlay
      if (gameState.isAI && !gameOver) {
        ctx.fillStyle = COLORS.textLight;
        ctx.font = "12px monospace";
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

        // Player running animation
        gameState.player.animTimer++;
        if (gameState.player.animTimer > 8) {
          gameState.player.animFrame = (gameState.player.animFrame + 1) % 2;
          gameState.player.animTimer = 0;
        }

        // Update ground offset for scrolling effect
        gameState.groundOffset += gameState.speed;
        if (gameState.groundOffset > 20) gameState.groundOffset = 0;

        // Spawn obstacles
        gameState.obstacleTimer++;
        if (gameState.obstacleTimer > gameState.obstacleInterval) {
          spawnObstacle();
          gameState.obstacleTimer = 0;

          // Gradually increase difficulty
          if (gameState.obstacleInterval > 45) {
            gameState.obstacleInterval -= 0.3;
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

          // Check collision - only when player is in control
          if (!gameState.isAI && checkCollision(gameState.player, obs)) {
            setGameOver(true);
            if (gameState.score > highScore) {
              setHighScore(gameState.score);
              localStorage.setItem("cleanRunnerHighScore", gameState.score.toString());
            }
          }
        });

        // Gradually increase speed
        if (gameState.speed < 10) {
          gameState.speed += 0.003;
        }

        // Update distance
        gameState.distance += gameState.speed;
      }

      // Draw obstacles
      gameState.obstacles.forEach((obs) => {
        if (obs.type === 'cactus') {
          drawCactus(obs.x, obs.y, COLORS);
        } else if (obs.type === 'bird') {
          drawBird(obs.x, obs.y, frameCount, COLORS);
        } else {
          drawRock(obs.x, obs.y, COLORS);
        }
      });

      // Draw player
      drawPlayer(
        gameState.player.x,
        gameState.player.y,
        gameState.player.animFrame,
        COLORS
      );

      // Draw score (only when player is in control)
      if (!gameState.isAI) {
        ctx.fillStyle = COLORS.text;
        ctx.font = "16px monospace";
        ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
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
      gameStateRef.current.speed = 6;
      gameStateRef.current.obstacleTimer = 0;
      gameStateRef.current.obstacleInterval = 80;
      gameStateRef.current.isAI = true;
      gameStateRef.current.groundOffset = 0;
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
          <div className="relative rounded-lg overflow-hidden border border-border bg-background">
            <canvas
              ref={canvasRef}
              className="w-full h-auto cursor-pointer"
              style={{ display: "block" }}
            />
            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-bold">
                    GAME OVER
                  </h3>
                  <p className="text-xl">
                    SCORE: {score}
                  </p>
                  {score === highScore && score > 0 && (
                    <p className="text-sm text-muted-foreground">
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
              {isPlaying && !gameOver && <span>CURRENT: {score}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
