import React, { useEffect, useState } from "react";
const affirmations = [
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
function getRandomAffirmation() {
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}
export function AffirmationBanner() {
  const [affirmation, setAffirmation] = useState(() => getRandomAffirmation());
  useEffect(() => {
    const id = setInterval(() => setAffirmation(getRandomAffirmation()), 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="w-full py-3 px-4 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl text-center shadow-lg mb-4 text-lg font-semibold">
      {affirmation}
    </div>
  );
}
