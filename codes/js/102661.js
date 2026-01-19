// GeminiService.js - Enhanced with server-side Mem0 Graph Memory integration
import astraDBService from './AstraDBService';

class GeminiService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.debug = false;
    
    // Backend URL
    this.apiUrl = process.env.REACT_APP_KG_API_URL || 'https://graph-backend-866853235757.europe-west3.run.app';
    
    // Add conversation session tracking
    this.currentSessionId = null;
    
    // Mem0 integration
    this.memoryInitialized = false;
  }

  /**
   * Initialize the service
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize() {
    // Use singleton pattern to prevent multiple initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise(async (resolve) => {
      try {
        console.log("🔄 Testing connections in parallel...");
        
        // Run both API tests in parallel with timeout for faster initialization
        const timeoutPromise = (promise, timeout = 10000) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API timeout')), timeout)
            )
          ]);
        };

        const [, , geminiResult] = await Promise.all([
          timeoutPromise(this.initializeMemory(), 8000),
          timeoutPromise(astraDBService.initialize(), 5000),
          timeoutPromise(fetch(`${this.apiUrl}/proxy-gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: "Test" })
          }), 8000)
        ]);
        
        // Process Gemini API response
        const testResponse = geminiResult;
        
        if (testResponse.ok) {
          // Get response as text first to ensure we get the complete data
          const responseText = await testResponse.text();
          console.log(`✅ Received proxy response: ${responseText.length} characters`);
          
          // Parse the text as JSON
          try {
            // eslint-disable-next-line no-unused-vars
            const data = JSON.parse(responseText);
            console.log("✅ Successfully connected to backend Gemini proxy");
            this.isInitialized = true;
            resolve(true);
          } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            console.log("Response text:", responseText.substring(0, 200) + "...");
            this.isInitialized = false;
            resolve(false);
          }
        } else {
          console.error(`API test failed: ${testResponse.status} ${testResponse.statusText}`);
          try {
            const errorText = await testResponse.text();
            console.error("API error response:", errorText);
          } catch (e) {
            console.error("Could not read error response");
          }
          this.isInitialized = false;
          resolve(false);
        }
      } catch (error) {
        if (error.message === 'API timeout') {
          console.error("⏰ API initialization timed out - this may indicate network issues or slow backend response");
        } else if (error.name === 'AbortError') {
          console.error("⏰ API request was aborted due to timeout");
        } else {
          console.error("❌ Failed to initialize Gemini Service:", error);
        }
        this.isInitialized = false;
        resolve(false);
      }
    });

    return this.initializationPromise;
  }

  /**
   * Initialize Mem0 memory service through backend API
   * @returns {Promise<boolean>} True if memory initialization was successful
   */
  async initializeMemory() {
    try {
      console.log("Testing connection to backend Mem0 memory API...");
      
      // Test connection to memory endpoints with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const testResponse = await fetch(`${this.apiUrl}/memory/all/system`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (testResponse.ok) {
        console.log("✅ Successfully connected to backend Mem0 memory API");
        this.memoryInitialized = true;
        return true;
      } else {
        console.error(`Mem0 API test failed: ${testResponse.status} ${testResponse.statusText}`);
        try {
          const errorText = await testResponse.text();
          console.error("API error response:", errorText);
        } catch (e) {
          console.error("Could not read error response");
        }
        this.memoryInitialized = false;
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("⏰ Memory API request timed out after 5 seconds");
      } else {
        console.error("❌ Failed to initialize Mem0 memory API:", error);
      }
      this.memoryInitialized = false;
      return false;
    }
  }

  /**
   * Reset the conversation session
   */
  resetSession() {
    this.currentSessionId = null;
    console.log("Conversation session reset");
  }

  /**
   * Reset a user's memories
   * @param {string} userId - The user ID to reset memories for
   */
  async resetUserMemory(userId) {
    if (!this.memoryInitialized || !userId) {
      console.warn("Cannot reset memory: Mem0 not initialized or no userId provided");
      return false;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/memory/all/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log(`🗑️ Reset all memories for user: ${userId}`);
        return true;
      } else {
        console.error(`Failed to reset memory: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error("Error resetting user memory:", error);
      return false;
    }
  }

  /**
   * Add a memory through the backend API
   * @param {string} text - Text to add to memory
   * @param {string} userId - User ID for memory context
   * @returns {Promise<boolean>} Success status
   */
  async addMemory(text, userId) {
    if (!this.memoryInitialized || !userId) {
      console.warn("Cannot add memory: Mem0 not initialized or no userId provided");
      return false;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/memory/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId })
      });
      
      if (response.ok) {
        console.log(`📝 Added memory for user: ${userId}`);
        return true;
      } else {
        console.error(`Failed to add memory: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error("Error adding memory:", error);
      return false;
    }
  }

  /**
   * Search memories through the backend API
   * @param {string} query - Search query
   * @param {string} userId - User ID for memory context
   * @returns {Promise<string>} Search results
   */
  async searchMemory(query, userId) {
    if (!this.memoryInitialized || !userId) {
      console.warn("Cannot search memory: Mem0 not initialized or no userId provided");
      return "";
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 Found memories for user: ${userId}`);
        return data.results || "";
      } else {
        console.error(`Failed to search memory: ${response.status} ${response.statusText}`);
        return "";
      }
    } catch (error) {
      console.error("Error searching memory:", error);
      return "";
    }
  }

  /**
   * Query the Knowledge Graph API backend with session support
   * @param {string} query - The question to ask
   * @param {string} userId - Optional user ID for memory persistence
   * @returns {Promise<string>} The AI response with knowledge graph data
   */
  async queryKnowledgeGraph(query, userId = null) {
    try {
      // Extract user question from the full prompt for cleaner logging
      const userQuestion = query.includes('User: ') ? 
        query.split('User: ').pop() : 
        query.substring(query.lastIndexOf('\n') + 1);
      
      console.log(`🔍 Querying Knowledge Graph API with user question: "${userQuestion}"`);
      
      // Store the query in Mem0 memory if available
      if (this.memoryInitialized && userId) {
        try {
          await this.addMemory(`User: ${query}`, userId);
          console.log(`📝 Stored user query in Mem0 memory for user: ${userId}`);
        } catch (memError) {
          console.warn("⚠️ Failed to store query in Mem0:", memError);
        }
      }
      
      // Prepare request body with session ID if available
      const requestBody = { 
        query,
        max_results: 10, 
        threshold: 0.3
      };
      
      // Include session ID if we have one
      if (this.currentSessionId) {
        requestBody.session_id = this.currentSessionId;
        console.log(`🔗 Using existing session ID: ${this.currentSessionId}`);
      } else {
        console.log("🆕 Starting new conversation session");
      }
      
      const response = await fetch(`${this.apiUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        console.error(`Knowledge Graph API error: ${response.status} ${response.statusText}`);
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
        } catch (e) {
          console.error("Could not read error response");
        }
        throw new Error(`Knowledge Graph API error: ${response.status}`);
      }
      
      // Get the response as text first to ensure we get the complete data
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        console.error("Failed to read response text:", e);
        throw new Error("Failed to read API response");
      }
      
      if (!responseText) {
        console.error("Empty response from Knowledge Graph API");
        throw new Error("Empty response from Knowledge Graph API");
      }
      
      console.log(`📏 Response size: ${responseText.length} characters`);
      
      // Parse the text as JSON
      try {
        const data = JSON.parse(responseText);
        console.log(`✅ Received response from Knowledge Graph API`);
        
        // Check for valid answer field
        if (!data) {
          console.error("Invalid response format, null or undefined:", data);
          throw new Error("Invalid response format from Knowledge Graph API");
        }
        
        if (typeof data !== 'object') {
          console.error("Invalid response format, not an object:", typeof data);
          throw new Error("Invalid response format, not an object");
        }
        
        if (!Object.prototype.hasOwnProperty.call(data, 'answer')) {
          console.error("Response missing 'answer' field:", Object.keys(data));
          throw new Error("Response missing answer field");
        }
        
        // Safely get the answer
        let answer = data.answer;
        
        // Ensure answer is a string
        if (answer === null || answer === undefined) {
          console.error("Answer is null or undefined");
          throw new Error("Answer is null or undefined");
        }
        
        if (typeof answer !== 'string') {
          console.warn(`⚠️ Answer is not a string but ${typeof answer}, attempting conversion`);
          
          // Try to convert to string if possible
          try {
            answer = String(answer);
          } catch (e) {
            console.error("Failed to convert answer to string:", e);
            throw new Error("Answer is not a string and couldn't be converted");
          }
          
          if (!answer) {
            console.error("Converted answer is empty");
            throw new Error("Converted answer is empty");
          }
        }
        
        // Check for answer truncation
        console.log(`📏 Answer length: ${answer.length} characters`);
        if (answer.length > 0) {
          console.log(`📏 Answer preview: ${answer.substring(0, 100)}...`);
        } else {
          console.warn("⚠️ Answer is empty");
          return "The Knowledge Graph API returned an empty response.";
        }
        
        // Save session ID for future requests if available
        if (data.query_details && data.query_details.session_id) {
          this.currentSessionId = data.query_details.session_id;
          console.log(`🔗 Saved session ID for future requests: ${this.currentSessionId}`);
        }
        
        // Format the response to highlight KG citations
        const formattedAnswer = this.formatKnowledgeGraphResponse(answer);
        
        // Store the response in Mem0 memory if available
        if (this.memoryInitialized && userId) {
          try {
            await this.addMemory(`Assistant: ${formattedAnswer}`, userId);
            console.log(`📝 Stored assistant response in Mem0 memory for user: ${userId}`);
          } catch (memError) {
            console.warn("⚠️ Failed to store response in Mem0:", memError);
          }
        }
        
        return formattedAnswer;
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.log("Response text:", responseText.substring(0, 200) + "...");
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    } catch (error) {
      console.error("❌ Error querying Knowledge Graph API:", error);
      console.log("🔄 Falling back to proxied Gemini API");
      
      // Fall back to proxied Gemini API
      return this.generateContent(query, false, userId);
    }
  }

  /**
   * Format knowledge graph response to highlight citations
   * @param {string} text - The text response
   * @returns {string} Formatted text with highlighted citations
   */
  formatKnowledgeGraphResponse(text) {
    // More robust error handling
    if (!text) {
      console.error("Invalid response text: empty or undefined");
      return "Error: Received invalid response format from Knowledge Graph API.";
    }
    
    if (typeof text !== 'string') {
      console.error("Invalid response text: not a string", typeof text);
      try {
        text = String(text);
      } catch (e) {
        return "Error: Response is not in text format.";
      }
    }
    
    try {
      console.log("Starting formatting with text length:", text.length);
      
      // SIMPLIFIED APPROACH: Fix only specific issues we've consistently seen
      
      // 1. First, normalize the markdown formatting (fix mismatched asterisks)
      // Fix inconsistent list item formatting
      let fixedText = text
        .replace(/\*([^*:]+):\*\*/g, '**$1:**')      // Fix *Header:** -> **Header:**
        .replace(/\* \*([^*:]+):\*\*/g, '* **$1:**') // Fix * *Header:** -> * **Header:**
        .replace(/\* \*References:\*\*/g, '**References:**')  // Fix * *References:** -> **References:**
        .replace(/\* \*\*References:\*\*/g, '**References:**'); // Fix * **References:** -> **References:**
      
      // 2. Fix formatting issues but preserve the actual source names
      // Only fix "Message - Untitled" references - do not replace specific standard names
      fixedText = fixedText
        .replace(/\(Source: Message - Untitled\)/g, '(Source: Knowledge Graph)');
      
      // 3. Ensure blank line before References section
      fixedText = fixedText
        .replace(/([^\n])\n\*\*References:/g, '$1\n\n**References:')
        .replace(/([^\n])\n\*\*References\*\*/g, '$1\n\n**References**');
      
      console.log("Basic formatting complete");
      
      return fixedText;
    } catch (error) {
      console.error("Error formatting response:", error);
      // Return original text if formatting fails
      return text;
    }
  }

  /**
   * Check if query mentions ISO standards and should include workflow context
   * @param {string} query - The user query
   * @returns {Array} Array of mentioned workflow IDs
   */
    getMentionedWorkflows(query) {
    console.log(`🔍 Analyzing query for workflows: "${query}"`);
    const lowercaseQuery = query.toLowerCase();
    
    // ULTRA CONSERVATIVE: Only trigger for very specific operational phrases
    const operationalPhrases = [
      'status of',
      'progress of', 
      'completion of',
      'open items',
      'open tasks',
      'evidence for',
      'audit readiness',
      'what is missing',
      'incomplete items',
      'percentage complete',
      'percent complete',
      'which sites',
      'how far are we',
      'breakdown of',
      'sites are using',
      'need attention',
      'show me all',
      'list all',
      'all frameworks',
      'all workflows'
    ];
    
    // Convert to regex patterns but be more restrictive
    const operationalPatterns = operationalPhrases.map(phrase => 
      new RegExp(phrase.replace(/\s+/g, '\\s+'), 'i')
    );
    
    let isOperationalQuery = false;
    for (let i = 0; i < operationalPatterns.length; i++) {
      const pattern = operationalPatterns[i];
      const matches = pattern.test(query.trim());
      if (matches) {
        isOperationalQuery = true;
        console.log(`✅ Operational query detected`);
        break;
      }
    }
    
    // ADDITIONAL SAFETY CHECK: Explicitly block common informational query patterns
    const informationalBlockers = [
      /^what\s+is\s+/i,
      /^what\s+are\s+/i,
      /^define\s+/i,
      /^explain\s+/i,
      /^tell\s+me\s+about\s+/i,
      /^describe\s+/i,
      /^who\s+is\s+/i,
      /^where\s+is\s+/i,
      /^when\s+is\s+/i,
      /^why\s+is\s+/i,
      /^how\s+is\s+/i
    ];
    
    const isInformationalQuery = informationalBlockers.some(pattern => pattern.test(query.trim()));
    
    if (isInformationalQuery) {
      console.log(`🚫 Informational query blocked - no workflow context`);
      return [];
    }
    
    if (!isOperationalQuery) {
      console.log(`ℹ️ Not an operational query - skipping workflow detection`);
      return [];
    }
    
    const workflows = ['taxonomy', 'eed', 'coc', 'iso14001', 'iso27001', 'iso9001', 'iso50001', 'iso14064', 'environmental'];
    
    const detectedWorkflows = workflows.filter(id => {
      // Check for ISO standards with multiple patterns
      if (id.startsWith('iso')) {
        const isoNumber = id.replace('iso', '');
        
        // Multiple detection patterns for robustness
        const patterns = [
          lowercaseQuery.includes(id), // Direct match: "iso50001"
          lowercaseQuery.includes(`iso ${isoNumber}`), // Spaced: "iso 50001"
          lowercaseQuery.includes(`iso-${isoNumber}`), // Hyphenated: "iso-50001"
          lowercaseQuery.includes(`iso${isoNumber}`), // Concatenated: "iso50001"
        ];
        
        const matched = patterns.some(p => p);
        return matched;
      }
      
      // Check for other frameworks with word boundaries
      if (id === 'taxonomy' && lowercaseQuery.match(/\btaxonomy\b/i)) return true;
      if (id === 'eed' && (lowercaseQuery.includes('energy efficiency directive') || lowercaseQuery.match(/\beed\b/i))) return true;
      if (id === 'coc' && lowercaseQuery.includes('code of conduct')) return true;
      if (id === 'environmental' && lowercaseQuery.includes('environmental permit')) return true;
      
      return false;
    });
    
    console.log(`🎯 Detected workflows:`, detectedWorkflows);
    return detectedWorkflows;
  }

  /**
   * Generate content using the proxied Gemini API
   * @param {string} prompt - The prompt text to send to Gemini
   * @param {boolean} useKnowledgeGraph - Whether to include the knowledge graph
   * @param {string} userId - Optional user ID for memory persistence
   * @returns {Promise<string>} The generated text response
   */
  async generateContent(prompt, useKnowledgeGraph = true, userId = null) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return "Error: Could not initialize the Gemini Service. Please try again later.";
      }
    }

    try {
      // Store the user query in Mem0 if available
      if (this.memoryInitialized && userId) {
        try {
          await this.addMemory(`User: ${prompt}`, userId);
          console.log(`📝 Stored user prompt in Mem0 memory for user: ${userId}`);
        } catch (memError) {
          console.warn("⚠️ Failed to store prompt in Mem0:", memError);
        }
      }
      
      // Retrieve relevant memories from Mem0 if available
      let enhancedPrompt = prompt;
      if (this.memoryInitialized && userId) {
        try {
          console.log(`🔍 Retrieving relevant memories for user: ${userId}`);
          const memories = await this.searchMemory(prompt, userId);
          
          if (memories && memories.length > 0) {
            console.log(`✅ Found relevant memories: ${memories.length} characters`);
            // Add memories as context to the prompt
            enhancedPrompt = `Previous relevant conversation:\n${memories}\n\nCurrent query: ${prompt}`;
          } else {
            console.log("ℹ️ No relevant memories found");
          }
        } catch (memError) {
          console.warn("⚠️ Failed to retrieve memories from Mem0:", memError);
        }
      }
      
      // Try Knowledge Graph first, then Gemini as fallback
      let baseResponse = "";
      let responseSource = "";
      
      if (useKnowledgeGraph) {
        try {
          console.log("📊 Attempting to use Knowledge Graph API");
          baseResponse = await this.queryKnowledgeGraph(enhancedPrompt, userId);
          responseSource = "knowledge_graph";
          console.log("✅ Knowledge Graph response received");
        } catch (kgError) {
          console.warn("⚠️ Knowledge Graph API failed, falling back to proxied Gemini:", kgError);
          responseSource = "gemini_fallback";
        }
      } else {
        responseSource = "gemini_direct";
      }
      
      // If Knowledge Graph failed or wasn't used, get Gemini response
      if (!baseResponse) {
        // Use proxied Gemini API through the backend
        console.log("🤖 Using proxied Gemini API through backend");
        console.log(`🔍 Query: "${enhancedPrompt.substring(0, 50)}..."`);
        
        const response = await fetch(`${this.apiUrl}/proxy-gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: enhancedPrompt })
        });
        
        if (!response.ok) {
          console.error(`Proxy error: ${response.status} ${response.statusText}`);
          try {
            const errorText = await response.text();
            console.error("Error response:", errorText);
          } catch (e) {
            console.error("Could not read error response");
          }
          throw new Error(`Proxy error: ${response.status}`);
        }
        
        // Get the response as text first to ensure we get the complete data
        let responseText = "";
        try {
          responseText = await response.text();
        } catch (e) {
          console.error("Failed to read response text:", e);
          throw new Error("Failed to read proxy response");
        }
        
        if (!responseText) {
          console.error("Empty response from proxy");
          throw new Error("Empty response from proxy");
        }
        
        console.log(`📏 Response size: ${responseText.length} characters`);
        
        // Parse the text as JSON
        const data = JSON.parse(responseText);
        console.log("✅ Proxied Gemini content generation complete");
        
        // Check if text field exists and is a string
        if (!data || typeof data !== 'object' || !Object.prototype.hasOwnProperty.call(data, 'text')) {
          throw new Error("Invalid response format from proxy");
        }
        
        // Safely get the text
        let text = data.text;
        if (text === null || text === undefined) {
          throw new Error("Text is null or undefined");
        }
        
        if (typeof text !== 'string') {
          console.warn(`⚠️ Text is not a string but ${typeof text}, attempting conversion`);
          text = String(text);
          if (!text) {
            throw new Error("Converted text is empty");
          }
        }
        
        baseResponse = text;
        console.log(`📏 Text length: ${text.length} characters`);
        console.log(`📏 Text preview: ${text.substring(0, 100)}...`);
      }
      
      // CRITICAL: Extract original user query first, before using it anywhere
      // Use original user prompt, not the enhanced prompt with system instructions
      let originalQuery = prompt;
      
      // Extract user query from system prompt if it contains the full prompt structure
      if (enhancedPrompt.includes('User: "') && enhancedPrompt.includes('"')) {
        const match = enhancedPrompt.match(/User: "([^"]+)"/);
        if (match) {
          originalQuery = match[1];
        }
      } else if (enhancedPrompt.includes('\n\nCurrent query: ')) {
        // Handle memory-enhanced prompts
        const parts = enhancedPrompt.split('\n\nCurrent query: ');
        if (parts.length > 1) {
          originalQuery = parts[1].trim();
        }
      } else if (enhancedPrompt.includes('\n\nUser: ')) {
        // Handle ComplianceChat format: SYSTEM_PROMPT\n\nUser: userMessage
        const parts = enhancedPrompt.split('\n\nUser: ');
        if (parts.length > 1) {
          originalQuery = parts[1].trim();
        }
      }
      
      // Additional safety check: if originalQuery looks like a system prompt, try harder to extract user query
      if (originalQuery.includes('You are Val') || originalQuery.includes('EXPERTISE DOMAINS') || originalQuery.length > 500) {
        // Try to find the actual user query in various patterns
        const userPatterns = [
          /User:\s*(.+)$/,
          /User:\s*"([^"]+)"/,
          /user:\s*(.+)$/i,
          /question:\s*(.+)$/i,
          /query:\s*(.+)$/i
        ];
        
        let extracted = false;
        for (const pattern of userPatterns) {
          const match = enhancedPrompt.match(pattern);
          if (match && match[1] && match[1].length < 200 && !match[1].includes('You are Val')) {
            originalQuery = match[1].trim();
            extracted = true;
            break;
          }
        }
        
        if (!extracted) {
          originalQuery = ''; // Default to empty to prevent false workflow detection
        }
      }
      
      // Check if we should query AstraDB for user documents
      let documentContext = "";
      if (astraDBService.isAvailable() && astraDBService.shouldQueryDocuments(originalQuery || prompt)) {
        try {
          console.log("📚 Querying AstraDB for relevant user documents...");
          const documentResults = await astraDBService.queryDocuments(originalQuery || prompt);
          
          if (documentResults && documentResults.length > 0) {
            documentContext = astraDBService.formatResultsForPrompt(documentResults);
            console.log(`✅ Retrieved ${documentResults.length} relevant documents from AstraDB`);
            
            // Enhance the base response with document context
            baseResponse = `${baseResponse}\n\n## Relevant User Documents\n\n${documentContext}`;
          } else {
            console.log("ℹ️ No relevant documents found in AstraDB");
          }
        } catch (astraError) {
          console.warn("⚠️ Failed to query AstraDB:", astraError);
        }
      }
      
      // Now add workflow context to ANY base response (Knowledge Graph OR Gemini)
      let finalResponse = baseResponse;
      
      console.log(`🔍 Query for workflow detection: "${originalQuery}"`);
      const mentionedWorkflows = this.getMentionedWorkflows(originalQuery);
      
      console.log(`📊 Workflow detection result: ${mentionedWorkflows.length} workflows found:`, mentionedWorkflows);
      
      if (mentionedWorkflows.length > 0) {
        try {
          console.log(`🔗 Adding workflow context to ${responseSource} response for: ${mentionedWorkflows.join(', ')}`);
          const workflowServiceInstance = (await import('../services/WorkflowService.js')).default;
          
          // Get workflow progress for ONLY the mentioned workflows
          console.log(`📋 Fetching data for specific workflows: ${mentionedWorkflows.join(', ')}`);
          console.log(`📋 Total workflows to fetch: ${mentionedWorkflows.length}`);
          
          const workflowData = await Promise.all(
            mentionedWorkflows.map(async (id) => {
              try {
                console.log(`⚡ Fetching data for workflow: ${id}`);
                const progress = await workflowServiceInstance.getWorkflowProgress(id, 'global');
                const details = await workflowServiceInstance.getWorkflowDetails(id, 'global');
                
                const result = {
                  id,
                  name: workflowServiceInstance.workflowNames[id],
                  progress: progress.percentage || 0,
                  incomplete: details.incompleteQuestions?.length || 0,
                  total: details.totalQuestions || 0,
                  critical: details.criticalQuestions?.length || 0
                };
                
                console.log(`✅ Got data for ${id}:`, result);
                return result;
              } catch (error) {
                console.warn(`⚠️ Failed to get workflow data for ${id}:`, error);
                console.error(`❌ Error details for ${id}:`, error);
                return null;
              }
            })
          );
          
          console.log(`📊 Raw workflow data array length: ${workflowData.length}`);
          console.log(`📊 Raw workflow data:`, workflowData);
          
          const validWorkflowData = workflowData.filter(Boolean);
          console.log(`📈 Valid workflow data count: ${validWorkflowData.length}`);
          
          if (validWorkflowData.length > 0) {
            let workflowContext = '\n\n---\n**Current Implementation Status:**\n';
            
            validWorkflowData.forEach(workflow => {
              workflowContext += `\n📊 **${workflow.name}**\n`;
              workflowContext += `   • Progress: ${workflow.progress.toFixed(1)}% complete\n`;
              workflowContext += `   • Open Questions: ${workflow.incomplete}/${workflow.total}\n`;
              if (workflow.critical > 0) {
                workflowContext += `   • Critical Items: ${workflow.critical} requiring attention\n`;
              }
            });
            
            workflowContext += `\n*This data reflects your current implementation progress. Response powered by ${responseSource === 'knowledge_graph' ? 'Knowledge Graph + Workflow APIs' : 'Gemini AI + Workflow APIs'}.*`;
            
            finalResponse += workflowContext;
            console.log(`✅ Added workflow context for ${validWorkflowData.length} framework(s) to ${responseSource} response`);
                  } else {
          console.log(`⚠️ No valid workflow data found for mentioned workflows: ${mentionedWorkflows.join(', ')}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to add workflow context:', error);
        // Continue without workflow context
      }
          } else {
        console.log(`ℹ️ No workflows mentioned - skipping workflow context`);
      }
      
      // Store the response in Mem0 memory if available
      if (this.memoryInitialized && userId) {
        try {
          await this.addMemory(`Assistant: ${finalResponse}`, userId);
          console.log(`📝 Stored assistant response in Mem0 memory for user: ${userId}`);
        } catch (memError) {
          console.warn("⚠️ Failed to store response in Mem0:", memError);
        }
      }
      
      return finalResponse;
      
    } catch (error) {
      console.error("Error generating content:", error);
      return `Error accessing AI services: ${error.message}`;
    }
  }

  /**
   * Generate content with file data
   * @param {string} prompt - The text prompt
   * @param {Array} fileData - Array of file data objects with mimeType and data properties
   * @param {boolean} useKnowledgeGraph - Whether to include the knowledge graph
   * @param {string} userId - Optional user ID for memory persistence
   * @returns {Promise<string>} The generated text response
   */
  async generateContentWithFiles(prompt, fileData = [], useKnowledgeGraph = true, userId = null) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return "Error: Could not initialize the Gemini Service. Please try again later.";
      }
    }

    try {
      // Store the user query in Mem0 if available
      if (this.memoryInitialized && userId) {
        try {
          const fileNames = fileData.map(f => f.mimeType.split('/')[1]).join(', ');
          await this.addMemory(`User: ${prompt} [with ${fileData.length} files: ${fileNames}]`, userId);
          console.log(`📝 Stored user prompt with files in Mem0 memory for user: ${userId}`);
        } catch (memError) {
          console.warn("⚠️ Failed to store prompt in Mem0:", memError);
        }
      }
      
      // Retrieve relevant memories from Mem0 if available
      let enhancedPrompt = prompt;
      if (this.memoryInitialized && userId) {
        try {
          console.log(`🔍 Retrieving relevant memories for user: ${userId}`);
          const memories = await this.searchMemory(prompt, userId);
          
          if (memories && memories.length > 0) {
            console.log(`✅ Found relevant memories: ${memories.length} characters`);
            // Add memories as context to the prompt
            enhancedPrompt = `Previous relevant conversation:\n${memories}\n\nCurrent query: ${prompt}`;
          } else {
            console.log("ℹ️ No relevant memories found");
          }
        } catch (memError) {
          console.warn("⚠️ Failed to retrieve memories from Mem0:", memError);
        }
      }
      
      // If knowledge graph is requested and no files, try to use it first
      if (useKnowledgeGraph && !fileData.length) {
        try {
          console.log("📊 Attempting to use Knowledge Graph API for file-less query");
          return await this.queryKnowledgeGraph(enhancedPrompt, userId);
        } catch (kgError) {
          console.warn("⚠️ Knowledge Graph API failed, continuing with proxied Gemini:", kgError);
        }
      }

      // For now, we'll just send the prompt without files to the proxy
      // File handling would require additional backend support
      console.log(`🔄 Using proxied Gemini with ${fileData.length} files (note: files not fully supported yet)`);
      
      const response = await fetch(`${this.apiUrl}/proxy-gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enhancedPrompt })
      });
      
      if (!response.ok) {
        console.error(`Proxy error: ${response.status} ${response.statusText}`);
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
        } catch (e) {
          console.error("Could not read error response");
        }
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      // Get the response as text first to ensure we get the complete data
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        console.error("Failed to read response text:", e);
        throw new Error("Failed to read proxy response");
      }
      
      if (!responseText) {
        throw new Error("Empty response from proxy");
      }
      
      console.log(`📏 Response size: ${responseText.length} characters`);
      
      // Parse the text as JSON with better error handling
      try {
        const data = JSON.parse(responseText);
        console.log("✅ Proxied Gemini content generation complete");
        
        // Check if text field exists and is a string
        if (!data || !data.text) {
          throw new Error("Response missing text field");
        }
        
        if (typeof data.text !== 'string') {
          // Try to convert to string
          try {
            data.text = String(data.text || '');
          } catch (e) {
            throw new Error("Text field could not be converted to string");
          }
          
          if (!data.text) {
            throw new Error("Text field is empty after conversion");
          }
        }
        
        // Check if we should query AstraDB for user documents
        let finalResponse = data.text;
        if (astraDBService.isAvailable() && astraDBService.shouldQueryDocuments(enhancedPrompt)) {
          try {
            console.log("📚 Querying AstraDB for relevant user documents (with files)...");
            const documentResults = await astraDBService.queryDocuments(enhancedPrompt);
            
            if (documentResults && documentResults.length > 0) {
              const documentContext = astraDBService.formatResultsForPrompt(documentResults);
              console.log(`✅ Retrieved ${documentResults.length} relevant documents from AstraDB (with files)`);
              
              // Enhance the response with document context
              finalResponse = `${data.text}\n\n## Relevant User Documents\n\n${documentContext}`;
            } else {
              console.log("ℹ️ No relevant documents found in AstraDB (with files)");
            }
          } catch (astraError) {
            console.warn("⚠️ Failed to query AstraDB (with files):", astraError);
          }
        }
        
        // Store the response in Mem0 memory if available
        if (this.memoryInitialized && userId) {
          try {
            await this.addMemory(`Assistant: ${finalResponse}`, userId);
            console.log(`📝 Stored assistant response in Mem0 memory for user: ${userId}`);
          } catch (memError) {
            console.warn("⚠️ Failed to store response in Mem0:", memError);
          }
        }
        
        return finalResponse;
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.log("Response text:", responseText.substring(0, 200) + "...");
        throw new Error("Invalid JSON response from Gemini API");
      }
    } catch (error) {
      console.error("Error generating content with files:", error);
      return `Error with file processing: ${error.message}`;
    }
  }

  /**
   * Get all memories for a user
   * @param {string} userId - The user ID to get memories for
   * @returns {Promise<Array>} Array of memories or empty array if not available
   */
  async getUserMemories(userId) {
    if (!this.memoryInitialized || !userId) {
      console.warn("Cannot get memories: Mem0 not initialized or no userId provided");
      return [];
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/memory/all/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📚 Retrieved memories for user: ${userId}`);
        return data.memories || [];
      } else {
        console.error(`Failed to get memories: ${response.status} ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.error("Error getting user memories:", error);
      return [];
    }
  }

  /**
   * Check if the API service is available
   * @returns {boolean} True if the service is initialized
   */
  isAvailable() {
    return this.isInitialized;
  }
  
  /**
   * Check if memory service is available
   * @returns {boolean} True if memory is initialized
   */
  isMemoryAvailable() {
    return this.memoryInitialized;
  }
  
  /**
   * Get the current session ID
   * @returns {string|null} Current session ID or null if no active session
   */
  getSessionId() {
    return this.currentSessionId;
  }
  
  /**
   * Enable or disable debug mode
   * @param {boolean} enable Whether to enable debug mode
   */
  setDebugMode(enable = true) {
    this.debug = enable;
    console.log(`${enable ? '🐛 Enabled' : '🔄 Disabled'} debug mode`);
  }

  /**
   * Check if user query is asking about workflows
   * @param {string} query - User's query
   * @returns {boolean} True if query appears to be workflow-related
   */
  isWorkflowQuery(query) {
    const lowercaseQuery = query.toLowerCase();
    
    // ONLY workflow-specific operational queries should be routed to workflow system
    const workflowSpecificKeywords = [
      'progress', 'percent', 'percentage', 'completion', 'completed',
      'open items', 'incomplete', 'tasks', 'audit readiness',
      'site breakdown', 'regional breakdown', 'evidence required',
      'need attention', 'require attention', 'status',
      'which sites use', 'sites use', 'which sites', 'site adoption'
    ];
    
    // General informational queries should use Gemini + Knowledge Graph
    const informationalKeywords = [
      'tell me about', 'what is', 'explain', 'describe', 'more about',
      'information about', 'details about', 'what are', 'how does',
      'what does', 'definition', 'overview of'
    ];
    
    // Check if it's clearly an informational query (should NOT go to workflow)
    const isInformational = informationalKeywords.some(keyword => lowercaseQuery.includes(keyword));
    if (isInformational) {
      return false; // Route to general Gemini + Knowledge Graph
    }
    
    // Check for explicit workflow operations
    const hasWorkflowOperation = workflowSpecificKeywords.some(keyword => lowercaseQuery.includes(keyword));
    
    // Check for workflow context (all workflows, show workflows, etc.)
    const hasWorkflowContext = lowercaseQuery.includes('all workflows') || 
                              lowercaseQuery.includes('all frameworks') ||
                              lowercaseQuery.includes('show me all') ||
                              lowercaseQuery.includes('workflows that');
    
    return hasWorkflowOperation || hasWorkflowContext;
  }

  /**
   * AI-powered query analysis for natural language understanding
   * @param {string} query - User's natural language query
   * @returns {Promise<Object>} Parsed query with intent and entities
   */
  async analyzeQueryWithAI(query) {
    try {
      const analysisPrompt = `
Analyze this user query about compliance workflows and extract structured information.

Available Workflows:
- EU Taxonomy (taxonomy)
- Energy Efficiency Directive (eed) 
- EU Code of Conduct (coc)
- ISO 14001 Environmental Management (iso14001)
- ISO 27001 Information Security (iso27001)
- ISO 9001 Quality Management (iso9001)
- ISO 50001 Energy Management (iso50001)
- ISO 14064 Greenhouse Gas Management (iso14064)
- Environmental Permits (environmental)

Available Sites:
- All Sites, Global Corporate, Sao Paulo 1, Rio 1

Query Types:
- progress: asking about completion percentages
- open_items: asking about incomplete tasks/questions (includes "need attention", "require attention")
- site_breakdown: asking which sites use frameworks
- site_specific_details: asking about specific site performance
- evidence: asking about required documentation
- audit_readiness: asking about audit preparation
- regional: asking about regional analysis or breakdown
- analysis: asking for detailed breakdown
- overview: asking for general summary

Important Guidelines:
- If asking about "all workflows", "all frameworks", or no specific workflow mentioned, leave workflows array EMPTY
- If asking about "all sites" or no specific site mentioned, leave sites array EMPTY
- "Need attention" = incomplete/open items
- "Regional breakdown" = regional analysis
- Empty arrays indicate "apply to all" rather than "none specified"

User Query: "${query}"

Respond with ONLY a JSON object in this exact format:
{
  "queryType": "one of the types above",
  "workflows": ["array of workflow IDs mentioned, or EMPTY for all workflows"],
  "sites": ["array of site names mentioned, or EMPTY for all sites"],
  "confidence": 0.9,
  "reasoning": "brief explanation of why this interpretation"
}`;

      const response = await fetch(`${this.apiUrl}/proxy-gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: analysisPrompt })
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      
      // Extract the JSON from the AI response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiAnalysis = JSON.parse(jsonMatch[0]);
        console.log('🤖 AI Query Analysis:', aiAnalysis);
        return aiAnalysis;
      } else {
        throw new Error('No valid JSON in AI response');
      }
    } catch (error) {
      console.log('⚠️ AI analysis failed, using fallback:', error.message);
      return null; // Will trigger fallback to keyword-based parsing
    }
  }

  /**
   * Process workflow-specific queries with AI-powered understanding
   * @param {string} query - User's workflow query
   * @returns {Promise<string>} Formatted workflow response
   */
  async processWorkflowQuery(query) {
    try {
      // Import the workflowService instance (not class) to ensure user profile is available
      const workflowServiceInstance = (await import('../services/WorkflowService.js')).default;
      
      // Try AI-powered analysis first
      let parsedQuery = await this.analyzeQueryWithAI(query);
      
      // If AI analysis fails or has low confidence, fall back to keyword-based parsing
      if (!parsedQuery || parsedQuery.confidence < 0.6) {
        console.log('🔄 Using fallback keyword-based parsing');
        parsedQuery = workflowServiceInstance.parseWorkflowQuery(query);
        parsedQuery.source = 'keyword-based';
        parsedQuery.keywordReasoning = parsedQuery.reasoning;
      } else {
        console.log('✨ Using AI-powered query understanding');
        // Transform AI analysis to match expected format
        parsedQuery = {
          queryType: parsedQuery.queryType,
          mentionedWorkflows: parsedQuery.workflows || [],
          mentionedSites: parsedQuery.sites?.map(siteName => ({ name: siteName })) || [],
          mentionedRegions: [],
          responseFormat: 'summary',
          isSiteSpecific: parsedQuery.sites && parsedQuery.sites.length > 0,
          isRegionalQuery: parsedQuery.queryType === 'regional',
          originalQuery: query,
          source: 'ai-powered',
          aiReasoning: parsedQuery.reasoning
        };
      }
      
      let workflowData;
      let response;
      
      // Define all 9 frameworks for comprehensive queries
      const allWorkflows = ['taxonomy', 'eed', 'coc', 'iso14001', 'iso27001', 'iso9001', 'iso50001', 'iso14064', 'environmental'];
      
      switch (parsedQuery.queryType) {
        case 'progress':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            if (parsedQuery.isSiteSpecific) {
              // Get site-specific progress
              const siteData = await Promise.all(
                parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowSiteBreakdown(id))
              );
              response = this.formatSiteProgressResponse(siteData);
            } else {
              // Get progress for specific workflows
              const progressData = await Promise.all(
                parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowProgress(id, 'global'))
              );
              response = this.formatProgressResponse(progressData);
            }
          } else {
            // Get all workflow progress
            const allProgress = await workflowServiceInstance.getAllWorkflowsOverview('global');
            response = this.formatAllProgressResponse(allProgress);
          }
          break;
          
        case 'site_breakdown':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            const siteData = await Promise.all(
              parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowSiteBreakdown(id))
            );
            response = this.formatSiteBreakdownResponse(siteData);
          } else {
            // Show site breakdown for all frameworks when no specific ones mentioned
            const allSiteData = await Promise.all(
              allWorkflows.map(id => workflowServiceInstance.getWorkflowSiteBreakdown(id))
            );
            response = this.formatAllFrameworksSiteResponse(allSiteData);
          }
          break;
          
        case 'all_frameworks_sites':
          // Show site breakdown for all 9 frameworks
          const allSiteData = await Promise.all(
            allWorkflows.map(id => workflowServiceInstance.getWorkflowSiteBreakdown(id))
          );
          response = this.formatAllFrameworksSiteResponse(allSiteData);
          break;
          
        case 'all_frameworks_regional':
          // Show regional breakdown for all 9 frameworks
          const allRegionalData = await Promise.all(
            allWorkflows.map(id => workflowServiceInstance.getWorkflowRegionalBreakdown(id))
          );
          response = this.formatAllFrameworksRegionalResponse(allRegionalData);
          break;
          
        case 'all_frameworks_overview':
          // Show overview of all 9 frameworks with site adoption
          const allOverviewData = await Promise.all(
            allWorkflows.map(id => workflowServiceInstance.getWorkflowSiteBreakdown(id))
          );
          response = this.formatAllFrameworksOverviewResponse(allOverviewData);
          break;
          
        case 'analysis':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            const analysisData = await Promise.all(
              parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowAnalysis(id))
            );
            response = this.formatWorkflowAnalysisResponse(analysisData);
          } else {
            response = "Please specify which workflow you'd like detailed analysis for (e.g., 'ISO 9001 detailed analysis')";
          }
          break;
          
        case 'regional':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            const regionalData = await Promise.all(
              parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowRegionalBreakdown(id))
            );
            response = this.formatRegionalBreakdownResponse(regionalData);
          } else {
            // Show regional breakdown for all frameworks when no specific ones mentioned
            const allRegionalData = await Promise.all(
              allWorkflows.map(id => workflowServiceInstance.getWorkflowRegionalBreakdown(id))
            );
            response = this.formatAllFrameworksRegionalResponse(allRegionalData);
          }
          break;
          
        case 'open_items':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            // Get open items for specific workflows mentioned, including site breakdown
            const workflowOpenItems = await Promise.all(
              parsedQuery.mentionedWorkflows.map(async (id) => {
                const [details, siteBreakdown] = await Promise.all([
                  workflowServiceInstance.getWorkflowDetails(id, 'global'),
                  workflowServiceInstance.getWorkflowSiteBreakdown(id)
                ]);
                return {
                  workflowId: id,
                  workflowName: workflowServiceInstance.workflowNames[id],
                  siteBreakdown,
                  ...details
                };
              })
            );
            response = this.formatWorkflowSpecificOpenItems(workflowOpenItems);
          } else {
            // Get all open items if no specific workflows mentioned
            workflowData = await workflowServiceInstance.getOpenItems('global');
            response = this.formatOpenItemsResponse(workflowData);
          }
          break;
          
        case 'evidence':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            const evidenceData = await Promise.all(
              parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowDetails(id, 'global'))
            );
            response = this.formatEvidenceResponse(evidenceData);
          } else {
            const openItems = await workflowServiceInstance.getOpenItems('global');
            response = this.formatAllEvidenceResponse(openItems);
          }
          break;
          
        case 'audit_readiness':
          if (parsedQuery.mentionedWorkflows.length > 0) {
            const auditData = await Promise.all(
              parsedQuery.mentionedWorkflows.map(id => workflowServiceInstance.getWorkflowAuditReadiness(id))
            );
            response = this.formatAuditReadinessResponse(auditData);
          } else {
            const allWorkflows = await workflowServiceInstance.getAllWorkflowsOverview('global');
            response = this.formatAllAuditReadinessResponse(allWorkflows);
          }
          break;
          
        case 'overview':
          workflowData = await workflowServiceInstance.getAllWorkflowsOverview('global');
          response = this.formatOverviewResponse(workflowData);
          break;
          
        case 'status':
          const statusType = query.toLowerCase().includes('incomplete') ? 'incomplete' :
                           query.toLowerCase().includes('complete') ? 'complete' : 'in-progress';
          workflowData = await workflowServiceInstance.getWorkflowsByStatus(statusType, 'global');
          response = this.formatStatusResponse(workflowData, statusType);
          break;
          
        case 'site_specific_details':
          if (parsedQuery.mentionedSites.length > 0) {
            // Get details for all workflows for the mentioned site(s)
            const siteDetailsData = await Promise.all(
              allWorkflows.map(async (workflowId) => {
                const siteBreakdown = await workflowServiceInstance.getWorkflowSiteBreakdown(workflowId);
                const siteName = parsedQuery.mentionedSites[0].name.toLowerCase();
                
                // Find the specific site in the breakdown
                const siteInfo = siteBreakdown.sites?.find(site => 
                  site.siteName.toLowerCase().includes(siteName) || 
                  siteName.includes(site.siteName.toLowerCase())
                );
                
                return {
                  workflowId,
                  workflowName: workflowServiceInstance.workflowNames[workflowId],
                  siteInfo,
                  isActive: siteInfo && siteInfo.percentage > 0
                };
              })
            );
            response = this.formatSiteSpecificDetails(siteDetailsData, parsedQuery.mentionedSites[0].name);
          } else {
            // Handle general site-specific requests - show all sites breakdown
            const allSiteBreakdowns = await Promise.all(
              allWorkflows.map(id => workflowServiceInstance.getWorkflowSiteBreakdown(id))
            );
            response = this.formatAllSitesDetailsBreakdown(allSiteBreakdowns);
          }
          break;
          
        default:
          // Try to understand the query with general workflow data
          const generalData = await workflowServiceInstance.getAllWorkflowsOverview('global');
          response = `Here's an overview of all workflows:\n\n${this.formatOverviewResponse(generalData)}\n\nFor specific information, you can ask about:\n- Progress percentages\n- Open items requiring attention\n- Required evidence\n- Audit readiness status`;
      }
      
      // Add query interpretation info for transparency
      const interpretationInfo = parsedQuery.source === 'ai-powered' 
        ? `\n\n---\n*🤖 Query understood using AI: ${parsedQuery.aiReasoning}*`
        : `\n\n---\n*🔍 Query understood using keyword matching: ${parsedQuery.keywordReasoning}*`;
      
      return response + interpretationInfo;
      
    } catch (error) {
      console.error('Error processing workflow query:', error);
      return "I encountered an error while retrieving workflow information. Please try your request again or contact support if the issue persists.";
    }
  }

  /**
   * Format progress response for specific workflows
   */
  formatProgressResponse(progressData) {
    if (progressData.length === 1) {
      const workflow = progressData[0];
      if (workflow.error) {
        return `Unable to retrieve progress for ${workflow.workflowName}: ${workflow.error}`;
      }
      return `**${workflow.workflowName} Progress**: ${workflow.percentage}% complete\n- Completed Steps: ${workflow.completedSteps}/${workflow.totalSteps}\n- Last Updated: ${workflow.lastUpdated || 'Not available'}`;
    } else {
      let response = "**Workflow Progress Summary:**\n\n";
      progressData.forEach(workflow => {
        if (!workflow.error) {
          response += `• **${workflow.workflowName}**: ${workflow.percentage}% (${workflow.completedSteps}/${workflow.totalSteps} steps)\n`;
        }
      });
      return response;
    }
  }

  /**
   * Format response for all workflow progress
   */
  formatAllProgressResponse(allProgress) {
    let response = "**All Workflows Progress Overview:**\n\n";
    
    const completed = allProgress.filter(w => w.percentage === 100);
    const inProgress = allProgress.filter(w => w.percentage > 0 && w.percentage < 100);
    const notStarted = allProgress.filter(w => w.percentage === 0);
    
    if (completed.length > 0) {
      response += `**✅ Completed (${completed.length}):**\n`;
      completed.forEach(w => response += `• ${w.workflowName}: 100%\n`);
      response += "\n";
    }
    
    if (inProgress.length > 0) {
      response += `**🔄 In Progress (${inProgress.length}):**\n`;
      inProgress.forEach(w => response += `• ${w.workflowName}: ${w.percentage}%\n`);
      response += "\n";
    }
    
    if (notStarted.length > 0) {
      response += `**⏳ Not Started (${notStarted.length}):**\n`;
      notStarted.forEach(w => response += `• ${w.workflowName}: 0%\n`);
    }
    
    return response;
  }

  /**
   * Format open items response
   */
  formatOpenItemsResponse(openItems) {
    if (openItems.error) {
      return `Unable to retrieve open items: ${openItems.error}`;
    }
    
    let response = `**Open Items Summary**\n\nTotal incomplete questions: **${openItems.total}**\n\n`;
    
    openItems.byWorkflow.forEach(workflow => {
      if (workflow.incompleteCount > 0) {
        response += `**${workflow.workflowName}:**\n`;
        response += `• Incomplete questions: ${workflow.incompleteCount}\n`;
        response += `• Critical questions: ${workflow.criticalCount}\n`;
        response += `• Evidence items needed: ${workflow.evidenceCount}\n\n`;
      }
    });
    
    if (openItems.criticalQuestions.length > 0) {
      response += `**Critical Questions Requiring Attention:**\n`;
      openItems.criticalQuestions.slice(0, 5).forEach(q => {
        response += `• ${q.text} (${q.step})\n`;
      });
      if (openItems.criticalQuestions.length > 5) {
        response += `• ...and ${openItems.criticalQuestions.length - 5} more\n`;
      }
    }
    
    return response;
  }

  /**
   * Format workflow-specific open items response
   */
  formatWorkflowSpecificOpenItems(workflowOpenItems) {
    if (workflowOpenItems.length === 1) {
      const workflow = workflowOpenItems[0];
      if (workflow.error) {
        return `Unable to retrieve open items for ${workflow.workflowName}: ${workflow.error}`;
      }
      
      let response = `**${workflow.workflowName} - Open Items**\n\n`;
      
      // Show incomplete questions count
      const incompleteCount = workflow.incompleteQuestions?.length || 0;
      const criticalCount = workflow.criticalQuestions?.length || 0;
      const evidenceCount = workflow.requiredEvidence?.length || 0;
      
      response += `**Summary:**\n`;
      response += `• Incomplete questions: ${incompleteCount}\n`;
      response += `• Critical questions: ${criticalCount}\n`;
      response += `• Evidence items needed: ${evidenceCount}\n`;
      
      // Add site implementation status
      if (workflow.siteBreakdown && !workflow.siteBreakdown.error) {
        response += `• Sites implementing: ${workflow.siteBreakdown.activeSites}/${workflow.siteBreakdown.totalSites} (${workflow.siteBreakdown.averageProgress}% avg progress)\n`;
      }
      response += '\n';
      
      // Show top incomplete questions
      if (workflow.incompleteQuestions && workflow.incompleteQuestions.length > 0) {
        response += `**Incomplete Questions** (${incompleteCount}):\n`;
        workflow.incompleteQuestions.slice(0, 8).forEach(q => {
          response += `• ${q.text}\n`;
        });
        if (incompleteCount > 8) {
          response += `• ...and ${incompleteCount - 8} more questions\n`;
        }
        response += '\n';
      }
      
      // Show critical questions if any
      if (workflow.criticalQuestions && workflow.criticalQuestions.length > 0) {
        response += `**Critical Questions Requiring Immediate Attention** (${criticalCount}):\n`;
        workflow.criticalQuestions.slice(0, 5).forEach(q => {
          response += `• ${q.text} (${q.step})\n`;
        });
        if (criticalCount > 5) {
          response += `• ...and ${criticalCount - 5} more critical items\n`;
        }
        response += '\n';
      }
      
      // Show required evidence
      if (workflow.requiredEvidence && workflow.requiredEvidence.length > 0) {
        response += `**Required Evidence** (${evidenceCount}):\n`;
        workflow.requiredEvidence.slice(0, 5).forEach(evidence => {
          response += `• ${evidence.documentType}\n`;
        });
        if (evidenceCount > 5) {
          response += `• ...and ${evidenceCount - 5} more evidence items\n`;
        }
        response += '\n';
      }
      
      // Show site breakdown if available
      if (workflow.siteBreakdown && !workflow.siteBreakdown.error && workflow.siteBreakdown.sites) {
        const activeSites = workflow.siteBreakdown.sites.filter(s => s.percentage > 0);
        const inactiveSites = workflow.siteBreakdown.sites.filter(s => s.percentage === 0);
        
        if (activeSites.length > 0) {
          response += `**Site Implementation Status:**\n`;
          activeSites.forEach(site => {
            const status = site.percentage >= 80 ? "EXCELLENT" :
                          site.percentage >= 60 ? "GOOD" :
                          site.percentage >= 40 ? "NEEDS WORK" : "BEHIND";
            response += `• ${site.siteName}: ${site.percentage}% (${status})\n`;
          });
          
          if (inactiveSites.length > 0) {
            response += `\n**Not Implementing** (${inactiveSites.length}): `;
            response += inactiveSites.map(s => s.siteName).join(', ') + '\n';
          }
        }
      }
      
      return response;
    } else {
      // Multiple workflows
      let response = "**Open Items for Multiple Workflows:**\n\n";
      workflowOpenItems.forEach(workflow => {
        if (!workflow.error) {
          const incompleteCount = workflow.incompleteQuestions?.length || 0;
          const criticalCount = workflow.criticalQuestions?.length || 0;
          
          response += `**${workflow.workflowName}:**\n`;
          response += `• Incomplete: ${incompleteCount} questions\n`;
          response += `• Critical: ${criticalCount} items\n\n`;
        }
      });
      return response;
    }
  }

  /**
   * Format evidence response
   */
  formatEvidenceResponse(evidenceData) {
    let response = "**Required Evidence Summary:**\n\n";
    
    evidenceData.forEach(workflow => {
      if (!workflow.error && workflow.requiredEvidence.length > 0) {
        response += `**${workflow.workflowName}:**\n`;
        workflow.requiredEvidence.slice(0, 3).forEach(evidence => {
          response += `• ${evidence.documentType}\n`;
          if (evidence.evidenceItems.length > 0) {
            response += `  - Items: ${evidence.evidenceItems.slice(0, 2).join(', ')}\n`;
          }
        });
        if (workflow.requiredEvidence.length > 3) {
          response += `  ...and ${workflow.requiredEvidence.length - 3} more evidence items\n`;
        }
        response += "\n";
      }
    });
    
    return response;
  }

  /**
   * Format audit readiness response
   */
  formatAuditReadinessResponse(auditData) {
    let response = "**Audit Readiness Summary:**\n\n";
    
    auditData.forEach(workflow => {
      if (!workflow.error) {
        response += `**${workflow.workflowName}:**\n`;
        response += `• Readiness Score: ${workflow.readiness.toFixed(1)}%\n`;
        response += `• Coverage: ${workflow.coverage.toFixed(1)}%\n`;
        response += `• Conformant Questions: ${workflow.conformantCount}/${workflow.totalQuestions}\n\n`;
      }
    });
    
    return response;
  }

  /**
   * Format overview response
   */
  formatOverviewResponse(workflowData) {
    let response = "**Compliance Workflows Overview**\n\n";
    
    workflowData.forEach(workflow => {
      if (!workflow.error) {
        const status = workflow.percentage === 100 ? "COMPLETE" : 
                     workflow.percentage >= 50 ? "IN PROGRESS" : "STARTED";
        response += `**${workflow.workflowName}**\n`;
        response += `   Progress: ${workflow.percentage}% | Audit Ready: ${workflow.auditReadiness?.toFixed(1) || 'N/A'}% | Status: ${status}\n\n`;
      }
    });
    
    return response;
  }

  /**
   * Format status response
   */
  formatStatusResponse(workflowData, statusType) {
    let response = `**${statusType.charAt(0).toUpperCase() + statusType.slice(1)} Workflows:**\n\n`;
    
    if (workflowData.length === 0) {
      response += `No workflows are currently ${statusType}.`;
    } else {
      workflowData.forEach(workflow => {
        response += `• **${workflow.workflowName}**: ${workflow.percentage}%\n`;
      });
    }
    
    return response;
  }

  /**
   * Format all evidence response
   */
  formatAllEvidenceResponse(openItems) {
    if (openItems.error) {
      return `Unable to retrieve evidence requirements: ${openItems.error}`;
    }
    
    let response = "**All Required Evidence:**\n\n";
    
    if (openItems.requiredEvidence.length === 0) {
      response += "No outstanding evidence requirements found.";
    } else {
      // Group by workflow
      const groupedEvidence = {};
      openItems.requiredEvidence.forEach(evidence => {
        // Find workflow name by searching the byWorkflow array
        const workflowInfo = openItems.byWorkflow.find(w => 
          evidence.questionText && evidence.questionText.length > 0
        );
        const workflowName = workflowInfo ? workflowInfo.workflowName : 'Unknown Workflow';
        
        if (!groupedEvidence[workflowName]) {
          groupedEvidence[workflowName] = [];
        }
        groupedEvidence[workflowName].push(evidence);
      });
      
      Object.entries(groupedEvidence).forEach(([workflowName, evidenceList]) => {
        response += `**${workflowName}:**\n`;
        evidenceList.slice(0, 3).forEach(evidence => {
          response += `• ${evidence.documentType}\n`;
        });
        if (evidenceList.length > 3) {
          response += `  ...and ${evidenceList.length - 3} more items\n`;
        }
        response += "\n";
      });
    }
    
    return response;
  }

  /**
   * Format all audit readiness response
   */
  formatAllAuditReadinessResponse(allWorkflows) {
    let response = "**Audit Readiness Overview**\n\n";
    
    // Sort by readiness score
    const sortedWorkflows = allWorkflows
      .filter(w => !w.error && w.auditReadiness !== undefined)
      .sort((a, b) => (b.auditReadiness || 0) - (a.auditReadiness || 0));
    
    sortedWorkflows.forEach(workflow => {
      const readinessLevel = workflow.auditReadiness >= 80 ? "READY" :
                            workflow.auditReadiness >= 60 ? "PARTIAL" : "NOT READY";
      response += `**${workflow.workflowName}**: ${workflow.auditReadiness?.toFixed(1) || 'N/A'}% (${readinessLevel})\n`;
    });
    
    return response;
  }

  /**
   * Format site-specific progress response
   */
  formatSiteProgressResponse(siteDataArray) {
    if (siteDataArray.length === 1) {
      const siteData = siteDataArray[0];
      if (siteData.error) {
        return `Unable to retrieve site breakdown for ${siteData.workflowName}: ${siteData.error}`;
      }
      
      let response = `**${siteData.workflowName} - Site Progress Breakdown:**\n\n`;
      response += `📊 **Summary**: ${siteData.activeSites}/${siteData.totalSites} sites active | Average: ${siteData.averageProgress}%\n\n`;
      
      if (siteData.sites && siteData.sites.length > 0) {
        response += "**Site Details:**\n";
        siteData.sites
          .sort((a, b) => b.percentage - a.percentage)
          .forEach(site => {
            const statusIcon = site.percentage >= 80 ? "🟢" :
                             site.percentage >= 50 ? "🟡" : 
                             site.percentage > 0 ? "🔴" : "⚪";
            response += `${statusIcon} **${site.siteName}**: ${site.percentage}%\n`;
          });
      } else {
        response += "No active sites found for this workflow.";
      }
      
      return response;
    } else {
      let response = "**Multi-Workflow Site Progress:**\n\n";
      siteDataArray.forEach(siteData => {
        if (!siteData.error) {
          response += `**${siteData.workflowName}**: ${siteData.activeSites}/${siteData.totalSites} sites (Avg: ${siteData.averageProgress}%)\n`;
        }
      });
      return response;
    }
  }

  /**
   * Format site breakdown response
   */
  formatSiteBreakdownResponse(siteDataArray) {
    if (siteDataArray.length === 1) {
      const siteData = siteDataArray[0];
      if (siteData.error) {
        return `Unable to retrieve site breakdown for ${siteData.workflowName}: ${siteData.error}`;
      }
      
      let response = `**${siteData.workflowName} - Site Implementation Status**\n\n`;
      
      if (siteData.sites && siteData.sites.length > 0) {
        const activeSites = siteData.sites.filter(s => s.percentage > 0);
        const inactiveSites = siteData.sites.filter(s => s.percentage === 0);
        
        response += `**Active Sites** (${activeSites.length}):\n`;
        activeSites
          .sort((a, b) => b.percentage - a.percentage)
          .forEach(site => {
            response += `• ${site.siteName}: ${site.percentage}%\n`;
          });
        
        if (inactiveSites.length > 0) {
          response += `\n**Not Implemented** (${inactiveSites.length}): `;
          response += inactiveSites.map(s => s.siteName).join(', ') + '\n';
        }
        
        response += `\n**Overall Adoption**: ${siteData.activeSites}/${siteData.totalSites} sites (${Math.round(siteData.activeSites/siteData.totalSites*100)}%)`;
      } else {
        response += "No sites are currently using this workflow.";
      }
      
      return response;
    } else {
      return this.formatSiteProgressResponse(siteDataArray);
    }
  }

  /**
   * Format workflow analysis response
   */
  formatWorkflowAnalysisResponse(analysisDataArray) {
    if (analysisDataArray.length === 1) {
      const analysis = analysisDataArray[0];
      if (analysis.error) {
        return `Unable to retrieve analysis for ${analysis.workflowName}: ${analysis.error}`;
      }
      
      let response = `**📊 ${analysis.workflowName} - Deep Dive Analysis**\n\n`;
      
      // Summary section
      response += `**🎯 Executive Summary:**\n`;
      response += `• **Sites Using**: ${analysis.summary.activeSites}/${analysis.summary.totalSites} (${Math.round(analysis.summary.activeSites/analysis.summary.totalSites*100)}% adoption)\n`;
      response += `• **Average Progress**: ${analysis.summary.averageProgress}%\n`;
      response += `• **Questions Status**: ${analysis.summary.totalQuestions - analysis.summary.incompleteQuestions}/${analysis.summary.totalQuestions} completed\n`;
      response += `• **Audit Readiness**: ${analysis.summary.auditReadinessScore.toFixed(1)}%\n`;
      if (analysis.summary.criticalQuestions > 0) {
        response += `• **🔴 Critical Items**: ${analysis.summary.criticalQuestions} requiring attention\n`;
      }
      
      // Site breakdown
      if (analysis.siteBreakdown && analysis.siteBreakdown.sites && analysis.siteBreakdown.sites.length > 0) {
        response += `\n**🏢 Site Performance:**\n`;
        const topSites = analysis.siteBreakdown.sites
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);
        
        topSites.forEach(site => {
          const status = site.percentage >= 80 ? "🟢 Excellent" :
                        site.percentage >= 60 ? "🟡 Good" :
                        site.percentage >= 40 ? "🟠 Needs Work" : "🔴 Critical";
          response += `• **${site.siteName}**: ${site.percentage}% (${status})\n`;
        });
        
        if (analysis.siteBreakdown.sites.length > 5) {
          response += `• ...and ${analysis.siteBreakdown.sites.length - 5} more sites\n`;
        }
      }
      
      // Key issues
      if (analysis.globalDetails && analysis.globalDetails.incompleteQuestions && analysis.globalDetails.incompleteQuestions.length > 0) {
        response += `\n**⚠️ Top Priorities:**\n`;
        analysis.globalDetails.incompleteQuestions.slice(0, 3).forEach(q => {
          response += `• ${q.text} (${q.step})\n`;
        });
        if (analysis.globalDetails.incompleteQuestions.length > 3) {
          response += `• ...and ${analysis.globalDetails.incompleteQuestions.length - 3} more incomplete items\n`;
        }
      }
      
      return response;
    } else {
      let response = "**Multi-Workflow Analysis:**\n\n";
      analysisDataArray.forEach(analysis => {
        if (!analysis.error) {
          response += `**${analysis.workflowName}:**\n`;
          response += `  Sites: ${analysis.summary.activeSites}/${analysis.summary.totalSites} | Progress: ${analysis.summary.averageProgress}% | Audit Ready: ${analysis.summary.auditReadinessScore.toFixed(1)}%\n\n`;
        }
      });
      return response;
    }
  }

  /**
   * Format regional breakdown response
   */
  formatRegionalBreakdownResponse(regionalDataArray) {
    if (regionalDataArray.length === 1) {
      const regionalData = regionalDataArray[0];
      if (regionalData.error) {
        return `Unable to retrieve regional breakdown for ${regionalData.workflowName}: ${regionalData.error}`;
      }
      
      let response = `**${regionalData.workflowName} - Regional Breakdown**\n\n`;
      
      if (regionalData.regionalBreakdown && Object.keys(regionalData.regionalBreakdown).length > 0) {
        response += `**Overview**: ${regionalData.totalRegions} regions active\n\n`;
        
        Object.values(regionalData.regionalBreakdown)
          .sort((a, b) => b.averageProgress - a.averageProgress)
          .forEach(region => {
            const status = region.averageProgress >= 80 ? "EXCELLENT" :
                          region.averageProgress >= 60 ? "GOOD" :
                          region.averageProgress >= 40 ? "FAIR" : "NEEDS IMPROVEMENT";
            
            response += `**${region.regionName}** (${status})\n`;
            response += `   Progress: ${region.averageProgress}% | Sites: ${region.activeSites}/${region.totalSites} active\n`;
            
            if (region.sites && region.sites.length > 0) {
              const topSites = region.sites
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 3);
              
              response += `   Top Sites: `;
              response += topSites.map(site => `${site.siteName} (${site.percentage}%)`).join(', ');
              if (region.sites.length > 3) {
                response += ` +${region.sites.length - 3} more`;
              }
              response += '\n';
            }
            response += '\n';
          });
        
        // Add summary
        const allRegionProgress = Object.values(regionalData.regionalBreakdown);
        const overallAverage = Math.round(
          allRegionProgress.reduce((sum, region) => sum + region.averageProgress, 0) / allRegionProgress.length
        );
        const totalActiveSites = allRegionProgress.reduce((sum, region) => sum + region.activeSites, 0);
        const totalSites = allRegionProgress.reduce((sum, region) => sum + region.totalSites, 0);
        
        response += `**Overall Summary**: ${overallAverage}% average progress across ${totalActiveSites}/${totalSites} sites`;
      } else {
        response += "No regional data available for this workflow.";
      }
      
      return response;
    } else {
      let response = "**Multi-Workflow Regional Breakdown:**\n\n";
      regionalDataArray.forEach(regionalData => {
        if (!regionalData.error && regionalData.regionalBreakdown) {
          const regionCount = Object.keys(regionalData.regionalBreakdown).length;
          const allRegions = Object.values(regionalData.regionalBreakdown);
          const overallAverage = regionCount > 0 ? 
            Math.round(allRegions.reduce((sum, region) => sum + region.averageProgress, 0) / regionCount) : 0;
          
          response += `**${regionalData.workflowName}**: ${regionCount} regions | Avg: ${overallAverage}%\n`;
        }
      });
      return response;
    }
  }

  /**
   * Format all frameworks site response
   */
  formatAllFrameworksSiteResponse(allSiteDataArray) {
    let response = "**All 9 Frameworks - Site Analysis**\n\n";
    
    // Summary statistics
    const totalFrameworks = allSiteDataArray.length;
    const frameworksWithSites = allSiteDataArray.filter(fw => !fw.error && fw.totalSites > 0).length;
    const totalActiveSites = allSiteDataArray.reduce((sum, fw) => sum + (fw.activeSites || 0), 0);
    const totalSites = allSiteDataArray.reduce((sum, fw) => sum + (fw.totalSites || 0), 0);
    
    response += `**Summary**: ${frameworksWithSites}/${totalFrameworks} frameworks active | ${totalActiveSites}/${totalSites} sites across all frameworks\n\n`;
    
    // Group by adoption level
    const highAdoption = allSiteDataArray.filter(fw => !fw.error && fw.activeSites >= 5);
    const mediumAdoption = allSiteDataArray.filter(fw => !fw.error && fw.activeSites >= 2 && fw.activeSites < 5);
    const lowAdoption = allSiteDataArray.filter(fw => !fw.error && fw.activeSites >= 1 && fw.activeSites < 2);
    const notActive = allSiteDataArray.filter(fw => !fw.error && fw.activeSites === 0);
    
    if (highAdoption.length > 0) {
      response += `**High Adoption** (5+ sites):\n`;
      highAdoption.forEach(fw => {
        response += `• ${fw.workflowName}: ${fw.activeSites}/${fw.totalSites} sites (${fw.averageProgress}% avg)\n`;
      });
      response += '\n';
    }
    
    if (mediumAdoption.length > 0) {
      response += `**Medium Adoption** (2-4 sites):\n`;
      mediumAdoption.forEach(fw => {
        response += `• ${fw.workflowName}: ${fw.activeSites}/${fw.totalSites} sites (${fw.averageProgress}% avg)\n`;
      });
      response += '\n';
    }
    
    if (lowAdoption.length > 0) {
      response += `**Limited Adoption** (1 site):\n`;
      lowAdoption.forEach(fw => {
        response += `• ${fw.workflowName}: ${fw.activeSites} site (${fw.averageProgress}% progress)\n`;
      });
      response += '\n';
    }
    
    if (notActive.length > 0) {
      response += `**Not Active**:\n`;
      notActive.forEach(fw => {
        response += `• ${fw.workflowName}: ${fw.message || 'No sites configured'}\n`;
      });
    }
    
    return response;
  }

  /**
   * Format all frameworks regional response
   */
  formatAllFrameworksRegionalResponse(allRegionalDataArray) {
    let response = "**All 9 Frameworks - Regional Analysis**\n\n";
    
    // Get all unique regions across all frameworks
    const allRegions = new Set();
    allRegionalDataArray.forEach(fw => {
      if (fw.regionalBreakdown) {
        Object.keys(fw.regionalBreakdown).forEach(regionId => allRegions.add(regionId));
      }
    });
    
    response += `**Overview**: Analysis across ${allRegions.size} regions\n\n`;
    
    // Show by region
    Array.from(allRegions).forEach(regionId => {
      const regionData = allRegionalDataArray
        .map(fw => ({
          workflowName: fw.workflowName,
          regionData: fw.regionalBreakdown?.[regionId]
        }))
        .filter(item => item.regionData);
      
      if (regionData.length > 0) {
        const regionName = regionData[0].regionData.regionName;
        const avgProgress = Math.round(
          regionData.reduce((sum, item) => sum + item.regionData.averageProgress, 0) / regionData.length
        );
        
        response += `**${regionName}** (${avgProgress}% avg across ${regionData.length} frameworks):\n`;
        regionData
          .sort((a, b) => b.regionData.averageProgress - a.regionData.averageProgress)
          .forEach(item => {
            const status = item.regionData.averageProgress >= 70 ? "STRONG" :
                          item.regionData.averageProgress >= 40 ? "MODERATE" : "WEAK";
            response += `  ${item.workflowName}: ${item.regionData.averageProgress}% (${item.regionData.activeSites}/${item.regionData.totalSites} sites) - ${status}\n`;
          });
        response += '\n';
      }
    });
    
    return response;
  }

  /**
   * Format all frameworks overview response
   */
  formatAllFrameworksOverviewResponse(allOverviewDataArray) {
    let response = "**All 9 Frameworks - Adoption Overview**\n\n";
    
    // Sort by adoption rate
    const sortedFrameworks = allOverviewDataArray
      .filter(fw => !fw.error)
      .sort((a, b) => {
        const adoptionA = a.totalSites > 0 ? (a.activeSites / a.totalSites) : 0;
        const adoptionB = b.totalSites > 0 ? (b.activeSites / b.totalSites) : 0;
        return adoptionB - adoptionA;
      });
    
    sortedFrameworks.forEach(fw => {
      const adoptionRate = fw.totalSites > 0 ? Math.round((fw.activeSites / fw.totalSites) * 100) : 0;
      const adoptionLevel = adoptionRate >= 80 ? "HIGH" :
                           adoptionRate >= 50 ? "MEDIUM" :
                           adoptionRate >= 20 ? "LOW" : "MINIMAL";
      
      response += `**${fw.workflowName}** (${adoptionLevel} ADOPTION)\n`;
      response += `   Adoption: ${adoptionRate}% (${fw.activeSites}/${fw.totalSites} sites)\n`;
      response += `   Progress: ${fw.averageProgress}% average\n`;
      
      if (fw.sites && fw.sites.length > 0) {
        const topSites = fw.sites
          .filter(site => site.percentage > 0)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 2);
        
        if (topSites.length > 0) {
          response += `   Top Sites: ${topSites.map(site => `${site.siteName} (${site.percentage}%)`).join(', ')}\n`;
        }
      }
      response += '\n';
    });
    
    return response;
  }

  /**
   * Format site-specific details response
   */
  formatSiteSpecificDetails(siteDetailsData, siteName) {
    let response = `**${siteName} - Compliance Implementation Details**\n\n`;
    
    // Filter to only active workflows for this site
    const activeWorkflows = siteDetailsData.filter(workflow => workflow.isActive);
    const inactiveWorkflows = siteDetailsData.filter(workflow => !workflow.isActive);
    
    if (activeWorkflows.length === 0) {
      response += `**${siteName}** is not currently implementing any compliance frameworks.\n\n`;
      response += `**Available Frameworks to Implement:**\n`;
      inactiveWorkflows.forEach(workflow => {
        response += `• ${workflow.workflowName}\n`;
      });
      return response;
    }
    
    response += `**Active Implementations** (${activeWorkflows.length}):\n\n`;
    
    // Sort active workflows by progress (highest first)
    activeWorkflows
      .sort((a, b) => (b.siteInfo?.percentage || 0) - (a.siteInfo?.percentage || 0))
      .forEach(workflow => {
        const progress = workflow.siteInfo?.percentage || 0;
        const status = progress >= 80 ? "EXCELLENT" :
                      progress >= 60 ? "GOOD" :
                      progress >= 40 ? "NEEDS WORK" : "BEHIND";
        
        response += `**${workflow.workflowName}**\n`;
        response += `• Progress: ${progress}% (${status})\n`;
        
        // Add specific insights based on progress level
        if (progress >= 80) {
          response += `• Status: Near completion - ready for audit preparation\n`;
        } else if (progress >= 60) {
          response += `• Status: Good progress - focus on remaining critical items\n`;
        } else if (progress >= 40) {
          response += `• Status: Moderate progress - requires attention and resource allocation\n`;
        } else if (progress > 0) {
          response += `• Status: Early stage - significant work needed to meet compliance requirements\n`;
        }
        response += '\n';
      });
    
    if (inactiveWorkflows.length > 0) {
      response += `**Not Currently Implementing** (${inactiveWorkflows.length}):\n`;
      inactiveWorkflows.forEach(workflow => {
        response += `• ${workflow.workflowName}\n`;
      });
      response += '\n';
    }
    
    // Add summary insights
    const avgProgress = activeWorkflows.reduce((sum, w) => sum + (w.siteInfo?.percentage || 0), 0) / activeWorkflows.length;
    const highPerformers = activeWorkflows.filter(w => (w.siteInfo?.percentage || 0) >= 60).length;
    const needsAttention = activeWorkflows.filter(w => (w.siteInfo?.percentage || 0) < 40).length;
    
    response += `**${siteName} Summary:**\n`;
    response += `• Average Progress: ${Math.round(avgProgress)}%\n`;
    response += `• High Performing Frameworks: ${highPerformers}/${activeWorkflows.length}\n`;
    
    if (needsAttention > 0) {
      response += `• Frameworks Needing Immediate Attention: ${needsAttention}\n`;
    }
    
    // Add recommendations
    response += `\n**Recommendations:**\n`;
    if (avgProgress >= 70) {
      response += `• Excellent overall performance - focus on audit readiness for completed frameworks\n`;
      response += `• Consider expanding implementation to inactive frameworks\n`;
    } else if (avgProgress >= 50) {
      response += `• Good foundation - accelerate progress on frameworks below 60%\n`;
      response += `• Prioritize critical questions and evidence collection\n`;
    } else {
      response += `• Requires significant attention and resource allocation\n`;
      response += `• Consider focusing on 2-3 high-priority frameworks initially\n`;
      response += `• Establish dedicated compliance team for this site\n`;
    }
    
    return response;
  }

  /**
   * Format all sites details breakdown response
   */
  formatAllSitesDetailsBreakdown(allSiteBreakdowns) {
    let response = "**Site-Specific Implementation Details Across All Frameworks**\n\n";
    
    // Collect all unique sites
    const allSites = new Set();
    allSiteBreakdowns.forEach(workflow => {
      if (workflow.sites) {
        workflow.sites.forEach(site => {
          allSites.add(site.siteName);
        });
      }
    });
    
    if (allSites.size === 0) {
      return "No site-specific data available.";
    }
    
    // Analyze each site across all frameworks
    Array.from(allSites).forEach(siteName => {
      response += `**${siteName}**\n`;
      
      const siteData = [];
      let totalProgress = 0;
      let activeFrameworks = 0;
      
      allSiteBreakdowns.forEach(workflow => {
        const siteInfo = workflow.sites?.find(site => site.siteName === siteName);
        if (siteInfo) {
          const isActive = siteInfo.percentage > 0;
          if (isActive) {
            activeFrameworks++;
            totalProgress += siteInfo.percentage;
            
            const status = siteInfo.percentage >= 80 ? "EXCELLENT" :
                          siteInfo.percentage >= 60 ? "GOOD" :
                          siteInfo.percentage >= 40 ? "NEEDS WORK" : "BEHIND";
            
            siteData.push({
              name: workflow.workflowName,
              progress: siteInfo.percentage,
              status
            });
          }
        }
      });
      
      if (activeFrameworks === 0) {
        response += `• Status: No active framework implementations\n`;
      } else {
        const avgProgress = Math.round(totalProgress / activeFrameworks);
        response += `• Active Frameworks: ${activeFrameworks}/${allSiteBreakdowns.length}\n`;
        response += `• Average Progress: ${avgProgress}%\n`;
        
        // Show top performing frameworks
        const topFrameworks = siteData
          .sort((a, b) => b.progress - a.progress)
          .slice(0, 3);
        
        response += `• Top Performing:\n`;
        topFrameworks.forEach(fw => {
          response += `  - ${fw.name}: ${fw.progress}% (${fw.status})\n`;
        });
        
        // Add performance insights
        const excellentCount = siteData.filter(fw => fw.progress >= 80).length;
        const needsWorkCount = siteData.filter(fw => fw.progress < 40).length;
        
        if (excellentCount > 0) {
          response += `• ${excellentCount} framework(s) near completion\n`;
        }
        if (needsWorkCount > 0) {
          response += `• ${needsWorkCount} framework(s) need immediate attention\n`;
        }
      }
      response += '\n';
    });
    
    // Add overall insights
    response += `**Overall Site Performance Summary:**\n`;
    const sitePerformances = [];
    
    Array.from(allSites).forEach(siteName => {
      let totalProgress = 0;
      let activeFrameworks = 0;
      
      allSiteBreakdowns.forEach(workflow => {
        const siteInfo = workflow.sites?.find(site => site.siteName === siteName);
        if (siteInfo && siteInfo.percentage > 0) {
          activeFrameworks++;
          totalProgress += siteInfo.percentage;
        }
      });
      
      if (activeFrameworks > 0) {
        const avgProgress = Math.round(totalProgress / activeFrameworks);
        sitePerformances.push({
          name: siteName,
          avgProgress,
          activeFrameworks
        });
      }
    });
    
    // Sort sites by performance
    sitePerformances.sort((a, b) => b.avgProgress - a.avgProgress);
    
    sitePerformances.forEach((site, index) => {
      const rank = index + 1;
      const indicator = rank === 1 ? "#1" : rank === 2 ? "#2" : rank === 3 ? "#3" : "•";
      response += `${indicator} ${site.name}: ${site.avgProgress}% avg (${site.activeFrameworks} frameworks)\n`;
    });
    
    return response;
  }
}

// Export as singleton
const geminiService = new GeminiService();
export default geminiService;