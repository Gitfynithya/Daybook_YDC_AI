export type ReflectionMode = 
  | 'reflect' 
  | 'summary' 
  | 'brainstorm' 
  | 'action' 
  | 'deep_question';

export interface JournalInteraction {
  id: string;
  role: 'user' | 'model';
  text: string;
  mode?: ReflectionMode;
  modelUsed?: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  summary?: string;
  createdAt: number;
  updatedAt: number;
  interactions: JournalInteraction[];
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

export interface ThreatModelZone {
  zone: string;
  threat: string;
  countermeasure: string;
  status: 'active' | 'enforced';
}

export interface ReminderTask {
  id: string;
  task: string;
  targetDate?: string;
  urgency: 'high' | 'medium' | 'low';
  context: string;
  sourceEntryTitle?: string;
  sourceEntryId?: string;
  completed?: boolean;
}

export interface MotivationInsight {
  quote?: string;
  message: string;
  focusArea?: string;
  journalingPrompt?: string;
}

export interface ReminderAnalysisResult {
  hasReminders: boolean;
  reminders: ReminderTask[];
  motivation: MotivationInsight;
  analyzedEntriesCount: number;
  lastAnalyzedAt: number;
  modelUsed?: string;
}

export interface SessionLocationInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  org?: string;
  timestamp?: number;
}

