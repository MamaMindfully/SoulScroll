import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Heart, Lightbulb, Compass } from "lucide-react";

interface DailyPrompt {
  id: string;
  prompt: string;
  category: 'heart' | 'growth' | 'reflection' | 'exploration';
  tone: 'gentle' | 'deep' | 'practical' | 'poetic';
}

const soulfulPrompts: DailyPrompt[] = [
  {
    id: '1',
    prompt: "What's been weighing on your heart lately?",
    category: 'heart',
    tone: 'gentle'
  },
  {
    id: '2', 
    prompt: "If your younger self could see you now, what would surprise them most?",
    category: 'reflection',
    tone: 'deep'
  },
  {
    id: '3',
    prompt: "What small moment today made you pause and notice?",
    category: 'exploration',
    tone: 'poetic'
  },
  {
    id: '4',
    prompt: "What are you learning to let go of?",
    category: 'growth',
    tone: 'gentle'
  },
  {
    id: '5',
    prompt: "How has your relationship with yourself changed this year?",
    category: 'reflection',
    tone: 'deep'
  },
  {
    id: '6',
    prompt: "What does your soul need more of right now?",
    category: 'heart',
    tone: 'poetic'
  },
  {
    id: '7',
    prompt: "Describe a moment when you felt most like yourself.",
    category: 'exploration',
    tone: 'gentle'
  },
  {
    id: '8',
    prompt: "What fear are you ready to befriend instead of fight?",
    category: 'growth',
    tone: 'deep'
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'heart': return <Heart className="w-4 h-4" />;
    case 'growth': return <Lightbulb className="w-4 h-4" />;
    case 'exploration': return <Compass className="w-4 h-4" />;
    default: return <RefreshCw className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'heart': return 'text-red-400';
    case 'growth': return 'text-yellow-400';
    case 'exploration': return 'text-blue-400';
    default: return 'text-primary';
  }
};

export default function EnhancedPrompts({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) {
  const [currentPrompt, setCurrentPrompt] = useState<DailyPrompt>(soulfulPrompts[0]);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Set a different prompt based on the day
    const today = new Date();
    const dayIndex = today.getDate() % soulfulPrompts.length;
    setCurrentPrompt(soulfulPrompts[dayIndex]);
  });

  const changePrompt = () => {
    setIsChanging(true);
    setTimeout(() => {
      const currentIndex = soulfulPrompts.findIndex(p => p.id === currentPrompt.id);
      const nextIndex = (currentIndex + 1) % soulfulPrompts.length;
      setCurrentPrompt(soulfulPrompts[nextIndex]);
      setIsChanging(false);
    }, 300);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-gentle/30 border-gentle/40">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-wisdom/60">
          <div className={getCategoryColor(currentPrompt.category)}>
            {getCategoryIcon(currentPrompt.category)}
          </div>
          <span className="text-xs uppercase tracking-wide font-medium">
            Today's Reflection
          </span>
        </div>
        
        <div 
          className={`transition-all duration-300 ${
            isChanging ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}
        >
          <p className="text-lg font-light text-wisdom leading-relaxed mb-4">
            "{currentPrompt.prompt}"
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={changePrompt}
            className="text-xs text-wisdom/60 hover:text-wisdom"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Different prompt
          </Button>
          
          <Button
            onClick={() => onPromptSelect(currentPrompt.prompt)}
            className="bg-primary/10 hover:bg-primary/20 text-primary border-none"
          >
            Begin writing
          </Button>
        </div>

        <div className="text-xs text-wisdom/50 mt-3">
          You showed up today. That matters.
        </div>
      </div>
    </Card>
  );
}