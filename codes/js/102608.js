import pdfParse from "pdf-parse/lib/pdf-parse.js";
import axios from "axios";
import { skillsList } from "./mock.js";
import ResumePool from "../models/ResumePool.js";
import { topCompanieslist, topInstituteslist } from "./mock.js";
import fs from "fs/promises";
import path from "path";
import xlsx from "xlsx";
import FormData from "form-data";
import { Readable } from "stream";
import { AzureOpenAI } from "openai";
import { uploadJsonAsCsvToS3 } from "../utils/UploadChecker.js";
import filterAndRankCandidates from "../utils/filterRank.js";
import { fileURLToPath } from "url";
import Users from "../models/userModel.js";

const GEMINI_API_KEY = "AIzaSyCXj7iUCYWDQXPW3i6ky4Y24beLiINeDBw";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractYear = (input) => {
  if (!input) return null;

  // If it's already a valid number (like 2023), return it directly
  if (typeof input === "number" && input > 1900 && input < 2100) {
    return input;
  }

  if (typeof input !== "string") return null;

  const match = input.match(/\d{2,4}/g); // Match any 2-4 digit numbers
  if (match) {
    const rawYear = match[match.length - 1]; // pick the last one (often most relevant)
    const year = rawYear.length === 2 ? "20" + rawYear : rawYear;
    return Number(year);
  }

  return null;
};

