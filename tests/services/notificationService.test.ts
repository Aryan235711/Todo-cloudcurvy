import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerHaptic, recordTaskCompletion, getBehavioralInsights } from '../../services/notificationService';

// Mock Capacitor Haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    vibrate: vi.fn()
  }
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('triggerHaptic', () => {
    it('should not crash with valid input', () => {
      expect(() => triggerHaptic('light')).not.toThrow();
      expect(() => triggerHaptic('medium')).not.toThrow();
      expect(() => triggerHaptic('heavy')).not.toThrow();
    });

    it('should handle invalid input gracefully', () => {
      expect(() => triggerHaptic('invalid' as any)).not.toThrow();
    });
  });

  describe('recordTaskCompletion', () => {
    it('should record task completion without crashing', () => {
      expect(() => recordTaskCompletion('high')).not.toThrow();
      expect(() => recordTaskCompletion('medium')).not.toThrow();
      expect(() => recordTaskCompletion('low')).not.toThrow();
    });

    it('should handle invalid priority gracefully', () => {
      expect(() => recordTaskCompletion('invalid' as any)).not.toThrow();
    });
  });

  describe('getBehavioralInsights', () => {
    it('should return valid insights object', () => {
      const insights = getBehavioralInsights();
      
      expect(insights).toHaveProperty('procrastinationRisk');
      expect(['low', 'medium', 'high']).toContain(insights.procrastinationRisk);
    });

    it('should not crash with empty data', () => {
      localStorage.clear();
      expect(() => getBehavioralInsights()).not.toThrow();
    });
  });
});