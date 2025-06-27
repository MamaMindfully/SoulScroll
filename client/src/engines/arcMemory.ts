// Arc Memory engine for extracting and summarizing journal entries
interface JournalEntry {
  id: number;
  content: string;
  createdAt: string;
  emotionalTone?: string;
  wordCount?: number;
  aiReflection?: string;
}

interface MemoryExtract {
  date: string;
  mood: string;
  theme: string;
  quote: string;
  insight?: string;
  wordCount: number;
}

export function extractMemory(entry: JournalEntry): MemoryExtract {
  const date = new Date(entry.createdAt).toISOString().split('T')[0];
  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Extract a meaningful quote (first sentence or first 100 chars)
  const content = entry.content || '';
  const firstSentence = content.split(/[.!?]/)[0];
  const quote = firstSentence.length > 10 && firstSentence.length < 120 
    ? firstSentence.trim() + '...'
    : content.slice(0, 100).trim() + '...';

  // Determine theme based on content keywords
  const getTheme = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('blessed')) {
      return 'Gratitude';
    }
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('stress')) {
      return 'Processing';
    }
    if (lowerText.includes('love') || lowerText.includes('relationship') || lowerText.includes('family')) {
      return 'Connection';
    }
    if (lowerText.includes('work') || lowerText.includes('career') || lowerText.includes('job')) {
      return 'Purpose';
    }
    if (lowerText.includes('dream') || lowerText.includes('goal') || lowerText.includes('future')) {
      return 'Aspiration';
    }
    if (lowerText.includes('learn') || lowerText.includes('grow') || lowerText.includes('change')) {
      return 'Growth';
    }
    if (lowerText.includes('peace') || lowerText.includes('calm') || lowerText.includes('quiet')) {
      return 'Serenity';
    }
    
    return 'Reflection';
  };

  return {
    date: formattedDate,
    mood: entry.emotionalTone || 'Contemplative',
    theme: getTheme(content),
    quote,
    insight: entry.aiReflection ? entry.aiReflection.slice(0, 80) + '...' : undefined,
    wordCount: entry.wordCount || content.split(' ').length
  };
}

export function summarizeArchive(entries: JournalEntry[]): MemoryExtract[] {
  return entries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(extractMemory);
}

export function getThemeStats(entries: JournalEntry[]): { [theme: string]: number } {
  const archive = summarizeArchive(entries);
  const themeCount: { [theme: string]: number } = {};
  
  archive.forEach(memory => {
    themeCount[memory.theme] = (themeCount[memory.theme] || 0) + 1;
  });
  
  return themeCount;
}

export function getMoodPattern(entries: JournalEntry[]): { [mood: string]: number } {
  const archive = summarizeArchive(entries);
  const moodCount: { [mood: string]: number } = {};
  
  archive.forEach(memory => {
    moodCount[memory.mood] = (moodCount[memory.mood] || 0) + 1;
  });
  
  return moodCount;
}

export function getRecentMemories(entries: JournalEntry[], days: number = 7): MemoryExtract[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return entries
    .filter(entry => new Date(entry.createdAt) >= cutoffDate)
    .map(extractMemory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}