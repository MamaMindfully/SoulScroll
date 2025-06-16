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

## Changelog
```
Changelog:
- June 16, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```