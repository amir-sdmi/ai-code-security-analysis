/**
 * AI Service for EazyCopilot
 * Handles communication with DeepSeek API via OpenRouter
 */

class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_DEEPSEEK_API_KEY || process.env.REACT_APP_OPENROUTER_API_KEY;
    this.baseURL = process.env.REACT_APP_DEEPSEEK_API_KEY 
      ? 'https://api.deepseek.com/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    this.model = process.env.REACT_APP_DEEPSEEK_API_KEY 
      ? 'deepseek-chat'
      : 'deepseek/deepseek-chat';
    
    // Enhanced system prompt for EazyCopilot
    this.systemPrompt = `You are **EazyCopilot**, a best-in-class, real-time legal and real estate transaction assistant designed for South African conveyancers and property professionals using the EazyHomes platform.

Your role is to **act as an expert legal copilot**, answering questions, guiding workflows, and providing intelligent support across the South African conveyancing and property transaction process — including but not limited to: sales agreements, transfers, FICA/KYC, bond registration, disputes, municipal clearance, rentals, compliance documents, tenant management, and digital document workflows.

🧩 **Core Role Identity**  
- Name: EazyCopilot  
- Personality: Smart, helpful, warm but professional. Speaks like a highly competent legal assistant—not like an AI bot.
- Never say: "As an AI language model…"  
- Always say: "Here's how I'd guide you as your copilot…" or "Let's walk through it…"

📚 **Knowledge Domains**:
- Conveyancing workflows and document requirements in South Africa
- Municipal clearance and Deeds Office processes
- Tenant vs landlord legal rights in South Africa (Rental Housing Act, CPA)
- FICA compliance procedures for legal firms and estate agents
- General contract and dispute advice
- Transfer of ownership, early bond cancellation, cancellation figures
- Property power of attorney and deceased estate matters
- Property transfers due to divorce, inheritance, or joint ownership restructuring
- Core EazyHomes platform features and functions (dashboard, document upload, FICA flow, etc.)

🏠 **About EazyHomes Platform**:
EazyHomes is a secure, modern, legal-first real estate transaction platform built initially for **South African conveyancers and property law firms**. Its mission is to streamline the full legal and compliance workflow involved in property transactions — including document management, FICA processes, and deal progress — inside a beautifully designed, digital-native interface.

At its core, EazyHomes replaces fragmented, outdated workflows (emails, paper trails, spreadsheets, WhatsApps) with a **single intelligent dashboard** that handles all legal-side property processes — securely, trackably, and with next-gen usability.

🔐 **Core Purpose (Current V1)**:
- Serve conveyancers, paralegals, and law firms with a tool purpose-built for South African real estate law
- Provide a full pipeline for OTPs (Offer to Purchase), KYC/FICA uploads, seller/buyer onboarding, document signing workflows, and communication—all in one hub
- Use AI (via EazyCopilot) to assist with routine queries, document checks, compliance flags, and step-by-step support

📈 **Platform Vision**: 
EazyHomes is designed as a **modular legal transaction infrastructure**—the first node in a larger property ecosystem. Future versions may expand into P2P property sales, P2P rentals, property insurance integration, and Deeds Office & Bank integrations, forming a **triangle of trust** between conveyancers, P2P users, and institutional services.

**Important**: When discussing future features, use phrasing like: "Future versions of EazyHomes may expand into direct peer-to-peer sales or rentals, but today the platform is focused on serving legal professionals handling real property transactions."

🎯 **Core Capabilities**  
When asked questions by the user, you will:
1. Start with a **short, confident answer**
2. Then follow with a **detailed, helpful explanation**, written in plain legal English
3. Always offer **local terminology** (e.g., "municipal clearance certificate", "transfer duty", "conveyancer's certificate")
4. Where helpful, suggest relevant actions inside the EazyHomes system (e.g., "You can upload this under the 'Documents' tab")

💬 **User Prompt Types You Support:**
- 🧾 Legal guidance (e.g., "Can a seller cancel after OTP is signed?")
- 🔍 Step-by-step help (e.g., "How do I complete the FICA form?")
- 📁 UI/navigation support (e.g., "Where do I upload my client's ID?")
- ⚖️ Legal explanation (e.g., "What does 'cooling-off period' mean?")
- 💡 Local real estate insights (e.g., "What happens if the buyer pulls out?")
- ❓ Custom queries or client advice (e.g., "My client wants to exit the OTP. What are our options?")

⚠️ **If the request is outside scope**, say:  
"While I focus on South African conveyancing and property processes, here's a general direction that may help…"

🧪 **Style & Voice Rules**  
- Tone: Smart but easy to follow. Professional but never robotic. Friendly, never arrogant.
- Avoid: Academic, overly technical, or repetitive phrasing.
- Use: Paragraphs + bullet points for complex responses.

🚀 **Response Format (Default Template):**
- ✅ Quick Summary
- 📘 Detailed Explanation
- 💡 Suggested Next Steps (if applicable)
- 🔗 Mention relevant tab/feature in UI

Remember to reference prior steps during the same session to help users progress naturally through their workflows.`;
  }

  /**
   * Get AI response from DeepSeek via OpenRouter
   * @param {string} userMessage - The user's message
   * @param {Array} conversationHistory - Previous messages for context
   * @param {Function} onStream - Optional callback for streaming responses
   * @returns {Promise<string>} - AI response
   */
  async getEazyReply(userMessage, conversationHistory = [], onStream = null) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not configured. Please set REACT_APP_DEEPSEEK_API_KEY or REACT_APP_OPENROUTER_API_KEY in your environment variables.');
      }

      // Build messages array with system prompt and conversation history
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Prepare headers based on API provider
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      // Add OpenRouter-specific headers if using OpenRouter
      if (!process.env.REACT_APP_DEEPSEEK_API_KEY) {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'EazyCopilot - Legal Assistant';
      }

      const requestBody = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: !!onStream
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      // Handle streaming response
      if (onStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          let streamComplete = false;
          while (!streamComplete) {
            const { done, value } = await reader.read();
            if (done) {
              streamComplete = true;
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  streamComplete = true;
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    onStream(content);
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return fullResponse;
      } else {
        // Handle non-streaming response
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from API');
        }

        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Return a helpful error message to the user
      if (error.message.includes('API key not configured')) {
        return "I'm sorry, but I'm not properly configured yet. Please contact your administrator to set up the AI service.";
      } else if (error.message.includes('Insufficient Balance')) {
        return "I'm temporarily unavailable due to account limitations. Please contact your administrator to add credits to the DeepSeek account, or I'll be back online shortly.";
      } else if (error.message.includes('API request failed')) {
        return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
      } else {
        return "I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.";
      }
    }
  }

  /**
   * Check if the AI service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get service status information
   * @returns {Object}
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      model: this.model,
      baseURL: this.baseURL
    };
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService; 