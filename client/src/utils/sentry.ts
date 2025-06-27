import * as Sentry from "@sentry/react";

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } else {
    console.log('Sentry initialized for development (console logging)');
  }
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error captured for Sentry:', error, context);
  }
};

export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      data,
      level: 'info',
    });
  } else {
    console.log(`Breadcrumb: [${category}] ${message}`, data);
  }
};

export const setUserContext = (user: { id: string; email?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  } else {
    console.log('User context set:', user);
  }
};