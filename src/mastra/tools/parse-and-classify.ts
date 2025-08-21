import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { imageAnalyzerTool } from "./image-analyzer";
import { classificationScorerTool } from "./classification-scorer";

export const parseAndClassifyTool = createTool({
  id: "parse-and-classify",
  description: "解析用户输入并进行垃圾分类分析，返回数据库需要的7个字段",
  inputSchema: z.object({
    userInput: z.string().describe("用户输入的图片URL和分类，格式如：'https://example.com/image.jpg 这是可回收垃圾'")
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
    const { userInput } = context;
    const startTime = Date.now();
    
    console.log(`🔍 开始解析用户输入: ${userInput}`);
    
    try {
      // 解析用户输入
      const urlMatch = userInput.match(/(https?:\/\/[^\s]+)/);
      const categoryMatch = userInput.match(/这是(.+?)(?:\s|$)/);
      
      if (!urlMatch) {
        throw new Error("未找到有效的图片URL");
      }
      
      if (!categoryMatch) {
        throw new Error("未找到有效的垃圾分类，请使用格式：'这是XXX垃圾'");
      }
      
      const imageUrl = urlMatch[1];
      const expectedCategory = categoryMatch[1].trim();
      
      console.log(`📝 解析结果: URL=${imageUrl}, 预期分类=${expectedCategory}`);
      
      // 调用图像分析工具
      console.log(`🖼️ 开始图像分析...`);
      const analysisResult = await imageAnalyzerTool.execute({ 
        context: {
          imageUrl,
          location: "中国"
        }
      });
      
      console.log(`📊 图像分析完成: ${analysisResult.detectedCategory}`);
      
      // 调用评分工具
      console.log(`🎯 开始评分...`);
      const scoringResult = await classificationScorerTool.execute({
        context: {
          detectedCategory: analysisResult.detectedCategory,
          expectedCategory: expectedCategory,
          confidence: analysisResult.confidence,
          description: analysisResult.description,
          characteristics: analysisResult.characteristics,
          materialType: analysisResult.materialType,
          disposalInstructions: analysisResult.disposalInstructions,
          processingTimeMs: analysisResult.processingTimeMs
        }
      });
      
      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;
      
      // 构建最终结果
      const result = {
        ai_detected_category: analysisResult.detectedCategory,
        ai_confidence: analysisResult.confidence,
        is_correct: scoringResult.match,
        score: scoringResult.score,
        ai_analysis: scoringResult.detailedAnalysis,
        ai_response: {
          analysis: analysisResult,
          scoring: scoringResult,
          input: {
            imageUrl,
            expectedCategory,
            userInput
          },
          timestamp: new Date().toISOString()
        },
        processing_time_ms: totalProcessingTime
      };
      
      console.log(`✅ 分析完成: ${result.ai_detected_category} (置信度: ${(result.ai_confidence * 100).toFixed(1)}%) 正确性: ${result.is_correct} 评分: ${result.score} 耗时: ${result.processing_time_ms}ms`);
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.error("❌ 解析和分析失败:", error);
      
      return {
        ai_detected_category: "分析失败",
        ai_confidence: 0.0,
        is_correct: false,
        score: 0,
        ai_analysis: `分析过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}。请检查输入格式是否正确，图片URL是否有效。`,
        ai_response: {
          error: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString(),
          userInput
        },
        processing_time_ms: processingTime
      };
    }
  }
});