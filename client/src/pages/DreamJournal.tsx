import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Stars, Sparkles } from "lucide-react";

export default function DreamJournal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Moon className="w-8 h-8 text-purple-400" />
              <Stars className="w-6 h-6 text-blue-400" />
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Dream Journal
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Explore the mysteries of your subconscious mind
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">
                Dream journaling feature coming soon...
              </p>
              <p className="text-gray-500 mt-2">
                Record and analyze your dreams with AI-powered insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}