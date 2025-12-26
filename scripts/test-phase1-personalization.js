/**
 * Phase 1 Test: Enhanced Message Personalization
 * Target: Effectiveness 67% → 72%
 */

import fs from 'fs';

// Mock enhanced personalization system
class EnhancedPersonalizationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.messageLibrary = this.initializeExpandedLibrary();
    this.contextFactors = this.initializeContextFactors();
  }

  initializeExpandedLibrary() {
    return {
      productivity_styles: {
        sprinter: {
          encouraging: [
            ['⚡ Quick burst time!', 'Ready for a 15-minute sprint?'],
            ['🏃‍♂️ Sprint mode activated', 'Let\'s knock this out fast!'],
            ['💨 Speed round!', 'Quick task, big impact']
          ],
          urgent: [
            ['🚀 Blast off!', 'Time to move at light speed'],
            ['⚡ Lightning round!', 'Strike while you\'re energized']
          ]
        },
        marathoner: {
          encouraging: [
            ['🎯 Steady progress', 'One step closer to your goal'],
            ['🌊 Flowing forward', 'Maintain your productive rhythm'],
            ['🏔️ Mountain climber', 'Each task is another step up']
          ],
          urgent: [
            ['⏰ Gentle momentum', 'Keep your steady pace going'],
            ['🌱 Growth mindset', 'Consistent effort yields results']
          ]
        },
        perfectionist: {
          encouraging: [
            ['✨ Quality focus', 'Excellence in small steps'],
            ['🎨 Craft your work', 'Attention to detail pays off'],
            ['💎 Polish time', 'Make it shine with your touch']
          ],
          urgent: [
            ['🔍 Precision mode', 'Your careful approach matters'],
            ['⚖️ Balanced excellence', 'Good enough can be perfect']
          ]
        }
      },
      energy_levels: {
        high: {
          morning: ['🌅 Peak energy time!', 'Channel this power into progress'],
          afternoon: ['⚡ Afternoon surge!', 'Ride this energy wave'],
          evening: ['🔥 Evening fire!', 'Your energy is still strong']
        },
        medium: {
          morning: ['☀️ Gentle start', 'Ease into productive flow'],
          afternoon: ['🌤️ Steady state', 'Consistent progress wins'],
          evening: ['🌙 Calm focus', 'Peaceful productivity ahead']
        },
        low: {
          morning: ['🌱 Slow bloom', 'Small steps count too'],
          afternoon: ['🍃 Light touch', 'Gentle progress is still progress'],
          evening: ['💤 Easy does it', 'Simple task, simple win']
        }
      },
      task_categories: {
        creative: [
          ['🎨 Creative flow time', 'Let your imagination run free'],
          ['💡 Innovation moment', 'Your creative mind is ready'],
          ['🌈 Artistic expression', 'Time to create something beautiful']
        ],
        analytical: [
          ['🔍 Analysis mode', 'Your logical mind is sharp'],
          ['📊 Data dive time', 'Numbers and patterns await'],
          ['🧮 Problem solving', 'Your analytical skills shine']
        ],
        communication: [
          ['💬 Connection time', 'Your words have power'],
          ['📝 Message crafting', 'Time to communicate clearly'],
          ['🤝 Relationship building', 'Strengthen your connections']
        ]
      }
    };
  }

  initializeContextFactors() {
    return {
      weather: {
        sunny: { mood_boost: 0.2, energy_multiplier: 1.1 },
        rainy: { mood_boost: -0.1, energy_multiplier: 0.9 },
        cloudy: { mood_boost: 0, energy_multiplier: 1.0 }
      },
      time_pressure: {
        high: { urgency_boost: 0.3, stress_factor: 0.2 },
        medium: { urgency_boost: 0.1, stress_factor: 0.1 },
        low: { urgency_boost: 0, stress_factor: 0 }
      },
      recent_success: {
        high: { confidence_boost: 0.3, motivation_multiplier: 1.2 },
        medium: { confidence_boost: 0.1, motivation_multiplier: 1.1 },
        low: { confidence_boost: -0.1, motivation_multiplier: 0.9 }
      }
    };
  }

  analyzeUserProfile(userId, behaviorData) {
    // Detect productivity style
    const completionTimes = behaviorData.completionHistory.map(c => c.duration || 15);
    const avgCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    
    let productivityStyle = 'marathoner';
    if (avgCompletionTime < 10) productivityStyle = 'sprinter';
    else if (behaviorData.revisionCount > 2) productivityStyle = 'perfectionist';

    // Detect energy patterns
    const hourlyEnergy = this.calculateEnergyPattern(behaviorData.completionHistory);
    
    // Detect task preferences
    const taskPreferences = this.analyzeTaskPreferences(behaviorData.taskCategories || []);

    return {
      productivityStyle,
      energyPattern: hourlyEnergy,
      taskPreferences,
      motivationTriggers: this.identifyMotivationTriggers(behaviorData),
      communicationStyle: this.detectCommunicationStyle(behaviorData)
    };
  }

  calculateEnergyPattern(completionHistory) {
    const hourlyPerformance = new Map();
    
    completionHistory.forEach(completion => {
      const hour = completion.hour;
      const performance = completion.success ? 1 : 0;
      
      if (!hourlyPerformance.has(hour)) {
        hourlyPerformance.set(hour, []);
      }
      hourlyPerformance.get(hour).push(performance);
    });

    const energyLevels = {};
    for (const [hour, performances] of hourlyPerformance) {
      const avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
      energyLevels[hour] = avgPerformance > 0.8 ? 'high' : avgPerformance > 0.5 ? 'medium' : 'low';
    }

    return energyLevels;
  }

  analyzeTaskPreferences(taskCategories) {
    const categoryCount = {};
    taskCategories.forEach(category => {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);

    return sortedCategories.slice(0, 3); // Top 3 preferred categories
  }

  identifyMotivationTriggers(behaviorData) {
    const triggers = [];
    
    // Analyze what leads to successful completions
    if (behaviorData.streakSuccesses > behaviorData.isolatedSuccesses) {
      triggers.push('momentum');
    }
    
    if (behaviorData.rewardResponses > 0.7) {
      triggers.push('achievement');
    }
    
    if (behaviorData.socialSharing > 0.5) {
      triggers.push('recognition');
    }

    return triggers.length > 0 ? triggers : ['progress'];
  }

  detectCommunicationStyle(behaviorData) {
    // Analyze response to different message types
    const emojiResponse = behaviorData.emojiEngagement || 0.5;
    const lengthPreference = behaviorData.longMessageEngagement > behaviorData.shortMessageEngagement ? 'detailed' : 'concise';
    const tonePreference = behaviorData.casualToneEngagement > behaviorData.formalToneEngagement ? 'casual' : 'professional';

    return {
      emojiUsage: emojiResponse > 0.7 ? 'high' : emojiResponse > 0.4 ? 'medium' : 'low',
      lengthPreference,
      tonePreference
    };
  }

  generatePersonalizedMessage(userId, context) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return { title: '📋 Task reminder', body: 'Time to make progress' };
    }

    // Select base message from productivity style
    const styleMessages = this.messageLibrary.productivity_styles[profile.productivityStyle];
    const toneMessages = styleMessages[context.urgency || 'encouraging'];
    
    // Get current energy level
    const currentHour = new Date().getHours();
    const energyLevel = profile.energyPattern[currentHour] || 'medium';
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
    
    // Combine messages based on energy and context
    let selectedMessage;
    if (context.taskCategory && this.messageLibrary.task_categories[context.taskCategory]) {
      selectedMessage = this.messageLibrary.task_categories[context.taskCategory][0];
    } else if (this.messageLibrary.energy_levels[energyLevel][timeOfDay]) {
      selectedMessage = this.messageLibrary.energy_levels[energyLevel][timeOfDay];
    } else {
      selectedMessage = toneMessages[Math.floor(Math.random() * toneMessages.length)];
    }

    // Apply personalization factors
    let [title, body] = Array.isArray(selectedMessage) ? selectedMessage : [selectedMessage, 'Ready to make progress?'];
    
    // Adjust for communication style
    if (profile.communicationStyle.emojiUsage === 'low') {
      title = title.replace(/[^\w\s]/g, ''); // Remove emojis
    }
    
    if (profile.communicationStyle.lengthPreference === 'concise') {
      body = body.split('.')[0]; // Take first sentence only
    }

    return { title: title.trim(), body };
  }

  // Test different personalization strategies
  testPersonalizationStrategies(testData) {
    const strategies = {
      baseline: this.baselineStrategy,
      productivity_style: this.productivityStyleStrategy,
      energy_aware: this.energyAwareStrategy,
      full_personalization: this.fullPersonalizationStrategy
    };

    const results = {};
    
    for (const [strategyName, strategy] of Object.entries(strategies)) {
      results[strategyName] = this.runStrategyTest(strategy, testData);
    }

    return results;
  }

  baselineStrategy(context) {
    return { title: '📋 Task reminder', body: 'Time to complete your task' };
  }

  productivityStyleStrategy(context) {
    const style = context.userProfile?.productivityStyle || 'marathoner';
    const messages = this.messageLibrary.productivity_styles[style].encouraging;
    return messages[0];
  }

  energyAwareStrategy(context) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const energyLevel = context.userProfile?.energyPattern[hour] || 'medium';
    
    return this.messageLibrary.energy_levels[energyLevel][timeOfDay];
  }

  fullPersonalizationStrategy(context) {
    return this.generatePersonalizedMessage(context.userId, context);
  }

  runStrategyTest(strategy, testData) {
    let totalEngagement = 0;
    let totalConversion = 0;
    
    testData.forEach(testCase => {
      const message = strategy.call(this, testCase.context);
      
      // Simulate engagement based on message relevance
      const relevanceScore = this.calculateRelevanceScore(message, testCase.context);
      const engagement = Math.min(1, relevanceScore * (0.7 + Math.random() * 0.3));
      const conversion = engagement > 0.6 ? (Math.random() > 0.3 ? 1 : 0) : 0;
      
      totalEngagement += engagement;
      totalConversion += conversion;
    });

    return {
      avgEngagement: totalEngagement / testData.length,
      conversionRate: totalConversion / testData.length,
      effectivenessScore: (totalEngagement + totalConversion) / (testData.length * 2)
    };
  }

  calculateRelevanceScore(message, context) {
    let score = 0.5; // Base score
    
    // Check productivity style alignment
    if (context.userProfile?.productivityStyle) {
      const styleKeywords = {
        sprinter: ['quick', 'fast', 'sprint', 'burst', 'speed'],
        marathoner: ['steady', 'consistent', 'flow', 'rhythm', 'step'],
        perfectionist: ['quality', 'excellence', 'craft', 'detail', 'polish']
      };
      
      const keywords = styleKeywords[context.userProfile.productivityStyle] || [];
      const messageText = (message.title + ' ' + message.body).toLowerCase();
      
      keywords.forEach(keyword => {
        if (messageText.includes(keyword)) score += 0.1;
      });
    }
    
    // Check energy level alignment
    if (context.energyLevel) {
      const energyKeywords = {
        high: ['energy', 'power', 'surge', 'fire', 'peak'],
        medium: ['steady', 'flow', 'consistent', 'balanced'],
        low: ['gentle', 'easy', 'simple', 'light', 'calm']
      };
      
      const keywords = energyKeywords[context.energyLevel] || [];
      const messageText = (message.title + ' ' + message.body).toLowerCase();
      
      keywords.forEach(keyword => {
        if (messageText.includes(keyword)) score += 0.15;
      });
    }
    
    return Math.min(1, score);
  }
}

