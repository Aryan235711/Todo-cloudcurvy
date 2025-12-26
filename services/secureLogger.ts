// Secure Logging Service - Prevents Log Injection
class SecureLogger {
  private readonly MAX_LOG_LENGTH = 1000;
  private readonly SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /auth/i,
    /credential/i
  ];

  private sanitizeInput(input: any): string {
    if (input === null || input === undefined) {
      return 'null';
    }

    let str = String(input);
    
    // Truncate overly long inputs
    if (str.length > this.MAX_LOG_LENGTH) {
      str = str.substring(0, this.MAX_LOG_LENGTH) + '...[truncated]';
    }

    // Remove potentially dangerous characters for log injection
    str = str
      .replace(/[\r\n\t]/g, ' ') // Replace newlines/tabs with spaces
      .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
      .replace(/\x00-\x1f/g, '') // Remove control characters
      .replace(/\x7f-\x9f/g, ''); // Remove extended control characters

    return str;
  }

  private maskSensitiveData(input: string): string {
    // Mask potential sensitive data patterns
    let masked = input;
    
    this.SENSITIVE_PATTERNS.forEach(pattern => {
      masked = masked.replace(pattern, '[REDACTED]');
    });

    // Mask potential tokens/keys (long alphanumeric strings)
    masked = masked.replace(/[a-zA-Z0-9]{20,}/g, '[TOKEN_REDACTED]');
    
    return masked;
  }

  private formatLogEntry(level: string, message: string, context?: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitizeInput(message);
    const maskedMessage = this.maskSensitiveData(sanitizedMessage);
    
    let logEntry = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context) {
      const sanitizedContext = this.sanitizeInput(context);
      logEntry += ` [${sanitizedContext}]`;
    }
    
    logEntry += ` ${maskedMessage}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      try {
        const sanitizedMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
          acc[this.sanitizeInput(key)] = this.sanitizeInput(value);
          return acc;
        }, {} as Record<string, string>);
        
        logEntry += ` ${JSON.stringify(sanitizedMetadata)}`;
      } catch (error) {
        logEntry += ' [metadata_serialization_failed]';
      }
    }
    
    return logEntry;
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', message: any, context?: string, metadata?: Record<string, any>): void {
    const logEntry = this.formatLogEntry(level, message, context, metadata);
    
    switch (level) {
      case 'error':
        console.error(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logEntry);
        }
        break;
      default:
        console.log(logEntry);
    }
  }

  info(message: any, context?: string, metadata?: Record<string, any>): void {
    this.log('info', message, context, metadata);
  }

  warn(message: any, context?: string, metadata?: Record<string, any>): void {
    this.log('warn', message, context, metadata);
  }

  error(message: any, context?: string, metadata?: Record<string, any>): void {
    this.log('error', message, context, metadata);
  }

  debug(message: any, context?: string, metadata?: Record<string, any>): void {
    this.log('debug', message, context, metadata);
  }

  // Utility method for sanitizing user input before logging
  sanitizeForLogging(input: any): string {
    return this.maskSensitiveData(this.sanitizeInput(input));
  }
}

export const secureLogger = new SecureLogger();