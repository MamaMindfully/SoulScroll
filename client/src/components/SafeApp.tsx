import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "../context/ThemeContext";
import { PremiumProvider } from "../context/PremiumContext";
import SimpleAppRoutes from "./SimpleAppRoutes";
import { useHasMounted } from "../hooks/useHasMounted";
import ErrorBoundary from "./ErrorBoundary";
import AppFallback from "./AppFallback";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function SafeApp() {
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!hasMounted) return;
    
    // Setup global error handlers
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      // Log to backend
      fetch('/api/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'javascript_error',
          message: event.error?.message || 'Unknown error',
          stack: event.error?.stack,
          path: window.location.pathname,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Log to backend
      fetch('/api/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'promise_rejection',
          message: event.reason?.message || 'Promise rejection',
          stack: event.reason?.stack,
          path: window.location.pathname,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [hasMounted]);

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading SoulScroll...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<AppFallback />}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <PremiumProvider>
              <div className="App min-h-screen bg-background text-foreground">
                <ErrorBoundary>
                  <SimpleAppRoutes />
                </ErrorBoundary>
                <Toaster />
              </div>
            </PremiumProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}