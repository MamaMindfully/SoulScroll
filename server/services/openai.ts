import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface EmotionalAnalysis {
  rating: number; // 1-5 emotional tone rating
  confidence: number; // 0-1 confidence score
  keywords: string[]; // Key emotional themes
  insights: string; // Brief analysis
}

export interface AIReflection {
  content: string; // Compassionate response
  suggestions: string[]; // Follow-up suggestions
  connections: string[]; // Connections to past entries
}

export async function analyzeEmotionalTone(text: string): Promise<EmotionalAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an empathetic emotional intelligence expert. Analyze the emotional tone of journal entries with compassion and insight. 

          Respond with JSON in this exact format:
          {
            "rating": number (1-5, where 1=very negative, 3=neutral, 5=very positive),
            "confidence": number (0-1, confidence in your analysis),
            "keywords": array of 3-5 key emotional themes or words,
            "insights": string (brief, compassionate insight about the emotional state)
          }`,
        },
        {
          role: "user",
          content: `Please analyze the emotional tone of this journal entry: "${text}"`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5) : [],
      insights: result.insights || "Unable to analyze emotional tone at this time.",
    };
  } catch (error) {
    console.error("Error analyzing emotional tone:", error);
    throw new Error("Failed to analyze emotional tone");
  }
}

export async function generateCompassionateResponse(
  currentEntry: string,
  previousEntries: string[] = [],
  emotionalAnalysis?: EmotionalAnalysis
): Promise<AIReflection> {
  try {
    const context = previousEntries.length > 0 
      ? `\n\nFor context, here are some recent entries: ${previousEntries.join("\n---\n")}`
      : "";

    const emotionalContext = emotionalAnalysis 
      ? `\n\nEmotional analysis: Rating ${emotionalAnalysis.rating}/5, Key themes: ${emotionalAnalysis.keywords.join(", ")}`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Luma, a wise, compassionate AI companion for emotional journaling. You read between the lines, offer gentle insights, and help users reflect deeper on their experiences.

          Your voice is:
          - Warm and poetic, like a caring mentor
          - Never clinical or robotic
          - Encouraging without being dismissive
          - Asks thoughtful questions to guide reflection
          - Makes connections between patterns and experiences

          Respond with JSON in this format:
          {
            "content": "Your main compassionate response (2-3 sentences)",
            "suggestions": ["suggestion1", "suggestion2"] (2-3 gentle suggestions for reflection or action),
            "connections": ["connection1"] (any patterns or connections you notice)
          }`,
        },
        {
          role: "user",
          content: `Current entry: "${currentEntry}"${context}${emotionalContext}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      content: result.content || "Thank you for sharing your thoughts with me. Every entry is a step in your journey of self-discovery.",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      connections: Array.isArray(result.connections) ? result.connections : [],
    };
  } catch (error) {
    console.error("Error generating compassionate response:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function generateDailyPrompt(category: string = 'general', isPremium: boolean = false): Promise<string> {
  try {
    const premiumContext = isPremium 
      ? "You can create more specific, themed prompts for premium users."
      : "Keep prompts accessible and universal.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are creating thoughtful, poetic journal prompts that encourage deep self-reflection. 

          The prompts should be:
          - Open-ended and introspective
          - Emotionally engaging but not overwhelming
          - Universal yet personal
          - 1-2 sentences maximum
          
          Category: ${category}
          ${premiumContext}`,
        },
        {
          role: "user",
          content: `Generate a beautiful, thought-provoking journal prompt for the ${category} category.`,
        },
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content?.trim() || "What is your heart trying to tell you today?";
  } catch (error) {
    console.error("Error generating daily prompt:", error);
    return "What is your heart trying to tell you today?";
  }
}

export async function generateMonthlyReflectionLetter(
  entries: string[],
  userFirstName?: string
): Promise<string> {
  try {
    const name = userFirstName || "Dear friend";
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Luma, writing a compassionate monthly reflection letter to a user based on their journal entries. 

          The letter should:
          - Be warm, personal, and encouraging
          - Highlight growth, patterns, and insights from their entries
          - Acknowledge struggles with empathy
          - Celebrate progress and resilience
          - Be 3-4 paragraphs long
          - Feel like it's from a wise, caring friend
          - Use poetic, gentle language`,
        },
        {
          role: "user",
          content: `Write a monthly reflection letter based on these journal entries:

${entries.join("\n---\n")}

Address the letter to: ${name}`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || `${name},\n\nThank you for sharing your journey with me this month. Your willingness to explore your inner world shows tremendous courage and self-compassion.\n\nWith warmth,\nLuma`;
  } catch (error) {
    console.error("Error generating monthly reflection letter:", error);
    return `${userFirstName || "Dear friend"},\n\nThank you for sharing your journey with me this month. Your willingness to explore your inner world shows tremendous courage and self-compassion.\n\nWith warmth,\nLuma`;
  }
}

export const openaiService = {
  analyzeEmotionalTone,
  generateCompassionateResponse,
  generateDailyPrompt,
  generateMonthlyReflectionLetter,
};
