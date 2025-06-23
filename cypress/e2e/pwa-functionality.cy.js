describe('PWA Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
  })

  it('should have PWA manifest configured correctly', () => {
    cy.waitForApp()
    
    // Check manifest link exists
    cy.get('head link[rel="manifest"]').should('exist')
    
    // Verify manifest is accessible
    cy.request('/manifest.json').then((response) => {
      expect(response.status).to.equal(200)
      expect(response.body).to.have.property('name', 'SoulScroll')
      expect(response.body).to.have.property('short_name', 'SoulScroll')
      expect(response.body).to.have.property('start_url', '/')
      expect(response.body).to.have.property('display', 'standalone')
      expect(response.body.icons).to.have.length.greaterThan(0)
    })
  })

  it('should have service worker support', () => {
    cy.waitForApp()
    
    cy.window().should('have.property', 'navigator')
    cy.window().then((win) => {
      expect('serviceWorker' in win.navigator).to.be.true
    })
  })

  it('should register service worker successfully', () => {
    cy.waitForApp()
    
    // Wait for service worker registration
    cy.window().then((win) => {
      if ('serviceWorker' in win.navigator) {
        return win.navigator.serviceWorker.ready
      }
    }).then((registration) => {
      if (registration) {
        expect(registration).to.exist
        expect(registration.active).to.exist
      }
    })
  })

  it('should have offline capabilities', () => {
    cy.waitForApp()
    
    // Check for cache storage support
    cy.window().then((win) => {
      expect('caches' in win).to.be.true
      expect('localStorage' in win).to.be.true
    })
  })

  it('should show install prompt on supported browsers', () => {
    cy.waitForApp()
    
    // Mock beforeinstallprompt event
    cy.window().then((win) => {
      const mockEvent = new Event('beforeinstallprompt')
      mockEvent.prompt = cy.stub()
      mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      win.dispatchEvent(mockEvent)
    })
    
    // Install prompt should appear after delay
    cy.get('[data-testid="pwa-install-prompt"]', { timeout: 5000 })
      .should('be.visible')
  })

  it('should handle install prompt interactions', () => {
    cy.waitForApp()
    
    // Mock and trigger install prompt
    cy.window().then((win) => {
      const mockEvent = new Event('beforeinstallprompt')
      mockEvent.prompt = cy.stub().resolves()
      mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      win.dispatchEvent(mockEvent)
    })
    
    cy.get('[data-testid="pwa-install-prompt"]', { timeout: 5000 })
      .should('be.visible')
    
    // Test dismiss functionality
    cy.get('[data-testid="install-dismiss"]').click()
    cy.get('[data-testid="pwa-install-prompt"]').should('not.exist')
  })

  it('should detect standalone mode when installed', () => {
    cy.waitForApp()
    
    // Mock standalone display mode
    cy.window().then((win) => {
      // Override matchMedia to simulate standalone mode
      win.matchMedia = cy.stub().returns({
        matches: true,
        media: '(display-mode: standalone)',
        onchange: null,
        addListener: cy.stub(),
        removeListener: cy.stub()
      })
      
      // Reload to trigger standalone detection
      win.location.reload()
    })
    
    // Install prompt should not appear in standalone mode
    cy.get('[data-testid="pwa-install-prompt"]', { timeout: 5000 })
      .should('not.exist')
  })

  it('should cache critical resources', () => {
    cy.waitForApp()
    
    // Check that service worker caches resources
    cy.window().then(async (win) => {
      if ('caches' in win) {
        const cacheNames = await win.caches.keys()
        expect(cacheNames.length).to.be.greaterThan(0)
        
        // Check for SoulScroll cache
        const soulScrollCache = cacheNames.find(name => 
          name.includes('soulscroll')
        )
        expect(soulScrollCache).to.exist
      }
    })
  })

  it('should work offline after initial load', () => {
    cy.waitForApp()
    
    // Wait for service worker to cache resources
    cy.wait(2000)
    
    // Simulate offline mode
    cy.window().then((win) => {
      // Override navigator.onLine
      Object.defineProperty(win.navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      // Trigger offline event
      win.dispatchEvent(new Event('offline'))
    })
    
    // App should still be functional
    cy.get('[data-testid="journal-textarea"]').should('be.visible')
    cy.get('[data-testid="word-count"]').should('be.visible')
  })

  it('should have proper PWA meta tags', () => {
    cy.waitForApp()
    
    // Check essential PWA meta tags
    cy.get('head meta[name="viewport"]')
      .should('have.attr', 'content')
      .and('include', 'width=device-width')
    
    cy.get('head meta[name="theme-color"]')
      .should('have.attr', 'content', '#ffffff')
    
    cy.get('head meta[name="description"]')
      .should('exist')
      .should('have.attr', 'content')
  })

  it('should preload critical resources', () => {
    cy.waitForApp()
    
    // Check for preload links
    cy.get('head link[rel="preload"]').should('exist')
    cy.get('head link[rel="preconnect"]').should('exist')
    
    // Verify icon preload
    cy.get('head link[rel="preload"][href="/icon-192.png"]')
      .should('exist')
  })
})