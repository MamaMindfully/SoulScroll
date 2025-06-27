import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, PenTool, Sparkles, ArrowRight } from 'lucide-react';

export default function SimpleLanding() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">SoulScroll</h1>
          </div>
          <Button onClick={handleLogin} className="flex items-center gap-2">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Your Sacred Space for
            <span className="text-purple-600 dark:text-purple-400"> Self-Discovery</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Transform your thoughts into wisdom with AI-powered journaling that understands your emotional journey
          </p>
          <Button size="lg" onClick={handleLogin} className="text-lg px-8 py-6">
            Begin Your Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <PenTool className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Mindful Journaling</CardTitle>
              <CardDescription>
                Express your thoughts in a safe, private space designed for reflection and growth
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Receive compassionate, personalized insights that help you understand your emotional patterns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Heart className="w-12 h-12 text-rose-600 mx-auto mb-4" />
              <CardTitle>Emotional Wellness</CardTitle>
              <CardDescription>
                Track your emotional journey and discover patterns that lead to personal growth
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ready to Begin?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join thousands of users who have discovered the power of mindful journaling with SoulScroll
              </p>
              <Button size="lg" onClick={handleLogin} className="w-full sm:w-auto">
                Start Journaling Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            © 2025 SoulScroll. Your journey to self-discovery starts here.
          </p>
        </div>
      </footer>
    </div>
  );
}