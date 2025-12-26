// Input Sanitization & Security Utility Service
export class SecurityService {
  
  // Sanitize text for HTML output to prevent XSS
  static sanitizeForHTML(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // Sanitize text for logging to prevent log injection
  static sanitizeForLogging(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[\r\n]/g, ' ')  // Remove newlines
      .replace(/[\t]/g, ' ')    // Replace tabs with spaces
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .trim()
      .substring(0, 200); // Limit length
  }

  // Sanitize object for analytics tracking
  static sanitizeAnalyticsData(data: Record<string, unknown>): Record<string, string | number | boolean> {
    const sanitized: Record<string, string | number | boolean> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = this.sanitizeForLogging(String(key));
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeForLogging(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else {
        sanitized[sanitizedKey] = this.sanitizeForLogging(String(value));
      }
    }
    
    return sanitized;
  }

  // Validate notification type to prevent injection
  static validateNotificationType(type: string): 'intervention' | 'contextual' | 'motivational' {
    const validTypes = ['intervention', 'contextual', 'motivational'] as const;
    return validTypes.includes(type as any) ? type as any : 'contextual';
  }

  // Safe localStorage operations with error handling
  static safeLocalStorageGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[Security] localStorage get failed:', this.sanitizeForLogging(String(error)));
      return null;
    }
  }

  static safeLocalStorageSet(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('[Security] localStorage set failed:', this.sanitizeForLogging(String(error)));
      return false;
    }
  }
}

export const securityService = SecurityService;