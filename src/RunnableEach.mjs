import { RunnableEach, RunnableLambda } from '@langchain/core/runnables'

const toUpperCase = RunnableLambda.from((input) => input.toUpperCase())
const addGreeting = RunnableLambda.from((input) => `Hello, ${input}!`)

const chain = new RunnableEach({
  bound: toUpperCase.pipe(addGreeting),
})

const result = await chain.invoke(['alice', 'bob', 'carol'])
console.log('RunnableEach result:', result)