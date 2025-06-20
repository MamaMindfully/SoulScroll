// Journal History Utilities for SoulScroll
// Manages local storage of journal entries with full metadata

const STORAGE_KEY = 'soulscroll-journal-history';
const MAX_ENTRIES = 100; // Keep last 100 entries

/**
 * Journal Entry Structure
 * {
 *   id: string,
 *   content: string,
 *   wordCount: number,
 *   timestamp: string (ISO),
 *   emotionalTone: string,
 *   aiFeedback: string,
 *   followUpPrompt: string,
 *   aiPersona: string ('mama-mindfully', 'dream-interpreter', etc.),
 *   mood: number (1-5),
 *   tags: string[],
 *   isPrivate: boolean
 * }
 */

export function saveJournalEntry(entry) {
  try {
    const existingEntries = getJournalHistory();
    
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      wordCount: entry.content ? entry.content.trim().split(/\s+/).filter(word => word.length > 0).length : 0,
      isPrivate: false,
      tags: [],
      ...entry
    };

    // Add to beginning of array (most recent first)
    const updatedEntries = [newEntry, ...existingEntries];
    
    // Keep only the most recent entries
    const trimmedEntries = updatedEntries.slice(0, MAX_ENTRIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEntries));
    
    return newEntry;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    return null;
  }
}

export function getJournalHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading journal history:', error);
    return [];
  }
}

export function getJournalEntryById(id) {
  try {
    const entries = getJournalHistory();
    return entries.find(entry => entry.id === id);
  } catch (error) {
    console.error('Error finding journal entry:', error);
    return null;
  }
}

export function updateJournalEntry(id, updates) {
  try {
    const entries = getJournalHistory();
    const entryIndex = entries.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      console.error('Journal entry not found:', id);
      return null;
    }
    
    entries[entryIndex] = {
      ...entries[entryIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return entries[entryIndex];
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return null;
  }
}

export function deleteJournalEntry(id) {
  try {
    const entries = getJournalHistory();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries));
    return true;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return false;
  }
}

export function getJournalStats() {
  try {
    const entries = getJournalHistory();
    
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    const averageWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    
    // Calculate streak (consecutive days with entries)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    const entriesByDate = {};
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.timestamp).toDateString();
      entriesByDate[entryDate] = true;
    });
    
    // Check current streak
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (entriesByDate[dateString]) {
        if (i === 0 || tempStreak > 0) {
          tempStreak++;
          currentStreak = tempStreak;
        }
      } else {
        if (i === 0) {
          // No entry today, check yesterday
          continue;
        }
        break;
      }
    }
    
    // Calculate longest streak
    let checkingStreak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toDateString();
      
      if (entriesByDate[dateString]) {
        checkingStreak++;
        longestStreak = Math.max(longestStreak, checkingStreak);
      } else {
        checkingStreak = 0;
      }
    }
    
    // Emotional tone analysis
    const tones = entries
      .filter(entry => entry.emotionalTone)
      .map(entry => entry.emotionalTone);
    
    const moodData = entries
      .filter(entry => entry.mood)
      .map(entry => entry.mood);
    
    const averageMood = moodData.length > 0 
      ? Math.round((moodData.reduce((sum, mood) => sum + mood, 0) / moodData.length) * 10) / 10
      : 0;
    
    return {
      totalEntries,
      totalWords,
      averageWords,
      currentStreak,
      longestStreak,
      averageMood,
      commonTones: [...new Set(tones)].slice(0, 5),
      recentEntries: entries.slice(0, 5)
    };
  } catch (error) {
    console.error('Error calculating journal stats:', error);
    return {
      totalEntries: 0,
      totalWords: 0,
      averageWords: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageMood: 0,
      commonTones: [],
      recentEntries: []
    };
  }
}

export function searchJournalEntries(query, options = {}) {
  try {
    const entries = getJournalHistory();
    const {
      dateRange = null,
      emotionalTone = null,
      aiPersona = null,
      minWordCount = 0,
      tags = []
    } = options;
    
    let filteredEntries = entries;
    
    // Text search
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().split(' ');
      filteredEntries = filteredEntries.filter(entry => {
        const searchableText = [
          entry.content || '',
          entry.aiFeedback || '',
          entry.followUpPrompt || ''
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    // Date range filter
    if (dateRange && dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
    
    // Emotional tone filter
    if (emotionalTone) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.emotionalTone && entry.emotionalTone.toLowerCase().includes(emotionalTone.toLowerCase())
      );
    }
    
    // AI persona filter
    if (aiPersona) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.aiPersona === aiPersona
      );
    }
    
    // Word count filter
    if (minWordCount > 0) {
      filteredEntries = filteredEntries.filter(entry => 
        (entry.wordCount || 0) >= minWordCount
      );
    }
    
    // Tags filter
    if (tags.length > 0) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.tags && tags.some(tag => entry.tags.includes(tag))
      );
    }
    
    return filteredEntries;
  } catch (error) {
    console.error('Error searching journal entries:', error);
    return [];
  }
}

export function exportJournalData(format = 'json') {
  try {
    const entries = getJournalHistory();
    const stats = getJournalStats();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: entries.length,
      stats,
      entries
    };
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['Date', 'Content', 'Word Count', 'Emotional Tone', 'AI Feedback', 'Mood'];
      const csvRows = [headers.join(',')];
      
      entries.forEach(entry => {
        const row = [
          new Date(entry.timestamp).toLocaleDateString(),
          `"${(entry.content || '').replace(/"/g, '""')}"`,
          entry.wordCount || 0,
          entry.emotionalTone || '',
          `"${(entry.aiFeedback || '').replace(/"/g, '""')}"`,
          entry.mood || ''
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting journal data:', error);
    return null;
  }
}

export function clearJournalHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing journal history:', error);
    return false;
  }
}