import { GptAssistantResponse } from "@shared/types";
import { apiRequest } from "./queryClient";

// Function to get AI assistance for campaign creation using DeepSeek
export const getAIAssistance = async (
  prompt: string,
  userId: number
): Promise<GptAssistantResponse> => {
  try {
    // Call your backend, which should forward to DeepSeek API
    const response = await apiRequest('/api/deepseek/assist', 'POST', {
      userId,
      promptText: prompt
    });

    console.log(response); // Should show { campaignPitch: ... }

    // The backend should return a response in GptAssistantResponse format
    return response.response;
  } catch (error) {
    console.error('Error getting AI assistance:', error);
    throw error;
  }
};

// Function to get AI pitch suggestion
export const getPitchSuggestion = async (
  idea: string,
  targetAudience: string,
  userId: number
): Promise<string> => {
  try {
    const prompt = `I'm creating a crowdfunding campaign for ${idea}. The target audience is ${targetAudience}. 
Could you help me write a compelling pitch for my campaign? I need something that clearly explains the idea, 
highlights the benefits, and motivates people to contribute.`;

    const response = await getAIAssistance(prompt, userId);
    if (response.campaignPitch) {
      return response.campaignPitch;
    }
    return '';
  } catch (error) {
    console.error('Error getting pitch suggestion:', error);
    return '';
  }
};

// Function to get funding goal estimation
export const getFundingGoalEstimation = async (
  idea: string,
  costs: string,
  timeframe: string,
  userId: number
): Promise<{ min: string; max: string; recommended: string; rationale: string }> => {
  try {
    const prompt = `I'm creating a crowdfunding campaign for ${idea}. Here are the costs involved: ${costs}. 
The timeframe for the project is ${timeframe}. Based on this information, could you help me estimate a 
reasonable funding goal for my campaign? Please provide a minimum, maximum, and recommended amount in ETH, 
along with a rationale for your recommendation.`;

    const response = await getAIAssistance(prompt, userId);

    if (response.goalEstimate) {
      return {
        min: response.goalEstimate.min,
        max: response.goalEstimate.max,
        recommended: response.goalEstimate.recommendedAmount,
        rationale: response.goalEstimate.rationale
      };
    }

    return {
      min: '0',
      max: '0',
      recommended: '0',
      rationale: 'Could not estimate funding goal.'
    };
  } catch (error) {
    console.error('Error getting funding goal estimation:', error);
    return {
      min: '0',
      max: '0',
      recommended: '0',
      rationale: 'An error occurred while estimating funding goal.'
    };
  }
};

// Function to get milestone suggestions
export const getMilestoneSuggestions = async (
  idea: string,
  timeframe: string,
  userId: number
): Promise<{ name: string; description: string; timeframe: string }[]> => {
  try {
    const prompt = `I'm creating a crowdfunding campaign for ${idea}. The timeframe for the project is ${timeframe}. 
Could you suggest a set of milestones for my project? I need meaningful checkpoints that I can share with my 
backers to show progress. For each milestone, please provide a name, description, and expected timeframe.`;

    const response = await getAIAssistance(prompt, userId);

    return response.milestones || [];
  } catch (error) {
    console.error('Error getting milestone suggestions:', error);
    return [];
  }
};