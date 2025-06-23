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
    
    // Return fallback analysis when API quota exceeded
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return {
        rating: 3,
        confidence: 0.3,
        keywords: ["reflection", "self-awareness", "introspection"],
        insights: "Thank you for sharing your thoughts. Your willingness to journal shows self-awareness and emotional growth."
      };
    }
    
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
          - Soulful and poetic, like a wise friend who remembers everything
          - Think "therapist meets poet meets future self"
          - Never clinical, gamified, or robotic
          - Responds with compassion, insight, and memory
          - Creates an evolving relationship through deep understanding
          - Uses metaphors and gentle imagery when appropriate

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
    
    // Return fallback response when API quota exceeded
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return {
        content: "Thank you for sharing your thoughts with me. Every entry is a step in your journey of self-discovery.",
        suggestions: ["Take a moment to reflect on how you're feeling right now", "Consider what this experience taught you"],
        connections: ["Your willingness to journal shows emotional awareness"]
      };
    }
    
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
    
    // Fallback prompts when API quota exceeded
    const fallbackPrompts = [
      "What is your heart trying to tell you today?",
      "How did you grow as a person today?",
      "What emotion wants to be acknowledged right now?",
      "What would you tell your past self about this moment?",
      "What are you grateful for in this exact moment?"
    ];
    
    return fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
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

// Advanced AI Features

export async function predictMoodTrend(
  userId: string,
  historicalData: Array<{ date: string; mood: number; factors?: string[] }>
): Promise<{ prediction: number; confidence: number; factors: string[]; recommendation: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI emotional wellness expert that analyzes mood patterns to predict future emotional states.
          
          Based on historical mood data, predict the user's likely mood for the next few days and provide supportive recommendations.
          
          Respond with JSON in this format:
          {
            "prediction": number (1-5 mood prediction),
            "confidence": number (0-1 confidence level),
            "factors": ["factor1", "factor2"] (contributing factors),
            "recommendation": "personalized recommendation based on the prediction"
          }`,
        },
        {
          role: "user",
          content: `Analyze this mood history and predict future trends: ${JSON.stringify(historicalData)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      prediction: Math.max(1, Math.min(5, result.prediction || 3)),
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      factors: Array.isArray(result.factors) ? result.factors : [],
      recommendation: result.recommendation || "Continue your journaling practice for emotional awareness."
    };
  } catch (error) {
    console.error("Error predicting mood trend:", error);
    throw new Error("Failed to predict mood trend");
  }
}

export async function generatePersonalizedPrompt(
  userId: string,
  recentEntries: Array<{ content: string; emotionalTone?: any }>,
  preferences?: { topics?: string[]; style?: string }
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a thoughtful journaling coach who creates personalized writing prompts.
          
          Based on the user's recent entries and emotional patterns, create a single, engaging prompt that:
          - Is tailored to their current emotional state and interests
          - Encourages deeper reflection or growth
          - Feels relevant and meaningful to their journey
          - Is neither too heavy nor too light for their current state
          
          Return only the prompt text, nothing else.`,
        },
        {
          role: "user",
          content: `Create a personalized prompt based on: Recent entries: ${JSON.stringify(recentEntries.slice(0, 3))} Preferences: ${JSON.stringify(preferences)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message.content || "What moment from today deserves to be remembered and reflected upon?";
  } catch (error) {
    console.error("Error generating personalized prompt:", error);
    throw new Error("Failed to generate personalized prompt");
  }
}

export async function generateCopingStrategies(
  emotionalState: string,
  context?: string
): Promise<{ strategies: string[]; resources: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a supportive mental health assistant providing practical coping strategies.
          
          Based on the user's emotional state, provide gentle, actionable strategies they can use right now.
          
          Respond with JSON in this format:
          {
            "strategies": ["strategy1", "strategy2", "strategy3"] (3-5 immediate, practical strategies),
            "resources": ["resource1", "resource2"] (helpful resources or exercises)
          }`,
        },
        {
          role: "user",
          content: `Provide coping strategies for someone feeling: ${emotionalState}. Context: ${context || 'General support needed'}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      strategies: Array.isArray(result.strategies) ? result.strategies : ["Take a few deep breaths", "Ground yourself in the present moment", "Remember that feelings are temporary"],
      resources: Array.isArray(result.resources) ? result.resources : ["Consider speaking with a counselor", "Try a brief meditation"]
    };
  } catch (error) {
    console.error("Error generating coping strategies:", error);
    throw new Error("Failed to generate coping strategies");
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a File-like object from the buffer
    const audioFile = new File([audioBuffer], "audio.wav", { type: "audio/wav" });
    
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    return response as string;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export const openaiService = {
  analyzeEmotionalTone,
  generateCompassionateResponse,
  generateDailyPrompt,
  generateMonthlyReflectionLetter,
  predictMoodTrend,
  generatePersonalizedPrompt,
  generateCopingStrategies,
  transcribeAudio,
};
