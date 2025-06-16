import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, MessageCircle } from "lucide-react";

interface JournalEntry {
  id: number;
  content: string;
  aiResponse?: string;
  emotionalTone?: {
    rating: number;
    keywords: string[];
  };
  createdAt: string;
}

export default function AIReflection() {
  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal/entries"],
    select: (data) => data?.slice(0, 1), // Get most recent entry
  });

  const latestEntry = entries?.[0];

  if (isLoading) {
    return (
      <section className="p-6">
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gentle"></div>
            <div className="flex-1">
              <div className="h-4 bg-gentle rounded mb-2"></div>
              <div className="h-16 bg-gentle rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gentle rounded w-24"></div>
                <div className="h-8 bg-gentle rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!latestEntry || !latestEntry.aiResponse) {
    return (
      <section className="p-6">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full emotion-gradient flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-medium text-wisdom mb-2">Waiting for your thoughts</h3>
            <p className="text-sm text-wisdom/70 leading-relaxed">
              Write in your journal to receive compassionate reflections from Luma
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const handleContinueExploring = () => {
    // In a real app, this would navigate to a deeper reflection or prompt follow-up questions
    console.log("Continue exploring clicked");
  };

  const handleSaveInsight = () => {
    // In a real app, this would save the insight to favorites or bookmarks
    console.log("Save insight clicked");
  };

  return (
    <section className="p-6">
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 animate-fade-in">
        <CardContent className="p-5">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full emotion-gradient flex items-center justify-center flex-shrink-0 animate-pulse-gentle">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-wisdom">Luma's Reflection</h3>
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              
              <p className="text-wisdom/80 text-sm leading-relaxed mb-4">
                {latestEntry.aiResponse}
              </p>
              
              {/* Emotional Keywords */}
              {latestEntry.emotionalTone?.keywords && latestEntry.emotionalTone.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {latestEntry.emotionalTone.keywords.slice(0, 3).map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Button 
                  size="sm"
                  onClick={handleContinueExploring}
                  className="bg-primary/10 text-primary hover:bg-primary/20 border-0"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Continue exploring
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSaveInsight}
                  className="text-wisdom/70 border-gentle hover:bg-gentle"
                >
                  Save insight
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
