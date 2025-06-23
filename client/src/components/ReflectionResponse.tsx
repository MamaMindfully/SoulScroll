import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Brain, 
  Sparkles, 
  LoaderCircle, 
  MessageCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";

interface ReflectionResponseProps {
  journalEntry: string;
  onReflectionComplete?: (reflection: any) => void;
  autoGenerate?: boolean;
}

interface ReflectionData {
  insight: string;
  followUpPrompt: string;
}

const ReflectionResponse: React.FC<ReflectionResponseProps> = ({
  journalEntry,
  onReflectionComplete,
  autoGenerate = false
}) => {
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [deeperResponse, setDeeperResponse] = useState('');

  // Auto-generate reflection if requested and journal entry exists
  React.useEffect(() => {
    if (autoGenerate && journalEntry.trim() && !hasGenerated && !isLoading) {
      generateReflection();
    }
  }, [journalEntry, autoGenerate, hasGenerated, isLoading]);

  const generateReflection = async () => {
    if (!journalEntry.trim()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reflect', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: journalEntry })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setReflection(data);
      setHasGenerated(true);
      
      // Scroll to insight section after reflection is generated
      setTimeout(() => {
        const insightBox = document.getElementById("insight-section");
        if (insightBox) {
          insightBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      
      if (onReflectionComplete) {
        onReflectionComplete(data);
      }
    } catch (error) {
      console.error('Error generating reflection:', error);
      
      // Fallback reflection
      setReflection({
        insight: "Your willingness to reflect and explore your thoughts is a beautiful practice. Every moment of self-awareness is a step toward greater understanding and growth.",
        followUpPrompt: "What feeling or thought from your entry would you like to explore more deeply?"
      });
      setHasGenerated(true);
      
      // Scroll to insight section even for fallback reflection
      setTimeout(() => {
        const insightBox = document.getElementById("insight-section");
        if (insightBox) {
          insightBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = () => {
    if (followUpResponse.trim()) {
      // Could send follow-up response to another API endpoint
      // For now, just log it
      console.log('Follow-up response:', followUpResponse);
      setFollowUpResponse('');
    }
  };

  const handleDeeperSubmit = () => {
    if (deeperResponse.trim()) {
      // Optional: Send to backend or save to localStorage
      console.log("User's deeper reflection:", deeperResponse);
      setDeeperResponse("");
      alert("Thanks for going deeper 🙏");
    }
  };

  if (!hasGenerated) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="text-center">
            <Brain className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h4 className="font-medium text-blue-800 mb-2">
              Get AI Reflection
            </h4>
            <p className="text-sm text-blue-600 mb-4">
              Receive thoughtful insights and deeper questions about your journal entry
            </p>
            <Button
              onClick={generateReflection}
              disabled={isLoading || !journalEntry.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
              style={{ minHeight: '44px' }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                  <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                    Reflecting...
                  </span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                    Generate Reflection
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reflection) {
    return null;
  }

  return (
    <div id="insight-section" className="space-y-4 fade-in">
      {/* AI Insight */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Heart className="w-5 h-5" />
            <span style={{ fontSize: 'clamp(1rem, 2.8vw, 1.2rem)' }}>
              💚 Reflection Insight
            </span>
            <Badge className="bg-green-100 text-green-800 border-green-300 ml-auto">
              AI Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-white/70 rounded-lg border border-green-200">
            <p className="text-gray-800 leading-relaxed italic">
              {reflection.insight}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Prompt */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 fade-in-delayed">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <MessageCircle className="w-5 h-5" />
            <span style={{ fontSize: 'clamp(1rem, 2.8vw, 1.2rem)' }}>
              🤔 Deeper Question
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white/70 rounded-lg border border-purple-200">
              <p className="text-gray-800 leading-relaxed font-medium">
                {reflection.followUpPrompt}
              </p>
            </div>
            
            {/* Follow-up Response Area */}
            <div className="space-y-3">
              <Textarea
                value={followUpResponse}
                onChange={(e) => setFollowUpResponse(e.target.value)}
                placeholder="Share your thoughts about this question..."
                className="min-h-[100px] border-purple-200 focus:border-purple-400 resize-none"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpResponse.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  style={{ minHeight: '44px' }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                    Reflect Further
                  </span>
                </Button>
                <Button
                  onClick={() => {
                    // Reset and generate new reflection
                    setReflection(null);
                    setHasGenerated(false);
                    setFollowUpResponse('');
                    generateReflection();
                  }}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  style={{ minHeight: '44px' }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Reflection
                </Button>
              </div>
            </div>
            
            {/* Deeper Response Box */}
            <div className="deeper-response-box">
              <textarea
                placeholder="Your response..."
                value={deeperResponse}
                onChange={(e) => setDeeperResponse(e.target.value)}
                rows={3}
                className="deeper-textarea"
              />
              <button 
                className="btn-submit" 
                onClick={handleDeeperSubmit}
                disabled={!deeperResponse.trim()}
              >
                Reflect
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReflectionResponse;