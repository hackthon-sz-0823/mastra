import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const inputSchema = z.object({
  imageUrl: z.string().url(),
  expectedCategory: z.string(),
  userLocation: z.string().optional()
});

const analysisStep = createStep({
  id: "analyze-image",
  description: "分析垃圾图片",
  inputSchema,
  outputSchema: z.object({
    detectedCategory: z.string(),
    confidence: z.number(),
    description: z.string(),
    characteristics: z.array(z.string()),
    materialType: z.string(),
    disposalInstructions: z.string(),
    expectedCategory: z.string(), // 传递给下一步
    userLocation: z.string().optional()
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent("wasteClassifier");
    if (!agent) throw new Error("Waste classifier agent not found");
    
    const prompt = `请使用图像分析工具分析这张垃圾图片：
    - 图片URL: ${inputData.imageUrl}
    - 用户位置: ${inputData.userLocation || '中国'}
    
    请调用 analyze-waste-image 工具进行分析。`;
    
    const response = await agent.generate(prompt);
    
    // 从agent响应中提取工具调用结果
    try {
      const result = JSON.parse(response.text);
      return {
        ...result,
        expectedCategory: inputData.expectedCategory, // 传递期望分类
        userLocation: inputData.userLocation
      };
    } catch {
      // 如果解析失败，返回默认结构
      return {
        detectedCategory: "识别失败",
        confidence: 0,
        description: "工作流执行过程中解析响应失败",
        characteristics: ["解析错误"],
        materialType: "未知",
        disposalInstructions: "请重试或手动分类",
        expectedCategory: inputData.expectedCategory,
        userLocation: inputData.userLocation
      };
    }
  }
});

const scoringStep = createStep({
  id: "score-result", 
  description: "评分分类结果",
  inputSchema: z.object({
    detectedCategory: z.string(),
    confidence: z.number(),
    description: z.string(),
    characteristics: z.array(z.string()),
    materialType: z.string(),
    disposalInstructions: z.string(),
    expectedCategory: z.string(),
    userLocation: z.string().optional()
  }),
  outputSchema: z.object({
    score: z.number(),
    match: z.boolean(),
    reasoning: z.string(),
    suggestions: z.array(z.string()),
    improvementTips: z.array(z.string()),
    detailedAnalysis: z.string(),
    learningPoints: z.array(z.string()),
    // 保留分析数据给最终步骤
    analysisData: z.object({
      detectedCategory: z.string(),
      confidence: z.number(),
      description: z.string(),
      characteristics: z.array(z.string()),
      materialType: z.string(),
      disposalInstructions: z.string()
    })
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent("wasteClassifier");
    if (!agent) throw new Error("Waste classifier agent not found");
    
    const { expectedCategory, userLocation, ...analysisResult } = inputData;
    const prompt = `请使用评分工具对以下分类结果进行评分：
    - 检测结果：${analysisResult.detectedCategory}
    - 预期分类：${expectedCategory}
    - 置信度：${analysisResult.confidence}
    - 描述：${analysisResult.description}
    - 特征：${analysisResult.characteristics.join(", ")}
    - 材料类型：${analysisResult.materialType}
    - 处理指导：${analysisResult.disposalInstructions}
    
    请调用 score-classification-result 工具进行详细评分。`;
    
    const response = await agent.generate(prompt);
    
    try {
      const result = JSON.parse(response.text);
      return {
        ...result,
        analysisData: analysisResult // 保留分析数据
      };
    } catch {
      // 如果解析失败，返回基础评分
      const basicScore = analysisResult.detectedCategory.toLowerCase() === expectedCategory.toLowerCase() ? 90 : 30;
      return {
        score: basicScore,
        match: basicScore > 70,
        reasoning: "工作流评分解析失败，使用基础评分逻辑",
        suggestions: ["建议重新执行工作流", "检查网络连接"],
        improvementTips: ["确保图片清晰", "重新尝试分析"],
        detailedAnalysis: "评分分析生成失败，但基础功能正常",
        learningPoints: ["基础分类逻辑正常工作"],
        analysisData: analysisResult
      };
    }
  }
});

const summaryStep = createStep({
  id: "generate-summary",
  description: "生成最终总结",
  inputSchema: z.object({
    score: z.number(),
    match: z.boolean(),
    reasoning: z.string(),
    suggestions: z.array(z.string()),
    improvementTips: z.array(z.string()),
    detailedAnalysis: z.string(),
    learningPoints: z.array(z.string()),
    analysisData: z.object({
      detectedCategory: z.string(),
      confidence: z.number(),
      description: z.string(),
      characteristics: z.array(z.string()),
      materialType: z.string(),
      disposalInstructions: z.string()
    })
  }),
  outputSchema: z.object({
    analysisResult: z.object({
      detectedCategory: z.string(),
      confidence: z.number(),
      description: z.string(),
      characteristics: z.array(z.string()),
      materialType: z.string(),
      disposalInstructions: z.string()
    }),
    scoringResult: z.object({
      score: z.number(),
      match: z.boolean(),
      reasoning: z.string(),
      suggestions: z.array(z.string()),
      improvementTips: z.array(z.string()),
      detailedAnalysis: z.string(),
      learningPoints: z.array(z.string())
    }),
    summary: z.object({
      finalScore: z.number(),
      recommendation: z.string(),
      timestamp: z.string()
    })
  }),
  execute: async ({ inputData }) => {
    const { analysisData, ...scoringResult } = inputData;
    
    let recommendation = "";
    if (scoringResult.score >= 85) {
      recommendation = "🎉 优秀！分类准确，继续保持这种水平。";
    } else if (scoringResult.score >= 70) {
      recommendation = "👍 良好！分类基本正确，可以继续改进图片质量。";
    } else if (scoringResult.score >= 50) {
      recommendation = "⚠️ 需要改进！建议学习垃圾分类标准，提高识别准确性。";
    } else {
      recommendation = "❌ 需要重新学习！建议仔细阅读垃圾分类指南。";
    }
    
    return {
      analysisResult: analysisData,
      scoringResult,
      summary: {
        finalScore: scoringResult.score,
        recommendation,
        timestamp: new Date().toISOString()
      }
    };
  }
});

export const classificationWorkflow = createWorkflow({
  id: "waste-classification-workflow",
  description: "垃圾分类识别和评分完整工作流",
  inputSchema,
  outputSchema: z.object({
    analysisResult: z.object({
      detectedCategory: z.string(),
      confidence: z.number(),
      description: z.string(),
      characteristics: z.array(z.string()),
      materialType: z.string(),
      disposalInstructions: z.string()
    }),
    scoringResult: z.object({
      score: z.number(),
      match: z.boolean(),
      reasoning: z.string(),
      suggestions: z.array(z.string()),
      improvementTips: z.array(z.string()),
      detailedAnalysis: z.string(),
      learningPoints: z.array(z.string())
    }),
    summary: z.object({
      finalScore: z.number(),
      recommendation: z.string(),
      timestamp: z.string()
    })
  })
})
  .then(analysisStep)
  .then(scoringStep)
  .then(summaryStep)
  .commit();