export const parseResume = async (req, res) => {
  try {
    console.log("Received request to parse resume.");

    if (!req.file) {
      console.log("No file uploaded.");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    console.log("File uploaded successfully, starting PDF parsing...");

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    console.log("PDF parsed successfully.");

    const resumeText = pdfData.text.trim();
    console.log("Extracted text length:", resumeText.length);

    if (!resumeText) {
      console.log("Extracted text is empty.");
      return res
        .status(400)
        .json({ success: false, message: "Empty resume text" });
    }

    console.log("Sending text to Gemini API...");

    // Send text to Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract structured information from the following resume and return a **properly formatted JSON object** with the following fields:

- **PersonalInformation:**
  - name (Full name of the candidate)
  - email (Email address)
  - contactNumber (Phone number)
  - linkedinLink (URL to the candidate's LinkedIn profile)
  - dateOfBirth (Candidate's date of birth)
  - location (Current city/location)

- **ProfessionalDetails:**
  - noOfYearsExperience (Total years of work experience)
  - currentCompany (Company where the candidate is currently employed)
  - currentDesignation (Current job title/designation)
  - salary (Current or expected salary, if mentioned)
  - about (A brief professional summary of the candidate)
  - hasConsultingBackground (Boolean - true if the candidate has consulting experience, otherwise false)

- **EducationDetails** (An array of objects, each containing):
  - instituteName (Name of the university or college)
  - yearOfPassout (Year of graduation or completion)

- **WorkExperience** (An array of objects, each containing):
  - companyName (Name of the company)
  - jobTitle (Job designation/role at the company)
  - duration (Employment period, e.g., "Jan 2020 - Dec 2023")
  - responsibilities (An array of key responsibilities and contributions in this role)

- CultureFit: {
    strength: "One specific verifiable strength (e.g., '5 years at McKinsey')",
    concern: "One specific verifiable concern (e.g., '3 job changes in 4 years')"
  }
}

2. Culture Fit Assessment Rules:
- STRENGTHS: Look for:
  • Big4/MBB/Accenture experience
  • Long tenure (>3 years) at reputable firms
  • Progressive promotions
  • Client-facing keywords ("client", "stakeholder")
  • International experience
  • Leadership titles (VP, Director, Partner)

- CONCERNS: Look for:
  • Frequent job changes (<2 years/role)
  • No consulting experience
  • Only internal project roles
  • No leadership experience
  • Only domestic experience

3. Examples:
Good Strength: "Proven consulting culture fit with 6 years at Deloitte"
Good Concern: "May need consulting onboarding (no Big4 experience)"

- **OtherDetails:**
  - companiesWorkedAt (An array of company names where the candidate has worked)
  - jobRoles (An array of job titles the candidate has held)

**AdditionalInstructions:**
- If any field is missing, return an empty string ("") or an empty array ([]) as applicable.
- The JSON response **must** follow this structure without additional formatting or explanations.
- Ensure proper parsing for employment **duration and responsibilities**.

**Resume Content:**  
${resumeText}`,
              },
            ],
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Received response from Gemini API.");

    // Extract response text
    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Raw extracted text:", rawText);

    // Improved JSON extraction with fallback
    let parsedData = {};
    
    // First try to extract JSON from markdown code blocks
    const jsonMatches = rawText.match(/```json\n([\s\S]*?)\n```/g);
    
    if (jsonMatches) {
      // Parse and merge JSON objects from code blocks
      jsonMatches.forEach((jsonBlock) => {
        try {
          const jsonString = jsonBlock.replace(/```json\n|\n```/g, "").trim();
          const parsedObject = JSON.parse(jsonString);
          parsedData = { ...parsedData, ...parsedObject };
        } catch (error) {
          console.error("Error parsing JSON from code block:", error);
        }
      });
    } else {
      // Fallback: try to parse the entire response as JSON
      try {
        parsedData = JSON.parse(rawText.trim());
      } catch (error) {
        console.error("Error parsing entire response as JSON:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Invalid API response format - unable to extract JSON" 
        });
      }
    }

    console.log("Parsed JSON data successfully:", parsedData);

    const isTopCompany = topCompanieslist.some((company) =>
      new RegExp(`\\b${company}\\b`, "i").test(resumeText)
    );

    const isTopInstitute = topInstituteslist.some((institute) =>
      new RegExp(`\\b${institute}\\b`, "i").test(resumeText)
    );

    const detectedSkills = skillsList.filter((skill) =>
      new RegExp(`\\b${skill}\\b`, "i").test(resumeText)
    );

    if (!parsedData.CultureFit) {
      parsedData.CultureFit = {
        strength: parsedData.ProfessionalDetails?.hasConsultingBackground 
          ? "Relevant consulting experience" 
          : "Strong technical background",
        concern: parsedData.ProfessionalDetails?.hasConsultingBackground
          ? "No visible Big4/MBB experience"
          : "No consulting experience"
      };
    }

    // Ensure all required fields exist, with defaults
    const defaultFields = {
      skills: detectedSkills.length > 0 ? detectedSkills : ["Not Mentioned"],
      topCompanies: isTopCompany,
      topInstitutes: isTopInstitute,
      PersonalInformation: {
        name: parsedData.PersonalInformation?.name || "",
        email: parsedData.PersonalInformation?.email || "",
        contactNumber: parsedData.PersonalInformation?.contactNumber || "",
        linkedinLink: parsedData.PersonalInformation?.linkedinLink || "",
        dateOfBirth: parsedData.PersonalInformation?.dateOfBirth || "",
        location: parsedData.PersonalInformation?.location || "",
      },
      ProfessionalDetails: {
        noOfYearsExperience:
          parsedData.ProfessionalDetails?.noOfYearsExperience || "",
        currentCompany: parsedData.ProfessionalDetails?.currentCompany || "",
        currentDesignation:
          parsedData.ProfessionalDetails?.currentDesignation || "",
        salary: parsedData.ProfessionalDetails?.salary || "",
        about: parsedData.ProfessionalDetails?.about || "",
        hasConsultingBackground:
          parsedData.ProfessionalDetails?.hasConsultingBackground || false,
      },
      EducationDetails: parsedData.EducationDetails || [],
      WorkExperience: parsedData.WorkExperience || [],
      CultureFit: parsedData.CultureFit,
      OtherDetails: {
        companiesWorkedAt: parsedData.OtherDetails?.companiesWorkedAt || [],
        jobRoles: parsedData.OtherDetails?.jobRoles || [],
      },
    };

    parsedData = { ...defaultFields, ...parsedData };

    // Extract email for database operations
    const email = parsedData.PersonalInformation?.email;
    if (!email) {
      console.log("No email found in parsed data");
      return res.status(400).json({ 
        success: false, 
        message: "Email not found in resume" 
      });
    }

    console.log("Looking for existing user with email:", email);

    // Check if user exists - Users model has flat email structure
    const existingUser = await Users.findOne({ email: email });

    console.log("Existing user found:", existingUser);

    if (existingUser) {
      // Update user's culture fit data
      await Users.updateOne(
        { email: email },
        {
          $set: {
            cultureFit: {
              strength: parsedData.CultureFit?.strength || "",
              concern: parsedData.CultureFit?.concern || ""
            }
          }
        }
      );
      console.log("Updated user culture fit data");
    }

    // Check if resume exists in ResumePool
    const existingResume = await ResumePool.findOne({
      "personalInformation.email": email
    });

    console.log("Existing resume found:", existingResume);

    if (existingResume) {
      // Update existing record
      const updateResult = await ResumePool.updateOne(
        { _id: existingResume._id },
        {
          $set: {
            personalInformation: {
              name: parsedData.PersonalInformation?.name || "",
              email: parsedData.PersonalInformation?.email || "",
              contactNumber: parsedData.PersonalInformation?.contactNumber || "",
              linkedinLink: parsedData.PersonalInformation?.linkedinLink || "",
              dateOfBirth: parsedData.PersonalInformation?.dateOfBirth || "",
              location: parsedData.PersonalInformation?.location || "India",
            },
            professionalDetails: {
              noOfYearsExperience: Number(parsedData.ProfessionalDetails?.noOfYearsExperience) || 1,
              currentCompany: parsedData.ProfessionalDetails?.currentCompany || "",
              currentDesignation: parsedData.ProfessionalDetails?.currentDesignation || "",
              salary: parsedData.ProfessionalDetails?.salary || "",
              about: parsedData.ProfessionalDetails?.about || "",
              hasConsultingBackground: parsedData.ProfessionalDetails?.hasConsultingBackground || false,
            },
            educationDetails: (parsedData.EducationDetails || []).map((edu) => ({
              ...edu,
              yearOfPassout: extractYear(edu.yearOfPassout),
            })),
            workExperience: parsedData.WorkExperience || [],
            skills: detectedSkills.length > 0 ? detectedSkills : ["Not Mentioned"],
            cultureFit: {
              strength: parsedData.CultureFit?.strength || "",
              concern: parsedData.CultureFit?.concern || ""
            },
            topCompanies: isTopCompany,
            topInstitutes: isTopInstitute,
            companiesWorkedAt: parsedData.OtherDetails?.companiesWorkedAt || [],
            jobRoles: parsedData.OtherDetails?.jobRoles || [],
            cvUrl: req.body.cvurl || "",
          }
        }
      );
      console.log(`Updated existing resume for email: ${email}`, updateResult);
    } else {
      // Create new record
      const newResume = await ResumePool.create({
        personalInformation: {
          name: parsedData.PersonalInformation?.name || "",
          email: parsedData.PersonalInformation?.email || "",
          contactNumber: parsedData.PersonalInformation?.contactNumber || "",
          linkedinLink: parsedData.PersonalInformation?.linkedinLink || "",
          dateOfBirth: parsedData.PersonalInformation?.dateOfBirth || "",
          location: parsedData.PersonalInformation?.location || "India",
        },
        professionalDetails: {
          noOfYearsExperience: Number(parsedData.ProfessionalDetails?.noOfYearsExperience) || 1,
          currentCompany: parsedData.ProfessionalDetails?.currentCompany || "",
          currentDesignation: parsedData.ProfessionalDetails?.currentDesignation || "",
          salary: parsedData.ProfessionalDetails?.salary || "",
          about: parsedData.ProfessionalDetails?.about || "",
          hasConsultingBackground: parsedData.ProfessionalDetails?.hasConsultingBackground || false,
        },
        educationDetails: (parsedData.EducationDetails || []).map((edu) => ({
          ...edu,
          yearOfPassout: extractYear(edu.yearOfPassout),
        })),
        workExperience: parsedData.WorkExperience || [],
        skills: detectedSkills.length > 0 ? detectedSkills : ["Not Mentioned"],
        cultureFit: {
          strength: parsedData.CultureFit?.strength || "",
          concern: parsedData.CultureFit?.concern || ""
        },
        topCompanies: isTopCompany,
        topInstitutes: isTopInstitute,
        companiesWorkedAt: parsedData.OtherDetails?.companiesWorkedAt || [],
        jobRoles: parsedData.OtherDetails?.jobRoles || [],
        cvUrl: req.body.cvurl || "",
      });
      console.log(`Created new resume for email: ${email}`, newResume._id);
    }

    res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error("Error processing resume:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data || "Failed to parse resume",
    });
  }
};


// Define the list of relevant skills

export const resumepool = async (req, res) => {
  try {
    console.log("Received request to parse resume.");

    if (!req.file) {
      console.log("No file uploaded.");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    console.log("File uploaded successfully, starting PDF parsing...");
    const pdfData = await pdfParse(req.file.buffer);
    console.log("PDF parsed successfully.");

    const resumeText = pdfData.text.trim();
    console.log("Extracted text length:", resumeText.length);

    if (!resumeText) {
      console.log("Extracted text is empty.");
      return res
        .status(400)
        .json({ success: false, message: "Empty resume text" });
    }

    console.log("Sending text to Gemini API...");

    // Send text to Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract structured information from this resume and return JSON with fields: 
                  name, email, noOfYearsExperience, location, companies worked at, and job roles. 
                  Additionally, provide a "rating" (out of 5) based on resume quality, skills, and experience.
                  
                  Criteria for rating:
                  - 5.0: Highly experienced (10+ years), strong skillset, worked at top companies.
                  - 4.0-4.9: Mid-senior level (5-9 years), good skillset, well-written resume.
                  - 3.0-3.9: Moderate experience (3-5 years), lacks strong companies or formatting.
                  - 2.0-2.9: Entry-level (1-2 years), missing important details.
                  - 1.0-1.9: Very basic or poorly formatted resume.

                  Resume Content:
                  ${resumeText}`,
              },
            ],
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Received response from Gemini API.");

    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Raw extracted text:", rawText);

    // Remove Markdown (```json ... ```) and extract pure JSON
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    const cleanJsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

    try {
      let parsedData = JSON.parse(cleanJsonText);
      console.log("Parsed JSON data successfully.");

      // Extract skills that match the predefined list
      const detectedSkills = skillsList.filter((skill) =>
        new RegExp(`\\b${skill}\\b`, "i").test(resumeText)
      );

      // Ensure all required fields exist in the response
      const defaultFields = {
        name: "",
        email: "",
        noOfYearsExperience: "",
        location: "",
        companiesWorkedAt: [], // List of past companies
        skills: detectedSkills.length > 0 ? detectedSkills : ["Not Mentioned"], // Extracted skills
        jobRoles: [],
        rating: 3,
      };

      parsedData = { ...defaultFields, ...parsedData };

      const resume = await ResumePool.create({
        name: parsedData.name,
        email: parsedData.email,
        cvUrl: req.body.cvurl || "",
        location: parsedData.location,
        experience: parsedData.noOfYearsExperience,
        skills: parsedData.skills,
        companies: parsedData.companiesWorkedAt,
        rating: parsedData.rating,
        jobRoles: parsedData.jobRoles,
      });

      res.status(200).json({ success: true, data: parsedData });
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      res.status(500).json({
        success: false,
        message: "Failed to parse response from Gemini API.",
        rawText,
      });
    }
  } catch (error) {
    console.error(
      "Error processing resume:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: error.response?.data || "Failed to parse resume",
    });
  }
};

