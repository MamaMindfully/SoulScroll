import { lazy } from 'react';

// Lazy load heavy components for better performance
export const CommunityFeed = lazy(() => import('./CommunityFeed'));
export const DreamMode = lazy(() => import('./DreamMode'));
export const VisualProgressTracker = lazy(() => import('./VisualProgressTracker'));
export const EmotionChart = lazy(() => import('./EmotionChart'));
export const AIJournalAnalyzer = lazy(() => import('./AIJournalAnalyzer'));
export const AdvancedAnalyticsDashboard = lazy(() => import('./AdvancedAnalyticsDashboard'));
export const DataExportComponent = lazy(() => import('./DataExportComponent'));
export const VoiceJournalingComponent = lazy(() => import('./VoiceJournalingComponent'));
export const MantraDesigner = lazy(() => import('./MantraDesigner'));
export const PremiumSubscriptionComponent = lazy(() => import('./PremiumSubscriptionComponent'));

// Loading component for lazy-loaded components
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
  </div>
);