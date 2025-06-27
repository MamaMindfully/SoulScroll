import { useState, useEffect } from 'react';
// Remove useUser import to prevent hook violations
import useArcInsightStarter from '@/hooks/useArcInsightStarter';
import ArcResponse from './ArcResponse';
import SaveReflectionButton from './SaveReflectionButton';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MessageCircle, Sparkles, Send, Loader2, AlertTriangle } from 'lucide-react';

export default function ArcInsightStarter() {
  // Remove useUser to prevent hook violations
  const user = null;
  const isMobile = useIsMobile();
  const { insight, loading, startArcInsight, clearInsight } = useArcInsightStarter();
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Timeout handler for long requests
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setTimedOut(true), 15000);
      return () => clearTimeout(timer);
    } else {
      setTimedOut(false);
    }
  }, [loading]);

  const handleQuickStart = () => {
    setTimedOut(false);
    startArcInsight();
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;
    
    setTimedOut(false);
    await startArcInsight(customPrompt);
    setCustomPrompt('');
    setShowCustomInput(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomPrompt();
    }
  };

  if (!user) return null;

  // Show timeout message
  if (timedOut && loading) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Arc is taking too long</h3>
            <p className="text-sm">Please try again in a moment</p>
          </div>
        </div>
        <button
          onClick={() => {
            setTimedOut(false);
            clearInsight();
          }}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl border border-gray-700/50 ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 ${isMobile ? 'mb-4' : 'mb-6'}`}>
        <MessageCircle className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-indigo-400`} />
        <div>
          <h3 className={`text-white font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Ask Arc</h3>
          <p className="text-gray-400 text-sm">Your AI guide for deeper reflection</p>
        </div>
      </div>

      {/* Current insight display */}
      {insight && (
        <div className={isMobile ? 'mb-4' : 'mb-6'}>
          <ArcResponse 
            content={insight} 
            insightId={`arc-${Date.now()}`}
            showFeedback={true}
          />
          
          <div className={`flex gap-3 mt-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            <SaveReflectionButton 
              content={insight}
              source="arc"
              type="insight"
            />
            <button
              onClick={clearInsight}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Ask Again
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!insight && (
        <div className="space-y-4">
          {/* Quick start button */}
          <button
            onClick={handleQuickStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Arc is reflecting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get Personalized Insight
              </>
            )}
          </button>

          {/* Custom prompt toggle */}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="w-full text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            {showCustomInput ? 'Hide custom prompt' : 'Ask Arc something specific...'}
          </button>

          {/* Custom prompt input */}
          {showCustomInput && (
            <div className="space-y-3">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What would you like Arc to reflect on with you?"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={isMobile ? 2 : 3}
              />
              <button
                onClick={handleCustomPrompt}
                disabled={!customPrompt.trim() || loading}
                className={`flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors ${isMobile ? 'w-full' : ''}`}
              >
                <Send className="w-4 h-4" />
                Ask Arc
              </button>
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-xs">
          Arc learns from your recent journal entries to provide personalized guidance
        </p>
      </div>
    </div>
  );
}