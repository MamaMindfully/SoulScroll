// Session recovery system for preserving user state during app closures

class SessionRecoveryManager {
  constructor() {
    this.storageKey = 'soulscroll-session'
    this.autoSaveInterval = null
    this.observers = new Set()
    this.state = {
      journalContent: '',
      currentPage: '/',
      formData: {},
      scrollPositions: {},
      timestamp: null,
      version: '1.0'
    }
    
    this.init()
  }

  init() {
    try {
      // Load existing session
      this.loadSession()
      
      // Set up auto-save
      this.startAutoSave()
      
      // Listen for app events
      this.setupEventListeners()
      
      // Clean up old sessions
      this.cleanupOldSessions()
      
    } catch (error) {
      console.warn('Session recovery initialization failed:', error)
    }
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const session = JSON.parse(stored)
        
        // Check session age (expire after 24 hours)
        const age = Date.now() - (session.timestamp || 0)
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        if (age < maxAge && session.version === this.state.version) {
          this.state = { ...this.state, ...session }
          this.notifyObservers('sessionLoaded', this.state)
          return true
        } else {
          // Clear expired session
          this.clearSession()
        }
      }
    } catch (error) {
      console.warn('Failed to load session:', error)
      this.clearSession()
    }
    return false
  }

  saveSession() {
    try {
      const sessionData = {
        ...this.state,
        timestamp: Date.now()
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(sessionData))
      this.notifyObservers('sessionSaved', sessionData)
    } catch (error) {
      console.warn('Failed to save session:', error)
    }
  }

  startAutoSave() {
    // Save every 10 seconds
    this.autoSaveInterval = setInterval(() => {
      if (this.hasChanges()) {
        this.saveSession()
      }
    }, 10000)
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  setupEventListeners() {
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveSession()
    })
    
    // Save on visibility change (app backgrounded)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveSession()
      }
    })
    
    // Save on page navigation
    window.addEventListener('popstate', () => {
      this.updateCurrentPage(window.location.pathname)
    })
    
    // Save scroll positions
    this.setupScrollTracking()
  }

  setupScrollTracking() {
    let scrollTimeout
    
    const saveScrollPosition = () => {
      const path = window.location.pathname
      this.state.scrollPositions[path] = {
        x: window.scrollX,
        y: window.scrollY,
        timestamp: Date.now()
      }
    }
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(saveScrollPosition, 100)
    }, { passive: true })
  }

  // Public API
  updateJournalContent(content) {
    if (this.state.journalContent !== content) {
      this.state.journalContent = content
      this.notifyObservers('journalContentChanged', content)
    }
  }

  updateCurrentPage(path) {
    if (this.state.currentPage !== path) {
      this.state.currentPage = path
      this.notifyObservers('pageChanged', path)
    }
  }

  updateFormData(formId, data) {
    this.state.formData[formId] = {
      ...this.state.formData[formId],
      ...data,
      timestamp: Date.now()
    }
    this.notifyObservers('formDataChanged', { formId, data })
  }

  getJournalContent() {
    return this.state.journalContent
  }

  getCurrentPage() {
    return this.state.currentPage
  }

  getFormData(formId) {
    return this.state.formData[formId] || {}
  }

  getScrollPosition(path = window.location.pathname) {
    return this.state.scrollPositions[path] || { x: 0, y: 0 }
  }

  restoreScrollPosition(path = window.location.pathname) {
    const position = this.getScrollPosition(path)
    if (position.x || position.y) {
      window.scrollTo(position.x, position.y)
    }
  }

  hasChanges() {
    return (
      this.state.journalContent.length > 0 ||
      Object.keys(this.state.formData).length > 0 ||
      this.state.currentPage !== '/'
    )
  }

  clearSession() {
    localStorage.removeItem(this.storageKey)
    this.state = {
      journalContent: '',
      currentPage: '/',
      formData: {},
      scrollPositions: {},
      timestamp: null,
      version: '1.0'
    }
    this.notifyObservers('sessionCleared')
  }

  cleanupOldSessions() {
    try {
      const keys = Object.keys(localStorage)
      const sessionKeys = keys.filter(key => key.startsWith('soulscroll-session'))
      
      sessionKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          const age = Date.now() - (data.timestamp || 0)
          const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
          
          if (age > maxAge) {
            localStorage.removeItem(key)
          }
        } catch (error) {
          // Remove corrupted sessions
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to cleanup old sessions:', error)
    }
  }

  // Observer pattern
  subscribe(callback) {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data)
      } catch (error) {
        console.warn('Observer callback failed:', error)
      }
    })
  }

  // Recovery utilities
  async recoverJournalEntry() {
    const content = this.getJournalContent()
    if (content && content.length > 10) {
      return {
        content,
        timestamp: this.state.timestamp,
        recovered: true
      }
    }
    return null
  }

  async recoverFormData(formId) {
    const data = this.getFormData(formId)
    if (Object.keys(data).length > 0) {
      return {
        data,
        timestamp: data.timestamp,
        recovered: true
      }
    }
    return null
  }

  getRecoveryInfo() {
    return {
      hasJournalContent: this.state.journalContent.length > 0,
      hasFormData: Object.keys(this.state.formData).length > 0,
      lastSaved: this.state.timestamp,
      currentPage: this.state.currentPage,
      age: this.state.timestamp ? Date.now() - this.state.timestamp : null
    }
  }

  destroy() {
    this.stopAutoSave()
    this.observers.clear()
    window.removeEventListener('beforeunload', this.saveSession)
    document.removeEventListener('visibilitychange', this.saveSession)
  }
}

