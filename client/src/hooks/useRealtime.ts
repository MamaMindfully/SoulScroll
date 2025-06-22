import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { addBreadcrumb } from '@/utils/sentry';

interface CommunityPost {
  id: string;
  content: string;
  timestamp: Date;
  hearts: number;
  userId?: string;
}

interface RealtimeState {
  isConnected: boolean;
  userCount: number;
  recentPosts: CommunityPost[];
  typingUsers: string[];
}

export const useRealtime = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    userCount: 0,
    recentPosts: [],
    typingUsers: []
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io({
      path: '/socket.io',
      autoConnect: true
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to realtime server');
      addBreadcrumb('Connected to realtime server', 'socket');
      
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Authenticate if user is logged in
      if (user?.id) {
        newSocket.emit('authenticate', user.id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from realtime server');
      addBreadcrumb('Disconnected from realtime server', 'socket');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    // Community event handlers
    newSocket.on('recent_posts', (posts: CommunityPost[]) => {
      setState(prev => ({ ...prev, recentPosts: posts }));
    });

    newSocket.on('post_created', (post: CommunityPost) => {
      setState(prev => ({
        ...prev,
        recentPosts: [...prev.recentPosts, post].slice(-50)
      }));
    });

    newSocket.on('post_updated', (updatedPost: CommunityPost) => {
      setState(prev => ({
        ...prev,
        recentPosts: prev.recentPosts.map(post =>
          post.id === updatedPost.id ? updatedPost : post
        )
      }));
    });

    newSocket.on('user_count', (count: number) => {
      setState(prev => ({ ...prev, userCount: count }));
    });

    // Typing indicators
    newSocket.on('user_typing', (socketId: string) => {
      setState(prev => ({
        ...prev,
        typingUsers: [...prev.typingUsers.filter(id => id !== socketId), socketId]
      }));
    });

    newSocket.on('user_stopped_typing', (socketId: string) => {
      setState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.filter(id => id !== socketId)
      }));
    });

    // Announcements
    newSocket.on('announcement', (data: { message: string; timestamp: Date }) => {
      console.log('Announcement:', data.message);
      addBreadcrumb(`Announcement: ${data.message}`, 'announcement');
    });

    return () => {
      newSocket.close();
    };
  }, [user?.id]);

  // Public methods
  const sendPost = useCallback((content: string) => {
    if (socket && user) {
      socket.emit('new_post', {
        content,
        userId: user.id
      });
      addBreadcrumb('Sent community post', 'community');
    }
  }, [socket, user]);

  const toggleHeart = useCallback((postId: string) => {
    if (socket) {
      socket.emit('toggle_heart', postId);
      addBreadcrumb(`Hearted post: ${postId}`, 'community');
    }
  }, [socket]);

  const startTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing_start');
    }
  }, [socket]);

  const stopTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing_stop');
    }
  }, [socket]);

  return {
    ...state,
    sendPost,
    toggleHeart,
    startTyping,
    stopTyping
  };
};