import { Server as SocketIOServer } from 'socket.io';
import type { Server } from 'http';
import { logger } from '../utils/logger';

interface CommunityPost {
  id: string;
  content: string;
  timestamp: Date;
  hearts: number;
  userId?: string;
}

interface SocketUser {
  userId?: string;
  socketId: string;
  joinedAt: Date;
}

export class RealtimeServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private recentPosts: CommunityPost[] = [];

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      path: '/socket.io',
      cors: {
        origin: process.env.NODE_ENV === 'development' ? "*" : false,
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    logger.info('Socket.IO server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);
      
      // Store connected user
      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        joinedAt: new Date()
      });

      // Send recent posts to new connection
      socket.emit('recent_posts', this.recentPosts.slice(-10));
      
      // Broadcast user count
      this.broadcastUserCount();

      // Handle user authentication
      socket.on('authenticate', (userId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          user.userId = userId;
          this.connectedUsers.set(socket.id, user);
          logger.info(`User authenticated: ${userId}`);
        }
      });

      // Handle new community posts
      socket.on('new_post', (postData: Omit<CommunityPost, 'id' | 'timestamp'>) => {
        const post: CommunityPost = {
          id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: postData.content,
          timestamp: new Date(),
          hearts: 0,
          userId: postData.userId
        };

        // Add to recent posts (keep last 50)
        this.recentPosts.push(post);
        if (this.recentPosts.length > 50) {
          this.recentPosts.shift();
        }

        // Broadcast to all connected users
        this.io.emit('post_created', post);
        logger.info(`New post created: ${post.id}`);
      });

      // Handle post hearts/likes
      socket.on('toggle_heart', (postId: string) => {
        const post = this.recentPosts.find(p => p.id === postId);
        if (post) {
          post.hearts += 1;
          this.io.emit('post_updated', post);
          logger.info(`Post hearted: ${postId}`);
        }
      });

      // Handle typing indicators
      socket.on('typing_start', () => {
        socket.broadcast.emit('user_typing', socket.id);
      });

      socket.on('typing_stop', () => {
        socket.broadcast.emit('user_stopped_typing', socket.id);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
        this.broadcastUserCount();
      });
    });
  }

  private broadcastUserCount() {
    const count = this.connectedUsers.size;
    this.io.emit('user_count', count);
  }

  // Public method to send announcements
  public sendAnnouncement(message: string) {
    this.io.emit('announcement', {
      message,
      timestamp: new Date()
    });
    logger.info(`Announcement sent: ${message}`);
  }
}

export let realtimeServer: RealtimeServer;

export const setupRealtimeServer = (server: Server): RealtimeServer => {
  realtimeServer = new RealtimeServer(server);
  return realtimeServer;
};