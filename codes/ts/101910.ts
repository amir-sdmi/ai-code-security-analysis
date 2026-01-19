'use server';
/**
 * @fileOverview An AI agent to chat about ABAP code, provide explanations, examples, and optionally suggest code modifications.
 * Only exports the `abapChatFlow` async function.
 */

import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import type { AbapChatInput, AbapChatResponse } from '@/ai/schemas/abap-chat-schemas'; // Import types from schema file
import { AbapChatInputSchema, AbapChatResponseSchema } from '@/ai/schemas/abap-chat-schemas'; // Import schemas


// Define the simplified prompt structure (remains the same)
// 🧱 Using the simplified prompt for debugging
const simplifiedPromptTemplate = `Kod: {{currentCode}}
Soru: {{userQuery}}
Yanıtını 'responseText' ve 'proposedCode' alanlarını içeren bir JSON nesnesi olarak döndür.`;

// Define the Genkit flow logic logic
const abapChatFlowLogic = async (
    input: AbapChatInput, // The wrapper function passes the full input including API key
    aiInstance: Genkit, // Accept AI instance dynamically
    modelName: string // Pass the model name to use
): Promise<AbapChatResponse> => {
  console.log('>>>> [CHAT_LOGIC_DIRECT] Starting ABAP chat flow logic (Direct Generate Call).');
  console.log('>>>> [CHAT_LOGIC_DIRECT] Received full input:', { userQueryLength: input.userQuery?.length, codeLength: input.currentCode?.length, apiKeyPresent: !!input.apiKey, modelToUse: modelName });

  // Prepare input for the direct generate call
  const promptInput = {
      currentCode: input.currentCode || '', // Provide default empty string
      userQuery: input.userQuery || '',   // Provide default empty string
  };

  // 🧪 Check for empty input *before* sending
  if (!promptInput.currentCode || !promptInput.userQuery) {
      console.error('<<<< [CHAT_LOGIC_DIRECT] Hatalı giriş: currentCode veya userQuery boş.');
      throw new Error('Kod veya sorgu boş olamaz (Sunucu Tarafı Kontrol).');
  }

  // Manually construct the prompt string using the template and input
  // Basic replacement - not using Handlebars here for direct call
  const promptText = simplifiedPromptTemplate
    .replace('{{currentCode}}', promptInput.currentCode)
    .replace('{{userQuery}}', promptInput.userQuery);

  // Log the exact input being sent to the generate call
  console.log('>>>> [CHAT_LOGIC_DIRECT] Preparing generate call input:', {
      promptLength: promptText.length,
      model: modelName,
      // outputFormat: 'json', // Specify JSON output
      // outputSchema: AbapChatResponseSchema, // Provide schema for structure guidance
      // Config might be needed for JSON mode
      config: { responseMimeType: 'application/json' } // Request JSON output directly
  });
  console.log('>>>> [CHAT_LOGIC_DIRECT] Prompt Text Snippet:', promptText.substring(0, 200) + '...');


  try {
    console.log(`>>>> [CHAT_LOGIC_DIRECT] Calling ai.generate with prepared input using model ${modelName}...`);

    // Use a direct ai.generate call
    const response = await aiInstance.generate({
        model: modelName, // Explicitly set model
        prompt: promptText, // Send the constructed prompt string
        // Request JSON output directly if supported by the model/SDK version
        // This might be needed for structured output without definePrompt
        // Check Genkit/Google AI SDK docs for the correct way to request JSON
        // outputFormat: 'json', // This might be the correct syntax
        config: { responseMimeType: 'application/json' }, // Or maybe config is used

        // Explicitly add default model parameters
        // modelOptions: { // This might be nested under config or top-level
        //     temperature: 0.7,
        //     maxOutputTokens: 1024,
        //     topP: 1,
        // },
    });

    console.log('<<<< [CHAT_LOGIC_DIRECT] AI generate call completed.');

    const output = response.output; // Access the output directly

    if (!output) {
      console.error('<<<< [CHAT_LOGIC_DIRECT] Genkit generate call did not return an output.');
      throw new Error('AI yanıt vermedi (Model boş yanıt döndürdü).');
    }

     // Log the raw output received from the model
     console.log('<<<< [CHAT_LOGIC_DIRECT] Raw output from AI:', JSON.stringify(output, null, 2));


    // Since we requested JSON, the output might already be parsed
    // Adjust parsing based on the actual structure received
    let parsedOutput: AbapChatResponse;
    if (typeof output === 'string') {
        try {
            parsedOutput = JSON.parse(output);
             // Validate parsed structure against schema
             const validation = AbapChatResponseSchema.safeParse(parsedOutput);
             if (!validation.success) {
                 console.error("<<<< [CHAT_LOGIC_DIRECT] AI response failed Zod validation:", validation.error.errors);
                 // Attempt to extract text even if structure is wrong
                 const textFallback = output.match(/"responseText"\s*:\s*"([^"]*)"/)?.[1];
                 throw new Error(`AI yanıt formatı hatalı. ${textFallback ? `Ancak şu metin alındı: "${textFallback.substring(0,100)}..."` : 'Metin de çıkarılamadı.'}`);
             }
             parsedOutput = validation.data;
        } catch (e) {
             console.error('<<<< [CHAT_LOGIC_DIRECT] Failed to parse AI response as JSON:', e);
             // Fallback: Treat the raw string output as the responseText if JSON parsing fails
             parsedOutput = { responseText: output, proposedCode: null };
             // throw new Error('AI yanıtı geçerli JSON formatında değil.');
        }
    } else if (typeof output === 'object' && output !== null) {
         // If output is already an object, validate it
         const validation = AbapChatResponseSchema.safeParse(output);
         if (!validation.success) {
             console.error("<<<< [CHAT_LOGIC_DIRECT] AI object response failed Zod validation:", validation.error.errors);
              // Attempt to extract text even if structure is wrong
             const textFallback = (output as any)?.responseText;
             throw new Error(`AI yanıt formatı hatalı. ${textFallback ? `Ancak şu metin alındı: "${String(textFallback).substring(0,100)}..."` : 'Metin de çıkarılamadı.'}`);
         }
          parsedOutput = validation.data;
    } else {
        console.error('<<<< [CHAT_LOGIC_DIRECT] Unexpected AI output type:', typeof output);
        throw new Error('AI\'dan beklenmeyen yanıt türü alındı.');
    }


    // Ensure proposedCode is explicitly null if empty or undefined
    const finalResponse: AbapChatResponse = {
        responseText: parsedOutput.responseText,
        proposedCode: parsedOutput.proposedCode || null,
    };

    console.log('<<<< [CHAT_LOGIC_DIRECT] Parsed response from AI:', { responseTextLength: finalResponse.responseText?.length, proposedCodeExists: !!finalResponse.proposedCode }); // Log response summary
    return finalResponse;

  } catch (error: unknown) {
    // Log the full error object for detailed debugging
    console.error('<<<< [CHAT_LOGIC_DIRECT] Error during AI chat flow logic:', error);
    // Attempt to serialize the error for better logging, handle potential circular structures
    try {
        // Include name, message, stack, and potentially other properties
        const errorDetails = JSON.stringify(error, ['name', 'message', 'stack', 'cause', 'details', 'status', 'code'], 2);
        console.error('<<<< [CHAT_LOGIC_DIRECT] Error Details:', errorDetails);
    } catch (stringifyError) {
        console.error('<<<< [CHAT_LOGIC_DIRECT] Error serializing error details:', stringifyError);
        console.error('<<<< [CHAT_LOGIC_DIRECT] Raw Error Object:', error); // Log raw object if stringify fails
    }

    // Provide more specific error messages
    let errorMessage = 'AI sohbeti sırasında bir hata oluştu (Sunucu tarafı).'; // Default server-side message
    if (error instanceof Error) {
        errorMessage = `AI sohbeti sırasında bir hata oluştu: ${error.message}`; // Base on error message if available

        // Refine specific error messages based on common patterns
        if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
            errorMessage = `AI sohbeti başarısız oldu: Geçersiz API Anahtarı. Lütfen Ayarlar menüsünden anahtarınızı kontrol edin.`;
        } else if (error.message.includes('invalid argument') || error.message.includes('Invalid argument')) {
            // Keep this specific message as it's the one we're seeing
            errorMessage = `AI sohbeti başarısız oldu: Geçersiz argüman. Modele gönderilen veri (kod veya sorgu) formatında bir sorun olabilir. Detaylar için sunucu loglarına bakın.`;
        } else if (error.message.includes('400 Bad Request')) {
             errorMessage = `AI sohbeti başarısız oldu: API isteği geçersizdi (400 Bad Request). Girdi verilerini, API yapılandırmasını veya model uyumluluğunu kontrol edin. Detaylar için sunucu loglarına bakın.`;
        } else if (error.message.includes('timeout')) {
             errorMessage = 'AI yanıtı zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('rate limit') || error.message.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'AI istek limiti aşıldı. Lütfen bir süre bekleyip tekrar deneyin.';
        } else if (error.message.includes('no output') || error.message.includes('Model boş yanıt döndürdü')) {
             errorMessage = 'AI modelinden yanıt alınamadı. Farklı bir soruyla tekrar deneyin veya modelde bir sorun olabilir.';
        } else if (error.message.includes('Failed to parse AI response as JSON') || error.message.includes('AI yanıt formatı hatalı')) {
             errorMessage = `AI yanıtı işlenemedi: ${error.message}. Model beklenen JSON formatında yanıt vermemiş olabilir.`;
        }
        // Keep the refined or original error message
    } else {
         // Handle non-Error objects if necessary
         errorMessage = `AI sohbeti sırasında bilinmeyen bir hata oluştu: ${String(error)}`;
    }

    // Throw a new error with the potentially more specific message
    throw new Error(errorMessage);
  }
};


