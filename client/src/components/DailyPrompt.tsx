import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";

interface DailyPrompt {
  id: number;
  text: string;
  category: string;
  createdAt: string;
}

export default function DailyPrompt() {
  const { data: prompt, isLoading } = useQuery<DailyPrompt>({
    queryKey: ["/api/prompts/daily"],
    staleTime: 1000 * 60 * 60, // 1 hour - prompts don't change frequently
  });

  if (isLoading) {
    return (
      <section className="p-6 bg-gradient-to-br from-gentle to-white">
        <Card className="animate-pulse">
          <CardContent className="p-5">
            <div className="h-4 bg-gentle rounded mb-3"></div>
            <div className="h-16 bg-gentle rounded mb-4"></div>
            <div className="h-3 bg-gentle rounded w-1/2"></div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const promptText = prompt?.text || "Where do you feel most like yourself — and when was the last time you were there?";
  const generatedTime = prompt?.createdAt ? format(new Date(prompt.createdAt), "h:mm a") : "7:00 AM";

  return (
    <section className="p-6 bg-gradient-to-br from-gentle to-white">
      <Card className="bg-white rounded-2xl shadow-lg animate-fade-in">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-wisdom">Today's Prompt</h2>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <blockquote className="text-wisdom/80 leading-relaxed mb-4 text-base italic">
            "{promptText}"
          </blockquote>
          <div className="flex items-center space-x-2 text-xs text-wisdom/60">
            <Clock className="w-3 h-3" />
            <span>Generated for you at {generatedTime}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
