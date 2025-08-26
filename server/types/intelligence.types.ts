// LoveMemory Intelligence Core Types

export interface UserData {
  id: string;
  name: string;
  email: string;
  gender?: string;
  city?: string;
  location?: string;
  coins: number;
  avatar?: string;
  created_at: Date;
  timezone?: string;
  language?: string;
}

export interface PartnerData {
  id: string;
  name: string;
  gender?: string;
  city?: string;
  location?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
}

export interface EventData {
  id: string;
  title: string;
  description?: string;
  event_date: Date;
  end_date?: Date;
  event_type: string;
  location?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface AIInteraction {
  id: string;
  prompt: string;
  response: string;
  intent: AIIntent;
  rating?: number;
  createdAt: Date;
}

export interface ActivityLogData {
  id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  created_at: Date;
}

export interface PairData {
  id: string;
  created_at: Date;
  status: 'active' | 'inactive' | 'pending';
  pair_name?: string;
  anniversary_date?: Date;
  relationship_stage?: string;
}

// Love Languages
export interface LoveLanguages {
  physical_touch: number;      // 0-1
  quality_time: number;        // 0-1  
  words_of_affirmation: number; // 0-1
  acts_of_service: number;     // 0-1
  receiving_gifts: number;     // 0-1
}

// Relationship Graph
export interface RelationshipNode {
  id: string;
  label: string;
  strength: number; // 0-100
  color: string;
  icon: string;
  x: number;
  y: number;
  activities: number;
  lastActivity: string;
  description: string;
}

export interface RelationshipConnection {
  from: string;
  to: string;
  strength: number; // 0-100
  type: 'strong' | 'medium' | 'weak' | 'potential';
}

export interface RelationshipGraph {
  nodes: RelationshipNode[];
  connections: RelationshipConnection[];
  overallStrength: number; // 0-100
}

// Activity Patterns
export interface TimePreferences {
  morning: number;   // 0-1
  afternoon: number; // 0-1
  evening: number;   // 0-1
  night: number;     // 0-1
}

export interface ActivityPatterns {
  timePreferences: TimePreferences;
  budgetLevel: 'low' | 'medium' | 'high';
  categoryPreferences: Record<string, number>;
  frequencyScore: number; // 0-1
}

// Communication Style
export interface CommunicationStyle {
  preferredTone: 'friendly' | 'romantic' | 'playful' | 'wise';
  responseLength: 'short' | 'medium' | 'long';
  humorLevel: number; // 0-1
  formalityLevel: number; // 0-1
}

// AI Interaction Quality
export interface AIInteractionQuality {
  averageRating: number;
  totalInteractions: number;
  positiveResponses: number;
  negativeResponses: number;
  lastInteractionAt?: Date;
}

// Relationship Profile (main entity)
export interface RelationshipProfile {
  id: string;
  userId: string;
  loveLanguages: LoveLanguages;
  relationshipGraph: RelationshipGraph;
  sentimentTrend: number; // -1 to 1
  activityPatterns: ActivityPatterns;
  communicationStyle: CommunicationStyle;
  aiInteractionQuality: AIInteractionQuality;
  version: number;
  lastAnalyzedAt: Date;
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

// User Context (что передаем в AI)
export interface UserContextMetadata {
  contextBuiltAt: Date;
  dataFreshness: 'fresh' | 'moderate' | 'stale';
  hasPartner: boolean;
  totalEvents: number;
  totalInteractions: number;
  contextType?: 'full' | 'light';
}

export interface UserContext {
  user: UserData;
  partner?: PartnerData;
  recentEvents: EventData[];
  aiInteractionHistory: AIInteraction[];
  relationshipProfile: RelationshipProfile;
  activityLogs: ActivityLogData[];
  pairData?: PairData;
  metadata: UserContextMetadata;
}

// AI Intents
export type AIIntent = 
  | 'CHAT'
  | 'GENERATE_DATE'
  | 'ANALYZE_RELATIONSHIP'
  | 'LOVE_LANGUAGE_ANALYSIS'
  | 'MEMORY_RECALL'
  | 'JOKE'
  | 'DANCE'
  | 'ADVICE'
  | 'MOOD_BOOST'
  | 'HIDE';

// AI Response Types
export interface AIResponse {
  message?: string;
  data?: any;
  intent: AIIntent;
  confidence?: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

// Date Generation Types
export interface DateOption {
  id: string;
  title: string;
  description: string;
  schedule: DateScheduleItem[];
  estimatedCost: number;
  duration: number; // hours
  atmosphere: 'romantic' | 'fun' | 'balanced';
  reasoning: string;
  isRealData: boolean;
  activitiesCount: number;
}

export interface DateScheduleItem {
  time: string;
  endTime: string;
  activity: string;
  description: string;
  location?: string;
  cost?: number;
  type?: string;
}

export interface DateGenerationRequest {
  context: UserContext;
  preferences?: {
    budget?: 'low' | 'medium' | 'high';
    duration?: 'short' | 'medium' | 'long';
    atmosphere?: 'romantic' | 'fun' | 'active' | 'cultural';
  };
}

export interface DateGenerationResponse {
  options: DateOption[];
  reasoning: string[];
  metadata: {
    generatedAt: Date;
    usedRealData: boolean;
    confidence: number;
  };
}

// Analysis Engine Types
export interface AnalysisRequest {
  userId: string;
  forceReanalysis?: boolean;
  analysisType?: 'full' | 'love_languages' | 'sentiment' | 'activity_patterns';
}

export interface AnalysisResult {
  userId: string;
  analysisType: string;
  result: any;
  confidence: number;
  analyzedAt: Date;
  dataUsed: {
    eventsCount: number;
    interactionsCount: number;
    timeRange: {
      from: Date;
      to: Date;
    };
  };
}

// Service Interfaces
export interface IUserContextService {
  buildContext(userId: string): Promise<UserContext>;
  buildLightContext(userId: string): Promise<Partial<UserContext>>;
  saveAIInteraction(userId: string, prompt: string, response: string, intent: AIIntent, rating?: number): Promise<void>;
}

export interface IAIOrchestrator {
  handleRequest(prompt: string, userId: string): Promise<AIResponse>;
  recognizeIntent(prompt: string, history: AIInteraction[]): Promise<AIIntent>;
}

export interface IAnalysisEngine {
  analyzeUser(request: AnalysisRequest): Promise<AnalysisResult>;
  updateRelationshipProfile(userId: string, analysisResults: AnalysisResult[]): Promise<RelationshipProfile>;
}

export interface IDateGenerationService {
  generate(request: DateGenerationRequest): Promise<DateGenerationResponse>;
}

// Error Types
export class IntelligenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'IntelligenceError';
  }
}

export class ContextBuildError extends IntelligenceError {
  constructor(message: string, details?: any) {
    super(message, 'CONTEXT_BUILD_ERROR', 500, details);
  }
}

export class AnalysisError extends IntelligenceError {
  constructor(message: string, details?: any) {
    super(message, 'ANALYSIS_ERROR', 500, details);
  }
}

export class AIServiceError extends IntelligenceError {
  constructor(message: string, details?: any) {
    super(message, 'AI_SERVICE_ERROR', 502, details);
  }
}
