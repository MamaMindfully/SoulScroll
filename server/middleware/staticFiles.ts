import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Enhanced static file middleware with comprehensive MIME type handling
export const enhancedStaticMiddleware = (distPath: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if this is an API route
    if (req.path.startsWith('/api/')) {
      return next();
    }

    const filePath = path.join(distPath, req.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return next();
    }

    try {
      const ext = path.extname(filePath).toLowerCase();
      const stat = fs.statSync(filePath);
      
      // Comprehensive MIME type mapping
      const mimeTypes: Record<string, string> = {
        // Core web files
        '.html': 'text/html; charset=utf-8',
        '.htm': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.xml': 'application/xml; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
        
        // Images
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        
        // Fonts
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        '.eot': 'application/vnd.ms-fontobject',
        
        // Audio/Video
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'audio/ogg',
        '.wav': 'audio/wav',
        
        // Documents
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        
        // Archives
        '.zip': 'application/zip',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        '.rar': 'application/vnd.rar',
        '.7z': 'application/x-7z-compressed',
        
        // PWA files
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.manifest': 'application/manifest+json; charset=utf-8',
        
        // Development
        '.map': 'application/json',
        '.md': 'text/markdown; charset=utf-8'
      };

      // Set content type
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // ETags for caching
      const etag = `"${stat.size}-${stat.mtime.getTime()}"`;
      res.setHeader('ETag', etag);
      
      // Check if client has cached version
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        res.status(304).end();
        return;
      }
      
      // Set caching headers based on file type and environment
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        if (ext === '.js' || ext === '.css') {
          // Aggressive caching for versioned assets
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
          // Medium caching for images
          res.setHeader('Cache-Control', 'public, max-age=86400');
        } else if (filePath.includes('manifest') || filePath.includes('service-worker')) {
          // Short caching for PWA files
          res.setHeader('Cache-Control', 'public, max-age=3600');
        } else if (ext === '.html' || ext === '.htm') {
          // Short caching for HTML
          res.setHeader('Cache-Control', 'public, max-age=3600');
        } else {
          // Default caching
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }
      
      // Set content length
      res.setHeader('Content-Length', stat.size);
      
      // Set last modified
      res.setHeader('Last-Modified', stat.mtime.toUTCString());
      
      // CORS headers for fonts and assets
      if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
      }
      
      // Stream the file
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', (error) => {
        logger.error('Static file streaming error', {
          filePath,
          error: error.message,
          traceId: req.traceId
        });
        
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
      
      stream.pipe(res);
      
      // Log successful static file serving in development
      if (isDev) {
        logger.debug('Static file served', {
          path: req.path,
          size: stat.size,
          contentType,
          traceId: req.traceId
        });
      }
      
    } catch (error) {
      logger.error('Static file middleware error', {
        filePath,
        error: error.message,
        traceId: req.traceId
      });
      
      next();
    }
  };
};

export default enhancedStaticMiddleware;