import { type Request, type Response } from 'express'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  organization: 'org-o3MBkUZqrJ3vDNt38J874sLx',
  apiKey: process.env.OPENAI_KEY,
})

const openai = new OpenAIApi(configuration)

interface recommendationType {
  brand: string
  color: string
  format: string
}

export const getRecommendation = async (req: Request, res: Response) => {
  try {
    const { brand, color, format }: recommendationType = req.body

    const prompt = `Assuming you are a glasses recommender, recommend to me one with brand: ${brand}, shape: ${format} and color: ${color}. Just print information about the glasses directly.`

    // Generate a response with ChatGPT
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
    })
    console.log(completion)
    res.status(200).send(completion.data.choices[0].text)
  } catch (error) {
    return res.status(500).json({ message: error })
  }
}
