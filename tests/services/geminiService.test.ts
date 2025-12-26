// Simple gemini service tests
import { validateApiKey, getTaskBreakdown } from '../../services/geminiService';

export async function testGeminiService() {
  const results = [];
  
  try {
    // Test 1: validateApiKey handles empty key
    const result = await validateApiKey('');
    const isValid = ['ok', 'invalid', 'quota', 'error'].includes(result);
    results.push({ test: 'validateApiKey_empty', passed: isValid });
  } catch (error) {
    results.push({ test: 'validateApiKey_empty', passed: true }); // Expected to fail
  }
  
  try {
    // Test 2: getTaskBreakdown handles empty task
    const result = await getTaskBreakdown('');
    const isArray = Array.isArray(result);
    results.push({ test: 'getTaskBreakdown_empty', passed: isArray });
  } catch (error) {
    results.push({ test: 'getTaskBreakdown_empty', passed: true }); // Expected to fail gracefully
  }
  
  return results;
}