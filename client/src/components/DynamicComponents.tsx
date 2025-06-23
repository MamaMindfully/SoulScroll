import { lazy, Suspense } from 'react';
import { // useHasMounted removed } from '@/utils/// useHasMounted removed';

// Dynamic imports for heavy components
const ConstellationMap = lazy(() => import('@/components/InsightGraph'));
const EmotionalDashboard = lazy(() => import('@/pages/EmotionalIntelligence'));
const ProgressDashboard = lazy(() => import('@/components/ProgressDashboard'));

interface DynamicComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  ssr?: boolean;
}

function DynamicComponentWrapper({ 
  children, 
  fallback = <div className="text-muted-foreground">Loading insights...</div>,
  ssr = false 
}: DynamicComponentWrapperProps) {
  const hasMounted = // useHasMounted removed();
  
  if (!ssr && !hasMounted) {
    return <>{fallback}</>;
  }
  
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Export wrapped dynamic components
export const DynamicConstellationMap = (props: any) => (
  <DynamicComponentWrapper ssr={false}>
    <ConstellationMap {...props} />
  </DynamicComponentWrapper>
);

export const DynamicEmotionalDashboard = (props: any) => (
  <DynamicComponentWrapper ssr={false}>
    <EmotionalDashboard {...props} />
  </DynamicComponentWrapper>
);

export const DynamicProgressDashboard = (props: any) => (
  <DynamicComponentWrapper ssr={false}>
    <ProgressDashboard {...props} />
  </DynamicComponentWrapper>
);

export default DynamicComponentWrapper;