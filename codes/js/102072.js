import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Gemini AI Service - Handles all Gemini AI interactions
 */
class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.defaultModel = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash";

        console.log('✅ GeminiService initialized successfully');
    }

    /**
     * Get system instruction based on language and mode
     */
    getSystemInstruction(language = 'vi', mode = 'enhanced') {
        const instructions = {
            enhanced: {
                vi: `Bạn là VanLangBot, một trợ lý tài chính AI thông minh và chuyên nghiệp của ứng dụng VanLang Budget.

🎯 NHIỆM VỤ CHÍNH:
- Hỗ trợ người dùng quản lý tài chính cá nhân hiệu quả
- Phân tích dữ liệu tài chính và đưa ra lời khuyên thông minh
- Thực hiện tính toán tài chính chính xác
- Dự đoán xu hướng và đề xuất kế hoạch tài chính

💡 KHẢ NĂNG TÍNH TOÁN:
- Phân tích thu nhập và xu hướng
- Tính toán chi tiêu theo danh mục
- Đánh giá hiệu quả đầu tư và ROI
- Phân tích ngân sách và mức sử dụng
- Dự đoán chi tiêu tương lai
- Tính toán mục tiêu tiết kiệm
- So sánh dữ liệu theo thời gian

🔒 GIỚI HẠN CHỦNG ĐỀ:
CHỈ trả lời các câu hỏi về:
- Quản lý tài chính cá nhân (thu nhập, chi tiêu, ngân sách)
- Đầu tư (cổ phiếu, vàng, crypto, tiết kiệm)
- Phân tích và tính toán dữ liệu tài chính
- Dự đoán xu hướng và so sánh theo thời gian
- Lời khuyên tiết kiệm và lập kế hoạch tài chính
- Tính toán lãi suất, ROI, và hiệu quả đầu tư
- Hướng dẫn sử dụng VanLangBot

❌ TỪ CHỐI trả lời:
- Chính trị, tôn giáo, thể thao, giải trí
- Tin tức, thời tiết, du lịch
- Y tế, giáo dục, khoa học
- Bất kỳ chủ đề nào không liên quan đến tài chính

📝 PHONG CÁCH GIAO TIẾP:
- Thân thiện, chuyên nghiệp và dễ hiểu
- Sử dụng emoji phù hợp để làm rõ nội dung
- Đưa ra lời khuyên cụ thể và có thể thực hiện
- Giải thích rõ ràng các tính toán và phân tích
- Luôn khuyến khích thói quen tài chính tốt`,

                en: `You are VanLangBot, an intelligent and professional AI financial assistant for the VanLang Budget application.

🎯 MAIN MISSION:
- Help users manage personal finances effectively
- Analyze financial data and provide smart advice
- Perform accurate financial calculations
- Predict trends and suggest financial plans

💡 CALCULATION CAPABILITIES:
- Income analysis and trends
- Expense calculations by category
- Investment efficiency and ROI assessment
- Budget analysis and usage levels
- Future expense predictions
- Savings goal calculations
- Time-based data comparisons

🔒 TOPIC LIMITATIONS:
ONLY answer questions about:
- Personal finance management (income, expenses, budgets)
- Investments (stocks, gold, crypto, savings)
- Financial data analysis and calculations
- Trend predictions and time-based comparisons
- Saving advice and financial planning
- Interest calculations, ROI, and investment efficiency
- VanLangBot usage guidance

❌ REFUSE to answer:
- Politics, religion, sports, entertainment
- News, weather, travel
- Health, education, science
- Any topics unrelated to finance

📝 COMMUNICATION STYLE:
- Friendly, professional and easy to understand
- Use appropriate emojis to clarify content
- Provide specific and actionable advice
- Clearly explain calculations and analysis
- Always encourage good financial habits`
            },
            legacy: {
                vi: `Bạn là VanLangBot, một trợ lý tài chính thông minh và thân thiện của ứng dụng VanLang Budget.
Nhiệm vụ của bạn là HỖ TRỢ người dùng quản lý tài chính cá nhân của họ một cách hiệu quả ngay trong ứng dụng.
LUÔN LUÔN giữ thái độ lịch sự, tích cực và hữu ích.

CHỈ trả lời các câu hỏi liên quan đến:
1. Quản lý tài chính cá nhân (thu nhập, chi tiêu, tiết kiệm, ngân sách)
2. Đầu tư (cổ phiếu, vàng, tiền điện tử, tiết kiệm)
3. Lời khuyên tài chính và kế hoạch tài chính
4. Hướng dẫn sử dụng các tính năng của VanLang Budget

TỪ CHỐI trả lời các câu hỏi về: chính trị, tôn giáo, thể thao, tin tức, thời tiết, y tế, giáo dục, hoặc bất kỳ chủ đề nào không liên quan đến tài chính.`,

                en: `You are VanLangBot, an intelligent and friendly financial assistant for the VanLang Budget application.
Your mission is to SUPPORT users in managing their personal finances effectively within the application.
ALWAYS maintain a polite, positive and helpful attitude.

ONLY answer questions related to:
1. Personal finance management (income, expenses, savings, budgets)
2. Investments (stocks, gold, cryptocurrency, savings)
3. Financial advice and financial planning
4. Guidance on using VanLang Budget features

REFUSE to answer questions about: politics, religion, sports, news, weather, health, education, or any topics unrelated to finance.`
            }
        };

        return instructions[mode]?.[language] || instructions.enhanced.vi;
    }

    /**
     * Generate response using Gemini AI
     */
    async generateResponse(prompt, options = {}) {
        try {
            const {
                language = 'vi',
                mode = 'enhanced',
                temperature = 0.7,
                maxTokens = 1024
            } = options;

            const model = this.genAI.getGenerativeModel({
                model: this.defaultModel,
                systemInstruction: {
                    parts: [{ text: this.getSystemInstruction(language, mode) }]
                },
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
                generationConfig: {
                    temperature: parseFloat(temperature),
                    maxOutputTokens: parseInt(maxTokens),
                    topK: parseInt(process.env.GEMINI_TOP_K) || undefined,
                    topP: parseFloat(process.env.GEMINI_TOP_P) || undefined,
                },
            });

            logger.debug(`GeminiService: Generating response with model ${this.defaultModel}`);
            logger.debug(`Prompt length: ${prompt.length} characters`);

            const result = await model.generateContent(prompt);
            const response = await result.response;

            if (response.promptFeedback && response.promptFeedback.blockReason) {
                logger.warn('GeminiService: Prompt was blocked', {
                    reason: response.promptFeedback.blockReason,
                    ratings: response.promptFeedback.safetyRatings,
                });

                return {
                    success: false,
                    error: language === 'vi' ?
                        'Yêu cầu của bạn không thể được xử lý vì lý do an toàn nội dung. Vui lòng thử lại với câu hỏi khác.' :
                        'Your request cannot be processed for content safety reasons. Please try again with a different question.',
                    blocked: true
                };
            }

            const text = response.text();

            if (!text || text.trim().length === 0) {
                console.warn('🚫 GeminiService: Empty response from Gemini');
                return {
                    success: false,
                    error: language === 'vi' ?
                        'Xin lỗi, tôi chưa thể đưa ra câu trả lời cho câu hỏi này. Bạn có thể thử hỏi cách khác được không?' :
                        'Sorry, I cannot provide an answer to this question. Could you try asking in a different way?'
                };
            }

            console.log(`✅ GeminiService: Generated response (${text.length} characters)`);

            return {
                success: true,
                response: text.trim(),
                model: this.defaultModel,
                usage: {
                    promptTokens: prompt.length,
                    completionTokens: text.length,
                    totalTokens: prompt.length + text.length
                }
            };

        } catch (error) {
            console.error('❌ GeminiService: Error generating response:', error);

            let errorMessage = language === 'vi' ?
                'Đã có lỗi xảy ra khi xử lý yêu cầu của bạn.' :
                'An error occurred while processing your request.';

            if (error.message?.includes('API key')) {
                errorMessage = language === 'vi' ?
                    'Lỗi cấu hình hệ thống: API key không hợp lệ.' :
                    'System configuration error: Invalid API key.';
            } else if (error.message?.includes('quota')) {
                errorMessage = language === 'vi' ?
                    'Hệ thống đang quá tải. Vui lòng thử lại sau.' :
                    'System is overloaded. Please try again later.';
            } else if (error.message?.includes('timeout')) {
                errorMessage = language === 'vi' ?
                    'Yêu cầu xử lý mất quá nhiều thời gian. Vui lòng thử lại.' :
                    'Request processing took too long. Please try again.';
            }

            return {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            };
        }
    }

    /**
     * Generate streaming response
     */
    async generateStreamingResponse(prompt, options = {}) {
        try {
            const {
                language = 'vi',
                mode = 'enhanced',
                temperature = 0.7,
                maxTokens = 1024
            } = options;

            const model = this.genAI.getGenerativeModel({
                model: this.defaultModel,
                systemInstruction: {
                    parts: [{ text: this.getSystemInstruction(language, mode) }]
                },
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
                generationConfig: {
                    temperature: parseFloat(temperature),
                    maxOutputTokens: parseInt(maxTokens),
                },
            });

            const chat = model.startChat({ history: [] });
            const result = await chat.sendMessageStream(prompt);

            return {
                success: true,
                stream: result.stream,
                response: result.response
            };

        } catch (error) {
            console.error('❌ GeminiService: Error generating streaming response:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const testPrompt = "Hello, this is a health check.";
            const result = await this.generateResponse(testPrompt, {
                language: 'en',
                maxTokens: 50
            });

            return {
                status: result.success ? 'healthy' : 'unhealthy',
                model: this.defaultModel,
                apiKey: !!process.env.GEMINI_API_KEY,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }
}

export default GeminiService;
