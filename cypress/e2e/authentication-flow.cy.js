describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
  })

  it('should handle unauthenticated state gracefully', () => {
    // Clear any existing auth state
    cy.window().then((win) => {
      win.localStorage.clear()
      win.sessionStorage.clear()
    })
    
    cy.visit('/')
    
    // Should show landing page or handle gracefully
    cy.get('body').should('be.visible')
    
    // App should still be functional even without auth
    cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist')
  })

  it('should handle authentication expiration', () => {
    // Start with authenticated state
    cy.simulateAuth()
    cy.visit('/')
    cy.waitForApp()
    
    // Simulate auth expiration by triggering 401
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('authExpired', {
        detail: { reason: 'Session expired' }
      }))
    })
    
    // Should clear auth state
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.be.null
      expect(win.localStorage.getItem('userId')).to.be.null
    })
  })

  it('should maintain session across page refreshes', () => {
    cy.simulateAuth('test-user-123')
    cy.visit('/')
    cy.waitForApp()
    
    // Verify auth state
    cy.window().then((win) => {
      expect(win.localStorage.getItem('userId')).to.equal('test-user-123')
    })
    
    // Refresh page
    cy.reload()
    
    // Auth state should persist
    cy.window().then((win) => {
      expect(win.localStorage.getItem('userId')).to.equal('test-user-123')
    })
  })

  it('should handle premium status correctly', () => {
    cy.simulateAuth()
    cy.simulatePremium()
    cy.visit('/')
    cy.waitForApp()
    
    // Should have premium access
    cy.window().then((win) => {
      const premiumStatus = JSON.parse(win.localStorage.getItem('premiumStatus'))
      expect(premiumStatus.isPremium).to.be.true
    })
    
    // Navigate to premium features
    cy.navigateToPage('progress')
    
    // Should not see premium gates
    cy.get('[data-testid="premium-gate"]').should('not.exist')
  })

  it('should show premium gates for free users', () => {
    cy.simulateAuth()
    cy.visit('/dreams')
    
    // Should show premium gate
    cy.checkPremiumGate()
    
    // Click upgrade button should navigate to pricing
    cy.get('[data-testid="upgrade-button"]').click()
    cy.url().should('include', '/pricing')
  })
})