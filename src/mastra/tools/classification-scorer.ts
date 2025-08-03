import { createTool } from "@mastra/core/tools";
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
    disposalInstructions: z.string().describe("处理指导")
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
      disposalInstructions 
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const detailedAnalysis = data.choices[0].message.content;

      // 生成学习要点
      const learningPoints = [
        `${detectedCategory}的主要特征：${characteristics.slice(0, 2).join(", ")}`,
        `材料类型：${materialType}`,
        `正确处理方式：${disposalInstructions}`,
        confidence > 0.8 ? "AI识别置信度较高，结果可信度强" : "建议提高图片质量以获得更准确的识别结果"
      ];

      return {
        ...basicScore,
        detailedAnalysis,
        learningPoints
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