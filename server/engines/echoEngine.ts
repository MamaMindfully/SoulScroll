import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
import { retryOpenAICall } from '../utils/retryUtils';
import { captureError } from '../utils/errorHandler';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateEcho(userId: string, recentInsights: string[]): Promise<string> {
  try {
    if (!recentInsights || recentInsights.length === 0) {
      return "Your journey of reflection begins with each word you write.";
    }

    const prompt = `
You are a poetic observer of a person's inner life.
Below are recent insights from their journal entries. 
Return one single sentence that feels like a subtle reflection, poetic but grounded — as if whispered back by memory.

INSIGHTS:
${recentInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

Give only the sentence. No framing. No introduction.
    `;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 100
      }),
      'echo-generation'
    );

    const echo = response.choices[0].message.content?.trim() || "Your thoughts ripple through time, creating patterns of meaning.";

    logger.info('Echo generated successfully', {
      userId,
      insightsCount: recentInsights.length,
      echoLength: echo.length
    });

    return echo;

  } catch (error: any) {
    captureError(error, {
      userId,
      operation: 'echo_generation',
      insightsCount: recentInsights?.length || 0
    });

    logger.error('Failed to generate echo', {
      userId,
      error: error.message
    });

    // Return a fallback echo instead of throwing
    const fallbackEchoes = [
      "Your words create ripples in the quiet spaces of understanding.",
      "Each reflection builds upon the last, weaving a tapestry of growth.",
      "In the silence between thoughts, wisdom takes root.",
      "Your journey reveals itself one insight at a time.",
      "The echoes of your reflections whisper truths yet to be discovered."
    ];

    return fallbackEchoes[Math.floor(Math.random() * fallbackEchoes.length)];
  }
}