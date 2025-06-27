import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  HardDrive, 
  Cloud, 
  Eye, 
  EyeOff, 
  Sync, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { localJournalStorage } from '@/utils/localJournalStorage';

interface LocalOnlySettings {
  enabled: boolean;
  syncEnabled: boolean;
  encryptionEnabled: boolean;
  autoBackup: boolean;
}

const LocalOnlyToggle: React.FC = () => {
  const [settings, setSettings] = useState<LocalOnlySettings>({
    enabled: false,
    syncEnabled: true,
    encryptionEnabled: false,
    autoBackup: true
  });
  const [syncStats, setSyncStats] = useState({
    total: 0,
    local: 0,
    synced: 0,
    pending: 0,
    failed: 0
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    updateSyncStats();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('soulscroll-local-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load local settings:', error);
    }
  };

  const saveSettings = (newSettings: LocalOnlySettings) => {
    setSettings(newSettings);
    localStorage.setItem('soulscroll-local-settings', JSON.stringify(newSettings));
    
    // Show appropriate feedback
    if (newSettings.enabled && !settings.enabled) {
      toast({
        title: "Local Mode Enabled",
        description: "Your entries will be stored locally and not sent to our servers"
      });
    } else if (!newSettings.enabled && settings.enabled) {
      toast({
        title: "Cloud Mode Enabled", 
        description: "Your entries will be synced to our secure servers"
      });
    }
  };

  const updateSyncStats = () => {
    const stats = localJournalStorage.getSyncStats();
    setSyncStats(stats);
  };

  const handleManualSync = async () => {
    if (settings.enabled) {
      toast({
        title: "Sync Unavailable",
        description: "Manual sync is disabled in local-only mode",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    
    try {
      await localJournalStorage.attemptSync();
      updateSyncStats();
      
      toast({
        title: "Sync Completed",
        description: "Your local entries have been synced with the server"
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const exportLocalData = () => {
    try {
      const data = localJournalStorage.exportLocalData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `soulscroll-local-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Created",
        description: "Your local journal data has been exported"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to create backup file",
        variant: "destructive"
      });
    }
  };

  const clearLocalData = () => {
    if (confirm('Are you sure you want to clear all local journal data? This cannot be undone.')) {
      localJournalStorage.clearAllData();
      updateSyncStats();
      
      toast({
        title: "Local Data Cleared",
        description: "All local journal entries have been removed"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Local Storage
        </CardTitle>
        <CardDescription>
          Control how your journal entries are stored and synced
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Local-Only Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="local-only" className="text-base font-medium">
                Local-Only Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Store entries on your device only, never send to servers
              </p>
            </div>
            <Switch
              id="local-only"
              checked={settings.enabled}
              onCheckedChange={(enabled) => 
                saveSettings({ ...settings, enabled })
              }
            />
          </div>

          {settings.enabled && (
            <Alert>
              <HardDrive className="w-4 h-4" />
              <AlertDescription>
                <strong>Local Mode Active:</strong> Your entries are stored only on this device. 
                AI features, insights, and cross-device sync are disabled.
              </AlertDescription>
            </Alert>
          )}

          {!settings.enabled && (
            <Alert>
              <Cloud className="w-4 h-4" />
              <AlertDescription>
                <strong>Cloud Mode Active:</strong> Your entries are synced to our secure servers 
                with full AI features and cross-device access.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sync Settings */}
        {!settings.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sync-enabled" className="text-base font-medium">
                  Automatic Sync
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync entries when online
                </p>
              </div>
              <Switch
                id="sync-enabled"
                checked={settings.syncEnabled}
                onCheckedChange={(syncEnabled) => 
                  saveSettings({ ...settings, syncEnabled })
                }
              />
            </div>

            {/* Sync Statistics */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Sync Status</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Sync className="w-4 h-4 mr-2" />
                      Manual Sync
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="text-center">
                  <div className="text-lg font-bold">{syncStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{syncStats.synced}</div>
                  <div className="text-xs text-muted-foreground">Synced</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{syncStats.local}</div>
                  <div className="text-xs text-muted-foreground">Local</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{syncStats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{syncStats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Local Encryption */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="encryption-enabled" className="text-base font-medium">
                Local Encryption
              </Label>
              <p className="text-sm text-muted-foreground">
                Encrypt entries in local storage
              </p>
            </div>
            <Switch
              id="encryption-enabled"
              checked={settings.encryptionEnabled}
              onCheckedChange={(encryptionEnabled) => 
                saveSettings({ ...settings, encryptionEnabled })
              }
            />
          </div>

          {settings.encryptionEnabled && (
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Local encryption is enabled. Your entries are encrypted before 
                being stored in your browser's local storage.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Backup Controls */}
        <div className="space-y-4">
          <h4 className="font-medium">Data Management</h4>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={exportLocalData}
              className="flex-1"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Export Backup
            </Button>
            
            <Button 
              variant="outline" 
              onClick={updateSyncStats}
              className="flex-1"
            >
              <Info className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {syncStats.total > 0 && (
            <Button 
              variant="destructive" 
              onClick={clearLocalData}
              className="w-full"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Clear All Local Data
            </Button>
          )}
        </div>

        {/* Privacy Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Local Mode:</strong> Entries never leave your device, no AI features</p>
          <p><strong>Cloud Mode:</strong> Entries encrypted and stored securely on our servers</p>
          <p><strong>Local Encryption:</strong> Additional encryption layer for browser storage</p>
          <p><strong>Automatic Backup:</strong> Regular exports to prevent data loss</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalOnlyToggle;