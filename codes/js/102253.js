// services/ResumeParserService.js
import axios from "axios";

/**
 * Service for parsing resumes and extracting skills
 * Uses backend API to extract real skills from resumes
 */
class ResumeParserService {
  constructor() {
    // Use window.location.origin for browser compatibility
    const baseUrl = window.location.origin.includes("localhost")
      ? "https://getmax-backend.vercel.app"
      : window.location.origin;

    this.apiBaseUrl = `${baseUrl}/api`;
    this.getToken = () => localStorage.getItem("token");
  }

  /**
   * Get skills for a specific employee from their resume using Gemini AI
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Array>} Array of skills extracted from resume using Gemini AI
   */
  async getEmployeeSkills(employeeId) {
    try {
      console.log(`Getting skills for employee: ${employeeId} using Gemini AI`);

      const token = this.getToken();
      if (!token) {
        console.warn("No authentication token found");
        return this.getDefaultSkills();
      }

      // Call backend API to get employee skills (will use Gemini AI)
      const response = await axios.get(
        `${this.apiBaseUrl}/resume/skills/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success && response.data.skills) {
        console.log(
          `Successfully loaded ${
            response.data.skills.length
          } skills for employee ${employeeId} using ${
            response.data.aiUsed || "Gemini AI"
          }`
        );

        // Cache the skills for future use
        this.cacheEmployeeSkills(employeeId, response.data.skills);

        return response.data.skills;
      } else {
        console.warn("No skills returned from Gemini AI, using default skills");
        return this.getDefaultSkills();
      }
    } catch (error) {
      console.error("Error getting employee skills from Gemini AI:", error);

      // Try to get cached skills as fallback
      const cachedSkills = this.getCachedEmployeeSkills(employeeId);
      if (cachedSkills) {
        console.log("Using cached skills as fallback");
        return cachedSkills;
      }

      return this.getDefaultSkills();
    }
  }

  /**
   * Parse resume file and extract skills
   * @param {File} file - Resume file (PDF or DOCX)
   * @returns {Promise<Array>} Array of extracted skills
   */
  async parseResumeFile(file) {
    try {
      console.log(`Parsing resume file: ${file.name}`);

      const token = this.getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // First, extract text from the file
      const formData = new FormData();
      formData.append("resume", file);

      const response = await axios.post(
        `${this.apiBaseUrl}/resume/extract-text`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success && response.data.text) {
        // Then parse skills from the extracted text
        return await this.parseSkillsFromText(response.data.text);
      } else {
        throw new Error("Failed to extract text from file");
      }
    } catch (error) {
      console.error("Error parsing resume file:", error);
      return this.getDefaultSkills();
    }
  }

  /**
   * Parse skills from resume text
   * @param {string} resumeText - Text content of the resume
   * @returns {Promise<Array>} Array of extracted skills
   */
  async parseSkillsFromText(resumeText) {
    try {
      console.log("Parsing skills from resume text...");

      const token = this.getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/resume/parse-skills`,
        { text: resumeText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.data.skills) {
        console.log(
          `Found ${response.data.skills.length} skills from resume text`
        );
        return response.data.skills;
      } else {
        console.warn("No skills extracted from text, using default skills");
        return this.getDefaultSkills();
      }
    } catch (error) {
      console.error("Error parsing skills from text:", error);
      return this.getDefaultSkills();
    }
  }

  /**
   * Refresh skills for an employee (clear cache and re-parse)
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Array>} Array of refreshed skills
   */
  async refreshEmployeeSkills(employeeId) {
    try {
      console.log(`Refreshing skills for employee: ${employeeId}`);

      // Clear cached skills
      this.clearCachedSkills(employeeId);

      // Get fresh skills from API
      const skills = await this.getEmployeeSkills(employeeId);

      console.log(
        `Refreshed ${skills.length} skills for employee ${employeeId}`
      );
      return skills;
    } catch (error) {
      console.error("Error refreshing employee skills:", error);
      return this.getDefaultSkills();
    }
  }

  /**
   * Cache employee skills in localStorage
   * @param {string} employeeId - Employee ID
   * @param {Array} skills - Skills array
   */
  cacheEmployeeSkills(employeeId, skills) {
    try {
      const cacheKey = `skills_${employeeId}`;
      const cacheData = {
        skills,
        timestamp: Date.now(),
        ttl: 4 * 60 * 60 * 1000, // 4 hours cache
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached ${skills.length} skills for employee ${employeeId}`);
    } catch (error) {
      console.warn("Error caching skills:", error);
    }
  }

  /**
   * Get cached employee skills
   * @param {string} employeeId - Employee ID
   * @returns {Array|null} Cached skills or null
   */
  getCachedEmployeeSkills(employeeId) {
    try {
      const cacheKey = `skills_${employeeId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;

      if (isExpired) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`Using cached skills for employee ${employeeId}`);
      return cacheData.skills;
    } catch (error) {
      console.warn("Error getting cached skills:", error);
      return null;
    }
  }

  /**
   * Clear cached skills for an employee
   * @param {string} employeeId - Employee ID
   */
  clearCachedSkills(employeeId) {
    try {
      const cacheKey = `skills_${employeeId}`;
      localStorage.removeItem(cacheKey);
      console.log(`Cleared cached skills for employee ${employeeId}`);
    } catch (error) {
      console.warn("Error clearing cached skills:", error);
    }
  }

  /**
   * Update skills for an employee (manual override)
   * @param {string} employeeId - Employee ID
   * @param {Array} skills - Skills array
   * @returns {Promise<Array>} Updated skills
   */
  async updateEmployeeSkills(employeeId, skills) {
    try {
      console.log(`Updating skills for employee: ${employeeId}`);

      const token = this.getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/resume/skills/${employeeId}`,
        { skills },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.data.skills) {
        // Update cache with new skills
        this.cacheEmployeeSkills(employeeId, response.data.skills);

        console.log(
          `Updated ${response.data.skills.length} skills for employee ${employeeId}`
        );
        return response.data.skills;
      } else {
        throw new Error("Failed to update skills");
      }
    } catch (error) {
      console.error("Error updating employee skills:", error);
      throw error;
    }
  }

  /**
   * Check if employee has a resume uploaded
   * @param {string} employeeId - Employee ID
   * @returns {Promise<boolean>} True if resume exists
   */
  async hasResume(employeeId) {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await axios.get(
        `${this.apiBaseUrl}/documents/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const documents = response.data.documents || [];
      return documents.some((doc) => doc.documentType === "resume");
    } catch (error) {
      console.warn("Error checking for resume:", error);
      return false;
    }
  }

  /**
   * Get default skills when resume parsing fails or no resume exists
   * @returns {Array} Default skills array (soft skills)
   */
  getDefaultSkills() {
    return [
      {
        name: "Communication",
        level: 80,
        category: "Soft Skills",
        expertise: "Advanced",
        color: "#4caf50",
      },
      {
        name: "Problem Solving",
        level: 75,
        category: "Soft Skills",
        expertise: "Intermediate",
        color: "#2196f3",
      },
      {
        name: "Teamwork",
        level: 85,
        category: "Soft Skills",
        expertise: "Advanced",
        color: "#ff9800",
      },
      {
        name: "Time Management",
        level: 70,
        category: "Soft Skills",
        expertise: "Intermediate",
        color: "#607d8b",
      },
      {
        name: "Leadership",
        level: 65,
        category: "Soft Skills",
        expertise: "Intermediate",
        color: "#9c27b0",
      },
    ];
  }

  /**
   * Get skill categories for filtering
   * @returns {Array} Array of skill categories
   */
  getSkillCategories() {
    return [
      "Programming Languages",
      "Frontend",
      "Backend",
      "Database",
      "Cloud/DevOps",
      "Mobile",
      "Design",
      "Testing",
      "API",
      "Tools",
      "Soft Skills",
      "Other",
    ];
  }

  /**
   * Format skills for display (ensure all required fields)
   * @param {Array} skills - Raw skills array
   * @returns {Array} Formatted skills array
   */
  formatSkills(skills) {
    if (!Array.isArray(skills)) return this.getDefaultSkills();

    return skills
      .map((skill) => ({
        name: skill.name || "Unknown Skill",
        level: Math.max(0, Math.min(100, skill.level || 50)),
        category: skill.category || "Other",
        expertise: skill.expertise || this.getExpertiseLevel(skill.level || 50),
        color: skill.color || this.getRandomColor(),
      }))
      .slice(0, 8); // Limit to 8 skills max
  }

  /**
   * Get expertise level based on skill level
   * @param {number} level - Skill level (0-100)
   * @returns {string} Expertise level
   */
  getExpertiseLevel(level) {
    if (level >= 90) return "Expert";
    if (level >= 75) return "Advanced";
    if (level >= 60) return "Intermediate";
    if (level >= 40) return "Beginner";
    return "Novice";
  }

  /**
   * Get a random color for skills without colors
   * @returns {string} Hex color code
   */
  getRandomColor() {
    const colors = [
      "#f7df1e",
      "#3776ab",
      "#ed8b00",
      "#007acc",
      "#777bb4",
      "#00599c",
      "#239120",
      "#00add8",
      "#61dafb",
      "#4fc08d",
      "#dd0031",
      "#ff3e00",
      "#339933",
      "#47a248",
      "#dc382d",
      "#ff9900",
      "#0078d4",
      "#4285f4",
      "#2496ed",
      "#326ce5",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Create singleton instance
const resumeParserService = new ResumeParserService();
export default resumeParserService;
