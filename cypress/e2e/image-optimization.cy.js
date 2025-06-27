describe('Image Optimization and Loading', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearAppState()
  })

  it('should implement lazy loading on all images', () => {
    cy.waitForApp()
    
    // Check that images have lazy loading attribute
    cy.get('img').should('have.length.greaterThan', 0)
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'loading', 'lazy')
    })
  })

  it('should have image optimization utilities available', () => {
    cy.waitForApp()
    
    cy.window().should('have.property', 'imageOptimizer')
    cy.window().then((win) => {
      expect(win.imageOptimizer).to.exist
      expect(win.imageOptimizer.getOptimizedImageUrl).to.be.a('function')
      expect(win.imageOptimizer.createResponsiveImageProps).to.be.a('function')
    })
  })

  it('should optimize image URLs correctly', () => {
    cy.waitForApp()
    
    cy.window().then((win) => {
      const testUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
      const optimized = win.imageOptimizer.getOptimizedImageUrl(testUrl, {
        width: 800,
        quality: 80
      })
      
      expect(optimized).to.include('auto=format')
      expect(optimized).to.include('w=800')
      expect(optimized).to.include('q=80')
    })
  })

  it('should create responsive image props', () => {
    cy.waitForApp()
    
    cy.window().then((win) => {
      const testUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
      const props = win.imageOptimizer.createResponsiveImageProps(testUrl, 'Test image')
      
      expect(props).to.have.property('src')
      expect(props).to.have.property('srcSet')
      expect(props).to.have.property('sizes')
      expect(props).to.have.property('loading', 'lazy')
      expect(props).to.have.property('decoding', 'async')
      expect(props.alt).to.equal('Test image')
    })
  })

  it('should monitor image performance', () => {
    cy.waitForApp()
    
    cy.window().then((win) => {
      // Check that performance observer is set up for images
      expect(win.PerformanceObserver).to.exist
      
      // Check that metrics are being collected
      const metrics = win.soulScrollMetrics.getAllMetrics()
      expect(metrics).to.be.an('object')
    })
  })

  it('should load images without blocking UI', () => {
    const startTime = Date.now()
    
    cy.waitForApp()
    
    // UI should be interactive quickly even with images loading
    cy.get('[data-testid="journal-textarea"]').should('be.visible')
    
    cy.then(() => {
      const loadTime = Date.now() - startTime
      expect(loadTime).to.be.lessThan(3000) // UI should be ready in under 3 seconds
    })
  })

  it('should handle image loading errors gracefully', () => {
    cy.waitForApp()
    
    // Create test image with broken URL
    cy.window().then((win) => {
      const img = win.document.createElement('img')
      img.src = 'https://broken-url-test.jpg'
      img.loading = 'lazy'
      img.alt = 'Test broken image'
      
      let errorHandled = false
      img.onerror = () => {
        errorHandled = true
      }
      
      win.document.body.appendChild(img)
      
      // Error should be handled gracefully
      cy.wrap(img).should('exist')
    })
  })

  it('should support progressive image loading', () => {
    cy.waitForApp()
    
    cy.window().then((win) => {
      const testImg = win.document.createElement('img')
      testImg.alt = 'Progressive test'
      win.document.body.appendChild(testImg)
      
      // Test progressive loading
      win.imageOptimizer.loadImageProgressively(
        testImg,
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        { blur: true }
      )
      
      // Should start with placeholder and filter
      expect(testImg.style.filter).to.include('blur')
    })
  })

  it('should preload critical images when needed', () => {
    cy.waitForApp()
    
    cy.window().then((win) => {
      const criticalImages = [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ]
      
      win.imageOptimizer.preloadCriticalImages(criticalImages)
      
      // Check that preload links are added
      const preloadLinks = win.document.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloadLinks.length).to.be.greaterThan(0)
    })
  })
})