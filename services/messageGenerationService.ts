/**
 * Message Generation Service
 * Centralized message generation for notifications with A/B testing support
 */

import { abTestService } from './abTestService';
import { enhancedLearning } from './enhancedLearningEngine';
import { logger } from '../utils/logger';

export interface MessageContext {
  streak: number;
  engagement: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  priority: 'low' | 'medium' | 'high';
  category?: string;
}

export interface MessageOutput {
  title: string;
  body: string;
}

type ToneVariant = 'encouraging' | 'urgent' | 'neutral';
type StreakLevel = 'low' | 'medium' | 'high';

/**
 * Strategy-based message generation service
 * Consolidates contextual and motivational message generation
 */
class MessageGenerationService {
  private readonly validToneVariants: ToneVariant[] = ['encouraging', 'urgent', 'neutral'];

  /**
   * Generate context-aware notification message
   * Uses A/B testing and machine learning predictions
   */
  generateMessage(context: MessageContext, preferMotivational: boolean = true): MessageOutput {
    // Input validation
    if (!this.validateContext(context)) {
      return this.getFallbackMessage();
    }

    // Use enhanced learning for optimal message selection
    const prediction = enhancedLearning.predictOptimalMessageType({
      timeOfDay: context.timeOfDay,
      priority: context.priority,
      streak: context.streak,
      engagement: context.engagement
    });

    // Decide message strategy based on prediction confidence
    if (preferMotivational || prediction.confidence > 0.6) {
      return this.generateMotivationalMessage(context, prediction);
    } else {
      return this.generateContextualMessage(context);
    }
  }

  /**
   * Generate motivational message using A/B testing and streak awareness
   */
  private generateMotivationalMessage(context: MessageContext, prediction?: { prediction: number; confidence: number }): MessageOutput {
    // A/B Test: Message Tone
    const toneVariant = abTestService.getVariant('message_tone');
    const tone = this.getValidatedTone(toneVariant);
    const streakLevel = this.getStreakLevel(context.streak);

    const motivationLibrary = this.buildMotivationLibrary(context);
    const messages = motivationLibrary[streakLevel][tone] || motivationLibrary.low.encouraging;
    
    return this.selectRandomMessage(messages);
  }

  /**
   * Generate contextual message based on time of day and engagement
   */
  private generateContextualMessage(context: MessageContext): MessageOutput {
    const isHighEngagement = context.engagement > 0.7;
    const hasStreak = context.streak > 2;

    const messages = this.buildContextualLibrary(isHighEngagement, hasStreak);
    const timeMessages = messages[context.priority]?.[context.timeOfDay];

    if (!timeMessages || timeMessages.length === 0) {
      return this.getFallbackMessage();
    }

    return this.selectRandomMessage(timeMessages);
  }

  /**
   * Build motivation library based on context
   */
  private buildMotivationLibrary(context: MessageContext): Record<StreakLevel, Record<ToneVariant, [string, string][]>> {
    return {
      low: {
        encouraging: [
          ['🌟 Every step counts', 'Small progress is still progress'],
          ['💪 Building momentum', 'You\'re creating positive habits']
        ],
        urgent: [
          ['⚡ Act now!', 'Don\'t break the chain - keep going'],
          ['🔥 Push forward', 'Momentum dies without action']
        ],
        neutral: [
          ['📊 Progress update', 'Continue with current task'],
          ['⏰ Task reminder', 'Maintain consistency']
        ]
      },
      medium: {
        encouraging: [
          ['🔥 You\'re on a roll!', `${context.streak} tasks completed - keep going!`],
          ['⚡ Momentum building', 'Your consistency is paying off']
        ],
        urgent: [
          ['🚀 Don\'t stop now!', `${context.streak} streak - push harder!`],
          ['💥 Accelerate!', 'Strike while the iron is hot']
        ],
        neutral: [
          ['📈 Streak active', `Current: ${context.streak} completions`],
          ['⚖️ Maintain pace', 'Steady progress continues']
        ]
      },
      high: {
        encouraging: [
          ['🏆 Unstoppable force!', `${context.streak} task streak - you\'re crushing it!`],
          ['👑 Productivity champion', 'Your dedication is inspiring']
        ],
        urgent: [
          ['🔥 BEAST MODE!', `${context.streak} streak - DOMINATE!`],
          ['⚡ UNSTOPPABLE!', 'Channel this power - GO!']
        ],
        neutral: [
          ['📊 High performance', `${context.streak} task completion streak`],
          ['🎯 Optimal state', 'Maintaining peak productivity']
        ]
      }
    };
  }

