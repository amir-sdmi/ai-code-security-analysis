import { createClient } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

// Helper function to fetch file content
async function fetchFileContent(url, accessToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  if (!response.ok) return null;
  return await response.text();
}

// Helper function to recursively fetch repository contents
async function fetchRepoContents(contents, accessToken, owner, repo) {
  const fileContents = [];

  for (const item of contents) {
    if (item.type === "file") {
      // Skip binary files and large files
      if (item.size > 1000000) continue; // Skip files larger than 1MB

      const content = await fetchFileContent(item.download_url, accessToken);
      if (content) {
        fileContents.push({
          path: item.path,
          content: content,
        });
      }
    } else if (item.type === "dir") {
      const dirResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (dirResponse.ok) {
        const dirContents = await dirResponse.json();
        const nestedContents = await fetchRepoContents(
          dirContents,
          accessToken,
          owner,
          repo
        );
        fileContents.push(...nestedContents);
      }
    }
  }

  return fileContents;
}

export async function POST(request) {
  try {
    const { repoUrl, accessToken } = await request.json();

    // Extract owner and repo name from URL
    const [owner, repo] = repoUrl.split("/").slice(-2);

    // Fetch repository content
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repository contents");
    }

    const contents = await response.json();

    // Get repository details
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!repoResponse.ok) {
      throw new Error("Failed to fetch repository details");
    }

    const repoDetails = await repoResponse.json();

    // Fetch source code contents
    const sourceCodeContents = await fetchRepoContents(
      contents,
      accessToken,
      owner,
      repo
    );

    // Prepare content for analysis
    const contentToAnalyze = {
      name: repoDetails.name,
      description: repoDetails.description,
      language: repoDetails.language,
      topics: repoDetails.topics,
      stars: repoDetails.stargazers_count,
      forks: repoDetails.forks_count,
      files: contents.map((file) => ({
        name: file.name,
        type: file.type,
        path: file.path,
      })),
      sourceCode: sourceCodeContents.map((file) => ({
        path: file.path,
        content: file.content.substring(0, 1000), // Limit content length to avoid token limits
      })),
    };

    try {
      // Call Gemini API directly using the REST endpoint
      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this GitHub repository and provide a structured analysis focusing on technical skills and project details. Return ONLY a JSON object with the following structure, no markdown formatting or additional text:

{
  "skills": {
    "languages": ["list of programming languages used"],
    "frameworks": ["list of frameworks and libraries"],
    "databases": ["list of databases used"],
    "tools": ["list of development tools and platforms"],
    "other": ["list of other relevant technologies"]
  },
  "project": {
    "title": "project title",
    "summary": "2-3 sentence summary of the project",
    "keyFeatures": ["list of main features"],
    "technicalHighlights": ["list of notable technical achievements"]
  }
}

Repository details:
${JSON.stringify(contentToAnalyze, null, 2)}

Focus on identifying technologies from:
1. File extensions and imports in source code
2. Configuration files (package.json, requirements.txt, etc.)
3. Project structure and architecture
4. Dependencies and libraries used
5. Database and storage solutions
6. Development tools and platforms

Return ONLY the JSON object, no additional text or formatting.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        throw new Error("Failed to analyze repository with Gemini");
      }

      const geminiData = await geminiResponse.json();
      const analysisText =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error("No analysis received from Gemini");
      }

      // Clean the response text to ensure it's valid JSON
      const cleanJsonText = analysisText
        .replace(/```json\n?/g, "") // Remove ```json
        .replace(/```\n?/g, "") // Remove ```
        .trim(); // Remove extra whitespace

      // Parse the JSON response
      const analysis = JSON.parse(cleanJsonText);

      // Ensure all required fields exist
      const defaultAnalysis = {
        skills: {
          languages: [],
          frameworks: [],
          databases: [],
          tools: [],
          other: [],
        },
        project: {
          title: contentToAnalyze.name,
          summary: contentToAnalyze.description || "No description provided",
          keyFeatures: [],
          technicalHighlights: [],
        },
      };

      // Merge with defaults to ensure all fields exist
      const mergedAnalysis = {
        skills: {
          ...defaultAnalysis.skills,
          ...analysis.skills,
        },
        project: {
          ...defaultAnalysis.project,
          ...analysis.project,
        },
      };

      return NextResponse.json({ analysis: mergedAnalysis });
    } catch (geminiError) {
      console.error("Gemini API Error:", geminiError);
      // Fallback to a basic analysis if Gemini fails
      const basicAnalysis = {
        skills: {
          languages: [contentToAnalyze.language || "Not specified"],
          frameworks: [],
          databases: [],
          tools: [],
          other: contentToAnalyze.topics || [],
        },
        project: {
          title: contentToAnalyze.name,
          summary: contentToAnalyze.description || "No description provided",
          keyFeatures: [],
          technicalHighlights: [],
        },
      };

      return NextResponse.json({ analysis: basicAnalysis });
    }
  } catch (error) {
    console.error("Error analyzing repository:", error);
    return NextResponse.json(
      { error: "Failed to analyze repository" },
      { status: 500 }
    );
  }
}
