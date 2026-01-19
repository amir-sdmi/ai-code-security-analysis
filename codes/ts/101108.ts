import { Request, Response } from 'express'
import { openai } from '../..'

export const AddToChatGPTConversation3 = async (req: Request, res: Response): Promise<any> => {
  const message: string = req.body.message
  const messages: any = req.body.messages

  let role
  let conversation = []
  if (messages.length === 0) {
    messages.push({ role: 'system', content: 'You are a helpful assistant' })
  } else {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].senderID !== 'chatGPT-3.5') {
        role = 'user'
      } else {
        role = 'assistant'
      }
      let newMessageObject = {
        role: role,
        content: messages[i].text
      }
      conversation.push(newMessageObject)
    }
  }

  try {
    conversation.push({ role: 'user', content: message })

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: conversation
    })

    const aiMessage = response.data.choices[0].message.content
    conversation.push({ role: 'assistant', content: aiMessage })

    res.status(200).json({ message: aiMessage, conversation: conversation })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'An error occurred with ChatGPT API' })
  }
}

// Chat GPT 4 is in Beta and not accessible yet
// export const AddToChatGPTConversation4 = async (req: Request, res: Response): Promise<any> => {
//   const message: string = req.body.message
//   const messages: any = req.body.messages

//   let role
//   let conversation = []
//   if (messages.length === 0) {
//     console.log('messages empty')
//     messages.push({ role: 'system', content: 'You are a helpful assistant' })
//   } else {
//     console.log('messages not empty')
//     for (let i = 0; i < messages.length; i++) {
//       console.log(messages[i])
//       if (messages[i].senderID !== 'chatGPT-4') {
//         role = 'user'
//       } else {
//         role = 'assistant'
//       }
//       let newMessageObject = {
//         role: role,
//         content: messages[i].text
//       }
//       conversation.push(newMessageObject)
//     }
//   }
//   console.log('here')
//   console.log(conversation)
//   try {
//     conversation.push({ role: 'user', content: message })

//     const response = await openai.createChatCompletion({
//       model: 'gpt-4',
//       messages: conversation
//     })
//     console.log(response)
//     const aiMessage = response.data.choices[0].message.content
//     console.log(aiMessage)
//     conversation.push({ role: 'assistant', content: aiMessage })
//     res.status(200).json({ message: aiMessage, conversation: conversation })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({ error: 'An error occurred with ChatGPT API' })
//   }
// }
