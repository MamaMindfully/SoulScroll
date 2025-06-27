import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      session: null,
      isAuthenticated: false,
      userTraits: null,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setSession: (session) => {
        set({ session, isAuthenticated: !!session });
        if (session) {
          localStorage.setItem('supabase_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase_session');
        }
      },
      
      setUserTraits: (traits) => set({ userTraits: traits }),
      
      updateUserTraits: async (updates) => {
        const currentTraits = get().userTraits || {};
        const newTraits = { ...currentTraits, ...updates };
        
        try {
          const response = await fetch('/api/user-traits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTraits)
          });
          
          if (response.ok) {
            const savedTraits = await response.json();
            set({ userTraits: savedTraits });
            return savedTraits;
          }
        } catch (error) {
          console.error('Failed to update user traits:', error);
        }
        
        return newTraits;
      },
      
      logout: () => {
        set({ user: null, session: null, isAuthenticated: false, userTraits: null });
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('insight_today');
        localStorage.removeItem('user_cache');
      },
      
      // Session restoration with improved error handling
      restoreSession: async () => {
        let mounted = true;
        
        try {
          const storedSession = localStorage.getItem('supabase_session');
          if (!storedSession) return null;

          const session = JSON.parse(storedSession);
          
          // Validate session structure
          if (!session?.user?.id) {
            get().logout();
            return null;
          }

          // Check expiration
          const expiresAt = session.expires_at || session.user.expires_at;
          if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
            get().logout();
            return null;
          }
          
          // Validate session with backend
          const response = await fetch('/api/auth/validate-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session })
          });
          
          if (mounted && response.ok) {
            const { user, traits } = await response.json();
            set({ 
              session, 
              user, 
              userTraits: traits,
              isAuthenticated: true 
            });
            return { user, traits };
          } else {
            if (mounted) get().logout();
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          if (mounted) get().logout();
        }
        
        return () => { mounted = false };
      },
      
      // Behavioral tracking
      trackBehavior: async (event, data = {}) => {
        const user = get().user;
        if (!user) return;
        
        try {
          await fetch('/api/track-behavior', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              event,
              data,
              timestamp: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error('Behavior tracking failed:', error);
        }
      }
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        userTraits: state.userTraits
      })
    }
  )
);

// Custom hook for easy access
export const useUser = () => {
  const store = useUserStore();
  
  return {
    ...store,
    // Computed properties
    isLoggedIn: store.isAuthenticated && !!store.user,
    preferredPromptType: store.userTraits?.likes_affirmations ? 'affirmation' : 'reflection',
    peakHours: store.userTraits?.peak_hours || [],
    moodBaseline: store.userTraits?.mood_baseline || 50,
    writingStyle: store.userTraits?.writing_style || 'balanced'
  };
};

export default useUser;