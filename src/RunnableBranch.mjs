import { RunnableBranch, RunnableLambda } from '@langchain/core/runnables'

// 创建条件判断函数
const isPositive = RunnableLambda.from((x) => x > 0)
const isNegative = RunnableLambda.from((x) => x < 0)
const isEven = RunnableLambda.from((x) => x % 2 === 0)

// 创建分支处理函数
const handlePositive = RunnableLambda.from((x) => `x is positive: ${x}`)
const handleNegative = RunnableLambda.from((x) => `x is negative: ${x}`)
const handleEven = RunnableLambda.from((x) => `x is even: ${x}`)
const handleDefault = RunnableLambda.from((x) => `x is default: ${x}`)

const branch = RunnableBranch.from([
  [isPositive, handlePositive],
  [isNegative, handleNegative],
  [isEven, handleEven],
  handleDefault,
])

const testCase = [7, -3, 2, 0]

for (const test of testCase) {
  const result = await branch.invoke(test)
  console.log(`${test} -> ${result}`)
}