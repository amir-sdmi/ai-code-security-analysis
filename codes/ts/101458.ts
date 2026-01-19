
'use server';
/**
 * @fileOverview Generates custom design concepts (images and descriptions) based on user's emotion and chosen design type.
 *
 * - generateCustomDesign - A function that takes an emotion and design type, then returns a design image and description.
 * - GenerateCustomDesignInput - The input type for the generateCustomDesign function.
 * - GenerateCustomDesignOutput - The return type for the generateCustomDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DesignTypeSchema = z.enum(['3d_model_concept', 'digital_art', 'wearable_design', 'phone_wallpaper', 'desktop_wallpaper']);
export type DesignType = z.infer<typeof DesignTypeSchema>;

const GenerateCustomDesignInputSchema = z.object({
  emotion: z.string().min(1, {message: "Emotion cannot be empty."}).describe('The emotional state to base the design on (e.g., joyful, serene, powerful).'),
  designType: DesignTypeSchema.describe("The type of design to generate: '3d_model_concept', 'digital_art', 'wearable_design', 'phone_wallpaper', or 'desktop_wallpaper'."),
  designPromptOverride: z.string().optional().describe('Optional user-provided prompt to guide the design generation, supplementing the emotion and type.'),
});
export type GenerateCustomDesignInput = z.infer<typeof GenerateCustomDesignInputSchema>;

const GenerateCustomDesignOutputSchema = z.object({
  designImageUrl: z.string().describe(
    "The generated design image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
  ),
  designDescription: z.string().describe("A brief AI-generated description of the created design and how it relates to the emotion."),
  suggestedTitle: z.string().describe("An AI-generated creative title for the design."),
});
export type GenerateCustomDesignOutput = z.infer<typeof GenerateCustomDesignOutputSchema>;

export async function generateCustomDesign(input: GenerateCustomDesignInput): Promise<GenerateCustomDesignOutput> {
  return generateCustomDesignFlow(input);
}

const generateBasePromptText = (emotion: string, designType: DesignType, designPromptOverride?: string): string => {
  let basePrompt = "";
  switch (designType) {
    case '3d_model_concept':
      basePrompt = `Generate a **high-resolution, detailed, and visually striking** conceptual image of a 3D printable sculpture or object that embodies the feeling of '${emotion}'. The style should be futuristic, artistic, and abstract. Focus on form, texture, light, and shadow to convey the emotion. The image should be a compelling and professional-quality representation of this concept. Ensure the primary subject is clear and well-defined.`;
      break;
    case 'digital_art':
      basePrompt = `Generate a piece of **high-definition, intricate, and visually rich** abstract digital art, suitable as an NFT concept, that captures the essence of '${emotion}'. The style should be futuristic, visually striking, and emotionally resonant. Use vibrant colors (or a specific palette if implied by emotion), complex textures, dynamic lighting, and abstract forms to create a compelling, professional-grade piece.`;
      break;
    case 'wearable_design':
      basePrompt = `Generate a **clear, high-fidelity, and production-quality** design concept for a futuristic wearable item (like a t-shirt graphic, a pattern for fabric, or an accessory motif) that visually represents the emotion '${emotion}'. The design should be modern, stylish, and suitable for application on apparel or gadgets. Show the design clearly with sharp details and appealing aesthetics.`;
      break;
    case 'phone_wallpaper':
      basePrompt = `Generate a **high-resolution, vertically oriented (portrait aspect ratio, e.g., 9:16 or 9:19.5)** abstract digital art piece suitable as a phone wallpaper that embodies the feeling of '${emotion}'. The style should be artistic, visually captivating, and mood-enhancing. Focus on color palettes, textures, and abstract forms that are aesthetically pleasing on a smaller, vertical screen. Avoid overly complex details that might get lost.`;
      break;
    case 'desktop_wallpaper':
      basePrompt = `Generate a **high-resolution, landscape-oriented (e.g., 16:9 or 16:10 aspect ratio)** abstract digital art piece suitable as a desktop wallpaper that embodies the feeling of '${emotion}'. The style should be artistic, visually expansive, and create a specific mood for a workspace. Consider composition that works well with desktop icons and windows. Focus on immersive color palettes, textures, and broad abstract forms.`;
      break;
    default:
      basePrompt = `Generate an artistic visual representation of the emotion '${emotion}'. The style should be abstract and futuristic, with attention to detail and quality.`;
  }

  if (designPromptOverride) {
    basePrompt += ` Additional user guidance: "${designPromptOverride}".`;
  }
  // Instructions for the image generation model to include title and description in its text output
  return `${basePrompt} In your text response, also provide a short, evocative title for this design, and a brief description explaining how it captures the essence of '${emotion}'. Label them clearly, for example: "Title: [Your Title]" and "Description: [Your Description]".`;
};

// New prompt to extract structured details from the text generated by gemini-2.0-flash-exp
const extractDesignDetailsPrompt = ai.definePrompt({
  name: 'extractDesignDetailsPrompt',
  // Uses the default model specified in genkit.ts (googleai/gemini-2.0-flash) which is good at JSON.
  input: { schema: z.object({ rawTextFromImageGenerator: z.string().describe("Text generated by an image model, containing a title and description for a design.") }) },
  output: { schema: z.object({ suggestedTitle: z.string(), designDescription: z.string() }) },
  prompt: `From the following text, extract the "suggestedTitle" and "designDescription" for the design.
The text was generated by an AI image model that was asked to also provide a title and description.
Look for phrases like "Title: ..." and "Description: ...", but be flexible if the formatting isn't exact.

Text from image generator:
{{{rawTextFromImageGenerator}}}

Respond ONLY with a JSON object adhering to the output schema (suggestedTitle, designDescription).
If you absolutely cannot find a clear title or description, provide a generic one like "Untitled Design" or "An abstract representation."
`,
});


const generateCustomDesignFlow = ai.defineFlow(
  {
    name: 'generateCustomDesignFlow',
    inputSchema: GenerateCustomDesignInputSchema,
    outputSchema: GenerateCustomDesignOutputSchema,
  },
  async (input) => {
    const { emotion, designType, designPromptOverride } = input;
    const imageGenerationPromptText = generateBasePromptText(emotion, designType, designPromptOverride);

    // Step 1: Generate image and raw text using gemini-2.0-flash-exp
    const imageGenResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: imageGenerationPromptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include IMAGE for image generation
      },
      // IMPORTANT: Removed output: { schema: ... } here, as gemini-2.0-flash-exp might not support it well
    });

    const imageUrl = imageGenResponse.media?.url;
    const rawTextFromImageGenerator = imageGenResponse.text;

    if (!imageUrl) {
      throw new Error('Image generation failed or returned no media URL.');
    }
    if (!rawTextFromImageGenerator) {
      console.warn('Image generator did not return text, attempting to proceed with image only and generic details.');
      // Fallback: Proceed to extract details from an empty string, which should result in generic title/description
    }

    // Step 2: Extract structured title and description from the raw text using a standard model
    const detailsExtractionResult = await extractDesignDetailsPrompt({ rawTextFromImageGenerator: rawTextFromImageGenerator || "No text description provided by image generator." });
    
    if (!detailsExtractionResult.output || !detailsExtractionResult.output.suggestedTitle || !detailsExtractionResult.output.designDescription) {
        throw new Error('Failed to extract design title or description from the generated text.');
    }

    const { suggestedTitle, designDescription } = detailsExtractionResult.output;

    return {
      designImageUrl: imageUrl,
      suggestedTitle: suggestedTitle,
      designDescription: designDescription,
    };
  }
);

