import { geminiClient } from "./gemini-client";
import { processMarketAnalysisContent } from "./market-analysis/content-processing";

// Define types for grounding metadata
interface GroundingMetadata {
  webSearchQueries?: string[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
  groundingChunks?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
  groundingSupports?: Array<{
    segment: {
      startIndex?: number;
      endIndex?: number;
      text: string;
    };
    groundingChunkIndices: number[];
    confidenceScores: number[];
  }>;
}

// Extend the GenerateContentCandidate type to include groundingMetadata
declare module "@google/generative-ai" {
  interface GenerateContentCandidate {
    groundingMetadata?: GroundingMetadata;
  }
}

export interface MarketAnalysisResult {
  content: string;
  htmlContent: string;
  isGrounded: boolean;
  searchSuggestions: string[];
  renderedContent: string | null;
  groundingChunks?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
  chartData?: {
    pieChart?: Array<{ name: string; value: number; unit?: string }>;
    areaChart?: Array<{ name: string; value: number; unit?: string }>;
    barChart?: Array<{
      name: string;
      value: number;
      unit?: string;
      secondaryValue?: number;
      secondaryUnit?: string;
    }>;
  };
  summary?: string;
}

// Define the chart data schema for reuse across functions
export const chartDataSchema = {
  type: "OBJECT",
  properties: {
    pieChart: {
      type: "ARRAY",
      description:
        "Market share distribution data using actual percentages from reliable sources. Values must sum to 100%.",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description:
              "Company or segment name (e.g., 'Microsoft', 'Cloud Services', 'Others')",
          },
          value: {
            type: "NUMBER",
            description: "Market share percentage (0-100)",
          },
          unit: {
            type: "STRING",
            description: "Unit for the value (e.g., '%')",
            optional: true,
          },
        },
        required: ["name", "value"],
      },
      minItems: 3,
      maxItems: 8,
    },
    areaChart: {
      type: "ARRAY",
      description:
        "Historical market size data from 2019-2024 using actual values in billions USD",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description: "Year in YYYY format",
          },
          value: {
            type: "NUMBER",
            description: "Market size in billions USD",
          },
          unit: {
            type: "STRING",
            description: "Unit for the value (e.g., 'B USD', 'M users')",
            optional: true,
          },
        },
        required: ["name", "value"],
      },
      minItems: 5,
      maxItems: 10,
    },
    barChart: {
      type: "ARRAY",
      description:
        "Comparison of actual metrics (revenue, users, etc.) across companies or segments. Do not include project values.",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description:
              "Metric and company/segment (e.g., 'Revenue - Microsoft', 'Users - Cloud Services')",
          },
          value: {
            type: "NUMBER",
            description: "Primary metric value",
          },
          unit: {
            type: "STRING",
            description: "Unit for the value (e.g., 'B USD', 'M users', '%')",
            optional: true,
          },
          secondaryValue: {
            type: "NUMBER",
            description: "Optional secondary metric value",
            optional: true,
          },
          secondaryUnit: {
            type: "STRING",
            description: "Unit for the secondary value",
            optional: true,
          },
        },
        required: ["name", "value"],
      },
      minItems: 3,
      maxItems: 8,
    },
  },
  required: ["pieChart", "areaChart", "barChart"],
};

/**
 * Generate a market analysis for a project using Gemini 2.0 with Google Search
 */
