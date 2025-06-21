interface InsightResponse {
  insight: string;
  followUp: string;
  emotionalTone?: string;
  source: 'ai' | 'fallback';
}

export const generateInsight = async (entry: string): Promise<InsightResponse> => {
  if (!entry || entry.trim().length < 10) {
    return {
      insight: "Thank you for sharing your thoughts. Every moment of reflection is valuable.",
      followUp: "What would you like to explore further?",
      source: 'fallback'
    };
  }

  try {
    const response = await fetch('/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: entry.trim() })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      insight: data.insight,
      followUp: data.followUpPrompt || "What comes up for you after reading this?",
      emotionalTone: data.emotionalTone,
      source: 'ai'
    };
  } catch (error) {
    console.error('Error generating insight:', error);
    
    // Intelligent fallback based on content analysis
    return generateFallbackInsight(entry);
  }
};

const generateFallbackInsight = (entry: string): InsightResponse => {
  const content = entry.toLowerCase();
  
  // Analyze content for themes
  const themes = {
    gratitude: /thank|grateful|appreciate|blessing|lucky|fortunate/i,
    challenge: /difficult|hard|struggle|challenge|tough|stress/i,
    growth: /learn|grow|develop|improve|better|progress/i,
    relationships: /friend|family|love|relationship|partner|connect/i,
    work: /work|job|career|project|meeting|boss/i,
    health: /health|exercise|sleep|tired|energy|body/i,
    emotion: /feel|emotion|happy|sad|angry|excited|nervous/i
  };

  let insight = "";
  let followUp = "";

  if (themes.gratitude.test(content)) {
    insight = "Your gratitude shines through your words. Recognizing what you appreciate is a powerful practice that cultivates joy and abundance.";
    followUp = "What other small moments from today deserve your appreciation?";
  } else if (themes.challenge.test(content)) {
    insight = "Facing challenges takes courage, and you're showing that courage by reflecting on your experience. Every difficulty carries wisdom.";
    followUp = "What strength have you discovered in yourself through this challenge?";
  } else if (themes.growth.test(content)) {
    insight = "Your commitment to growth is inspiring. Each step of learning and development is building the person you're becoming.";
    followUp = "What's one small way you can continue this growth tomorrow?";
  } else if (themes.relationships.test(content)) {
    insight = "Relationships are mirrors that show us who we are. Your reflections on connections reveal your capacity for love and understanding.";
    followUp = "How do your relationships help you understand yourself better?";
  } else if (themes.work.test(content)) {
    insight = "Your work is an expression of your talents and values. Finding meaning in what you do creates purpose beyond just tasks.";
    followUp = "What aspects of your work align most with your personal values?";
  } else if (themes.health.test(content)) {
    insight = "Your body and mind are wise teachers. Listening to what they need shows self-compassion and awareness.";
    followUp = "What is your body trying to tell you right now?";
  } else if (themes.emotion.test(content)) {
    insight = "Your emotions are valid messengers carrying important information about your inner world. Honor what you're feeling.";
    followUp = "What is this feeling trying to teach you?";
  } else {
    insight = "Your willingness to reflect shows wisdom and self-awareness. Each moment of introspection is a gift to your future self.";
    followUp = "What insights are emerging for you as you sit with these thoughts?";
  }

  return {
    insight,
    followUp,
    emotionalTone: 'Supportive',
    source: 'fallback'
  };
};