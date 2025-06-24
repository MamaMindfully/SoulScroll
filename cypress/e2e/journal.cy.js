// SoulScroll AI - Journal Functionality E2E Tests
describe('Journal Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('allows user to write journal entry', () => {
    const testEntry = 'This is a test journal entry for Cypress testing.';
    
    // Find journal input field (could be textarea or contenteditable div)
    cy.get('[data-testid="journal-editor"], textarea, [contenteditable="true"]')
      .first()
      .focus()
      .clear()
      .type(testEntry);
    
    // Verify text was entered
    cy.get('[data-testid="journal-editor"], textarea, [contenteditable="true"]')
      .first()
      .should('contain.value', testEntry);
  });

  it('shows word count feedback', () => {
    const testEntry = 'Short test entry.';
    
    cy.get('[data-testid="journal-editor"], textarea, [contenteditable="true"]')
      .first()
      .focus()
      .clear()
      .type(testEntry);
    
    // Look for word count display
    cy.get('[data-testid="word-count"], .word-count').should('exist');
  });

  it('triggers AI analysis after entry', () => {
    const testEntry = 'I feel happy and grateful today. The weather is beautiful and I accomplished my goals.';
    
    cy.get('[data-testid="journal-editor"], textarea, [contenteditable="true"]')
      .first()
      .focus()
      .clear()
      .type(testEntry);
    
    // Wait for potential auto-save or analysis trigger
    cy.wait(2000);
    
    // Look for AI response or analysis indicators
    cy.get('[data-testid="ai-response"], .ai-insight, .reflection').should('exist');
  });
});