import { apiRequest } from '../lib/queryClient';

export async function findSimilarReflections(currentEntry) {
  try {
    // Use existing journal entries API instead of Supabase
    const response = await apiRequest('GET', '/api/journal/entries?limit=20');
    const pastEntries = await response.json();

    if (!pastEntries || pastEntries.length === 0) {
      return null;
    }

    // Create embeddings and find similarity
    const currentVector = await createEmbedding(currentEntry);
    const similarScores = await Promise.all(
      pastEntries.map(async (entry) => {
        const vector = await createEmbedding(entry.content);
        const score = cosineSimilarity(currentVector, vector);
        return { ...entry, score };
      })
    );

    const ranked = similarScores.sort((a, b) => b.score - a.score);
    return ranked[0].score > 0.8 ? ranked[0] : null;
  } catch (error) {
    console.error('Error finding similar reflections:', error);
    return null;
  }
}

async function createEmbedding(text) {
  try {
    // Use OpenAI embeddings API through our backend
    const response = await apiRequest('POST', '/api/embeddings', {
      text: text
    });
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    // Return a simple hash-based similarity as fallback
    return simpleTextVector(text);
  }
}

function simpleTextVector(text) {
  // Simple fallback: create a basic text vector for similarity
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(100).fill(0);
  
  words.forEach((word, index) => {
    const hash = hashCode(word) % 100;
    vector[Math.abs(hash)] += 1;
  });
  
  return vector;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function findReflectionPatterns(userId) {
  try {
    const response = await apiRequest('GET', '/api/journal/entries?limit=50');
    const entries = await response.json();

    const patterns = {
      commonThemes: extractCommonThemes(entries),
      emotionalProgression: analyzeEmotionalProgression(entries),
      growthMilestones: identifyGrowthMilestones(entries)
    };

    return patterns;
  } catch (error) {
    console.error('Error finding reflection patterns:', error);
    return null;
  }
}

function extractCommonThemes(entries) {
  const themes = {};
  const keywords = ['grateful', 'anxious', 'excited', 'worried', 'peaceful', 'frustrated', 'hopeful', 'tired', 'energized', 'creative'];
  
  entries.forEach(entry => {
    keywords.forEach(keyword => {
      if (entry.content.toLowerCase().includes(keyword)) {
        themes[keyword] = (themes[keyword] || 0) + 1;
      }
    });
  });

  return Object.entries(themes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));
}

function analyzeEmotionalProgression(entries) {
  // Simple emotional trend analysis
  const recentEntries = entries.slice(0, 10);
  const emotionalWords = {
    positive: ['happy', 'grateful', 'excited', 'peaceful', 'content', 'hopeful', 'energized'],
    negative: ['sad', 'anxious', 'frustrated', 'worried', 'tired', 'stressed', 'overwhelmed']
  };

  const scores = recentEntries.map(entry => {
    let positiveScore = 0;
    let negativeScore = 0;

    emotionalWords.positive.forEach(word => {
      if (entry.content.toLowerCase().includes(word)) positiveScore++;
    });

    emotionalWords.negative.forEach(word => {
      if (entry.content.toLowerCase().includes(word)) negativeScore++;
    });

    return { 
      date: entry.createdAt, 
      score: positiveScore - negativeScore,
      entry: entry.content.substring(0, 100) + '...'
    };
  });

  return scores;
}

function identifyGrowthMilestones(entries) {
  const milestones = [];
  const growthKeywords = ['learned', 'realized', 'discovered', 'breakthrough', 'insight', 'understanding', 'clarity'];

  entries.forEach(entry => {
    growthKeywords.forEach(keyword => {
      if (entry.content.toLowerCase().includes(keyword)) {
        milestones.push({
          date: entry.createdAt,
          keyword: keyword,
          excerpt: extractSentenceWith(entry.content, keyword)
        });
      }
    });
  });

  return milestones.slice(0, 10); // Return top 10 milestones
}

function extractSentenceWith(text, keyword) {
  const sentences = text.split(/[.!?]+/);
  const sentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase()));
  return sentence ? sentence.trim() : text.substring(0, 100) + '...';
}