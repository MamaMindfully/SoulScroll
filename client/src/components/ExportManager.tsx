import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { exportJournalEntriesPDF, exportJournalToPDF } from '@/utils/exportToPDF';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const ExportManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data: entries } = useQuery({
    queryKey: ['/api/journal/entries'],
    enabled: isAuthenticated,
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: isAuthenticated,
  });

  const handleFullExport = async () => {
    if (!entries || entries.length === 0) {
      alert('No journal entries to export.');
      return;
    }

    setIsExporting(true);
    try {
      await exportJournalEntriesPDF(entries, userStats, 'SoulScroll_Complete_Journal.pdf');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRecentExport = async () => {
    if (!entries || entries.length === 0) {
      alert('No journal entries to export.');
      return;
    }

    const recentEntries = entries.slice(0, 10); // Last 10 entries
    setIsExporting(true);
    try {
      await exportJournalEntriesPDF(recentEntries, userStats, 'SoulScroll_Recent_Entries.pdf');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleVisualExport = async () => {
    setIsExporting(true);
    try {
      await exportJournalToPDF('export-preview-content', 'SoulScroll_Visual_Export.pdf');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalWords = entries?.reduce((sum: number, entry: any) => sum + (entry.wordCount || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Download className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Export Manager</h1>
      </div>

      {/* Export Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span>Your Journaling Journey</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{entries?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalWords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Words Written</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{userStats?.currentStreak || 0}</div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats?.longestStreak || 0}</div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Complete Journal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Export all your journal entries with AI reflections and statistics.
            </p>
            <Badge variant="outline" className="text-xs">
              {entries?.length || 0} entries
            </Badge>
            <Button 
              onClick={handleFullExport} 
              disabled={isExporting || !entries?.length}
              className="w-full"
            >
              {isExporting ? 'Exporting...' : 'Export All Entries'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span>Recent Entries</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Export your most recent 10 journal entries for quick sharing.
            </p>
            <Badge variant="outline" className="text-xs">
              Last 10 entries
            </Badge>
            <Button 
              onClick={handleRecentExport} 
              disabled={isExporting || !entries?.length}
              className="w-full"
              variant="outline"
            >
              {isExporting ? 'Exporting...' : 'Export Recent'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <span>Visual Export</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a visual PDF that preserves the look and feel of your journal.
            </p>
            <Badge variant="outline" className="text-xs">
              Visual format
            </Badge>
            <Button 
              onClick={handleVisualExport} 
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              {isExporting ? 'Exporting...' : 'Visual PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Content for Visual Export */}
      <div id="export-preview-content" className="hidden">
        <div className="bg-white p-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SoulScroll Journal</h1>
            <p className="text-gray-600">Your Personal Reflection Journey</p>
            <p className="text-sm text-gray-500 mt-2">Exported on {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{entries?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalWords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Words Written</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{userStats?.currentStreak || 0}</div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{userStats?.longestStreak || 0}</div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
          </div>

          <div className="space-y-6">
            {entries?.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-500">{entry.wordCount || 0} words</span>
                </div>
                <p className="text-gray-800 leading-relaxed">{entry.content}</p>
                {entry.aiReflection && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
                    <p className="text-sm text-blue-700 italic">{entry.aiReflection}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;