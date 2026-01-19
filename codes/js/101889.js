import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.js';
import fallbackGenerator from './fallback-generator.js';

export class GeminiService {
    constructor() {
        // Initialize Gemini API
        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        // Use gemini-pro model
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-pro",
            safetySettings: [
                {
                    category: "HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        });
        
        // Rate limiting configuration
        this.requestQueue = [];
        this.isProcessing = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 3000; // 3 seconds between requests
        this.maxRetries = 2;
        this.retryDelay = 10000; // 10 seconds base retry delay
        this.maxConcurrentRequests = 1;
        this.activeRequests = 0;
        this.hourlyRequestCount = 0;
        this.hourlyRequestLimit = 50; // Conservative limit
        this.lastHourReset = Date.now();
        this.useFallback = false;

        this.API_KEY = config.GEMINI_API_KEY;
        this.MODEL = config.MODEL;
        this.BASE_URL = config.BASE_URL;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const { prompt, resolve, reject } = this.requestQueue[0];

            try {
                // Check rate limits
                await this.enforceRateLimits();

                // Make the actual API request
                const result = await this.makeRequest(prompt);
                resolve(result);
            } catch (error) {
                reject(error);
            }

            this.requestQueue.shift();
        }

        this.isProcessing = false;
    }

    async enforceRateLimits() {
        // Reset hourly count if an hour has passed
        if (Date.now() - this.lastHourReset >= 3600000) {
            this.hourlyRequestCount = 0;
            this.lastHourReset = Date.now();
        }

        // Check hourly limit
        if (this.hourlyRequestCount >= this.hourlyRequestLimit) {
            throw new Error('Hourly request limit exceeded');
        }

        // Enforce minimum interval between requests
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await this.sleep(this.minRequestInterval - timeSinceLastRequest);
        }
    }

    async makeRequest(prompt, retryCount = 0) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Update rate limiting trackers
            this.lastRequestTime = Date.now();
            this.hourlyRequestCount++;
            
            return text;
        } catch (error) {
            if (retryCount < this.maxRetries) {
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, retryCount);
                await this.sleep(delay);
                return this.makeRequest(prompt, retryCount + 1);
            }
            
            if (this.useFallback) {
                return fallbackGenerator.generateResponse(prompt);
            }
            
            throw error;
        }
    }

    async generateCoverLetter(jobDescription, userProfile) {
        try {
            if (this.useFallback) {
                return await fallbackGenerator.generateCoverLetter(jobDescription, userProfile);
            }

            const prompt = `Generate a professional cover letter for the following job description:
            Job Description: ${jobDescription}
            
            Using this candidate profile:
            ${userProfile}
            
            Please write a compelling cover letter that highlights the candidate's relevant experience and skills for this position.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return text;
        } catch (error) {
            console.error('Error generating cover letter:', error);
            this.useFallback = true;
            return await fallbackGenerator.generateCoverLetter(jobDescription, userProfile);
        }
    }

    async enhanceJobDescription(description) {
        try {
            if (this.useFallback) {
                return await fallbackGenerator.enhanceJobDescription(description);
            }

            const prompt = `Enhance the following job description by adding more details and making it more comprehensive:
            ${description}
            
            Please provide a well-structured and detailed job description that includes:
            1. Role responsibilities
            2. Required skills and qualifications
            3. Preferred experience
            4. Company culture and benefits`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return text;
        } catch (error) {
            console.error('Error enhancing job description:', error);
            this.useFallback = true;
            return await fallbackGenerator.enhanceJobDescription(description);
        }
    }

    async suggestSkills(jobDescription) {
        try {
            if (this.useFallback) {
                return await fallbackGenerator.suggestSkills(jobDescription);
            }

            const prompt = `Based on this job description, suggest relevant skills that would be valuable for this position:
            ${jobDescription}
            
            Please provide:
            1. A list of technical skills required
            2. Soft skills that would be valuable
            3. Industry-specific knowledge that would be beneficial
            Format the response as a JSON object with these categories.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('Error parsing skills JSON:', parseError);
                return {
                    technicalSkills: [],
                    softSkills: [],
                    industryKnowledge: []
                };
            }
        } catch (error) {
            console.error('Error suggesting skills:', error);
            this.useFallback = true;
            return await fallbackGenerator.suggestSkills(jobDescription);
        }
    }

    async generateAchievements(experience) {
        const prompt = `
        Based on the following work experience, generate strong achievement statements that:
        1. Use action verbs
        2. Include measurable results
        3. Demonstrate impact
        4. Are concise and specific
        
        Experience:
        ${experience}
        `;

        return new Promise((resolve, reject) => {
            this.requestQueue.push({ prompt, resolve, reject });
            this.processQueue();
        });
    }
}

// Export a singleton instance
export const geminiService = new GeminiService();