export async function generateMarketAnalysis(
  projectDescription: string
): Promise<MarketAnalysisResult> {
  try {
    // Modify the prompt to request HTML with Tailwind formatting
    const prompt = `
      Analyze the following project idea and provide a detailed market analysis:
      
      Structure your response with the following sections:
      1. A brief summary of the project
      2. Key Competitors
      3. Market Trends
      4. Market Opportunities
      5. Market Size Estimate
      6. Recommendations
      
      Format your response as HTML with Tailwind CSS classes. Use the following guidelines:
      - Use <h1>, <h2>, <h3> tags for headings with appropriate Tailwind classes
      - Use <p> tags for paragraphs with appropriate Tailwind classes
      - Use <ul> and <li> tags for lists with appropriate Tailwind classes
      - Include relevant statistics and data when available
      - Cite your sources using superscript notation (e.g., <sup>1</sup>) and provide a sources section at the end
      - Use Tailwind classes for styling: text-lg for normal text, text-xl for important points, font-semibold for emphasis
      - For headings use: text-2xl font-bold text-primary for main headings, text-xl font-semibold for subheadings
      - For lists use: list-disc pl-5 space-y-2 my-4
      - For paragraphs use: my-4 text-gray-800 dark:text-gray-200
      
      Project: ${projectDescription}
    `;

    const result = await geminiClient.generateWithGemini2(prompt);

    // Extract the grounded content
    let content = result.response.text();

    // Remove markdown code blocks and language tags
    content = content
      .replace(/```(\w+)?\n/g, "") // Remove opening code block with optional language
      .replace(/```\n?/g, "") // Remove closing code block
      .trim();

    // Process the content to remove meta-explanations and format properly
    content = processMarketAnalysisContent(content, { format: "html" });

    // Check if we have grounding metadata
    const candidates = result.response.candidates || [];
    const firstCandidate = candidates[0];
    const groundingMetadata = firstCandidate?.groundingMetadata;

    // Extract search suggestions if available
    const searchSuggestions = groundingMetadata
      ? groundingMetadata.webSearchQueries || []
      : [];

    // Get rendered content for Google Search Suggestions
    const renderedContent = geminiClient.getSearchSuggestions(result);

    // Get grounding chunks for sources
    const groundingChunks = groundingMetadata?.groundingChunks;

    // Extract source URLs from grounding chunks
    const sourceUrls = groundingChunks
      ? groundingChunks
          .filter((chunk) => chunk.web)
          .map((chunk) => {
            if (chunk.web) {
              return `${chunk.web.title}: ${chunk.web.uri}`;
            }
            return "";
          })
          .filter((url) => url !== "")
      : [];

    // Now generate chart data using structured output
    const chartDataPrompt = `
      Based on the following project description and the latest market data from 2024, generate realistic chart data for market analysis visualization.
      Use these guidelines for data accuracy:
      
      1. Market Share Distribution (pieChart):
         - Use actual market share percentages of major companies in the relevant sector
         - Include "Others" category to account for smaller players
         - Values should sum to 100%
         - Label format: "Company Name" or "Segment Name"
      
      2. Market Growth Trends (areaChart):
         - Show market size in billions USD from 2019 to 2024
         - Use actual historical data where available
         - Include proper units in labels (e.g., "$390.94B" instead of just "390.94")
         - Label format: "YYYY" for years
      
      3. Key Metrics Comparison (barChart):
         - Compare actual metrics like revenue, user base, or market penetration
         - Use the latest available data from 2024
         - Include proper units in labels (e.g., "$", "M users", "%")
         - Do not include hypothetical values for the project
         - Label format: "Metric - Company/Segment"
      
      Project Description: ${projectDescription}
      
      Note: Focus on providing accurate, real-world data from reliable sources. Do not include speculative values for the project itself.
    `;

    // Generate structured chart data
    const chartDataResult = await geminiClient.generateWithStructuredOutput(
      chartDataPrompt,
      chartDataSchema
    );

    // Extract the chart data from the response
    let chartData;
    try {
      // Get the raw text response
      const responseText = chartDataResult.response.text();

      // Try to extract JSON from the response
      // First, look for JSON within code blocks if present
      let jsonText = responseText;

      // Remove any markdown code block indicators if present
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*$/g, "");

      // Trim any whitespace
      jsonText = jsonText.trim();

      // Parse the JSON
      chartData = JSON.parse(jsonText);
      console.log("Generated chart data:", chartData);
    } catch (error) {
      console.error("Error parsing chart data:", error);
      // Provide fallback chart data if parsing fails
      chartData = {
        pieChart: [
          { name: "Your Product", value: 35 },
          { name: "Competitor A", value: 25 },
          { name: "Competitor B", value: 20 },
          { name: "Others", value: 20 },
        ],
        areaChart: [
          { name: "2020", value: 100 },
          { name: "2021", value: 120 },
          { name: "2022", value: 150 },
          { name: "2023", value: 200 },
          { name: "2024", value: 250 },
        ],
        barChart: [
          { name: "Feature Richness", value: 8, secondaryValue: 6 },
          { name: "User Experience", value: 9, secondaryValue: 7 },
          { name: "Performance", value: 7, secondaryValue: 8 },
        ],
      };
    }

    // Process the content to create both markdown and HTML versions
    let htmlContent = content;

    // If we have grounding supports, we can add source references
    if (
      groundingMetadata &&
      firstCandidate.groundingMetadata?.groundingSupports &&
      groundingChunks
    ) {
      // Add a sources section at the end if not already present
      if (!htmlContent.includes("<h2") && groundingChunks.length > 0) {
        htmlContent += `
          <h2 class="text-xl font-semibold mt-8 mb-4 text-primary">Sources</h2>
          <ol class="list-decimal pl-5 space-y-2">
            ${groundingChunks
              .map((chunk) => {
                if (chunk.web) {
                  return `<li class="text-sm text-gray-700 dark:text-gray-300">
                <a href="${chunk.web.uri}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                  ${chunk.web.title}
                </a>
              </li>`;
                }
                return "";
              })
              .join("")}
          </ol>
        `;
      }
    }

    // Create a markdown version for backward compatibility
    let markdownContent = content;

    // If the response is HTML, convert it to markdown for backward compatibility
    if (
      content.includes("<h1") ||
      content.includes("<h2") ||
      content.includes("<p")
    ) {
      // This is a very basic HTML to markdown conversion for backward compatibility
      markdownContent = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<ul[^>]*>(.*?)<\/ul>/gi, "$1\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<sup>(.*?)<\/sup>/gi, "^$1")
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<[^>]*>/g, ""); // Remove any remaining HTML tags

      // Add sources section in markdown format if needed
      if (groundingMetadata && groundingChunks && groundingChunks.length > 0) {
        markdownContent += "\n\n## Sources\n";
        groundingChunks.forEach((chunk, index) => {
          if (chunk.web) {
            markdownContent += `${index + 1}. ${chunk.web.title}\n`;
          }
        });
      }
    }

    return {
      content: markdownContent,
      htmlContent: htmlContent,
      isGrounded: !!groundingMetadata,
      searchSuggestions,
      renderedContent: renderedContent || null,
      groundingChunks,
      chartData,
    };
  } catch (error) {
    console.error("Error generating market analysis:", error);
    throw error;
  }
}

