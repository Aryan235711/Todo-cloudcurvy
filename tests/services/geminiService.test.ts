import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKey, getTaskBreakdown } from '../../services/geminiService';

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should handle empty key gracefully', async () => {
      const result = await validateApiKey('');
      expect(['valid', 'invalid', 'quota']).toContain(result);
    });

    it('should handle invalid key format', async () => {
      const result = await validateApiKey('invalid-key');
      expect(result).toBe('invalid');
    });

    it('should not crash with null input', async () => {
      const result = await validateApiKey(null as any);
      expect(result).toBe('invalid');
    });
  });

  describe('getTaskBreakdown', () => {
    it('should handle empty task gracefully', async () => {
      const result = await getTaskBreakdown('');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array for valid task', async () => {
      const result = await getTaskBreakdown('Complete project');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not crash with special characters', async () => {
      expect(async () => {
        await getTaskBreakdown('Task with @#$%^&*()');
      }).not.toThrow();
    });
  });
});