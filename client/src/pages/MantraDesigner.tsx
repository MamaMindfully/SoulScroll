import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Lotus, Sun } from "lucide-react";

export default function MantraDesigner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lotus className="w-8 h-8 text-orange-400" />
              <Heart className="w-6 h-6 text-red-400" />
              <Sun className="w-6 h-6 text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Mantra Designer
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Create personalized mantras for your spiritual journey
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">
                Mantra designer feature coming soon...
              </p>
              <p className="text-gray-500 mt-2">
                Design custom mantras and affirmations powered by AI
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}