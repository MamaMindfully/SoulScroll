import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

class CSRFProtection {
  private tokenStore: Map<string, { token: string; expires: number }> = new Map();
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
    
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  // Generate CSRF token for session
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    this.tokenStore.set(sessionId, { token, expires });
    return token;
  }

  // Validate CSRF token
  validateToken(sessionId: string, providedToken: string): boolean {
    const stored = this.tokenStore.get(sessionId);
    
    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expires) {
      this.tokenStore.delete(sessionId);
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(stored.token, 'hex'),
      Buffer.from(providedToken, 'hex')
    );
  }

  // Cleanup expired tokens
  private cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, tokenData] of this.tokenStore.entries()) {
      if (now > tokenData.expires) {
        this.tokenStore.delete(sessionId);
      }
    }
  }

  // Middleware to provide CSRF token
  provideToken() {
    return (req: CSRFRequest, res: Response, next: NextFunction) => {
      const sessionId = req.sessionID || req.session?.id;
      
      if (!sessionId) {
        return res.status(400).json({ 
          error: 'Session required for CSRF protection',
          code: 'SESSION_REQUIRED'
        });
      }

      const token = this.generateToken(sessionId);
      req.csrfToken = token;
      
      // Provide token in response header
      res.setHeader('X-CSRF-Token', token);
      
      next();
    };
  }

  // Middleware to validate CSRF token
  validateCSRF() {
    return (req: CSRFRequest, res: Response, next: NextFunction) => {
      // Skip validation for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Skip validation for API endpoints using proper authentication
      if (req.path.startsWith('/api/') && req.headers.authorization) {
        return next();
      }

      const sessionId = req.sessionID || req.session?.id;
      const providedToken = req.headers['x-csrf-token'] || 
                           req.body?.csrfToken || 
                           req.query?.csrfToken;

      if (!sessionId) {
        return res.status(400).json({ 
          error: 'Session required',
          code: 'SESSION_REQUIRED'
        });
      }

      if (!providedToken) {
        return res.status(403).json({ 
          error: 'CSRF token required',
          code: 'CSRF_TOKEN_REQUIRED'
        });
      }

      if (!this.validateToken(sessionId, providedToken as string)) {
        return res.status(403).json({ 
          error: 'Invalid CSRF token',
          code: 'INVALID_CSRF_TOKEN'
        });
      }

      next();
    };
  }

  // Generate secure form token for HTML forms
  generateFormToken(sessionId: string, action: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${action}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
    
    return `${timestamp}.${signature}`;
  }

  // Validate form token
  validateFormToken(sessionId: string, action: string, token: string): boolean {
    try {
      const [timestamp, signature] = token.split('.');
      const data = `${sessionId}:${action}:${timestamp}`;
      
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(data)
        .digest('hex');

      // Check signature
      if (!crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )) {
        return false;
      }

      // Check token age (max 1 hour)
      const tokenAge = Date.now() - parseInt(timestamp);
      return tokenAge < (60 * 60 * 1000);
      
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const csrfProtection = new CSRFProtection();

// Express middlewares
export const provideCSRFToken = csrfProtection.provideToken();
export const validateCSRF = csrfProtection.validateCSRF();

// Form protection middleware
export const protectForm = (action: string) => {
  return (req: CSRFRequest, res: Response, next: NextFunction) => {
    const sessionId = req.sessionID || req.session?.id;
    const providedToken = req.body?.formToken;

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session required',
        code: 'SESSION_REQUIRED'
      });
    }

    if (!providedToken) {
      return res.status(403).json({ 
        error: 'Form token required',
        code: 'FORM_TOKEN_REQUIRED'
      });
    }

    if (!csrfProtection.validateFormToken(sessionId, action, providedToken)) {
      return res.status(403).json({ 
        error: 'Invalid form token',
        code: 'INVALID_FORM_TOKEN'
      });
    }

    next();
  };
};

export default csrfProtection;