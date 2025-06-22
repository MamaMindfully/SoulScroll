import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { addBreadcrumb, setUserContext } from '@/utils/sentry';
import { performanceMonitor } from '@/utils/performance';

interface FeatureAccess {
  community: boolean;
  dreams: boolean;
  progress: boolean;
  voice: boolean;
  insights: boolean;
  export: boolean;
  mantras: boolean;
  mama: boolean;
}

interface AppState {
  isLoggedIn: boolean;
  userId?: string;
  subscriptionStatus: 'free' | 'premium' | 'premium_plus' | 'expired';
  currentPage: string;
  showOnboardingModal: boolean;
  featureAccess: FeatureAccess;
  userProfile?: {
    email?: string;
    name?: string;
    intent?: string;
    ritualTime?: string;
    mentorPersona?: string;
  };
  connectionStatus: 'online' | 'offline';
  lastSync?: Date;
}

type AppAction = 
  | { type: 'SET_AUTH'; payload: { isLoggedIn: boolean; userId?: string; userProfile?: any } }
  | { type: 'SET_SUBSCRIPTION'; payload: { status: string; isPremium: boolean } }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'TOGGLE_ONBOARDING'; payload: boolean }
  | { type: 'UPDATE_PROFILE'; payload: Partial<AppState['userProfile']> }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'online' | 'offline' }
  | { type: 'SYNC_COMPLETED' };

const initialState: AppState = {
  isLoggedIn: false,
  subscriptionStatus: 'free',
  currentPage: '/',
  showOnboardingModal: false,
  featureAccess: {
    community: false,
    dreams: false,
    progress: true, // Always available
    voice: false,
    insights: false,
    export: false,
    mantras: false,
    mama: false
  },
  connectionStatus: 'online'
};

function calculateFeatureAccess(subscriptionStatus: string, isPremium: boolean): FeatureAccess {
  const baseAccess = {
    community: true, // Basic community access for all
    dreams: false,
    progress: true, // Always available
    voice: false,
    insights: false,
    export: false,
    mantras: false,
    mama: false
  };

  if (isPremium || subscriptionStatus === 'premium' || subscriptionStatus === 'premium_plus') {
    return {
      community: true,
      dreams: true,
      progress: true,
      voice: true,
      insights: true,
      export: true,
      mantras: true,
      mama: true
    };
  }

  return baseAccess;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTH':
      const featureAccess = calculateFeatureAccess(state.subscriptionStatus, false);
      addBreadcrumb('Auth state updated', 'app-context', { 
        isLoggedIn: action.payload.isLoggedIn,
        userId: action.payload.userId 
      });
      
      if (action.payload.userId && action.payload.userProfile) {
        setUserContext({ 
          id: action.payload.userId, 
          email: action.payload.userProfile.email 
        });
      }

      return {
        ...state,
        isLoggedIn: action.payload.isLoggedIn,
        userId: action.payload.userId,
        userProfile: action.payload.userProfile,
        featureAccess
      };

    case 'SET_SUBSCRIPTION':
      const newFeatureAccess = calculateFeatureAccess(action.payload.status, action.payload.isPremium);
      addBreadcrumb('Subscription updated', 'app-context', { 
        status: action.payload.status,
        isPremium: action.payload.isPremium 
      });

      return {
        ...state,
        subscriptionStatus: action.payload.status as AppState['subscriptionStatus'],
        featureAccess: newFeatureAccess
      };

    case 'SET_CURRENT_PAGE':
      addBreadcrumb('Page navigation', 'app-context', { page: action.payload });
      return {
        ...state,
        currentPage: action.payload
      };

    case 'TOGGLE_ONBOARDING':
      return {
        ...state,
        showOnboardingModal: action.payload
      };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          ...action.payload
        }
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload
      };

    case 'SYNC_COMPLETED':
      return {
        ...state,
        lastSync: new Date()
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience methods
  setCurrentPage: (page: string) => void;
  updateProfile: (profile: Partial<AppState['userProfile']>) => void;
  hasFeatureAccess: (feature: keyof FeatureAccess) => boolean;
  triggerSync: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isPremium, premiumData } = usePremium();

  // Sync auth state
  useEffect(() => {
    if (!isLoading) {
      performanceMonitor.startMark('app-context-auth-sync');
      
      dispatch({
        type: 'SET_AUTH',
        payload: {
          isLoggedIn: isAuthenticated,
          userId: user?.id,
          userProfile: user
        }
      });

      performanceMonitor.endMark('app-context-auth-sync');
    }
  }, [user, isAuthenticated, isLoading]);

  // Sync subscription state
  useEffect(() => {
    if (premiumData) {
      dispatch({
        type: 'SET_SUBSCRIPTION',
        payload: {
          status: premiumData.isPremium ? 'premium' : 'free',
          isPremium
        }
      });
    }
  }, [isPremium, premiumData]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
    const handleOffline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    dispatch({ 
      type: 'SET_CONNECTION_STATUS', 
      payload: navigator.onLine ? 'online' : 'offline' 
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Convenience methods
  const setCurrentPage = (page: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  };

  const updateProfile = (profile: Partial<AppState['userProfile']>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });
  };

  const hasFeatureAccess = (feature: keyof FeatureAccess): boolean => {
    return state.featureAccess[feature];
  };

  const triggerSync = () => {
    dispatch({ type: 'SYNC_COMPLETED' });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setCurrentPage,
    updateProfile,
    hasFeatureAccess,
    triggerSync
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};