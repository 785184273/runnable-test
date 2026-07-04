import { RunnablePassthrough, RunnableLambda, RunnableSequence, RunnableMap } from '@langchain/core/runnables'

// const chain = RunnableSequence.from([
//   RunnableLambda.from((input) => ({ concept: input })),
//   RunnableMap.from({
//     original: new RunnablePassthrough(),
//     processed: RunnableLambda.from((obj) => ({
//       concept: obj.concept,
//       upper: obj.concept.toUpperCase(),
//       length: obj.concept.length,
//     })),
//   })
// ])

/**
 * _coerceToRunnable方法内部会将函数转为RunnableLambda,会将对象转为RunnableMap，等同于上面注释部分的代码
 * 所以RunnablePassthrough.from方法内部会将函数转为RunnableLambda,会将对象转为RunnableMap
 */
const chain = RunnableSequence.from([
  input => ({ concept: input }),
  {
    original: new RunnablePassthrough(),
    processed: obj => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    }),
  }
])

const input = 'hello'
const result = await chain.invoke(input)
console.log(result)