import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Moon, Stars, Sparkles, Brain, Heart, Eye } from "lucide-react";
import { isPremiumUser } from '../utils/SubscriptionEngine';

interface DreamEntry {
  id: string;
  dreamIntent: string;
  dreamLog: string;
  aiInterpretation: string;
  timestamp: string;
  symbols: string[];
  emotionalTone: string;
}

const DreamMode = () => {
  const [dreamIntent, setDreamIntent] = useState('');
  const [dreamLog, setDreamLog] = useState('');
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [stage, setStage] = useState<'intention' | 'dream' | 'interpretation'>('intention');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dreamHistory, setDreamHistory] = useState<DreamEntry[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [emotionalTone, setEmotionalTone] = useState('');
  const isPremium = isPremiumUser();

  useEffect(() => {
    // Load dream history from localStorage
    const stored = JSON.parse(localStorage.getItem('soulscroll-dreams') || '[]');
    setDreamHistory(stored);

    // Check if there's a pending intention
    const storedIntent = localStorage.getItem('soulscroll-dream-intent');
    if (storedIntent && stage === 'intention') {
      setDreamIntent(storedIntent);
      setStage('dream');
    }
  }, []);

  const handleIntentSubmit = () => {
    if (!dreamIntent.trim()) return;
    
    localStorage.setItem('soulscroll-dream-intent', dreamIntent);
    setStage('dream');
  };

  const handleDreamSubmit = async () => {
    if (!dreamLog.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const fullInput = `Dream Content: ${dreamLog}\nOriginal Intention: ${dreamIntent}`;
      
      const response = await fetch('/api/interpret-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: fullInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get dream interpretation');
      }

      const data = await response.json();
      setAiInterpretation(data.interpretation);
      setSymbols(data.symbols || []);
      setEmotionalTone(data.emotionalTone || 'Neutral');
      
      // Save dream entry
      const newDreamEntry: DreamEntry = {
        id: Date.now().toString(),
        dreamIntent,
        dreamLog,
        aiInterpretation: data.interpretation,
        timestamp: new Date().toISOString(),
        symbols: data.symbols || [],
        emotionalTone: data.emotionalTone || 'Neutral'
      };

      const updatedHistory = [newDreamEntry, ...dreamHistory].slice(0, 10); // Keep last 10 dreams
      setDreamHistory(updatedHistory);
      localStorage.setItem('soulscroll-dreams', JSON.stringify(updatedHistory));
      
      setStage('interpretation');
    } catch (error) {
      console.error('Dream interpretation error:', error);
      setAiInterpretation('Unable to interpret your dream at this moment. Your subconscious wisdom speaks through symbols - trust your inner knowing.');
      setStage('interpretation');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetDreamMode = () => {
    setDreamIntent('');
    setDreamLog('');
    setAiInterpretation('');
    setSymbols([]);
    setEmotionalTone('');
    setStage('intention');
    localStorage.removeItem('soulscroll-dream-intent');
  };

  if (!isPremium) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Moon className="w-6 h-6" />
            <span>🌙 Dream Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Premium Feature</h3>
            <p className="text-purple-600 mb-4">
              Unlock dream interpretation and mystical insights with AI-powered analysis
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Moon className="w-6 h-6" />
            <span>🌙 Dream Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stage === 'intention' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Stars className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-semibold text-purple-800 mb-2">Set Your Dream Intention</h3>
                <p className="text-purple-600">
                  Before sleep, plant a seed in your subconscious mind
                </p>
              </div>
              
              <Textarea
                value={dreamIntent}
                onChange={(e) => setDreamIntent(e.target.value)}
                placeholder="Tonight, may I dream about finding clarity on my life path..."
                className="min-h-[120px] border-purple-200 focus:border-purple-400"
              />
              
              <Button 
                onClick={handleIntentSubmit}
                disabled={!dreamIntent.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              >
                <Moon className="w-4 h-4 mr-2" />
                Set Intention & Sleep
              </Button>
            </div>
          )}

          {stage === 'dream' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Eye className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                <h3 className="text-xl font-semibold text-purple-800 mb-2">Morning Dream Recall</h3>
                <p className="text-purple-600">
                  What visions visited you in the night?
                </p>
                <Badge variant="outline" className="mt-2 border-purple-300 text-purple-700">
                  Intent: {dreamIntent}
                </Badge>
              </div>
              
              <Textarea
                value={dreamLog}
                onChange={(e) => setDreamLog(e.target.value)}
                placeholder="I found myself in a vast forest, where ancient trees whispered secrets..."
                className="min-h-[150px] border-purple-200 focus:border-purple-400"
              />
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleDreamSubmit}
                  disabled={!dreamLog.trim() || isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Interpreting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Interpret Dream
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={resetDreamMode}
                  variant="outline"
                  className="border-purple-300 text-purple-700"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {stage === 'interpretation' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Brain className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                <h3 className="text-xl font-semibold text-purple-800 mb-2">🔮 Dream Wisdom</h3>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    Tone: {emotionalTone}
                  </Badge>
                  {symbols.length > 0 && (
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                      {symbols.length} Symbols
                    </Badge>
                  )}
                </div>
              </div>

              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Heart className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-800 leading-relaxed italic">
                      {aiInterpretation}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {symbols.length > 0 && (
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Dream Symbols</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {symbols.map((symbol, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={resetDreamMode}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              >
                <Moon className="w-4 h-4 mr-2" />
                New Dream Journey
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dream History */}
      {dreamHistory.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Stars className="w-5 h-5" />
              <span>Dream Journal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {dreamHistory.slice(0, 3).map((dream) => (
                <div key={dream.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-600">
                      {new Date(dream.timestamp).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                      {dream.emotionalTone}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {dream.dreamLog}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DreamMode;