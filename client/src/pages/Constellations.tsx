import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MonthlyConstellationCard from '@/components/MonthlyConstellationCard';
import { useAppStore } from '@/store/appStore';
import { Sparkles, Plus, Clock, Calendar } from "lucide-react";

interface ConstellationData {
  id: number;
  title: string;
  themes: string[];
  summary: string;
  guidingQuestion?: string;
  entryCount: number;
  createdAt: string;
}

interface GenerationStatus {
  shouldGenerate: boolean;
  reason: string;
  hasConstellations: boolean;
  lastConstellationDate: string | null;
}

const Constellations: React.FC = () => {
  const [constellations, setConstellations] = useState<ConstellationData[]>([]);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { userId, isLoggedIn } = useAppStore();

  const fetchConstellations = async () => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/monthly-constellations?userId=${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        setConstellations(data);
      }
    } catch (error) {
      console.error('Failed to fetch constellations:', error);
    }
  };

  const checkGenerationStatus = async () => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/monthly-constellations/should-generate?userId=${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        setGenerationStatus(data);
      }
    } catch (error) {
      console.error('Failed to check generation status:', error);
    }
  };

  const generateConstellation = async () => {
    setIsGenerating(true);
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch('/api/generate-monthly-constellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdToUse })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refresh constellations and status
        await Promise.all([fetchConstellations(), checkGenerationStatus()]);
      } else {
        const error = await response.json();
        console.error('Constellation generation failed:', error.error);
      }
    } catch (error) {
      console.error('Failed to generate constellation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchConstellations(), checkGenerationStatus()]);
      setIsLoading(false);
    };

    loadData();
  }, [userId, isLoggedIn]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Monthly Constellations</h1>
        </div>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Poetic summaries of your emotional evolution. Each constellation captures the themes, 
          growth, and wisdom from your journaling journey over the past month.
        </p>
      </div>

      {/* Generation Status Card */}
      {generationStatus && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-purple-800">Constellation Generation</span>
              </div>
              {generationStatus.shouldGenerate && (
                <Button
                  onClick={generateConstellation}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Constellation
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="text-purple-800">
              <p className="font-medium mb-2">{generationStatus.reason}</p>
              {generationStatus.shouldGenerate ? (
                <p className="text-sm">
                  You have enough journal entries to create a new monthly constellation. 
                  This will analyze your recent insights and create a poetic summary of your emotional journey.
                </p>
              ) : (
                <p className="text-sm">
                  {generationStatus.hasConstellations 
                    ? 'Continue journaling to build toward your next constellation.'
                    : 'Start journaling regularly to generate your first monthly constellation.'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constellations List */}
      {constellations.length > 0 ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Journey ({constellations.length} constellations)
            </h2>
            <Badge variant="outline" className="text-gray-600">
              Most Recent First
            </Badge>
          </div>
          
          {constellations.map((constellation) => (
            <MonthlyConstellationCard key={constellation.id} data={constellation} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent>
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No constellations yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start journaling regularly to generate your first monthly constellation. 
              Each constellation captures the poetic essence of your emotional evolution.
            </p>
            <Button
              onClick={generateConstellation}
              disabled={!generationStatus?.shouldGenerate || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate First Constellation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Constellations;