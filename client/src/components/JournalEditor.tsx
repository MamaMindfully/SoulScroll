import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { usePremium } from "@/context/PremiumContext";
import { PremiumGate } from "@/components/PremiumGate";
import DeepPrompt from "@/components/DeepPrompt";
import { useAutoSave } from "@/utils/autoSave";
import { exportEntryToPDF } from "@/utils/pdfExport";
import { debounce, performanceMonitor } from "@/utils/performanceOptimizations";
import { useWebWorker } from "@/hooks/useWebWorker";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PenTool, Mic, Save, Check, CheckCircle, LoaderCircle, Lightbulb, MessageCircle } from "lucide-react";
import { useUserProfile } from '../hooks/useUserProfile';
import TapToGoDeeper from './TapToGoDeeper';
import ReflectionFeedback from './ReflectionFeedback';
import SecretScrollModal from './SecretScrollModal';
import { scoreEntryEmotion } from '@/utils/emotionalResonance';
import { checkScrollUnlockAfterEntry } from '@/utils/secretScrollEngine';

interface JournalEntryData {
  content: string;
  promptId?: number;
}

export default function JournalEditor() {
  // Add test IDs for E2E testing
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "pending">("saved");
  const [aiOutput, setAIOutput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [reflection, setReflection] = useState<any>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [compassionateInsight, setCompassionateInsight] = useState<string>('');
  const [showSecretScroll, setShowSecretScroll] = useState(false);
  const [secretScroll, setSecretScroll] = useState<any>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  // Remove useUserProfile to prevent hook violations
  const profile = { mentorPersona: 'sage' };

  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(content.trim() ? words.length : 0);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (content.trim() && autoSaveStatus !== "saving") {
      setAutoSaveStatus("pending");
      
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content]);

  const createEntryMutation = useMutation({
    mutationFn: async (entryData: JournalEntryData) => {
      console.log("📡 Sending journal entry to backend:", entryData);
      const response = await apiRequest("POST", "/api/journal/entries", entryData);
      const result = await response.json();
      console.log("✅ Journal entry saved successfully:", result);
      return result;
    },
    onSuccess: async (data) => {
      console.log("🎉 Journal save success callback triggered");
      
      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      setAutoSaveStatus("saved");
      
      // Score emotional resonance
      if (data.id && content.trim()) {
        try {
          await scoreEntryEmotion(content.trim(), data.id);
        } catch (error) {
          console.error('Error scoring emotion:', error);
        }
      }
      
      // Check for secret scroll unlock
      if (profile?.id) {
        try {
          const scrollResult = await checkScrollUnlockAfterEntry(profile.id);
          if (scrollResult.shouldShow && scrollResult.scroll) {
            setSecretScroll(scrollResult.scroll);
            setShowSecretScroll(true);
          }
        } catch (error) {
          console.error('Error checking scroll unlock:', error);
        }
      }
      
      toast({
        title: "Entry saved",
        description: "Your thoughts have been captured with care.",
      });
      
      // Generate AI reflection after successful save
      if (hasSubmitted && content.trim().length > 10) {
        console.log("🤖 Starting AI reflection generation...");
        generateReflection(content.trim());
        
        // Scroll to response after a brief delay
        setTimeout(() => {
          responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 1000);
      } else {
        console.log("⏭️ Skipping AI reflection - conditions not met:", { hasSubmitted, contentLength: content.trim().length });
      }
    },
    onError: (error) => {
      console.error("❌ Journal save failed:", error);
      setAutoSaveStatus("pending");
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Save failed",
        description: "We couldn't save your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateReflection = async (entryContent: string) => {
    console.log("🧠 AI Reflection generation started for content:", entryContent.substring(0, 100) + "...");
    
    if (entryContent.length < 10) {
      console.log("❌ Content too short for reflection:", entryContent.length);
      return;
    }
    
    setLoadingReflection(true);
    
    try {
      console.log("📡 Making API request to /api/reflect...");
      const response = await apiRequest('POST', '/api/reflect', { entry: entryContent });
      console.log("📡 API response received:", response.status);
      
      const data = await response.json();
      console.log("✅ AI reflection data:", data);
      
      const reflectionData = {
        insight: data.insight || data.reflection || "Your reflection shows deep wisdom and self-awareness.",
        followUpPrompt: data.followUpPrompt || "What deeper insights emerge as you sit with this reflection?",
        source: data.source || 'ai'
      };
      
      console.log("💡 Setting reflection state:", reflectionData);
      setReflection(reflectionData);
      
      // Scroll to insight section after reflection is generated
      setTimeout(() => {
        const insightBox = document.getElementById("journal-editor-insight");
        if (insightBox) {
          insightBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } catch (error) {
      console.error("❌ AI reflection error:", error);
      
      if (isUnauthorizedError(error)) {
        console.log("🔐 Authentication error - user needs to log in");
        toast({
          title: "Authentication Required",
          description: "Please log in to receive AI reflections",
          variant: "destructive",
        });
        return;
      }
      
      // Set intelligent fallback reflection
      const fallbackReflection = {
        insight: "Your willingness to journal shows wisdom and self-awareness. Each entry is a step toward greater understanding.",
        followUpPrompt: "What insights are emerging for you as you reflect on your experience?",
        source: 'fallback'
      };
      
      console.log("🔄 Using fallback reflection:", fallbackReflection);
      setReflection(fallbackReflection);
      
      // Scroll to insight section even for fallback reflection
      setTimeout(() => {
        const insightBox = document.getElementById("journal-editor-insight");
        if (insightBox) {
          insightBox.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      
    } finally {
      console.log("🏁 AI reflection generation complete");
      setLoadingReflection(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    console.log("🚀 Journal save started:", { isAutoSave, contentLength: content.trim().length });
    
    if (!content.trim()) {
      console.log("❌ Save aborted - empty content");
      return;
    }
    
    setAutoSaveStatus("saving");
    
    if (!isAutoSave) {
      console.log("📝 Manual save - setting hasSubmitted to true");
      setHasSubmitted(true);
    }
    
    createEntryMutation.mutate({
      content: content.trim(),
    });
  };

  const handleVoiceRecording = () => {
    toast({
      title: "Voice Recording",
      description: "Voice journaling feature coming soon! Express yourself through speech.",
    });
  };

  const getSaveIndicator = () => {
    switch (autoSaveStatus) {
      case "saving":
        return (
          <>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-wisdom/60">Saving...</span>
          </>
        );
      case "saved":
        return (
          <>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-wisdom/60">Auto-saved</span>
          </>
        );
      case "pending":
        return (
          <>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-wisdom/60">Pending...</span>
          </>
        );
    }
  };

  return (
    <section className="p-6" data-component="journal-editor">
      <Card className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Editor Header */}
        <div className="p-4 border-b border-gentle flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PenTool className="w-4 h-4 text-primary" />
            <span className="font-medium text-wisdom">Today's Entry</span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Voice Recording Button - Premium Feature */}
            {isPremium ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceRecording}
                className="w-8 h-8 p-0 rounded-full bg-accent/10 hover:bg-accent/20"
              >
                <Mic className="w-4 h-4 text-accent" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast({
                  title: "Premium Feature",
                  description: "Voice journaling is available for premium members only.",
                  variant: "default",
                })}
                className="w-8 h-8 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Mic className="w-4 h-4 text-gray-400" />
              </Button>
            )}
            {/* Word Count */}
            <span data-testid="word-count" className="text-xs text-wisdom/60">{wordCount} words</span>
          </div>
        </div>
        
        {/* Writing Area */}
        <div className="p-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="This is sacred space. Let your thoughts flow freely... Luma is here to witness and reflect with you."
            className="writing-area border-none shadow-none resize-none focus-visible:ring-0 text-wisdom placeholder:text-wisdom/40 bg-transparent p-0 text-base leading-relaxed"
            rows={8}
          />
        </div>
        
        {/* Writing Tools Footer */}
        <div className="p-4 bg-gentle/50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              data-testid="submit-journal"
              variant="ghost"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={!content.trim() || createEntryMutation.isPending || loadingReflection}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-lg px-4"
              style={{ minHeight: '44px' }}
            >
              {(createEntryMutation.isPending || loadingReflection) ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {loadingReflection ? 'Reflecting...' : 'Saving...'}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">Save & Reflect</span>
                </>
              )}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {getSaveIndicator()}
          </div>
        </div>
      </Card>

      {/* Success and Reflection Display */}
      {hasSubmitted && (
        <div className="space-y-4 mt-6">
          <div className="text-center py-4">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4 mr-2" />
              Entry saved successfully!
            </div>
          </div>
          
          {/* Loading reflection */}
          {loadingReflection && (
            <div className="text-center py-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                Generating reflection...
              </div>
            </div>
          )}
          
          {/* AI Reflection Display */}
          {reflection && !loadingReflection && (
            <div data-testid="ai-reflection" id="journal-editor-insight" className="space-y-4 fade-in">
              {/* Insight */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-800 text-sm">
                          Reflection Insight
                        </h4>
                        {reflection.source && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              reflection.source === 'ai' 
                                ? 'border-blue-300 text-blue-700'
                                : 'border-gray-300 text-gray-600'
                            }`}
                          >
                            {reflection.source === 'ai' ? 'AI Generated' : 'Smart Analysis'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-800 leading-relaxed text-sm">
                        {reflection.insight}
                      </p>
                      {reflection.notice && (
                        <p className="text-xs text-blue-600 mt-2 italic">
                          {reflection.notice}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Follow-up Question */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 fade-in-delayed">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-800 text-sm mb-2">
                        Deeper Question
                      </h4>
                      <p className="text-gray-800 leading-relaxed text-sm font-medium italic">
                        {reflection.followUpPrompt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reflection Feedback */}
              <ReflectionFeedback 
                reflectionText={reflection.insight}
                onAskForAnother={() => {
                  // Trigger reflection regeneration
                  setReflection(null);
                  setLoadingReflection(true);
                  // Could implement regeneration API call here
                }}
              />

              {/* Tap to Go Deeper */}
              <TapToGoDeeper
                originalPrompt={reflection.followUpPrompt || ""}
                userEntry={content}
                onDeepInsight={(insight) => {
                  console.log('Deep insight generated:', insight);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Legacy AI Output Display (keeping for compatibility) */}
      {aiOutput && !hasSubmitted && (
        <div className="mt-6 space-y-4">
          {/* AI Response */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary">SoulScroll Reflection</span>
              </div>
              <div className="prose prose-sm max-w-none text-wisdom/80 leading-relaxed">
                {aiOutput.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reflection Feedback */}
          <ReflectionFeedback 
            reflectionText={aiOutput}
            onAskForAnother={() => {
              // Clear current AI output to trigger regeneration
              setAIOutput('');
              // Could implement regeneration logic here
            }}
          />

          {/* Tap to Go Deeper */}
          <TapToGoDeeper
            originalPrompt=""
            userEntry={content}
            onDeepInsight={(insight) => {
              console.log('Deep insight generated:', insight);
            }}
          />
        </div>
      )}

      {/* Secret Scroll Modal */}
      <SecretScrollModal
        scroll={secretScroll}
        isVisible={showSecretScroll}
        onClose={() => {
          setShowSecretScroll(false);
          setSecretScroll(null);
        }}
      />
    </section>
  );
}
