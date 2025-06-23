import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PenTool, Heart, Sparkles } from 'lucide-react';

export default function SimpleHome() {
  const { user } = useAuth();
  const [entry, setEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!entry.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: entry,
          wordCount: entry.trim().split(/\s+/).length
        })
      });

      if (response.ok) {
        setEntry('');
        alert('Journal entry saved successfully!');
      } else {
        alert('Failed to save entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to SoulScroll
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your sacred space for reflection and growth
          </p>
          {user && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
              Hello, {user.firstName || user.email}
            </p>
          )}
        </div>

        {/* Main Journal Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Today's Reflection
            </CardTitle>
            <CardDescription>
              Take a moment to explore your thoughts and feelings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="What's on your mind today? Share your thoughts, feelings, or experiences..."
              className="min-h-[200px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {entry.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </p>
              <Button 
                onClick={handleSubmit}
                disabled={!entry.trim() || isSubmitting}
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mindful Moments</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Every entry is a step toward self-discovery
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Emotional Wellness</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Track your emotional journey with compassion
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <PenTool className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Personal Growth</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Reflect on your experiences and insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}