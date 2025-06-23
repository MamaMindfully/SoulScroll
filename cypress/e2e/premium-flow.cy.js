describe('Premium Subscription Flow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
    cy.simulateAuth()
  })

  it('should display pricing plans correctly', () => {
    cy.visit('/pricing')
    
    // Check monthly plan
    cy.get('[data-testid="monthly-plan"]').should('be.visible')
    cy.get('[data-testid="monthly-price"]').should('contain', '$8.99')
    
    // Check yearly plan
    cy.get('[data-testid="yearly-plan"]').should('be.visible')
    cy.get('[data-testid="yearly-price"]').should('contain', '$89.99')
    
    // Check premium features list
    cy.get('[data-testid="premium-features"]').should('be.visible')
    cy.get('[data-testid="premium-features"]').should('contain', 'Unlimited AI insights')
    cy.get('[data-testid="premium-features"]').should('contain', 'Voice journaling')
    
    // Check subscription buttons
    cy.get('[data-testid="monthly-subscribe"]').should('be.visible').and('not.be.disabled')
    cy.get('[data-testid="yearly-subscribe"]').should('be.visible').and('not.be.disabled')
  })

  it('should handle subscription flow initiation', () => {
    cy.visit('/pricing')
    
    // Click monthly subscribe
    cy.get('[data-testid="monthly-subscribe"]').click()
    
    // Should show processing state or redirect to checkout
    cy.get('[data-testid="monthly-subscribe"]')
      .should('contain', 'Processing...')
      .or('be.disabled')
  })

  it('should show premium gates for free users', () => {
    // Visit a premium-gated page
    cy.visit('/dreams')
    
    // Should show premium gate
    cy.checkPremiumGate()
    
    // Premium gate should have correct messaging
    cy.get('[data-testid="premium-gate"]').should('contain', 'Premium Feature')
    cy.get('[data-testid="upgrade-button"]').should('contain', 'Upgrade to Premium')
  })

  it('should allow premium users access to gated features', () => {
    cy.simulatePremium()
    cy.visit('/dreams')
    
    // Should not show premium gate
    cy.get('[data-testid="premium-gate"]').should('not.exist')
    
    // Should show dream journal interface
    cy.get('body').should('contain', 'Dream')
  })

  it('should handle pricing navigation from premium gates', () => {
    cy.visit('/dreams')
    
    // Should see premium gate
    cy.checkPremiumGate()
    
    // Click upgrade button
    cy.get('[data-testid="upgrade-button"]').click()
    
    // Should navigate to pricing page
    cy.url().should('include', '/pricing')
    cy.get('[data-testid="monthly-plan"]').should('be.visible')
  })

  it('should display savings calculation correctly', () => {
    cy.visit('/pricing')
    
    // Check that yearly plan shows savings
    cy.get('[data-testid="yearly-plan"]').should('contain', 'Save 17%')
    cy.get('[data-testid="yearly-plan"]').should('contain', 'Best Value')
  })

  it('should handle subscription errors gracefully', () => {
    cy.visit('/pricing')
    
    // Simulate network error
    cy.intercept('POST', '/api/stripe/create-checkout-session', {
      statusCode: 500,
      body: { error: 'Server error' }
    })
    
    cy.get('[data-testid="monthly-subscribe"]').click()
    
    // Should handle error gracefully
    cy.get('body').should('contain', 'Error')
      .or('contain', 'Failed')
      .or('contain', 'Please try again')
  })
})