// pages/api/purple.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { prompt, chatLog } = req.body; // Retrieve chatLog from the request body

    // Validate the prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid or missing "prompt" in request body.' });
    }

    try {
      // Step 1: Use ChatGPT to analyze the prompt with context and select the appropriate LLM
      const analysisMessages = [
        {
          role: 'system',
          content: `You are an AI assistant designed to analyze user prompts and select the most appropriate Large Language Model (LLM) to answer based on the prompt’s content, context, and requirements. Your task is to evaluate each prompt based on the following categories and select the best LLM from the list provided. You should only provide the selected LLM and a brief explanation of why the chosen LLM is the best fit. Do not include additional responses, code, or content beyond the selection and reasoning.

**Categories and Corresponding LLMs:**

1. **Conversational / General Knowledge:** Use models like ChatGPT or Claude. These are suited for everyday questions, dialogue, and general assistance.
2. **Creative Writing / Storytelling:** Use Claude, Jurassic, or Cohere. These models excel in generating narratives, creative texts, and imaginative content.
3. **Technical / Coding Questions:** Use ChatGPT, as it is well-suited for technical writing, coding help, and software-related questions.
4. **Real-Time Data Retrieval / Action Commands:** Use Command R. This model is best for tasks involving live data, real-time information retrieval, or action-based queries.
5. **Multilingual Tasks:** Use Bloom. This model handles non-English language prompts and translation tasks effectively.
6. **Research and Analysis:** Use Falcon or Aleph Alpha. These models are tailored for detailed analysis, research-heavy content, and fact-based responses.

Provide the output strictly in this structure:
Selected LLM: [LLM Name]
Reason for Selection: [Brief explanation of why this LLM was chosen based on the prompt and context.]`,
        },
        // Append existing chat log
        ...chatLog.map((entry) => ({
          role: entry.type === 'user' ? 'user' : 'assistant',
          content: entry.message,
        })),
        // Add the latest user prompt
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

      // Extract 'Selected LLM' and 'Reason for Selection' using regex
      const selectedLlmMatch = analysisOutput.match(/Selected LLM:\s*(.+)/i);
      const reasonMatch = analysisOutput.match(/Reason for Selection:\s*(.+)/i);

      const selectedLlm = selectedLlmMatch ? selectedLlmMatch[1].trim() : null;
      const reasonForSelection = reasonMatch ? reasonMatch[1].trim() : null;

      if (!selectedLlm) {
        return res.status(400).json({ error: 'Unable to determine the best LLM from the analysis.' });
      }

      // Step 2: Use the selected LLM to get the response to the original prompt
      let apiEndpoint = '';
      switch (selectedLlm) {
        case 'ChatGPT':
          apiEndpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/chatgpt`;
          break;
        case 'Claude':
          apiEndpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/claude`;
          break;
        case 'Llama':
          apiEndpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/llama`;
          break;
        default:
          return res.status(400).json({ error: `Selected LLM "${selectedLlm}" is not supported.` });
      }

      const llmResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, chatLog }),
      });

      if (!llmResponse.ok) {
        const errorData = await llmResponse.json();
        throw new Error(errorData.error || `Failed to fetch response from ${selectedLlm}.`);
      }

      const llmData = await llmResponse.json();
      const llmOutput = llmData.response;

      res.status(200).json({
        selectedLlm,
        reasonForSelection,
        response: llmOutput,
      });
    } catch (error) {
      console.error('Error in purple.ai handler:', error.message);
      res.status(500).json({ error: error.message || 'Failed to fetch response from the LLM.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
