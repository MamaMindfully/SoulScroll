export function isPremiumUser() {
  return localStorage.getItem('soulscroll-premium') === 'true';
}

export function activatePremium() {
  localStorage.setItem('soulscroll-premium', 'true');
}

export function getPremiumFeatures() {
  return [
    "🧠 Advanced AI reflections and emotional analysis",
    "🔍 Progressive depth exploration with 'Go Deeper' insights",
    "🎙️ Voice journaling with AI transcription", 
    "📤 Export journal as professional PDF documents",
    "🌙 Dream interpretation with mystical AI insights",
    "🌸 Mantra designer with personalized affirmations",
    "🌼 Mama Mindfully wellness coaching",
    "📊 Detailed mood predictions and pattern recognition",
    "✨ Premium daily prompts and guided exercises",
    "🔒 Advanced privacy controls and data export",
    "🆘 Priority customer support and early access"
  ];
}