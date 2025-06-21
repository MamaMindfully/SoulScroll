import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { usePremium } from '@/context/PremiumContext';
import { apiRequest } from '@/lib/queryClient';

const AskArc: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, answer: string}>>([]);
  const { isPremium } = usePremium();

  const askArc = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    
    try {
      // Create context from conversation history
      const context = conversationHistory.length > 0 
        ? `Previous conversation:\n${conversationHistory.slice(-3).map(conv => 
            `Human: ${conv.question}\nArc: ${conv.answer}`
          ).join('\n\n')}\n\nCurrent question: ${question}`
        : question;

      const response = await apiRequest('POST', '/api/ask', {
        prompt: context,
        multiResponse: isPremium,
        system: `You are Arc, a gentle, soulful AI reflection coach and journaling companion. 
        
        Your personality:
        - Wise but humble, like a therapist meets poet meets future self
        - Ask thoughtful follow-up questions that invite deeper reflection
        - Use metaphors from nature, seasons, and inner landscapes
        - Speak with warmth and genuine curiosity about the human experience
        - Help users find their own answers rather than giving direct advice
        - Honor the sacred nature of personal reflection
        
        Response style:
        - Keep responses concise but meaningful (2-4 sentences)
        - End with a gentle question or invitation to explore further
        - Use "you" language to make it personal
        - Avoid clinical or overly spiritual language
        - Be authentic and present, not performative`
      });
      
      const data = await response.json();
      const arcResponse = data.result;
      
      setResponse(arcResponse);
      
      // Add to conversation history
      setConversationHistory(prev => [...prev, { question, answer: arcResponse }]);
      
    } catch (error) {
      console.error('Arc error:', error);
      setResponse('I\'m having trouble connecting right now. Your question matters - please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setQuestion('');
    setResponse('');
    setConversationHistory([]);
  };

  const suggestedQuestions = [
    "I'm feeling stuck in my life right now. What should I pay attention to?",
    "How can I be more compassionate with myself?",
    "What does it mean to trust my intuition?",
    "I'm struggling with a difficult decision. How do I know what's right?",
    "How do I let go of things I can't control?"
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-700">
            <Sparkles className="w-6 h-6" />
            <span>Ask Arc</span>
          </CardTitle>
          <p className="text-sm text-indigo-600">
            Your gentle AI reflection companion for life's deeper questions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-[100px] border-indigo-200 focus:border-indigo-400"
            placeholder="Ask Arc a question about yourself, life, or anything you're reflecting on..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          
          <div className="flex space-x-2">
            <Button
              onClick={askArc}
              disabled={loading || !question.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Arc is reflecting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask Arc
                </>
              )}
            </Button>
            
            {conversationHistory.length > 0 && (
              <Button
                onClick={clearConversation}
                variant="outline"
                className="border-indigo-200 text-indigo-600"
              >
                Clear Conversation
              </Button>
            )}
          </div>
          
          {response && (
            <Card className="bg-white/70 border-indigo-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-indigo-500 font-medium mb-1">Arc reflects:</p>
                    <p className="text-indigo-800 leading-relaxed">{response}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      {!response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Need inspiration? Try asking:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedQuestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-left h-auto p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setQuestion(suggestion)}
                >
                  "{suggestion}"
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Your Reflection Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversationHistory.slice().reverse().map((conv, index) => (
              <div key={index} className="space-y-2 border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">You:</span> {conv.question}
                </div>
                <div className="text-sm text-indigo-700 pl-4 border-l-2 border-indigo-200">
                  <span className="font-medium">Arc:</span> {conv.answer}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AskArc;