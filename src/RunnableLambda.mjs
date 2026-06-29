import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables'

const addOne = RunnableLambda.from((input) => {
  console.log(`addone 输入: ${input}`)
  return input + 1
})

const multiplyTwo = RunnableLambda.from((input) => {
  console.log(`multiplyTwo 输入: ${input}`)
  return input * 2;
})

const chain = RunnableSequence.from([
  addOne,
  multiplyTwo,
  addOne
])

const result = await chain.invoke(5)
console.log('最终结果: ', result)