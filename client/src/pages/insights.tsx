import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TreePine, 
  Sparkles, 
  Heart,
  Calendar,
  TrendingUp,
  Eye,
  Target,
  Compass,
  Lightbulb
} from "lucide-react";
import EmotionalResonanceCard from '@/components/EmotionalResonanceCard';
import TreeProgress from '@/components/TreeProgress';
import WeeklyPortalCard from '@/components/WeeklyPortalCard';
import AffirmationActionCard from '@/components/AffirmationActionCard';
import InnerCompass from '@/components/InnerCompass';
import SecretScrollModal from '@/components/SecretScrollModal';
import TestingDashboard from '@/components/TestingDashboard';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePremium } from '@/hooks/usePremium';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSecretScroll, setShowSecretScroll] = useState(false);
  const [secretScroll, setSecretScroll] = useState<any>(null);
  const { profile } = useUserProfile();
  const { isPremium } = usePremium();

  const insightCards = [
    {
      id: 'emotional',
      title: 'Emotional Resonance',
      icon: Heart,
      description: 'Track emotional patterns and intensity',
      component: EmotionalResonanceCard,
      premium: false
    },
    {
      id: 'tree',
      title: 'Growth Tree',
      icon: TreePine,
      description: 'Visualize your journaling journey',
      component: TreeProgress,
      premium: false
    },
    {
      id: 'portal',
      title: 'Weekly Portal',
      icon: Sparkles,
      description: 'Discover mystical themes and guidance',
      component: WeeklyPortalCard,
      premium: true
    },
    {
      id: 'affirmation',
      title: 'Affirmation Actions',
      icon: Target,
      description: 'Transform affirmations into daily tasks',
      component: AffirmationActionCard,
      premium: true
    },
    {
      id: 'compass',
      title: 'Inner Compass',
      icon: Compass,
      description: 'Daily emotional themes and guidance',
      component: InnerCompass,
      premium: false
    }
  ];

  const testSecretScroll = () => {
    const mockScroll = {
      id: 'test-scroll',
      title: 'The Scroll of Inner Wisdom',
      content: 'As the ancient trees whisper their secrets to the wind, so too does your soul speak through the words you write. Each entry is a seed planted in the garden of consciousness, growing into wisdom that transcends the moment of its creation.',
      unlocked_at: new Date().toISOString(),
      milestone: 'test',
      type: 'wisdom'
    };
    setSecretScroll(mockScroll);
    setShowSecretScroll(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wisdom-50 to-serenity-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            Insights Dashboard
          </h1>
          <p className="text-gray-600">
            Discover patterns, growth, and wisdom from your journaling journey
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={testSecretScroll}
            variant="outline"
            className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <Eye className="w-4 h-4" />
            Test Secret Scroll
          </Button>
        </div>

        {/* Insights Grid */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="patterns"
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Patterns
            </TabsTrigger>
            <TabsTrigger 
              value="growth"
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Growth
            </TabsTrigger>
            <TabsTrigger 
              value="testing"
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insightCards.map((card) => {
                const Component = card.component;
                const Icon = card.icon;
                
                return (
                  <Card key={card.id} className="relative hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-gray-800">
                        <Icon className="w-5 h-5 text-purple-600" />
                        {card.title}
                        {card.premium && !isPremium && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                            Premium
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {card.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {card.premium && !isPremium ? (
                        <div className="text-center py-8 space-y-3">
                          <div className="text-gray-500">
                            <Lightbulb className="w-12 h-12 mx-auto mb-2 text-amber-400" />
                            <p>Unlock deeper insights with Premium</p>
                          </div>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                            Upgrade to Premium
                          </Button>
                        </div>
                      ) : (
                        <Component />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Emotional Resonance Patterns
                </h3>
                <EmotionalResonanceCard />
              </Card>
              {isPremium && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Weekly Portal Themes
                  </h3>
                  <WeeklyPortalCard />
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-green-600" />
                  Growth Tree
                </h3>
                <TreeProgress />
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  Inner Compass
                </h3>
                <InnerCompass />
              </Card>
              {isPremium && (
                <Card className="p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Affirmation Actions
                  </h3>
                  <AffirmationActionCard />
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6 mt-6">
            <TestingDashboard />
          </TabsContent>
        </Tabs>

        {/* Secret Scroll Modal */}
        {showSecretScroll && secretScroll && (
          <SecretScrollModal
            scroll={secretScroll}
            onClose={() => setShowSecretScroll(false)}
          />
        )}
      </div>
    </div>
  );
}