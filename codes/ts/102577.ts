import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { CV_TEMPLATE } from '../templates/cvTemplate';
import authService from './authService';

// Constants
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-preview-05-20';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Add these interfaces at the top of the file
interface ResumeData {
  professionalSummary?: {
    summaryPoints: string[];
  };
  skills?: {
    skillsList: string[];
  };
  experience?: {
    experiences: {
      title: string;
      company: string;
      location?: string;
      dateRange: string;
      achievements: string[];
    }[];
  };
  projects?: {
    projectsList: {
      name: string;
      technologies?: string;
      highlights: string[];
    }[];
  };
  education?: {
    university: string;
    major: string;
    graduationYear?: string;
    location?: string;
  };
  certifications?: {
    certificationsList: {
      name: string;
      issuer: string;
      dateReceived?: string;
    }[];
  };
  contactInfo?: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    address?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

/**
 * Converts JSON resume data to HTML format
 */
function generateHTMLFromJSON(jsonData: ResumeData | any): string {
  try {
    console.log('Generating HTML from JSON data:', jsonData);
    
    // Check if jsonData is actually in the expected format
    if (!jsonData || typeof jsonData !== 'object') {
      console.error('Invalid JSON data for HTML generation:', jsonData);
      throw new Error('Invalid data format');
    }
    
    // Handle if we were passed the full CV object instead of just the resume content
    if (jsonData.id && jsonData.active !== undefined && jsonData.parsedResume) {
      console.log('Received CV object instead of resume data, extracting parsedResume');
      // If parsedResume is a JSON string, parse it
      if (typeof jsonData.parsedResume === 'string') {
        try {
          // If it seems to be HTML, return it directly
          if (jsonData.parsedResume.includes('<!DOCTYPE html>') || 
              jsonData.parsedResume.includes('<html>')) {
            return jsonData.parsedResume;
          }
          // Otherwise try to parse it as JSON
          const parsedData = JSON.parse(jsonData.parsedResume);
          jsonData = parsedData;
        } catch (e) {
          console.error('Error parsing parsedResume as JSON:', e);
          // If it's a string but not parseable as JSON, assume it's raw HTML
          return jsonData.parsedResume;
        }
      }
    }
    
    // Extract data with null safety
    const contactInfo = jsonData.contactInfo || {
      name: '',
      email: '',
      phone: '',
      location: '',
      address: '',
      linkedin: '',
      github: '',
      portfolio: ''
    };
    
    // If contactInfo is provided, use it, otherwise try to build from top-level properties
    const name = contactInfo.name || `${jsonData.firstName || ''} ${jsonData.lastName || ''}`.trim() || 'Name Not Provided';
    const email = contactInfo.email || jsonData.email || '';
    const phone = contactInfo.phone || jsonData.phoneNumber || '';
    const location = contactInfo.location || jsonData.location || '';
    const linkedin = contactInfo.linkedin || jsonData.linkedinUrl || '';
    const github = contactInfo.github || jsonData.githubUrl || '';
    const portfolio = contactInfo.portfolio || jsonData.portfolioUrl || '';
    
    // Extract sections safely
    const professionalSummary = jsonData.professionalSummary?.summaryPoints || 
                              (jsonData.bio ? [jsonData.bio] : []);
    
    let skills = [];
    if (jsonData.skills?.skillsList && Array.isArray(jsonData.skills.skillsList)) {
      skills = jsonData.skills.skillsList;
    } else if (jsonData.skills && Array.isArray(jsonData.skills)) {
      skills = jsonData.skills;
    }
    
    let experiences = [];
    if (jsonData.experience?.experiences && Array.isArray(jsonData.experience.experiences)) {
      experiences = jsonData.experience.experiences;
    } else if (jsonData.experiences && Array.isArray(jsonData.experiences)) {
      experiences = jsonData.experiences.map((exp: any) => {
        // Convert raw experience format to template format
        const dateRange = exp.startDate ? 
          `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate || '')}` : '';
        
        return {
          title: exp.title || '',
          company: exp.company || '',
          location: exp.location || '',
          dateRange: dateRange,
          achievements: exp.description ? [exp.description] : []
        };
      });
    }
    
    let projects = [];
    if (jsonData.projects?.projectsList && Array.isArray(jsonData.projects.projectsList)) {
      projects = jsonData.projects.projectsList;
    } else if (jsonData.githubProjects && Array.isArray(jsonData.githubProjects)) {
      projects = jsonData.githubProjects.map((project: any) => {
        // Convert raw project format to template format
        return {
          name: project.name || '',
          technologies: project.technologies || '',
          highlights: project.description ? [project.description] : []
        };
      });
    }
    
    // Extract education safely
    const education = jsonData.education || {
      university: jsonData.university || '',
      major: jsonData.major || '',
      graduationYear: jsonData.graduationYear || '',
      location: ''
    };
    
    // Extract certifications safely
    let certifications = [];
    if (jsonData.certifications?.certificationsList && Array.isArray(jsonData.certifications.certificationsList)) {
      certifications = jsonData.certifications.certificationsList;
    } else if (jsonData.certifications && Array.isArray(jsonData.certifications)) {
      certifications = jsonData.certifications.map((cert: any) => {
        // Convert raw certification format to template format
        return {
          name: cert.name || '',
          issuer: cert.issuer || '',
          dateReceived: cert.dateReceived ? formatDate(cert.dateReceived) : ''
        };
      });
    }
    
    // Generate HTML using a clean, modern resume template
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${name} - Resume</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
          background: #fff;
          color: #333;
          line-height: 1.5;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
        }
        .resume-container {
          max-width: 100%;
        }
        .header {
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #eee;
          padding-bottom: 1rem;
        }
        h1 {
          font-size: 2rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }
        .contact-info {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.9rem;
          color: #4a5568;
        }
        .contact-info div {
          display: flex;
          align-items: center;
        }
        .section {
          margin-bottom: 1.5rem;
        }
        h2 {
          font-size: 1.3rem;
          color: #2d3748;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.25rem;
        }
        .summary {
          margin-bottom: 1.5rem;
        }
        .summary ul {
          padding-left: 1.5rem;
        }
        .summary li {
          margin-bottom: 0.5rem;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          list-style: none;
        }
        .skill-item {
          background: #f7fafc;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.9rem;
          border: 1px solid #e2e8f0;
        }
        .work-item, .project-item, .education-item, .certification-item {
          margin-bottom: 1.25rem;
        }
        h3 {
          font-size: 1.1rem;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }
        .work-meta, .project-meta, .education-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }
        .work-description ul, .project-description ul {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }
        .work-description li, .project-description li {
          margin-bottom: 0.25rem;
        }
        .links {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .links a {
          color: #4299e1;
          text-decoration: none;
        }
        .links a:hover {
          text-decoration: underline;
        }
        @media print {
          body {
            padding: 0;
          }
          .resume-container {
            padding: 0.5in;
          }
        }
      </style>
    </head>
    <body>
      <div class="resume-container">
        <header class="header">
          <h1>${name}</h1>
          <div class="contact-info">
            ${email ? `<div>${email}</div>` : ''}
            ${phone ? `<div>${phone}</div>` : ''}
            ${location ? `<div>${location}</div>` : ''}
            
            <div class="links">
              ${linkedin ? `<a href="${linkedin}" target="_blank">LinkedIn</a>` : ''}
              ${github ? `<a href="${github}" target="_blank">GitHub</a>` : ''}
              ${portfolio ? `<a href="${portfolio}" target="_blank">Portfolio</a>` : ''}
            </div>
          </div>
        </header>
        
        ${professionalSummary.length > 0 ? `
        <section class="section summary">
          <h2>Professional Summary</h2>
          <ul>
            ${professionalSummary.map((point: string) => `<li>${point}</li>`).join('')}
          </ul>
        </section>
        ` : ''}
        
        ${skills.length > 0 ? `
        <section class="section skills-section">
          <h2>Skills</h2>
          <ul class="skills-list">
            ${skills.map((skill: string) => `<li class="skill-item">${skill}</li>`).join('')}
          </ul>
        </section>
        ` : ''}
        
        ${experiences.length > 0 ? `
        <section class="section experience-section">
          <h2>Experience</h2>
          ${experiences.map((exp: any) => `
            <div class="work-item">
              <h3>${exp.title}</h3>
              <div class="work-meta">
                <span>${exp.company}${exp.location ? `, ${exp.location}` : ''}</span>
                <span>${exp.dateRange}</span>
              </div>
              <div class="work-description">
                <ul>
                  ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </section>
        ` : ''}
        
        ${projects.length > 0 ? `
        <section class="section projects-section">
          <h2>Projects</h2>
          ${projects.map((project: any) => `
            <div class="project-item">
              <h3>${project.name}</h3>
              ${project.technologies ? `<div class="project-meta">${project.technologies}</div>` : ''}
              <div class="project-description">
                <ul>
                  ${project.highlights.map((highlight: string) => `<li>${highlight}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </section>
        ` : ''}
        
        ${education.university ? `
        <section class="section education-section">
          <h2>Education</h2>
          <div class="education-item">
            <h3>${education.university}</h3>
            <div class="education-meta">
              <span>${education.major || ''}</span>
              <span>${education.graduationYear || ''}</span>
            </div>
            ${education.location ? `<div>${education.location}</div>` : ''}
          </div>
        </section>
        ` : ''}
        
        ${certifications.length > 0 ? `
        <section class="section certifications-section">
          <h2>Certifications</h2>
          ${certifications.map((cert: any) => `
            <div class="certification-item">
              <h3>${cert.name}</h3>
              <div class="work-meta">
                <span>${cert.issuer}</span>
                <span>${cert.dateReceived || ''}</span>
              </div>
            </div>
          `).join('')}
        </section>
        ` : ''}
      </div>
    </body>
    </html>
    `;
    
    return html;
  } catch (error) {
    console.error('Error generating HTML from JSON:', error);
    // Return a basic error template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume Generation Error</title>
      </head>
      <body>
        <h1>Error Generating Resume</h1>
        <p>There was an error processing your resume data. Please try again later.</p>
      </body>
      </html>
    `;
  }
}

/**
 * Creates a prompt for the AI to format resume content based on Tech Interview Handbook best practices
 */
function createCVPrompt(profileData: any): string {
  // Extract data from profileData
  const { 
    firstName = '', 
    lastName = '', 
    email = '',
    phoneNumber = '',
    location = '',
    address = '',
    university = '',
    major = '',
    graduationYear = '',
    skills = [],
    experiences = [],
    certifications = [],
    githubProjects = [],
    bio = '',
    githubUrl = '',
    linkedinUrl = '',
    portfolioUrl = '',
  } = profileData;
  
  // Format experiences for the prompt
  const experiencesText = experiences && experiences.length > 0 
    ? experiences.map((exp: any) => {
        const dateRange = exp.startDate 
          ? `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}` 
          : '';
        return `
          Position: ${exp.title || ''}
          Company: ${exp.company || ''}
          Location: ${exp.location || ''}
          Dates: ${dateRange}
          Description: ${exp.description || ''}
        `;
      }).join('\n\n')
    : 'No work experience provided';
  
  // Format certifications for the prompt
  const certificationsText = certifications && certifications.length > 0
    ? certifications.map((cert: any) => {
        return `
          Name: ${cert.name || ''}
          Issuer: ${cert.issuer || ''}
          Date: ${cert.dateReceived ? formatDate(cert.dateReceived) : ''}
        `;
      }).join('\n\n')
    : 'No certifications provided';
  
  // Format projects for the prompt
  const projectsText = githubProjects && githubProjects.length > 0
    ? githubProjects.map((project: any) => {
        const technologies = project.technologies && project.technologies.length > 0
          ? project.technologies.join(', ')
          : '';
        return `
          Name: ${project.name || ''}
          Description: ${project.description || ''}
          Technologies: ${technologies}
          URL: ${project.url || ''}
        `;
      }).join('\n\n')
    : 'No projects provided';
  
  // Create the prompt
  return `
    Format the following resume information into an optimized, ATS-friendly resume in JSON format. DO NOT create any HTML - just return a JSON object with the formatted content.
    The resume should be optimized to pass Applicant Tracking Systems (ATS) and appeal to hiring managers in tech companies.
    
    STUDENT INFORMATION:
    -------------------
    Full Name: ${firstName} ${lastName}
    Email: ${email}
    Phone: ${phoneNumber}
    Location: ${location}
    Address: ${address}
    
    Education:
    University: ${university}
    Major: ${major}
    Graduation Year: ${graduationYear}
    
    Skills: ${skills.join(', ')}
    
    Work Experience:
    ${experiencesText}
    
    Certifications:
    ${certificationsText}
    
    Projects:
    ${projectsText}
    
    Bio/Summary:
    ${bio}
    
    Online Presence:
    GitHub: ${githubUrl || 'Not provided'}
    LinkedIn: ${linkedinUrl || 'Not provided'}
    Portfolio: ${portfolioUrl || 'Not provided'}
    
    ATS-OPTIMIZATION REQUIREMENTS:
    ----------------------------
    1. Return a JSON object with the following standard resume sections in this order:
       {
         "contactInfo": {
           "name": "Full Name",
           "email": "Email",
           "phone": "Phone",
           "location": "Location",
           "linkedin": "LinkedIn URL",
           "github": "GitHub URL",
           "portfolio": "Portfolio URL"
         },
         "professionalSummary": {
           "summaryPoints": ["point1", "point2", "point3"]  // 3-4 concise, impactful bullet points
         },
         "skills": {
           "skillsList": ["skill1", "skill2", ...]  // Organized by relevance and categorized if possible
         },
         "experience": {
           "experiences": [
             {
               "title": "Exact Job Title",
               "company": "Company Name",
               "location": "Location",
               "dateRange": "MMM YYYY - MMM YYYY", // Consistent date format
               "achievements": ["achievement1", "achievement2", ...]  // 3-5 bullet points per role
             }
           ]
         },
         "projects": {
           "projectsList": [
             {
               "name": "Project Name",
               "technologies": "Tech Stack used",
               "highlights": ["highlight1", "highlight2", ...]  // 2-3 bullet points per project
             }
           ]
         },
         "education": {
           "university": "University Name",
           "major": "Degree and Major",
           "graduationYear": "Year",
           "location": "Location"
         },
         "certifications": {
           "certificationsList": [
             {
               "name": "Certification Name",
               "issuer": "Issuing Organization",
               "dateReceived": "MMM YYYY"
             }
           ]
         }
       }
    
    2. ATS-FRIENDLY CONTENT GUIDELINES:
       a. Professional Summary: Create a powerful, concise summary that directly answers why they are a good fit for tech roles.
          - Start with the person's current job role/title or aspiration
          - Include years of experience in relevant areas
          - Highlight top 2-3 skills that make them stand out
          - Match keywords that are common in job descriptions for their target role
       
       b. Skills Section: Group skills logically and prioritize technical skills first
          - List programming languages and technical skills first
          - Follow with frameworks, tools, and technologies
          - Include soft skills only if particularly relevant
          - Ensure ALL skills mentioned in experience/projects also appear here
       
       c. Experience Bullet Points:
          - Start each with a STRONG ACTION VERB (implemented, developed, designed, etc.)
          - Follow the X-Y-Z formula: "Accomplished X, as measured by Y, by doing Z"
          - Include SPECIFIC METRICS and QUANTIFIABLE RESULTS (percentages, numbers, time saved)
          - Use technical terminology relevant to the field
          - Keep each bullet point under 2 lines
          - Include tech stack used for each project/experience
       
       d. Projects:
          - Prioritize projects that demonstrate technical skills relevant to the target job
          - Include GitHub links if available
          - Clearly explain the problem solved, technology used, and outcome
          - Keep descriptions technically precise but understandable
       
       e. Education:
          - List degree, major, university, and graduation year
          - Include GPA only if above 3.5
          - List relevant coursework only if it directly relates to target jobs
    
    3. OPTIMIZATION TECHNIQUES:
       - Use STANDARD, ATS-FRIENDLY SECTION HEADINGS exactly as provided in the JSON structure
       - Include KEYWORDS from the student's field but avoid keyword stuffing
       - Keep formatting clean and simple
       - Ensure consistency in date formats, punctuation, and capitalization
       - Use industry-standard terminology for job titles and technologies
       - Make sure the resume information aligns with LinkedIn profile data if available
    
    4. CONTENT DO'S AND DON'TS:
       DO:
       - Quantify achievements wherever possible (e.g., "Increased server response time by 40%")
       - Use present tense for current positions and past tense for previous positions
       - Include specific technologies, languages, and frameworks in each experience
       - Focus on achievements rather than responsibilities
       
       DON'T:
       - Use personal pronouns (I, me, my)
       - Include irrelevant experiences or skills
       - Use flowery language or clichés
       - Include personal information like age, marital status, etc.

    5. QUANTIFICATION REQUIREMENTS (ESSENTIAL):
       a. For EVERY achievement in experience and projects, you MUST quantify impact using at least one of these methods:
          - WHOLE NUMBERS: Use specific metrics like "$50,000 in revenue," "20 new clients," "5 critical bugs fixed"
          - PERCENTAGES: Show growth or reduction like "increased efficiency by 25%," "reduced errors by 40%"
          - TIME METRICS: Quantify time saved like "reduced processing time from 5 minutes to 30 seconds"
          - SCALE: Indicate project size with metrics like "managed database of 500,000 records"
          - FREQUENCY: Show consistency with metrics like "delivered 15 weekly reports" or "maintained 99.9% uptime"
          - COMPARISONS: Use "exceeded target by 20%" or "performed 30% better than previous system"
       
       b. Quantification Techniques for Technical Roles:
          - CODE EFFICIENCY: "Optimized algorithm reducing runtime by 65%"
          - DATABASE: "Improved query performance by 45% by implementing indexing strategies"
          - USER EXPERIENCE: "Increased user engagement 30% through UI/UX improvements"
          - AUTOMATION: "Automated processes saving team 15 hours weekly"
          - TESTING: "Implemented test suite achieving 95% code coverage"
          - DEPLOYMENT: "Reduced deployment time from 2 hours to 10 minutes"
          - STABILITY: "Decreased system crashes by 80%"
       
       c. Project Impact Quantification:
          - Show BUSINESS IMPACT of technical work
          - Connect technical changes to user metrics (e.g., "Redesigned checkout process, increasing conversion rate by 25%")
          - Quantify scale (e.g., "Built API handling 10,000 requests per minute")
          - Measure before/after scenarios (e.g., "Reduced page load time from 5s to 1.2s")
          - Show adoption metrics (e.g., "Feature used by 80% of users within first month")
       
       d. If exact numbers aren't available, make reasonable estimates:
          - Use ranges: "Improved efficiency by 15-20%"
          - Use "approximately" or "over" with conservative estimates: "saved approximately 10 hours per week"
          - Compare to benchmarks: "performed 3x faster than industry standard"
    
    RESPONSE FORMAT:
    --------------
    EXTREMELY IMPORTANT: Return ONLY the raw JSON object with the formatted content. 
    
    - DO NOT wrap the JSON in markdown code blocks (no triple backticks)
    - DO NOT include any explanatory text before or after the JSON
    - DO NOT use markdown formatting of any kind
    - ENSURE the JSON is properly formatted and valid
    - The response should begin with { and end with } with nothing else before or after
    
    The JSON will be directly parsed with JSON.parse() so it must be syntactically correct JSON.
  `;
}

/**
 * Calls the Gemini API directly to generate resume JSON
 */
export async function callGeminiAPI(profileData: any): Promise<any> {
  try {
    console.log('Calling Gemini API directly');
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }
    
    // Build the prompt
    const prompt = createCVPrompt(profileData);
    console.log('Gemini prompt created, length:', prompt.length);
    
    // Create the API request body
    const requestBody = {
      model: MODEL,
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 65535
      }
    };
    
    // Make the API call
    const apiUrl = `${GEMINI_API_URL}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    console.log('Making Gemini API call to:', `${GEMINI_API_URL}/models/${MODEL}:generateContent`);
    
    const response = await axios.post(apiUrl, requestBody, {
        headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Gemini API response status:', response.status);
    
    // Extract the generated text from the response
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const generatedText = response.data.candidates[0].content.parts[0].text;
      console.log('Generated text length:', generatedText.length);
      
      try {
        // Extract JSON from markdown code blocks if present
        let jsonString = generatedText;
        
        // Check if the response is wrapped in a markdown code block (```json ... ```)
        const markdownJsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
        const markdownMatch = generatedText.match(markdownJsonRegex);
        
        if (markdownMatch && markdownMatch[1]) {
          console.log('Found JSON in markdown code block, extracting...');
          jsonString = markdownMatch[1];
        }
        
        // Also check for JSON that might not be in code blocks but has extra text before/after
        const jsonRegex = /(\{[\s\S]*\})/;
        const jsonMatch = jsonString.match(jsonRegex);
        
        if (jsonMatch && jsonMatch[1]) {
          console.log('Extracted JSON object from response');
          jsonString = jsonMatch[1];
        }
        
        console.log('Attempting to parse JSON string:', jsonString.substring(0, 100) + '...');
        
        // Parse the extracted JSON
        const jsonData = JSON.parse(jsonString);
        return jsonData;
      } catch (e) {
        console.error('Error parsing Gemini response as JSON:', e);
        console.error('Raw response:', generatedText);
        throw new Error('Invalid JSON response from Gemini API');
      }
    } else {
      console.error('Unexpected Gemini API response structure:', response.data);
      throw new Error('Unexpected response from Gemini API');
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    
    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }
    
    throw error;
  }
}

/**
 * Saves HTML content to the CV record
 */
export const saveResumeHtml = async (cvId: string, htmlContent: string): Promise<boolean> => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  
  try {
    console.log(`Saving HTML content for CV ID: ${cvId}, content length: ${htmlContent.length}`);
    
    const response = await axios.put(
      `${apiUrl}/cvs/${cvId}/html`,
      htmlContent,
      {
        headers: {
          'Authorization': `Bearer ${authService.getCurrentUser()?.accessToken}`,
          'Content-Type': 'text/html'
        }
      }
    );
    
    console.log(`HTML content saved successfully, status: ${response.status}`);
    return true;
  } catch (error: any) {
    console.error('Error saving HTML content:', error);
    
    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }
    
    return false;
  }
};

/**
 * Generates a CV using the student's profile data
 */
export const generateCV = async (profileData: any): Promise<any> => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  
  try {
    console.log('Generating CV with profile data:', profileData);
    
    // Step 1: Create a placeholder CV entity
    console.log('Creating placeholder CV entity');
    const createResponse = await axios.post(
      `${apiUrl}/cvs/generate`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authService.getCurrentUser()?.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!createResponse.data || !createResponse.data.id) {
      console.error('No ID in create CV response:', createResponse);
      throw new Error('Failed to create CV');
    }
    
    const cvId = createResponse.data.id;
    console.log('Created placeholder CV with ID:', cvId);
    
    // Step 2: Generate the CV content using Gemini API directly
    console.log('Calling Gemini API directly from frontend');
    const jsonContent = await callGeminiAPI(profileData);
    
    // Convert the JSON to a string
    const jsonContentStr = JSON.stringify(jsonContent);
    console.log('Generated CV content length:', jsonContentStr.length);
    
    // Step 3: Update the CV entity with the generated content
    console.log('Updating CV entity with generated content');
    await axios.put(
      `${apiUrl}/cvs/${cvId}/content`,
      jsonContentStr,
      {
        headers: {
          'Authorization': `Bearer ${authService.getCurrentUser()?.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Step 4: Generate HTML and save it as well
    try {
      // Import the HTML generator directly to avoid circular dependencies
      const { default: resumeHtmlGenerator } = await import('./resumeHtmlGenerator');
      
      // Generate HTML from the JSON content
      const htmlContent = resumeHtmlGenerator.generateResumeHtml(jsonContent);
      console.log('Generated HTML content length:', htmlContent.length);
      
      // Save the HTML content
      await saveResumeHtml(cvId, htmlContent);
    } catch (htmlError) {
      console.error('Error generating/saving HTML content:', htmlError);
      // Continue even if HTML generation fails, we still have the JSON
    }
    
    console.log('CV updated with content');
    
    return {
      jsonContent,
      id: cvId
    };
  } catch (error: any) {
    console.error('Error generating CV:', error);
    
    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }
    
    throw error;
  }
};

/**
 * Formats a date string to "MMM YYYY" format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Gets CV content by ID with retries
 */
export async function getCVContent(cvId: string, token: string, retries = 3): Promise<string> {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

  try {
    console.log(`Getting CV content for ID: ${cvId}`);
    const response = await axios.get(`${apiUrl}/cvs/${cvId}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        'Accept': 'application/json, text/html'
      },
      responseType: 'text',
      validateStatus: status => status < 500 // Accept any status < 500 to handle 404s ourselves
    });
    
    console.log(`Received CV content response, status: ${response.status}`);
    
    // Handle 404 (not found) separately - the CV might not be ready yet
    if (response.status === 404) {
      console.log('CV content not found (404), it might not be ready yet');
      if (retries > 0) {
        console.log(`Will retry in ${(4 - retries) * 500}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 500));
        return getCVContent(cvId, token, retries - 1);
      }
      throw new Error('CV content not found after multiple attempts');
    }
    
    // Handle other non-200 responses
    if (response.status !== 200) {
      console.error(`Unexpected response status: ${response.status}`);
      throw new Error(`API returned status ${response.status}`);
    }
    
    // Response should be a string (either JSON or HTML)
    if (typeof response.data === 'string') {
      const contentLength = response.data.length;
      console.log('Response data is a string of length:', contentLength);
      
      if (contentLength === 0) {
        console.warn('Received empty content from API');
        if (retries > 0) {
          console.log(`Empty content, will retry in ${(4 - retries) * 1000}ms... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
          return getCVContent(cvId, token, retries - 1);
        }
        throw new Error('Received empty content after multiple attempts');
      }
      
      return response.data;
    }
    
    // Handle unexpected response
    console.error('Unexpected response type:', typeof response.data);
    throw new Error(`Unexpected response type: ${typeof response.data}`);
  } catch (error: any) {
    console.error('Error getting CV content:', error);
    
    // Extract more specific error information
    let errorMessage = 'Unknown error getting CV content';
    if (error.response) {
      errorMessage = `Server responded with status ${error.response.status}: ${
        error.response.data?.message || error.response.statusText || 'Unknown error'
      }`;
      console.error(errorMessage, error.response.data);
    } else if (error.request) {
      errorMessage = 'No response received from server';
      console.error('No response received:', error.request);
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    // Retry logic
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      // Exponential backoff: wait longer between each retry
      const delay = 1000 * (4 - retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getCVContent(cvId, token, retries - 1);
    }
    
    // After all retries, throw a detailed error
    throw new Error(`Failed to get CV content after multiple attempts: ${errorMessage}`);
  }
}

/**
 * Gets current user's CV content
 */
export async function getCurrentUserCVContent(token: string): Promise<string> {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  
  try {
    console.log('Getting current user CV content');
    const response = await axios.get(`${apiUrl}/cvs/me/content`, {
        headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/html'
      },
      responseType: 'text'
    });
    
    console.log(`Received current user CV content, response status: ${response.status}`);
    
    // Response should be HTML text
    if (typeof response.data === 'string') {
      console.log('Response data is a string of length:', response.data.length);
      return response.data;
    }
    
    // Handle unexpected response
    console.error('Unexpected response type:', typeof response.data);
    throw new Error(`Unexpected response type: ${typeof response.data}`);
  } catch (error) {
    console.error('Error getting current user CV content:', error);
    throw error;
  }
}

