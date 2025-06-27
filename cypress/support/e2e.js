// SoulScroll AI - Cypress E2E Support Configuration

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global test configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on React development errors
  if (err.message.includes('ResizeObserver loop limit exceeded') ||
      err.message.includes('Non-Error promise rejection captured') ||
      err.message.includes('Loading chunk')) {
    return false;
  }
  return true;
});

// Custom commands for SoulScroll AI
Cypress.Commands.add('waitForApp', () => {
  cy.get('#root', { timeout: 10000 }).should('exist');
  cy.get('[data-testid="app-loaded"], .app-container', { timeout: 10000 }).should('exist');
});

Cypress.Commands.add('writeJournalEntry', (text) => {
  cy.get('[data-testid="journal-editor"], textarea, [contenteditable="true"]')
    .first()
    .focus()
    .clear()
    .type(text, { delay: 50 });
});

Cypress.Commands.add('waitForAIResponse', () => {
  cy.get('[data-testid="ai-response"], .ai-insight, .reflection', { timeout: 15000 })
    .should('exist');
});