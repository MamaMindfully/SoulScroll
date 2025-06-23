import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LazyImage({
  src,
  alt,
  placeholder,
  className = "",
  fallback,
  onLoad,
  onError,
  threshold = 0.1,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  // Optimize image URL for different screen sizes
  const getOptimizedSrc = () => {
    if (!src) return '';
    
    // If using a CDN like Cloudflare Images or ImageKit
    if (src.includes('imagekit.io')) {
      return `${src}?tr=w-800,h-600,q-80,f-webp`;
    }
    
    if (src.includes('cloudflare.com')) {
      return `${src}/w=800,h=600,q=80,f=webp`;
    }
    
    // For local images, return as-is
    return src;
  };

  if (hasError && fallback) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        {typeof fallback === 'string' ? (
          <span className="text-gray-500 text-sm">{fallback}</span>
        ) : (
          fallback
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {placeholder && (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {placeholder}
            </div>
          )}
        </motion.div>
      )}

      {/* Actual image */}
      {isInView && (
        <motion.img
          src={getOptimizedSrc()}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.1
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          {...props}
        />
      )}

      {/* Loading overlay */}
      {isInView && !isLoaded && !hasError && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      )}
    </div>
  );
}

// Background image component with lazy loading
export function LazyBackgroundImage({ 
  src, 
  children, 
  className = "",
  placeholder = "bg-gray-200",
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const divRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = src;
    }
  }, [isInView, src]);

  return (
    <motion.div
      ref={divRef}
      className={`relative ${placeholder} ${className}`}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      {...props}
    >
      {/* Loading overlay */}
      {isInView && !isLoaded && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
      
      {children}
    </motion.div>
  );
}