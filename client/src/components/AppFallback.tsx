import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AppFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export default function AppFallback({ error, resetError }: AppFallbackProps) {
  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" data-fallback>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Application Error
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            SoulScroll encountered an unexpected error. We apologize for the inconvenience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2"
              variant="default"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2"
              variant="outline"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Error ID: {Date.now().toString(36)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}