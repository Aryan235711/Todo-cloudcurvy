// Voice command parsing for enhanced voice UX
import { taskCategorizationService } from './taskCategorizationService';

export const parseVoiceCommand = (transcript: string): { 
  text: string; 
  priority?: 'high' | 'medium' | 'low';
  isUrgent?: boolean;
  category?: 'work' | 'personal' | 'health' | 'other';
} => {
  const lower = transcript.toLowerCase().trim();
  
  // Priority detection
  let priority: 'high' | 'medium' | 'low' | undefined;
  let isUrgent = false;
  
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately')) {
    priority = 'high';
    isUrgent = true;
  } else if (lower.includes('high priority') || lower.includes('important')) {
    priority = 'high';
  } else if (lower.includes('low priority') || lower.includes('later')) {
    priority = 'low';
  }
  
  // Clean up the text by removing command keywords
  let cleanText = transcript
    .replace(/\b(urgent|asap|immediately|high priority|low priority|important|later)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Smart categorization for voice tasks
  const category = taskCategorizationService.categorizeTask(cleanText);
  
  return {
    text: cleanText,
    priority,
    isUrgent,
    category
  };
};