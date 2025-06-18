import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Bell, CloudOff, Wifi, User } from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  isOnline?: boolean;
}

interface UserStats {
  currentStreak: number;
}

export default function AppHeader({ isOnline = true }: AppHeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    // Auto-hide after 3 seconds
    if (!showNotifications) {
      setTimeout(() => setShowNotifications(false), 3000);
    }
  };

  return (
    <>
      <header className="luma-gradient px-6 py-4 text-white relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Luma</h1>
            <p className="text-white/80 text-sm">Your mindful companion</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Offline Mode Indicator */}
            <div className="relative">
              {isOnline ? (
                <Wifi className="w-5 h-5 opacity-60" />
              ) : (
                <CloudOff className="w-5 h-5 opacity-60" />
              )}
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${
                isOnline ? 'bg-green-400' : 'bg-orange-400'
              }`}></span>
            </div>
            
            {/* Push Notification Bell */}
            <button 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
            </button>
            
            {/* Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
        
        {/* Streak Counter */}
        <div className="mt-4 flex items-center justify-between bg-white/10 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <span className="text-orange-300">🔥</span>
            <span className="text-sm font-medium">
              {stats?.currentStreak || 0} day streak
            </span>
          </div>
          <span className="text-xs opacity-75">Keep going! 🌟</span>
        </div>
      </header>

      {/* Notification Preview */}
      {showNotifications && (
        <div className="absolute top-16 left-4 right-4 bg-white rounded-lg shadow-2xl p-4 border-l-4 border-primary z-30 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">💜</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-wisdom text-sm">Gentle Reminder</h4>
              <p className="text-wisdom/70 text-xs leading-relaxed">
                You wrote about growth yesterday. Want to continue that thread today?
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <button className="px-3 py-1 bg-primary text-white text-xs rounded-full">
                  Open Luma
                </button>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="px-3 py-1 bg-gentle text-wisdom/70 text-xs rounded-full"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