// Exported wrapper function to call the flow
export async function abapChatFlow(input: AbapChatInput): Promise<AbapChatResponse> {
    let aiInstance: Genkit;
    // 🧱 Consistently use 1.5-flash unless a specific reason exists to change
    const modelToUse = 'googleai/gemini-1.5-flash'; // Define the model consistently

    // Use user-provided API key if available, otherwise fall back to environment variable
    const apiKeyToUse = input.apiKey || process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKeyToUse) {
        console.error("<<<< [CHAT_WRAPPER] No Google AI API Key found in input or environment variables for chat.");
        throw new Error('Google AI API Anahtarı bulunamadı. Lütfen Ayarlar menüsünden bir anahtar girin veya sunucu ortam değişkenlerini yapılandırın.');
    }

    console.log(`>>>> [CHAT_WRAPPER] Using provided or environment API key for Genkit chat initialization with model ${modelToUse}.`);
    try {
        // Explicitly use gemini-1.5-flash
        aiInstance = genkit({
            plugins: [
            googleAI({
                apiKey: apiKeyToUse,
            }),
            ],
            model: modelToUse, // Set the default model for the instance
             logLevel: 'debug', // Enable debug logging for Genkit
        });
        console.log(`>>>> [CHAT_WRAPPER] Genkit instance for chat initialized successfully with model ${modelToUse}.`);
    } catch (initError) {
        console.error("<<<< [CHAT_WRAPPER] Error initializing local Genkit instance for chat:", initError);
        throw new Error(`Genkit (chat) başlatılırken hata oluştu: ${initError instanceof Error ? initError.message : String(initError)}`);
    }


   // Define the flow dynamically using the chosen AI instance and the logic function
   const dynamicAbapChatFlow = aiInstance.defineFlow<
     typeof AbapChatInputSchema,
     typeof AbapChatResponseSchema
   >(
     {
       name: 'abapChatFlow_dynamic_direct', // New name for direct call flow
       inputSchema: AbapChatInputSchema,
       outputSchema: AbapChatResponseSchema,
     },
     // Pass the AI instance, the full input, AND the model name to the logic function
     (flowInput) => abapChatFlowLogic(flowInput, aiInstance, modelToUse)
   );

   // Execute the dynamically defined flow
   try {
       console.log('>>>> [CHAT_WRAPPER] Executing dynamic ABAP chat flow (direct generate)...');
       const result = await dynamicAbapChatFlow(input);
       console.log('<<<< [CHAT_WRAPPER] Dynamic ABAP chat flow (direct generate) executed successfully.');
       return result;
   } catch (flowError) {
        console.error('<<<< [CHAT_WRAPPER] Error executing the dynamic ABAP chat flow (direct generate):', flowError);
        // Re-throw the error potentially caught and processed in abapChatFlowLogic
        if (flowError instanceof Error) {
            throw flowError;
        } else {
             throw new Error(`AI sohbet akışı (direct generate) yürütülürken bilinmeyen bir hata oluştu: ${String(flowError)}`);
        }
   }
}
