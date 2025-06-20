import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PenTool, Mic, Save, Check, CheckCircle, LoaderCircle, Lightbulb, MessageCircle } from "lucide-react";
import { fetchSoulScrollReply } from '../utils/gptAPI';
import { getAIReflection } from '../utils/AIJournalEngine';
import { prompts } from '../utils/promptTemplates';
import { saveReflection, incrementReflectionCount } from '../utils/storage';
import { useUserProfile } from '../hooks/useUserProfile';

interface JournalEntryData {
  content: string;
  promptId?: number;
}

export default function JournalEditor() {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "pending">("saved");
  const [aiOutput, setAIOutput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [reflection, setReflection] = useState<any>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const { profile } = useUserProfile();

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
      const response = await apiRequest("POST", "/api/journal/entries", entryData);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      setAutoSaveStatus("saved");
      
      if (!data.isAutoSave) {
        toast({
          title: "Entry saved",
          description: "Your thoughts have been captured with care.",
        });
      }
    },
    onError: (error) => {
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

  const handleSave = async (isAutoSave = false) => {
    if (!content.trim()) return;
    
    setAutoSaveStatus("saving");
    
    try {
      // Save the journal entry
      await apiRequest("POST", "/api/journal/entries", { content: content.trim() });
      
      if (!isAutoSave) {
        setHasSubmitted(true);
        
        toast({
          title: "Entry saved!",
          description: "Your journal entry has been saved successfully.",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
        
        // Generate AI reflection for entries longer than 20 characters
        if (content.trim().length > 20) {
          setLoadingReflection(true);
          try {
            const response = await fetch('/api/reflect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entry: content.trim() })
            });
            
            if (response.ok) {
              const reflectionData = await response.json();
              setReflection(reflectionData);
            } else {
              console.error('Failed to get reflection:', response.statusText);
              // Set a simple fallback reflection
              setReflection({
                insight: "Thank you for sharing your thoughts. Taking time to reflect is a valuable practice for personal growth.",
                followUpPrompt: "What feeling or thought from your entry would you like to explore further?",
                source: 'fallback'
              });
            }
          } catch (error) {
            console.error('Error getting reflection:', error);
            // Set a simple fallback reflection
            setReflection({
              insight: "Your willingness to journal shows wisdom and self-awareness. Each entry is a step toward greater understanding.",
              followUpPrompt: "What insights are emerging for you as you reflect on your experience?",
              source: 'fallback'
            });
          } finally {
            setLoadingReflection(false);
          }
        }
        
        // Clear the form after some time
        setTimeout(() => {
          setContent('');
          setHasSubmitted(false);
          setReflection(null);
        }, 10000);
      }
      
      setAutoSaveStatus("saved");
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
      setAutoSaveStatus("pending");
    }
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
            {/* Voice Recording Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceRecording}
              className="w-8 h-8 p-0 rounded-full bg-accent/10 hover:bg-accent/20"
            >
              <Mic className="w-4 h-4 text-accent" />
            </Button>
            {/* Word Count */}
            <span className="text-xs text-wisdom/60">{wordCount} words</span>
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
              variant="ghost"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={!content.trim() || createEntryMutation.isPending}
              className="flex items-center space-x-2"
            >
              {createEntryMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm">Save</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {getSaveIndicator()}
          </div>
        </div>
      </Card>

      {/* AI Reflection Section */}
      {aiOutput && (
        <Card className="mt-6">
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
      )}
    </section>
  );
}
