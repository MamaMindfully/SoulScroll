import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Users } from "lucide-react";

interface Chapter {
  id: number;
  title: string;
  emotions: string[];
  theme: string;
  summary: string;
  entryCount: number;
  createdAt: string;
}

interface ChapterCardProps {
  chapter: Chapter;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEmotionColor = (emotion: string) => {
    const colors = {
      joy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      sadness: 'bg-blue-100 text-blue-800 border-blue-200',
      anger: 'bg-red-100 text-red-800 border-red-200',
      fear: 'bg-purple-100 text-purple-800 border-purple-200',
      surprise: 'bg-green-100 text-green-800 border-green-200',
      reflection: 'bg-gray-100 text-gray-800 border-gray-200',
      growth: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      uncertainty: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      peace: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      love: 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[emotion.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="bg-gradient-to-br from-black/60 to-gray-900/60 border border-white/10 text-white shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">{chapter.title}</h2>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(chapter.createdAt)}</span>
          </div>
        </div>

        <p className="text-sm italic text-amber-200 mb-3 font-medium">
          {chapter.theme}
        </p>

        <blockquote className="text-base text-gray-200 leading-relaxed mb-4 italic border-l-2 border-amber-400 pl-4">
          "{chapter.summary}"
        </blockquote>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {chapter.emotions.map((emotion, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className={`${getEmotionColor(emotion)} text-xs font-medium`}
              >
                {emotion}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{chapter.entryCount} entries</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChapterCard;