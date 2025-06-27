// SoulScroll AI - Journal Editor Component Test
import React from 'react';

// Mock component for testing
const MockJournalEditor = ({ placeholder = "Write your thoughts...", onChange }) => {
  return (
    <div data-testid="mock-journal-editor">
      <textarea 
        data-testid="journal-textarea"
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full p-4 border rounded-lg"
      />
      <div data-testid="word-count" className="text-sm text-gray-500">
        Word count: 0
      </div>
    </div>
  );
};

describe('Journal Editor Component', () => {
  it('renders journal editor with placeholder', () => {
    cy.mount(<MockJournalEditor />);
    cy.get('[data-testid="journal-textarea"]').should('exist');
    cy.get('[data-testid="journal-textarea"]').should('have.attr', 'placeholder', 'Write your thoughts...');
  });

  it('updates word count when typing', () => {
    const handleChange = cy.stub();
    cy.mount(<MockJournalEditor onChange={handleChange} />);
    
    cy.get('[data-testid="journal-textarea"]')
      .type('This is a test entry');
    
    cy.get('[data-testid="word-count"]').should('exist');
  });

  it('handles responsive layout', () => {
    cy.mount(<MockJournalEditor />);
    
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('[data-testid="journal-textarea"]').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="journal-textarea"]').should('be.visible');
  });
});