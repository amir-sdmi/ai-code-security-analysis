
// AI Diagnostic Service - Enhanced with RapidAPI and X.AI Integration
// File: services/diagnostic-service/src/app.js

const express = require('express');
const axios = require('axios');
const { HederaSDK } = require('@hashgraph/sdk');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

class DiagnosticService {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupLogging();

        // API Configurations
        this.rapidApiKey = process.env.RAPIDAPI_KEY || '7df876ef79msh8d28c0ec51fe3dcp1da291jsne6dae8edcea0';
        this.xaiApiKey = process.env.XAI_API_KEY || 'xai-0c9FSzM8WPoRTlEbOSOQLrpgU5Xwq4TcRszdVTXiNpGBri9GbUicoZ2UyGShBNQuklg70iUbWWQ74PZH';
        this.xaiBaseUrl = 'https://api.x.ai/v1';

        // Hedera Configuration
        this.hederaClient = this.initializeHedera();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        this.app.use(limiter);

        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
    }

    setupLogging() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'diagnostic-service.log' })
            ]
        });
    }

    initializeHedera() {
        try {
            const client = HederaSDK.Client.forTestnet();
            client.setOperator(
                process.env.HEDERA_ACCOUNT_ID,
                process.env.HEDERA_PRIVATE_KEY
            );
            return client;
        } catch (error) {
            this.logger.error('Failed to initialize Hedera client:', error);
            return null;
        }
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        // OBD2 Diagnostic Scan with AI Interpretation
        this.app.post('/api/v2/diagnostics/scan', async (req, res) => {
            try {
                const { vin, obd2Data, vehicleInfo } = req.body;

                // Validate input
                if (!vin || !obd2Data) {
                    return res.status(400).json({ 
                        error: 'VIN and OBD2 data are required' 
                    });
                }

                this.logger.info(`Diagnostic scan initiated for VIN: ${vin}`);

                // Step 1: Get vehicle information from RapidAPI
                const vehicleData = await this.getVehicleInfo(vin);

                // Step 2: Process OBD2 data with CarMD API
                const diagnosticResults = await this.processOBD2Data(obd2Data, vin);

                // Step 3: Enhance interpretation with X.AI Grok
                const aiInterpretation = await this.getAIInterpretation(
                    diagnosticResults, 
                    vehicleData, 
                    obd2Data
                );

                // Step 4: Record on Hedera blockchain for authenticity
                const blockchainRecord = await this.recordDiagnostic(vin, {
                    diagnosticResults,
                    aiInterpretation,
                    timestamp: new Date().toISOString()
                });

                const response = {
                    vin,
                    vehicleInfo: vehicleData,
                    diagnosticResults,
                    aiInterpretation,
                    blockchainRecord,
                    timestamp: new Date().toISOString()
                };

                res.json(response);
                this.logger.info(`Diagnostic scan completed for VIN: ${vin}`);

            } catch (error) {
                this.logger.error('Diagnostic scan error:', error);
                res.status(500).json({ 
                    error: 'Internal server error', 
                    message: error.message 
                });
            }
        });

        // AI-Powered Parts Recommendation
        this.app.post('/api/v2/diagnostics/recommendations', async (req, res) => {
            try {
                const { vin, diagnosticResults, userPreferences } = req.body;

                // Get AI-powered recommendations using Grok
                const recommendations = await this.getPartsRecommendations(
                    diagnosticResults, 
                    userPreferences
                );

                res.json({
                    vin,
                    recommendations,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                this.logger.error('Recommendations error:', error);
                res.status(500).json({ 
                    error: 'Failed to generate recommendations',
                    message: error.message 
                });
            }
        });

        // Real-time AI Assistant Chat
        this.app.post('/api/v2/diagnostics/chat', async (req, res) => {
            try {
                const { message, context, sessionId } = req.body;

                const aiResponse = await this.chatWithGrok(message, context);

                res.json({
                    sessionId,
                    response: aiResponse,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                this.logger.error('Chat error:', error);
                res.status(500).json({ 
                    error: 'Chat service unavailable',
                    message: error.message 
                });
            }
        });
    }

    // RapidAPI Integration Methods
    async getVehicleInfo(vin) {
        try {
            const response = await axios.get(
                `https://vin-decoder.p.rapidapi.com/vehicle/v1/vin/${vin}`,
                {
                    headers: {
                        'X-RapidAPI-Key': this.rapidApiKey,
                        'X-RapidAPI-Host': 'vin-decoder.p.rapidapi.com'
                    }
                }
            );

            return response.data;
        } catch (error) {
            this.logger.error('Failed to get vehicle info:', error);
            throw new Error('Vehicle information lookup failed');
        }
    }

    async processOBD2Data(obd2Data, vin) {
        try {
            const response = await axios.post(
                'https://api.carmd.com/v3.0/diagnose',
                {
                    vin: vin,
                    dtc: obd2Data.troubleCodes || [],
                    mileage: obd2Data.mileage || 0,
                    year: obd2Data.year
                },
                {
                    headers: {
                        'content-type': 'application/json',
                        'partner-token': this.rapidApiKey,
                        'authorization': `Basic ${Buffer.from(this.rapidApiKey).toString('base64')}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            this.logger.error('Failed to process OBD2 data:', error);
            throw new Error('OBD2 processing failed');
        }
    }

    // X.AI Grok Integration Methods
    async getAIInterpretation(diagnosticResults, vehicleData, obd2Data) {
        try {
            const prompt = this.buildDiagnosticPrompt(diagnosticResults, vehicleData, obd2Data);

            const response = await axios.post(
                `${this.xaiBaseUrl}/chat/completions`,
                {
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert automotive diagnostic AI assistant integrated into the Karapiro Cartel platform. 
                                    Provide clear, actionable diagnostic interpretations and repair recommendations based on OBD2 data, 
                                    vehicle specifications, and diagnostic results. Focus on accuracy, safety, and cost-effectiveness.`
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    model: "grok-3-latest",
                    stream: false,
                    temperature: 0.1
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.xaiApiKey}`
                    }
                }
            );

            return {
                interpretation: response.data.choices[0].message.content,
                confidence: this.calculateConfidence(diagnosticResults),
                urgencyLevel: this.determineUrgency(diagnosticResults),
                estimatedCost: this.estimateRepairCost(diagnosticResults)
            };

        } catch (error) {
            this.logger.error('AI interpretation failed:', error);
            throw new Error('AI interpretation service unavailable');
        }
    }

    async getPartsRecommendations(diagnosticResults, userPreferences) {
        try {
            const prompt = `Based on the following diagnostic results, recommend specific automotive parts and services:

                          Diagnostic Results: ${JSON.stringify(diagnosticResults)}
                          User Preferences: ${JSON.stringify(userPreferences)}

                          Please provide:
                          1. Specific part recommendations with OEM part numbers when possible
                          2. Alternative aftermarket options
                          3. Estimated costs and labor requirements
                          4. Priority ranking (critical, recommended, optional)
                          5. Compatibility information`;

            const response = await axios.post(
                `${this.xaiBaseUrl}/chat/completions`,
                {
                    messages: [
                        {
                            role: "system",
                            content: "You are a parts recommendation expert for automotive repair and maintenance."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    model: "grok-3-mini",
                    stream: false,
                    temperature: 0.2
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.xaiApiKey}`
                    }
                }
            );

            return {
                recommendations: response.data.choices[0].message.content,
                generated_at: new Date().toISOString(),
                model_used: "grok-3-mini"
            };

        } catch (error) {
            this.logger.error('Parts recommendation failed:', error);
            throw new Error('Parts recommendation service unavailable');
        }
    }

    async chatWithGrok(message, context) {
        try {
            const contextualPrompt = `Context: ${JSON.stringify(context)}\n\nUser Message: ${message}`;

            const response = await axios.post(
                `${this.xaiBaseUrl}/chat/completions`,
                {
                    messages: [
                        {
                            role: "system",
                            content: `You are KC, the AI assistant for KCSpeedShop diagnostic platform. 
                                    You help users understand their vehicle diagnostics, recommend parts and services, 
                                    and provide automotive expertise. Be helpful, accurate, and conversational.`
                        },
                        {
                            role: "user",
                            content: contextualPrompt
                        }
                    ],
                    model: "grok-3-latest",
                    stream: false,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.xaiApiKey}`
                    }
                }
            );

            return response.data.choices[0].message.content;

        } catch (error) {
            this.logger.error('Chat service failed:', error);
            throw new Error('Chat service is currently unavailable');
        }
    }

    // Hedera Blockchain Integration
    async recordDiagnostic(vin, diagnosticData) {
        try {
            if (!this.hederaClient) {
                this.logger.warn('Hedera client not available, skipping blockchain record');
                return { status: 'skipped', reason: 'hedera_unavailable' };
            }

            const topicId = process.env.HEDERA_DIAGNOSTIC_TOPIC_ID;
            const message = JSON.stringify({
                vin,
                diagnosticData,
                timestamp: new Date().toISOString(),
                platform: 'karapiro_cartel_v2'
            });

            const transaction = await new HederaSDK.TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(message)
                .execute(this.hederaClient);

            const receipt = await transaction.getReceipt(this.hederaClient);

            return {
                status: 'recorded',
                transactionId: transaction.transactionId.toString(),
                consensusTimestamp: receipt.consensusTimestamp.toString()
            };

        } catch (error) {
            this.logger.error('Blockchain recording failed:', error);
            return { status: 'failed', error: error.message };
        }
    }

    // Helper Methods
    buildDiagnosticPrompt(diagnosticResults, vehicleData, obd2Data) {
        return `Please analyze this automotive diagnostic data and provide a comprehensive interpretation:

                Vehicle Information:
                ${JSON.stringify(vehicleData, null, 2)}

                OBD2 Raw Data:
                ${JSON.stringify(obd2Data, null, 2)}

                Diagnostic Results:
                ${JSON.stringify(diagnosticResults, null, 2)}

                Please provide:
                1. Clear explanation of identified issues
                2. Severity assessment and urgency
                3. Recommended immediate actions
                4. Long-term maintenance suggestions
                5. Estimated repair timeframe and complexity`;
    }

    calculateConfidence(diagnosticResults) {
        // Implementation would analyze the quality and completeness of diagnostic data
        return Math.min(90, Math.max(60, 75 + Math.random() * 15));
    }

    determineUrgency(diagnosticResults) {
        // Implementation would analyze diagnostic codes for safety-critical issues
        const criticalCodes = ['P0xxx', 'B0xxx']; // Simplified example
        return diagnosticResults.troubleCodes?.some(code => 
            criticalCodes.some(critical => code.startsWith(critical.slice(0, 2)))
        ) ? 'HIGH' : 'MEDIUM';
    }

    estimateRepairCost(diagnosticResults) {
        // Implementation would use historical data and parts pricing
        return {
            min: 150,
            max: 850,
            currency: 'USD',
            confidence: 'medium'
        };
    }

    start() {
        const port = process.env.PORT || 3001;
        this.app.listen(port, () => {
            this.logger.info(`Diagnostic Service running on port ${port}`);
        });
    }
}

// Export for use
module.exports = DiagnosticService;

// Start the service if this file is run directly
if (require.main === module) {
    const service = new DiagnosticService();
    service.start();
}
