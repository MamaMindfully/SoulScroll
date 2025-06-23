describe('Journal Workflow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
    cy.simulateAuth()
  })

  it('should allow creating and submitting journal entries', () => {
    cy.waitForApp()
    
    const journalText = 'Today I feel grateful for the beautiful sunset and the peaceful moments in my garden.'
    
    // Type in journal
    cy.get('[data-testid="journal-textarea"]')
      .type(journalText)
      .should('have.value', journalText)
    
    // Check word count updates
    cy.get('[data-testid="word-count"]')
      .should('contain', '17 words')
    
    // Submit journal entry
    cy.get('[data-testid="submit-journal"]')
      .should('not.be.disabled')
      .click()
    
    // Should show submission feedback
    cy.get('[data-testid="submit-journal"]')
      .should('contain', 'Submitting...')
      .or('be.disabled')
  })

  it('should validate empty journal entries', () => {
    cy.waitForApp()
    
    // Submit button should be disabled for empty content
    cy.get('[data-testid="submit-journal"]')
      .should('be.disabled')
    
    // Type and delete content
    cy.get('[data-testid="journal-textarea"]')
      .type('test')
    
    cy.get('[data-testid="submit-journal"]')
      .should('not.be.disabled')
    
    cy.get('[data-testid="journal-textarea"]')
      .clear()
    
    cy.get('[data-testid="submit-journal"]')
      .should('be.disabled')
  })

  it('should handle AI reflection responses', () => {
    cy.waitForApp()
    
    const reflectiveText = 'I had a challenging day dealing with work stress and feeling overwhelmed.'
    
    cy.get('[data-testid="journal-textarea"]')
      .type(reflectiveText)
    
    cy.get('[data-testid="submit-journal"]')
      .click()
    
    // Wait for AI reflection to appear
    cy.get('[data-testid="ai-reflection"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'Arc\'s Reflection')
    
    // Should contain thoughtful response
    cy.get('[data-testid="ai-reflection"] p')
      .should('not.be.empty')
      .and('have.length.greaterThan', 0)
  })

  it('should preserve journal content during navigation', () => {
    cy.waitForApp()
    
    const draftText = 'This is my draft journal entry that should persist'
    
    cy.get('[data-testid="journal-textarea"]')
      .type(draftText)
    
    // Navigate away
    cy.navigateToPage('progress')
    
    // Navigate back
    cy.get('[data-testid="nav-home"]').click()
    
    // Content should be preserved
    cy.get('[data-testid="journal-textarea"]')
      .should('have.value', draftText)
  })

  it('should track word count accurately', () => {
    cy.waitForApp()
    
    // Test various word counts
    const testCases = [
      { text: 'Hello', expectedWords: '1 words' },
      { text: 'Hello world', expectedWords: '2 words' },
      { text: 'The quick brown fox jumps', expectedWords: '5 words' },
      { text: '', expectedWords: '0 words' }
    ]
    
    testCases.forEach(({ text, expectedWords }) => {
      cy.get('[data-testid="journal-textarea"]')
        .clear()
        .type(text)
      
      cy.get('[data-testid="word-count"]')
        .should('contain', expectedWords)
    })
  })
})