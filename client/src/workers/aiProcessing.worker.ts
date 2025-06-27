// Web Worker for handling AI processing tasks off the main thread

interface AIProcessingTask {
  type: 'analyze_sentiment' | 'generate_insights' | 'process_voice';
  data: any;
  id: string;
}

interface AIProcessingResult {
  id: string;
  result: any;
  error?: string;
}

// Sentiment analysis without AI API
const analyzeSentimentLocal = (text: string) => {
  const positiveWords = [
    'happy', 'joy', 'love', 'excited', 'grateful', 'amazing', 'wonderful', 
    'great', 'fantastic', 'excellent', 'beautiful', 'peaceful', 'confident',
    'proud', 'accomplished', 'blessed', 'thankful', 'optimistic', 'hopeful'
  ];
  
  const negativeWords = [
    'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious',
    'stressed', 'tired', 'exhausted', 'overwhelmed', 'upset', 'hurt',
    'lonely', 'depressed', 'annoyed', 'irritated', 'discouraged', 'fearful'
  ];
  
  const neutralWords = [
    'okay', 'fine', 'normal', 'average', 'typical', 'usual', 'regular',
    'standard', 'ordinary', 'neutral', 'balanced', 'calm', 'steady'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (positiveWords.includes(cleanWord)) positiveCount++;
    else if (negativeWords.includes(cleanWord)) negativeCount++;
    else if (neutralWords.includes(cleanWord)) neutralCount++;
  });
  
  const total = positiveCount + negativeCount + neutralCount;
  
  if (total === 0) {
    return { sentiment: 'neutral', confidence: 0.5, scores: { positive: 0, negative: 0, neutral: 1 } };
  }
  
  const positiveScore = positiveCount / total;
  const negativeScore = negativeCount / total;
  const neutralScore = neutralCount / total;
  
  let sentiment: string;
  let confidence: number;
  
  if (positiveScore > negativeScore && positiveScore > neutralScore) {
    sentiment = 'positive';
    confidence = positiveScore;
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    sentiment = 'negative';
    confidence = negativeScore;
  } else {
    sentiment = 'neutral';
    confidence = Math.max(neutralScore, 0.5);
  }
  
  return {
    sentiment,
    confidence,
    scores: {
      positive: positiveScore,
      negative: negativeScore,
      neutral: neutralScore
    }
  };
};

// Generate insights based on text patterns
const generateInsightsLocal = (text: string) => {
  const insights = [];
  const wordCount = text.split(/\s+/).length;
  
  // Word count insights
  if (wordCount > 200) {
    insights.push("You've written quite extensively today. This shows deep reflection and engagement with your thoughts.");
  } else if (wordCount < 50) {
    insights.push("Sometimes brief reflections can be just as powerful as longer ones. Quality over quantity.");
  }
  
  // Pattern detection
  const questions = (text.match(/\?/g) || []).length;
  if (questions > 3) {
    insights.push("You're asking many questions today. This curiosity and self-inquiry is a sign of growth and self-awareness.");
  }
  
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 2) {
    insights.push("Your writing shows strong emotions today. Remember that all feelings are valid and temporary.");
  }
  
  // Time-related insights
  const timeWords = ['today', 'yesterday', 'tomorrow', 'future', 'past', 'now', 'moment'];
  const timeMatches = timeWords.filter(word => text.toLowerCase().includes(word));
  
  if (timeMatches.includes('future') || timeMatches.includes('tomorrow')) {
    insights.push("You're thinking about the future. Setting intentions and visualizing positive outcomes can be powerful tools for manifestation.");
  }
  
  if (timeMatches.includes('past') || timeMatches.includes('yesterday')) {
    insights.push("Reflecting on the past can provide valuable lessons. Remember to balance looking back with moving forward.");
  }
  
  return insights.length > 0 ? insights : ["Thank you for taking time to reflect today. Every moment of self-awareness contributes to your growth."];
};

// Process voice data (placeholder for more complex processing)
const processVoice = (audioData: ArrayBuffer) => {
  // This would typically involve speech-to-text processing
  // For now, return a placeholder response
  return {
    transcription: "Voice processing completed",
    duration: audioData.byteLength / 1000, // Rough estimate
    confidence: 0.8
  };
};

// Main message handler
self.onmessage = (event: MessageEvent<AIProcessingTask>) => {
  const { type, data, id } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'analyze_sentiment':
        result = analyzeSentimentLocal(data.text);
        break;
        
      case 'generate_insights':
        result = generateInsightsLocal(data.text);
        break;
        
      case 'process_voice':
        result = processVoice(data.audioData);
        break;
        
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
    
    const response: AIProcessingResult = { id, result };
    self.postMessage(response);
    
  } catch (error) {
    const response: AIProcessingResult = {
      id,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(response);
  }
};

export {};