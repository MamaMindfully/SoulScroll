describe('Premium Subscription Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display premium features and pricing', () => {
    // Navigate to pricing page
    cy.get('[data-testid="nav-pricing"]').click()
    cy.url().should('include', '/pricing')
    
    // Test pricing plans display
    cy.get('[data-testid="monthly-plan"]').should('be.visible')
    cy.get('[data-testid="yearly-plan"]').should('be.visible')
    cy.get('[data-testid="monthly-price"]').should('contain', '$8.99')
    cy.get('[data-testid="yearly-price"]').should('contain', '$89.99')
    
    // Test feature comparison
    cy.get('[data-testid="premium-features"]').should('contain', 'Unlimited AI insights')
    cy.get('[data-testid="premium-features"]').should('contain', 'Voice journaling')
    cy.get('[data-testid="premium-features"]').should('contain', 'Advanced analytics')
  })

  it('should handle premium feature gating', () => {
    // Test gated features without premium
    cy.visit('/dreams')
    cy.get('[data-testid="premium-gate"]').should('be.visible')
    cy.get('[data-testid="upgrade-button"]').should('contain', 'Upgrade to Premium')
    
    // Test navigation to pricing from gate
    cy.get('[data-testid="upgrade-button"]').click()
    cy.url().should('include', '/pricing')
  })

  it('should initiate Stripe checkout flow', () => {
    cy.visit('/pricing')
    
    // Click monthly subscription
    cy.get('[data-testid="monthly-subscribe"]').click()
    
    // Should redirect to Stripe or show checkout
    cy.url().should('satisfy', (url) => {
      return url.includes('stripe') || url.includes('checkout') || url.includes('premium-success')
    })
  })

  it('should display premium success page', () => {
    // Simulate premium user state
    cy.window().then((win) => {
      win.localStorage.setItem('premiumStatus', JSON.stringify({
        isPremium: true,
        plan: 'monthly',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }))
    })
    
    cy.visit('/premium-success')
    cy.get('[data-testid="premium-welcome"]').should('be.visible')
    cy.get('[data-testid="premium-features-list"]').should('be.visible')
  })
})