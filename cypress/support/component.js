// SoulScroll AI - Cypress Component Testing Support

// Import commands.js using ES2015 syntax:
import './commands';

// Import global styles
import '../../client/src/index.css';

// Component testing setup
import { mount } from 'cypress/react18';

Cypress.Commands.add('mount', mount);

// Global configuration for component tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on React development errors
  if (err.message.includes('ResizeObserver loop limit exceeded') ||
      err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});