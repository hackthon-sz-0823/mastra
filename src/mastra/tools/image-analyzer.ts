import { createTool } from "@mastra/core/tools";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { WasteAnalysisResult } from "../../types/waste-types";

export const imageAnalyzerTool = createTool({
  id: "analyze-waste-image",
  description: "分析垃圾图片并识别垃圾类型、特征和处理方式",
  inputSchema: z.object({
    imageUrl: z.string().url().describe("垃圾图片的URL地址"),
    location: z.string().optional().describe("用户所在地区，用于本地化分类标准")
  }),
  outputSchema: z.object({
    detectedCategory: z.string().describe("检测到的垃圾类别"),
    confidence: z.number().min(0).max(1).describe("识别置信度"),
    description: z.string().describe("垃圾的详细描述"),
    characteristics: z.array(z.string()).describe("垃圾的特征列表"),
    materialType: z.string().describe("材料类型"),
    disposalInstructions: z.string().describe("处理指导")
  }),
  execute: async ({ context }) => {
    const { imageUrl, location = "中国" } = context;
    
    console.log(`🔍 开始分析图片: ${imageUrl}`);
    
    try {
      // 验证图片URL
      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error("无效的图片URL");
      }

      // 构建更详细和专业的分析提示
      const systemPrompt = `你是一位资深的垃圾分类识别专家。请仔细分析图片中的物品，根据${location}的垃圾分类标准进行专业判断。

## 详细分类标准

### 🔄 可回收垃圾
**塑料类**：
- 饮料瓶、矿泉水瓶、洗发水瓶
- 塑料包装盒、塑料袋（干净的）
- 塑料玩具、塑料家具

**纸类**：
- 报纸、杂志、书本、办公用纸
- 纸箱、纸盒包装
- 纸袋（干净的）

**金属类**：
- 易拉罐、罐头盒、铝制品
- 铁制品、不锈钢制品
- 金属装饰品

**玻璃类**：
- 玻璃瓶、玻璃杯
- 平板玻璃、镜子

### ☠️ 有害垃圾
- 各种电池（干电池、充电电池、纽扣电池）
- 电子产品及配件（手机、电脑零件、充电器）
- 灯泡、LED灯、节能灯
- 药品、过期药物
- 化学用品（油漆、杀虫剂、胶水）
- 含汞制品（温度计、血压计）

### 🥬 湿垃圾（厨余垃圾）
- 食物残渣（剩菜剩饭、果皮果肉）
- 有机垃圾（菜叶、鱼骨、蛋壳）
- 过期食品（面包、水果、蔬菜）
- 茶叶渣、咖啡渣
- 宠物粪便、花卉植物

### 🗑️ 干垃圾（其他垃圾）
- 污染严重的纸张（餐巾纸、卫生纸、湿巾）
- 破损陶瓷、瓷器碎片
- 烟蒂、烟灰
- 尘土、毛发
- 破旧衣物（无法捐赠的）
- 一次性用品（筷子、餐具）

## 分析要求
1. **仔细观察**：注意物品的材质、颜色、形状、大小、标识
2. **材质判断**：准确识别是塑料、纸张、金属、玻璃还是有机物
3. **用途分析**：理解物品的功能和使用场景
4. **状态评估**：判断物品是否完整、清洁、破损
5. **标识识别**：寻找回收标志、品牌标识、材质标记
6. **特征提取**：提供至少3个明显的识别特征
7. **置信度评估**：根据图片清晰度和特征明显程度给出置信度

请提供准确、详细的分析结果。`;

      const userPrompt = `请分析这张图片中的垃圾/物品，并按照${location}垃圾分类标准进行分类。

请特别关注：
- 物品的材质特征（塑料/纸张/金属/玻璃/有机物等）
- 物品的形状、大小、颜色
- 是否有品牌标识、回收标志或其他标记
- 物品的完整程度和清洁状态
- 物品的用途和功能

请基于这些观察提供准确的分类判断。`;

      // 使用Mastra推荐的AI SDK方式
      const result = await generateObject({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image',
                image: imageUrl
              }
            ]
          }
        ],
        schema: z.object({
          detectedCategory: z.string(),
          confidence: z.number(),
          description: z.string(),
          characteristics: z.array(z.string()),
          materialType: z.string(),
          disposalInstructions: z.string()
        }),
        temperature: 0.1, // 降低随机性，提高准确性
        maxTokens: 1000
      });

      const analysis = result.object;
      
      // 数据清理和验证
      const cleanResult = {
        detectedCategory: analysis.detectedCategory || "未识别物品",
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0)),
        description: analysis.description || "无法获取详细描述",
        characteristics: Array.isArray(analysis.characteristics) && analysis.characteristics.length > 0
          ? analysis.characteristics.slice(0, 5).filter(Boolean)
          : ["特征识别不完整"],
        materialType: analysis.materialType || "材质不明",
        disposalInstructions: analysis.disposalInstructions || "请咨询当地垃圾分类指南"
      };

      console.log(`✅ 图片分析成功: ${cleanResult.detectedCategory} (置信度: ${(cleanResult.confidence * 100).toFixed(1)}%)`);
      
      return cleanResult as WasteAnalysisResult;

    } catch (error) {
      console.error("❌ 图片分析失败:", error);
      
      // 详细的错误处理
      let errorMessage = "图片分析失败";
      let characteristics = ["分析失败"];
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('url') || errorMsg.includes('fetch') || errorMsg.includes('network')) {
          errorMessage = "图片链接无效或无法访问";
          characteristics = [
            "请检查图片URL是否正确",
            "确保图片链接可以公开访问",
            "建议使用https://开头的图片链接",
            "尝试使用图床服务如imgur、unsplash等"
          ];
        } else if (errorMsg.includes('rate') || errorMsg.includes('limit')) {
          errorMessage = "API调用频率超限，请稍后重试";
          characteristics = [
            "请等待1-2分钟后重试",
            "检查OpenAI API配额是否充足"
          ];
        } else if (errorMsg.includes('key') || errorMsg.includes('auth')) {
          errorMessage = "API密钥配置错误";
          characteristics = [
            "请检查OPENAI_API_KEY环境变量",
            "确认API密钥有效且有足够额度"
          ];
        } else if (errorMsg.includes('timeout')) {
          errorMessage = "请求超时，图片可能过大";
          characteristics = [
            "尝试使用更小的图片",
            "检查网络连接状态",
            "稍后重试"
          ];
        } else {
          characteristics = [
            "请检查图片是否清晰",
            "确保图片中包含垃圾物品",
            "尝试重新上传图片"
          ];
        }
      }

      return {
        detectedCategory: "识别失败",
        confidence: 0,
        description: `${errorMessage}。错误详情：${error instanceof Error ? error.message : '未知错误'}`,
        characteristics,
        materialType: "未知",
        disposalInstructions: "无法提供处理建议，请尝试重新分析或人工识别"
      } as WasteAnalysisResult;
    }
  }
});