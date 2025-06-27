interface UserRequestLog {
  [userId: string]: number[];
}

let userRequestLog: UserRequestLog = {};

export function rateLimit(
  userId: string, 
  limit: number = 5, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const log = userRequestLog[userId] || [];
  
  // Filter out expired timestamps
  const filtered = log.filter(timestamp => now - timestamp < windowMs);

  // Check if limit is exceeded
  if (filtered.length >= limit) {
    return false;
  }

  // Add current timestamp and update log
  userRequestLog[userId] = [...filtered, now];
  return true;
}

export function getRemainingRequests(
  userId: string, 
  limit: number = 5, 
  windowMs: number = 60000
): number {
  const now = Date.now();
  const log = userRequestLog[userId] || [];
  const filtered = log.filter(timestamp => now - timestamp < windowMs);
  
  return Math.max(0, limit - filtered.length);
}

export function getResetTime(
  userId: string, 
  windowMs: number = 60000
): number {
  const log = userRequestLog[userId] || [];
  if (log.length === 0) return 0;
  
  const oldestRequest = Math.min(...log);
  return oldestRequest + windowMs;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 60000; // 1 minute
  
  Object.keys(userRequestLog).forEach(userId => {
    userRequestLog[userId] = userRequestLog[userId].filter(
      timestamp => now - timestamp < maxAge
    );
    
    // Remove empty logs
    if (userRequestLog[userId].length === 0) {
      delete userRequestLog[userId];
    }
  });
}, 60000); // Clean up every minute