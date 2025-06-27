import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Heart, Sparkles, ChevronRight, Download } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { exportEntryToPDF, exportMultipleEntriesToPDF } from '@/utils/pdfExport';

interface JournalEntry {
  id: number;
  content: string;
  emotionalTone?: string;
  wordCount?: number;
  createdAt: string;
  aiResponse?: string;
}

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['/api/journal/entries'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-semibold mb-2">Please Log In</h2>
            <p className="text-gray-600 mb-4">
              Access your personal reflection feed by logging in.
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="w-full">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const journalEntries = entries || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Your Reflections
              </h1>
              <p className="text-gray-600 mt-1">
                A journey through your thoughts and insights
              </p>
            </div>
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              {journalEntries.length} entries
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {journalEntries.length === 0 ? (
          <Card className="w-full mt-8">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your Journey Begins Here
              </h3>
              <p className="text-gray-600 mb-6">
                Start writing your first journal entry to see your reflections here.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              >
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 mt-6">
            {journalEntries.map((entry: JournalEntry) => (
              <Card 
                key={entry.id} 
                className="w-full hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedEntry(entry)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
                      <CardTitle className="text-sm text-gray-600">
                        {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
                      </CardTitle>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.emotionalTone && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.emotionalTone}
                        </Badge>
                      )}
                      {entry.wordCount && (
                        <Badge variant="outline" className="text-xs">
                          {entry.wordCount} words
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-800 leading-relaxed line-clamp-3">
                    {entry.content}
                  </p>
                  {entry.aiResponse && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800 italic">
                        "{entry.aiResponse.substring(0, 120)}..."
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(selectedEntry.createdAt), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(selectedEntry.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedEntry(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 max-h-[60vh]">
              <CardContent className="p-6">
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedEntry.content}
                  </p>
                </div>
                
                {selectedEntry.aiResponse && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Reflection
                    </h4>
                    <p className="text-blue-800 italic leading-relaxed">
                      {selectedEntry.aiResponse}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
                  {selectedEntry.wordCount && (
                    <span>{selectedEntry.wordCount} words</span>
                  )}
                  {selectedEntry.emotionalTone && (
                    <Badge variant="secondary">
                      {selectedEntry.emotionalTone}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}