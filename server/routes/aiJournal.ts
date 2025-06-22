import { Router, Request, Response } from "express";
import { OpenAI } from "openai";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { z } from "zod";

const router = Router();
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Validation schema
const journalAnalysisSchema = z.object({
  entryText: z.string().min(1, "Journal entry text is required")
});

// AI Journal Analysis Route
router.post('/ai/journal', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { entryText } = journalAnalysisSchema.parse(req.body);
    const user = req.user;

    logger.info('Processing AI journal analysis', { 
      userId: user.id, 
      textLength: entryText.length 
    });

    // Generate AI insight using GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are a compassionate journaling coach that provides deep, meaningful insights. 
          Your responses should be warm, supportive, and help the person gain deeper self-understanding.
          Focus on emotional patterns, growth opportunities, and gentle wisdom.
          Keep responses between 100-200 words.` 
        },
        { 
          role: 'user', 
          content: `Here's my journal entry: ${entryText}` 
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const aiInsight = response.choices[0].message.content || "Thank you for sharing your thoughts. Your reflection shows courage and self-awareness.";

    // Perform emotional analysis
    const emotionAnalysis = await analyzeEmotionalTone(entryText);
    
    // Calculate word count and other metrics
    const wordCount = entryText.split(/\s+/).length;
    const insightDepth = calculateInsightDepth(entryText);

    // Store the analysis results
    const analysisResult = {
      insight: aiInsight,
      emotionScore: emotionAnalysis.score,
      emotionLabels: emotionAnalysis.labels,
      wordCount,
      insightDepth,
      timestamp: new Date()
    };

    logger.info('AI journal analysis completed', { 
      userId: user.id,
      emotionScore: emotionAnalysis.score,
      wordCount,
      insightDepth
    });

    res.json(analysisResult);

  } catch (error: any) {
    logger.error('AI journaling failed:', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    res.status(500).json({ 
      error: 'AI journaling error',
      fallbackInsight: 'Thank you for taking time to reflect. Your thoughts and feelings are valid, and this practice of journaling is meaningful for your growth.'
    });
  }
});

// Enhanced emotional analysis
async function analyzeEmotionalTone(text: string): Promise<{ score: number; labels: string[] }> {
  try {
    const emotionPrompt = `
      Analyze the emotional content of this journal entry and respond in JSON format:
      "${text}"
      
      Provide:
      {
        "score": [1-10 emotional intensity],
        "labels": ["emotion1", "emotion2", "emotion3"]
      }
      
      Focus on the primary emotions expressed.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at emotional analysis. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: emotionPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const analysisText = response.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(analysisText || '{}');
      return {
        score: parsed.score || 5,
        labels: parsed.labels || ['reflective']
      };
    } catch (parseError) {
      return generateFallbackEmotion(text);
    }

  } catch (error) {
    logger.error('Emotion analysis failed', { error: error.message });
    return generateFallbackEmotion(text);
  }
}

// Fallback emotion analysis
function generateFallbackEmotion(text: string): { score: number; labels: string[] } {
  const positiveWords = /\b(happy|joy|grateful|love|excited|peaceful|calm|content|satisfied)\b/gi;
  const negativeWords = /\b(sad|angry|frustrated|worried|anxious|stressed|disappointed|hurt)\b/gi;
  
  const positiveMatches = text.match(positiveWords) || [];
  const negativeMatches = text.match(negativeWords) || [];
  
  let score = 5; // neutral
  let labels = ['reflective'];
  
  if (positiveMatches.length > negativeMatches.length) {
    score = 7;
    labels = ['positive', 'hopeful'];
  } else if (negativeMatches.length > positiveMatches.length) {
    score = 3;
    labels = ['challenging', 'processing'];
  }
  
  return { score, labels };
}

// Calculate insight depth based on content analysis
function calculateInsightDepth(text: string): number {
  const insightIndicators = [
    /\b(realize|understand|learn|discover|insight|awareness|pattern|connection)\b/gi,
    /\b(feel|feeling|emotion|mood|sense)\b/gi,
    /\b(because|why|reason|cause|leads to|results in)\b/gi,
    /\b(growth|change|different|better|improve)\b/gi
  ];
  
  let depth = 1;
  
  insightIndicators.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      depth += matches.length * 0.5;
    }
  });
  
  // Consider length and complexity
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 100) depth += 1;
  if (wordCount > 300) depth += 1;
  
  return Math.min(Math.round(depth), 10);
}

// Batch analysis route for multiple entries
router.post('/ai/journal/batch', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    const user = req.user;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Invalid entries array' });
    }

    logger.info('Processing batch AI analysis', { 
      userId: user.id, 
      entriesCount: entries.length 
    });

    const results = await Promise.all(
      entries.slice(0, 10).map(async (entryText: string) => { // Limit to 10 entries
        try {
          const emotionAnalysis = await analyzeEmotionalTone(entryText);
          return {
            text: entryText.substring(0, 100) + '...', // Preview
            emotionScore: emotionAnalysis.score,
            emotionLabels: emotionAnalysis.labels,
            wordCount: entryText.split(/\s+/).length,
            insightDepth: calculateInsightDepth(entryText)
          };
        } catch (error) {
          return {
            text: entryText.substring(0, 100) + '...',
            error: 'Analysis failed',
            emotionScore: 5,
            emotionLabels: ['unknown'],
            wordCount: 0,
            insightDepth: 1
          };
        }
      })
    );

    res.json({
      results,
      summary: {
        totalEntries: results.length,
        averageEmotionScore: results.reduce((sum, r) => sum + r.emotionScore, 0) / results.length,
        totalWords: results.reduce((sum, r) => sum + r.wordCount, 0)
      }
    });

  } catch (error: any) {
    logger.error('Batch AI analysis failed:', { error: error.message });
    res.status(500).json({ error: 'Batch analysis error' });
  }
});

export default router;