import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { extractCompanies } from "@/lib/openai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Find the associated symbols for a given company name
 */
export async function findCompanySymbols(
  userPrompt: string
): Promise<string[]> {
  // Step 1: Extract company names and symbols using ChatGPT
  const extractedCompanies = await extractCompanies(userPrompt);

  // Step 2: Return only the symbols from the extracted data
  const symbols = extractedCompanies.map((company) => company.symbol);

  console.log("Extracted Symbols:", symbols);
  return symbols;
}

/**
 * Helper function to split gigantic earning call transcripts into more manageable chunks
 * This is done to avoid hitting token limits with langchain's openAI
 */
export function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split text into sentences using period and newline as delimiters
  const sentences = text.split(/(?<=\.)|\n/);

  for (const sentence of sentences) {
    // If adding the current sentence exceeds the max chunk size
    if (currentChunk.length + sentence.length > maxChunkSize) {
      chunks.push(currentChunk.trim()); // Push the current chunk
      currentChunk = ""; // Start a new chunk
    }
    currentChunk += sentence; // Add sentence to the current chunk
  }

  // Push the last chunk if any content remains
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generic delay function to timeout for x seconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function to move a financial quarter to the previous quarter
 */
export const moveToPreviousQuarter = (
  year: number,
  quarter: "Q1" | "Q2" | "Q3" | "Q4"
): { year: number; quarter: "Q1" | "Q2" | "Q3" | "Q4" } => {
  if (quarter === "Q1") return { year: year - 1, quarter: "Q4" };
  if (quarter === "Q2") return { year, quarter: "Q1" };
  if (quarter === "Q3") return { year, quarter: "Q2" };
  return { year, quarter: "Q3" }; // Q4 case
};
