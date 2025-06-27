describe('Performance and Deployment Validation', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
  })

  it('should pass deployment validation checks', () => {
    cy.waitForApp()
    
    // Run deployment validation
    cy.window().then((win) => {
      return win.validateDeployment()
    }).then((summary) => {
      // Check overall validation results
      expect(summary.readyForDeployment).to.be.true
      expect(summary.criticalIssues).to.have.length(0)
      expect(summary.score).to.be.greaterThan(80)
    })
  })

  it('should have performance metrics initialized', () => {
    cy.waitForApp()
    
    cy.window().should('have.property', 'soulScrollMetrics')
    cy.window().then((win) => {
      expect(win.soulScrollMetrics).to.exist
      expect(win.soulScrollMetrics.isEnabled).to.be.true
    })
  })

  it('should handle authentication flows without errors', () => {
    cy.simulateAuth()
    cy.waitForApp()
    
    // Check that global auth handler is working
    cy.window().should('have.property', 'authHandler')
    cy.window().then((win) => {
      expect(win.authHandler.isAuthenticated()).to.be.true
    })
  })

  it('should load critical resources within performance budgets', () => {
    const startTime = Date.now()
    
    cy.waitForApp()
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      expect(loadTime).to.be.lessThan(5000) // 5 second budget
    })
    
    // Check that main components are visible
    cy.get('[data-testid="journal-textarea"]').should('be.visible')
    cy.get('[data-testid="word-count"]').should('be.visible')
    cy.get('[data-testid="submit-journal"]').should('be.visible')
  })

  it('should handle network failures gracefully', () => {
    cy.waitForApp()
    
    // Simulate network failure
    cy.intercept('/api/**', { forceNetworkError: true })
    
    // App should still be functional
    cy.get('[data-testid="journal-textarea"]')
      .type('Testing offline functionality')
    
    cy.get('[data-testid="word-count"]')
      .should('contain', '3 words')
    
    // Should show offline indicator
    cy.window().then((win) => {
      win.navigator.onLine = false
      win.dispatchEvent(new Event('offline'))
    })
    
    cy.get('[data-testid="offline-indicator"]', { timeout: 5000 })
      .should('be.visible')
  })

  it('should maintain accessibility standards', () => {
    cy.waitForApp()
    
    // Check for test IDs (accessibility automation)
    cy.get('[data-testid]').should('have.length.greaterThan', 5)
    
    // Check for semantic HTML
    cy.get('main, nav, section').should('have.length.greaterThan', 1)
    
    // Check keyboard navigation
    cy.get('[data-testid="journal-textarea"]').focus().should('be.focused')
    cy.get('[data-testid="submit-journal"]').should('be.visible')
  })

  it('should handle premium features correctly', () => {
    cy.simulateAuth()
    cy.waitForApp()
    
    // Free user should see premium gates
    cy.visit('/dreams')
    cy.checkPremiumGate()
    
    // Premium user should have access
    cy.simulatePremium()
    cy.visit('/dreams')
    cy.get('[data-testid="premium-gate"]').should('not.exist')
  })

  it('should collect and report performance metrics', () => {
    cy.waitForApp()
    
    // Perform some user interactions
    cy.get('[data-testid="journal-textarea"]')
      .type('Testing performance metrics collection')
    
    cy.get('[data-testid="submit-journal"]').click()
    
    // Check that metrics are being collected
    cy.window().then((win) => {
      const metrics = win.soulScrollMetrics.getAllMetrics()
      expect(Object.keys(metrics)).to.have.length.greaterThan(0)
      
      // Check for user interaction metrics
      const interactions = win.soulScrollMetrics.getMetrics('user-interaction')
      expect(interactions).to.have.length.greaterThan(0)
    })
  })

  it('should validate all critical systems', () => {
    cy.waitForApp()
    
    cy.window().then((win) => {
      return win.validateDeployment()
    }).then((summary) => {
      // Authentication system
      expect(summary.readyForDeployment).to.be.true
      
      // No critical issues
      expect(summary.criticalIssues).to.have.length(0)
      
      // High overall score
      expect(summary.score).to.be.greaterThan(75)
      
      // Specific system checks
      cy.window().then((win) => {
        const detailed = win.deploymentValidator.getDetailedReport()
        expect(detailed.authentication.passed).to.be.true
        expect(detailed.security.passed).to.be.true
        expect(detailed.errorHandling.passed).to.be.true
      })
    })
  })
})