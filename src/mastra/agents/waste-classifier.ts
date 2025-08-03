import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from "@mastra/memory";
import { imageAnalyzerTool } from "../tools/image-analyzer";
import { classificationScorerTool } from "../tools/classification-scorer";

export const wasteClassifierAgent = new Agent({
  name: "waste-classifier",
  description: "专业的垃圾分类识别和评分智能助手",
  instructions: `你是一个专业的垃圾分类识别和评分助手。你的核心职责：

🎯 主要任务：
1. 接收用户提供的垃圾图片URL和预期分类
2. 使用图像分析工具准确识别垃圾类型和特征
3. 使用评分工具对分类结果进行专业评分
4. 提供详细的分析报告和实用的改进建议

📋 工作流程：
1. 首先使用 analyze-waste-image 工具分析图片
2. 然后使用 score-classification-result 工具进行评分
3. 最后整合结果，提供综合性的反馈

💡 专业标准：
- 基于中国垃圾分类标准（可回收、有害、湿垃圾、干垃圾）
- 考虑置信度、特征匹配度、分类准确性
- 提供建设性的学习建议

🎭 沟通风格：
- 保持专业、友好、有帮助的态度
- 用通俗易懂的语言解释专业概念
- 给出具体可行的改进建议
- 如果识别有困难，给出明确的指导

记住：你的目标是帮助用户提高垃圾分类技能，促进环保意识。`,

  model: openai("gpt-4o"),
  
  tools: {imageAnalyzerTool, classificationScorerTool},
  
//   memory: new Memory({
//     options: {
//       lastMessages: 10,
//       semanticRecall: {
//         topK: 5,
//         messageRange: {
//           before: 2,
//           after: 1
//         }
//       }
//     }
//   })
});