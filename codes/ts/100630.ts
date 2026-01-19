import { getDriveService } from "./google-drive-api-service";
import fetch from "node-fetch";
import { File } from "src/schema/google"

const openaiKey = process.env.OPENAI_API_KEY;

/**
 * Generates memo summary with chatGPT service 
 *
 * @param file File metadata
 * @returns summary text as string
 */
export const generateSummary = async (file: File): Promise<string> => {
  const drive = await getDriveService();
  try {
    const text = await drive.files.export({
      fileId: file.id,
      mimeType: "text/plain"
    }).then(res => res.data);

    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`,
    };
    const summarizeInEn = `Generate a summary for the following document in English: ${text}`;
    const summarizeInFi =  `Generate a summary for the following document in Finnish: ${text}`;
    const body = (content) => JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "user", content: content},
      ],
      max_tokens: 200
    });

    const englishSummary = (await (await fetch(url, {
      method: "POST",
      headers: headers,
      body : body(summarizeInEn)
    })).json()).choices[0].message.content;

    const finnishSummary = (await (await fetch(url, {
      method: "POST",
      headers: headers,
      body : body(summarizeInFi)
    })).json()).choices[0].message.content;
    return englishSummary + "|" + finnishSummary;
  } catch (error) {
    console.error("Error generating description:", error);
  }
}