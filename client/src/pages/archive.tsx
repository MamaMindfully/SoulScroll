import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Quote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { formatDistanceToNow } from 'date-fns';

interface SavedReflection {
  id: string;
  reflection_text: string;
  created_at: string;
  archived: boolean;
}

export default function Archive() {
  const { isAuthenticated } = useAuth();

  const { data: savedReflections, isLoading } = useQuery({
    queryKey: ['/api/reflections/saved'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <Heart className="w-12 h-12 mx-auto text-pink-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign In Required</h2>
                <p className="text-slate-600 mb-4">
                  Please sign in to view your saved reflections archive.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center space-x-2">
              <Heart className="w-8 h-8 text-pink-500" />
              <span>Your Reflection Archive</span>
            </h1>
            <p className="text-slate-600">
              Insights and reflections you've chosen to save and treasure
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !savedReflections || savedReflections.length === 0 ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <Quote className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No Saved Reflections Yet
                </h3>
                <p className="text-slate-600 mb-4">
                  Start journaling and save meaningful AI insights to build your personal collection.
                </p>
                <p className="text-sm text-slate-500">
                  Look for the ❤️ Save button below AI reflections to add them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {savedReflections.map((reflection: SavedReflection) => (
                <Card key={reflection.id} className="bg-white/80 backdrop-blur border-pink-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-pink-600 border-pink-300">
                        <Heart className="w-3 h-3 mr-1" />
                        Saved Reflection
                      </Badge>
                      <div className="flex items-center space-x-1 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(reflection.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <Quote className="w-5 h-5 text-pink-400 mb-2" />
                      <p className="text-slate-700 leading-relaxed italic">
                        {reflection.reflection_text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}