  /**
   * Build contextual message library
   */
  private buildContextualLibrary(isHighEngagement: boolean, hasStreak: boolean): Record<'high' | 'medium' | 'low', Record<'morning' | 'afternoon' | 'evening' | 'night', [string, string][]>> {
    return {
      high: {
        morning: isHighEngagement ? [
          ['🔥 Ready to crush it?', 'Your high-priority task awaits'],
          ['⚡ Power hour!', 'Tackle this important task now']
        ] : [
          ['⚡ Important task ahead', 'Time to tackle the big one'],
          ['🎯 Priority focus', 'Your critical task is ready']
        ],
        afternoon: hasStreak ? [
          ['🎯 Keep the momentum!', 'Another high-priority win?'],
          ['🔥 Streak power!', 'Channel that energy here']
        ] : [
          ['🚀 Power through this one', 'High-impact task ready'],
          ['⚡ Afternoon focus', 'Important task awaits']
        ],
        evening: [
          ['🌟 Finish strong today', 'One important task left'],
          ['🎯 Evening victory', 'Complete this priority task']
        ],
        night: [
          ['🌙 Quick win before rest?', 'Wrap up this priority task'],
          ['✨ Night owl productivity', 'One important task remains']
        ]
      },
      medium: {
        morning: [
          ['☀️ Good morning!', 'Ready for a productive task?'],
          ['🌅 Start fresh', 'Let\'s tackle this together']
        ],
        afternoon: isHighEngagement ? [
          ['⚡ You\'re on fire!', 'Another task to conquer'],
          ['🔥 Keep going!', 'You\'re doing amazing']
        ] : [
          ['📋 Task reminder', 'Time for the next one'],
          ['⏰ Gentle nudge', 'Your task is waiting']
        ],
        evening: [
          ['🌅 Evening progress', 'One more task to go'],
          ['✨ Sunset productivity', 'Let\'s wrap this up']
        ],
        night: [
          ['✨ Late night productivity?', 'Quick task before bed'],
          ['🌙 Evening wind-down', 'One last task?']
        ]
      },
      low: {
        morning: [
          ['🌱 Small step forward', 'Easy win to start the day'],
          ['☕ Morning warmup', 'Quick task ahead']
        ],
        afternoon: [
          ['🌿 Gentle reminder', 'Small task waiting'],
          ['🍃 Light productivity', 'Easy afternoon win']
        ],
        evening: [
          ['🌸 Easy evening task', 'Quick completion ahead'],
          ['🌺 Relaxed reminder', 'Simple task to finish']
        ],
        night: [
          ['🌼 Before you sleep', 'Quick low-priority task'],
          ['💫 Easy nightcap', 'Simple task remains']
        ]
      }
    };
  }

  /**
   * Validate message context
   */
  private validateContext(context: MessageContext): boolean {
    const validTimes = ['morning', 'afternoon', 'evening', 'night'];
    const validPriorities = ['low', 'medium', 'high'];

    if (!context || typeof context !== 'object') {
      logger.warn('[MessageGeneration] Invalid context object');
      return false;
    }

    if (!validTimes.includes(context.timeOfDay)) {
      logger.warn('[MessageGeneration] Invalid timeOfDay:', context.timeOfDay);
      return false;
    }

    if (!validPriorities.includes(context.priority)) {
      logger.warn('[MessageGeneration] Invalid priority:', context.priority);
      return false;
    }

    if (typeof context.streak !== 'number' || context.streak < 0) {
      logger.warn('[MessageGeneration] Invalid streak:', context.streak);
      return false;
    }

    if (typeof context.engagement !== 'number' || context.engagement < 0 || context.engagement > 1) {
      logger.warn('[MessageGeneration] Invalid engagement:', context.engagement);
      return false;
    }

    return true;
  }

  /**
   * Get validated tone variant
   */
  private getValidatedTone(toneVariant: string | null | undefined): ToneVariant {
    if (toneVariant && this.validToneVariants.includes(toneVariant as ToneVariant)) {
      return toneVariant as ToneVariant;
    }
    if (toneVariant) {
      logger.warn('[MessageGeneration] Invalid tone variant:', toneVariant);
    }
    return 'encouraging'; // Default
  }

  /**
   * Calculate streak level
   */
  private getStreakLevel(streak: number): StreakLevel {
    if (streak > 5) return 'high';
    if (streak > 2) return 'medium';
    return 'low';
  }

  /**
   * Select random message from array
   */
  private selectRandomMessage(messages: [string, string][]): MessageOutput {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const [title, body] = randomMessage;
    return { title, body };
  }

  /**
   * Fallback message when validation fails
   */
  private getFallbackMessage(): MessageOutput {
    return {
      title: '📋 Task reminder',
      body: 'You have a pending task'
    };
  }
}

export const messageGenerationService = new MessageGenerationService();
