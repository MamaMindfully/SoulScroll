import confetti from "canvas-confetti";
export function showConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 }
  });
}
