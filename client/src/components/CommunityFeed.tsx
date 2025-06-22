import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Share2, MessageCircle } from "lucide-react";

interface SharedReflection {
  id: string;
  content: string;
  timestamp: Date;
  hearts: number;
}

const CommunityFeed = () => {
  const [shared, setShared] = useState<SharedReflection[]>([
    {
      id: '1',
      content: "🌿 'I learned that stillness can be powerful.'",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      hearts: 12
    },
    {
      id: '2', 
      content: "🌞 'My intention today: approach the world with softness.'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      hearts: 8
    },
    {
      id: '3',
      content: "💫 'I cried today, and it helped me heal a little.'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      hearts: 15
    }
  ]);
  const [userNote, setUserNote] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      // Load existing community posts from localStorage
      const savedPosts = localStorage.getItem('soulscroll-community-posts');
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        setShared(Array.isArray(parsed) ? parsed : []);
      }
      
      // Load liked posts
      const savedLikes = localStorage.getItem('soulscroll-community-likes');
      if (savedLikes) {
        const parsed = JSON.parse(savedLikes);
        setLikedPosts(new Set(Array.isArray(parsed) ? parsed : []));
      }
    } catch (error) {
      console.error('Error loading community data:', error);
      setShared([]);
      setLikedPosts(new Set());
    }
  }, []);

  const handlePost = () => {
    if (userNote.trim()) {
      const newPost: SharedReflection = {
        id: Date.now().toString(),
        content: userNote,
        timestamp: new Date(),
        hearts: 0
      };
      
      const updatedShared = [newPost, ...shared.slice(0, 19)]; // Keep last 20 posts
      setShared(updatedShared);
      setUserNote('');
      
      // Save to localStorage
      localStorage.setItem('soulscroll-community-posts', JSON.stringify(updatedShared));
    }
  };

  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    const isLiked = likedPosts.has(postId);
    
    if (isLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    
    setLikedPosts(newLikedPosts);
    
    // Update hearts count
    setShared(prev => prev.map(post => ({
      ...post,
      hearts: post.id === postId 
        ? (isLiked ? post.hearts - 1 : post.hearts + 1)
        : post.hearts
    })));
    
    // Save likes to localStorage
    localStorage.setItem('soulscroll-community-likes', JSON.stringify(Array.from(newLikedPosts)));
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center justify-center space-x-2">
            <Users className="w-8 h-8" />
            <span>Community Reflections</span>
          </h1>
          <p className="text-wisdom/60">Share your insights anonymously with fellow souls</p>
        </div>

        {/* Post Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>Share a Reflection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Share a kind thought, insight, or moment of wisdom anonymously..."
              className="min-h-[100px] resize-none"
              maxLength={280}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-wisdom/50">
                {userNote.length}/280 characters
              </span>
              <Button 
                onClick={handlePost}
                disabled={!userNote.trim()}
                className="px-6 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                Share Anonymously
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{shared.length}</div>
                <div className="text-xs text-wisdom/60">Reflections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {shared.reduce((sum, post) => sum + post.hearts, 0)}
                </div>
                <div className="text-xs text-wisdom/60">Hearts Given</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{likedPosts.size}</div>
                <div className="text-xs text-wisdom/60">Your Hearts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed */}
        <div className="space-y-4">
          {shared.map((reflection) => (
            <Card key={reflection.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-wisdom/90 mb-3 leading-relaxed">
                      {reflection.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-wisdom/50">
                        {formatTimeAgo(reflection.timestamp)}
                      </span>
                      <button
                        onClick={() => handleLike(reflection.id)}
                        className={`flex items-center space-x-1 text-xs transition-colors cursor-pointer ${
                          likedPosts.has(reflection.id)
                            ? 'text-red-500'
                            : 'text-wisdom/50 hover:text-red-400'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Heart 
                          className={`w-4 h-4 ${
                            likedPosts.has(reflection.id) ? 'fill-current' : ''
                          }`} 
                        />
                        <span>{reflection.hearts}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {shared.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-wisdom/30" />
              <p className="text-wisdom/50">
                Be the first to share a reflection with the community
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CommunityFeed;