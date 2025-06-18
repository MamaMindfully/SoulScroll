import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Cloud, CloudOff, Eye, EyeOff } from "lucide-react";

interface PrivacyOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  defaultValue: boolean;
}

const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    isPrivate: true,
    allowCommunitySharing: false,
    enableCloudSync: false,
    shareEmotionalInsights: false
  });

  const privacyOptions: PrivacyOption[] = [
    {
      id: 'isPrivate',
      title: 'Keep entries fully private',
      description: 'All journal entries remain on your device only. No cloud storage or external access.',
      icon: Lock,
      defaultValue: true
    },
    {
      id: 'allowCommunitySharing',
      title: 'Allow anonymous community sharing',
      description: 'Share selected reflections anonymously in the community feed.',
      icon: Eye,
      defaultValue: false
    },
    {
      id: 'enableCloudSync',
      title: 'Enable cloud synchronization',
      description: 'Securely sync your entries across devices with end-to-end encryption.',
      icon: Cloud,
      defaultValue: false
    },
    {
      id: 'shareEmotionalInsights',
      title: 'Share emotional insights',
      description: 'Contribute anonymized mood data to help improve the AI for everyone.',
      icon: Shield,
      defaultValue: false
    }
  ];

  useEffect(() => {
    // Load privacy settings from localStorage
    const loadedSettings = { ...settings };
    privacyOptions.forEach(option => {
      const stored = localStorage.getItem(`soulscroll-privacy-${option.id}`);
      if (stored !== null) {
        loadedSettings[option.id as keyof typeof settings] = stored === 'true';
      }
    });
    setSettings(loadedSettings);
  }, []);

  const toggleSetting = (settingId: string) => {
    const newSettings = {
      ...settings,
      [settingId]: !settings[settingId as keyof typeof settings]
    };
    
    setSettings(newSettings);
    localStorage.setItem(`soulscroll-privacy-${settingId}`, String(newSettings[settingId as keyof typeof settings]));
    
    // Special handling for private mode
    if (settingId === 'isPrivate' && newSettings.isPrivate) {
      // When switching to private mode, disable other sharing options
      const privateSettings = {
        ...newSettings,
        allowCommunitySharing: false,
        enableCloudSync: false,
        shareEmotionalInsights: false
      };
      setSettings(privateSettings);
      localStorage.setItem('soulscroll-privacy-allowCommunitySharing', 'false');
      localStorage.setItem('soulscroll-privacy-enableCloudSync', 'false');
      localStorage.setItem('soulscroll-privacy-shareEmotionalInsights', 'false');
    }
  };

  const getPrivacyLevel = () => {
    if (settings.isPrivate) return { level: 'Maximum', color: 'bg-green-100 text-green-800' };
    if (!settings.enableCloudSync && !settings.shareEmotionalInsights) return { level: 'High', color: 'bg-blue-100 text-blue-800' };
    if (!settings.shareEmotionalInsights) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Standard', color: 'bg-gray-100 text-gray-800' };
  };

  const privacyLevel = getPrivacyLevel();

  return (
    <div className="space-y-6">
      {/* Privacy Level Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Privacy Level</span>
            </div>
            <Badge className={privacyLevel.color}>
              {privacyLevel.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-wisdom/70 mb-4">
            Your journal is designed with privacy first. All entries are stored locally by default, 
            and you have full control over what data you choose to share.
          </p>
          {settings.isPrivate && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                Maximum privacy mode active - all data stays on your device
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Privacy Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {privacyOptions.map((option) => {
            const IconComponent = option.icon;
            const isEnabled = settings[option.id as keyof typeof settings];
            const isDisabled = settings.isPrivate && option.id !== 'isPrivate';
            
            return (
              <div key={option.id} className={`flex items-start space-x-4 ${isDisabled ? 'opacity-50' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className={`w-5 h-5 ${isEnabled ? 'text-primary' : 'text-wisdom/40'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-wisdom">
                        {option.title}
                      </h4>
                      <p className="text-xs text-wisdom/60 mt-1">
                        {option.description}
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleSetting(option.id)}
                      disabled={isDisabled}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Data Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Your Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-wisdom/70">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Local Storage:</strong> Your journal entries, moods, and preferences are stored securely on your device.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Encryption:</strong> All sensitive data is encrypted before storage to protect your privacy.
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>No Tracking:</strong> We don't track your behavior or collect personal data without explicit consent.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacySettings;