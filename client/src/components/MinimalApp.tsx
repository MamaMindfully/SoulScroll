import React from 'react';

export default function MinimalApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">🌙 SoulScroll AI</h1>
          <p className="text-xl text-purple-200 mb-6">Your emotional journaling companion</p>
          <p className="text-lg text-gray-300 mb-8">
            A mindful journaling app for reflection and growth. AI-powered insights help you discover patterns and deepen self-awareness.
          </p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Start Journaling
          </button>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">✨ AI Insights</h3>
              <p className="text-sm text-gray-300">Get personalized reflections on your emotional journey</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">📊 Emotional Tracking</h3>
              <p className="text-sm text-gray-300">Visualize your mood patterns over time</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">🔒 Private & Secure</h3>
              <p className="text-sm text-gray-300">Your thoughts stay protected with encryption</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎯 Growth Focused</h3>
              <p className="text-sm text-gray-300">Daily prompts and streak tracking</p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-purple-700/50">
            <p className="text-sm text-gray-400">
              Status: <span className="text-green-400">Application Running</span> | 
              <a href="/api/health" className="text-purple-300 hover:text-purple-200 ml-2">Health Check</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}