import { openai } from "../config/openAiConfig";
import { AutomaticSkills } from "../types/JobTypes";
import { getPromptV4 } from "../utils/prompt";

/**
 * Extract keywords and skills from a resume text using ChatGPT.
 * @param {string} resumeText - The resume text.
 * @returns {Promise<string>} - A comma-separated list of keywords.
 */
export async function createCandidateProfileFromResume(
  skills: AutomaticSkills,
  resumeText: string
) {
  const skillAsString = JSON.stringify(skills);
  const prompt = getPromptV4(skillAsString, resumeText);
  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Replace with a valid model identifier if necessary
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.5,
    });
    // Extract and trim the keywords from the API response
    const candidateProfile = completion.choices[0];
    console.log(candidateProfile);

    try {
      const parsedCandidateProfile = JSON.parse(
        candidateProfile.message.content as string
      );
      return parsedCandidateProfile;
    } catch (err) {
      console.log("Error parsing response", candidateProfile, err);
      throw new Error("Error parsing response");
    }
  } catch (error) {
    console.error("Error extracting keywords:", error);
    throw error;
  }
}
