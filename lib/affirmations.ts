export const affirmations = [
  "You are capable of amazing things.",
  "Your story is powerful.",
  "Every day is a new chance.",
  "You are enough, just as you are.",
  "Progress, not perfection!",
  "Your feelings are valid.",
  "You are growing stronger every day.",
  "Be gentle with yourself.",
  "You are resilient and adaptable.",
  "Small steps matter."
];
export function getRandomAffirmation() {
  const idx = Math.floor(Math.random() * affirmations.length);
  return affirmations[idx];
}
