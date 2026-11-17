/**
 * Confetti burst from the centre of an element, or from the middle of the screen if none is given.
 * The confetti library is loaded on first use.
 */
export function burstConfetti(from?: Element | null): void {
  let x = 0.5;
  let y = 0.5;
  if (from) {
    const rect = from.getBoundingClientRect();
    x = (rect.left + rect.width / 2) / window.innerWidth;
    y = (rect.top + rect.height / 2) / window.innerHeight;
  }

  const between = (min: number, max: number) => Math.random() * (max - min) + min;
  // Near the top of the screen an upward burst would fly straight out of view, so aim it down.
  const angle = y < 0.2 ? between(235, 305) : between(55, 125);

  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      angle,
      spread: between(50, 70),
      particleCount: Math.floor(between(50, 100)),
      origin: { x, y },
    });
  });
}
