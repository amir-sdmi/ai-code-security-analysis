import { OpenAI } from 'openai';
import { Cache } from './Cache';

/**
 * Suggestion service
 * This class mean to retrieve auto-completion~ish suggestions from OpenAI
 * based on a user input.
 *
 * @note using ChatGPT model for this task (3.5-turbo-0125)
 */
class Suggestions {
  constructor(private readonly openAI: OpenAI, private cache: Cache<any>) {
    //
  }

    /**
     * Returns the last element of a string or the entire string if there is no space.
     *
     * @param {String} input 
     * @returns {String}
     */
    public getLastWordFromInput(input: string): string {
        const lastWord: string = input.trim().split(" ").pop() as string;

        return lastWord;
    }

    /**
     * Retrieve a suggestion from OpenAI based on a sentence.
     *
     * @param {string} input 
     * @returns {Promise<object>}
     */
    async getOpenAiSuggestions(input: string): Promise<any> {
      try {
        const completion = await this.openAI.chat.completions.create({
          messages: [
            { 
              role: "system", 
              content: "You will be provided with statements, and your task is to convert them to standard English. Work with the last word from the statement only, split by space. If there is no space present, then work with the entire text. The word might be a city, focus on that primarly and try to suggest a city based on the word. Response should be JSON. In the response JSON one field should be a \"city\" and should be a \"generic\" field where you try to convert the word into valid English",
            },
            {
              "role": "user",
              "content": input,
            }
          ],
          model: 'gpt-3.5-turbo-0125',
          temperature: 0.7,
          max_tokens: 64,
          top_p: 1,
          response_format: { type: "json_object" },
        });

        const suggestions = completion.choices[0];

        return suggestions;
      } catch (error) {
        console.error('[SU][goas] Error fetching suggestions from OpenAI:', error);

        throw error;
      }
    }

    /**
     * Get the last word from a sentence. Check it in cache. Then try to get a suggestion
     * from open AI.
     */
    async getSuggestions(input: string): Promise<any> {
      const lastWord = this.getLastWordFromInput(input);
      const cachedResult = this.cache.get(lastWord);

      if (cachedResult) {
        console.log('[SU][gs]Suggestion from cache: ', cachedResult);

        return cachedResult;
      }

      return await this.getOpenAiSuggestions(lastWord);
    }
}

export default Suggestions;
