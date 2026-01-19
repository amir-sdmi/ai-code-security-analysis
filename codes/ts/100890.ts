
// Only generate images using Gemini (do not fallback or use Unsplash, picsum, etc)

import { supabase } from "@/integrations/supabase/client";

type ContentGenerationOptions = {
  temperature?: number;
  maxOutputTokens?: number;
};

export async function generateContent(
  prompt: string, 
  options: ContentGenerationOptions = {}
): Promise<string> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Authentication required to use Gemini API");

    const response = await supabase.functions.invoke("gemini-content", {
      body: { 
        prompt,
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.error) throw new Error(response.error.message || "Failed to generate content");
    if (!response.data) throw new Error("Received invalid response from Gemini API");

    const { success, error, content, fallbackContent } = response.data;
    if (!success && fallbackContent) return fallbackContent;
    if (!success) throw new Error(error || "Failed to generate content");
    if (!content || typeof content !== 'string') throw new Error("Received empty or invalid content from Gemini API");

    return content;
  } catch (error) {
    return `# Generated Content\n\nWe're experiencing some technical difficulties. Here's some placeholder content related to your request.\n\n## Key Points\n\n* This is an automatically generated fallback due to a service disruption\n* Your original request was about: "${prompt.substring(0, 50)}..."\n* Please try again later or contact support if the issue persists`;
  }
}

// -- Only use gemini-image function, do not fallback to picsum/unsplash --
export async function generateImage(
  prompt: string
): Promise<string> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Authentication required to use image generation");

    // Call gemini-image only – do NOT use fallback
    const response = await supabase.functions.invoke("gemini-image", {
      body: { prompt },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.error) throw new Error(response.error.message || "Failed to generate image");
    if (!response.data) throw new Error("Image Generation API returned unexpected response.");

    const { success, error, imageUrl } = response.data;
    if (!success) throw new Error(error || "Failed to generate image");
    if (!imageUrl || typeof imageUrl !== 'string') throw new Error("Received empty or invalid image URL from image generation API");

    return imageUrl;
  } catch (error) {
    throw error;
  }
}
