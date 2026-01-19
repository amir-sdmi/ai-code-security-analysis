import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔹 await is used for all asynchronous operations, not just database queries.
// Fetching Data from a Database (like Prisma, MongoDB, etc.)
// Calling an API (e.g., Fetch Data from a Server)
// Waiting for AI/ML Model Responses ( const result = await model.generateContent(prompt); )
// Using setTimeout with await (Delay Execution
// Reading from a File (Node.js - File System)


// Initialize the AI model using the API key stored in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Define a scheduled function to generate industry insights
export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" }, // Name of the function
  { cron: "0 0 * * 0" }, // Run every Sunday at midnight
  async ({ event, step }) => {
    // Fetch all industries from the database
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },  // Only fetch the industry names
      });
    });

    // Loop through each industry and generate insights
    for (const { industry } of industries) {
        // Define a prompt to ask AI for industry insights in JSON format
      const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

        // Call Gemini AI to generate content based on the prompt
      const res = await step.ai.wrap(
        "gemini", // Use Gemini AI model
        async (p) => {
          return await model.generateContent(p);
        },
        prompt // Send the prompt to the AI model
      );

      // Extract the text content from the AI response
      const text = res.response.candidates[0].content.parts[0].text || "";
      // Clean the text by removing extra JSON formatting (if any)
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

      // Parse the cleaned JSON response into a JavaScript object
      const insights = JSON.parse(cleanedText);

      // Update the database with the new insights for the industry
      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.update({
          where: { industry }, // Find the industry in the database
          data: {
            ...insights, // Update with the new AI-generated insights
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Schedule next update in 7 days
          },
        });
      });
    }
  }
);

