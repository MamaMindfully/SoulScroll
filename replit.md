# Luma - AI-Powered Emotional Journaling App

## Overview

Luma is a full-stack emotional journaling application that combines React frontend with Express backend, featuring AI-powered responses, emotional tone analysis, and streak tracking. The app provides a compassionate companion for users to document their thoughts and receive personalized insights.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom color scheme and mobile-first design
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Optimization**: PWA-ready with offline capabilities and responsive design

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL
- **AI Integration**: OpenAI API for emotional analysis and compassionate responses
- **Real-time Features**: Auto-save functionality with debounced updates

## Key Components

### Database Schema
- **Users**: Profile data, premium status, streak tracking, subscription management
- **Journal Entries**: Content, word count, emotional tone analysis, AI responses, voice transcriptions
- **Daily Prompts**: Categorized prompts with premium/free tiers
- **Emotional Insights**: Weekly/monthly analytical data and mood trends
- **Reflection Letters**: AI-generated monthly summaries for premium users
- **Sessions**: Secure session storage for authentication

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- User profile management with automatic upsert
- Protected routes with middleware validation

### AI Services
- **Emotional Analysis**: GPT-4o powered sentiment analysis with confidence scoring
- **Compassionate Responses**: Context-aware AI reflections based on current and previous entries
- **Insight Generation**: Weekly emotional pattern analysis and personalized recommendations

### Offline Capabilities
- Local storage for offline journal entries
- Automatic synchronization when connection restored
- Service worker integration for PWA functionality

## Data Flow

1. **User Authentication**: Replit Auth → Session Creation → User Profile Sync
2. **Journal Entry**: Content Input → Auto-save → Word Count → Emotional Analysis → AI Response Generation
3. **Streak Tracking**: Entry Creation → Date Validation → Streak Calculation → User Stats Update
4. **Insights Generation**: Batch Processing → Emotional Trend Analysis → Personalized Recommendations

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless with connection pooling
- **AI Services**: OpenAI API for GPT-4o model access
- **Authentication**: Replit's OpenID Connect provider
- **UI Components**: Radix UI primitives with Shadcn/ui styling

### Development Tools
- **Build Tool**: Vite with TypeScript support
- **Database Migration**: Drizzle Kit for schema management
- **Code Quality**: ESLint and TypeScript strict mode

## Deployment Strategy

### Production Build
- Frontend: Vite build to static assets
- Backend: ESBuild bundle for Node.js deployment
- Database: Drizzle push for schema synchronization

### Environment Configuration
- **Development**: Local development server with HMR
- **Production**: Autoscale deployment on Replit infrastructure
- **Database**: Serverless Neon PostgreSQL with WebSocket support

### Performance Optimizations
- Query caching with TanStack Query
- Memoized OpenAI client connections
- Debounced auto-save to reduce API calls
- Optimistic UI updates for better UX

## Mobile Optimization & Deployment Readiness

### Mobile-First Features
- **Progressive Web App (PWA)**: Full PWA implementation with manifest.json, service worker, and offline capabilities
- **Push Notifications**: Complete notification system with daily reminders, weekly insights, and achievement alerts
- **Offline Mode**: Local storage journaling with automatic sync when connection restored
- **App Installation**: Add to Home Screen functionality for iOS Safari and Android Chrome
- **Touch Optimizations**: Mobile-responsive design with touch-friendly interfaces and gestures

### Engagement & Gamification
- **Achievement System**: Unlock badges for writing streaks, word counts, and emotional exploration
- **Challenge Mode**: Daily, weekly, and monthly challenges to maintain engagement
- **Streak Tracking**: Visual streak counters with milestone celebrations
- **XP System**: Experience points for consistent journaling and feature usage
- **Premium Rewards**: Unlock advanced features through engagement or subscription

### App Store Deployment Strategy
- **iOS App Store**: PWA ready for Safari with Apple touch icons and proper metadata
- **Google Play Store**: Trusted Web Activity (TWA) compatible for native Android experience
- **Web Deployment**: Direct HTTPS deployment with full feature compatibility
- **Cross-Platform**: Single codebase serving web, iOS, and Android through PWA technology

### Local Mode vs Cloud Mode
- **Local Mode**: Complete offline experience with device-only storage, no AI features
- **Cloud Mode**: Full feature set with AI analysis, cross-device sync, and premium capabilities
- **Seamless Toggle**: Users can switch modes based on privacy preferences

## Advanced Features Implemented

### Voice Journaling & AI Transcription
- **Real-time Audio Recording**: Browser-based voice recording with Web Audio API
- **AI Transcription**: OpenAI Whisper integration for accurate speech-to-text
- **Voice Entry Management**: Audio playback, editing, and deletion capabilities
- **Seamless Integration**: Voice notes automatically linked to journal entries

