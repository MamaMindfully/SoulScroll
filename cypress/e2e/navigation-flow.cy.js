describe('Navigation and Page Transitions', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
  })

  it('should navigate between main pages smoothly', () => {
    // Wait for app to load
    cy.waitForApp()
    
    // Test home page is accessible
    cy.get('[data-testid="app-loaded"]').should('be.visible')
    
    // Navigate to progress page
    cy.navigateToPage('progress')
    cy.url().should('include', '/progress')
    
    // Navigate to pricing page
    cy.navigateToPage('pricing')
    cy.url().should('include', '/pricing')
    
    // Verify pricing elements are visible
    cy.get('[data-testid="monthly-plan"]').should('be.visible')
    cy.get('[data-testid="yearly-plan"]').should('be.visible')
    cy.get('[data-testid="premium-features"]').should('be.visible')
  })

  it('should handle browser back/forward navigation', () => {
    cy.waitForApp()
    
    // Navigate through pages
    cy.navigateToPage('progress')
    cy.navigateToPage('pricing')
    
    // Use browser back
    cy.go('back')
    cy.url().should('include', '/progress')
    
    // Use browser forward
    cy.go('forward')
    cy.url().should('include', '/pricing')
    
    // Return to home
    cy.go('back')
    cy.go('back')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should maintain state during navigation', () => {
    cy.waitForApp()
    
    // Create journal content
    const journalText = 'Testing navigation state persistence'
    cy.get('[data-testid="journal-textarea"]').type(journalText)
    
    // Navigate away and back
    cy.navigateToPage('progress')
    cy.get('[data-testid="nav-home"]').click()
    
    // Content should be preserved
    cy.get('[data-testid="journal-textarea"]').should('have.value', journalText)
  })

  it('should show offline indicator when network is unavailable', () => {
    cy.waitForApp()
    
    // Simulate offline state
    cy.window().then((win) => {
      win.navigator.onLine = false
      win.dispatchEvent(new Event('offline'))
    })
    
    // Should show offline indicator
    cy.get('[data-testid="offline-indicator"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain', 'Offline')
  })
})