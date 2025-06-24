import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include traceId
declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get trace ID from header or generate a new one
  const traceId = req.headers['x-trace-id'] as string || uuidv4();
  
  // Add to request object
  req.traceId = traceId;
  
  // Add to response headers for client visibility
  res.setHeader('X-Trace-ID', traceId);
  
  // Add to local storage for this request context
  res.locals.traceId = traceId;
  
  next();
};

export default traceIdMiddleware;