// Test execution
async function runPhase1Test() {
  console.log('🧪 Phase 1 Test: Enhanced Message Personalization');
  console.log('================================================');
  
  const engine = new EnhancedPersonalizationEngine();
  
  // Generate test data
  const testData = generateTestData(100);
  
  // Test personalization strategies
  console.log('\n📊 Testing Personalization Strategies...');
  const results = engine.testPersonalizationStrategies(testData);
  
  console.log('\n=== STRATEGY COMPARISON ===');
  Object.entries(results).forEach(([strategy, metrics]) => {
    console.log(`${strategy.toUpperCase()}:`);
    console.log(`  Engagement: ${(metrics.avgEngagement * 100).toFixed(1)}%`);
    console.log(`  Conversion: ${(metrics.conversionRate * 100).toFixed(1)}%`);
    console.log(`  Effectiveness: ${(metrics.effectivenessScore * 100).toFixed(1)}%`);
    console.log('');
  });
  
  // Calculate improvement
  const baselineEffectiveness = results.baseline.effectivenessScore;
  const bestEffectiveness = Math.max(...Object.values(results).map(r => r.effectivenessScore));
  const improvement = ((bestEffectiveness - baselineEffectiveness) / baselineEffectiveness) * 100;
  
  console.log('=== PHASE 1 RESULTS ===');
  console.log(`Baseline Effectiveness: ${(baselineEffectiveness * 100).toFixed(1)}%`);
  console.log(`Best Strategy Effectiveness: ${(bestEffectiveness * 100).toFixed(1)}%`);
  console.log(`Improvement: +${improvement.toFixed(1)}%`);
  
  // Projected system impact
  const currentSystemEffectiveness = 0.67;
  const projectedImprovement = currentSystemEffectiveness * (improvement / 100);
  const newEffectiveness = currentSystemEffectiveness + projectedImprovement;
  
  console.log(`\nProjected System Impact:`);
  console.log(`Current: ${(currentSystemEffectiveness * 100).toFixed(1)}%`);
  console.log(`Projected: ${(newEffectiveness * 100).toFixed(1)}%`);
  console.log(`Target Met: ${newEffectiveness >= 0.72 ? '✅ YES' : '❌ NO'}`);
  
  return {
    baseline: baselineEffectiveness,
    optimized: bestEffectiveness,
    improvement: improvement,
    projectedSystemEffectiveness: newEffectiveness,
    targetMet: newEffectiveness >= 0.72
  };
}

