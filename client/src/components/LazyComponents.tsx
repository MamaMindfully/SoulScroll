import React, { Suspense, lazy } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Loading component for Suspense fallback
const LoadingFallback = ({ name }: { name?: string }) => (
  <div className="min-h-[200px] flex items-center justify-center">
    <Card className="bg-black/40 border-purple-500/30 p-8">
      <CardContent className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-gray-300 text-sm">
          {name ? `Loading ${name}...` : 'Loading...'}
        </p>
      </CardContent>
    </Card>
  </div>
);

// Lazy loaded components - only import existing pages
export const LazyProgress = lazy(() => import('@/pages/progress'));
export const LazyCommunity = lazy(() => import('@/pages/community'));
export const LazySettings = lazy(() => import('@/pages/settings'));
export const LazyPricing = lazy(() => import('@/pages/pricing'));

// Higher-order component for lazy loading with Suspense
export const withLazyLoading = (LazyComponent: React.ComponentType<any>, name?: string) => {
  return (props: any) => (
    <Suspense fallback={<LoadingFallback name={name} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Pre-configured lazy components with fallbacks - only existing pages
export const SuspenseProgress = withLazyLoading(LazyProgress, "Progress");
export const SuspenseCommunity = withLazyLoading(LazyCommunity, "Community");
export const SuspenseSettings = withLazyLoading(LazySettings, "Settings");
export const SuspensePricing = withLazyLoading(LazyPricing, "Pricing");