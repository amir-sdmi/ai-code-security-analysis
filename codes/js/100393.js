const { connectToGPT } = require('./connection')
const { iWantProducts } = require('./prompts')

exports.generateGPTResponse = async (_pages, query) => {
  // since the pdf is parsed like if it has more than 1 page
  const pages = _pages.split('-------------------')

  const openai = await connectToGPT()
  console.log('Generating page data ⟳')
  console.log('- Using ChatGPT model', query.model || '3')

  let gptResponse

  console.log('PROMP', iWantProducts(query.firstProduct, pages[0]))

  try {
    const completion = await openai.createChatCompletion({
      model: Number(query.model) === 3 ? 'gpt-3.5-turbo-16k' : 'gpt-4',
      messages: [{
        role: 'user', content: iWantProducts(query.firstProduct, pages[0])
      }]
    })

    gptResponse = completion.data.choices[0].message.content
    gptResponse = JSON.parse(gptResponse)
  } catch (error) {
    console.log('Not valid JSON response 𐄂')
    return undefined
  }

  // the chat generated a bad json file
  if (Object.keys(gptResponse).length !== 1) {
    console.log('response 𐄂')
    console.log(gptResponse)
    return undefined
  } else {
    console.log('Generated succesfully ✓')
  }

  return gptResponse // the returned value will be the products or undefined
}