/**
 * Converts HTML CV to PDF format
 */
export async function convertCVToPDF(htmlContent: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary div to hold the HTML content
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);
      
      // Configure html2pdf options
      const options = {
        margin: 10,
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' | 'landscape' }
      };
      
      // Generate PDF
      html2pdf()
        .from(element)
        .set(options)
        .outputPdf('blob')
        .then((pdf: Blob | string) => {
          // Clean up the temporary element
          document.body.removeChild(element);
          if (pdf instanceof Blob) {
            resolve(pdf);
          } else {
            // Convert string to Blob if needed
            resolve(new Blob([pdf], { type: 'application/pdf' }));
          }
        })
        .catch((error: any) => {
          document.body.removeChild(element);
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Logs the structure of an HTML resume for debugging
 */
export function logResumeStructure(htmlContent: string): void {
  if (!htmlContent) {
    console.error('No HTML content provided to logResumeStructure');
    return;
  }
  
  try {
    console.log('Analyzing resume structure...');
    
    // Check if it's an HTML string
    const isHtml = htmlContent.includes('<!DOCTYPE html>') || htmlContent.includes('<html>');
    if (!isHtml) {
      console.log('Content doesn\'t appear to be HTML, first 100 chars:', htmlContent.substring(0, 100));
      
      // Try to parse as JSON if it looks like JSON
      if ((htmlContent.startsWith('{') && htmlContent.endsWith('}')) || 
          (htmlContent.startsWith('[') && htmlContent.endsWith(']')) ||
          (htmlContent.startsWith('"') && htmlContent.endsWith('"'))) {
        try {
          const parsedJson = JSON.parse(htmlContent);
          console.log('Content appears to be JSON, structure:', 
            typeof parsedJson === 'object' ? Object.keys(parsedJson) : typeof parsedJson);
        } catch (e) {
          console.log('Failed to parse as JSON:', e);
        }
      }
      
      // Not much else we can do with non-HTML content
      return;
    }
    
    // Simple structure extraction through regex
    const structureInfo: Record<string, any> = {};
    
    // Extract name
    const nameMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (nameMatch && nameMatch[1]) {
      structureInfo.name = nameMatch[1].trim();
    }
    
    // Extract contact info
    const contactMatches = htmlContent.matchAll(/<div class="contact-info">[\s\S]*?<\/div>/g);
    if (contactMatches) {
      const contactInfo: string[] = [];
      for (const match of contactMatches) {
        const contactText = match[0];
        const items = contactText.match(/<div[^>]*>([^<]+)<\/div>/g);
        if (items) {
          items.forEach(item => {
            const content = item.match(/<div[^>]*>([^<]+)<\/div>/);
            if (content && content[1]) {
              contactInfo.push(content[1].trim());
            }
          });
        }
      }
      structureInfo.contactInfo = contactInfo;
    }
    
    // Extract skills
    const skillMatches = htmlContent.matchAll(/<li class="skill-item">([^<]+)<\/li>/g);
    if (skillMatches) {
      const skills: string[] = [];
      for (const match of Array.from(skillMatches)) {
        if (match[1]) {
          skills.push(match[1].trim());
        }
      }
      structureInfo.skills = skills;
    }
    
    // Extract education
    const educationMatch = htmlContent.match(/<div class="education-item">[\s\S]*?<\/div>/);
    if (educationMatch) {
      const educationText = educationMatch[0];
      const universityMatch = educationText.match(/<h3>([^<]+)<\/h3>/);
      
      const education: Record<string, string> = {};
      if (universityMatch && universityMatch[1]) {
        education.university = universityMatch[1].trim();
      }
      
      structureInfo.education = education;
    }
    
    // Log the extracted structure
    console.log('Parsed Resume Structure:', structureInfo);
  } catch (error) {
    console.error('Error analyzing resume structure:', error);
  }
}

export default {
  generateCV,
  getCVContent,
  getCurrentUserCVContent,
  convertCVToPDF,
  logResumeStructure,
  saveResumeHtml
}; 