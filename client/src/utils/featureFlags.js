// Feature flags system for safe deployments and A/B testing

class FeatureFlagManager {
  constructor() {
    this.flags = new Map()
    this.remoteFlags = new Map()
    this.initialized = false
    this.updateInterval = null
    
    // Default feature flags
    this.defaultFlags = {
      // Core features
      'voice-journaling': true,
      'ai-insights': true,
      'premium-features': true,
      'offline-mode': true,
      
      // Experimental features
      'advanced-analytics': false,
      'community-features': false,
      'dream-analysis': false,
      'social-sharing': false,
      
      // UI experiments
      'new-onboarding': false,
      'enhanced-editor': false,
      'dark-mode-v2': false,
      'mobile-gestures': true,
      
      // Performance features
      'lazy-loading': true,
      'service-worker': true,
      'background-sync': true,
      'push-notifications': false
    }
    
    this.init()
  }

  async init() {
    try {
      // Load local flags first
      this.loadLocalFlags()
      
      // Fetch remote flags
      await this.fetchRemoteFlags()
      
      // Start periodic updates
      this.startPeriodicUpdates()
      
      this.initialized = true
    } catch (error) {
      console.warn('Feature flags initialization failed:', error)
      this.useDefaultFlags()
    }
  }

  loadLocalFlags() {
    try {
      const stored = localStorage.getItem('featureFlags')
      if (stored) {
        const parsedFlags = JSON.parse(stored)
        Object.entries(parsedFlags).forEach(([key, value]) => {
          this.flags.set(key, value)
        })
      }
    } catch (error) {
      console.warn('Failed to load local feature flags:', error)
    }
    
    // Merge with defaults
    Object.entries(this.defaultFlags).forEach(([key, value]) => {
      if (!this.flags.has(key)) {
        this.flags.set(key, value)
      }
    })
  }

  async fetchRemoteFlags() {
    try {
      const response = await fetch('/api/feature-flags', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const remoteFlags = await response.json()
        
        // Update remote flags
        Object.entries(remoteFlags).forEach(([key, value]) => {
          this.remoteFlags.set(key, value)
          this.flags.set(key, value)
        })
        
        // Save to localStorage
        this.saveLocalFlags()
      }
    } catch (error) {
      console.warn('Failed to fetch remote feature flags:', error)
    }
  }

  saveLocalFlags() {
    try {
      const flagsObject = Object.fromEntries(this.flags)
      localStorage.setItem('featureFlags', JSON.stringify(flagsObject))
    } catch (error) {
      console.warn('Failed to save feature flags:', error)
    }
  }

  startPeriodicUpdates() {
    // Update flags every 5 minutes
    this.updateInterval = setInterval(() => {
      this.fetchRemoteFlags()
    }, 5 * 60 * 1000)
  }

  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  useDefaultFlags() {
    Object.entries(this.defaultFlags).forEach(([key, value]) => {
      this.flags.set(key, value)
    })
  }

  // Public API
  isEnabled(flagName) {
    if (!this.initialized) {
      return this.defaultFlags[flagName] || false
    }
    return this.flags.get(flagName) || false
  }

  enable(flagName) {
    this.flags.set(flagName, true)
    this.saveLocalFlags()
  }

  disable(flagName) {
    this.flags.set(flagName, false)
    this.saveLocalFlags()
  }

  toggle(flagName) {
    const current = this.isEnabled(flagName)
    this.flags.set(flagName, !current)
    this.saveLocalFlags()
    return !current
  }

  getAllFlags() {
    return Object.fromEntries(this.flags)
  }

  // A/B testing helpers
  getVariant(experimentName, variants = ['A', 'B']) {
    const flagName = `experiment-${experimentName}`
    const storedVariant = localStorage.getItem(`variant-${experimentName}`)
    
    if (storedVariant && variants.includes(storedVariant)) {
      return storedVariant
    }
    
    // Generate stable variant based on user ID or session
    const userId = localStorage.getItem('userId') || 'anonymous'
    const hash = this.simpleHash(userId + experimentName)
    const variant = variants[hash % variants.length]
    
    localStorage.setItem(`variant-${experimentName}`, variant)
    return variant
  }

  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  // Gradual rollout
  isInRollout(flagName, percentage = 50) {
    if (!this.isEnabled(flagName)) return false
    
    const userId = localStorage.getItem('userId') || 'anonymous'
    const hash = this.simpleHash(userId + flagName)
    return (hash % 100) < percentage
  }

  destroy() {
    this.stopPeriodicUpdates()
    this.flags.clear()
    this.remoteFlags.clear()
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager()

// React hook for feature flags
export const useFeatureFlag = (flagName) => {
  const [enabled, setEnabled] = React.useState(() => featureFlags.isEnabled(flagName))
  
  React.useEffect(() => {
    const checkFlag = () => setEnabled(featureFlags.isEnabled(flagName))
    
    // Check immediately
    checkFlag()
    
    // Listen for changes (custom event)
    window.addEventListener('featureFlagsUpdated', checkFlag)
    
    return () => {
      window.removeEventListener('featureFlagsUpdated', checkFlag)
    }
  }, [flagName])
  
  return enabled
}

// React component for conditional rendering
export const FeatureFlag = ({ flag, children, fallback = null }) => {
  const enabled = useFeatureFlag(flag)
  return enabled ? children : fallback
}

// Debugging utilities
window.featureFlags = featureFlags