// Service worker version checking utility
export class VersionChecker {
  constructor() {
    this.currentVersion = null;
    this.checkInterval = null;
    this.listeners = [];
  }

  // Start periodic version checking
  startChecking(intervalMs = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      if (!document.hidden) {
        await this.checkForUpdates();
      }
    }, intervalMs);

    // Initial check
    this.checkForUpdates();
  }

  // Stop version checking
  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for service worker updates
  async checkForUpdates() {
    try {
      // Check server version
      const response = await fetch('/api/sw-version', {
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.log('Version check failed:', response.status);
        return false;
      }

      const { version, timestamp } = await response.json();
      
      // Get current service worker version
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' }, 
          [channel.port2]
        );
        
        return new Promise((resolve) => {
          channel.port1.onmessage = (e) => {
            const currentVersion = e.data.version;
            
            if (currentVersion && currentVersion !== version) {
              console.log('Version mismatch detected:', {
                current: currentVersion,
                server: version
              });
              
              this.notifyListeners('update-available', {
                currentVersion,
                newVersion: version,
                timestamp
              });
              
              resolve(true);
            } else {
              resolve(false);
            }
          };
          
          // Timeout fallback
          setTimeout(() => resolve(false), 5000);
        });
      }
      
      return false;
    } catch (error) {
      console.log('Version check error:', error);
      return false;
    }
  }

  // Add update listener
  onUpdate(callback) {
    this.listeners.push(callback);
  }

  // Remove update listener
  offUpdate(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  // Notify all listeners
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Version checker listener error:', error);
      }
    });
  }

  // Force service worker update
  async forceUpdate() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return true;
        }
      } catch (error) {
        console.error('Force update failed:', error);
      }
    }
    return false;
  }
}

export const versionChecker = new VersionChecker();