import { useState, useEffect } from 'react';
import { useHasMounted } from '@/utils/useHasMounted';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'blur',
  loading = 'lazy',
  priority = false
}: LazyImageProps) {
  const hasMounted = useHasMounted();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    if (!hasMounted) return;
    
    if (priority) {
      // Load immediately for priority images
      setImageSrc(src);
    } else {
      // Lazy load with intersection observer
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
      };
      img.src = src;
    }
  }, [hasMounted, src, priority]);

  if (!hasMounted) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {placeholder === 'blur' && !imageLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"
          style={{ width, height }}
        />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}