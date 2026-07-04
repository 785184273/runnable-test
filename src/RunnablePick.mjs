import { RunnablePick, RunnableSequence } from '@langchain/core/runnables'
const inputData = {
  name: 'John',
  age: 30,
  city: 'New York',
  country: 'USA',
  email: 'john.doe@example.com',
  phone: '+1234567890',
}

const chain = RunnableSequence.from([
  (input) => ({ ...input, basicInfo: `${input.name} lives in ${input.city}` }),
  new RunnablePick(['basicInfo', 'age']),
])
const result = await chain.invoke(inputData)
console.log('RunnablePick result:', result)