const convertToBoolean = (value) => value === "true" || value === true;
const calculateExperience = (dateRange) => {
  if (!dateRange || !dateRange.includes(" - ")) return 0;
  const [start, end] = dateRange.split(" - ").map((d) => d.trim());
  const startDate = new Date(`1 ${start}`);
  const endDate = end.toLowerCase().includes("present")
    ? new Date()
    : new Date(`1 ${end}`);
  if (isNaN(startDate) || isNaN(endDate)) return 0;
  return Math.max(
    0,
    ((endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
  );
};

export const AIana = async (req, res, next) => {
  try {
    const { recruiterQuery } = req.body;

    // Define available filters
    const filterSchema = {
      location: "string",
      exp: "number",
      currentCompany: "string",
      isConsultant: "boolean",
      instituteName: "string",
      yearOfPassout: "number",
      workExpCompany: "string",
      minWorkExp: "number",
      skills: "array",
      topCompany: "boolean",
      topInstitutes: "boolean",
      companiesWorkedAt: "array",
      jobRoles: "array",
    };

    // Send text to Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analyze the following recruiter query and extract filter values based on this schema: ${JSON.stringify(
                  filterSchema
                )}. 
      Query: "${recruiterQuery}"
      ### Important Conditions:
1. If the recruiter explicitly mentions a candidate must have worked at a **specific company for a certain number of years**, store the company name in "workExpCompany" and the duration in "minWorkExp".
2. If the recruiter **only mentions companies without specifying experience duration**, store them in "companiesWorkedAt" and use "exp" as the general experience requirement.
3. Ensure that:
   - Experience ("exp") is a number representing years of experience.
   - Skills should be an array of relevant technologies.
   - Location should match one of the existing database locations.
   - Job roles should match predefined categories.
   - If the recruiter is looking for top companies or institutes, set the respective boolean flags.

Return the response **strictly as JSON** without any additional text`,
              },
            ],
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    // Extract response text
    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse response
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    const cleanJsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    const filters = JSON.parse(cleanJsonText);
    console.log("Parsed JSON data successfully.", filters);

    res.status(200).json({
      success: true,
      filters: filters,
    });
  } catch (error) {
    next(error);
  }
};

export const filterResumesByPrompt = async (req, res) => {
  try {
    const { recruiterPrompt, cdnUrls } = req.body;

    if (
      !recruiterPrompt ||
      !Array.isArray(cdnUrls) ||
      cdnUrls.length === 0 ||
      !cdnUrls[0].cdnUrl ||
      !cdnUrls[0].userId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid input format: recruiterPrompt and cdnUrls (with userId & cdnUrl) are required.",
      });
    }

    console.log(`Received ${cdnUrls.length} resumes for filtering...`);

    // Step 1: Download and parse all resumes
    const parsedResumes = await Promise.all(
      cdnUrls.map(async ({ userId, cdnUrl }) => {
        try {
          const fileResponse = await axios.get(cdnUrl, {
            responseType: "arraybuffer",
          });
          const pdfData = await pdfParse(fileResponse.data);
          return {
            userId,
            cdnUrl,
            text: pdfData.text.trim().slice(0, 20000),
          };
        } catch (err) {
          console.error(`Failed to process resume: ${cdnUrl}`, err.message);
          return null;
        }
      })
    );

    const validResumes = parsedResumes.filter(Boolean);
    console.log(`Parsed ${validResumes.length} valid resumes.`);

    // Step 2: Ask Gemini to evaluate all resumes
    const promptText = `
You are an expert recruiter assistant. Based on the following recruiter prompt:

"${recruiterPrompt}"

Select the best matching resumes from the list below. Return a JSON array of the **userId and cdnUrl** of the best matching resumes, in this format:

[
  { "userId": "user123", "cdnUrl": "https://cdn.com/resume1.pdf" },
  ...
]

Resumes:
[
${validResumes
  .map(
    (resume) => `{
  "userId": "${resume.userId}",
  "cdnUrl": "${resume.cdnUrl}",
  "text": "${resume.text.replace(/\n/g, " ").slice(0, 5000)}"
}`
  )
  .join(",\n")}
]

Respond with only the JSON array, no extra commentary.
`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    const cleanJsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
    const matchedCandidates = JSON.parse(cleanJsonText);

    return res.status(200).json({
      success: true,
      matchedCandidates, // includes both userId and cdnUrl
    });
  } catch (err) {
    console.error("Error filtering resumes:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to filter resumes based on recruiter prompt.",
    });
  }
};

export const uploadAndShortlist = async (req, res, next) => {
  try {
    const { recruiterQuery } = req.body;

    if (!recruiterQuery) {
      return res.status(400).json({ error: "Recruiter query missing" });
    }

    // 1. Fetch all user data
    const users = await ResumePool.find().lean();
    console.log("Fetched", users.length, "users");

    const csvUrl = await uploadJsonAsCsvToS3(users, "resumes/csv");
    console.log("CSV uploaded to S3 at", csvUrl);

    // 2. Build a prompt that asks for cvUrl values
    const prompt = `
    You are an intelligent assistant helping a recruiter identify the most relevant candidates from a CSV file.
    
    The CSV contains a list of user profiles. Each profile includes a field called "cvUrl" which is a downloadable link to the candidate's resume. Other fields include name, experience, education, skills, companies, and roles. You will be provided a public URL to this CSV file.
    
    Recruiter's Query:
    ${recruiterQuery}
    
    CSV File URL:
    ${csvUrl}
    
    Instructions:
    1. Download and parse the CSV file.
    2. Analyze the profiles based on the recruiter's query.
    3. Select only the most relevant candidates that match the query criteria.
    4. Return ONLY a JSON array containing the "cvUrl" values of the shortlisted candidates.
    5. Do NOT include any explanation, text, or metadata.
    
    Expected Response Format:
    \`\`\`json
    ["https://s3.amazonaws.com/path-to-resume1.pdf", "https://s3.amazonaws.com/path-to-resume2.pdf"]
    \`\`\`
    
    Only return the JSON array as shown above.
    `;

    // 4. Call Gemini
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 5. Extract the JSON array from the fenced code block
    const match = rawText.match(/```json\n([\s\S]*?)\n```/);
    const cvUrls = match ? JSON.parse(match[1]) : [];

    // 6. Return the result
    return res.status(200).json({
      success: true,
      rawText: rawText,
      shortlistedCvUrls: cvUrls,
      totalShortlisted: cvUrls.length,
    });
  } catch (err) {
    console.error("Error in uploadAndShortlist:", err.response?.data || err);
    return res.status(500).json({
      success: "failed",
      message: err.message || err.toString(),
    });
  }
};

