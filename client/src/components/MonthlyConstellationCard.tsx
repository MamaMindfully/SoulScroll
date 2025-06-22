import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Sparkles } from "lucide-react";

interface ConstellationData {
  id: number;
  title: string;
  themes: string[];
  summary: string;
  guidingQuestion?: string;
  entryCount: number;
  createdAt: string;
}

interface MonthlyConstellationCardProps {
  data: ConstellationData;
}

const MonthlyConstellationCard: React.FC<MonthlyConstellationCardProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  const getThemeColor = (theme: string) => {
    const colors = {
      grief: 'bg-purple-100 text-purple-800 border-purple-200',
      growth: 'bg-green-100 text-green-800 border-green-200',
      control: 'bg-amber-100 text-amber-800 border-amber-200',
      love: 'bg-pink-100 text-pink-800 border-pink-200',
      uncertainty: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      surrender: 'bg-blue-100 text-blue-800 border-blue-200',
      healing: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      transformation: 'bg-violet-100 text-violet-800 border-violet-200',
      acceptance: 'bg-teal-100 text-teal-800 border-teal-200',
      release: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colors[theme.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900 via-indigo-900 to-black border border-purple-700/30 shadow-2xl overflow-hidden">
      <CardContent className="p-8 text-white relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400 to-transparent rounded-full blur-2xl"></div>
        </div>

        {/* Header */}
        <div className="relative mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-purple-300" />
              <h2 className="text-2xl font-bold text-white leading-tight">
                {data.title}
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-purple-200 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(data.createdAt)}</span>
            </div>
          </div>

          {/* Themes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {data.themes.map((theme, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className={`${getThemeColor(theme)} text-xs font-medium capitalize`}
              >
                {theme}
              </Badge>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="relative mb-6">
          <blockquote className="text-lg leading-relaxed text-purple-100 italic border-l-2 border-purple-400 pl-4">
            "{data.summary}"
          </blockquote>
        </div>

        {/* Guiding Question */}
        {data.guidingQuestion && (
          <div className="relative mb-4">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
              <p className="text-purple-200 italic font-medium">
                "{data.guidingQuestion}"
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative flex items-center justify-between text-sm text-purple-300/80 pt-4 border-t border-purple-700/30">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>{data.entryCount} journal entries analyzed</span>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>Monthly Constellation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyConstellationCard;