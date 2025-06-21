import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Globe, Quote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WisdomQuote {
  id: number;
  content: string;
  createdAt: string;
  emotionalTone?: string;
}

const WisdomFeed: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [inspirationalQuotes] = useState([
    "The cave you fear to enter holds the treasure you seek.",
    "What if the question isn't who am I, but how am I becoming?",
    "Your wounds are the places where the light enters you.",
    "The quieter you become, the more you can hear.",
    "Growth happens in the space between who you were and who you're becoming.",
    "Sometimes the most productive thing you can do is rest.",
    "Your intuition is your inner compass; trust its direction.",
    "Healing isn't about forgetting; it's about changing your relationship to the memory.",
    "The path isn't about becoming someone else; it's about becoming who you already are.",
    "In the depth of winter, I finally learned that within me there lay an invincible summer."
  ]);

  // Fetch recent journal insights from community (anonymized)
  const { data: communityWisdom } = useQuery({
    queryKey: ['/api/journal/community-wisdom'],
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get a random selection of quotes
  const getRandomQuotes = (count: number = 5) => {
    const shuffled = [...inspirationalQuotes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const [displayQuotes, setDisplayQuotes] = useState<string[]>([]);

  useEffect(() => {
    setDisplayQuotes(getRandomQuotes());
  }, []);

  // Combine community wisdom with inspirational quotes
  const allWisdom = [
    ...(communityWisdom || []).slice(0, 3),
    ...displayQuotes.slice(0, 4)
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-700">
          <Globe className="w-5 h-5" />
          <span>Wisdom from the Collective</span>
        </CardTitle>
        <p className="text-sm text-slate-600">
          Reflections and insights from your journaling community
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allWisdom.map((quote, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-white/70 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <Quote className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed italic">
                {typeof quote === 'string' ? quote : quote.content}
              </p>
            </div>
          ))}
        </div>
        
        {displayQuotes.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={() => setDisplayQuotes(getRandomQuotes())}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              Refresh wisdom ↻
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WisdomFeed;