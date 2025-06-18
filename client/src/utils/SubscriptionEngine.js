export function isPremiumUser() {
  return localStorage.getItem('soulscroll-premium') === 'true';
}

export function activatePremium() {
  localStorage.setItem('soulscroll-premium', 'true');
}

export function getPremiumFeatures() {
  return [
    "🧠 Deeper AI reflections",
    "🎨 Unlock full theme library",
    "📤 Export journal to PDF",
    "🗣️ Choose AI voice styles",
    "🌌 Dream Log and Creative Mode"
  ];
}