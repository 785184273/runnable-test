import dotenv from 'dotenv'
import path from 'path'
import { ChatOpenAI } from '@langchain/openai'
import { RunnableSequence, RunnableAssign, RunnableMap, RunnableBranch, RunnableLambda, RunnablePassthrough } from '@langchain/core/runnables'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { HumanMessage, ToolMessage } from '@langchain/core/messages'
import chalk from 'chalk'

const __dirname = import.meta.dirname
const envPath = path.resolve(__dirname, '../.env')
dotenv.config({ path: envPath })

const model = new ChatOpenAI({
  model: process.env.OPEN_AI_MODEL,
  apiKey: process.env.OPEN_AI_API_KEY,
  configuration: {
    baseURL: process.env.OPEN_AI_BASE_URL,
  },
})

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "amap-maps-streamableHTTP": {
      "url": "https://mcp.amap.com/mcp?key=" + process.env.AMAP_MAPS_API_KEY
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    }
  }
})

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个可以调用 MCP 工具的智能助手，会根据用户的问题调用相应的工具，并给出回答。'],
  new MessagesPlaceholder('messages'),
])

const tools = await mcpClient.getTools()
const modelWithTools = model.bindTools(tools)

const llmchain = prompt.pipe(modelWithTools)

const toolExecutor = RunnableLambda.from(async state => {
  const { response, tools } = state
  const toolCalls = response?.tool_calls ?? []
  const toolMessages = []
  for (const toolCall of toolCalls) {
    const { name, args, id } = toolCall
    const tool = tools.find(t => t.name === name)
    if (tool) {
      const toolResult = await tool.invoke(args)

      // MCP工具返回的是结构化对象，需要转换为字符串供LangChain使用
      let contentForMessage;
      if (typeof toolResult === 'string') {
        contentForMessage = toolResult;
      } else if (toolResult && typeof toolResult === 'object') {
        if (toolResult.text) {
          contentForMessage = toolResult.text;
        } else if (toolResult.content) {
          contentForMessage = typeof toolResult.content === 'string'
            ? toolResult.content
            : JSON.stringify(toolResult.content, null, 2);
        } else {
          contentForMessage = JSON.stringify(toolResult, null, 2);
        }
      } else {
        contentForMessage = String(toolResult);
      }

      toolMessages.push(new ToolMessage({
        content: contentForMessage,
        tool_call_id: id,
      }))
    }
  }
  return toolMessages
})

const agentStepChain = RunnableSequence.from([
  // 将 LLM 的输出作为输入，赋值给 messages
  RunnablePassthrough.assign({
    response: llmchain
  }),
  RunnableBranch.from([
    // 条件分支
    [
      // 如果没有调用工具
      RunnableLambda.from((state) => {
        const { response } = state
        return response?.tool_calls?.length === 0
      }),
      RunnableLambda.from((state) => {
        const { response, messages } = state
        return {
          ...state,
          messages: [...messages, response],
          done: true,
          final: response.content
        }
      })
    ],
    // 默认分支
    RunnableSequence.from([
      RunnableLambda.from((state) => {
        const { response, messages } = state
        const toolCalls = response?.tool_calls ?? []
        console.log(
          chalk.bgBlue(
            `🔍 检测到 ${toolCalls.length} 个工具调用`
          )
        )
        console.log(
          chalk.bgBlue(
            `🔍 工具调用: ${toolCalls
              .map((t) => t.name)
              .join(', ')}`
          )
        )
        return {
          ...state,
          messages: [...messages, response],
          done: false,
          final: null,
        }
      }),
      RunnablePassthrough.assign({
        toolMessages: toolExecutor
      }),
      RunnableLambda.from((state) => {
        const { toolMessages, messages } = state
        return {
          ...state,
          messages: [...messages, ...toolMessages],
          done: false,
          final: null,
        }
      })
    ])
  ])
])

const runAgentWithTools = async (query, maxIterations = 30) => {
  let state = {
    messages: [new HumanMessage(query)],
    done: false,
    final: null,
    tools
  }

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`))
    state = await agentStepChain.invoke(state)
    if (state.done) {
      console.log(`\n✨ AI 最终回复:\n${state.final}\n`)
      return state.final
    }
  }
}

await runAgentWithTools('请调用 MCP 工具，获取云南大理洱海周边的海景酒店信息，并给出每个酒店的详细介绍和价格，酒店图片等，在浏览器中打开酒店信息')