import { generateTextWithGemini } from '../geminiApi'

export async function processUserInput(input: string): Promise<string> {
  // Check if the input is asking for a smart contract
  if (input.toLowerCase().includes('generate smart contract') || input.toLowerCase().includes('create contract')) {
    return generateSmartContract(input)
  }

  // For other queries, use Gemini API to generate a response
  const response = await generateTextWithGemini(input)
  return response
}

async function generateSmartContract(input: string): Promise<string> {
  const prompt = `Generate a simple Solidity smart contract based on the following request: "${input}". Include comments explaining the code.`
  const contractCode = await generateTextWithGemini(prompt)
  return `Here's a simple smart contract based on your request:\n\n\`\`\`solidity\n${contractCode}\n\`\`\`\n\nYou can download this code as a .sol file using the button below.`
}