//JD to requirement and qualification
export const analyseJobDescription = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid input: jobDescription (string) is required.",
      });
    }

    // Allowed degrees for qualifications
    const allowedDegrees = [
      "Bachelors (any)",
      "Bachelors engineering",
      "PG any",
      "PG engineering",
      "MBA",
      "CA",
      "MBBS",
      "CFA",
      "PhD",
    ];

    // Build the HR-style prompt with degree filter
    const prompt = `
    You are a highly experienced HR specialist. Given this job description:
    
    """${jobDescription.trim()}"""
    
    And the pool of allowed educational credentials:
    ${allowedDegrees.map((d) => `- ${d}`).join("\n")}
    
    **Qualifications Extraction Rules**  
    1. From that allowed list, select only the credentials that logically fit the role described above.  
    2. If “MBA” is chosen, still mention a Bachelor’s (“Candidate should have completed a Bachelor’s degree in a relevant field”), but do not list “Bachelors (any)” separately.  
    3. Only include “Bachelors engineering” or “PG engineering” if the JD explicitly requires an engineering or technical background.  
    4. Do **not** include “PhD,” “MBBS,” “CA,” or “CFA” unless the JD clearly demands research/medical/finance specialization.  
    5. Rewrite each selected credential as a full, professional sentence (e.g. “Candidate should hold an MBA to support strategic leadership.”).
    
    **Requirements Extraction Rules**  
    Extract each core skill, experience, or attribute from the JD and rewrite it as a professional sentence (e.g. “Candidate must have 5+ years of experience in…”).

    **Screening Questions Rules**  
    Based on the JD, craft **3–5** short, clear screening questions that you would ask a candidate to quickly gauge fit. Each question should be tailored to the key skills or experiences (e.g. “Can you describe a time you led a strategic initiative under ambiguity?”).

    
    **Output Format**  
    Respond with **only** this JSON structure:
    
    {
      "qualifications": [
        /* array of full-sentence qualifications, using only allowed credentials */
      ],
      "requirements": [
        /* array of full-sentence requirements */
      ],
      "screeningQuestions": [
       /* array of 3–5 screening questions as strings */
      ]
    }
    
    —no extra commentary, no bullet lists outside the JSON, just the JSON object.  
    `;

    // Call Gemini
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json" } }
    );

    const raw =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonText = raw
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(jsonText);

    return res.status(200).json({
      success: true,
      qualifications: parsed.qualifications,
      requirements: parsed.requirements,
      screeningQuestions: parsed.screeningQuestions,
    });
  } catch (err) {
    console.error("Error in analyseJobDescription:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to analyse job description.",
    });
  }
};

