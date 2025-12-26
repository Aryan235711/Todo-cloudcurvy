import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../../services/errorHandlerService';

describe('ErrorHandlerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler.resetErrorCount();
  });

  describe('handleError', () => {
    it('should handle errors without crashing', () => {
      const testError = new Error('Test error');
      expect(() => errorHandler.handleError(testError, 'test')).not.toThrow();
    });

    it('should track error count', () => {
      const testError = new Error('Test error');
      errorHandler.handleError(testError, 'test');
      expect(errorHandler.getErrorCount()).toBe(1);
    });

    it('should handle multiple errors', () => {
      for (let i = 0; i < 5; i++) {
        errorHandler.handleError(new Error(`Error ${i}`), 'test');
      }
      expect(errorHandler.getErrorCount()).toBe(5);
    });

    it('should handle null error gracefully', () => {
      expect(() => errorHandler.handleError(null as any, 'test')).not.toThrow();
    });
  });

  describe('handleAsyncError', () => {
    it('should handle rejected promises', async () => {
      const failingPromise = Promise.reject(new Error('Async error'));
      const result = await errorHandler.handleAsyncError(failingPromise, 'async-test');
      expect(result).toBe(null);
    });

    it('should handle successful promises', async () => {
      const successPromise = Promise.resolve('success');
      const result = await errorHandler.handleAsyncError(successPromise, 'async-test');
      expect(result).toBe('success');
    });
  });
});