function generateTestData(count) {
  const testData = [];
  
  for (let i = 0; i < count; i++) {
    testData.push({
      userId: `user_${i}`,
      context: {
        userProfile: {
          productivityStyle: ['sprinter', 'marathoner', 'perfectionist'][Math.floor(Math.random() * 3)],
          energyPattern: generateEnergyPattern(),
          taskPreferences: ['creative', 'analytical', 'communication'],
          communicationStyle: {
            emojiUsage: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            lengthPreference: Math.random() > 0.5 ? 'concise' : 'detailed',
            tonePreference: Math.random() > 0.5 ? 'casual' : 'professional'
          }
        },
        taskCategory: ['creative', 'analytical', 'communication'][Math.floor(Math.random() * 3)],
        urgency: Math.random() > 0.7 ? 'urgent' : 'encouraging',
        energyLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        timeOfDay: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)]
      }
    });
  }
  
  return testData;
}

function generateEnergyPattern() {
  const pattern = {};
  for (let hour = 0; hour < 24; hour++) {
    // Simulate realistic energy patterns
    let energy = 'medium';
    if (hour >= 6 && hour <= 10) energy = 'high'; // Morning peak
    else if (hour >= 14 && hour <= 16) energy = 'high'; // Afternoon peak
    else if (hour >= 22 || hour <= 5) energy = 'low'; // Night/early morning
    
    pattern[hour] = energy;
  }
  return pattern;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runPhase1Test, EnhancedPersonalizationEngine };
} else {
  runPhase1Test().catch(console.error);
}