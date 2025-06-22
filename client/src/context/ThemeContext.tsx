import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeType = 'calm' | 'galaxy' | 'forest' | 'sunset' | 'ocean';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  availableThemes: { id: ThemeType; name: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const availableThemes = [
  {
    id: 'calm' as ThemeType,
    name: 'Calm',
    description: 'Peaceful blues and gentle whites'
  },
  {
    id: 'galaxy' as ThemeType,
    name: 'Galaxy',
    description: 'Deep cosmic purples and starlight'
  },
  {
    id: 'forest' as ThemeType,
    name: 'Forest',
    description: 'Natural greens and earth tones'
  },
  {
    id: 'sunset' as ThemeType,
    name: 'Sunset',
    description: 'Warm oranges and golden hues'
  },
  {
    id: 'ocean' as ThemeType,
    name: 'Ocean',
    description: 'Deep blues and aqua waves'
  }
];

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('calm');
  
  useEffect(() => {
    const saved = localStorage.getItem('soulscroll-theme');
    if (saved) {
      setTheme(saved as ThemeType);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document body
    document.body.className = `theme-${theme}`;
    
    // Save to localStorage
    localStorage.setItem('soulscroll-theme', theme);
    
    // Update CSS custom properties for dynamic theming
    const root = document.documentElement;
    
    switch (theme) {
      case 'calm':
        root.style.setProperty('--theme-primary', '#3b82f6');
        root.style.setProperty('--theme-secondary', '#e0f2fe');
        root.style.setProperty('--theme-background', '#f0f9ff');
        root.style.setProperty('--theme-text', '#1e293b');
        root.style.setProperty('--theme-accent', '#0ea5e9');
        break;
      case 'galaxy':
        root.style.setProperty('--theme-primary', '#8b5cf6');
        root.style.setProperty('--theme-secondary', '#1e1b4b');
        root.style.setProperty('--theme-background', 'radial-gradient(circle, #0d0d2b, #1a1a40)');
        root.style.setProperty('--theme-text', '#f9fafb');
        root.style.setProperty('--theme-accent', '#a855f7');
        break;
      case 'forest':
        root.style.setProperty('--theme-primary', '#10b981');
        root.style.setProperty('--theme-secondary', '#d1fae5');
        root.style.setProperty('--theme-background', '#f0fdf4');
        root.style.setProperty('--theme-text', '#1f2937');
        root.style.setProperty('--theme-accent', '#059669');
        break;
      case 'sunset':
        root.style.setProperty('--theme-primary', '#f59e0b');
        root.style.setProperty('--theme-secondary', '#fef3c7');
        root.style.setProperty('--theme-background', '#fffbeb');
        root.style.setProperty('--theme-text', '#1f2937');
        root.style.setProperty('--theme-accent', '#d97706');
        break;
      case 'ocean':
        root.style.setProperty('--theme-primary', '#0891b2');
        root.style.setProperty('--theme-secondary', '#cffafe');
        root.style.setProperty('--theme-background', '#f0fdfa');
        root.style.setProperty('--theme-text', '#1e293b');
        root.style.setProperty('--theme-accent', '#0e7490');
        break;
    }
  }, [theme]);

  const contextValue = {
    theme,
    setTheme,
    availableThemes
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};