// Export singleton instance
export const sessionRecovery = new SessionRecoveryManager()

// React hook for session recovery
export const useSessionRecovery = () => {
  const [recoveryInfo, setRecoveryInfo] = React.useState(() => 
    sessionRecovery.getRecoveryInfo()
  )
  
  React.useEffect(() => {
    const unsubscribe = sessionRecovery.subscribe((event, data) => {
      setRecoveryInfo(sessionRecovery.getRecoveryInfo())
    })
    
    return unsubscribe
  }, [])
  
  return {
    ...recoveryInfo,
    updateJournalContent: sessionRecovery.updateJournalContent.bind(sessionRecovery),
    updateFormData: sessionRecovery.updateFormData.bind(sessionRecovery),
    recoverJournalEntry: sessionRecovery.recoverJournalEntry.bind(sessionRecovery),
    recoverFormData: sessionRecovery.recoverFormData.bind(sessionRecovery),
    clearSession: sessionRecovery.clearSession.bind(sessionRecovery)
  }
}

// React component for recovery notifications
export const SessionRecoveryBanner = () => {
  const { hasJournalContent, age, recoverJournalEntry } = useSessionRecovery()
  const [showBanner, setShowBanner] = React.useState(false)
  const [recovered, setRecovered] = React.useState(false)
  
  React.useEffect(() => {
    if (hasJournalContent && age && age < 60 * 60 * 1000) { // Show if less than 1 hour old
      setShowBanner(true)
    }
  }, [hasJournalContent, age])
  
  const handleRecover = async () => {
    const entry = await recoverJournalEntry()
    if (entry) {
      // Trigger recovery in journal editor
      const event = new CustomEvent('recoverJournalEntry', { detail: entry })
      window.dispatchEvent(event)
      setRecovered(true)
      setShowBanner(false)
    }
  }
  
  if (!showBanner || recovered) return null
  
  return (
    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-blue-200 font-medium">Unsaved journal entry found</h4>
          <p className="text-blue-300 text-sm">Would you like to recover your previous work?</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecover}
            className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
          >
            Recover
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// Debug utilities
window.sessionRecovery = sessionRecovery