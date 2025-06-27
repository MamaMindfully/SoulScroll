import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Heart, Target, Smile } from "lucide-react";

interface MorningEntry {
  type: 'morning';
  timestamp: string;
  gratitude: string;
  intention: string;
  mood: string;
}

interface MorningFlowProps {
  onComplete?: () => void;
}

const MorningFlow = ({ onComplete }: MorningFlowProps) => {
  const [gratitude, setGratitude] = useState('');
  const [intention, setIntention] = useState('');
  const [mood, setMood] = useState('');
  const [step, setStep] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setIsLoaded(true);
  });

  const handleNext = () => {
    if (step === 3) {
      try {
        const entry: MorningEntry = {
          type: 'morning',
          timestamp: new Date().toISOString(),
          gratitude: gratitude.trim(),
          intention: intention.trim(),
          mood,
        };
        
        const existing = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
        localStorage.setItem('soulscroll-entries', JSON.stringify([...existing, entry]));
        
        const today = new Date().toDateString();
        localStorage.setItem('last-morning-ritual', today);
        
        const completedRituals = JSON.parse(localStorage.getItem('soulscroll-completed-rituals') || '[]');
        if (!completedRituals.includes(today)) {
          completedRituals.push(today);
          localStorage.setItem('soulscroll-completed-rituals', JSON.stringify(completedRituals));
        }
        
        if (onComplete) {
          onComplete();
        } else {
          setLocation('/');
        }
      } catch (error) {
        console.error('Error saving morning ritual:', error);
        setLocation('/');
      }
    } else {
      setStep(step + 1);
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return <Heart className="w-6 h-6 text-pink-500" />;
      case 2: return <Target className="w-6 h-6 text-blue-500" />;
      case 3: return <Smile className="w-6 h-6 text-green-500" />;
      default: return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !gratitude.trim();
      case 2: return !intention.trim();
      case 3: return !mood;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sun className="w-8 h-8 text-yellow-500" />
            <CardTitle className="text-2xl font-bold text-primary">Morning Ritual</CardTitle>
          </div>
          <p className="text-sm text-wisdom/60">Start your day with intention and gratitude</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {getStepIcon()}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">What are you grateful for today?</p>
              <Textarea 
                value={gratitude} 
                onChange={(e) => setGratitude(e.target.value)}
                placeholder="I'm grateful for..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-wisdom/50 text-center">
                Take a moment to appreciate the good in your life
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">What intention do you want to carry into the day?</p>
              <Textarea 
                value={intention} 
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Today I intend to..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-wisdom/50 text-center">
                Set a guiding purpose for your day ahead
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">How are you feeling right now?</p>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your current mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">🧘 Calm</SelectItem>
                  <SelectItem value="focused">🎯 Focused</SelectItem>
                  <SelectItem value="anxious">😰 Anxious</SelectItem>
                  <SelectItem value="tired">😴 Tired</SelectItem>
                  <SelectItem value="excited">✨ Excited</SelectItem>
                  <SelectItem value="peaceful">🕊️ Peaceful</SelectItem>
                  <SelectItem value="hopeful">🌱 Hopeful</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-wisdom/50 text-center">
                Acknowledge your current emotional state
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

export default MorningFlow;