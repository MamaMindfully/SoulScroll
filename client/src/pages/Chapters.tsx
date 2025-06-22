import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChapterCard from '@/components/ChapterCard';
import { useAppStore } from '@/store/appStore';
import { BookOpen, Plus, Sparkles, Clock } from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  emotions: string[];
  theme: string;
  summary: string;
  entryCount: number;
  createdAt: string;
}

interface GenerationStatus {
  shouldGenerate: boolean;
  hasChapters: boolean;
  lastChapterDate: string | null;
}

const Chapters: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { userId, isLoggedIn } = useAppStore();

  const fetchChapters = async () => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/chapters?userId=${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        setChapters(data);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const checkGenerationStatus = async () => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/chapters/should-generate?userId=${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        setGenerationStatus(data);
      }
    } catch (error) {
      console.error('Failed to check generation status:', error);
    }
  };

  const generateChapter = async () => {
    setIsGenerating(true);
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdToUse })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refresh chapters and status
        await Promise.all([fetchChapters(), checkGenerationStatus()]);
      } else {
        const error = await response.json();
        console.error('Chapter generation failed:', error.error);
      }
    } catch (error) {
      console.error('Failed to generate chapter:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchChapters(), checkGenerationStatus()]);
      setIsLoading(false);
    };

    loadData();
  }, [userId, isLoggedIn]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8 text-amber-600" />
          <h1 className="text-3xl font-bold text-gray-900">Your Life Chapters</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover the narrative of your emotional journey through AI-generated chapter summaries 
          that capture the themes, growth, and insights from your journaling practice.
        </p>
      </div>

      {/* Generation Status Card */}
      {generationStatus && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800">Chapter Generation</span>
              </div>
              {generationStatus.shouldGenerate && (
                <Button
                  onClick={generateChapter}
                  disabled={isGenerating}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Chapter
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {generationStatus.shouldGenerate ? (
              <div className="text-amber-800">
                <p className="font-medium mb-2">Ready to create a new chapter!</p>
                <p className="text-sm">
                  You have enough journal entries to generate a new life chapter. 
                  This will analyze your recent insights and create a poetic summary of your emotional journey.
                </p>
              </div>
            ) : generationStatus.hasChapters ? (
              <div className="text-amber-700">
                <p className="font-medium mb-2">Keep journaling to unlock your next chapter</p>
                <p className="text-sm">
                  Continue writing journal entries to build toward your next life chapter. 
                  New chapters are generated every 4-5 weeks with sufficient entries.
                </p>
              </div>
            ) : (
              <div className="text-amber-700">
                <p className="font-medium mb-2">Start your journey</p>
                <p className="text-sm">
                  Write at least 5 journal entries to generate your first life chapter. 
                  Each chapter captures the emotional themes and growth from your reflections.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chapters List */}
      {chapters.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Journey ({chapters.length} chapters)
            </h2>
            <Badge variant="outline" className="text-gray-600">
              Most Recent First
            </Badge>
          </div>
          
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No chapters yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start journaling regularly to generate your first life chapter. 
              Each chapter captures the emotional themes and insights from your journey.
            </p>
            <Button
              onClick={generateChapter}
              disabled={!generationStatus?.shouldGenerate || isGenerating}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate First Chapter
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Chapters;