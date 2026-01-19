import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // This prompt is the same, but we'll use Gemini's features for JSON output.
    const prompt = `
      Act as a higher education trend analyst. Provide a concise, up-to-date summary of college application trends for the most recent application cycle.
      The output must be a single, clean JSON object and nothing else.
      The JSON object should have four top-level keys: "keyMetrics", "applicationTrends", "acceptanceRates", and "popularMajors".
      
      - "keyMetrics" should be an array of objects, each with a "title" (e.g., "Application Growth"), a "value" (e.g., "+12%"), and a "change" (e.g., "increase"). Include 3-4 metrics.
      - "applicationTrends" should be a single paragraph of text (string) summarizing the main trends like test-optional policies and the FAFSA situation.
      - "acceptanceRates" should be an array of objects, each with a "school" name and a "rate" string (e.g., "3.59%"). List 8-10 universities from all over the world, including but not limited to: National University of Singapore, University of Oxford, University of Toronto, ETH Zurich, University of Melbourne, Tsinghua University, University of Tokyo, and other globally recognized institutions. Do not limit to US or Ivy League schools.
      - "popularMajors" should be an array of strings, listing the top 5 most popular undergraduate majors.
    `;

    // Get the Gemini model. 'gemini-1.5-flash-latest' is fast and effective.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      // This enforces JSON output from the model!
      generationConfig: {
        response_mime_type: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const reportDataText = response.text();
    
    // Parse the JSON string from the model's response
    const reportData = JSON.parse(reportDataText);

    // Add a timestamp for when the data was fetched
    reportData.lastFetched = new Date().toISOString();

    // Cache the response on Vercel's Edge for 24 hours (86400 seconds)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    
    return res.status(200).json(reportData);

  } catch (error) {
    console.error("Error fetching from Google Gemini API:", error);
    return res.status(500).json({ message: "Failed to fetch report data." });
  }
}