### Premium Subscription System
- **Tiered Plans**: Free, Premium ($9.99), and Premium Plus ($19.99) subscription tiers
- **Feature Gating**: Advanced AI features, voice journaling, and analytics for premium users
- **Subscription Management**: User portal for plan changes and billing history
- **Stripe Integration**: Secure payment processing with subscription lifecycle management

### Community & Social Features
- **Anonymous Mood Sharing**: Share emotional states publicly while maintaining privacy
- **Community Support**: Send and receive anonymous encouragement messages
- **Location-based Connections**: Optional city-level mood sharing for local community
- **Privacy Controls**: Granular settings for public sharing and anonymity

### Health Data Integration
- **Fitness Tracker Sync**: Apple Health and Google Fit integration
- **Correlation Analysis**: AI-powered insights linking physical health to emotional wellbeing
- **Weather Impact**: Weather condition tracking and mood correlation analysis
- **Health Metrics Dashboard**: Sleep, steps, exercise, and heart rate visualization

### Advanced AI Analytics
- **Mood Prediction**: 7-day mood forecasting with confidence intervals
- **Pattern Recognition**: Long-term emotional trend analysis and insights
- **Personalized Recommendations**: AI-generated coping strategies and action items
- **Emotional Intelligence**: Advanced sentiment analysis with nuanced emotion detection

### Data Export & Privacy
- **Complete Data Export**: PDF reports, JSON dumps, and ZIP archives
- **Cloud Backup**: Automated backups to Google Drive and email
- **GDPR Compliance**: Right to data portability and deletion
- **Encryption**: End-to-end encryption for sensitive journal data

### Gamification & Engagement
- **Achievement System**: Unlock badges for writing streaks and emotional exploration
- **Challenge Modes**: Daily, weekly, and monthly journaling challenges
- **XP System**: Experience points for consistent app usage and feature engagement
- **Progress Tracking**: Visual indicators for personal growth and milestones

### Mobile-First PWA Features
- **Offline Journaling**: Complete functionality without internet connection
- **Push Notifications**: Smart reminders and motivational messages
- **App Installation**: Add to Home Screen for native-like experience
- **Touch Optimization**: Gesture-based navigation and mobile-responsive design

## Technical Architecture Enhancements

### Database Schema Expansion
- **Advanced Tables**: Voice entries, community features, subscriptions, health data
- **Relational Integrity**: Comprehensive foreign key relationships and data consistency
- **Performance Optimization**: Indexed queries and efficient data retrieval patterns

### AI Service Integration
- **OpenAI GPT-4o**: Advanced language model for emotional analysis and responses
- **Whisper API**: State-of-the-art speech recognition for voice transcription
- **Predictive Analytics**: Machine learning models for mood forecasting
- **Natural Language Processing**: Sophisticated text analysis and insight generation

### API Architecture
- **RESTful Design**: Comprehensive endpoints for all advanced features
- **Authentication**: Secure user sessions with premium feature validation
- **Rate Limiting**: API protection and fair usage policies
- **Error Handling**: Graceful failure modes and user-friendly error messages

## Deployment Readiness

### Production Optimization
- **Code Splitting**: Optimized bundle sizes for faster loading
- **Caching Strategy**: Intelligent caching for improved performance
- **CDN Integration**: Asset delivery optimization for global users
- **Monitoring**: Error tracking and performance analytics

### Monetization Strategy
- **Freemium Model**: Compelling free tier with premium upgrade incentives
- **Subscription Tiers**: Clear value proposition for each pricing level
- **Usage Analytics**: Conversion funnel optimization and user behavior tracking
- **Retention Features**: Engagement mechanisms to reduce churn

## Changelog
```
Changelog:
- June 16, 2025: Initial setup with full-stack journaling app
- June 16, 2025: Comprehensive mobile optimization and PWA implementation
- June 16, 2025: Push notifications, offline mode, and engagement features
- June 16, 2025: App store deployment readiness and cross-platform compatibility
- June 16, 2025: Complete advanced features implementation including:
  * Voice journaling with AI transcription
  * Premium subscription system with Stripe integration
  * Community features with anonymous mood sharing
  * Health data integration and correlation analysis
  * Advanced AI analytics with mood prediction
  * Comprehensive data export and privacy controls
  * Gamification system with achievements and challenges
  * Enhanced mobile PWA capabilities
- June 16, 2025: Final mobile optimization touches completed:
  * Advanced touch optimizations with double-tap zoom prevention
  * Safe area insets for notched devices (iPhone X+)
  * Enhanced button responsiveness and visual feedback
  * Performance optimizations with hardware acceleration
  * Mobile-optimized typography and form inputs
  * Complete PWA functionality with offline support
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```