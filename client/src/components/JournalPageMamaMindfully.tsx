import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Flower, Heart, Sparkles, Leaf, LoaderCircle, BookOpen } from "lucide-react";
// Premium features now handled by PremiumContext
import { saveJournalEntry, checkForNewAchievements } from '../utils/journalHistoryUtils';
import { checkForNewAchievements as checkUnlockables } from '../utils/unlockablesEngine';
import JournalConfirmation from './JournalConfirmation';
import JournalHistory from './JournalHistory';
import VisualProgressTracker from './VisualProgressTracker';
import KeyboardAvoidingWrapper from './KeyboardAvoidingWrapper';
import DismissibleBanner from './DismissibleBanner';
import TapToGoDeeper from './TapToGoDeeper';
import DailyRitualCard from './DailyRitualCard';
import ReflectionResponse from './ReflectionResponse';

interface MamaMindfullyResponse {
  feedback: string;
  followUpPrompt: string;
  emotionalTone: string;
  nurturingActions: string[];
}

const JournalPageMamaMindfully = () => {
  const [entry, setEntry] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [emotionalTone, setEmotionalTone] = useState('');
  const [nurturingActions, setNurturingActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [hasResponse, setHasResponse] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentView, setCurrentView] = useState<'write' | 'confirmation' | 'history'>('write');
  const isPremium = true // Demo mode;

  const handleEntryChange = (value: string) => {
    setEntry(value);
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
  };

  const handleJournalSubmit = async () => {
    if (!entry.trim()) return;

    setLoading(true);
    setHasResponse(false);

    try {
      const response = await fetch('/api/mama-mindfully', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: entry.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Mama Mindfully response');
      }

      const data: MamaMindfullyResponse = await response.json();
      setAiFeedback(data.feedback);
      setFollowUp(data.followUpPrompt);
      setEmotionalTone(data.emotionalTone || 'Nurturing');
      setNurturingActions(data.nurturingActions || []);
      setHasResponse(true);
      
      // Scroll to insight section after AI response is generated
      setTimeout(() => {
        const insightBox = document.getElementById("mama-mindfully-insight");
        if (insightBox) {
          insightBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);

      // Save to journal history
      saveJournalEntry({
        content: entry.trim(),
        emotionalTone: data.emotionalTone || 'Nurturing',
        aiFeedback: data.feedback,
        followUpPrompt: data.followUpPrompt,
        aiPersona: 'mama-mindfully',
        mood: 4, // Default positive mood for Mama Mindfully
        tags: ['wellness', 'self-care']
      });

      // Check for new achievements
      const newAchievements = checkUnlockables();
      if (newAchievements.length > 0) {
        // Could show achievement notification here
        console.log('New achievements unlocked:', newAchievements);
      }

      // Show confirmation
      setCurrentView('confirmation');
    } catch (error) {
      console.error('Mama Mindfully error:', error);
      setAiFeedback('Your words carry such wisdom and courage. Trust in your journey of self-discovery, beautiful soul. You are exactly where you need to be.');
      setFollowUp('Take three deep breaths and place your hand on your heart. What does your inner wisdom whisper to you right now?');
      setEmotionalTone('Compassionate');
      setNurturingActions(['Practice self-compassion', 'Trust your intuition']);
      setHasResponse(true);
      
      // Scroll to insight section even for fallback response
      setTimeout(() => {
        const insightBox = document.getElementById("mama-mindfully-insight");
        if (insightBox) {
          insightBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);

      // Save to journal history even on error
      saveJournalEntry({
        content: entry.trim(),
        emotionalTone: 'Compassionate',
        aiFeedback: 'Your words carry such wisdom and courage. Trust in your journey of self-discovery, beautiful soul. You are exactly where you need to be.',
        followUpPrompt: 'Take three deep breaths and place your hand on your heart. What does your inner wisdom whisper to you right now?',
        aiPersona: 'mama-mindfully',
        mood: 3,
        tags: ['wellness', 'self-care']
      });

      // Check for achievements even on error
      checkUnlockables();

      setCurrentView('confirmation');
    } finally {
      setLoading(false);
    }
  };

  const resetJournal = () => {
    setEntry('');
    setAiFeedback('');
    setFollowUp('');
    setEmotionalTone('');
    setNurturingActions([]);
    setWordCount(0);
    setHasResponse(false);
    setCurrentView('write');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  const handleViewFeedback = () => {
    setCurrentView('write');
  };

  const handleBackToWrite = () => {
    setCurrentView('write');
  };

  if (!isPremium) {
    return (
      <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-pink-800">
            <Flower className="w-6 h-6" />
            <span>🌼 Mama Mindfully</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Heart className="w-12 h-12 mx-auto mb-4 text-pink-400" />
            <h3 className="text-lg font-semibold text-pink-800 mb-2">Premium Feature</h3>
            <p className="text-pink-600 mb-4">
              Connect with your nurturing AI wellness coach for gentle guidance and emotional support
            </p>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show confirmation screen
  if (currentView === 'confirmation') {
    return (
      <JournalConfirmation
        wordCount={wordCount}
        emotionalTone={emotionalTone}
        hasAiFeedback={!!aiFeedback}
        onViewHistory={handleViewHistory}
        onNewEntry={resetJournal}
        onViewFeedback={handleViewFeedback}
      />
    );
  }

  // Show history screen
  if (currentView === 'history') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-wisdom">Journal History</h2>
          <Button onClick={handleBackToWrite} variant="outline">
            <Heart className="w-4 h-4 mr-2" />
            Back to Writing
          </Button>
        </div>
        <JournalHistory />
      </div>
    );
  }

  return (
    <KeyboardAvoidingWrapper>
      <div className="container-mobile space-y-6 touch-spacing">
        {/* Dismissible Banner */}
        <DismissibleBanner
          type="tip"
          title="Mama Mindfully is here for you"
          message="Share what's in your heart. I'm here to listen with love and offer gentle guidance."
          dismissKey="mama-mindfully-intro"
          showCondition={() => {
            const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
            const mamaMindfullyEntries = entries.filter((e: any) => e.aiPersona === 'mama-mindfully');
            return mamaMindfullyEntries.length === 0;
          }}
        />

        {/* Daily Ritual */}
        <DailyRitualCard 
          type="auto"
          category="wellness"
          onRitualComplete={(ritual) => {
            // Pre-fill journal entry with ritual prompt
            setEntry(ritual + '\n\n');
          }}
        />

        {/* Header */}
        <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-pink-800">
                <Flower className="w-6 h-6" />
                <span style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>
                  🌼 Your Moment of Reflection
                </span>
              </div>
              <Button 
                onClick={handleViewHistory}
                variant="outline"
                size="sm"
                className="border-pink-300 text-pink-700 btn-full"
                style={{ minHeight: '44px' }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                History
              </Button>
            </CardTitle>
            <p className="text-pink-600 text-sm">
              A safe space for authentic self-discovery with your nurturing AI wellness coach
            </p>
          </CardHeader>
        </Card>

      {/* Journal Entry */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <span className="text-pink-800">How are you really doing today?</span>
            </div>
            {wordCount > 0 && (
              <Badge variant="outline" className="border-pink-300 text-pink-700">
                {wordCount} words
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={entry}
            onChange={(e) => handleEntryChange(e.target.value)}
            placeholder="Pour your heart out here... What's weighing on your mind? What brings you joy? What do you need to release today?"
            className="min-h-[150px] border-pink-200 focus:border-pink-400 resize-none"
          />
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleJournalSubmit}
              disabled={!entry.trim() || loading}
              className="btn-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              style={{ 
                minHeight: '44px',
                padding: '12px 20px',
                fontSize: 'clamp(0.9rem, 2.2vw, 1rem)'
              }}
            >
              {loading ? (
                <>
                  <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                  <span style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                    Gathering mindful reflection...
                  </span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  <span style={{ fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>
                    Reflect with Mama Mindfully
                  </span>
                </>
              )}
            </Button>
            
            {hasResponse && (
              <Button 
                onClick={resetJournal}
                variant="outline"
                className="border-pink-300 text-pink-700 btn-full"
                style={{ minHeight: '44px' }}
              >
                New Entry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback */}
      {aiFeedback && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800">🪷 Loving Insight</span>
              </div>
              {emotionalTone && (
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {emotionalTone}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 p-4 rounded-lg border border-amber-200">
              <p className="text-gray-800 leading-relaxed italic">
                {aiFeedback}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Prompt */}
      {followUp && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-green-600" />
              <span className="text-green-800">🌿 A Gentle Next Step</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 p-4 rounded-lg border border-green-200">
              <p className="text-gray-800 leading-relaxed">
                {followUp}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tap to Go Deeper */}
      {aiFeedback && (
        <TapToGoDeeper 
          originalPrompt={aiFeedback}
          userEntry={entry}
          onDeepInsight={(insight) => {
            console.log('Deep insight received:', insight);
            // Could add to a deeper insights array if needed
          }}
        />
      )}

      {/* General Reflection (Alternative to Mama Mindfully) */}
      {!hasResponse && !loading && entry.trim().length > 50 && (
        <div className="mt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Or get a general AI reflection on your entry:
            </p>
          </div>
          <ReflectionResponse 
            journalEntry={entry}
            onReflectionComplete={(reflection) => {
              // Could integrate with Mama Mindfully if needed
              console.log('General reflection completed:', reflection);
            }}
          />
        </div>
      )}

      {/* Nurturing Actions */}
      {nurturingActions.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800">Self-Care Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {nurturingActions.map((action, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg border border-purple-200"
                >
                  <Flower className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-800 text-sm">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </KeyboardAvoidingWrapper>
  );
};

export default JournalPageMamaMindfully;