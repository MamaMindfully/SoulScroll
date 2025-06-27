import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Download, 
  Trash2, 
  AlertTriangle,
  Database,
  Cloud,
  Server,
  Globe,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  clearJournalHistory, 
  exportJournalData,
  getJournalStats 
} from '../utils/journalHistoryUtils';

interface PrivacySettings {
  dataStorage: 'local' | 'cloud' | 'both';
  aiProcessing: boolean;
  anonymousSharing: boolean;
  analyticsTracking: boolean;
  communityFeatures: boolean;
  autoBackup: boolean;
  encryptionEnabled: boolean;
  shareEmotionalInsights: boolean;
}

const SettingsPrivacy: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataStorage: 'local',
    aiProcessing: true,
    anonymousSharing: false,
    analyticsTracking: true,
    communityFeatures: true,
    autoBackup: false,
    encryptionEnabled: true,
    shareEmotionalInsights: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stats, setStats] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('soulscroll-privacy-settings');
      if (stored) {
        setSettings({ ...settings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const loadStats = () => {
    try {
      const journalStats = getJournalStats();
      setStats(journalStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveSettings = (newSettings: PrivacySettings) => {
    try {
      localStorage.setItem('soulscroll-privacy-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings.",
        variant: "destructive",
      });
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    
    // Handle cascading privacy settings
    if (key === 'dataStorage' && value === 'local') {
      newSettings.autoBackup = false;
      newSettings.shareEmotionalInsights = false;
    }
    
    if (key === 'aiProcessing' && !value) {
      newSettings.shareEmotionalInsights = false;
    }
    
    if (key === 'communityFeatures' && !value) {
      newSettings.anonymousSharing = false;
      newSettings.shareEmotionalInsights = false;
    }
    
    saveSettings(newSettings);
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    setIsLoading(true);
    try {
      const exportData = exportJournalData(format);
      
      if (exportData) {
        const blob = new Blob([exportData], { 
          type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soulscroll-journal-export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Complete",
          description: `Your journal data has been exported as ${format.toUpperCase()}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export your journal data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllData = () => {
    if (clearJournalHistory()) {
      // Also clear other data
      localStorage.removeItem('soulscroll-dreams');
      localStorage.removeItem('soulscroll-mantras');
      localStorage.removeItem('soulscroll-achievements');
      localStorage.removeItem('soulscroll-privacy-settings');
      
      setShowDeleteConfirm(false);
      loadStats(); // Refresh stats
      
      toast({
        title: "Data Deleted",
        description: "All your journal data has been permanently deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete journal data.",
        variant: "destructive",
      });
    }
  };

  const getPrivacyLevel = () => {
    const privateSettings = [
      !settings.aiProcessing,
      !settings.anonymousSharing,
      !settings.analyticsTracking,
      !settings.shareEmotionalInsights,
      settings.dataStorage === 'local',
      settings.encryptionEnabled
    ];
    
    const privacyScore = privateSettings.filter(Boolean).length;
    
    if (privacyScore >= 5) return { level: 'Maximum', color: 'bg-green-100 text-green-800', icon: Lock };
    if (privacyScore >= 3) return { level: 'High', color: 'bg-blue-100 text-blue-800', icon: Shield };
    if (privacyScore >= 2) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: Eye };
    return { level: 'Basic', color: 'bg-red-100 text-red-800', icon: Unlock };
  };

  const privacyLevel = getPrivacyLevel();
  const PrivacyIcon = privacyLevel.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-wisdom">Privacy & Data</h1>
          <p className="text-wisdom/70">Control how your journal data is stored and used</p>
        </div>
      </div>

      {/* Privacy Level Overview */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-wisdom" />
              <span>Privacy Level</span>
            </div>
            <Badge className={privacyLevel.color}>
              <PrivacyIcon className="w-3 h-3 mr-1" />
              {privacyLevel.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-wisdom/70 mb-4">
            Your current privacy configuration provides {privacyLevel.level.toLowerCase()} protection for your journal data.
          </p>
          
          {stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{stats.totalEntries}</div>
                <div className="text-xs text-blue-600">Entries Stored</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">{stats.totalWords}</div>
                <div className="text-xs text-purple-600">Words Written</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {settings.dataStorage === 'local' ? 'Local' : 'Cloud'}
                </div>
                <div className="text-xs text-green-600">Storage Mode</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Storage Settings */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-wisdom" />
            <span>Data Storage</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                settings.dataStorage === 'local' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleSettingChange('dataStorage', 'local')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  settings.dataStorage === 'local' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`} />
                <Server className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-wisdom">Local Storage Only</div>
                  <div className="text-sm text-wisdom/70">
                    Data stays on your device. Most private but no cross-device sync.
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Most Private
                </Badge>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                settings.dataStorage === 'cloud' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleSettingChange('dataStorage', 'cloud')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  settings.dataStorage === 'cloud' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`} />
                <Cloud className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-wisdom">Secure Cloud Storage</div>
                  <div className="text-sm text-wisdom/70">
                    Encrypted cloud storage with cross-device sync and backup.
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  Recommended
                </Badge>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                settings.dataStorage === 'both' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleSettingChange('dataStorage', 'both')}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  settings.dataStorage === 'both' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`} />
                <Globe className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-wisdom">Hybrid Storage</div>
                  <div className="text-sm text-wisdom/70">
                    Local + cloud storage for maximum accessibility and backup.
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  Full Features
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI and Processing Settings */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-wisdom" />
            <span>AI & Processing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">AI Response Generation</div>
              <div className="text-sm text-wisdom/70">
                Allow AI to analyze your entries and provide insights
              </div>
            </div>
            <Switch
              checked={settings.aiProcessing}
              onCheckedChange={(checked) => handleSettingChange('aiProcessing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">Share Emotional Insights</div>
              <div className="text-sm text-wisdom/70">
                Contribute anonymous emotional patterns to improve AI responses
              </div>
            </div>
            <Switch
              checked={settings.shareEmotionalInsights}
              onCheckedChange={(checked) => handleSettingChange('shareEmotionalInsights', checked)}
              disabled={!settings.aiProcessing || !settings.communityFeatures}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">Analytics Tracking</div>
              <div className="text-sm text-wisdom/70">
                Help improve the app with anonymous usage analytics
              </div>
            </div>
            <Switch
              checked={settings.analyticsTracking}
              onCheckedChange={(checked) => handleSettingChange('analyticsTracking', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Community Settings */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-wisdom" />
            <span>Community Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">Community Features</div>
              <div className="text-sm text-wisdom/70">
                Enable community mood sharing and support features
              </div>
            </div>
            <Switch
              checked={settings.communityFeatures}
              onCheckedChange={(checked) => handleSettingChange('communityFeatures', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">Anonymous Mood Sharing</div>
              <div className="text-sm text-wisdom/70">
                Share your mood anonymously with the community
              </div>
            </div>
            <Switch
              checked={settings.anonymousSharing}
              onCheckedChange={(checked) => handleSettingChange('anonymousSharing', checked)}
              disabled={!settings.communityFeatures}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-wisdom" />
            <span>Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">Data Encryption</div>
              <div className="text-sm text-wisdom/70">
                Encrypt your journal entries for additional security
              </div>
            </div>
            <Switch
              checked={settings.encryptionEnabled}
              onCheckedChange={(checked) => handleSettingChange('encryptionEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-wisdom">Auto Backup</div>
              <div className="text-sm text-wisdom/70">
                Automatically backup your data to secure cloud storage
              </div>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
              disabled={settings.dataStorage === 'local'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-wisdom" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-wisdom">Export Your Data</h4>
            <p className="text-sm text-wisdom/70 mb-4">
              Download a complete copy of your journal data in your preferred format
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleExportData('json')}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportData('csv')}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-red-600">Danger Zone</h4>
            <p className="text-sm text-wisdom/70 mb-4">
              Permanently delete all your journal data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </Button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Confirm Deletion</span>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  This will permanently delete all your journal entries, dreams, mantras, and achievements. 
                  This action cannot be undone.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAllData}
                  >
                    Yes, Delete Everything
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPrivacy;