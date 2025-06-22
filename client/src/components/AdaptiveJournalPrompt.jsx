import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Clock, Target, Heart, Brain } from 'lucide-react';

export default function AdaptiveJournalPrompt() {
  const { user, userTraits, preferredPromptType, peakHours, trackBehavior } = useUser();
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [isOptimalTime, setIsOptimalTime] = useState(false);

  useEffect(() => {
    if (!user || !userTraits) return;

    // Check if current time is within user's peak hours
    const currentHour = new Date().getHours();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
    setIsOptimalTime(peakHours.includes(currentTime));

    // Generate adaptive prompt based on user traits
    const generatePrompt = () => {
      const prompts = {
        affirmation: {
          concise: [
            "You are resilient and capable.",
            "Your growth is happening perfectly.",
            "You have everything you need within you."
          ],
          balanced: [
            "Today, I choose to honor both my achievements and my areas of growth.",
            "I am learning to trust the process of my own unfolding.",
            "My journey is uniquely mine, and I celebrate each step forward."
          ],
          reflective: [
            "As I move through this day, I carry with me the wisdom of all my experiences, knowing that each challenge has been preparing me for this moment of expansion.",
            "I am becoming more aligned with my authentic self, releasing what no longer serves me and embracing what helps me flourish.",
            "My heart and mind are opening to new possibilities that honor both my dreams and my current reality."
          ]
        },
        reflection: {
          concise: [
            "What deserves your attention today?",
            "How are you growing?",
            "What feels most true right now?"
          ],
          balanced: [
            "What part of your story wants to be witnessed today?",
            "How can you honor both your needs and your growth today?",
            "What would it look like to show up authentically in this moment?"
          ],
          reflective: [
            "If you could have a conversation with the version of yourself from one year ago, what wisdom would you share about the journey that has led you to this present moment?",
            "What patterns in your life are asking to be transformed, and how might you approach them with both compassion and courage?",
            "In what ways are you being called to expand beyond your comfort zone while still honoring your need for safety and grounding?"
          ]
        }
      };

      const style = userTraits.writingStyle || 'balanced';
      const type = preferredPromptType;
      const promptArray = prompts[type][style];
      
      return promptArray[Math.floor(Math.random() * promptArray.length)];
    };

    setCurrentPrompt(generatePrompt());
  }, [user, userTraits, preferredPromptType, peakHours]);

  const handlePromptInteraction = (action) => {
    trackBehavior('adaptive_prompt_interaction', {
      action,
      promptType: preferredPromptType,
      writingStyle: userTraits?.writingStyle,
      isOptimalTime,
      timestamp: new Date().toISOString()
    });
  };

  if (!currentPrompt) return null;

  const getIcon = () => {
    if (preferredPromptType === 'affirmation') {
      return <Heart className="w-5 h-5 text-pink-400" />;
    }
    return <Brain className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="text-white font-semibold">
              {preferredPromptType === 'affirmation' ? 'Your Affirmation' : 'Your Reflection'}
            </h3>
            <p className="text-slate-400 text-sm">
              Personalized for your {userTraits?.writingStyle || 'balanced'} style
            </p>
          </div>
        </div>
        
        {isOptimalTime && (
          <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs">
            <Clock className="w-3 h-3" />
            Optimal time
          </div>
        )}
      </div>

      <p className="text-white text-lg leading-relaxed mb-6">
        {currentPrompt}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => handlePromptInteraction('use_prompt')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Target className="w-4 h-4" />
          Use this prompt
        </button>
        <button
          onClick={() => {
            handlePromptInteraction('generate_new');
            // Regenerate prompt
            window.location.reload();
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Generate new
        </button>
      </div>

      {!isOptimalTime && peakHours.length > 0 && (
        <p className="text-slate-500 text-xs mt-3">
          Your peak writing times: {peakHours.join(', ')}
        </p>
      )}
    </div>
  );
}