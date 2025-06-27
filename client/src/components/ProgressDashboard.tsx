import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Heart, Flame, BookOpen, Award, Unlock, Crown, Download } from "lucide-react";
import { evaluateUnlockables } from '../utils/UnlockablesEngine';
import { usePremium } from "@/context/PremiumContext";
import { exportJournalToPDF } from '../utils/PDFExportEngine';

interface JournalEntry {
  type: 'morning' | 'evening' | 'reflection';
  timestamp: string;
  emotion?: string;
  mood?: string;
  [key: string]: any;
}

interface EmotionTrends {
  [emotion: string]: number;
}

const ProgressDashboard = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [emotionTrends, setEmotionTrends] = useState<EmotionTrends>({});
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [soulSeeds, setSoulSeeds] = useState(0);
  const [unlockables, setUnlockables] = useState<string[]>([]);
  const { isPremium } = usePremium();

  const handleExport = () => {
    const entries = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
    exportJournalToPDF(entries);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('soulscroll-entries');
      const entries = stored ? JSON.parse(stored) : [];
      const reflectionCount = parseInt(localStorage.getItem('soulscroll-reflection-count') || '0');
      
      setEntries(Array.isArray(entries) ? entries : []);
      setSoulSeeds(reflectionCount);
      
      calculateStreak(entries);
      extractEmotionTrends(entries);
      calculateWeeklyProgress(entries);
      setUnlockables(evaluateUnlockables(entries));
    } catch (error) {
      console.error('Error loading progress data:', error);
      setEntries([]);
      setSoulSeeds(0);
      setStreak(0);
      setEmotionTrends({});
      setWeeklyProgress(0);
      setUnlockables([]);
    }
  });

  const calculateStreak = (entries: JournalEntry[]) => {
    const uniqueDays = new Set(entries.map(e => new Date(e.timestamp).toDateString()));
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let streakCount = 0;
    if (uniqueDays.has(today)) streakCount++;
    if (uniqueDays.has(yesterday)) streakCount++;
    
    // Calculate longer streaks by checking consecutive days
    const sortedDays = Array.from(uniqueDays).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let currentStreak = 0;
    let lastDate = new Date();
    
    for (const dayString of sortedDays) {
      const day = new Date(dayString);
      const diffDays = Math.floor((lastDate.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak++;
        lastDate = day;
      } else {
        break;
      }
    }

    setStreak(Math.max(streakCount, currentStreak));
  };

  const extractEmotionTrends = (entries: JournalEntry[]) => {
    const emotions = entries
      .filter(e => e.emotion || e.mood)
      .map(e => e.emotion || e.mood)
      .filter(Boolean);

    const counts: EmotionTrends = {};
    emotions.forEach(emotion => {
      if (emotion) {
        counts[emotion] = (counts[emotion] || 0) + 1;
      }
    });

    setEmotionTrends(counts);
  };

  const calculateWeeklyProgress = (entries: JournalEntry[]) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(e => new Date(e.timestamp) >= oneWeekAgo);
    const progress = Math.min((recentEntries.length / 14) * 100, 100); // Assuming 2 entries per day as ideal
    setWeeklyProgress(progress);
  };

  const getTopEmotions = () => {
    return Object.entries(emotionTrends)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  const formatEmotionDisplay = (emotion: string) => {
    const emotionEmojis: { [key: string]: string } = {
      'gratitude': '🙏',
      'peace': '🕊️',
      'hope': '🌟',
      'joy': '😊',
      'excitement': '✨',
      'calm': '🧘',
      'contentment': '😌',
      'reflection': '🤔',
      'tired': '😴',
      'stressed': '😰',
      'anxious': '😟',
      'sad': '😢',
      'overwhelmed': '😵',
      'frustrated': '😤'
    };

    return `${emotionEmojis[emotion] || '💝'} ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`;
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Your SoulScroll Journey</h1>
          <p className="text-wisdom/60">Tracking your path of self-discovery and growth</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-2xl font-bold">{streak}</span>
              </div>
              <p className="text-sm text-wisdom/60">Day Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <BookOpen className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-bold">{entries.length}</span>
              </div>
              <p className="text-sm text-wisdom/60">Total Entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Heart className="w-6 h-6 text-purple-500" />
                <span className="text-2xl font-bold">{soulSeeds}</span>
              </div>
              <p className="text-sm text-wisdom/60">SoulSeeds</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Weekly Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Reflection Activity</span>
                <span>{Math.round(weeklyProgress)}%</span>
              </div>
              <Progress value={weeklyProgress} className="h-2" />
              <p className="text-xs text-wisdom/50">
                Keep nurturing your inner dialogue for deeper insights
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emotion Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Emotional Landscape</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTopEmotions().length > 0 ? (
              <div className="space-y-3">
                {getTopEmotions().map(([emotion, count]) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      {formatEmotionDisplay(emotion)}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-wisdom/10 rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-500"
                          style={{ width: `${(count / Math.max(...Object.values(emotionTrends))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-wisdom/60 w-8">{count}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-wisdom/50 mt-4">
                  Your emotional patterns reveal the themes of your inner journey
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-wisdom/50">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Start your journaling journey to see your emotional landscape emerge</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements & Unlockables */}
        {unlockables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Achievements Unlocked</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {unlockables.map((unlock, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <Unlock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-800">{unlock}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-wisdom/50 mt-4">
                Continue your journey to unlock more rewards and insights
              </p>
            </CardContent>
          </Card>
        )}

        {/* Premium Status & Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Premium Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPremium ? (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium text-yellow-800">Premium Active</p>
                  <p className="text-xs text-wisdom/50 mt-1">
                    All premium features unlocked
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export My Journal</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={() => {
                    // Demo activation - in production this would redirect to payment
                    console.log("Demo premium activation");
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium py-3 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
                >
                  Activate Premium (Demo)
                </button>
                <p className="text-xs text-wisdom/50 mt-2">
                  Unlock PDF export and advanced features
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entries.slice(-5).reverse().map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-wisdom/10 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm capitalize">
                        {entry.type} ritual
                      </span>
                    </div>
                    <span className="text-xs text-wisdom/50">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;