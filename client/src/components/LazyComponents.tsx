import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load heavy components
export const LazyFeed = lazy(() => import('@/pages/Feed'));
export const LazyDreams = lazy(() => import('@/pages/dreams'));
export const LazyMantras = lazy(() => import('@/pages/mantras'));
export const LazyInsights = lazy(() => import('@/pages/insights'));
export const LazyTimeline = lazy(() => import('@/pages/timeline'));
export const LazySettings = lazy(() => import('@/pages/settings'));
export const LazyPricing = lazy(() => import('@/pages/pricing'));

// Loading component
const ComponentLoader = ({ name }: { name: string }) => (
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

// Wrapper component with Suspense
export const withLazyLoading = (Component: React.LazyExoticComponent<any>, name: string) => {
  return (props: any) => (
    <Suspense fallback={<ComponentLoader name={name} />}>
      <Component {...props} />
    </Suspense>
  );
};