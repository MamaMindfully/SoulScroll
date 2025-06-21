// Compassionate insight generator for journal entries
const insightStyles = [
  (entry: string) => `Have you noticed how this pattern keeps surfacing? It may be asking for more of your awareness.`,
  (entry: string) => `That reflection holds a lot. What part of yourself might you be protecting by feeling this way?`,
  (entry: string) => `It takes courage to feel that. What would compassion say back to you in this moment?`,
  (entry: string) => `What's one gentle thing you can do today to honor what you just shared?`,
  (entry: string) => `You're doing the work. Let this moment be your teacher, not your judge.`,
  (entry: string) => `There's wisdom in what you've written. Trust the process of your unfolding.`,
  (entry: string) => `Your vulnerability here is a gift to your future self. How does it feel to be this honest?`,
  (entry: string) => `Sometimes the heart speaks through our struggles. What is yours trying to tell you?`,
  (entry: string) => `This moment of reflection is an act of self-love. You're choosing growth over comfort.`,
  (entry: string) => `Notice how you're showing up for yourself right now. That's the real work.`
];

export function generateCompassionateInsight(entryText: string): string {
  if (!entryText || entryText.length < 20) {
    return "Thank you for sharing. Even brief thoughts can lead to breakthroughs.";
  }
  
  const chosen = insightStyles[Math.floor(Math.random() * insightStyles.length)];
  return chosen(entryText);
}

export function generateContextualInsight(entryText: string, emotionalTone?: string): string {
  if (!entryText || entryText.length < 20) {
    return "Thank you for sharing. Even brief thoughts can lead to breakthroughs.";
  }

  // More contextual insights based on emotional tone
  const contextualInsights: { [key: string]: string[] } = {
    anxious: [
      "Your anxiety is information, not instruction. What is it trying to protect you from?",
      "Breathe with this feeling. It's temporary, even when it feels permanent.",
      "You're safe in this moment, even while your mind travels to other places."
    ],
    grateful: [
      "Gratitude is your heart's way of recognizing abundance. Let it expand.",
      "This appreciation you're feeling - it's changing your neural pathways for the better.",
      "Notice how gratitude feels in your body. This is your natural state of being."
    ],
    sad: [
      "Sadness is love with nowhere to go. Honor what you're grieving.",
      "Your tears are not weakness - they're the rain that helps new growth emerge.",
      "This sadness speaks to how deeply you can feel. That's a superpower."
    ],
    angry: [
      "Anger often carries important information about your boundaries. What is it protecting?",
      "This fire you feel - it can burn or it can illuminate. What would wisdom choose?",
      "Your anger is valid. Now, what would love do with this energy?"
    ],
    confused: [
      "Not knowing is the beginning of wisdom. Stay curious about what's emerging.",
      "Confusion often precedes clarity. You're in the space between old and new.",
      "It's okay to not have answers right now. Sometimes questions are more valuable."
    ]
  };

  if (emotionalTone && contextualInsights[emotionalTone.toLowerCase()]) {
    const toneInsights = contextualInsights[emotionalTone.toLowerCase()];
    const randomInsight = toneInsights[Math.floor(Math.random() * toneInsights.length)];
    return randomInsight;
  }

  // Fallback to general compassionate insights
  return generateCompassionateInsight(entryText);
}