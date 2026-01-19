// pages/api/purple.js

import dbConnect from '../../lib/mongodb';
import { getUserFromSession } from '../../lib/getUserFromSession';
import { getChatGPTResponse } from '../../lib/llm/chatgpt';
import { getClaudeResponse } from '../../lib/llm/claude';
import { getLlamaResponse } from '../../lib/llm/llama';

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromSession(req);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { prompt, activeConversationId } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate the prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid or missing "prompt" in request body.' });
  }

  try {
    // Find the conversation
    const conversation = user.userdata.conversations.find(
      (conv) => conv.conversationId.toString() === activeConversationId
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Step 1: Use ChatGPT to analyze the prompt and select the appropriate LLM
    const analysisMessages = [
      {
        role: 'system',
        content: `You are an AI assistant designed to analyze user prompts and select the most appropriate Large Language Model (LLM) to answer based on the prompt’s content, context, and requirements. Your task is to evaluate each prompt based on the following categories and select the best LLM from the list provided. You should only provide the selected LLM and a brief explanation of why the chosen LLM was the best fit. Do not include additional responses, code, or content beyond the selection and reasoning.

**Categories and Corresponding LLMs:**

1. **Conversational / General Knowledge:** Use models like ChatGPT or Claude. These are suited for everyday questions, dialogue, and general assistance.
2. **Creative Writing / Storytelling:** Use Claude. This model excels in generating narratives, creative texts, and imaginative content.
3. **Technical / Coding Questions:** Use ChatGPT, as it is well-suited for technical writing, coding help, and software-related questions.
4. **Research and Analysis:** Use Llama. This model is tailored for detailed analysis, research-heavy content, and fact-based responses.

Provide the output strictly in this structure:
Selected LLM: [LLM Name]
Reason for Selection: [Brief explanation of why this LLM was chosen based on the prompt and context.]`,
      },
      ...conversation.messages.map((msg) => ({
        role: msg.sender === user.firstName ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: prompt },
    ];

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: analysisMessages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      throw new Error(errorData.error?.message || 'Failed to analyze prompt.');
    }

    const analysisData = await analysisResponse.json();
    const analysisOutput = analysisData.choices[0]?.message?.content.trim();

    if (!analysisOutput) {
      throw new Error('No analysis output from ChatGPT.');
    }

    const selectedLlmMatch = analysisOutput.match(/Selected LLM:\s*(.*)/i);
    const reasonMatch = analysisOutput.match(/Reason for Selection:\s*(.*)/i);

    if (!selectedLlmMatch) {
      return res.status(400).json({ error: 'Unable to determine the best LLM from the analysis.' });
    }

    let selectedLlm = selectedLlmMatch[1].trim();
    const reasonForSelection = reasonMatch ? reasonMatch[1].trim() : '';

    // Standardize selectedLlm to match our options
    selectedLlm = selectedLlm.replace(/\./g, ''); // Remove any periods

    // Step 2: Use the selected LLM to get the response to the original prompt
    let aiResponse;

    switch (selectedLlm) {
      case 'ChatGPT':
        aiResponse = await getChatGPTResponse(prompt, conversation.messages, user.firstName);
        break;
      case 'Claude':
        aiResponse = await getClaudeResponse(prompt, conversation.messages, user.firstName);
        break;
      case 'Llama':
        aiResponse = await getLlamaResponse(prompt, conversation.messages, user.firstName);
        break;
      default:
        return res.status(400).json({ error: `Selected LLM "${selectedLlm}" is not supported.` });
    }

    // Save the new messages to the conversation
    conversation.messages.push(
      { sender: user.firstName, text: prompt },
      { sender: selectedLlm, text: aiResponse }
    );
    await user.save();

    res.status(200).json({
      response: aiResponse,
      selectedLlm,
      reasonForSelection,
    });
  } catch (error) {
    console.error('Error in purple.ai handler:', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch response from the LLM.' });
  }
}