let skillEmbeddingsData = null; // Cache for loaded embeddings

const loadSkillEmbeddings = async () => {
  if (skillEmbeddingsData) {
    return skillEmbeddingsData; // Return cached data if already loaded
  }
  // Using __dirname is safer than relative paths like './'
  // Ensure the path correctly points to where you saved skill_embeddings.json
  // Example: If AiController.js is in server/controllers, this assumes
  // skill_embeddings.json is also directly in server/controllers.
  const embeddingsFilePath = path.join(
    __dirname,
    "skill_embeddings_gemini.json"
  );
  // OR if it's in the server root: const embeddingsFilePath = path.join(__dirname, '../../skill_embeddings.json');

  try {
    console.log(`Loading skill embeddings from ${embeddingsFilePath}...`);
    // CORRECTED: Pass 'utf8' as the second argument
    const data = await fs.readFile(embeddingsFilePath, { encoding: "utf8" });
    skillEmbeddingsData = JSON.parse(data);
    console.log(`Loaded ${skillEmbeddingsData.length} skill embeddings.`);
    return skillEmbeddingsData;
  } catch (error) {
    console.error(
      `Error loading skill embeddings file ${embeddingsFilePath}:`,
      error
    );
    // Log more specific error if possible, e.g., file not found
    if (error.code === "ENOENT") {
      console.error(`File not found: ${embeddingsFilePath}`);
    }
    skillEmbeddingsData = []; // Set to empty array on error to prevent repeated attempts
    return []; // Return empty array on error
  }
};
// --- End Skill Embedding Loading ---

