import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { addBreadcrumb, setUserContext } from '@/utils/sentry';
import { performanceMonitor } from '@/utils/performance';

interface FeatureAccess {
  community: boolean;
  dream: boolean;
  progress: boolean;
  voice: boolean;
  insights: boolean;
  export: boolean;
  mantras: boolean;
  mama: boolean;
}

interface UserProfile {
  email?: string;
  name?: string;
  intent?: string;
  ritualTime?: string;
  mentorPersona?: string;
}

interface AppState {
  // Core authentication state
  userId?: string;
  isLoggedIn: boolean;
  subscriptionStatus: 'free' | 'premium' | 'premium_plus' | 'expired';
  
  // Feature access control
  featureAccess: FeatureAccess;
  
  // User data
  userProfile?: UserProfile;
  
  // App state
  currentPage: string;
  showOnboardingModal: boolean;
  connectionStatus: 'online' | 'offline';
  lastSync?: Date;
  
  // Loading states
  isAuthLoading: boolean;
  isSubscriptionLoading: boolean;
}

interface AppActions {
  // Authentication actions
  setAuth: (isLoggedIn: boolean, userId?: string, userProfile?: UserProfile) => void;
  setSubscription: (status: string, isPremium: boolean) => void;
  
  // UI state actions
  setCurrentPage: (page: string) => void;
  toggleOnboarding: (show: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Connection actions
  setConnectionStatus: (status: 'online' | 'offline') => void;
  triggerSync: () => void;
  
  // Loading actions
  setAuthLoading: (loading: boolean) => void;
  setSubscriptionLoading: (loading: boolean) => void;
  
  // Utility actions
  hasFeatureAccess: (feature: keyof FeatureAccess) => boolean;
  reset: () => void;
}

type AppStore = AppState & AppActions;

const calculateFeatureAccess = (subscriptionStatus: string, isPremium: boolean): FeatureAccess => {
  // Base features available to all users
  const baseAccess: FeatureAccess = {
    community: false, // Premium only
    dream: false,     // Premium only
    progress: true,   // Always available
    voice: false,     // Premium only
    insights: false,  // Premium only
    export: false,    // Premium only
    mantras: false,   // Premium only
    mama: false       // Premium only
  };

  // Premium features
  if (isPremium || subscriptionStatus === 'premium' || subscriptionStatus === 'premium_plus') {
    return {
      community: true,
      dream: true,
      progress: true,
      voice: true,
      insights: true,
      export: true,
      mantras: true,
      mama: true
    };
  }

  return baseAccess;
};

const initialState: AppState = {
  userId: undefined,
  isLoggedIn: false,
  subscriptionStatus: 'free',
  featureAccess: calculateFeatureAccess('free', false),
  currentPage: '/',
  showOnboardingModal: false,
  connectionStatus: 'online',
  isAuthLoading: true,
  isSubscriptionLoading: false
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Authentication actions
    setAuth: (isLoggedIn, userId, userProfile) => {
      performanceMonitor.startMark('app-store-auth-update');
      
      const currentState = get();
      const newFeatureAccess = calculateFeatureAccess(
        currentState.subscriptionStatus, 
        currentState.subscriptionStatus !== 'free'
      );

      set({
        isLoggedIn,
        userId,
        userProfile,
        featureAccess: newFeatureAccess,
        isAuthLoading: false
      });

      // Update Sentry context
      if (userId && userProfile) {
        setUserContext({ id: userId, email: userProfile.email });
      }

      addBreadcrumb('Auth state updated', 'app-store', {
        isLoggedIn,
        userId,
        hasProfile: !!userProfile
      });

      performanceMonitor.endMark('app-store-auth-update');
    },

    setSubscription: (status, isPremium) => {
      const newFeatureAccess = calculateFeatureAccess(status, isPremium);
      
      set({
        subscriptionStatus: status as AppState['subscriptionStatus'],
        featureAccess: newFeatureAccess,
        isSubscriptionLoading: false
      });

      addBreadcrumb('Subscription updated', 'app-store', {
        status,
        isPremium,
        features: Object.keys(newFeatureAccess).filter(key => 
          newFeatureAccess[key as keyof FeatureAccess]
        )
      });
    },

    // UI state actions
    setCurrentPage: (page) => {
      set({ currentPage: page });
      addBreadcrumb('Page navigation', 'app-store', { page });
    },

    toggleOnboarding: (show) => {
      set({ showOnboardingModal: show });
    },

    updateProfile: (profile) => {
      const currentProfile = get().userProfile;
      set({
        userProfile: { ...currentProfile, ...profile }
      });
      addBreadcrumb('Profile updated', 'app-store', profile);
    },

    // Connection actions
    setConnectionStatus: (status) => {
      set({ connectionStatus: status });
      addBreadcrumb('Connection status changed', 'app-store', { status });
    },

    triggerSync: () => {
      set({ lastSync: new Date() });
      addBreadcrumb('Data sync triggered', 'app-store');
    },

    // Loading actions
    setAuthLoading: (loading) => {
      set({ isAuthLoading: loading });
    },

    setSubscriptionLoading: (loading) => {
      set({ isSubscriptionLoading: loading });
    },

    // Utility actions
    hasFeatureAccess: (feature) => {
      return get().featureAccess[feature];
    },

    reset: () => {
      set(initialState);
      addBreadcrumb('App store reset', 'app-store');
    }
  }))
);

// Selectors for optimized re-renders
export const useAuth = () => useAppStore((state) => ({
  userId: state.userId,
  isLoggedIn: state.isLoggedIn,
  userProfile: state.userProfile,
  isLoading: state.isAuthLoading
}));

export const useSubscription = () => useAppStore((state) => ({
  subscriptionStatus: state.subscriptionStatus,
  featureAccess: state.featureAccess,
  isLoading: state.isSubscriptionLoading
}));

export const useFeatureAccess = () => useAppStore((state) => ({
  featureAccess: state.featureAccess,
  hasFeatureAccess: state.hasFeatureAccess
}));

export const useAppState = () => useAppStore((state) => ({
  currentPage: state.currentPage,
  showOnboardingModal: state.showOnboardingModal,
  connectionStatus: state.connectionStatus,
  lastSync: state.lastSync
}));

// Initialize store with browser state
if (typeof window !== 'undefined') {
  // Listen for online/offline events
  window.addEventListener('online', () => {
    useAppStore.getState().setConnectionStatus('online');
  });
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setConnectionStatus('offline');
  });

  // Set initial connection status
  useAppStore.getState().setConnectionStatus(
    navigator.onLine ? 'online' : 'offline'
  );
}