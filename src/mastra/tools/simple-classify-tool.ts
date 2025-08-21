import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const simpleClassifyTool = createTool({
  id: "simple-classify-waste",
  description: "简化的垃圾分类分析工具，返回数据库需要的7个字段",
  inputSchema: z.object({
    imageUrl: z.string().url().describe("垃圾图片的URL地址"),
    expectedCategory: z.string().describe("用户填写的垃圾分类")
  }),
  outputSchema: z.object({
    ai_detected_category: z.string().describe("AI识别出的垃圾分类"),
    ai_confidence: z.number().min(0).max(1).describe("AI识别置信度(0.00-1.00)"),
    is_correct: z.boolean().describe("分类是否正确"),
    score: z.number().min(0).max(100).describe("本次分类获得的积分"),
    ai_analysis: z.string().describe("AI详细分析文本"),
    ai_response: z.object({}).describe("完整的AI响应数据"),
    processing_time_ms: z.number().describe("AI处理耗时(毫秒)")
  }),
  execute: async ({ context, mastra }) => {
    const { imageUrl, expectedCategory } = context;
    const startTime = Date.now();
    
    console.log(`🔍 简化工具开始分析: ${imageUrl} -> ${expectedCategory}`);
    
    try {
      // 获取agent
      const agent = mastra?.getAgent("wasteClassifier");
      if (!agent) {
        throw new Error("Waste classifier agent not found");
      }

      // 构建分析提示
      const prompt = `请分析这张垃圾图片并返回数据库格式的结果：

输入信息：
- 图片URL: ${imageUrl}
- 用户预期分类: ${expectedCategory}

请按照以下步骤：
1. 使用 analyze-waste-image 工具分析图片
2. 使用 score-classification-result 工具评分
3. 返回JSON格式，包含以下字段：
   - ai_detected_category: AI识别的分类
   - ai_confidence: 置信度(0.00-1.00)
   - is_correct: 分类是否正确
   - score: 评分(0-100)
   - ai_analysis: 详细分析文本
   - ai_response: 完整响应数据
   - processing_time_ms: 处理耗时

请确保返回的是纯JSON格式，不要包含其他文字。`;

      console.log(`🤖 调用Agent进行分析...`);
      const response = await agent.generate(prompt);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // 尝试解析响应
      let analysisResult;
      try {
        analysisResult = JSON.parse(response.text);
      } catch (parseError) {
        console.warn("Agent 响应不是纯JSON，使用默认格式");
        analysisResult = {
          ai_detected_category: "解析失败",
          ai_confidence: 0.0,
          is_correct: false,
          score: 0,
          ai_analysis: `响应解析失败，原始响应: ${response.text}`,
          ai_response: { raw: response.text },
          processing_time_ms: processingTime
        };
      }

      // 数据验证和清理
      const result = {
        ai_detected_category: analysisResult.ai_detected_category || analysisResult.aiDetectedCategory || "未识别",
        ai_confidence: Math.max(0, Math.min(1, 
          analysisResult.ai_confidence || analysisResult.aiConfidence || 0
        )),
        is_correct: analysisResult.is_correct !== undefined 
          ? analysisResult.is_correct 
          : (analysisResult.isCorrect !== undefined ? analysisResult.isCorrect : false),
        score: Math.max(0, Math.min(100, 
          analysisResult.score || 0
        )),
        ai_analysis: analysisResult.ai_analysis || analysisResult.aiAnalysis || "分析数据不完整",
        ai_response: analysisResult.ai_response || analysisResult.aiResponse || {
          analysis: "响应解析失败",
          timestamp: new Date().toISOString()
        },
        processing_time_ms: analysisResult.processing_time_ms || analysisResult.processingTimeMs || processingTime
      };
      
      console.log(`✅ 简化工具分析完成: ${result.ai_detected_category} (置信度: ${(result.ai_confidence * 100).toFixed(1)}%) 耗时: ${result.processing_time_ms}ms`);
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.error("❌ 简化工具分析失败:", error);
      
      return {
        ai_detected_category: "分析失败",
        ai_confidence: 0.0,
        is_correct: false,
        score: 0,
        ai_analysis: `分析过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}。请检查图片URL是否有效，或稍后重试。`,
        ai_response: {
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString(),
          input: { imageUrl, expectedCategory }
        },
        processing_time_ms: processingTime
      };
    }
  }
});