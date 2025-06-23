// Image optimization utilities for enhanced performance
interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  lazy?: boolean;
}

export class ImageOptimizer {
  private placeholderCache = new Map<string, string>();
  
  // Generate optimized image URL
  getOptimizedImageUrl(originalUrl: string, options: ImageOptimizationOptions = {}): string {
    const { width = 800, quality = 80, format = 'webp' } = options;
    
    // For external URLs (Unsplash, etc.), add optimization parameters
    if (originalUrl.includes('unsplash.com')) {
      const url = new URL(originalUrl);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fm', format);
      return url.toString();
    }
    
    // For local images, return as-is (could integrate with image CDN)
    return originalUrl;
  }

  // Create responsive image props
  createResponsiveImageProps(src: string, alt: string, options: ImageOptimizationOptions = {}) {
    const { width = 800, lazy = true } = options;
    
    const baseUrl = this.getOptimizedImageUrl(src, options);
    const srcSet = [
      `${this.getOptimizedImageUrl(src, { ...options, width: width * 0.5 })} ${width * 0.5}w`,
      `${this.getOptimizedImageUrl(src, { ...options, width: width })} ${width}w`,
      `${this.getOptimizedImageUrl(src, { ...options, width: width * 1.5 })} ${width * 1.5}w`,
      `${this.getOptimizedImageUrl(src, { ...options, width: width * 2 })} ${width * 2}w`
    ].join(', ');

    return {
      src: baseUrl,
      srcSet,
      sizes: `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw`,
      alt,
      loading: lazy ? 'lazy' as const : 'eager' as const,
      decoding: 'async' as const,
      onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
        console.error('Image failed to load:', src);
        e.currentTarget.src = this.getPlaceholder(alt);
      }
    };
  }

  // Generate placeholder for failed images
  private getPlaceholder(alt: string): string {
    if (this.placeholderCache.has(alt)) {
      return this.placeholderCache.get(alt)!;
    }

    // Create SVG placeholder
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">
          ${alt || 'Image'}
        </text>
      </svg>
    `;
    
    const placeholder = `data:image/svg+xml;base64,${btoa(svg)}`;
    this.placeholderCache.set(alt, placeholder);
    return placeholder;
  }

  // Preload critical images
  preloadCriticalImages(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Progressive loading with blur effect
  loadImageProgressively(img: HTMLImageElement, src: string, options: { blur?: boolean } = {}) {
    if (options.blur) {
      img.style.filter = 'blur(5px)';
      img.style.transition = 'filter 0.3s ease';
    }

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      if (options.blur) {
        img.style.filter = 'none';
      }
    };
    tempImg.src = src;
  }
}

export const imageOptimizer = new ImageOptimizer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).imageOptimizer = imageOptimizer;
}