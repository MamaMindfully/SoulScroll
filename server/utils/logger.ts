// Enhanced logger utility for Luma backend
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

class Logger {
  private levels: LogLevel = {
    ERROR: 'error',
    WARN: 'warn', 
    INFO: 'info',
    DEBUG: 'debug'
  };

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message: string, meta?: any) {
    const formatted = this.formatMessage(this.levels.ERROR, message, meta);
    console.error(formatted);
  }

  warn(message: string, meta?: any) {
    const formatted = this.formatMessage(this.levels.WARN, message, meta);
    console.warn(formatted);
  }

  info(message: string, meta?: any) {
    const formatted = this.formatMessage(this.levels.INFO, message, meta);
    console.log(formatted);
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage(this.levels.DEBUG, message, meta);
      console.log(formatted);
    }
  }
}

export const logger = new Logger();