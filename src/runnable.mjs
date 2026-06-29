/**
 * LangChain RunnableSequence 示例
 * 流程：PromptTemplate → ChatOpenAI → StructuredOutputParser
 * 功能：将中文文本翻译为英文，并提取 3 个关键词，输出结构化 JSON
 */
import dotenv from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import z from 'zod'

// ESM 下获取当前模块目录，用于定位 .env 文件
const __dirname = import.meta.dirname

// 从项目根目录加载 API Key、模型名等环境变量
dotenv.config({
  path: path.resolve(__dirname, '../.env')
})

// 初始化 OpenAI 兼容接口的聊天模型
const llm = new ChatOpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
  model: process.env.OPEN_AI_MODEL,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL // 支持自定义 baseURL（如代理或第三方兼容接口）
  }
})

// 用 Zod 定义 LLM 输出的 JSON 结构
const schema = z.object({
  translation: z.string().describe("翻译后的英文文本"),
  keywords: z.array(z.string()).length(3).describe("3个关键词")
});

// 将 LLM 的文本响应解析为符合 schema 的结构化对象
const outputParser = StructuredOutputParser.fromZodSchema(schema)

// {text}：待翻译文本；{format_instructions}：由 outputParser 生成的 JSON 格式说明
const promptTemplate = PromptTemplate.fromTemplate(
  `
  将以下文本翻译成英文, 然后总结为3个关键词。
    文本：{text}
    {format_instructions}
  `
)

// 等价写法：promptTemplate.pipe(llm).pipe(outputParser)
// 数据流向：input → prompt → llm → parser → 结构化 result
const chain = RunnableSequence.from([
  promptTemplate,
  llm,
  outputParser
])

// format_instructions 需手动传入，prompt 模板才能渲染出格式约束
const input = {
  text: 'LangChain 是一个强大的 AI 应用开发框架',
  format_instructions: outputParser.getFormatInstructions()
}

// 依次执行链中各 Runnable，返回解析后的结构化对象
const result = await chain.invoke(input)

console.log('✅ 最终结果:')
console.log(result)
