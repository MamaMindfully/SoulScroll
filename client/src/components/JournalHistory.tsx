import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Heart, 
  Sparkles, 
  TrendingUp,
  Filter,
  Download,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { getJournalHistory, getJournalStats, searchJournalEntries, deleteJournalEntry } from '../utils/journalHistoryUtils';

interface JournalEntry {
  id: string;
  content: string;
  wordCount: number;
  timestamp: string;
  emotionalTone?: string;
  aiFeedback?: string;
  followUpPrompt?: string;
  aiPersona?: string;
  mood?: number;
  tags?: string[];
  isPrivate?: boolean;
}

interface JournalHistoryProps {
  onEntrySelect?: (entry: JournalEntry) => void;
  showStats?: boolean;
}

const JournalHistory: React.FC<JournalHistoryProps> = ({ 
  onEntrySelect,
  showStats = true 
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  });

  useEffect(() => {
    filterEntries();
  }, [entries, searchQuery, selectedFilter]);

  const loadHistory = () => {
    setIsLoading(true);
    try {
      const history = getJournalHistory();
      const journalStats = getJournalStats();
      
      setEntries(history);
      setStats(journalStats);
    } catch (error) {
      console.error('Error loading journal history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery.trim()) {
      filtered = searchJournalEntries(searchQuery, {
        minWordCount: selectedFilter === 'long' ? 100 : 0
      });
    }

    // Category filter
    switch (selectedFilter) {
      case 'recent':
        filtered = filtered.slice(0, 10);
        break;
      case 'with-feedback':
        filtered = filtered.filter(entry => entry.aiFeedback);
        break;
      case 'mama-mindfully':
        filtered = filtered.filter(entry => entry.aiPersona === 'mama-mindfully');
        break;
      case 'dreams':
        filtered = filtered.filter(entry => entry.aiPersona === 'dream-interpreter');
        break;
      case 'long':
        filtered = filtered.filter(entry => (entry.wordCount || 0) >= 100);
        break;
    }

    setFilteredEntries(filtered);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      const success = deleteJournalEntry(entryId);
      if (success) {
        loadHistory(); // Reload to update display
      }
    }
  };

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case 'mama-mindfully': return '🌼';
      case 'dream-interpreter': return '🌙';
      default: return '✨';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-wisdom/70">Loading your journal history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
              <div className="text-xs text-blue-600">Total Entries</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.currentStreak}</div>
              <div className="text-xs text-green-600">Day Streak</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalWords}</div>
              <div className="text-xs text-purple-600">Words Written</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.averageWords}</div>
              <div className="text-xs text-amber-600">Avg per Entry</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-wisdom" />
            <span>Your Journey Archive</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search your reflections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Entries', icon: BookOpen },
              { id: 'recent', label: 'Recent', icon: Calendar },
              { id: 'with-feedback', label: 'With AI Feedback', icon: Sparkles },
              { id: 'mama-mindfully', label: 'Mama Mindfully', icon: Heart },
              { id: 'dreams', label: 'Dreams', icon: '🌙' },
              { id: 'long', label: 'Long Entries', icon: TrendingUp }
            ].map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.id)}
                className="text-xs"
              >
                {typeof filter.icon === 'string' ? (
                  <span className="mr-1">{filter.icon}</span>
                ) : (
                  <filter.icon className="w-3 h-3 mr-1" />
                )}
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? 'No entries match your search' : 'No journal entries yet'}
              </p>
              <p className="text-sm text-gray-400">
                {searchQuery ? 'Try different search terms' : 'Start writing to see your journey unfold'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = expandedEntry === entry.id;
            const preview = entry.content ? entry.content.substring(0, 150) : '';
            
            return (
              <Card key={entry.id} className="border-gray-200 hover:border-gray-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      
                      {entry.aiPersona && (
                        <Badge variant="outline" className="text-xs">
                          {getPersonaIcon(entry.aiPersona)} {entry.aiPersona}
                        </Badge>
                      )}
                      
                      {entry.emotionalTone && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {entry.emotionalTone}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {entry.wordCount} words
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEntryExpansion(entry.id)}
                      >
                        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Entry Content */}
                    <div>
                      <p className="text-gray-800 leading-relaxed">
                        {isExpanded ? entry.content : `${preview}...`}
                      </p>
                      
                      {!isExpanded && entry.content && entry.content.length > 150 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => toggleEntryExpansion(entry.id)}
                          className="p-0 h-auto text-xs text-blue-600"
                        >
                          Read more
                        </Button>
                      )}
                    </div>

                    {/* AI Feedback */}
                    {isExpanded && entry.aiFeedback && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">AI Insight</span>
                        </div>
                        <p className="text-sm text-amber-700 italic">
                          {entry.aiFeedback}
                        </p>
                      </div>
                    )}

                    {/* Follow-up Prompt */}
                    {isExpanded && entry.followUpPrompt && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Gentle Guidance</span>
                        </div>
                        <p className="text-sm text-green-700">
                          {entry.followUpPrompt}
                        </p>
                      </div>
                    )}

                    {/* Entry Actions */}
                    {isExpanded && onEntrySelect && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEntrySelect(entry)}
                          className="text-xs"
                        >
                          Continue This Thread
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JournalHistory;