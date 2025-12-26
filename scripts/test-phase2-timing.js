/**
 * Phase 2 Test: Predictive Timing Optimization
 * Target: Timing Accuracy 72% → 78%
 */

import fs from 'fs';

// Enhanced timing prediction engine
class PredictiveTimingEngine {
  constructor() {
    this.userBehaviorModels = new Map();
    this.contextFactors = this.initializeContextFactors();
    this.timingStrategies = this.initializeTimingStrategies();
  }

  initializeContextFactors() {
    return {
      calendar_context: {
        pre_meeting: { focus_window: 15, urgency_multiplier: 1.3 },
        post_meeting: { focus_window: 30, energy_drain: 0.2 },
        lunch_break: { availability_window: 45, energy_boost: 0.3 },
        end_of_day: { urgency_boost: 0.4, fatigue_factor: 0.3 }
      },
      activity_momentum: {
        task_completion_streak: { confidence_boost: 0.2, timing_precision: 1.2 },
        recent_break: { energy_restoration: 0.3, focus_improvement: 0.25 },
        context_switching: { focus_penalty: 0.2, delay_recommendation: 10 }
      },
      environmental_factors: {
        notification_density: { high: 0.7, medium: 1.0, low: 1.3 },
        device_usage_pattern: { active: 1.2, idle: 0.8, locked: 0.3 },
        location_context: { work: 1.1, home: 1.0, commute: 0.6 }
      }
    };
  }

  initializeTimingStrategies() {
    return {
      immediate: {
        conditions: ['high_urgency', 'peak_energy', 'active_session'],
        delay_range: [0, 30], // seconds
        success_rate_modifier: 1.2
      },
      optimal_window: {
        conditions: ['predicted_availability', 'energy_alignment', 'context_match'],
        delay_range: [300, 1800], // 5-30 minutes
        success_rate_modifier: 1.4
      },
      momentum_based: {
        conditions: ['completion_streak', 'flow_state', 'task_similarity'],
        delay_range: [60, 300], // 1-5 minutes
        success_rate_modifier: 1.3
      },
      energy_synchronized: {
        conditions: ['energy_peak_prediction', 'circadian_alignment'],
        delay_range: [1800, 7200], // 30 minutes - 2 hours
        success_rate_modifier: 1.5
      }
    };
  }

  buildUserBehaviorModel(userId, historicalData) {
    const model = {
      circadianRhythm: this.analyzeCircadianPattern(historicalData),
      focusWindows: this.identifyFocusWindows(historicalData),
      interruptionTolerance: this.calculateInterruptionTolerance(historicalData),
      taskTransitionPatterns: this.analyzeTaskTransitions(historicalData),
      energyFluctuations: this.modelEnergyFluctuations(historicalData),
      contextualPreferences: this.extractContextualPreferences(historicalData)
    };

    this.userBehaviorModels.set(userId, model);
    return model;
  }

  analyzeCircadianPattern(data) {
    const hourlyPerformance = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    data.completions.forEach(completion => {
      const hour = new Date(completion.timestamp).getHours();
      hourlyPerformance[hour] += completion.success ? 1 : 0;
      hourlyCounts[hour]++;
    });

    // Calculate success rates by hour
    const hourlySuccessRates = hourlyPerformance.map((perf, hour) => 
      hourlyCounts[hour] > 0 ? perf / hourlyCounts[hour] : 0
    );

    // Identify peak performance windows
    const peaks = [];
    for (let i = 1; i < 23; i++) {
      if (hourlySuccessRates[i] > hourlySuccessRates[i-1] && 
          hourlySuccessRates[i] > hourlySuccessRates[i+1] &&
          hourlySuccessRates[i] > 0.7) {
        peaks.push({
          hour: i,
          performance: hourlySuccessRates[i],
          confidence: Math.min(hourlyCounts[i] / 10, 1) // More data = higher confidence
        });
      }
    }

    return {
      hourlySuccessRates,
      peakHours: peaks,
      optimalWindow: this.findOptimalWindow(hourlySuccessRates)
    };
  }

