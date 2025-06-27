// Image optimization utilities for SoulScroll
// Provides lazy loading, WebP support, and responsive image handling

export class ImageOptimizer {
  constructor() {
    this.supportsWebP = null;
    this.supportsAvif = null;
    this.checkFormatSupport();
  }

  async checkFormatSupport() {
    // Check WebP support
    this.supportsWebP = await this.canUseFormat('webp');
    
    // Check AVIF support
    this.supportsAvif = await this.canUseFormat('avif');
    
    console.log('Image format support:', {
      webp: this.supportsWebP,
      avif: this.supportsAvif
    });
  }

  canUseFormat(format) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0 && img.height > 0);
      img.onerror = () => resolve(false);
      
      // Test images for format support
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAAOptbWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI='
      };
      
      img.src = testImages[format];
    });
  }

  getOptimizedImageUrl(src, options = {}) {
    const {
      width,
      height,
      quality = 80,
      format = 'auto'
    } = options;

    // If it's already an optimized URL, return as-is
    if (src.includes('auto=format') || src.includes('w=') || src.includes('h=')) {
      return src;
    }

    // For Unsplash images, add optimization parameters
    if (src.includes('unsplash.com')) {
      let optimizedUrl = src;
      
      // Add auto format parameter
      optimizedUrl += optimizedUrl.includes('?') ? '&' : '?';
      optimizedUrl += 'auto=format';
      
      // Add compression
      optimizedUrl += `&q=${quality}`;
      
      // Add dimensions if provided
      if (width) optimizedUrl += `&w=${width}`;
      if (height) optimizedUrl += `&h=${height}`;
      
      // Add fit parameter for better responsive behavior
      optimizedUrl += '&fit=crop';
      
      return optimizedUrl;
    }

    // For other image sources, return as-is
    return src;
  }

  createResponsiveImageProps(src, alt, options = {}) {
    const {
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      widths = [320, 640, 768, 1024, 1280, 1920],
      className = '',
      priority = false
    } = options;

    // Generate srcSet for responsive images
    const srcSet = widths
      .map(width => {
        const optimizedUrl = this.getOptimizedImageUrl(src, { width });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');

    return {
      src: this.getOptimizedImageUrl(src, { width: widths[0] }),
      srcSet,
      sizes,
      alt,
      loading: priority ? 'eager' : 'lazy',
      decoding: 'async',
      className: `${className} transition-opacity duration-300`,
      style: { aspectRatio: options.aspectRatio }
    };
  }

  preloadCriticalImages(imageUrls) {
    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.getOptimizedImageUrl(url, { width: 1024 });
      document.head.appendChild(link);
    });
  }

  observeImagePerformance() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img') {
          console.log('Image performance:', {
            name: entry.name,
            size: entry.transferSize,
            duration: entry.duration,
            startTime: entry.startTime
          });

          // Track slow loading images
          if (entry.duration > 1000) {
            console.warn('Slow image detected:', entry.name);
          }
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
  }

  // Progressive image loading utility
  loadImageProgressively(element, src, options = {}) {
    const { 
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=',
      blur = true 
    } = options;

    // Set placeholder
    element.src = placeholder;
    if (blur) {
      element.style.filter = 'blur(5px)';
    }

    // Create new image to preload
    const img = new Image();
    img.onload = () => {
      element.src = src;
      element.style.filter = 'none';
      element.style.opacity = '1';
    };
    img.onerror = () => {
      console.error('Failed to load image:', src);
      element.style.filter = 'none';
    };

    img.src = this.getOptimizedImageUrl(src);
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer();

// Global utility functions
export function optimizeImageUrl(src, options) {
  return imageOptimizer.getOptimizedImageUrl(src, options);
}

export function createResponsiveImage(src, alt, options) {
  return imageOptimizer.createResponsiveImageProps(src, alt, options);
}

// Initialize image performance monitoring
if (typeof window !== 'undefined') {
  imageOptimizer.observeImagePerformance();
  window.imageOptimizer = imageOptimizer;
}