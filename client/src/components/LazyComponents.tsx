import { lazy, ComponentType, Suspense } from 'react';

// Loading component for lazy-loaded components
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
  </div>
);

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

// Page-level lazy components for App.tsx
export const LazyFeed = lazy(() => import('../pages/Feed'));
export const LazyDreams = lazy(() => import('../pages/dreams'));
export const LazyMantras = lazy(() => import('../pages/mantras'));
export const LazyInsights = lazy(() => import('../pages/insights'));
export const LazyTimeline = lazy(() => import('../pages/timeline'));
export const LazySettings = lazy(() => import('../pages/settings'));
export const LazyPricing = lazy(() => import('../pages/premium'));
export const LazyAskArc = lazy(() => import('../pages/ask-arc'));
export const LazyExportManager = lazy(() => import('../pages/export-manager'));
export const LazyArcArchive = lazy(() => import('../pages/arc-archive'));
export const LazyProgress = lazy(() => import('../pages/progress'));
export const LazyCommunity = lazy(() => import('../pages/community'));

// Higher-order component for lazy loading with suspense
export const withLazyLoading = <P extends object>(Component: ComponentType<P>) => {
  return (props: P) => (
    <Suspense fallback={<ComponentLoader />}>
      <Component {...props} />
    </Suspense>
  );
};