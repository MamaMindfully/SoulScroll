// SoulScroll AI - PWA Functionality E2E Tests
describe('PWA Functionality', () => {
  it('loads service worker', () => {
    cy.visit('/');
    
    cy.window().then((win) => {
      expect(win.navigator.serviceWorker).to.exist;
    });
  });

  it('has valid manifest.json', () => {
    cy.request('/manifest.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('icons');
    });
  });

  it('serves proper icons', () => {
    cy.request('/icon-192.png').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers['content-type']).to.include('image');
    });
  });

  it('handles offline scenarios', () => {
    cy.visit('/');
    
    // Simulate offline
    cy.window().then((win) => {
      cy.wrap(win).invoke('dispatchEvent', new win.Event('offline'));
    });
    
    // App should still be functional
    cy.get('#root').should('be.visible');
  });
});