import { createTool } from "@mastra/core/tools";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { WasteClassificationScorer } from "../../utils/scoring";
import { ClassificationScore } from "../../types/waste-types";

export const classificationScorerTool = createTool({
  id: "score-classification-result",
  description: "对垃圾分类结果进行专业评分和详细分析",
  inputSchema: z.object({
    detectedCategory: z.string().describe("AI检测到的垃圾类别"),
    expectedCategory: z.string().describe("用户输入的预期垃圾类别"),
    confidence: z.number().min(0).max(1).describe("AI识别的置信度"),
    description: z.string().describe("垃圾描述"),
    characteristics: z.array(z.string()).describe("垃圾特征列表"),
    materialType: z.string().describe("材料类型"),
    disposalInstructions: z.string().describe("处理指导"),
    processingTimeMs: z.number().optional().describe("处理耗时毫秒")
  }),
  outputSchema: z.object({
    match: z.boolean().describe("分类是否匹配"),
    score: z.number().min(0).max(100).describe("分类准确性评分"),
    reasoning: z.string().describe("详细评分原因"),
    suggestions: z.array(z.string()).describe("改进建议"),
    improvementTips: z.array(z.string()).describe("学习提升建议"),
    detailedAnalysis: z.string().describe("AI生成的详细分析报告"),
    learningPoints: z.array(z.string()).describe("知识要点")
  }),
  execute: async ({ context }) => {
    const { 
      detectedCategory, 
      expectedCategory, 
      confidence, 
      description, 
      characteristics,
      materialType,
      disposalInstructions,
      processingTimeMs = 0
    } = context;
    
    // 基础评分计算
    const basicScore = WasteClassificationScorer.calculateScore(
      detectedCategory,
      expectedCategory,
      confidence,
      { detectedCategory, confidence, description, characteristics, materialType, disposalInstructions }
    );
    
    // 生成详细分析
    const analysisPrompt = `作为垃圾分类专家，请对以下分类结果进行专业分析：

【识别结果】
- AI检测分类：${detectedCategory}
- 用户预期分类：${expectedCategory}
- AI置信度：${(confidence * 100).toFixed(1)}%
- 材料类型：${materialType}

【垃圾特征】
- 描述：${description}
- 主要特征：${characteristics.join(", ")}
- 处理建议：${disposalInstructions}

【初步评分】
- 匹配状态：${basicScore.match ? "匹配" : "不匹配"}
- 评分：${basicScore.score}分

请提供：
1. 详细的分类准确性分析（考虑AI识别的可靠性）
2. 如果分类不正确，分析可能的原因（图片质量、分类标准理解等）
3. 针对性的改进建议
4. 垃圾分类知识要点
5. 用户学习建议

请用专业但通俗易懂的语言，帮助用户更好地理解垃圾分类。`;

    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'system',
            content: '你是一位专业的垃圾分类评分专家，请根据给定信息提供详细分析。'
          },
          {
            role: 'user', 
            content: analysisPrompt
          }
        ],
        schema: z.object({
          detailedAnalysis: z.string(),
          enhancedSuggestions: z.array(z.string()),
          enhancedTips: z.array(z.string()),
          learningPoints: z.array(z.string())
        }),
        temperature: 0.3,
        maxTokens: 1000
      });

      const aiAnalysis = result.object;

      // 合并AI生成的建议和基础建议
      const enhancedSuggestions = [
        ...basicScore.suggestions,
        ...(aiAnalysis.enhancedSuggestions || [])
      ];

      const enhancedTips = [
        ...basicScore.improvementTips,
        ...(aiAnalysis.enhancedTips || [])
      ];

      const finalLearningPoints = [
        `${detectedCategory}的主要特征：${characteristics.slice(0, 2).join(", ")}`,
        `材料类型：${materialType}`,
        `正确处理方式：${disposalInstructions}`,
        confidence > 0.8 ? "AI识别置信度较高，结果可信度强" : "建议提高图片质量以获得更准确的识别结果",
        ...(aiAnalysis.learningPoints || [])
      ];

      return {
        match: basicScore.match,
        score: basicScore.score,
        reasoning: basicScore.reasoning,
        suggestions: enhancedSuggestions.slice(0, 6), // 限制建议数量
        improvementTips: enhancedTips.slice(0, 6), // 限制提示数量
        detailedAnalysis: aiAnalysis.detailedAnalysis || "详细分析生成中...",
        learningPoints: finalLearningPoints.slice(0, 8) // 限制学习要点数量
      };

    } catch (error) {
      console.error("详细分析生成失败:", error);
      return {
        ...basicScore,
        detailedAnalysis: "分析生成过程中出现错误，请检查网络连接或稍后重试。基础评分功能正常，详细分析暂时不可用。",
        learningPoints: [
          "建议重新尝试获取详细分析",
          "基础评分功能正常工作",
          "如问题持续，请联系技术支持"
        ]
      };
    }
  }
});