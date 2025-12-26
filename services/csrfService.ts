// CSRF Protection Service - Addresses CWE-352
class CSRFService {
  private token: string = '';
  private readonly TOKEN_HEADER = 'X-CSRF-Token';
  private readonly TOKEN_STORAGE_KEY = 'csrf_token';

  constructor() {
    this.initializeToken();
  }

  private initializeToken(): void {
    // Generate new token on initialization
    this.generateToken();
  }

  generateToken(): string {
    // Use crypto.randomUUID() for secure token generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      this.token = crypto.randomUUID();
    } else {
      // Fallback for environments without crypto.randomUUID
      this.token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    // Store in sessionStorage (not localStorage for security)
    try {
      sessionStorage.setItem(this.TOKEN_STORAGE_KEY, this.token);
    } catch (error) {
      console.warn('[CSRF] Failed to store token:', error);
    }
    
    return this.token;
  }

  getToken(): string {
    if (!this.token) {
      // Try to restore from sessionStorage
      try {
        const stored = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
        if (stored) {
          this.token = stored;
        } else {
          this.generateToken();
        }
      } catch (error) {
        this.generateToken();
      }
    }
    return this.token;
  }

  validateToken(providedToken: string): boolean {
    if (!providedToken || !this.token) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    if (providedToken.length !== this.token.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < this.token.length; i++) {
      result |= providedToken.charCodeAt(i) ^ this.token.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Add CSRF token to fetch requests
  addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      [this.TOKEN_HEADER]: this.getToken()
    };
  }

  // Validate CSRF token from request headers
  validateRequestHeaders(headers: Record<string, string>): boolean {
    const providedToken = headers[this.TOKEN_HEADER] || headers[this.TOKEN_HEADER.toLowerCase()];
    return this.validateToken(providedToken);
  }

  // Create a form input with CSRF token
  createTokenInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = this.getToken();
    return input;
  }

  // Refresh token (call periodically or after sensitive operations)
  refreshToken(): string {
    this.token = '';
    return this.generateToken();
  }
}

export const csrfService = new CSRFService();