import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Heart, Target, Smile, AlertCircle } from "lucide-react";
import { morningEntrySchema, markFlowCompleted, safeLocalStorageSet } from "@/utils/flowValidation";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const validateCurrentStep = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1 && gratitude.trim().length < 5) {
      newErrors.gratitude = 'Please write at least 5 characters about what you\'re grateful for';
    }
    if (step === 2 && intention.trim().length < 5) {
      newErrors.intention = 'Please write at least 5 characters about your intention';
    }
    if (step === 3 && !mood) {
      newErrors.mood = 'Please select your current mood';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, gratitude, intention, mood]);

  const handleNext = useCallback(async () => {
    if (!validateCurrentStep()) return;
    
    if (step === 3) {
      setIsSubmitting(true);
      
      try {
        // Validate complete entry
        const entryData = {
          gratitude: gratitude.trim(),
          intention: intention.trim(),
          mood
        };
        
        const validatedData = morningEntrySchema.parse(entryData);
        
        const entry: MorningEntry = {
          type: 'morning',
          timestamp: new Date().toISOString(),
          ...validatedData,
        };
        
        // Save with error handling
        const existing = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
        const success = safeLocalStorageSet('soulscroll-entries', [...existing, entry]);
        
        if (success) {
          markFlowCompleted('morning');
          
          if (onComplete) {
            onComplete();
          } else {
            setLocation('/');
          }
        } else {
          throw new Error('Failed to save entry');
        }
      } catch (error) {
        console.error('Error saving morning ritual:', error);
        setErrors({ submit: 'Failed to save your ritual. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep(step + 1);
    }
  }, [step, gratitude, intention, mood, validateCurrentStep, onComplete, setLocation]);

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
                onChange={(e) => {
                  setIntention(e.target.value);
                  if (errors.intention) setErrors(prev => ({ ...prev, intention: '' }));
                }}
                placeholder="Today I intend to..."
                className={`min-h-[120px] resize-none ${errors.intention ? 'border-red-500' : ''}`}
                maxLength={200}
              />
              {errors.intention && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.intention}
                </div>
              )}
              <div className="text-xs text-gray-400 text-right">
                {intention.length}/200 characters
              </div>
              <p className="text-xs text-wisdom/50 text-center">
                Set a guiding purpose for your day ahead
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">How are you feeling right now?</p>
              <Select value={mood} onValueChange={(value) => {
                setMood(value);
                if (errors.mood) setErrors(prev => ({ ...prev, mood: '' }));
              }}>
                <SelectTrigger className={errors.mood ? 'border-red-500' : ''}>
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
              disabled={isSubmitting}
              className="px-8"
            >
              {isSubmitting ? 'Saving...' : step === 3 ? 'Complete Ritual' : 'Next'}
            </Button>
            
            {errors.submit && (
              <div className="flex items-center gap-1 text-red-500 text-xs mt-2">
                <AlertCircle className="w-3 h-3" />
                {errors.submit}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MorningFlow;