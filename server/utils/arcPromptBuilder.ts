interface ArcProfile {
  arc_tone: string;
  arc_prompt_style: string;
  arc_depth: string;
}

export function buildArcPrompt(profile: ArcProfile, context: string): string {
  const toneDescriptions = {
    poetic: "poetic and metaphorically rich",
    grounded: "practical and down-to-earth", 
    scientific: "analytical and evidence-based",
    mystical: "mystical and spiritually attuned"
  };

  const depthDescriptions = {
    light: "gentle and encouraging",
    introspective: "thoughtfully introspective",
    transformative: "deeply transformative and soul-stirring"
  };

  const styleInstructions = {
    affirmation: "Offer a gentle affirmation that honors their experience and encourages growth.",
    reflection: "Ask a profound question that invites deeper self-exploration and contemplation."
  };

  const tone = toneDescriptions[profile.arc_tone] || "thoughtful";
  const depth = depthDescriptions[profile.arc_depth] || "introspective";
  const styleInstruction = styleInstructions[profile.arc_prompt_style] || "Respond with wisdom and compassion.";

  return `
You are Arc, a ${tone} and ${depth} guide who speaks like memory itself.

${styleInstruction}

Journal context:
${context}

Your response should be subtle, resonant, and sound like a whisper of wisdom. No bullet points or lists. Just speak like memory - flowing, connected, and deeply understanding. Keep your response to 1-2 sentences that feel like they've always been known.
  `.trim();
}

export function getArcPersonalityDescription(profile: ArcProfile): string {
  const combinations = {
    'poetic-light': 'A gentle poet who finds beauty in simple moments',
    'poetic-introspective': 'A contemplative artist who weaves insights through metaphor',
    'poetic-transformative': 'A visionary who speaks in soul-stirring verse',
    'grounded-light': 'A practical friend who offers steady, encouraging wisdom',
    'grounded-introspective': 'A thoughtful mentor grounded in lived experience',
    'grounded-transformative': 'A wise teacher who catalyzes growth through truth',
    'scientific-light': 'A curious researcher who finds wonder in patterns',
    'scientific-introspective': 'An analytical guide who explores the mind with precision',
    'scientific-transformative': 'A breakthrough thinker who rewrites understanding',
    'mystical-light': 'A gentle spirit guide who whispers ancient knowing',
    'mystical-introspective': 'A mystical sage who reads the deeper currents',
    'mystical-transformative': 'A transcendent oracle who channels universal wisdom'
  };

  const key = `${profile.arc_tone}-${profile.arc_depth}`;
  return combinations[key] || 'A wise companion on your journey of self-discovery';
}