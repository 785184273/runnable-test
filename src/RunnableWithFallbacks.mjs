import { RunnableLambda } from '@langchain/core/runnables'

const unstableRunnable = RunnableLambda.from(async (input) => {
  console.log(`输入: ${input}`)
  throw new Error('unstableRunnable的错误')
})

const fallbackRunnable = RunnableLambda.from(async (input) => {
  console.log(`输入: ${input}`)
  // return `成功处理: ${input}`
  throw new Error('fallbackRunnable的错误')
})

const withFallbacksRunnable = unstableRunnable.withFallbacks([fallbackRunnable])

try {
  const result = await withFallbacksRunnable.invoke('演示 withFallbacks')
  console.log('最终结果:', result)
} catch (error) {
  console.error("❌ 使用 withFallbacks 后仍然失败:", error?.message ?? error)
}