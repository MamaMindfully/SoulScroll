import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Star, BookOpen, Heart } from "lucide-react";

interface EveningEntry {
  type: 'evening';
  timestamp: string;
  highPoint: string;
  lesson: string;
  emotion: string;
}

interface EveningFlowProps {
  onComplete?: () => void;
}

const EveningFlow = ({ onComplete }: EveningFlowProps) => {
  const [highPoint, setHighPoint] = useState('');
  const [lesson, setLesson] = useState('');
  const [emotion, setEmotion] = useState('');
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Ensure component is properly mounted
    setIsLoaded(true);
  }, []);

  const handleNext = () => {
    if (step === 3) {
      // Save entry to localStorage
      const entry: EveningEntry = {
        type: 'evening',
        timestamp: new Date().toISOString(),
        highPoint,
        lesson,
        emotion,
      };
      const existing = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
      localStorage.setItem('soulscroll-entries', JSON.stringify([...existing, entry]));
      
      // Mark evening ritual as completed for today
      const today = new Date().toDateString();
      localStorage.setItem('last-evening-ritual', today);
      
      if (onComplete) {
        onComplete();
      } else {
        // Navigate back to home after completion
        setLocation('/');
      }
    } else {
      setStep(step + 1);
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return <Star className="w-6 h-6 text-yellow-500" />;
      case 2: return <BookOpen className="w-6 h-6 text-blue-500" />;
      case 3: return <Heart className="w-6 h-6 text-purple-500" />;
      default: return <Moon className="w-6 h-6 text-indigo-500" />;
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !highPoint.trim();
      case 2: return !lesson.trim();
      case 3: return !emotion;
      default: return false;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <Moon className="w-8 h-8 text-indigo-500 animate-pulse mx-auto mb-2" />
          <p className="text-indigo-600">Loading Evening Ritual...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Moon className="w-8 h-8 text-indigo-500" />
            <CardTitle className="text-2xl font-bold text-primary">Evening Ritual</CardTitle>
          </div>
          <p className="text-sm text-wisdom/60">Reflect on your day with gratitude and insight</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {getStepIcon()}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">What was the best moment of your day?</p>
              <Textarea 
                value={highPoint} 
                onChange={(e) => setHighPoint(e.target.value)}
                placeholder="That moment when..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-wisdom/50 text-center">
                Celebrate the light in your day, however small
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">What did you learn or realize today?</p>
              <Textarea 
                value={lesson} 
                onChange={(e) => setLesson(e.target.value)}
                placeholder="Today taught me that..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-wisdom/50 text-center">
                Honor the wisdom gained through experience
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">What emotion are you going to bed with?</p>
              <Select value={emotion} onValueChange={setEmotion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your closing emotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peace">🕊️ Peace</SelectItem>
                  <SelectItem value="hope">🌟 Hope</SelectItem>
                  <SelectItem value="regret">😔 Regret</SelectItem>
                  <SelectItem value="gratitude">🙏 Gratitude</SelectItem>
                  <SelectItem value="fatigue">😴 Fatigue</SelectItem>
                  <SelectItem value="contentment">😌 Contentment</SelectItem>
                  <SelectItem value="reflection">🤔 Reflection</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-wisdom/50 text-center">
                Acknowledge your emotional state as you close the day
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-wisdom/20'
                  }`}
                />
              ))}
            </div>
            
            <Button 
              onClick={handleNext} 
              disabled={isNextDisabled()}
              className="px-8"
            >
              {step === 3 ? 'Complete Ritual' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EveningFlow;