// --- Helper function for Cosine Similarity ---
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0; // Avoid division by zero
  }

  return dotProduct / (normA * normB);
}
// --- End Cosine Similarity Helper ---

// AI Based resume filtering - Now includes Skill Matching
export const analyseIdealCandidate = async (req, res) => {
  try {
    const { jobDescription, skills: bodySkills = [] } = req.body;

    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid input: 'jobDescription' (string) is required in the request body.",
      });
    }

    // validate that bodySkills is an array of strings
    if (
      !Array.isArray(bodySkills) ||
      !bodySkills.every((s) => typeof s === "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: 'skills' must be an array of strings.",
      });
    }

    // --- STEP 1: Get Structured Filters using Gemini ---

    // Define the structure of the data we want to extract
    const outputStructureDescription = {
      minimumYearsExperience:
        "number | null (minimum years of professional experience required. If a range is given, use the lower bound. Use null if no specific minimum number is mentioned.)",
      isTopCompaniesRequired:
        "boolean (true if the JD explicitly requires or strongly prefers candidates from 'top-tier', 'tier-1', 'leading', 'renowned', or generally recognized 'top' companies/organizations, OR requires experience specifically gained at such top-tier *types* of organizations like 'Tier-1 consulting firm'. False otherwise.)",
      isTopInstitutesRequired:
        "boolean (true if the JD explicitly requires or strongly prefers candidates from 'top-tier', 'tier-1', 'leading', 'renowned', or generally recognized 'top' academic institutions. False otherwise.)",
      requiresConsultingBackground:
        "boolean (true if the JD explicitly requires or strongly prefers candidates with a background in consulting, management consulting, strategy consulting, etc. False otherwise.)",
      requiredLocation:
        "string | null (The primary required location for the role (e.g., 'New York, NY', 'Remote', 'India', 'USA'). Use null if the location is not specified or is highly flexible/global.)",
      requiredCompanies:
        "string[] (An array of specific company names explicitly required or strongly preferred by the JD as work experience. Empty array if none are explicitly listed as requirements.)",
      requiredInstitutes:
        "string[] (An array of specific academic institution names explicitly required or strongly preferred by the JD as education. Empty array if none are explicitly listed as requirements.)",
    };

    const filterPrompt = `
    You are an expert recruitment AI focused on extracting specific, structured candidate filtering criteria from job descriptions. Your task is to analyze the job description and identify boolean or numerical filtering values, as well as lists of required names, that correspond to common fields in a candidate database.

    Analyze the following job description:

    """${jobDescription.trim()}"""

    Based on this job description, extract the criteria required for initial candidate screening. Ensure the output strictly adheres to the JSON structure described below.

    **Output Keys and Value Types:**
    ${Object.entries(outputStructureDescription)
      .map(([key, desc]) => `- "${key}": ${desc}`)
      .join("\n")}

    **Extraction Rules:**
    1.  **minimumYearsExperience**: Identify the minimum number of years of *professional* work experience required. If a range is specified (e.g., "6-8 years"), use the lower number (e.g., 6). If the JD mentions experience without a specific minimum number (e.g., "relevant experience", "experience is a plus") or doesn't mention experience minimums at all, set this value to \`null\`.
    2.  **isTopCompaniesRequired**: Set to \`true\` only if the JD uses terms like "top-tier", "Tier-1", "leading", "renowned", "top", or similar phrasing indicating a requirement for candidates coming from highly regarded *companies* or *organizations*. This is also \`true\` if the JD requires experience specifically gained at a top-tier *type* of organization (e.g., "experience at a Tier-1 investment bank", "Tier-1 consulting background"). Otherwise, set to \`false\`.
    3.  **isTopInstitutesRequired**: Set to \`true\` only if the JD explicitly states a preference for or requirement of candidates who attended "top-tier", "Tier-1", "leading", "renowned", "top", or similar phrasing indicating a requirement for high-status academic institutions (universities, colleges, business schools). Otherwise, set to \`false\`.
    4.  **requiresConsultingBackground**: Set to \`true\` only if the JD explicitly mentions that a background in management consulting, strategy consulting, or similar consulting roles is required or strongly preferred. Otherwise, set to \`false\`.
    5.  **requiredLocation**: Extract the primary geographical location mentioned for the role (e.g., city, state, country, "Remote", "Hybrid"). If no specific location is stated, or if the role is explicitly location-flexible or global without a primary hub, set this value to \`null\`.
    6.  **requiredCompanies**: Extract and list as strings in an array any *specific* company names that the JD explicitly states candidates *must* have experience from or are *strongly preferred* to have experience from. Look for phrasing like "experience at X or Y", "must have worked at Z". If no specific companies are explicitly named as requirements, return an empty array \`[]\`.
    7.  **requiredInstitutes**: Extract and list as strings in an array any *specific* academic institution names that the JD explicitly states candidates *must* have degrees from or are *strongly preferred* to have degrees from. Look for phrasing like "degree from X or Y", "MBA from Z". If no specific institutes are explicitly named as requirements, return an empty array \`[]\`.
    8.  **Distinction Clarification**: The 'isTopCompaniesRequired' and 'isTopInstitutesRequired' booleans are about the general prestige tier, while 'requiredCompanies' and 'requiredInstitutes' are *only* about specific names listed. Prioritize extracting specific names into the arrays if they are present. A JD might require both (e.g., "MBA from a top-tier school like Harvard or Stanford"). In this case, isTopInstitutesRequired should be true, and requiredInstitutes should be \`["Harvard", "Stanford"]\`. If it just says "MBA from a top-tier school" without naming them, isTopInstitutesRequire should be true, and requiredInstitutes should be \`[]\`.
    9.  **Do NOT** extract a list of general skills (like "communication", "leadership") or specific job titles beyond identifying the overall role type if relevant to other filters.
    10. **Output STRICTLY and ONLY** the JSON object. No additional text, comments, or markdown formatting outside the JSON object.

    **Output Format:**
    {
      "minimumYearsExperience": null | number,
      "isTopCompaniesRequired": boolean,
      "isTopInstitutesRequired": boolean,
      "requiresConsultingBackground": boolean,
      "requiredLocation": null | string,
      "requiredCompanies": string[],
      "requiredInstitutes": string[]
    }
    `;

    let parsedFilters = null;
    try {
      const geminiFilterResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ role: "user", parts: [{ text: filterPrompt }] }] },
        { headers: { "Content-Type": "application/json" } }
      );

      const rawFilterText =
        geminiFilterResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "";
      const jsonFilterText = rawFilterText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

      // Basic validation and parsing for filters
      parsedFilters = JSON.parse(jsonFilterText);
      const expectedKeys = [
        "minimumYearsExperience",
        "isTopCompaniesRequired",
        "isTopInstitutesRequired",
        "requiresConsultingBackground",
        "requiredLocation",
        "requiredCompanies",
        "requiredInstitutes",
      ];
      const hasAllExpectedKeys = expectedKeys.every(
        (key) => key in parsedFilters
      );

      if (
        parsedFilters === null ||
        typeof parsedFilters !== "object" ||
        !hasAllExpectedKeys
      ) {
        console.error(
          "Gemini returned non-matching JSON for filters:",
          jsonFilterText
        );
        // If parsing fails but doesn't throw, set filters to a default structure
        parsedFilters = {
          minimumYearsExperience: null,
          isTopCompaniesRequired: false,
          isTopInstitutesRequired: false,
          requiresConsultingBackground: false,
          requiredLocation: null,
          requiredCompanies: [], // Default empty array
          requiredInstitutes: [], // Default empty array
        };
      }
    } catch (filterErr) {
      console.error(
        "Error getting structured filters from Gemini:",
        filterErr.message
      );
      // If API call fails, return default filter values
      parsedFilters = {
        minimumYearsExperience: null,
        isTopCompaniesRequired: false,
        isTopInstitutesRequired: false,
        requiresConsultingBackground: false,
        requiredLocation: null,
      };
    }

    // --- STEP 2: Find Relevant Skills using Embeddings ---

    let relevantSkills = []; // Array to store the matching skills
    const SIMILARITY_THRESHOLD = 0.6; // You can adjust this threshold
    const TOP_N_SKILLS = 30; // Number of top skills to consider before thresholding

    try {
      const skillEmbeddings = await loadSkillEmbeddings();

      if (skillEmbeddings.length > 0) {
        // Generate embedding for the Job Description using Gemini's embedding model
        const embeddingModelName = "embedding-001"; // Or 'text-embedding-004'
        const jdEmbeddingResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModelName}:embedContent?key=${GEMINI_API_KEY}`,
          {
            model: embeddingModelName,
            content: { parts: [{ text: jobDescription.trim() }] },
          },
          { headers: { "Content-Type": "application/json" } }
        );

        const jdEmbedding = jdEmbeddingResponse.data?.embedding?.values;
        if (!jdEmbedding || jdEmbedding.length === 0) {
          console.error("Failed to generate embedding for job description.");
        } else {
          const skillScores = [];

          // Calculate similarity with each skill embedding
          for (const skillData of skillEmbeddings) {
            const skillEmbedding = skillData.embedding;
            if (
              skillEmbedding &&
              skillEmbedding.length === jdEmbedding.length
            ) {
              // Ensure dimensions match
              const score = cosineSimilarity(jdEmbedding, skillEmbedding);
              skillScores.push({ skill: skillData.skill, score: score });
            }
          }

          // Sort by score descending and filter by threshold
          relevantSkills = skillScores
            .sort((a, b) => b.score - a.score)
            .slice(0, TOP_N_SKILLS) // Optional: Take top N before applying threshold
            .filter((item) => item.score >= SIMILARITY_THRESHOLD)
            .map((item) => item.skill); // Extract just the skill name
        }
      } else {
        console.warn(
          "Skill embeddings not loaded or empty. Skipping skill matching."
        );
      }
    } catch (skillMatchingError) {
      console.error("Error during skill matching:", skillMatchingError.message);
      // Continue without relevantSkills if matching fails
    }

    // Remove duplicates by using a Set
    const combinedSkills = Array.from(
      new Set([
        ...relevantSkills,
        ...bodySkills.map((s) => s.trim()).filter((s) => s.length > 0),
      ])
    );

    // --- STEP 3: Filter and Rank Candidates using the Utility Function ---
    let recommendedCandidates = [];
    try {
      // Pass the obtained filters and relevantSkills to the utility function
      recommendedCandidates = await filterAndRankCandidates(
        parsedFilters,
        combinedSkills
      );
      console.log(
        `Successfully filtered and ranked ${recommendedCandidates.length} candidates.`
      );
    } catch (candidateFilteringError) {
      console.error(
        "Error during candidate filtering and ranking:",
        candidateFilteringError
      );
      // Return an empty array or an error response if filtering fails
      return res.status(500).json({
        success: false,
        message: "Failed to filter and rank candidates.",
        error: candidateFilteringError.message,
      });
    }

    // --- STEP 3: Combine and Return Results ---

    // --- STEP 4: Return the Filtered and Ranked Candidates ---
    return res.status(200).json({
      success: true,
      filters: parsedFilters, // Still return the extracted filters for context
      relevantSkills: relevantSkills, // Still return the matched skills for context
      recommendedCandidates: recommendedCandidates, // The final list of candidates
    });
  } catch (err) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in analyseIdealCandidate:", err.message);
    if (err.response) {
      console.error("API error response data:", err.response.data);
      console.error("API error response status:", err.response.status);
    } else if (err.request) {
      console.error("API request error:", err.request);
    } else {
      console.error("Other error details:", err);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to analyse job description.",
      error: err.message,
    });
  }
};

export const ask = async (req, res) => {
  try {
    const { prompt, nCount = 10 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Azure credentials
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_SEARCH_KEY;
    const searchIndex = process.env.AZURE_SEARCH_INDEX;

    const url = `${azureEndpoint}/openai/deployments/${deployment}/extensions/chat/completions?api-version=${apiVersion}`;

    const instructions = `
You are given a list of candidate documents. Based on the user prompt, extract and return only the top ${nCount} relevant candidates.

Return each in the following format:

1. **Full Name**
  - Email:
  - Contact:
  - Candidate ID:
  - CV URL (cvUrl):
  - Summary (2-3 lines based on experience relevant to the prompt):

Only show candidates that have a CV URL. Don't make up details. Format the response using bullet points.
`;

    const payload = {
      messages: [
        {
          role: "system",
          content: `You're Kaustabh, a hiring consultant helping companies identify top candidates based on job requirements. You analyze candidate documents retrieved via Azure Cognitive Search and return only the most relevant matches.`,
        },
        {
          role: "user",
          content: `${prompt}\n\n${instructions}`,
        },
      ],
      temperature: 0.7,
      top_p: 1,
      max_tokens: 4000, // safe and realistic for OpenAI model
      dataSources: [
        {
          type: "AzureCognitiveSearch",
          parameters: {
            endpoint: searchEndpoint,
            key: searchKey,
            indexName: searchIndex,
            topNDocuments: nCount, // ✅ force more documents
          },
        },
      ],
    };

    const headers = {
      "Content-Type": "application/json",
      "api-key": apiKey,
    };

    const response = await axios.post(url, payload, { headers });

    const messageContent = response.data.choices?.[0]?.message?.content || "No response";

    const result = {
      question: prompt,
      results: [
        {
          score: null,
          text: messageContent,
          source: "Azure OpenAI + Azure Cognitive Search",
        },
      ],
    };

    res.json(result);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.response?.data || error.message,
    });
  }
};


