// Custom commands for SoulScroll testing

Cypress.Commands.add('waitForApp', () => {
  cy.get('body').should('be.visible')
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist')
})

Cypress.Commands.add('createJournalEntry', (content) => {
  cy.get('[data-testid="journal-textarea"]').clear().type(content)
  cy.get('[data-testid="submit-journal"]').click()
  cy.get('[data-testid="ai-reflection"]', { timeout: 15000 }).should('be.visible')
})

Cypress.Commands.add('navigateToPage', (page) => {
  cy.get(`[data-testid="nav-${page}"]`).click()
  cy.url().should('include', `/${page}`)
})

Cypress.Commands.add('checkPremiumGate', () => {
  cy.get('[data-testid="premium-gate"]').should('be.visible')
  cy.get('[data-testid="upgrade-button"]').should('contain', 'Upgrade')
})

Cypress.Commands.add('mockAPIResponse', (endpoint, response) => {
  cy.intercept('GET', endpoint, response).as(`mock${endpoint.replace(/\//g, '')}`)
})