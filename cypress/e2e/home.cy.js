// SoulScroll AI - Home Page E2E Tests
describe('SoulScroll Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the homepage successfully', () => {
    cy.contains('SoulScroll').should('exist');
    cy.get('#root').should('exist');
    cy.title().should('contain', 'SoulScroll');
  });

  it('displays main navigation elements', () => {
    cy.get('nav').should('exist');
    cy.contains('Home').should('be.visible');
  });

  it('shows journal entry interface', () => {
    cy.get('[data-testid="journal-editor"], textarea, [contenteditable]').should('exist');
  });

  it('handles responsive design', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('#root').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('#root').should('be.visible');
  });
});