import { useState } from 'react';
// Remove useUser import to prevent hook violations
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

export default function InsightFeedback({ insightId, insightType = 'general' }) {
  const { user, trackBehavior } = useUser();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendFeedback = async (rating) => {
    if (!user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/insight-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          insightId, 
          rating,
          insightType 
        })
      });

      if (response.ok) {
        setSubmitted(true);
        
        // Track feedback behavior
        trackBehavior('insight_feedback', {
          insightId,
          rating,
          insightType,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400 mt-3">
        <Check className="w-4 h-4" />
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
      <span className="text-sm text-white/60">Was this helpful?</span>
      
      <div className="flex gap-2">
        <button
          onClick={() => sendFeedback('helpful')}
          disabled={isSubmitting}
          className="flex items-center gap-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <ThumbsUp className="w-3 h-3" />
          Yes
        </button>
        
        <button
          onClick={() => sendFeedback('not_helpful')}
          disabled={isSubmitting}
          className="flex items-center gap-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <ThumbsDown className="w-3 h-3" />
          No
        </button>
      </div>
    </div>
  );
}