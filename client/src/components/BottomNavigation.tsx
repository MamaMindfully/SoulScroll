import { Link, useLocation } from "wouter";
import { PenTool, Users, TrendingUp, Settings, Moon } from "lucide-react";

interface BottomNavigationProps {
  currentPage: "write" | "community" | "dreams" | "progress" | "settings";
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [location] = useLocation();

  const navItems = [
    {
      id: "write",
      path: "/",
      icon: PenTool,
      label: "Write",
    },
    {
      id: "community",
      path: "/community",
      icon: Users,
      label: "Community",
    },
    {
      id: "dreams",
      path: "/dreams",
      icon: Moon,
      label: "Dreams",
    },
    {
      id: "progress",
      path: "/progress",
      icon: TrendingUp,
      label: "Progress",
    },
    {
      id: "settings",
      path: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <nav className="bottom-nav bg-white border-t border-gentle">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Link key={item.id} href={item.path} className="flex-1">
              <button 
                className={`nav-item w-full flex flex-col items-center justify-center space-y-1 transition-all duration-200 touch-manipulation ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-wisdom/50 hover:text-wisdom/70 active:bg-gray-100'
                }`}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