  findOptimalWindow(hourlyRates) {
    let bestWindow = { start: 9, end: 11, avgRate: 0 };
    
    // Test different window sizes (2-4 hours)
    for (let windowSize = 2; windowSize <= 4; windowSize++) {
      for (let start = 0; start <= 24 - windowSize; start++) {
        const end = start + windowSize;
        const windowRates = hourlyRates.slice(start, end);
        const avgRate = windowRates.reduce((a, b) => a + b, 0) / windowSize;
        
        if (avgRate > bestWindow.avgRate) {
          bestWindow = { start, end, avgRate };
        }
      }
    }
    
    return bestWindow;
  }

  identifyFocusWindows(data) {
    const focusWindows = [];
    let currentWindow = null;

    // Sort completions by timestamp
    const sortedCompletions = data.completions.sort((a, b) => a.timestamp - b.timestamp);

    sortedCompletions.forEach((completion, index) => {
      if (completion.success && completion.focusTime > 10) { // 10+ minutes of focus
        if (!currentWindow) {
          currentWindow = {
            start: completion.timestamp,
            end: completion.timestamp + completion.focusTime * 60000,
            tasks: 1,
            totalFocus: completion.focusTime
          };
        } else {
          // Extend window if within 30 minutes
          const timeSinceLastTask = completion.timestamp - currentWindow.end;
          if (timeSinceLastTask <= 30 * 60000) {
            currentWindow.end = completion.timestamp + completion.focusTime * 60000;
            currentWindow.tasks++;
            currentWindow.totalFocus += completion.focusTime;
          } else {
            // Save current window and start new one
            if (currentWindow.tasks >= 2) {
              focusWindows.push(currentWindow);
            }
            currentWindow = {
              start: completion.timestamp,
              end: completion.timestamp + completion.focusTime * 60000,
              tasks: 1,
              totalFocus: completion.focusTime
            };
          }
        }
      } else if (currentWindow && currentWindow.tasks >= 2) {
        // End current focus window
        focusWindows.push(currentWindow);
        currentWindow = null;
      }
    });

    return focusWindows.map(window => ({
      duration: window.end - window.start,
      taskCount: window.tasks,
      avgFocusTime: window.totalFocus / window.tasks,
      startHour: new Date(window.start).getHours(),
      quality: window.totalFocus / window.tasks > 20 ? 'high' : 'medium'
    }));
  }

  calculateInterruptionTolerance(data) {
    const interruptions = data.interruptions || [];
    const completions = data.completions || [];

    let toleranceScore = 0.5; // Base tolerance
    let recoveryTime = 5; // Minutes to recover from interruption

    interruptions.forEach(interruption => {
      const nextCompletion = completions.find(c => 
        c.timestamp > interruption.timestamp && 
        c.timestamp < interruption.timestamp + 30 * 60000 // Within 30 minutes
      );

      if (nextCompletion) {
        const recoveryMinutes = (nextCompletion.timestamp - interruption.timestamp) / 60000;
        recoveryTime = (recoveryTime + recoveryMinutes) / 2; // Running average
        
        if (nextCompletion.success) {
          toleranceScore += 0.1; // Good recovery
        } else {
          toleranceScore -= 0.1; // Poor recovery
        }
      }
    });

    return {
      score: Math.max(0, Math.min(1, toleranceScore)),
      avgRecoveryTime: recoveryTime,
      recommendation: toleranceScore > 0.7 ? 'flexible' : toleranceScore > 0.4 ? 'moderate' : 'strict'
    };
  }

  analyzeTaskTransitions(data) {
    const transitions = [];
    const sortedCompletions = data.completions.sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sortedCompletions.length; i++) {
      const prev = sortedCompletions[i - 1];
      const curr = sortedCompletions[i];
      const timeBetween = (curr.timestamp - prev.timestamp) / 60000; // Minutes

      if (timeBetween <= 60) { // Within an hour
        transitions.push({
          fromCategory: prev.category,
          toCategory: curr.category,
          timeBetween,
          success: curr.success,
          contextSwitch: prev.category !== curr.category
        });
      }
    }

