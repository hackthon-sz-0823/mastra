import { WasteAnalysisResult, ClassificationScore, ScoringMetrics } from "../types/waste-types";

export class WasteClassificationScorer {
  static calculateScore(
    detected: string,
    expected: string,
    confidence: number,
    analysis: WasteAnalysisResult
  ): ClassificationScore {
    const metrics = this.getBasicMetrics(detected, expected, confidence);
    const score = this.computeFinalScore(metrics, analysis);
    const reasoning = this.generateReasoning(metrics, analysis);
    const suggestions = this.generateSuggestions(metrics, analysis);
    const improvementTips = this.generateImprovementTips(metrics);

    return {
      match: metrics.exactMatch || metrics.categoryMatch,
      score,
      reasoning,
      suggestions,
      improvementTips
    };
  }

  private static getBasicMetrics(
    detected: string,
    expected: string,
    confidence: number
  ): ScoringMetrics {
    const exactMatch = detected.toLowerCase().trim() === expected.toLowerCase().trim();
    const categoryMatch = this.isSameCategoryGroup(detected, expected);
    const confidenceScore = confidence * 100;

    let baseScore = 0;
    if (exactMatch) {
      baseScore = 95;
    } else if (categoryMatch) {
      baseScore = 75;
    } else {
      baseScore = 25;
    }

    // 根据置信度调整分数
    const confidenceAdjustment = (confidence - 0.6) * 15;
    const finalScore = Math.max(0, Math.min(100, baseScore + confidenceAdjustment));

    return {
      exactMatch,
      categoryMatch,
      confidenceScore,
      finalScore: Math.round(finalScore)
    };
  }

  private static computeFinalScore(metrics: ScoringMetrics, analysis: WasteAnalysisResult): number {
    let score = metrics.finalScore;
    
    // 根据特征数量奖励分数
    if (analysis.characteristics.length >= 3) {
      score += 2;
    }
    
    // 根据描述详细程度调整
    if (analysis.description.length > 50) {
      score += 3;
    }

    return Math.min(100, score);
  }

  private static generateReasoning(metrics: ScoringMetrics, analysis: WasteAnalysisResult): string {
    let reasoning = "";
    
    if (metrics.exactMatch) {
      reasoning = "✅ 完全匹配：AI识别结果与预期分类完全一致";
    } else if (metrics.categoryMatch) {
      reasoning = "🟡 类别匹配：识别结果与预期分类属于同一大类";
    } else {
      reasoning = "❌ 分类错误：识别结果与预期分类不匹配";
    }
    
    reasoning += `\n📊 AI置信度：${metrics.confidenceScore.toFixed(1)}%`;
    reasoning += `\n🔍 识别到的特征：${analysis.characteristics.join(", ")}`;
    
    return reasoning;
  }

  private static generateSuggestions(metrics: ScoringMetrics, analysis: WasteAnalysisResult): string[] {
    const suggestions: string[] = [];
    
    if (!metrics.exactMatch && !metrics.categoryMatch) {
      suggestions.push("建议重新检查图片质量和角度");
      suggestions.push("确认垃圾分类标准是否正确理解");
    }
    
    if (metrics.confidenceScore < 60) {
      suggestions.push("图片可能不够清晰，建议重新拍摄");
      suggestions.push("确保垃圾物品在图片中清晰可见");
    }
    
    if (analysis.characteristics.length < 2) {
      suggestions.push("AI识别的特征较少，可能需要更清晰的图片");
    }
    
    suggestions.push(`参考处理方式：${analysis.disposalInstructions}`);
    
    return suggestions;
  }

  private static generateImprovementTips(metrics: ScoringMetrics): string[] {
    const tips: string[] = [];
    
    if (metrics.confidenceScore < 80) {
      tips.push("💡 拍摄时确保光线充足");
      tips.push("💡 将垃圾放在简洁的背景前");
      tips.push("💡 确保垃圾占据图片的主要部分");
    }
    
    if (!metrics.exactMatch) {
      tips.push("📚 学习垃圾分类标准，了解各类垃圾的特征");
      tips.push("🔄 多练习不同类型垃圾的识别");
    }
    
    return tips;
  }

  private static isSameCategoryGroup(category1: string, category2: string): boolean {
    const categoryGroups = {
      recyclable: ["可回收垃圾", "recyclable", "塑料", "纸类", "金属", "玻璃", "纸张", "瓶子"],
      hazardous: ["有害垃圾", "hazardous", "电池", "药品", "化学品", "灯泡", "温度计"],
      wet: ["湿垃圾", "wet", "厨余垃圾", "食物残渣", "有机垃圾", "果皮", "剩菜", "食物"],
      dry: ["干垃圾", "dry", "其他垃圾", "一般垃圾", "烟蒂", "尘土", "陶瓷"]
    };
    
    for (const group of Object.values(categoryGroups)) {
      const cat1InGroup = group.some(item => 
        category1.toLowerCase().includes(item.toLowerCase()) || 
        item.toLowerCase().includes(category1.toLowerCase())
      );
      const cat2InGroup = group.some(item => 
        category2.toLowerCase().includes(item.toLowerCase()) || 
        item.toLowerCase().includes(category2.toLowerCase())
      );
      
      if (cat1InGroup && cat2InGroup) {
        return true;
      }
    }
    
    return false;
  }
}