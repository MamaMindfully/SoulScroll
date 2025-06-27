import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  sessionType?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  trigger,
  isOpen: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  sessionType = "journaling session"
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Store feedback locally for now
      const feedbackData = {
        rating,
        feedback,
        sessionType,
        timestamp: new Date().toISOString(),
      };

      const existingFeedback = localStorage.getItem('soulscroll-feedback');
      const feedbackHistory = existingFeedback ? JSON.parse(existingFeedback) : [];
      feedbackHistory.push(feedbackData);
      localStorage.setItem('soulscroll-feedback', JSON.stringify(feedbackHistory));

      toast({
        title: "Thank You!",
        description: "Your feedback helps us create a better journaling experience.",
      });

      // Reset form
      setRating(0);
      setFeedback('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const questions = [
    "Was this helpful for your reflection?",
    "What would you improve about this experience?",
    "How did this session make you feel?",
    "What features would you like to see added?"
  ];

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Share Your Experience</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              How was your {sessionType}?
            </Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {randomQuestion}
            </Label>
            <Textarea
              placeholder="Share your thoughts, suggestions, or feelings about this experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send Feedback'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;