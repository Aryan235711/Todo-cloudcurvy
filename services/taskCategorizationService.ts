// Smart Task Categorization Engine
import { Category } from '../types';

interface CategoryKeywords {
  [key: string]: string[];
}

class TaskCategorizationService {
  private categoryKeywords: CategoryKeywords = {
    work: [
      // Meetings & Communication
      'meeting', 'call', 'email', 'conference', 'zoom', 'teams', 'slack', 'phone call',
      'video call', 'standup', 'sync', 'catchup', 'one-on-one', 'follow up', 'reach out',
      
      // Projects & Tasks
      'project', 'deadline', 'presentation', 'report', 'proposal', 'budget', 'task',
      'deliverable', 'milestone', 'sprint', 'backlog', 'feature', 'bug', 'issue', 'ticket',
      'code', 'develop', 'build', 'deploy', 'test', 'debug', 'fix', 'implement',
      
      // People & Roles
      'client', 'boss', 'colleague', 'manager', 'team', 'coworker', 'supervisor',
      'employee', 'staff', 'vendor', 'contractor', 'stakeholder', 'customer',
      
      // Documents & Admin
      'document', 'file', 'paperwork', 'form', 'contract', 'invoice', 'receipt',
      'submit', 'deliver', 'complete', 'finish', 'review', 'approve', 'sign',
      'upload', 'download', 'backup', 'archive', 'organize files',
      
      // Workplace & Events
      'office', 'workplace', 'desk', 'computer', 'laptop', 'work', 'job', 'career',
      'interview', 'training', 'workshop', 'seminar', 'conference', 'networking',
      'schedule', 'calendar', 'appointment', 'business trip', 'travel for work'
    ],
    
    personal: [
      // Family & Relationships
      'family', 'friend', 'spouse', 'partner', 'kids', 'children', 'parents',
      'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'grandparents',
      'call mom', 'call dad', 'visit family', 'babysit', 'pickup kids',
      
      // Social & Events
      'birthday', 'anniversary', 'wedding', 'party', 'celebration', 'date night',
      'dinner', 'lunch', 'breakfast', 'coffee', 'drinks', 'hangout', 'meetup',
      'visit', 'social', 'friends', 'gathering', 'barbecue', 'picnic',
      
      // Entertainment & Hobbies
      'hobby', 'book', 'read', 'movie', 'film', 'tv show', 'netflix', 'music',
      'concert', 'game', 'video game', 'board game', 'puzzle', 'craft', 'art',
      'photography', 'painting', 'drawing', 'writing', 'journal', 'blog',
      
      // Travel & Leisure
      'vacation', 'trip', 'travel', 'holiday', 'weekend', 'getaway', 'flight',
      'hotel', 'booking', 'pack', 'luggage', 'passport', 'visa', 'itinerary',
      
      // Home & Household
      'home', 'house', 'apartment', 'room', 'clean', 'organize', 'declutter',
      'laundry', 'dishes', 'vacuum', 'mop', 'dust', 'tidy', 'maintenance',
      'repair', 'fix', 'garden', 'yard work', 'lawn', 'plants', 'water plants',
      
      // Shopping & Errands
      'shopping', 'buy', 'purchase', 'groceries', 'grocery store', 'market',
      'mall', 'store', 'online shopping', 'order', 'delivery', 'pickup',
      'gift', 'present', 'return', 'exchange', 'bank', 'atm', 'post office',
      
      // Pets & Animals
      'pet', 'dog', 'cat', 'puppy', 'kitten', 'vet', 'walk dog', 'feed pet',
      'pet food', 'grooming', 'pet appointment', 'animal',
      
      // Cooking & Food
      'cook', 'recipe', 'meal prep', 'bake', 'kitchen', 'food', 'eat',
      'restaurant', 'takeout', 'order food', 'meal planning'
    ],
    
    health: [
      // Medical & Healthcare
      'doctor', 'physician', 'appointment', 'checkup', 'medical', 'clinic',
      'hospital', 'emergency room', 'urgent care', 'specialist', 'consultation',
      'surgery', 'procedure', 'test', 'blood test', 'x-ray', 'scan', 'mri',
      
      // Dental & Vision
      'dentist', 'dental', 'teeth', 'cleaning', 'cavity', 'orthodontist',
      'eye doctor', 'optometrist', 'glasses', 'contacts', 'eye exam',
      
      // Mental Health
      'therapy', 'therapist', 'counseling', 'psychologist', 'psychiatrist',
      'mental health', 'stress', 'anxiety', 'depression', 'mindfulness',
      'meditation', 'breathing', 'relaxation', 'self-care', 'wellness',
      
      // Medications & Pharmacy
      'medicine', 'medication', 'prescription', 'pharmacy', 'pills', 'refill',
      'vitamins', 'supplements', 'dosage', 'take medicine', 'drug store',
      
      // Fitness & Exercise
      'exercise', 'workout', 'gym', 'fitness', 'training', 'run', 'jog',
      'walk', 'hike', 'bike', 'swim', 'yoga', 'pilates', 'stretch',
      'cardio', 'strength', 'weights', 'muscle', 'abs', 'legs', 'arms',
      
      // Diet & Nutrition
      'diet', 'nutrition', 'healthy eating', 'calories', 'protein', 'carbs',
      'vegetables', 'fruits', 'water', 'hydrate', 'meal plan', 'weight loss',
      'weight gain', 'nutritionist', 'dietitian',
      
      // Sleep & Recovery
      'sleep', 'rest', 'nap', 'bedtime', 'insomnia', 'tired', 'fatigue',
      'recovery', 'massage', 'spa', 'sauna', 'hot tub',
      
      // Health Tracking
      'steps', 'fitbit', 'apple watch', 'heart rate', 'blood pressure',
      'weight', 'scale', 'health app', 'track', 'monitor', 'log'
    ]
  };

