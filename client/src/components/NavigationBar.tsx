import React from 'react';
import { Link, useLocation } from 'wouter';
import { useFeatureAccess } from '@/store/appStore';
import { Lock } from 'lucide-react';

const NavigationBar: React.FC = () => {
  const featureAccess = useFeatureAccess();
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Home', always: true },
    { path: '/community', label: 'Community', feature: 'community' as const },
    { path: '/dreams', label: 'Dream', feature: 'dream' as const },
    { path: '/progress', label: 'Progress', feature: 'progress' as const },
  ];

  return (
    <nav className="p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex gap-6 items-center max-w-4xl mx-auto">
        {navItems.map((item) => {
          const hasAccess = item.always || featureAccess[item.feature!];
          const isActive = location === item.path;
          
          if (hasAccess) {
            return (
              <Link key={item.path} href={item.path}>
                <span className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }
                `}>
                  {item.label}
                </span>
              </Link>
            );
          }
          
          return (
            <span 
              key={item.path}
              className="px-3 py-2 text-sm font-medium text-gray-400 opacity-50 cursor-not-allowed flex items-center gap-1"
            >
              {item.label}
              <Lock className="w-3 h-3" />
            </span>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationBar;