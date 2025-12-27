// Chart Logic Validation Tests
import { HEALTH_THRESHOLDS, RATE_LIMIT_THRESHOLDS, CALCULATION_WEIGHTS, PERFORMANCE_THRESHOLDS, CHART_CONSTANTS } from '../config/chartConstants';

export const runChartLogicTests = () => {
  const results = [];

  // Test 1: Health Thresholds
  const testHealthThresholds = () => {
    const score = 0.85;
    const isGood = score >= HEALTH_THRESHOLDS.GOOD && score < HEALTH_THRESHOLDS.EXCELLENT;
    return {
      name: 'Health Threshold Classification',
      passed: isGood,
      details: `Score ${score} correctly classified as GOOD (${HEALTH_THRESHOLDS.GOOD}-${HEALTH_THRESHOLDS.EXCELLENT})`
    };
  };

  // Test 2: Progress Chart Math
  const testProgressChart = () => {
    const percentage = 75;
    const degrees = percentage * CHART_CONSTANTS.PROGRESS_CIRCLE.DEGREES_MULTIPLIER;
    const expected = 270; // 75% of 360 degrees
    return {
      name: 'Progress Chart Calculation',
      passed: degrees === expected,
      details: `${percentage}% = ${degrees}° (expected ${expected}°)`
    };
  };

  // Test 3: Effectiveness Weights Sum
  const testEffectivenessWeights = () => {
    const sum = CALCULATION_WEIGHTS.EFFECTIVENESS.CONVERSION_RATE + 
                CALCULATION_WEIGHTS.EFFECTIVENESS.ENGAGEMENT_RATE + 
                CALCULATION_WEIGHTS.EFFECTIVENESS.PREDICTION_ACCURACY;
    return {
      name: 'Effectiveness Weights Sum to 1.0',
      passed: Math.abs(sum - 1.0) < 0.001,
      details: `Weights sum: ${sum} (should be 1.0)`
    };
  };

  // Test 4: Rate Limit Status Logic
  const testRateLimitStatus = () => {
    const criticalUsage = 0.95;
    const warningUsage = 0.8;
    const healthyUsage = 0.5;
    
    const criticalStatus = criticalUsage > RATE_LIMIT_THRESHOLDS.CRITICAL ? 'critical' : 'ok';
    const warningStatus = warningUsage > RATE_LIMIT_THRESHOLDS.WARNING ? 'warning' : 'ok';
    const healthyStatus = healthyUsage > RATE_LIMIT_THRESHOLDS.WARNING ? 'warning' : 'healthy';
    
    return {
      name: 'Rate Limit Status Classification',
      passed: criticalStatus === 'critical' && warningStatus === 'warning' && healthyStatus === 'healthy',
      details: `Critical: ${criticalStatus}, Warning: ${warningStatus}, Healthy: ${healthyStatus}`
    };
  };

  // Test 5: Performance Thresholds
  const testPerformanceThresholds = () => {
    const goodTime = 50;
    const badTime = 1500;
    
    const goodHealth = Math.max(0, Math.min(1, (PERFORMANCE_THRESHOLDS.RESPONSE_TIME.BAD_MS - goodTime) / PERFORMANCE_THRESHOLDS.RESPONSE_TIME.BAD_MS));
    const badHealth = Math.max(0, Math.min(1, (PERFORMANCE_THRESHOLDS.RESPONSE_TIME.BAD_MS - badTime) / PERFORMANCE_THRESHOLDS.RESPONSE_TIME.BAD_MS));
    
    return {
      name: 'Response Time Health Calculation',
      passed: goodHealth > 0.9 && badHealth === 0,
      details: `Good (${goodTime}ms): ${goodHealth.toFixed(2)}, Bad (${badTime}ms): ${badHealth.toFixed(2)}`
    };
  };

  // Run all tests
  results.push(testHealthThresholds());
  results.push(testProgressChart());
  results.push(testEffectivenessWeights());
  results.push(testRateLimitStatus());
  results.push(testPerformanceThresholds());

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log('🧪 CHART LOGIC TEST RESULTS:');
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.details}`);
  });
  console.log(`\n📊 SUMMARY: ${passedCount}/${totalCount} tests passed (${Math.round(passedCount/totalCount*100)}%)`);

  return {
    passed: passedCount === totalCount,
    results,
    summary: `${passedCount}/${totalCount} tests passed`
  };
};