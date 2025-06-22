interface OnboardingIntroProps {
  onContinue: () => void;
}

export default function OnboardingIntro({ onContinue }: OnboardingIntroProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-6">
      <div className="space-y-6 max-w-xl mx-auto text-white text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Welcome to SoulScroll
          </h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto"></div>
        </div>
        
        <div className="space-y-4 text-lg leading-relaxed">
          <p className="text-gray-200">
            This is not a to-do list. This is your mirror. A memory map. A scroll of your soul's seasons.
          </p>
          <p className="text-gray-300">
            Every word you write becomes part of a living archive — a reflection of your inner life. 
            Over time, you'll see patterns. Constellations. Insight.
          </p>
        </div>

        <div className="pt-6">
          <button 
            onClick={onContinue} 
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Begin Your Scroll
          </button>
        </div>

        <div className="pt-4 text-sm text-gray-400">
          Your journey of self-discovery starts here
        </div>
      </div>
    </div>
  )
}