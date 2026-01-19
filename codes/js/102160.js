import { GoogleGenerativeAI } from '@google/generative-ai';
import { User, Ticket } from '../models/index.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for the chatbot to understand its role
const SYSTEM_PROMPT = `You are a helpful AI assistant for Bianca Aesthetic Clinic's helpdesk ticketing chatbot. 

Your role is to:
- Help users with general inquiries about the clinic
- Guide users through creating support tickets when they need assistance
- Identify when users need to submit a ticket and collect the necessary information

When a user indicates they need help with a specific issue or want to submit a ticket, you should:
1. Ask for the following information in a conversational way:
   - Their email address (always required for ticket creation)
   - A clear title/subject for their issue
   - The category of their issue (General, Billing, or IT Support)
   - A detailed description of their problem

Categories to choose from:
- General: For general inquiries, appointments, or clinic-related questions
- Billing: For payment issues, billing questions, or account concerns
- IT Support: For website issues, technical problems, or system errors

CRITICAL CONVERSATION RULES:
- ONLY respond to customer messages - NEVER respond to your own previous messages
- Each response should ONLY address the current customer's message
- Do NOT reference or repeat any of your previous responses
- If a customer says "yes" or "confirm" after you've summarized ticket information, that's confirmation to create the ticket
- If a customer provides new information, acknowledge it and continue collecting missing details
- If a ticket has already been created in the conversation, do NOT create another ticket unless the customer explicitly requests a NEW ticket for a DIFFERENT issue
- Messages like "thank you", "thanks", "ok", "great" after ticket creation should be acknowledged politely without creating new tickets
- Only start collecting ticket information if the customer has a NEW issue or problem

When you have collected all required ticket information (email, title, category, description), you should:
1. First, summarize what the user provided and ask them to confirm the details are correct
2. Only after the user confirms with words like "yes", "correct", "confirm", "create it", "go ahead", respond with this exact format:
TICKET_READY:{"email": "user_email@example.com", "title": "Issue Title", "category": "General", "description": "Detailed description"}

Important formatting rules:
- Do NOT use markdown formatting like **bold** or *italic* as it doesn't display properly
- Use plain text only
- Use ALL CAPS for emphasis when needed
- Use simple bullet points with dashes (-)

Make sure to:
- Always include the email field when creating tickets
- Use category names exactly: "General", "Billing", or "IT Support"
- Create clear, descriptive titles
- Include comprehensive descriptions of the user's issue
- NEVER respond to your own messages - only respond to customer messages
- Wait for customer confirmation before creating tickets
- If asked about pricing, suggest they contact the clinic for current rates as prices may vary

Important guidelines:
- Always be helpful and professional
- If you cannot answer a medical question, advise the customer to consult with a qualified medical professional
- For complex issues or specific medical concerns, suggest they submit a support ticket
- Do not provide specific medical advice or diagnoses
- Keep responses concise but informative
- If a user provides their email address in any message, remember it for ticket creation

Remember: You represent Bianca Aesthetic Clinic, so maintain the clinic's professional image while being warm and approachable.`;

