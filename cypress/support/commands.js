// SoulScroll AI - Custom Cypress Commands

// Authentication helpers (if needed)
Cypress.Commands.add('login', (email = 'test@example.com') => {
  // Mock login for testing
  cy.window().then((win) => {
    win.localStorage.setItem('isAuthenticated', 'true');
    win.localStorage.setItem('userId', 'test-user-123');
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});

// Journal-specific commands
Cypress.Commands.add('createJournalEntry', (content) => {
  cy.writeJournalEntry(content);
  cy.get('[data-testid="save-button"], button:contains("Save")').click();
  cy.waitForAIResponse();
});

// Viewport helpers
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667);
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024);
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720);
});

// API helpers
Cypress.Commands.add('waitForHealthCheck', () => {
  cy.request({
    url: '/api/health',
    timeout: 10000
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('healthy', true);
  });
});