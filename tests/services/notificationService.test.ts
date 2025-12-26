// Simple notification service tests
import { triggerHaptic, recordTaskCompletion, getBehavioralInsights } from '../../services/notificationService';

export function testNotificationService() {
  const results = [];
  
  try {
    // Test 1: triggerHaptic doesn't crash
    triggerHaptic('light');
    results.push({ test: 'triggerHaptic', passed: true });
  } catch (error) {
    results.push({ test: 'triggerHaptic', passed: false, error: error.message });
  }
  
  try {
    // Test 2: recordTaskCompletion doesn't crash
    recordTaskCompletion('high');
    results.push({ test: 'recordTaskCompletion', passed: true });
  } catch (error) {
    results.push({ test: 'recordTaskCompletion', passed: false, error: error.message });
  }
  
  try {
    // Test 3: getBehavioralInsights returns valid object
    const insights = getBehavioralInsights();
    const hasValidRisk = ['low', 'medium', 'high'].includes(insights.procrastinationRisk);
    results.push({ test: 'getBehavioralInsights', passed: hasValidRisk });
  } catch (error) {
    results.push({ test: 'getBehavioralInsights', passed: false, error: error.message });
  }
  
  return results;
}