    // Analyze patterns
    const contextSwitchSuccess = transitions.filter(t => t.contextSwitch && t.success).length;
    const contextSwitchTotal = transitions.filter(t => t.contextSwitch).length;
    const sameContextSuccess = transitions.filter(t => !t.contextSwitch && t.success).length;
    const sameContextTotal = transitions.filter(t => !t.contextSwitch).length;

    return {
      contextSwitchSuccessRate: contextSwitchTotal > 0 ? contextSwitchSuccess / contextSwitchTotal : 0.5,
      sameContextSuccessRate: sameContextTotal > 0 ? sameContextSuccess / sameContextTotal : 0.7,
      avgTransitionTime: transitions.reduce((sum, t) => sum + t.timeBetween, 0) / transitions.length || 5,
      optimalBreakTime: this.calculateOptimalBreakTime(transitions)
    };
  }

  calculateOptimalBreakTime(transitions) {
    const successfulTransitions = transitions.filter(t => t.success);
    if (successfulTransitions.length === 0) return 5;

    const breakTimes = successfulTransitions.map(t => t.timeBetween);
    breakTimes.sort((a, b) => a - b);
    
    // Find the median break time for successful transitions
    const median = breakTimes[Math.floor(breakTimes.length / 2)];
    return Math.max(2, Math.min(15, median)); // Clamp between 2-15 minutes
  }

  modelEnergyFluctuations(data) {
    const hourlyEnergy = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    data.completions.forEach(completion => {
      const hour = new Date(completion.timestamp).getHours();
      const energyScore = this.calculateEnergyScore(completion);
      
      hourlyEnergy[hour] += energyScore;
      hourlyCounts[hour]++;
    });

    const avgHourlyEnergy = hourlyEnergy.map((energy, hour) => 
      hourlyCounts[hour] > 0 ? energy / hourlyCounts[hour] : 0.5
    );

    return {
      hourlyEnergyLevels: avgHourlyEnergy,
      energyPeaks: this.findEnergyPeaks(avgHourlyEnergy),
      energyDips: this.findEnergyDips(avgHourlyEnergy),
      fluctuationPattern: this.classifyEnergyPattern(avgHourlyEnergy)
    };
  }

  calculateEnergyScore(completion) {
    let score = 0.5; // Base energy
    
    if (completion.success) score += 0.2;
    if (completion.focusTime > 15) score += 0.2;
    if (completion.completionSpeed === 'fast') score += 0.1;
    if (completion.qualityRating > 3) score += 0.1;
    
    return Math.min(1, score);
  }

  findEnergyPeaks(energyLevels) {
    const peaks = [];
    for (let i = 1; i < 23; i++) {
      if (energyLevels[i] > energyLevels[i-1] && 
          energyLevels[i] > energyLevels[i+1] &&
          energyLevels[i] > 0.7) {
        peaks.push({ hour: i, level: energyLevels[i] });
      }
    }
    return peaks;
  }

  findEnergyDips(energyLevels) {
    const dips = [];
    for (let i = 1; i < 23; i++) {
      if (energyLevels[i] < energyLevels[i-1] && 
          energyLevels[i] < energyLevels[i+1] &&
          energyLevels[i] < 0.4) {
        dips.push({ hour: i, level: energyLevels[i] });
      }
    }
    return dips;
  }

  classifyEnergyPattern(energyLevels) {
    const morningAvg = energyLevels.slice(6, 12).reduce((a, b) => a + b, 0) / 6;
    const afternoonAvg = energyLevels.slice(12, 18).reduce((a, b) => a + b, 0) / 6;
    const eveningAvg = energyLevels.slice(18, 22).reduce((a, b) => a + b, 0) / 4;

    if (morningAvg > afternoonAvg && morningAvg > eveningAvg) return 'morning_person';
    if (afternoonAvg > morningAvg && afternoonAvg > eveningAvg) return 'afternoon_person';
    if (eveningAvg > morningAvg && eveningAvg > afternoonAvg) return 'evening_person';
    return 'consistent';
  }

  extractContextualPreferences(data) {
    const preferences = {
      devicePreference: this.analyzeDevicePreference(data),
      locationPreference: this.analyzeLocationPreference(data),
      notificationDensityTolerance: this.analyzeNotificationTolerance(data),
      taskCategoryTiming: this.analyzeTaskCategoryTiming(data)
    };

    return preferences;
  }

  analyzeDevicePreference(data) {
    const deviceSuccess = {};
    data.completions.forEach(completion => {
      const device = completion.device || 'unknown';
      if (!deviceSuccess[device]) {
        deviceSuccess[device] = { success: 0, total: 0 };
      }
      deviceSuccess[device].total++;
      if (completion.success) deviceSuccess[device].success++;
    });

    let bestDevice = 'mobile';
    let bestRate = 0;
    
    Object.entries(deviceSuccess).forEach(([device, stats]) => {
      const rate = stats.success / stats.total;
      if (rate > bestRate && stats.total >= 5) { // Minimum 5 samples
        bestRate = rate;
        bestDevice = device;
      }
    });

    return { preferred: bestDevice, successRate: bestRate };
  }

  analyzeLocationPreference(data) {
    const locationSuccess = {};
    data.completions.forEach(completion => {
      const location = completion.location || 'unknown';
      if (!locationSuccess[location]) {
        locationSuccess[location] = { success: 0, total: 0 };
      }
      locationSuccess[location].total++;
      if (completion.success) locationSuccess[location].success++;
    });

    return Object.entries(locationSuccess).map(([location, stats]) => ({
      location,
      successRate: stats.success / stats.total,
      sampleSize: stats.total
    })).sort((a, b) => b.successRate - a.successRate);
  }

  analyzeNotificationTolerance(data) {
    // Analyze success rate vs notification frequency
    const hourlyNotifications = {};
    const hourlySuccess = {};

    data.completions.forEach(completion => {
      const hour = new Date(completion.timestamp).getHours();
      const notificationCount = completion.notificationsInHour || 0;
      
      if (!hourlyNotifications[notificationCount]) {
        hourlyNotifications[notificationCount] = { success: 0, total: 0 };
      }
      
      hourlyNotifications[notificationCount].total++;
      if (completion.success) hourlyNotifications[notificationCount].success++;
    });

    let optimalFrequency = 2; // Default
    let bestSuccessRate = 0;

    Object.entries(hourlyNotifications).forEach(([freq, stats]) => {
      const rate = stats.success / stats.total;
      if (rate > bestSuccessRate && stats.total >= 3) {
        bestSuccessRate = rate;
        optimalFrequency = parseInt(freq);
      }
    });

    return {
      optimalFrequency,
      tolerance: bestSuccessRate > 0.8 ? 'high' : bestSuccessRate > 0.6 ? 'medium' : 'low'
    };
  }

  analyzeTaskCategoryTiming(data) {
    const categoryTiming = {};
    
    data.completions.forEach(completion => {
      const category = completion.category || 'general';
      const hour = new Date(completion.timestamp).getHours();
      
      if (!categoryTiming[category]) {
        categoryTiming[category] = {};
      }
      
      if (!categoryTiming[category][hour]) {
        categoryTiming[category][hour] = { success: 0, total: 0 };
      }
      
      categoryTiming[category][hour].total++;
      if (completion.success) categoryTiming[category][hour].success++;
    });

    // Find optimal hours for each category
    const optimalTiming = {};
    Object.entries(categoryTiming).forEach(([category, hourData]) => {
      let bestHour = 10; // Default
      let bestRate = 0;
      
      Object.entries(hourData).forEach(([hour, stats]) => {
        const rate = stats.success / stats.total;
        if (rate > bestRate && stats.total >= 2) {
          bestRate = rate;
          bestHour = parseInt(hour);
        }
      });
      
      optimalTiming[category] = { hour: bestHour, successRate: bestRate };
    });

    return optimalTiming;
  }

  predictOptimalTiming(userId, context) {
    const model = this.userBehaviorModels.get(userId);
    if (!model) {
      return { delay: 300, confidence: 0.3, strategy: 'default' }; // 5 minutes default
    }

    const predictions = [];

    // Test each timing strategy
    Object.entries(this.timingStrategies).forEach(([strategyName, strategy]) => {
      const score = this.evaluateTimingStrategy(strategy, model, context);
      const delay = this.calculateOptimalDelay(strategy, model, context);
      
      predictions.push({
        strategy: strategyName,
        delay,
        confidence: score,
        expectedSuccessRate: strategy.success_rate_modifier * score
      });
    });

    // Select best strategy
    const bestPrediction = predictions.reduce((best, current) => 
      current.expectedSuccessRate > best.expectedSuccessRate ? current : best
    );

    return bestPrediction;
  }

  evaluateTimingStrategy(strategy, model, context) {
    let score = 0.5; // Base score

    // Check strategy conditions
    strategy.conditions.forEach(condition => {
      switch (condition) {
        case 'high_urgency':
          if (context.priority === 'high') score += 0.2;
          break;
        case 'peak_energy':
          const currentHour = new Date().getHours();
          const energyLevel = model.energyFluctuations.hourlyEnergyLevels[currentHour];
          if (energyLevel > 0.7) score += 0.3;
          break;
        case 'predicted_availability':
          if (this.isPredictedAvailable(model, context)) score += 0.25;
          break;
        case 'energy_alignment':
          if (this.isEnergyAligned(model, context)) score += 0.2;
          break;
        case 'completion_streak':
          if (context.recentCompletions > 2) score += 0.15;
          break;
        case 'circadian_alignment':
          if (this.isCircadianAligned(model, context)) score += 0.2;
          break;
      }
    });

    return Math.min(1, score);
  }

  isPredictedAvailable(model, context) {
    const currentHour = new Date().getHours();
    const optimalWindow = model.circadianRhythm.optimalWindow;
    
    return currentHour >= optimalWindow.start && currentHour <= optimalWindow.end;
  }

  isEnergyAligned(model, context) {
    const currentHour = new Date().getHours();
    const energyLevel = model.energyFluctuations.hourlyEnergyLevels[currentHour];
    const taskEnergyRequirement = this.getTaskEnergyRequirement(context);
    
    return energyLevel >= taskEnergyRequirement;
  }

  getTaskEnergyRequirement(context) {
    const requirements = {
      'creative': 0.7,
      'analytical': 0.8,
      'communication': 0.5,
      'administrative': 0.4
    };
    
    return requirements[context.category] || 0.6;
  }

  isCircadianAligned(model, context) {
    const currentHour = new Date().getHours();
    const peakHours = model.circadianRhythm.peakHours.map(p => p.hour);
    
    return peakHours.includes(currentHour) || 
           peakHours.some(peak => Math.abs(peak - currentHour) <= 1);
  }

  calculateOptimalDelay(strategy, model, context) {
    const [minDelay, maxDelay] = strategy.delay_range;
    
    // Adjust based on user model
    let adjustedDelay = (minDelay + maxDelay) / 2; // Start with middle
    
    // Adjust for interruption tolerance
    if (model.interruptionTolerance.recommendation === 'strict') {
      adjustedDelay *= 1.5; // Wait longer for strict users
    } else if (model.interruptionTolerance.recommendation === 'flexible') {
      adjustedDelay *= 0.7; // Can interrupt sooner
    }
    
    // Adjust for current energy
    const currentHour = new Date().getHours();
    const energyLevel = model.energyFluctuations.hourlyEnergyLevels[currentHour];
    if (energyLevel < 0.4) {
      adjustedDelay *= 2; // Wait for better energy
    }
    
    return Math.max(minDelay, Math.min(maxDelay, adjustedDelay));
  }

  // Test different timing strategies
  testTimingStrategies(testData) {
    const strategies = {
      baseline: this.baselineTimingStrategy,
      circadian_optimized: this.circadianOptimizedStrategy,
      context_aware: this.contextAwareStrategy,
      full_predictive: this.fullPredictiveStrategy
    };

    const results = {};
    
    for (const [strategyName, strategy] of Object.entries(strategies)) {
      results[strategyName] = this.runTimingTest(strategy, testData);
    }

    return results;
  }

  baselineTimingStrategy(context) {
    return { delay: 300, confidence: 0.5 }; // 5 minutes, medium confidence
  }

  circadianOptimizedStrategy(context) {
    const currentHour = new Date().getHours();
    const model = this.userBehaviorModels.get(context.userId);
    
    if (!model) return this.baselineTimingStrategy(context);
    
    const optimalWindow = model.circadianRhythm.optimalWindow;
    const hoursUntilOptimal = optimalWindow.start - currentHour;
    
    if (hoursUntilOptimal > 0 && hoursUntilOptimal <= 4) {
      return { delay: hoursUntilOptimal * 3600, confidence: 0.8 };
    }
    
    return { delay: 300, confidence: 0.6 };
  }

  contextAwareStrategy(context) {
    let delay = 300; // Base 5 minutes
    let confidence = 0.6;
    
    // Adjust for context
    if (context.priority === 'high') {
      delay = 60; // 1 minute for high priority
      confidence = 0.7;
    }
    
    if (context.recentActivity === 'active') {
      delay = 30; // 30 seconds if user is active
      confidence = 0.8;
    }
    
    if (context.notificationDensity === 'high') {
      delay *= 2; // Wait longer if many notifications
      confidence *= 0.9;
    }
    
    return { delay, confidence };
  }

  fullPredictiveStrategy(context) {
    return this.predictOptimalTiming(context.userId, context);
  }

  runTimingTest(strategy, testData) {
    let totalAccuracy = 0;
    let totalSuccess = 0;
    
    testData.forEach(testCase => {
      const prediction = strategy.call(this, testCase.context);
      
      // Simulate timing accuracy based on prediction quality
      const accuracyScore = this.calculateTimingAccuracy(prediction, testCase.context, testCase.actualOptimalDelay);
      const success = accuracyScore > 0.6 ? (Math.random() > 0.2 ? 1 : 0) : (Math.random() > 0.6 ? 1 : 0);
      
      totalAccuracy += accuracyScore;
      totalSuccess += success;
    });

    return {
      avgAccuracy: totalAccuracy / testData.length,
      successRate: totalSuccess / testData.length,
      timingScore: (totalAccuracy + totalSuccess) / (testData.length * 2)
    };
  }

  calculateTimingAccuracy(prediction, context, actualOptimal) {
    const predictedDelay = prediction.delay;
    const confidence = prediction.confidence || 0.5;
    
    // Calculate how close the prediction is to optimal
    const timingError = Math.abs(predictedDelay - actualOptimal) / actualOptimal;
    const accuracyFromTiming = Math.max(0, 1 - timingError);
    
    // Weight by confidence
    return accuracyFromTiming * confidence;
  }
}

