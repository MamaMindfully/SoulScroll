import { useState, useEffect } from 'react';
// Remove useUser import to prevent hook violations
import { TrendingUp, Clock, Heart, MessageSquare, BarChart3 } from 'lucide-react';

export default function BehaviorInsights() {
  const { user, userTraits, peakHours, moodBaseline, writingStyle } = useUser();
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!userTraits) return;

    const generateInsights = () => {
      const insightsList = [];

      // Writing pattern insights
      if (writingStyle === 'reflective') {
        insightsList.push({
          icon: <MessageSquare className="w-5 h-5 text-blue-400" />,
          title: 'Deep Thinker',
          description: 'You tend to write longer, more reflective entries',
          suggestion: 'Consider voice journaling for quick thoughts between deep sessions'
        });
      } else if (writingStyle === 'concise') {
        insightsList.push({
          icon: <TrendingUp className="w-5 h-5 text-green-400" />,
          title: 'Efficient Expresser',
          description: 'You capture thoughts quickly and effectively',
          suggestion: 'Try expanding one insight per week for deeper exploration'
        });
      }

      // Peak hours insights
      if (peakHours.length > 0) {
        const morningHours = peakHours.filter(h => parseInt(h.split(':')[0]) < 12);
        const eveningHours = peakHours.filter(h => parseInt(h.split(':')[0]) >= 18);
        
        if (morningHours.length > 0) {
          insightsList.push({
            icon: <Clock className="w-5 h-5 text-yellow-400" />,
            title: 'Morning Reflector',
            description: `You're most active in the morning (${morningHours.join(', ')})`,
            suggestion: 'Consider setting intentions during your morning writing time'
          });
        }
        
        if (eveningHours.length > 0) {
          insightsList.push({
            icon: <Clock className="w-5 h-5 text-purple-400" />,
            title: 'Evening Processor',
            description: `You reflect best in the evening (${eveningHours.join(', ')})`,
            suggestion: 'Use evening sessions to process the day and set tomorrow\'s focus'
          });
        }
      }

      // Mood baseline insights
      if (moodBaseline > 60) {
        insightsList.push({
          icon: <Heart className="w-5 h-5 text-pink-400" />,
          title: 'Positive Outlook',
          description: 'Your entries generally reflect optimism and growth',
          suggestion: 'Consider sharing your positivity through community features'
        });
      } else if (moodBaseline < 40) {
        insightsList.push({
          icon: <Heart className="w-5 h-5 text-indigo-400" />,
          title: 'Thoughtful Processing',
          description: 'You use journaling to work through challenges',
          suggestion: 'Remember to celebrate small wins and progress in your entries'
        });
      }

      // Prompt preference insights
      if (userTraits.likesAffirmations) {
        insightsList.push({
          icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
          title: 'Affirmation Focused',
          description: 'You respond well to positive affirmations',
          suggestion: 'Try creating personal mantras based on your recent insights'
        });
      } else if (userTraits.likesQuestions) {
        insightsList.push({
          icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
          title: 'Question Explorer',
          description: 'You enjoy deeper reflection prompts',
          suggestion: 'Experiment with the "Go Deeper" feature for profound insights'
        });
      }

      return insightsList.slice(0, 3); // Show top 3 insights
    };

    setInsights(generateInsights());
  }, [userTraits, peakHours, moodBaseline, writingStyle]);

  if (!userTraits || insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-6 border border-gray-700/50">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        Your Journaling Patterns
      </h3>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-black/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {insight.icon}
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{insight.title}</h4>
                <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                <p className="text-gray-400 text-xs italic">{insight.suggestion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <p className="text-gray-500 text-xs">
          Based on your writing patterns • Updates as you journal
        </p>
      </div>
    </div>
  );
}