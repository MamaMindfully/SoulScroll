import React, { useEffect, useState } from 'react';
import { X, Sparkles, Heart, BookOpen } from 'lucide-react';

export default function OnboardingModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('soulscroll_seen_intro');
    if (!hasSeenIntro) {
      // Delay showing modal to let page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  });

  const handleDismiss = () => {
    localStorage.setItem('soulscroll_seen_intro', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black text-white max-w-md w-full rounded-2xl border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Welcome to SoulScroll
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white mb-1">More than journaling</h3>
                <p className="text-sm text-gray-300">
                  This is a mirror for your soul, a compass for your emotional journey.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white mb-1">AI-powered insights</h3>
                <p className="text-sm text-gray-300">
                  Arc, your AI companion, provides personalized reflections and wisdom.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white mb-1">Explore deeply</h3>
                <p className="text-sm text-gray-300">
                  Write freely, discover patterns, and unlock the mysteries of your inner world.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Begin Your Journey
          </button>
          
          <p className="text-xs text-gray-400 text-center mt-3">
            Your thoughts remain private and secure
          </p>
        </div>
      </div>
    </div>
  );
}