export const extractJobKeywords = async (job) => {
  try {
    const prompt = `
    You are an expert technical recruiter and AI-powered resume screener.

    Your task is to analyze the given structured job posting and extract the **most relevant and specific keywords** that can be used to evaluate incoming resumes.

    🎯 Extract:
    1. **Must-Have**: Skills or qualifications that are non-negotiable.
    2. **Nice-To-Have**: Preferred attributes, not mandatory.
    3. **Bonus**: Rare or exceptional qualities that would boost a resume's appeal.
    4. **Red Flags** (optional): Phrases that may indicate a weak or irrelevant profile (e.g., "freelancer", "intern", "1 month").

    🔐 IMPORTANT:
    - Focus only on the technical and experiential aspects (skills, tools, roles, seniority).
    - Avoid vague terms like “team player” or “motivated”.
    - Eliminate repetitions or generalities.
    - Use **precise, concrete, and role-specific keywords** — imagine what a recruiter would Ctrl+F for in a resume.

    🧾 Job Posting (JSON):
    \`\`\`json
    ${JSON.stringify(job, null, 2)}
    \`\`\`

    ✅ Output Format (Valid JSON only):
    \`\`\`json
    {
      "must_have": [],
      "nice_to_have": [],
      "bonus": [],
      "red_flags": []
    }
    \`\`\`
    `;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const rawText =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const match = rawText.match(/```json\s*([\s\S]*?)\s*```/);

    if (!match) {
      throw new Error("No valid JSON block found in Gemini response");
    }

    const keywords = JSON.parse(match[1]);

    return {
      success: true,
      keywords,
    };
  } catch (error) {
    console.error("Keyword extraction failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
