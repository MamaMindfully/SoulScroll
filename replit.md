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
- **Feature Gating**: Advanced AI features, voice journaling, dream interpretation, mantra designer, Mama Mindfully wellness coaching, progressive depth exploration, and analytics for premium users
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
- **Dream Interpretation**: Mystical AI-powered dream analysis with symbol extraction and spiritual insights
- **Progressive Depth Exploration**: 5-level "Go Deeper" system for profound self-discovery

### Spiritual & Mindfulness Tools
- **Mantra Designer**: Create personalized mantras and affirmations organized by category
- **Dream Mode**: Complete dream interpretation system with intention setting and AI analysis
- **Mama Mindfully**: Nurturing AI wellness coach for emotional support and gentle guidance
- **Daily Rituals**: Time-aware morning/evening prompts with personalization and streak tracking
- **Progressive Depth Exploration**: 5-level "Go Deeper" system for profound self-discovery
- **Meditation Integration**: Guided practices and mindfulness exercises
- **Sacred Space**: Digital sanctuary for reflection and spiritual practice

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
- June 16, 2025: Enhanced emotional intelligence based on project insights:
  * Updated AI voice to "therapist meets poet meets future self"
  * Added soulful animations with breathing orb and thinking delays
  * Created enhanced prompt system with deeper questions
  * Improved placeholder text for sacred space feeling
  * Added gentle micro-animations for emotional safety
- June 16, 2025: Complete revenue optimization system implemented:
  * Annual subscription discounts (17% savings on yearly plans)
  * Gift subscription system with bulk pricing discounts
  * Smart paywall triggers and usage progress indicators
  * Limited-time offers with countdown timers
  * Comprehensive pricing page with social proof
  * Revenue analytics dashboard for tracking performance
- June 16, 2025: App Store optimization and compliance completed:
  * PWA manifest with app shortcuts and icons
  * Privacy policy and GDPR/CCPA compliance features
  * Data export and account deletion controls
  * App Store metadata and install prompts
  * Security badges and compliance certifications
  * Perfect App Store submission readiness
- June 21, 2025: Enhanced UI/UX features implemented:
  * Fixed deployment syntax errors in settings.tsx
  * Added scroll-to-insight functionality with smooth animations
  * Implemented fade-in animations for AI reflection components
  * Added deeper response functionality for user engagement
  * Enhanced premium status API with dedicated routes
  * Created reusable premium feature components
  * Built compassionate insight generator with contextual responses
  * Created tree progress visualization system with 3 growth stages
  * Added motivational tree progression based on journal streaks
  * Implemented PDF export functionality with jsPDF and html2canvas
  * Created comprehensive export manager with multiple export options
  * Added visual PDF export preserving journal layout and styling
  * Built Inner Compass feature with daily themes and guidance prompts
  * Created Ask Arc AI assistant for deeper reflection and life questions
  * Added Wisdom Feed component with community insights and inspirational quotes
  * Implemented Arc Memory Archive with pattern analysis and theme extraction
  * Added OpenAI API integration for Arc assistant with conversation support
  * Enhanced component polish with auto-hiding start button and smooth scroll behavior
  * Added input sanitization and mood detection for journal entries
  * Implemented follow-up prompt generation for deeper AI engagement
  * Added PWA manifest with app shortcuts and iOS optimizations
  * Implemented lazy loading for heavy components to improve performance
  * Added production logger and cleaned up console statements
  * Created Supabase reflections table for community wisdom sharing
  * Enhanced WisdomFeed with premium gating and real-time community content
  * Built daily ritual engine with morning/evening practices
  * Added Inner Compass system for daily emotional themes and archetypes
  * Implemented feedback modal system for user experience improvement
  * Added premium feature gating for Ask Arc multi-response and Feed access
- June 21, 2025: Comprehensive QA testing and critical bug fixes:
  * Fixed Inner Compass component import/export issues
  * Resolved Ask Arc API integration with proper authentication
  * Corrected Tap to Go Deeper syntax errors and premium gating
  * Created complete Timeline visualization system with Recharts
  * Added progressive depth exploration API endpoint
  * Verified all authentication flows and premium feature restrictions
  * Confirmed mobile responsiveness and Safari/iOS compatibility
  * Validated all backend routes and database operations
  * Tested OpenAI integration across all AI-powered features
  * Application confirmed production-ready with full feature compliance
- June 21, 2025: Complete Stripe payment system and reflection feedback implementation:
  * Added comprehensive Stripe checkout session creation with 7-day free trial
  * Implemented Stripe webhook handling for subscription lifecycle management
  * Created complete premium subscription pages with monthly/yearly pricing
  * Built reflection feedback system with save/dismiss/ask-again functionality
  * Added saved_reflections database table with proper indexing
  * Created reflection archive page for users to view saved insights
  * Integrated PremiumGuard component for feature gating across the app
  * Added premium success page with feature overview and subscription management
  * Updated navigation to include Archive tab for easy access to saved reflections
  * Implemented complete payment flow from checkout to premium feature unlock
- June 21, 2025: Updated pricing structure:
  * Changed monthly plan from $9.99 to $8.99
  * Changed yearly plan from $99.99 to $89.99 (maintaining 17% savings)
  * Updated pricing across all components and pages consistently
- June 21, 2025: Implemented multi-round conversation threading and enhanced Go Deeper functionality:
  * Created conversational AI threading system with context-aware responses
  * Enhanced TapToGoDeeper with 5-level progressive exploration system
  * Added user input areas for interactive dialogue between AI responses
  * Implemented automatic scroll-to-view and focus management for smooth UX
  * Created /api/deeper-thread endpoint for multi-round GPT conversations
  * Added progressive depth system prompts (Surface → Deeper → Core → Soul → Transcendent)
  * Integrated reflection feedback and regeneration system
  * Added conversation thread memory with user responses and AI insights
  * Premium gating for unlimited depth exploration (free users get 1 level)
  * Enhanced UI with conversation flow visualization and level badges
- June 21, 2025: Implemented advanced utility engines for enhanced user engagement:
  * Created Memory Loop Engine with AI embeddings for finding similar past reflections
  * Built Weekly Portal Engine with ritual progress tracking and mystery rewards
  * Developed Affirmation Action Mapper converting affirmations to actionable daily tasks
  * Added comprehensive backend API endpoints for all utility engines
  * Created WeeklyPortalCard component with theme generation and progress visualization
  * Built AffirmationActionCard component with custom affirmation input and completion tracking
  * Integrated OpenAI embeddings API for semantic similarity search
  * Added weekly theme generation with GPT-4o for personalized spiritual guidance
  * Implemented action completion tracking and weekly progress analytics
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```