// Test execution
async function runPhase2Test() {
  console.log('🧪 Phase 2 Test: Predictive Timing Optimization');
  console.log('===============================================');
  
  const engine = new PredictiveTimingEngine();
  
  // Generate test data with user models
  const testData = generateTimingTestData(50);
  
  // Build user behavior models
  testData.forEach(testCase => {
    if (!engine.userBehaviorModels.has(testCase.context.userId)) {
      engine.buildUserBehaviorModel(testCase.context.userId, testCase.historicalData);
    }
  });
  
  console.log('\n📊 Testing Timing Strategies...');
  const results = engine.testTimingStrategies(testData);
  
  console.log('\n=== TIMING STRATEGY COMPARISON ===');
  Object.entries(results).forEach(([strategy, metrics]) => {
    console.log(`${strategy.toUpperCase()}:`);
    console.log(`  Timing Accuracy: ${(metrics.avgAccuracy * 100).toFixed(1)}%`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Overall Score: ${(metrics.timingScore * 100).toFixed(1)}%`);
    console.log('');
  });
  
  // Calculate improvement
  const baselineAccuracy = results.baseline.avgAccuracy;
  const bestAccuracy = Math.max(...Object.values(results).map(r => r.avgAccuracy));
  const improvement = ((bestAccuracy - baselineAccuracy) / baselineAccuracy) * 100;
  
  console.log('=== PHASE 2 RESULTS ===');
  console.log(`Baseline Timing Accuracy: ${(baselineAccuracy * 100).toFixed(1)}%`);
  console.log(`Best Strategy Accuracy: ${(bestAccuracy * 100).toFixed(1)}%`);
  console.log(`Improvement: +${improvement.toFixed(1)}%`);
  
  // Projected system impact
  const currentSystemAccuracy = 0.72;
  const projectedImprovement = currentSystemAccuracy * (improvement / 100);
  const newAccuracy = currentSystemAccuracy + projectedImprovement;
  
  console.log(`\nProjected System Impact:`);
  console.log(`Current: ${(currentSystemAccuracy * 100).toFixed(1)}%`);
  console.log(`Projected: ${(newAccuracy * 100).toFixed(1)}%`);
  console.log(`Target Met: ${newAccuracy >= 0.78 ? '✅ YES' : '❌ NO'}`);
  
  return {
    baseline: baselineAccuracy,
    optimized: bestAccuracy,
    improvement: improvement,
    projectedSystemAccuracy: newAccuracy,
    targetMet: newAccuracy >= 0.78
  };
}

function generateTimingTestData(count) {
  const testData = [];
  
  for (let i = 0; i < count; i++) {
    const userId = `user_${i % 10}`; // 10 different users
    
    testData.push({
      userId,
      context: {
        userId,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        category: ['creative', 'analytical', 'communication', 'administrative'][Math.floor(Math.random() * 4)],
        recentActivity: Math.random() > 0.5 ? 'active' : 'idle',
        notificationDensity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        recentCompletions: Math.floor(Math.random() * 5),
        timeOfDay: new Date().getHours()
      },
      historicalData: generateUserHistoricalData(),
      actualOptimalDelay: Math.floor(Math.random() * 1800) + 60 // 1-30 minutes
    });
  }
  
  return testData;
}

function generateUserHistoricalData() {
  const completions = [];
  const interruptions = [];
  
  // Generate 30 days of historical data
  for (let day = 0; day < 30; day++) {
    const tasksPerDay = Math.floor(Math.random() * 8) + 2; // 2-10 tasks per day
    
    for (let task = 0; task < tasksPerDay; task++) {
      const hour = Math.floor(Math.random() * 16) + 6; // 6 AM to 10 PM
      const timestamp = Date.now() - (day * 24 * 60 * 60 * 1000) + (hour * 60 * 60 * 1000);
      
      completions.push({
        timestamp,
        success: Math.random() > 0.3, // 70% success rate
        focusTime: Math.floor(Math.random() * 45) + 5, // 5-50 minutes
        category: ['creative', 'analytical', 'communication', 'administrative'][Math.floor(Math.random() * 4)],
        device: Math.random() > 0.7 ? 'desktop' : 'mobile',
        location: Math.random() > 0.6 ? 'work' : 'home',
        notificationsInHour: Math.floor(Math.random() * 5),
        completionSpeed: Math.random() > 0.7 ? 'fast' : 'normal',
        qualityRating: Math.floor(Math.random() * 5) + 1
      });
      
      // Occasional interruptions
      if (Math.random() > 0.8) {
        interruptions.push({
          timestamp: timestamp + Math.random() * 30 * 60 * 1000, // Within 30 minutes
          type: 'notification',
          duration: Math.floor(Math.random() * 5) + 1 // 1-5 minutes
        });
      }
    }
  }
  
  return { completions, interruptions };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runPhase2Test, PredictiveTimingEngine };
} else {
  runPhase2Test().catch(console.error);
}