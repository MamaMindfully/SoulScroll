import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from '@/store/appStore';
import { Sparkles, Brain, Heart, Lightbulb } from "lucide-react";

interface ArcProfile {
  arc_tone: string;
  arc_prompt_style: string;
  arc_depth: string;
}

const ArcPersonaSettings: React.FC = () => {
  const [profile, setProfile] = useState<ArcProfile>({
    arc_tone: 'poetic',
    arc_prompt_style: 'reflection',
    arc_depth: 'introspective'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { userId, isLoggedIn } = useAppStore();
  const { toast } = useToast();

  const toneOptions = [
    { value: 'poetic', label: 'Poetic', icon: '🎭', description: 'Metaphorically rich and artistic' },
    { value: 'grounded', label: 'Grounded', icon: '🌱', description: 'Practical and down-to-earth' },
    { value: 'scientific', label: 'Scientific', icon: '🔬', description: 'Analytical and evidence-based' },
    { value: 'mystical', label: 'Mystical', icon: '✨', description: 'Spiritually attuned and transcendent' }
  ];

  const styleOptions = [
    { value: 'affirmation', label: 'Affirmation', icon: <Heart className="w-4 h-4" />, description: 'Encouraging and supportive statements' },
    { value: 'reflection', label: 'Reflection Question', icon: <Brain className="w-4 h-4" />, description: 'Deep questions for contemplation' }
  ];

  const depthOptions = [
    { value: 'light', label: 'Light', icon: '🌸', description: 'Gentle and encouraging' },
    { value: 'introspective', label: 'Introspective', icon: '🔍', description: 'Thoughtfully deep' },
    { value: 'transformative', label: 'Transformative', icon: '🦋', description: 'Soul-stirring and profound' }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
        const response = await fetch(`/api/arc-profile?userId=${userIdToUse}`);
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch Arc profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isLoggedIn]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userIdToUse = userId || localStorage.getItem('userId') || 'demo-user';
      const response = await fetch('/api/arc-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdToUse, ...profile })
      });

      if (response.ok) {
        toast({
          title: "Arc profile updated",
          description: "Your personalized Arc companion has been configured.",
        });
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Arc profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPersonalityDescription = () => {
    const combinations = {
      'poetic-light': 'A gentle poet who finds beauty in simple moments',
      'poetic-introspective': 'A contemplative artist who weaves insights through metaphor',
      'poetic-transformative': 'A visionary who speaks in soul-stirring verse',
      'grounded-light': 'A practical friend who offers steady, encouraging wisdom',
      'grounded-introspective': 'A thoughtful mentor grounded in lived experience',
      'grounded-transformative': 'A wise teacher who catalyzes growth through truth',
      'scientific-light': 'A curious researcher who finds wonder in patterns',
      'scientific-introspective': 'An analytical guide who explores the mind with precision',
      'scientific-transformative': 'A breakthrough thinker who rewrites understanding',
      'mystical-light': 'A gentle spirit guide who whispers ancient knowing',
      'mystical-introspective': 'A mystical sage who reads the deeper currents',
      'mystical-transformative': 'A transcendent oracle who channels universal wisdom'
    };

    const key = `${profile.arc_tone}-${profile.arc_depth}`;
    return combinations[key] || 'A wise companion on your journey of self-discovery';
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Customize Arc</h1>
        </div>
        <p className="text-gray-600 max-w-xl mx-auto">
          Personalize your AI companion's personality, communication style, and depth 
          to create the perfect journaling partner for your unique journey.
        </p>
      </div>

      {/* Current Personality Preview */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Your Arc Personality</h3>
          </div>
          <p className="text-purple-700 italic">
            "{getPersonalityDescription()}"
          </p>
          <Badge variant="outline" className="mt-3 bg-purple-100 text-purple-700 border-purple-300">
            {profile.arc_prompt_style === 'affirmation' ? 'Affirming' : 'Questioning'} • {profile.arc_tone} • {profile.arc_depth}
          </Badge>
        </CardContent>
      </Card>

      {/* Tone Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎭</span>
            <span>Communication Tone</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={profile.arc_tone} onValueChange={(value) => setProfile({ ...profile, arc_tone: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <span>{option.icon}</span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Prompt Style Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Response Style</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={profile.arc_prompt_style} onValueChange={(value) => setProfile({ ...profile, arc_prompt_style: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {styleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    {option.icon}
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Depth Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Spiritual Depth</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={profile.arc_depth} onValueChange={(value) => setProfile({ ...profile, arc_depth: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {depthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <span>{option.icon}</span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isSaving ? 'Saving...' : 'Save Arc Settings'}
      </Button>
    </div>
  );
};

export default ArcPersonaSettings;