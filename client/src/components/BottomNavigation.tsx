import { Link, useLocation } from "wouter";
import { PenTool, Users, TrendingUp, Settings } from "lucide-react";

interface BottomNavigationProps {
  currentPage: "write" | "community" | "progress" | "settings";
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
    <nav className="bottom-nav bg-white border-t border-gentle px-6 py-4">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Link key={item.id} href={item.path}>
              <button 
                className={`flex flex-col items-center space-y-1 transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-wisdom/50 hover:text-wisdom/70'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