  categorizeTask(taskText: string): Category {
    const text = taskText.toLowerCase().trim();
    
    // Calculate scores for each category
    const scores = {
      work: this.calculateCategoryScore(text, 'work'),
      personal: this.calculateCategoryScore(text, 'personal'),
      health: this.calculateCategoryScore(text, 'health')
    };

    // Find the category with the highest score
    const maxScore = Math.max(scores.work, scores.personal, scores.health);
    
    // If no clear match (score too low), default to 'other'
    if (maxScore < 0.3) {
      return 'other';
    }

    // Return the category with the highest score
    if (scores.work === maxScore) return 'work';
    if (scores.personal === maxScore) return 'personal';
    if (scores.health === maxScore) return 'health';
    
    return 'other';
  }

  private calculateCategoryScore(text: string, category: keyof CategoryKeywords): number {
    const keywords = this.categoryKeywords[category];
    let score = 0;
    let matches = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        // Give higher weight to exact matches and longer keywords
        const weight = keyword.length > 5 ? 1.5 : 1.0;
        score += weight;
      }
    }

    // Normalize score by text length and keyword count
    const normalizedScore = score / Math.max(text.split(' ').length, 1);
    
    return normalizedScore;
  }

  // Method to add custom keywords for better personalization
  addCustomKeywords(category: Category, keywords: string[]) {
    if (category === 'other') return; // Can't add keywords to 'other'
    
    if (!this.categoryKeywords[category]) {
      this.categoryKeywords[category] = [];
    }
    
    this.categoryKeywords[category].push(...keywords.map(k => k.toLowerCase()));
  }

  // Method to get category confidence for debugging
  getCategoryConfidence(taskText: string) {
    const text = taskText.toLowerCase().trim();
    
    return {
      work: this.calculateCategoryScore(text, 'work'),
      personal: this.calculateCategoryScore(text, 'personal'),
      health: this.calculateCategoryScore(text, 'health'),
      predicted: this.categorizeTask(taskText)
    };
  }
}

export const taskCategorizationService = new TaskCategorizationService();