import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  Users, 
  Globe, 
  MessageCircle, 
  Shield,
  Sparkles,
  MapPin,
  Send,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CommunityMood {
  id: number;
  anonymousId: string;
  moodRating: number;
  keywords: string[];
  location?: string;
  createdAt: string;
}

interface CommunitySupport {
  id: number;
  supportType: string;
  message: string;
  isAnonymous: boolean;
  createdAt: string;
}

export default function CommunityFeaturesComponent() {
  const [isPublicSharingEnabled, setIsPublicSharingEnabled] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedMoodToSupport, setSelectedMoodToSupport] = useState<number | null>(null);
  const [showPersonalLocation, setShowPersonalLocation] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communityMoods, isLoading: moodsLoading } = useQuery<CommunityMood[]>({
    queryKey: ["/api/community/moods"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: supportMessages } = useQuery<CommunitySupport[]>({
    queryKey: ["/api/community/support"],
  });

  const shareMoodMutation = useMutation({
    mutationFn: async (moodData: {
      moodRating: number;
      keywords: string[];
      location?: string;
      isPublic: boolean;
    }) => {
      return await apiRequest("POST", "/api/community/moods", moodData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/moods"] });
      toast({
        title: "Mood shared",
        description: "Your anonymous mood has been shared with the community.",
      });
    },
    onError: () => {
      toast({
        title: "Sharing failed",
        description: "Unable to share mood with community.",
        variant: "destructive",
      });
    },
  });

  const sendSupportMutation = useMutation({
    mutationFn: async (supportData: {
      supportType: string;
      message: string;
      toUserId?: string;
      isAnonymous: boolean;
    }) => {
      return await apiRequest("POST", "/api/community/support", supportData);
    },
    onSuccess: () => {
      setSupportMessage("");
      setSelectedMoodToSupport(null);
      queryClient.invalidateQueries({ queryKey: ["/api/community/support"] });
      toast({
        title: "Support sent",
        description: "Your message of support has been shared anonymously.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send support",
        description: "Unable to send support message.",
        variant: "destructive",
      });
    },
  });

  const getMoodEmoji = (rating: number) => {
    if (rating >= 4.5) return "😊";
    if (rating >= 3.5) return "🙂";
    if (rating >= 2.5) return "😐";
    if (rating >= 1.5) return "😔";
    return "😢";
  };

  const getMoodColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    if (rating >= 2) return "text-orange-600";
    return "text-red-600";
  };

  const handleSendSupport = () => {
    if (!supportMessage.trim()) return;
    
    sendSupportMutation.mutate({
      supportType: "encouragement",
      message: supportMessage,
      isAnonymous: true,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const minutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-serenity bg-gradient-to-br from-serenity/20 to-warmth/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-serenity" />
              <CardTitle className="text-wisdom">Community Wellness</CardTitle>
              <Badge variant="secondary" className="bg-serenity/20 text-serenity">
                Anonymous
              </Badge>
            </div>
            <Shield className="w-5 h-5 text-serenity" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white/70 rounded-lg border-l-4 border-serenity">
            <p className="text-sm text-wisdom/90 leading-relaxed">
              Share your emotional state anonymously with the community. Your privacy is protected - 
              only general mood and location (if shared) are visible to others.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-wisdom" />
                <span className="text-sm font-medium text-wisdom">Public Mood Sharing</span>
              </div>
              <p className="text-xs text-wisdom/70">Allow others to see your anonymous mood</p>
            </div>
            <Switch 
              checked={isPublicSharingEnabled}
              onCheckedChange={setIsPublicSharingEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-wisdom" />
                <span className="text-sm font-medium text-wisdom">Share Location</span>
              </div>
              <p className="text-xs text-wisdom/70">Show your city for local community connection</p>
            </div>
            <Switch 
              checked={showPersonalLocation}
              onCheckedChange={setShowPersonalLocation}
            />
          </div>
        </CardContent>
      </Card>

      {/* Community Mood Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-warmth" />
            <span>Community Mood Stream</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moodsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : communityMoods && communityMoods.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {communityMoods.map((mood) => (
                <div 
                  key={mood.id}
                  className="p-4 bg-gradient-to-r from-serenity/10 to-warmth/10 rounded-lg border border-serenity/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getMoodEmoji(mood.moodRating)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getMoodColor(mood.moodRating)}`}>
                            Feeling {mood.moodRating}/5
                          </span>
                          {mood.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {mood.location}
                            </Badge>
                          )}
                        </div>
                        {mood.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {mood.keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-wisdom/60">{formatTimeAgo(mood.createdAt)}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-warmth text-warmth hover:bg-warmth hover:text-white"
                        onClick={() => setSelectedMoodToSupport(mood.id)}
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Support
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-wisdom/40 mx-auto mb-3" />
              <p className="text-wisdom/70">No community moods shared yet</p>
              <p className="text-sm text-wisdom/50">Be the first to share anonymously</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Support Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-serenity" />
            <span>Send Anonymous Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Share words of encouragement, a helpful tip, or just let someone know they're not alone..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              className="min-h-20 border-serenity/30 focus:border-serenity"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-wisdom/60">
                <EyeOff className="w-3 h-3" />
                <span>Your message will be sent anonymously</span>
              </div>
              <div className="text-xs text-wisdom/60">
                {supportMessage.length}/500
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSendSupport}
            disabled={!supportMessage.trim() || sendSupportMutation.isPending}
            className="w-full bg-serenity hover:bg-serenity/90 text-white"
          >
            {sendSupportMutation.isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Support Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Support Messages */}
      {supportMessages && supportMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-warmth" />
              <span>Community Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {supportMessages.slice(0, 5).map((support) => (
                <div 
                  key={support.id}
                  className="p-3 bg-warmth/10 rounded-lg border border-warmth/20"
                >
                  <p className="text-sm text-wisdom leading-relaxed mb-2">
                    "{support.message}"
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {support.supportType}
                    </Badge>
                    <span className="text-xs text-wisdom/60">
                      {formatTimeAgo(support.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}