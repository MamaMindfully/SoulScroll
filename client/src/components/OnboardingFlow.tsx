import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserPreferences {
  intent: string;
  ritualTime: string;
}

interface OnboardingFlowProps {
  saveUserPreferences: (preferences: UserPreferences) => void;
}

const OnboardingFlow = ({ saveUserPreferences }: OnboardingFlowProps) => {
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState('');
  const [ritualTime, setRitualTime] = useState('');

  const handleNext = () => {
    if (step === 2) {
      saveUserPreferences({ intent, ritualTime });
      setLocation('/'); // Navigate to home
    } else {
      setStep(step + 1);
    }
  };

  const isNextDisabled = (step === 1 && !intent) || (step === 2 && !ritualTime);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome to SoulScroll</CardTitle>
          <p className="text-sm text-wisdom/60">Your journey of self-discovery begins</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">Why are you here today?</p>
              <Select value={intent} onValueChange={setIntent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your intention" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self-discovery">Self-Discovery</SelectItem>
                  <SelectItem value="emotional-clarity">Emotional Clarity</SelectItem>
                  <SelectItem value="creative-expression">Creative Expression</SelectItem>
                  <SelectItem value="mental-reset">Mental Reset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-center">When do you most want to journal?</p>
              <Select value={ritualTime} onValueChange={setRitualTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your ritual time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="flexible">Whenever I feel it</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-1">
              {[1, 2].map((i) => (
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
              disabled={isNextDisabled}
              className="px-8"
            >
              {step === 2 ? 'Begin Journey' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;