/**
 * Generate a concise summary of a market analysis
 * This uses Gemini to create a 1-2 paragraph summary of the full analysis
 */
export async function generateMarketAnalysisSummary(
  analysisContent: string
): Promise<string> {
  try {
    // Create a prompt that asks for a concise summary
    const summaryPrompt = `
      Below is a detailed market analysis. Please create a concise 1-2 paragraph summary that captures the most important insights.
      Focus on market size, growth potential, key competitors, and unique opportunities.
      Make the summary informative yet brief, highlighting only the most critical information.

      MARKET ANALYSIS:
      ${analysisContent}
    `;

    // Generate the summary using Gemini without search capabilities
    const result = await geminiClient.generateWithoutTools(
      summaryPrompt,
      0.5 // Lower temperature for more focused output
    );

    // Extract the summary content
    let summary = result.response.text();

    // Remove any markdown formatting
    summary = summary
      .replace(/^#+ /gm, "") // Remove headings
      .replace(/\*\*/g, "") // Remove bold
      .replace(/\*/g, "") // Remove italics
      .trim();

    return summary;
  } catch (error) {
    console.error("Error generating market analysis summary:", error);
    return "Unable to generate summary. Please refer to the full analysis.";
  }
}

/**
 * Generate a market analysis using Gemini 1.5 with dynamic retrieval
 * This is an alternative implementation that uses Gemini 1.5 Flash
 */
export async function generateMarketAnalysisWithDynamicRetrieval(
  projectDescription: string
): Promise<MarketAnalysisResult> {
  try {
    const prompt = `
      Analyze the following project idea and provide a detailed market analysis:
      
      Structure your response with the following sections:
      1. A brief summary of the project
      2. Key Competitors
      3. Market Trends
      4. Market Opportunities
      5. Market Size Estimate
      6. Recommendations
      
      Format your response as HTML with Tailwind CSS classes. Use the following guidelines:
      - Use <h1>, <h2>, <h3> tags for headings with appropriate Tailwind classes
      - Use <p> tags for paragraphs with appropriate Tailwind classes
      - Use <ul> and <li> tags for lists with appropriate Tailwind classes
      - Include relevant statistics and data when available
      - Cite your sources using superscript notation (e.g., <sup>1</sup>) and provide a sources section at the end
      - Use Tailwind classes for styling: text-lg for normal text, text-xl for important points, font-semibold for emphasis
      - For headings use: text-2xl font-bold text-primary for main headings, text-xl font-semibold for subheadings
      - For lists use: list-disc pl-5 space-y-2 my-4
      - For paragraphs use: my-4 text-gray-800 dark:text-gray-200
      
      Additionally, generate sample chart data in JSON format for visualizing the market analysis. Include the following chart data:
      
      1. Pie Chart data showing market share distribution among key competitors or market segments
      2. Area Chart data showing market growth trends over time (past 5 years)
      3. Bar Chart data comparing key metrics across competitors or market segments
      
      Format the chart data as a valid JSON object with the following structure:
      {
        "pieChart": [
          {"name": "Competitor/Segment 1", "value": 35},
          {"name": "Competitor/Segment 2", "value": 25},
          {"name": "Competitor/Segment 3", "value": 20},
          {"name": "Others", "value": 20}
        ],
        "areaChart": [
          {"name": "2020", "value": 100},
          {"name": "2021", "value": 120},
          {"name": "2022", "value": 150},
          {"name": "2023", "value": 180},
          {"name": "2024", "value": 220}
        ],
        "barChart": [
          {"name": "Metric 1", "value": 80, "secondaryValue": 65},
          {"name": "Metric 2", "value": 50, "secondaryValue": 45},
          {"name": "Metric 3", "value": 75, "secondaryValue": 70}
        ]
      }
      
      Make sure the chart data is realistic and relevant to the market analysis. The values should reflect the insights from your analysis.
      
      Project Description: ${projectDescription}
    `;

    const result = await geminiClient.generateWithGemini15(prompt);

    // Extract the grounded content
    let content = result.response.text();

    // Remove markdown code blocks and language tags
    content = content
      .replace(/```(\w+)?\n/g, "") // Remove opening code block with optional language
      .replace(/```\n?/g, "") // Remove closing code block
      .trim();

    // Process the content to remove meta-explanations and format properly
    content = processMarketAnalysisContent(content, { format: "html" });

    // Check if we have grounding metadata
    const candidates = result.response.candidates || [];
    const firstCandidate = candidates[0];
    const groundingMetadata = firstCandidate?.groundingMetadata;

    // Extract search suggestions if available
    const searchSuggestions = groundingMetadata
      ? groundingMetadata.webSearchQueries || []
      : [];

    // Get rendered content for Google Search Suggestions
    const renderedContent = geminiClient.getSearchSuggestions(result);

    // Get grounding chunks for sources
    const groundingChunks = groundingMetadata?.groundingChunks;

    // Extract source URLs from grounding chunks
    const sourceUrls = groundingChunks
      ? groundingChunks
          .filter((chunk) => chunk.web)
          .map((chunk) => {
            if (chunk.web) {
              return `${chunk.web.title}: ${chunk.web.uri}`;
            }
            return "";
          })
          .filter((url) => url !== "")
      : [];

    // Now generate chart data using structured output
    const chartDataPrompt = `
      Based on the following project description and the latest market data from 2024, generate realistic chart data for market analysis visualization.
      Use these guidelines for data accuracy:
      
      1. Market Share Distribution (pieChart):
         - Use actual market share percentages of major companies in the relevant sector
         - Include "Others" category to account for smaller players
         - Values should sum to 100%
         - Label format: "Company Name" or "Segment Name"
      
      2. Market Growth Trends (areaChart):
         - Show market size in billions USD from 2019 to 2024
         - Use actual historical data where available
         - Include proper units in labels (e.g., "$390.94B" instead of just "390.94")
         - Label format: "YYYY" for years
      
      3. Key Metrics Comparison (barChart):
         - Compare actual metrics like revenue, user base, or market penetration
         - Use the latest available data from 2024
         - Include proper units in labels (e.g., "$", "M users", "%")
         - Do not include hypothetical values for the project
         - Label format: "Metric - Company/Segment"
      
      Project Description: ${projectDescription}
      
      Note: Focus on providing accurate, real-world data from reliable sources. Do not include speculative values for the project itself.
    `;

    // Generate structured chart data
    const chartDataResult = await geminiClient.generateWithStructuredOutput(
      chartDataPrompt,
      chartDataSchema
    );

    // Extract the chart data from the response
    let chartData;
    try {
      // Get the raw text response
      const responseText = chartDataResult.response.text();

      // Try to extract JSON from the response
      // First, look for JSON within code blocks if present
      let jsonText = responseText;

      // Remove any markdown code block indicators if present
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*$/g, "");

      // Trim any whitespace
      jsonText = jsonText.trim();

      // Parse the JSON
      chartData = JSON.parse(jsonText);
      console.log("Generated chart data:", chartData);
    } catch (error) {
      console.error("Error parsing chart data:", error);
      // Provide fallback chart data if parsing fails
      chartData = {
        pieChart: [
          { name: "Your Product", value: 35 },
          { name: "Competitor A", value: 25 },
          { name: "Competitor B", value: 20 },
          { name: "Others", value: 20 },
        ],
        areaChart: [
          { name: "2020", value: 100 },
          { name: "2021", value: 120 },
          { name: "2022", value: 150 },
          { name: "2023", value: 200 },
          { name: "2024", value: 250 },
        ],
        barChart: [
          { name: "Feature Richness", value: 8, secondaryValue: 6 },
          { name: "User Experience", value: 9, secondaryValue: 7 },
          { name: "Performance", value: 7, secondaryValue: 8 },
        ],
      };
    }

    // Process the content to create both markdown and HTML versions
    let htmlContent = content;

    // If we have grounding supports, we can add source references
    if (
      groundingMetadata &&
      firstCandidate.groundingMetadata?.groundingSupports &&
      groundingChunks
    ) {
      // Add a sources section at the end if not already present
      if (!htmlContent.includes("<h2") && groundingChunks.length > 0) {
        htmlContent += `
          <h2 class="text-xl font-semibold mt-8 mb-4 text-primary">Sources</h2>
          <ol class="list-decimal pl-5 space-y-2">
            ${groundingChunks
              .map((chunk) => {
                if (chunk.web) {
                  return `<li class="text-sm text-gray-700 dark:text-gray-300">
                <a href="${chunk.web.uri}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                  ${chunk.web.title}
                </a>
              </li>`;
                }
                return "";
              })
              .join("")}
          </ol>
        `;
      }
    }

    // Create a markdown version for backward compatibility
    let markdownContent = content;

    // If the response is HTML, convert it to markdown for backward compatibility
    if (
      content.includes("<h1") ||
      content.includes("<h2") ||
      content.includes("<p")
    ) {
      // This is a very basic HTML to markdown conversion for backward compatibility
      markdownContent = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<ul[^>]*>(.*?)<\/ul>/gi, "$1\n")
        .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
        .replace(/<sup>(.*?)<\/sup>/gi, "^$1")
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
        .replace(/<[^>]*>/g, ""); // Remove any remaining HTML tags

      // Add sources section in markdown format if needed
      if (groundingMetadata && groundingChunks && groundingChunks.length > 0) {
        markdownContent += "\n\n## Sources\n";
        groundingChunks.forEach((chunk, index) => {
          if (chunk.web) {
            markdownContent += `${index + 1}. ${chunk.web.title}\n`;
          }
        });
      }
    }

    return {
      content: markdownContent,
      htmlContent: htmlContent,
      isGrounded: !!groundingMetadata,
      searchSuggestions,
      renderedContent: renderedContent || null,
      groundingChunks,
      chartData,
    };
  } catch (error) {
    console.error(
      "Error generating market analysis with dynamic retrieval:",
      error
    );
    throw error;
  }
}
