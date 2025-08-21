export interface WasteClassificationInput {
  imageUrl: string;
  expectedCategory: string;
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

// 完整的数据库记录结构
export interface ClassificationRecord {
  // 基础信息
  imageUrl: string;
  expectedCategory: string; // 对应 expected_category
  
  // AI 分析结果
  aiDetectedCategory: string; // 对应 ai_detected_category
  aiConfidence: number; // 对应 ai_confidence (0.00-1.00)
  isCorrect: boolean; // 对应 is_correct
  score: number; // 对应 score
  aiAnalysis: string; // 对应 ai_analysis
  aiResponse: object; // 对应 ai_response (JSON)
  processingTimeMs: number; // 对应 processing_time_ms
  
  // 时间戳 (后端添加)
  createdAt?: string;
  updatedAt?: string;
}

export interface WasteClassificationResult {
  input: WasteClassificationInput;
  analysis: WasteAnalysisResult;
  scoring: ClassificationScore;
  
  // 数据库字段
  record: ClassificationRecord;
  
  // 元数据
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

// 扩展的分析结果，包含详细信息
export interface DetailedAnalysisResult extends WasteAnalysisResult {
  processingTimeMs: number;
  rawResponse: object;
  analysisSteps: string[];
  confidenceFactors: string[];
}

// 简化的数据库字段响应 - 只包含需要的7个字段
export interface SimpleClassificationResponse {
  ai_detected_category: string;    // AI识别出的垃圾分类
  ai_confidence: number;           // AI识别置信度(0.00-1.00) 
  is_correct: boolean;             // 分类是否正确
  score: number;                   // 本次分类获得的积分
  ai_analysis: string;             // AI详细分析文本
  ai_response: object;             // 完整的AI响应数据
  processing_time_ms: number;      // AI处理耗时(毫秒)
}

// API 输入参数
export interface SimpleClassificationInput {
  imageUrl: string;                // 图片链接
  expectedCategory: string;        // 用户填写的垃圾类型
}