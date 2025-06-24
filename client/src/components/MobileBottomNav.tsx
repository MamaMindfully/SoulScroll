import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, PenTool, Lightbulb, User, Archive } from 'lucide-react';
import { useKeyboardHandler } from '../utils/keyboardHandler';
import { cn } from '../lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    ariaLabel: 'Navigate to home page'
  },
  {
    id: 'journal',
    label: 'Journal',
    href: '/journal',
    icon: PenTool,
    ariaLabel: 'Start journaling'
  },
  {
    id: 'insights',
    label: 'Insights',
    href: '/insights',
    icon: Lightbulb,
    ariaLabel: 'View AI insights'
  },
  {
    id: 'archive',
    label: 'Archive',
    href: '/archive',
    icon: Archive,
    ariaLabel: 'View archived entries'
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: User,
    ariaLabel: 'View profile settings'
  }
];

export const MobileBottomNav: React.FC = () => {
  const [location] = useLocation();
  const { isKeyboardVisible } = useKeyboardHandler();

  // Don't render if keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  return (
    <nav 
      className={cn(
        "bottom-nav mobile-nav",
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-sm border-t border-border",
        "flex items-center justify-around",
        "px-2 py-1",
        // Safe area handling
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = location === item.href || 
                        (item.href !== '/' && location.startsWith(item.href));
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "mobile-nav-item touch-target",
              "flex flex-col items-center justify-center",
              "min-w-[48px] min-h-[48px] p-2 rounded-lg",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "active:scale-95",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            <IconComponent 
              className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-current"
              )} 
              aria-hidden="true"
            />
            <span 
              className={cn(
                "text-xs font-medium mt-1 transition-colors",
                "leading-none text-center",
                isActive ? "text-primary" : "text-current"
              )}
            >
              {item.label}
            </span>
            {/* Screen reader only active state indicator */}
            {isActive && (
              <span className="sr-only">Current page</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;