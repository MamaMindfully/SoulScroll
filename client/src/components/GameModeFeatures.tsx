import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Trophy, 
  Star, 
  Calendar, 
  Zap, 
  Heart,
  Gift,
  Crown,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  daysLeft: number;
  progress: number;
  target: number;
  type: 'daily' | 'weekly' | 'monthly';
}

export default function GameModeFeatures() {
  const [selectedTab, setSelectedTab] = useState<'challenges' | 'achievements' | 'rewards'>('challenges');
  
  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Sample achievements (in real app, these would come from API)
  const achievements: Achievement[] = [
    {
      id: 'first_entry',
      title: 'First Words',
      description: 'Write your first journal entry',
      icon: '✍️',
      unlocked: (stats?.totalEntries || 0) >= 1,
      progress: Math.min(stats?.totalEntries || 0, 1),
      maxProgress: 1
    },
    {
      id: 'week_streak',
      title: 'Weekly Warrior',
      description: 'Maintain a 7-day writing streak',
      icon: '🔥',
      unlocked: (stats?.currentStreak || 0) >= 7,
      progress: Math.min(stats?.currentStreak || 0, 7),
      maxProgress: 7
    },
    {
      id: 'word_count',
      title: 'Prolific Writer',
      description: 'Write 1000 total words',
      icon: '📚',
      unlocked: false,
      progress: 432, // Would calculate from actual entries
      maxProgress: 1000
    },
    {
      id: 'emotional_range',
      title: 'Emotional Explorer',
      description: 'Experience the full range of emotions',
      icon: '🌈',
      unlocked: false,
      progress: 3,
      maxProgress: 5
    }
  ];

  // Sample challenges
  const challenges: Challenge[] = [
    {
      id: 'daily_gratitude',
      title: 'Gratitude Practice',
      description: 'Write about something you\'re grateful for today',
      reward: '50 XP + Gratitude Badge',
      daysLeft: 1,
      progress: 0,
      target: 1,
      type: 'daily'
    },
    {
      id: 'weekly_reflection',
      title: 'Deep Dive Week',
      description: 'Write 5 entries this week exploring your emotions',
      reward: '200 XP + Reflection Master Badge',
      daysLeft: 4,
      progress: 2,
      target: 5,
      type: 'weekly'
    },
    {
      id: 'mindful_moments',
      title: 'Mindful December',
      description: 'Practice mindful journaling every day this month',
      reward: 'Premium Features Trial + Mindfulness Crown',
      daysLeft: 15,
      progress: 16,
      target: 31,
      type: 'monthly'
    }
  ];

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'challenges': return Target;
      case 'achievements': return Trophy;
      case 'rewards': return Gift;
      default: return Target;
    }
  };

  const getChallengeTypeColor = (type: Challenge['type']) => {
    switch (type) {
      case 'daily': return 'bg-green-100 text-green-700';
      case 'weekly': return 'bg-blue-100 text-blue-700';
      case 'monthly': return 'bg-purple-100 text-purple-700';
    }
  };

  return (
    <section className="p-6">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-wisdom flex items-center">
                <Sparkles className="w-4 h-4 text-primary mr-2" />
                Journey Challenges
              </h3>
              <p className="text-sm text-wisdom/70">
                Transform your journaling into an adventure
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-wisdom">1,240 XP</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gentle/50 rounded-lg p-1">
            {(['challenges', 'achievements', 'rewards'] as const).map((tab) => {
              const Icon = getTabIcon(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-wisdom/70 hover:text-wisdom'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="capitalize">{tab}</span>
                </button>
              );
            })}
          </div>

          {/* Challenges Tab */}
          {selectedTab === 'challenges' && (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="bg-white rounded-lg p-4 border border-gentle">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-wisdom">{challenge.title}</h4>
                        <Badge className={`text-xs ${getChallengeTypeColor(challenge.type)}`}>
                          {challenge.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-wisdom/70 mb-2">{challenge.description}</p>
                      <p className="text-xs text-accent font-medium">{challenge.reward}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-wisdom/60 mb-1">
                        {challenge.daysLeft} days left
                      </div>
                      <div className="text-sm font-medium text-wisdom">
                        {challenge.progress}/{challenge.target}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gentle rounded-full h-2 mb-3">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    ></div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    Start Challenge
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Achievements Tab */}
          {selectedTab === 'achievements' && (
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`bg-white rounded-lg p-4 border transition-all ${
                    achievement.unlocked 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gentle'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-wisdom">{achievement.title}</h4>
                        {achievement.unlocked && (
                          <Crown className="w-4 h-4 text-accent" />
                        )}
                      </div>
                      <p className="text-sm text-wisdom/70 mb-2">{achievement.description}</p>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gentle rounded-full h-1.5">
                          <div 
                            className={`rounded-full h-1.5 transition-all duration-300 ${
                              achievement.unlocked ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-wisdom/60">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rewards Tab */}
          {selectedTab === 'rewards' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gentle">
                <div className="flex items-center space-x-4 mb-4">
                  <Star className="w-8 h-8 text-accent" />
                  <div>
                    <h4 className="font-medium text-wisdom">Premium Trial</h4>
                    <p className="text-sm text-wisdom/70">7-day free trial unlocked!</p>
                  </div>
                </div>
                <Button className="w-full bg-accent hover:bg-accent/90">
                  Claim Reward
                </Button>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gentle opacity-60">
                <div className="flex items-center space-x-4 mb-4">
                  <Heart className="w-8 h-8 text-wisdom/40" />
                  <div>
                    <h4 className="font-medium text-wisdom/60">Custom Themes</h4>
                    <p className="text-sm text-wisdom/50">Complete 30-day streak to unlock</p>
                  </div>
                </div>
                <Button variant="outline" disabled className="w-full">
                  Locked - 23 days to go
                </Button>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gentle opacity-60">
                <div className="flex items-center space-x-4 mb-4">
                  <Calendar className="w-8 h-8 text-wisdom/40" />
                  <div>
                    <h4 className="font-medium text-wisdom/60">Monthly Reflection Letter</h4>
                    <p className="text-sm text-wisdom/50">Write 20 entries to unlock</p>
                  </div>
                </div>
                <Button variant="outline" disabled className="w-full">
                  Locked - {20 - (stats?.totalEntries || 0)} entries to go
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}