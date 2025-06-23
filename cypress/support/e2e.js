// Import commands.js using ES2015 syntax:
import './commands'

// Cypress global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore React hydration errors in development
  if (err.message.includes('Hydration')) {
    return false
  }
  // Ignore network errors during testing
  if (err.message.includes('NetworkError')) {
    return false
  }
  return true
})

// Custom commands for authentication simulation
Cypress.Commands.add('simulateAuth', (userId = 'test-user-123') => {
  cy.window().then((win) => {
    win.localStorage.setItem('userId', userId)
    win.localStorage.setItem('isAuthenticated', 'true')
  })
})

Cypress.Commands.add('simulatePremium', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('premiumStatus', JSON.stringify({
      isPremium: true,
      plan: 'monthly',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }))
  })
})

Cypress.Commands.add('clearAppState', () => {
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})