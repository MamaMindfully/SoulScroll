describe('Complete Journaling Flow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.window().then((win) => {
      // Clear localStorage for clean test state
      win.localStorage.clear()
    })
  })

  it('should complete full journaling workflow', () => {
    // Test home page loads
    cy.contains('SoulScroll').should('be.visible')
    
    // Test journal entry creation
    cy.get('[data-testid="journal-textarea"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="journal-textarea"]').type('Today I feel grateful for the progress I made on my project. The challenges were difficult but rewarding.')
    
    // Test word count updates
    cy.get('[data-testid="word-count"]').should('contain', '18')
    
    // Test AI reflection generation
    cy.get('[data-testid="submit-journal"]').click()
    cy.get('[data-testid="ai-reflection"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="ai-reflection"]').should('not.be.empty')
    
    // Test reflection feedback
    cy.get('[data-testid="feedback-thumbs-up"]').click()
    cy.get('[data-testid="feedback-success"]').should('be.visible')
    
    // Test navigation to other pages
    cy.get('[data-testid="nav-progress"]').click()
    cy.url().should('include', '/progress')
    
    // Test premium feature gating
    cy.get('[data-testid="premium-feature"]').should('contain', 'Premium')
  })

  it('should handle offline journaling', () => {
    // Simulate offline state
    cy.window().then((win) => {
      win.navigator.onLine = false
    })
    
    cy.get('[data-testid="journal-textarea"]').type('This is an offline entry')
    cy.get('[data-testid="submit-journal"]').click()
    
    // Should save to localStorage
    cy.window().its('localStorage').invoke('getItem', 'offlineEntries').should('not.be.null')
    
    // Test offline indicator
    cy.get('[data-testid="offline-indicator"]').should('be.visible')
  })

  it('should maintain journal state during session', () => {
    // Type content
    const journalContent = 'Testing session recovery functionality'
    cy.get('[data-testid="journal-textarea"]').type(journalContent)
    
    // Refresh page
    cy.reload()
    
    // Content should be restored
    cy.get('[data-testid="journal-textarea"]').should('have.value', journalContent)
  })
})