
'use server';
/**
 * @fileOverview A portfolio chatbot AI flow.
 *
 * - portfolioChat - A function to interact with the portfolio chatbot.
 * - PortfolioChatInput - The input type for the portfolioChat function.
 * - PortfolioChatOutput - The return type for the portfolioChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PortfolioChatInputSchema = z.object({
  userInput: z.string().describe("The user's message to the chatbot."),
  chatHistory: z.array(z.object({
    user: z.string().optional().describe("The user's message in the history."),
    bot: z.string().optional().describe("The bot's response in the history.")
  })).optional().describe("The history of the conversation so far. Alternating user and bot messages."),
});
export type PortfolioChatInput = z.infer<typeof PortfolioChatInputSchema>;

const PortfolioChatOutputSchema = z.object({
  botResponse: z.string().describe("The chatbot's response to the user."),
});
export type PortfolioChatOutput = z.infer<typeof PortfolioChatOutputSchema>;

export async function portfolioChat(input: PortfolioChatInput): Promise<PortfolioChatOutput> {
  return portfolioChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'portfolioChatPrompt',
  model: 'googleai/gemini-2.0-flash', // Explicitly set to use Gemini model
  input: {schema: PortfolioChatInputSchema},
  output: {schema: PortfolioChatOutputSchema},
  prompt: `You are a friendly, professional, and helpful AI assistant for Raju Bharali, a skilled web developer.
Your primary goal is to engage potential clients, understand their website needs, discuss their project ideas, and acknowledge their budget.
You should encourage them to provide details about their project.
When discussing budget, be empathetic and explain that pricing is tailored to the project's scope and complexity. Avoid giving specific price quotes at this stage. Instead, focus on gathering requirements.

Conversation History:
{{#if chatHistory}}
  {{#each chatHistory}}
    {{#if user}}User: {{{user}}}{{/if}}
    {{#if bot}}Assistant: {{{bot}}}{{/if}}
  {{/each}}
{{else}}
  No previous messages.
{{/if}}

Current User Message: {{{userInput}}}

Based on the conversation history and the current user message, provide a helpful and relevant response.
If the user asks about pricing, you can say something like: "I can certainly help you figure that out! Pricing for a custom website depends on various factors like the complexity, features, and design. Could you tell me a bit more about the project you have in mind? For example, what kind of website is it (e.g., e-commerce, portfolio, blog), and are there any specific features you're looking for?"
If the user mentions a budget, acknowledge it and guide them to discuss project details, for example: "Thanks for sharing your budget. To see how we can best work within that, could you tell me more about the website you're envisioning?"
Keep your responses concise and focused on moving the conversation forward.
`,
});

const portfolioChatFlow = ai.defineFlow(
  {
    name: 'portfolioChatFlow',
    inputSchema: PortfolioChatInputSchema,
    outputSchema: PortfolioChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return { botResponse: "I'm sorry, I encountered an issue. Could you please try rephrasing?" };
    }
    return output;
  }
);
