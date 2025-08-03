export interface WasteClassificationInput {
  imageUrl: string;
  expectedCategory: string;
  userLocation?: string;
}

export interface WasteAnalysisResult {
  detectedCategory: string;
  confidence: number;
  description: string;
  characteristics: string[];
  materialType: string;
  disposalInstructions: string;
}

export interface ClassificationScore {
  match: boolean;
  score: number; // 0-100
  reasoning: string;
  suggestions: string[];
  improvementTips: string[];
}

export interface WasteClassificationResult {
  input: WasteClassificationInput;
  analysis: WasteAnalysisResult;
  scoring: ClassificationScore;
  timestamp: string;
  processingTime: number;
}

export enum WasteCategory {
  RECYCLABLE = "可回收垃圾",
  HAZARDOUS = "有害垃圾",
  WET = "湿垃圾", 
  DRY = "干垃圾"
}

export interface ScoringMetrics {
  exactMatch: boolean;
  categoryMatch: boolean;
  confidenceScore: number;
  finalScore: number;
}