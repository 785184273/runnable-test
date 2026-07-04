import { RouterRunnable, RunnableLambda } from '@langchain/core/runnables'

/**
 * 创建路由处理函数
 */
const toUpperCase = RunnableLambda.from((x) => x.toUpperCase())
const reverseText = RunnableLambda.from((x) => x.split('').reverse().join(''))

const router = new RouterRunnable({
  runnables: {
    toUpperCase,
    reverseText,
  }
})

const result = await router.invoke({
  key: 'toUpperCase',
  input: 'hello',
})

const result2 = await router.invoke({
  key: 'reverseText',
  input: 'hello',
})

console.log('toUpperCase result: ', result)
console.log('reverseText result: ', result2)