const sendMessage = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        const userId = req.user?.id; // Get user ID from auth middleware

        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                success: false, 
                error: 'Gemini API key not configured' 
            });
        }

        // Get the generative model (using Gemini 2.0 Flash)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            systemInstruction: SYSTEM_PROMPT
        });        // Prepare conversation history for context - only include customer messages to prevent self-conversation
        let conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            // Check if a ticket was recently created by looking for ticket creation responses
            const recentMessages = conversationHistory.slice(-10);
            const hasRecentTicketCreation = recentMessages.some(msg => 
                msg.sender === 'bot' && 
                (msg.text?.includes('TICKET DETAILS:') || msg.text?.includes('Ticket ID:'))
            );
            
            // If a ticket was recently created, only include messages after the ticket creation
            let messagesToInclude = conversationHistory;
            if (hasRecentTicketCreation) {
                // Find the last ticket creation message and only include customer messages after it
                for (let i = conversationHistory.length - 1; i >= 0; i--) {
                    const msg = conversationHistory[i];
                    if (msg.sender === 'bot' && 
                        (msg.text?.includes('TICKET DETAILS:') || msg.text?.includes('Ticket ID:'))) {
                        // Only include messages after this ticket creation
                        messagesToInclude = conversationHistory.slice(i + 1);
                        break;
                    }
                }
            }
            
            // Filter to only include user messages and limit to recent ones
            const customerMessages = messagesToInclude
                .filter(msg => msg.sender === 'user' && msg.text && msg.text.trim()) // Only customer messages
                .slice(-3); // Keep last 3 customer messages for context (reduced from 5)
            
            if (customerMessages.length > 0) {
                conversationContext = customerMessages
                    .map(msg => `Previous customer message: ${msg.text}`)
                    .join('\n') + '\n';
            }
        }

        // Combine context with current message
        const fullPrompt = conversationContext + `Current customer message: ${message}`;
        
        // Debug logging (remove in production)
        console.log('Customer messages in context:', conversationHistory?.filter(msg => msg.sender === 'user').length);
        console.log('Filtered context messages:', conversationContext ? conversationContext.split('\n').length - 1 : 0);
        console.log('Current message:', message);
        console.log('Full prompt:', fullPrompt);

        // Generate response
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const botReply = response.text();        // Check if the AI wants to create a ticket
        if (botReply.includes('TICKET_READY:')) {
            const ticketMatch = botReply.match(/TICKET_READY:\s*({[^}]+})/);
            if (ticketMatch) {
                try {
                    const ticketData = JSON.parse(ticketMatch[1]);
                    
                    if (userId) {
                        // Authenticated user - create ticket with user ID
                        const categoryMap = {
                            'General': 1,
                            'Billing': 2,
                            'IT Support': 3
                        };
                        
                        const categoryId = categoryMap[ticketData.category] || 1;
                        
                        // Create the ticket
                        const ticket = await Ticket.create({
                            user_id: userId,
                            category_id: categoryId,
                            status_id: 1, // Pending status
                            subject: ticketData.title,
                            description: ticketData.description
                        });                        // Return success response with ticket information
                        const cleanReply = botReply.replace(/TICKET_READY:[^}]+}/, '').trim();
                        const ticketCreatedMessage = `Great! I've successfully created your support ticket.

TICKET DETAILS:
- Ticket ID: TKT-${ticket.id.toString().padStart(3, '0')}
- Title: ${ticketData.title}
- Category: ${ticketData.category}
- Status: Pending

Our support team will review your ticket and respond as soon as possible. You can track the progress of your ticket in the "View Tickets" section of your account.`;
                        
                        return res.json({
                            success: true,
                            message: cleanReply + (cleanReply ? '\n\n' : '') + ticketCreatedMessage,
                            timestamp: new Date().toISOString(),
                            ticketCreated: true,
                            ticket: {
                                id: `TKT-${ticket.id.toString().padStart(3, '0')}`,
                                title: ticketData.title,
                                category: ticketData.category,
                                status: 'Pending',
                                createdAt: ticket.createdAt
                            }
                        });                    } else {
                        // Guest user - check if email is available in ticket data or conversation
                        let guestEmail = null;
                        
                        // Try to extract email from ticket data or conversation history
                        if (ticketData.email && ticketData.email.includes('@')) {
                            guestEmail = ticketData.email;                        } else {
                            // Look for email in conversation history
                            const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
                            for (const msg of conversationHistory) {
                                const emailMatch = msg.text?.match(emailPattern);
                                if (emailMatch) {
                                    guestEmail = emailMatch[1];
                                    break;
                                }
                            }
                        }
                        
                        if (guestEmail) {
                            try {
                                // Create guest user and ticket using the same logic as guestAuthZ
                                let guestUser = await User.findOne({
                                    where: { email: guestEmail },
                                    raw: true
                                });
                                
                                if (guestUser && !guestUser.is_guest) {
                                    // Email belongs to a registered user
                                    const cleanReply = botReply.replace(/TICKET_READY:[^}]+}/, '').trim();
                                    const loginMessage = `I found that your email (${guestEmail}) is already registered with us. Please log in to create this ticket, or use a different email address if this isn't your account.`;
                                    
                                    return res.json({
                                        success: true,
                                        message: cleanReply + (cleanReply ? '\n\n' : '') + loginMessage,
                                        timestamp: new Date().toISOString(),
                                        requiresAuth: true,
                                        ticketData: ticketData
                                    });
                                }
                                
                                if (!guestUser) {
                                    // Create new guest user
                                    guestUser = await User.create({
                                        email: guestEmail,
                                        is_guest: true
                                    }, { raw: true });
                                    
                                    console.log('Created guest user:', guestUser);
                                }
                                
                                // Map category to ID
                                const categoryMap = {
                                    'General': 1,
                                    'Billing': 2,
                                    'IT Support': 3
                                };
                                const categoryId = categoryMap[ticketData.category] || 1;
                                
                                // Create the ticket for guest user
                                const ticket = await Ticket.create({
                                    user_id: guestUser.id,
                                    category_id: categoryId,
                                    status_id: 1, // Pending status
                                    subject: ticketData.title,
                                    description: ticketData.description
                                });
                                
                                console.log('Created guest ticket:', ticket);
                                  // Return success response
                                const cleanReply = botReply.replace(/TICKET_READY:[^}]+}/, '').trim();
                                const ticketCreatedMessage = `Great! I've successfully created your support ticket as a guest submission.

TICKET DETAILS:
- Ticket ID: TKT-${ticket.id.toString().padStart(3, '0')}
- Title: ${ticketData.title}
- Category: ${ticketData.category}
- Status: Pending
- Contact Email: ${guestEmail}

Our support team will review your ticket and respond to your email address. Since this is a guest submission, you won't be able to track it online, but you'll receive all updates via email.

TIP: Create an account to track your tickets online and have live conversations with our support team!`;
                                
                                return res.json({
                                    success: true,
                                    message: cleanReply + (cleanReply ? '\n\n' : '') + ticketCreatedMessage,
                                    timestamp: new Date().toISOString(),
                                    ticketCreated: true,
                                    ticket: {
                                        id: `TKT-${ticket.id.toString().padStart(3, '0')}`,
                                        title: ticketData.title,
                                        category: ticketData.category,
                                        status: 'Pending',
                                        email: guestEmail,
                                        createdAt: ticket.createdAt
                                    }
                                });
                                
                            } catch (guestTicketError) {
                                console.error('Error creating guest ticket:', guestTicketError);
                                const errorMessage = "I apologize, but I encountered an error while creating your guest ticket. Please try submitting your ticket manually through the 'Submit Ticket' page, or try again in a moment.";
                                return res.json({
                                    success: true,
                                    message: errorMessage,
                                    timestamp: new Date().toISOString(),
                                    ticketCreated: false
                                });
                            }
                        } else {                            // No email found - ask for email to create guest ticket
                            const cleanReply = botReply.replace(/TICKET_READY:[^}]+}/, '').trim();
                            const emailRequestMessage = `I have all the information needed for your ticket:

TICKET SUMMARY:
- Title: ${ticketData.title}
- Category: ${ticketData.category}
- Description: ${ticketData.description}

To create this ticket, I'll need your email address so our support team can contact you. Please provide your email address and I'll create the ticket immediately.

Alternatively, you can:
1. Create an account for a better experience with online ticket tracking
2. Log in if you already have an account
3. Submit this ticket manually through our 'Submit Ticket' page`;
                            
                            return res.json({
                                success: true,
                                message: cleanReply + (cleanReply ? '\n\n' : '') + emailRequestMessage,
                                timestamp: new Date().toISOString(),
                                requiresAuth: false,
                                ticketData: ticketData,
                                needsEmail: true
                            });
                        }
                    }
                } catch (ticketError) {
                    console.error('Error creating ticket:', ticketError);
                    const errorMessage = "I apologize, but I encountered an error while creating your ticket. Please try submitting your ticket manually through the 'Submit Ticket' page, or try again in a moment.";
                    return res.json({
                        success: true,
                        message: errorMessage,
                        timestamp: new Date().toISOString(),
                        ticketCreated: false
                    });
                }
            }
        }

        // Regular response without ticket creation
        res.json({
            success: true,
            message: botReply,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        
        // Handle specific API errors
        if (error.message.includes('API_KEY_INVALID')) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key configuration'
            });
        }
        
        if (error.message.includes('QUOTA_EXCEEDED')) {
            return res.status(429).json({
                success: false,
                error: 'API quota exceeded. Please try again later.'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Sorry, I\'m experiencing technical difficulties. Please try again later.'
        });
    }
};

export {
    sendMessage
};
