import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { isPremiumUser, activatePremium, getPremiumFeatures } from '../utils/SubscriptionEngine';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Download, 
  Crown, 
  LogOut,
  Moon,
  Volume2,
  Smartphone,
  Target
} from "lucide-react";
import PushNotificationManager from "@/components/PushNotificationManager";
import LocalModeToggle from "@/components/LocalModeToggle";
import MobileOptimizations from "@/components/MobileOptimizations";
import GameModeFeatures from "@/components/GameModeFeatures";
import DeploymentOptimizations from "@/components/DeploymentOptimizations";

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handlePremiumUpgrade = () => {
    toast({
      title: "Premium Features",
      description: "Premium subscription coming soon! Stay tuned for unlimited journaling and exclusive features.",
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="app-container bg-white flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full emotion-gradient"></div>
          <p className="text-wisdom">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-white">
      {/* Status Bar */}
      <div className="status-bar px-4 py-2 text-white text-sm flex justify-between items-center">
        <span className="font-medium">9:41 AM</span>
        <div className="flex items-center space-x-1 text-xs">
          <span>••••</span>
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* App Header */}
      <AppHeader isOnline={navigator.onLine} />

      {/* Main Content */}
      <main className="main-content">
        <section className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-wisdom flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2 text-primary" />
                Settings
              </h2>
              <p className="text-sm text-wisdom/70 mt-1">
                Customize your Luma experience
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full luma-gradient flex items-center justify-center">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-wisdom">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || "Welcome"
                      }
                    </h3>
                    <p className="text-sm text-wisdom/70">{user?.email}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Mobile Optimizations */}
            <MobileOptimizations />
            
            {/* Push Notifications */}
            <PushNotificationManager />
            
            {/* Local Mode Toggle */}
            <LocalModeToggle />
            
            {/* Game Features */}
            <GameModeFeatures />
            
            {/* Deployment Status */}
            <DeploymentOptimizations />

            {/* Premium Section */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Crown className="w-5 h-5 text-accent" />
                    <span className="font-medium text-wisdom">Premium Features</span>
                  </div>
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium">
                    {user?.isPremium ? "Active" : "Free"}
                  </span>
                </div>
                <p className="text-sm text-wisdom/70 mb-4">
                  Unlock unlimited journaling, voice entries, and monthly reflection letters
                </p>
                {!user?.isPremium && (
                  <Button onClick={handlePremiumUpgrade} className="w-full bg-accent hover:bg-accent/90">
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-5">
                <h3 className="font-medium text-wisdom mb-4 flex items-center">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Preferences
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-4 h-4 text-wisdom/60" />
                      <div>
                        <div className="text-sm font-medium text-wisdom">Push Notifications</div>
                        <div className="text-xs text-wisdom/70">Daily writing reminders</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Moon className="w-4 h-4 text-wisdom/60" />
                      <div>
                        <div className="text-sm font-medium text-wisdom">Dark Mode</div>
                        <div className="text-xs text-wisdom/70">Easy on the eyes</div>
                      </div>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-4 h-4 text-wisdom/60" />
                      <div>
                        <div className="text-sm font-medium text-wisdom">Sound Effects</div>
                        <div className="text-xs text-wisdom/70">Gentle audio feedback</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-wisdom/60" />
                      <div>
                        <div className="text-sm font-medium text-wisdom">Offline Mode</div>
                        <div className="text-xs text-wisdom/70">Save entries locally</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-5">
                <h3 className="font-medium text-wisdom mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Data & Privacy
                </h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-gentle/50 rounded-lg text-left">
                    <div className="flex items-center space-x-3">
                      <Download className="w-4 h-4 text-wisdom/60" />
                      <span className="text-sm text-wisdom">Export Your Data</span>
                    </div>
                    <span className="text-xs text-wisdom/50">→</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-3 bg-gentle/50 rounded-lg text-left">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-wisdom/60" />
                      <span className="text-sm text-wisdom">Privacy Policy</span>
                    </div>
                    <span className="text-xs text-wisdom/50">→</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-3 bg-gentle/50 rounded-lg text-left">
                    <div className="flex items-center space-x-3">
                      <SettingsIcon className="w-4 h-4 text-wisdom/60" />
                      <span className="text-sm text-wisdom">Terms of Service</span>
                    </div>
                    <span className="text-xs text-wisdom/50">→</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-5">
                <h3 className="font-medium text-wisdom mb-4">Support & Feedback</h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-gentle/50 rounded-lg text-left">
                    <span className="text-sm text-wisdom">Help Center</span>
                    <span className="text-xs text-wisdom/50">→</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-3 bg-gentle/50 rounded-lg text-left">
                    <span className="text-sm text-wisdom">Send Feedback</span>
                    <span className="text-xs text-wisdom/50">→</span>
                  </button>

                  <button className="w-full flex items-center justify-between p-3 bg-gentle/50 rounded-lg text-left">
                    <span className="text-sm text-wisdom">Rate Luma</span>
                    <span className="text-xs text-wisdom/50">→</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <CardContent className="p-5">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* App Info */}
            <div className="text-center py-4">
              <p className="text-xs text-wisdom/50">Luma v1.0.0</p>
              <p className="text-xs text-wisdom/50 mt-1">Made with ❤️ for mindful reflection</p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="settings" />
    </div>
  );
}
