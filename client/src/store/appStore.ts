import { create } from 'zustand';
import { addBreadcrumb, setUserContext } from '@/utils/sentry';

interface FeatureAccess {
  community: boolean;
  dream: boolean;
  progress: boolean;
}

interface AppState {
  userId: string | null;
  isLoggedIn: boolean;
  subscriptionStatus: 'free' | 'active' | 'paused' | 'canceled';
  featureAccess: FeatureAccess;
}

interface AppActions {
  setUser: (userId: string) => void;
  setSubscriptionStatus: (status: 'free' | 'active' | 'paused' | 'canceled') => void;
  logout: () => void;
}

const calculateFeatureAccess = (status: 'free' | 'active' | 'paused' | 'canceled'): FeatureAccess => {
  let featureAccess: FeatureAccess = {
    community: false,
    dream: false,
    progress: false,
  };

  if (status === 'active') {
    featureAccess = {
      community: true,
      dream: true,
      progress: true,
    };
  }

  return featureAccess;
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  userId: null,
  isLoggedIn: false,
  subscriptionStatus: 'free',
  featureAccess: {
    community: false,
    dream: false,
    progress: false,
  },

  setUser: (userId: string) => {
    set({ userId, isLoggedIn: true });
    addBreadcrumb('User logged in', 'app-store', { userId });
    setUserContext({ id: userId });
  },

  setSubscriptionStatus: (status: 'free' | 'active' | 'paused' | 'canceled') => {
    const featureAccess = calculateFeatureAccess(status);
    set({ subscriptionStatus: status, featureAccess });
    addBreadcrumb('Subscription status updated', 'app-store', { status, featureAccess });
  },

  logout: () => {
    set({
      userId: null,
      isLoggedIn: false,
      subscriptionStatus: 'free',
      featureAccess: {
        community: false,
        dream: false,
        progress: false,
      }
    });
    addBreadcrumb('User logged out', 'app-store');
  },
}));

// Convenience hooks for specific parts of state
export const useAuthState = () => useAppStore((state) => ({
  userId: state.userId,
  isLoggedIn: state.isLoggedIn
}));

export const useFeatureAccess = () => useAppStore((state) => state.featureAccess);

export const useSubscriptionStatus = () => useAppStore((state) => state.subscriptionStatus);