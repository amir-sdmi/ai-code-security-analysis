// Load environment variables first
const path = require('path');
const fs = require('fs');

// Load from root .env file (same as app.js)
const rootEnvPath = path.join(__dirname, '../../../../.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;

    console.log('🔧 GeminiService initializing...', {
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none',
      envPath: rootEnvPath
    });

    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini API initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini API:', error.message);
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY not found - using fallback responses');
    }
  }

  /**
   * System prompt for FactCheck AI assistant
   */
  getSystemPrompt() {
    return `Bạn là trợ lý AI của FactCheck - nền tảng kiểm tra thông tin và bảo mật online hàng đầu tại Việt Nam.

NHÂN CÁCH & VAI TRÒ:
- Thân thiện, chuyên nghiệp, đáng tin cậy
- Chuyên gia về cybersecurity, fact-checking, và an toàn mạng
- Luôn ưu tiên bảo vệ người dùng khỏi các mối đe dọa online

KHẢ NĂNG CHÍNH:
🔍 Kiểm tra và phân tích links/websites
🛡️ Tư vấn bảo mật mạng
📰 Xác minh thông tin và tin tức  
🎯 Nhận biết lừa đảo, phishing, malware
💡 Giáo dục về an toàn mạng

NGUYÊN TẮC PHẢN HỒI:
- Luôn đưa ra lời khuyên an toàn, thận trọng
- Khuyến khích user sử dụng các tính năng của FactCheck platform
- Sử dụng emoji phù hợp để tạo sự thân thiện
- Đưa ra thông tin cụ thể, actionable advice
- Không đưa ra thông tin y tế, pháp lý, tài chính cụ thể

STYLE & ĐỘ DÀI:
- Tiếng Việt tự nhiên, dễ hiểu
- CỰC KỲ QUAN TRỌNG: Giữ câu trả lời NGẮN GỌN (tối đa 200-300 từ)
- Ưu tiên nội dung cốt lõi, bỏ qua chi tiết phụ
- Cấu trúc rõ ràng với 2-4 bullet points chính
- Tone tích cực, hỗ trợ
- Trả lời trực tiếp, không lan man
- Nếu cần giải thích dài, chỉ đưa ra điểm chính nhất

ĐỊNH DẠNG QUY ĐỊNH:
- Mở đầu: 1 câu ngắn (tối đa 15 từ)
- Nội dung chính: 2-4 điểm quan trọng
- Kết thúc: 1 câu hỏi hoặc call-to-action ngắn

Hãy trả lời câu hỏi của người dùng theo phong cách và vai trò này. LUÔN LUÔN giữ câu trả lời ngắn gọn và đi thẳng vào vấn đề.`;
  }

  /**
   * Optimize response length and content
   */
  optimizeResponse(text) {
    // Remove extra whitespace and normalize
    let optimized = text.trim().replace(/\s+/g, ' ');

    // If response is too long (over 800 characters), try to shorten it
    if (optimized.length > 800) {
      // Split by sentences and keep only the most important ones
      const sentences = optimized.split(/[.!?]\s+/);
      const importantSentences = sentences.filter(sentence => {
        const lower = sentence.toLowerCase();
        // Keep sentences with key information
        return (
          sentence.length > 10 && // Not too short
          (lower.includes('factcheck') ||
            lower.includes('kiểm tra') ||
            lower.includes('an toàn') ||
            lower.includes('bảo mật') ||
            lower.includes('⚠️') ||
            lower.includes('✅') ||
            lower.includes('🔍') ||
            lower.includes('🛡️') ||
            sentence.includes('*'))
        );
      });

      if (importantSentences.length > 0) {
        optimized = importantSentences.slice(0, 4).join('. ') + '.';
      } else {
        // Fallback: keep first 3 sentences
        optimized = sentences.slice(0, 3).join('. ') + '.';
      }
    }

    // Ensure it doesn't exceed 500 characters as hard limit
    if (optimized.length > 500) {
      optimized = optimized.substring(0, 480) + '...';
    }

    return optimized;
  }

  /**
   * Generate AI response using Gemini
   */
  async generateResponse(userMessage) {
    try {
      if (!this.model) {
        throw new Error('Gemini API not configured');
      }

      // Enhanced prompt with length constraints
      const lengthConstraint = "\n\nQUY TẮC ĐỘ DÀI: Trả lời NGẮN GỌN trong 200-300 từ. Đi thẳng vào vấn đề. Không lặp lại thông tin.";
      const fullPrompt = `${this.getSystemPrompt()}${lengthConstraint}\n\nNgười dùng hỏi: "${userMessage}"\n\nTrả lời ngắn gọn:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      let fullText = response.text();

      // Optimize the response length for short version
      let shortText = this.optimizeResponse(fullText);

      return {
        success: true,
        response: {
          full: fullText,
          short: shortText
        },
        usage: {
          promptTokens: fullPrompt.length,
          completionTokens: fullText.length,
          totalTokens: fullPrompt.length + fullText.length
        },
        optimized: true
      };

    } catch (error) {
      console.error('Gemini API Error:', error);
      // Return fallback response if API fails
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Fallback responses when Gemini API fails
   */
  getFallbackResponse(userMessage) {
    const messageText = userMessage.toLowerCase();

    let response = '';

    if (messageText.includes('xin chào') || messageText.includes('hello') || messageText.includes('hi')) {
      response = `Xin chào! 👋 Tôi là trợ lý FactCheck AI.

🔍 **Kiểm tra links/websites**
🛡️ **Phân tích bảo mật** 
📰 **Xác minh tin tức**
💡 **Tư vấn an toàn mạng**

Bạn cần hỗ trợ gì?`;
    } else if (messageText.includes('link') || messageText.includes('url') || messageText.includes('website')) {
      response = `🔗 **Kiểm tra link an toàn:**

✅ **Dán link vào đây** - tôi phân tích ngay
✅ **Dùng công cụ Check Link** (menu trái)
✅ **Kiểm tra SSL** và domain

⚠️ **Cảnh báo:** URL rút gọn, domain lạ, yêu cầu thông tin cá nhân

Gửi link cần kiểm tra nhé!`;
    } else if (messageText.includes('lừa đảo') || messageText.includes('scam') || messageText.includes('phishing')) {
      response = `🚨 **Nhận biết lừa đảo:**

**🎭 Dấu hiệu nguy hiểm:**
• Yêu cầu thông tin cá nhân gấp
• Links rút gọn đáng ngờ
• Offers "quá tốt" 
• Tạo áp lực hành động ngay

**🛡️ Bảo vệ:** Xác minh nguồn gốc, dùng FactCheck kiểm tra

Bạn gặp tình huống nào cụ thể?`;
    } else {
      response = `Tôi là trợ lý FactCheck AI! 😊

🔍 **Kiểm tra link** 🛡️ **Bảo mật** 📰 **Xác minh tin tức** 🎯 **Chống lừa đảo**

**Cách tôi giúp bạn:**
• Chia sẻ link cần kiểm tra
• Hỏi về an toàn mạng
• Báo cáo nội dung đáng ngờ

Bạn cần gì cụ thể?`;
    }

    // Apply same optimization to fallback responses
    response = this.optimizeResponse(response);

    return {
      success: true,
      response: response,
      fallback: true,
      optimized: true,
      error: 'Using fallback response due to API unavailability'
    };
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable() {
    return !!(this.apiKey && this.genAI && this.model);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: !!this.apiKey,
      available: this.isAvailable(),
      model: 'gemini-1.5-flash',
      features: {
        textGeneration: true,
        conversational: true,
        multiTurn: true
      }
    };
  }
}

module.exports = new GeminiService();