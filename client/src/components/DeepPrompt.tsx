import { useState } from 'react';
import { usePremium } from '@/context/PremiumContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Lock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DeepPromptProps {
  insight: string;
  entry: string;
  onDeepReflection?: (reflection: string) => void;
}

export default function DeepPrompt({ insight, entry, onDeepReflection }: DeepPromptProps) {
  const { isPremium } = usePremium();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [deepReflection, setDeepReflection] = useState<string>('');
  const [level, setLevel] = useState(0);

  const handleGoDeeper = async () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Deeper reflections are available for premium members only.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/deeper', {
        entry,
        basePrompt: insight,
        level,
        previousInsights: [insight]
      });
      
      const data = await response.json();
      setDeepReflection(data.deeperReflection);
      setLevel(data.level);
      
      if (onDeepReflection) {
        onDeepReflection(data.deeperReflection);
      }
      
      toast({
        title: "Deeper Insight Generated",
        description: "Your reflection has been expanded with deeper wisdom.",
      });
    } catch (error) {
      console.error('Error generating deeper reflection:', error);
      toast({
        title: "Connection Issue",
        description: "Unable to generate deeper reflection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="locked-feature mt-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Lock className="w-8 h-8 text-red-500" />
            <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Want to Go Deeper?
        </h3>
        
        <p className="text-gray-700 mb-4 text-sm">
          This deeper reflection feature is available for Premium members only.
        </p>
        
        <Button 
          onClick={() => window.location.href = "/pricing"}
          className="upgrade-cta"
        >
          Upgrade to Unlock
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {!deepReflection ? (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <Brain className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Ready to Go Deeper?
            </h3>
            <p className="text-purple-700 mb-4 text-sm">
              Unlock profound insights with AI-guided deeper reflection.
            </p>
            <Button 
              onClick={handleGoDeeper}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  Reflecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tap to Go Deeper
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-3">
              <Brain className="w-5 h-5 text-indigo-600 mr-2" />
              <h4 className="font-semibold text-indigo-900">Deeper Reflection (Level {level})</h4>
            </div>
            <p className="text-indigo-800 leading-relaxed mb-4">
              {deepReflection}
            </p>
            {level < 5 && (
              <Button 
                onClick={handleGoDeeper}
                disabled={isLoading}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                {isLoading ? 'Reflecting...' : 'Go Even Deeper'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}