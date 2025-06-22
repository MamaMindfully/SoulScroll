import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocalModeToggleProps {
  onModeChange?: (isLocal: boolean) => void;
}

export default function LocalModeToggle({ onModeChange }: LocalModeToggleProps) {
  const [isLocalMode, setIsLocalMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if local mode was previously enabled
    const savedMode = localStorage.getItem('luma_local_mode');
    setIsLocalMode(savedMode === 'true');
  }, []);

  const handleToggle = (enabled: boolean) => {
    setIsLocalMode(enabled);
    localStorage.setItem('luma_local_mode', enabled.toString());
    
    if (enabled) {
      toast({
        title: "Local Mode Enabled",
        description: "Your entries will be stored locally on your device. No data will be sent to servers.",
      });
    } else {
      toast({
        title: "Cloud Mode Enabled", 
        description: "Your entries will sync across devices and include AI features.",
      });
    }
    
    onModeChange?.(enabled);
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {isLocalMode ? (
              <Shield className="w-5 h-5 text-green-600" />
            ) : (
              <Wifi className="w-5 h-5 text-primary" />
            )}
            <div>
              <h3 className="font-medium text-wisdom">
                {isLocalMode ? "Local Mode" : "Cloud Mode"}
              </h3>
              <p className="text-sm text-wisdom/70">
                {isLocalMode 
                  ? "Private, offline-only journaling"
                  : "AI-powered with cloud sync"
                }
              </p>
            </div>
          </div>
          <Switch
            checked={isLocalMode}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="bg-gentle/50 rounded-lg p-3">
          <div className="flex items-start space-x-2 mb-3">
            <Database className="w-4 h-4 text-wisdom/60 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-wisdom mb-1">
                {isLocalMode ? "Local Storage" : "Cloud Storage"}
              </h4>
              <p className="text-xs text-wisdom/70 leading-relaxed">
                {isLocalMode 
                  ? "Your entries are stored securely on your device only. No internet required, but no AI features or cross-device sync."
                  : "Entries sync across devices with AI emotional analysis, compassionate responses, and insights."
                }
              </p>
            </div>
          </div>

          {isLocalMode && (
            <div className="bg-green-50 border border-green-200 rounded p-2 mt-3">
              <div className="flex items-center space-x-2">
                <WifiOff className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  Complete privacy - no data leaves your device
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}