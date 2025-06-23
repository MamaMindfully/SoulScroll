import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Battery, Wifi, Download, Share2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHasMounted } from "@/utils/useHasMounted";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function MobileOptimizations() {
  const hasMounted = useHasMounted();
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!hasMounted) return;
    // Check if app is already installed (running in standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);
    setIsInstalled(isStandaloneMode);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      toast({
        title: "Luma installed!",
        description: "You can now access Luma from your home screen.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: "Installing Luma...",
        description: "The app will be added to your home screen shortly.",
      });
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Luma - AI Journal',
          text: 'Check out this amazing journaling app that understands your emotions!',
          url: window.location.origin,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Link copied",
        description: "Share this link with friends to try Luma!",
      });
    }
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isChrome = /Chrome/.test(ua);
    
    return { isIOS, isAndroid, isSafari, isChrome };
  };

  const { isIOS, isAndroid, isSafari, isChrome } = getDeviceInfo();

  const getInstallInstructions = () => {
    if (isIOS && isSafari) {
      return "Tap the Share button and select 'Add to Home Screen'";
    } else if (isAndroid && isChrome) {
      return "Tap the menu (⋮) and select 'Add to Home screen'";
    } else {
      return "Look for 'Add to Home Screen' in your browser menu";
    }
  };

  if (isStandalone) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-5 text-center">
          <Home className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-medium text-wisdom mb-2">App Mode Active</h3>
          <p className="text-sm text-wisdom/70">
            You're using Luma as a native app experience!
          </p>
          <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-wisdom/60">
            <div className="flex items-center space-x-1">
              <Battery className="w-3 h-3" />
              <span>Optimized battery</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wifi className="w-3 h-3" />
              <span>Works offline</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium text-wisdom">Install Luma</h3>
              <p className="text-sm text-wisdom/70">
                Get the full app experience on your device
              </p>
            </div>
          </div>
        </div>

        {isInstallable && deferredPrompt ? (
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">Ready to Install!</h4>
              <p className="text-sm text-wisdom/70 mb-3">
                Install Luma as a native app for the best experience:
              </p>
              <ul className="text-xs text-wisdom/60 space-y-1 mb-4">
                <li>• Works offline with local storage</li>
                <li>• Push notifications for daily reminders</li>
                <li>• Faster loading and smoother animations</li>
                <li>• No browser UI distractions</li>
              </ul>
              <Button onClick={handleInstallClick} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gentle/50 rounded-lg p-4">
              <h4 className="font-medium text-wisdom mb-2">Manual Installation</h4>
              <p className="text-sm text-wisdom/70 mb-2">
                {getInstallInstructions()}
              </p>
              
              {isIOS && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                  <p className="text-xs text-blue-700">
                    <strong>iOS users:</strong> Make sure you're using Safari browser for the best installation experience.
                  </p>
                </div>
              )}
              
              {isAndroid && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                  <p className="text-xs text-green-700">
                    <strong>Android users:</strong> Chrome and Edge browsers support easy app installation.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gentle pt-4">
              <Button 
                variant="outline" 
                onClick={handleShare} 
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Luma
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gentle/30 rounded-lg">
          <h5 className="text-xs font-medium text-wisdom mb-2">App Benefits:</h5>
          <div className="grid grid-cols-2 gap-2 text-xs text-wisdom/70">
            <div>• Offline journaling</div>
            <div>• Push notifications</div>
            <div>• Native app feel</div>
            <div>• Better performance</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}