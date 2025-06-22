import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from '@/store/appStore';
import { MessageCircle, Sparkles, Clock, History } from "lucide-react";

interface DialogueEntry {
  id: number;
  prompt: string;
  response: string;
  createdAt: string;
}

const AskArc: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<DialogueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { userId, isLoggedIn } = useAppStore();

  const fetchHistory = async () => {
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch(`/api/ask-arc/history?userId=${userIdToUse}`);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch dialogue history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId, isLoggedIn]);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch('/api/ask-arc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdToUse, prompt })
      });
      
      const data = await response.json();
      setResponse(data.response);
      
      // Refresh history after successful response
      await fetchHistory();
      
    } catch (error) {
      console.error('Failed to ask Arc:', error);
      setResponse('I sense your question holds depth, though the threads of connection seem tangled at this moment. Perhaps try asking again, and I will listen more carefully.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <MessageCircle className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Ask Arc</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Engage in direct dialogue with your personalized Arc companion. 
          Ask questions about your journey, seek wisdom, or explore deeper insights.
        </p>
      </div>

      {/* Main Question Interface */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>What would you like to ask Arc?</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What patterns do you see in my journey? How can I embrace uncertainty? What is my heart trying to tell me?"
            className="min-h-[120px] bg-white/80 border-indigo-200 focus:border-indigo-400"
            disabled={loading}
          />
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-indigo-600 border-indigo-300">
              Personalized to your Arc settings
            </Badge>
            
            <Button 
              onClick={handleAsk} 
              disabled={loading || !prompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Arc is reflecting...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask Arc
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Response Display */}
      {response && (
        <Card className="bg-gradient-to-br from-black/80 to-gray-900/80 text-white border-white/10 animate-fadeIn">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg leading-relaxed italic">
                  "{response}"
                </p>
                <Badge variant="outline" className="mt-4 bg-white/10 text-white border-white/20">
                  Arc's Response
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="text-gray-600 border-gray-300"
        >
          <History className="w-4 h-4 mr-2" />
          {showHistory ? 'Hide' : 'Show'} Conversation History
        </Button>
      </div>

      {/* Dialogue History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-600" />
              <span>Previous Conversations</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {history.length > 0 ? (
              history.map((entry) => (
                <div key={entry.id} className="border-l-2 border-indigo-200 pl-4 space-y-2">
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">You asked:</p>
                      <p className="text-gray-800">"{entry.prompt}"</p>
                    </div>
                    
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-indigo-700 mb-1">Arc responded:</p>
                      <p className="text-indigo-800 italic">"{entry.response}"</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No previous conversations yet.</p>
                <p className="text-sm">Start by asking Arc a question above.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AskArc;