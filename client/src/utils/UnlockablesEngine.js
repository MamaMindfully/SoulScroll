export function evaluateUnlockables(entries) {
  const unlocks = [];

  // Track days journaled
  const daysSet = new Set(entries.map(e => new Date(e.timestamp).toDateString()));
  const dayCount = daysSet.size;

  // Simple reward logic
  if (dayCount >= 3) unlocks.push("🌱 Gentle Start Badge");
  if (dayCount >= 7) unlocks.push("🔥 7-Day Soulstreak");
  if (entries.length >= 10) unlocks.push("🎨 New Theme: Indigo Flow");
  if (entries.find(e => e.intent && e.intent.includes("creative"))) {
    unlocks.push("🗣️ Unlock Voice: The Inner Muse");
  }
  if (entries.some(e => (e.lesson || '').toLowerCase().includes("forgiveness"))) {
    unlocks.push("🧘 Affirmation: I release what no longer serves me");
  }

  return unlocks;
}