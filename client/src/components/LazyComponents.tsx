import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load heavy components - pages
export const LazyFeed = lazy(() => import('@/pages/Feed'));
export const LazyDreams = lazy(() => import('@/pages/dreams'));
export const LazyMantras = lazy(() => import('@/pages/mantras'));
export const LazyInsights = lazy(() => import('@/pages/insights'));
export const LazyTimeline = lazy(() => import('@/pages/timeline'));
export const LazySettings = lazy(() => import('@/pages/settings'));
export const LazyPricing = lazy(() => import('@/pages/pricing'));
export const LazyProgress = lazy(() => import('@/pages/progress'));
export const LazyCommunity = lazy(() => import('@/pages/community'));

// Lazy load heavy components - components
export const LazyAskArc = lazy(() => import('@/components/AskArc'));
export const LazyExportManager = lazy(() => import('@/components/ExportManager'));
export const LazyArcArchive = lazy(() => import('@/components/ArcArchive'));

// Enhanced loading component with logging
const ComponentLoader = ({ name }: { name: string }) => {
  console.log(`🔄 Loading component: ${name}`);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="w-16 h-16 bg-purple-200 rounded-full mx-auto"></div>
            <div className="h-4 bg-purple-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-purple-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-purple-600 mt-4">Loading {name}...</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced wrapper component with Suspense and logging
export const withLazyLoading = (Component: React.LazyExoticComponent<any>, name: string) => {
  return (props: any) => {
    console.log(`🎯 Rendering lazy component: ${name}`);
    
    return (
      <Suspense fallback={<ComponentLoader name={name} />}>
        <Component {...props} />
      </Suspense>
    );
  };
};