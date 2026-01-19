// src/data/codeExamples.ts

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  typescript: string;
  javascript: string;
  services: string[];
  features: string[];
}

const codeExamples: CodeExample[] = [
  {
    id: 'unified-client',
    title: 'Unified API Client',
    description: 'Initialize multiple API services with built-in caching, error handling, and retry logic for production applications.',
    category: 'Getting Started',
    difficulty: 'beginner',
    services: ['ChatGPT', 'Stripe', 'Slack'],
    features: ['Error Handling', 'Caching', 'Retry Logic', 'TypeScript'],
    typescript: `import { MacroAPIClient, ChatGPT, StripeAPI, SlackAPI } from 'macro_api';

// Initialize unified client with caching and error handling
const client = new MacroAPIClient({
  cache: {
    type: 'hybrid',
    ttl: 3600, // 1 hour
    redis: { url: process.env.REDIS_URL }
  },
  retries: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
});

// Initialize API services
const chatgpt = new ChatGPT({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

const stripe = new StripeAPI({ 
  secretKey: process.env.STRIPE_SECRET_KEY! 
});

const slack = new SlackAPI({ 
  botToken: process.env.SLACK_BOT_TOKEN! 
});

// Use with automatic error handling and caching
async function processCustomerQuery(query: string, customerId: string) {
  try {
    // Generate AI response with caching
    const aiResponse = await client.execute(
      () => chatgpt.chat(query, "You are a helpful customer service assistant."),
      {
        service: 'openai',
        method: 'chat',
        params: { query, context: 'customer_service' },
        cacheTtl: 1800 // 30 minutes
      }
    );

    // Get customer data
    const customer = await client.execute(
      () => stripe.getCustomer(customerId),
      {
        service: 'stripe',
        method: 'getCustomer',
        params: { customerId }
      }
    );

    // Send notification to support channel
    await slack.sendMessage('#customer-support', 
      \`New query from \${customer.email}: \${aiResponse}\`
    );

    return {
      response: aiResponse,
      customer: customer,
      status: 'success'
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}`,
    javascript: `const { MacroAPIClient, ChatGPT, StripeAPI, SlackAPI } = require('macro_api');

// Initialize unified client with caching and error handling
const client = new MacroAPIClient({
  cache: {
    type: 'hybrid',
    ttl: 3600, // 1 hour
    redis: { url: process.env.REDIS_URL }
  },
  retries: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
});

// Initialize API services
const chatgpt = new ChatGPT({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const stripe = new StripeAPI({ 
  secretKey: process.env.STRIPE_SECRET_KEY 
});

const slack = new SlackAPI({ 
  botToken: process.env.SLACK_BOT_TOKEN 
});

// Use with automatic error handling and caching
async function processCustomerQuery(query, customerId) {
  try {
    // Generate AI response with caching
    const aiResponse = await client.execute(
      () => chatgpt.chat(query, "You are a helpful customer service assistant."),
      {
        service: 'openai',
        method: 'chat',
        params: { query, context: 'customer_service' },
        cacheTtl: 1800 // 30 minutes
      }
    );

    // Get customer data
    const customer = await client.execute(
      () => stripe.getCustomer(customerId),
      {
        service: 'stripe',
        method: 'getCustomer',
        params: { customerId }
      }
    );

    // Send notification to support channel
    await slack.sendMessage('#customer-support', 
      \`New query from \${customer.email}: \${aiResponse}\`
    );

    return {
      response: aiResponse,
      customer: customer,
      status: 'success'
    };
  } catch (error) {
    console.error('Error processing query:', error);
    throw error;
  }
}`
  },
  {
    id: 'ai-content-generation',
    title: 'AI Content Generation',
    description: 'Generate blog posts, code, and marketing content using ChatGPT and DeepSeek with streaming responses.',
    category: 'AI & Machine Learning',
    difficulty: 'intermediate',
    services: ['ChatGPT', 'DeepSeek'],
    features: ['Streaming', 'Function Calling', 'Content Generation'],
    typescript: `import { ChatGPT, DeepSeek } from 'macro_api';

interface ContentRequest {
  topic: string;
  type: 'blog' | 'code' | 'marketing';
  length: 'short' | 'medium' | 'long';
  audience: 'technical' | 'general' | 'business';
}

class ContentGenerator {
  private chatgpt: ChatGPT;
  private deepseek: DeepSeek;

  constructor() {
    this.chatgpt = new ChatGPT({ 
      apiKey: process.env.OPENAI_API_KEY! 
    });
    this.deepseek = new DeepSeek({ 
      apiKey: process.env.DEEPSEEK_API_KEY! 
    });
  }

  async generateBlogPost(request: ContentRequest): Promise<string> {
    const systemPrompt = \`You are an expert content writer. Create engaging \${request.length} blog posts for \${request.audience} audiences.\`;
    
    const prompt = \`Write a \${request.length} blog post about "\${request.topic}" targeting a \${request.audience} audience. Include:
    - Engaging introduction
    - 3-5 main points with examples
    - Actionable conclusion
    - SEO-friendly structure\`;

    return await this.chatgpt.chat(prompt, systemPrompt, 'gpt-4');
  }

  async generateCode(language: string, description: string): Promise<string> {
    const prompt = \`Generate \${language} code for: \${description}\`;
    
    const response = await this.deepseek.generateCode(prompt, {
      model: 'deepseek-coder-33b-instruct',
      temperature: 0.2,
      max_tokens: 2048
    });

    return response.choices[0].text;
  }

  async streamingGeneration(
    prompt: string, 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.chatgpt.createStreamingChatCompletion(
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      },
      (data) => {
        const chunk = data.choices?.[0]?.delta?.content;
        if (chunk) {
          onChunk(chunk);
        }
      },
      (error) => console.error('Streaming error:', error),
      () => console.log('Streaming complete')
    );
  }

  async generateWithFunctions(topic: string): Promise<any> {
    const functions = [
      {
        name: 'research_topic',
        description: 'Research a topic for accurate information',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            depth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'] }
          }
        }
      }
    ];

    return await this.chatgpt.withFunctions(
      \`Create content about "\${topic}" using the research function.\`,
      functions
    );
  }
}

// Usage example
const generator = new ContentGenerator();

// Generate blog post
const blogPost = await generator.generateBlogPost({
  topic: "Machine Learning in Web Development",
  type: "blog",
  length: "medium", 
  audience: "technical"
});

// Generate code
const pythonCode = await generator.generateCode(
  "Python",
  "Create a REST API with FastAPI for user authentication"
);

// Streaming content generation
await generator.streamingGeneration(
  "Explain quantum computing in simple terms",
  (chunk) => process.stdout.write(chunk)
);`,
    javascript: `const { ChatGPT, DeepSeek } = require('macro_api');

class ContentGenerator {
  constructor() {
    this.chatgpt = new ChatGPT({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    this.deepseek = new DeepSeek({ 
      apiKey: process.env.DEEPSEEK_API_KEY 
    });
  }

  async generateBlogPost(request) {
    const systemPrompt = \`You are an expert content writer. Create engaging \${request.length} blog posts for \${request.audience} audiences.\`;
    
    const prompt = \`Write a \${request.length} blog post about "\${request.topic}" targeting a \${request.audience} audience. Include:
    - Engaging introduction
    - 3-5 main points with examples
    - Actionable conclusion
    - SEO-friendly structure\`;

    return await this.chatgpt.chat(prompt, systemPrompt, 'gpt-4');
  }

  async generateCode(language, description) {
    const prompt = \`Generate \${language} code for: \${description}\`;
    
    const response = await this.deepseek.generateCode(prompt, {
      model: 'deepseek-coder-33b-instruct',
      temperature: 0.2,
      max_tokens: 2048
    });

    return response.choices[0].text;
  }

  async streamingGeneration(prompt, onChunk) {
    await this.chatgpt.createStreamingChatCompletion(
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      },
      (data) => {
        const chunk = data.choices?.[0]?.delta?.content;
        if (chunk) {
          onChunk(chunk);
        }
      },
      (error) => console.error('Streaming error:', error),
      () => console.log('Streaming complete')
    );
  }
}

// Usage example
const generator = new ContentGenerator();

// Generate blog post
const blogPost = await generator.generateBlogPost({
  topic: "Machine Learning in Web Development",
  type: "blog",
  length: "medium", 
  audience: "technical"
});

// Generate code
const pythonCode = await generator.generateCode(
  "Python",
  "Create a REST API with FastAPI for user authentication"
);`
  },
  {
    id: 'payment-processing',
    title: 'Payment Processing System',
    description: 'Complete payment system with Stripe and PayPal integration, webhook handling, and subscription management.',
    category: 'Payment & Commerce',
    difficulty: 'advanced',
    services: ['Stripe', 'PayPal', 'SendGrid'],
    features: ['Webhooks', 'Subscriptions', 'Email Notifications', 'Error Handling'],
    typescript: `import { StripeAPI, PayPalAPI, SendGridAPI, RateLimitError, AuthenticationError } from 'macro_api';

interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  description: string;
  paymentMethod: 'stripe' | 'paypal';
  metadata?: Record<string, string>;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

class PaymentProcessor {
  private stripe: StripeAPI;
  private paypal: PayPalAPI;
  private sendgrid: SendGridAPI;

  constructor() {
    this.stripe = new StripeAPI({ 
      secretKey: process.env.STRIPE_SECRET_KEY! 
    });
    this.paypal = new PayPalAPI({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
      sandbox: process.env.NODE_ENV === 'development'
    });
    this.sendgrid = new SendGridAPI({
      apiKey: process.env.SENDGRID_API_KEY!
    });
  }

  async processPayment(request: PaymentRequest): Promise<any> {
    try {
      if (request.paymentMethod === 'stripe') {
        return await this.processStripePayment(request);
      } else {
        return await this.processPayPalPayment(request);
      }
    } catch (error) {
      await this.handlePaymentError(error, request);
      throw error;
    }
  }

  private async processStripePayment(request: PaymentRequest): Promise<any> {
    // Create payment intent
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: request.amount * 100, // Convert to cents
      currency: request.currency,
      customer: request.customerId,
      description: request.description,
      metadata: request.metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Send confirmation email
    await this.sendPaymentConfirmation(request.customerId, paymentIntent);

    return {
      provider: 'stripe',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    };
  }

  private async processPayPalPayment(request: PaymentRequest): Promise<any> {
    const order = await this.paypal.createOrder({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: request.currency.toUpperCase(),
          value: request.amount.toString()
        },
        description: request.description,
        custom_id: request.customerId
      }],
      application_context: {
        return_url: \`\${process.env.BASE_URL}/payment/success\`,
        cancel_url: \`\${process.env.BASE_URL}/payment/cancel\`
      }
    });

    return {
      provider: 'paypal',
      orderId: order.id,
      approvalUrl: order.links?.find(link => link.rel === 'approve')?.href
    };
  }

  async createSubscription(
    customerId: string, 
    plan: SubscriptionPlan,
    paymentMethod?: string
  ): Promise<any> {
    // Create product and price
    const product = await this.stripe.createProduct({
      name: plan.name,
      description: \`\${plan.name} subscription plan\`
    });

    const price = await this.stripe.createPrice({
      unit_amount: plan.price * 100,
      currency: plan.currency,
      product: product.id,
      recurring: {
        interval: plan.interval
      }
    });

    // Create subscription
    const subscription = await this.stripe.createSubscription({
      customer: customerId,
      items: [{ price: price.id }],
      default_payment_method: paymentMethod,
      trial_period_days: 14, // 14-day free trial
      metadata: {
        plan_name: plan.name,
        features: JSON.stringify(plan.features)
      }
    });

    // Send welcome email
    await this.sendSubscriptionWelcome(customerId, plan, subscription);

    return subscription;
  }

  async handleWebhook(payload: string, signature: string, provider: 'stripe' | 'paypal'): Promise<void> {
    try {
      if (provider === 'stripe') {
        const event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );

        switch (event.type) {
          case 'payment_intent.succeeded':
            await this.handlePaymentSuccess(event.data.object);
            break;
          case 'payment_intent.payment_failed':
            await this.handlePaymentFailure(event.data.object);
            break;
          case 'customer.subscription.created':
            await this.handleSubscriptionCreated(event.data.object);
            break;
          case 'customer.subscription.deleted':
            await this.handleSubscriptionCanceled(event.data.object);
            break;
        }
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  private async sendPaymentConfirmation(customerId: string, paymentIntent: any): Promise<void> {
    const customer = await this.stripe.getCustomer(customerId);
    
    await this.sendgrid.sendEmail({
      to: customer.email,
      subject: 'Payment Confirmation',
      templateId: 'd-payment-confirmation-template',
      dynamicTemplateData: {
        customer_name: customer.name,
        amount: (paymentIntent.amount / 100).toFixed(2),
        currency: paymentIntent.currency.toUpperCase(),
        payment_id: paymentIntent.id
      }
    });
  }

  private async sendSubscriptionWelcome(
    customerId: string, 
    plan: SubscriptionPlan, 
    subscription: any
  ): Promise<void> {
    const customer = await this.stripe.getCustomer(customerId);
    
    await this.sendgrid.sendEmail({
      to: customer.email,
      subject: \`Welcome to \${plan.name}!\`,
      templateId: 'd-subscription-welcome-template',
      dynamicTemplateData: {
        customer_name: customer.name,
        plan_name: plan.name,
        features: plan.features,
        trial_end: subscription.trial_end,
        manage_url: \`\${process.env.BASE_URL}/account/subscription\`
      }
    });
  }

  private async handlePaymentError(error: any, request: PaymentRequest): Promise<void> {
    let errorType = 'unknown';
    
    if (error instanceof RateLimitError) {
      errorType = 'rate_limit';
    } else if (error instanceof AuthenticationError) {
      errorType = 'authentication';
    }

    console.error('Payment processing error:', {
      type: errorType,
      request,
      error: error.message
    });

    // Log to monitoring service
    // await this.logError(error, request);
  }
}

// Usage example
const processor = new PaymentProcessor();

// Process one-time payment
const payment = await processor.processPayment({
  amount: 29.99,
  currency: 'usd',
  customerId: 'cus_customer123',
  description: 'Premium Course Access',
  paymentMethod: 'stripe',
  metadata: {
    course_id: 'course_123',
    user_id: 'user_456'
  }
});

// Create subscription
const subscription = await processor.createSubscription(
  'cus_customer123',
  {
    name: 'Pro Plan',
    price: 19.99,
    currency: 'usd',
    interval: 'month',
    features: ['Unlimited API calls', 'Priority support', 'Advanced analytics']
  }
);`,
    javascript: `const { StripeAPI, PayPalAPI, SendGridAPI, RateLimitError, AuthenticationError } = require('macro_api');

class PaymentProcessor {
  constructor() {
    this.stripe = new StripeAPI({ 
      secretKey: process.env.STRIPE_SECRET_KEY 
    });
    this.paypal = new PayPalAPI({
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      sandbox: process.env.NODE_ENV === 'development'
    });
    this.sendgrid = new SendGridAPI({
      apiKey: process.env.SENDGRID_API_KEY
    });
  }

  async processPayment(request) {
    try {
      if (request.paymentMethod === 'stripe') {
        return await this.processStripePayment(request);
      } else {
        return await this.processPayPalPayment(request);
      }
    } catch (error) {
      await this.handlePaymentError(error, request);
      throw error;
    }
  }

  async processStripePayment(request) {
    // Create payment intent
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: request.amount * 100, // Convert to cents
      currency: request.currency,
      customer: request.customerId,
      description: request.description,
      metadata: request.metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Send confirmation email
    await this.sendPaymentConfirmation(request.customerId, paymentIntent);

    return {
      provider: 'stripe',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    };
  }
}

// Usage example
const processor = new PaymentProcessor();

const payment = await processor.processPayment({
  amount: 29.99,
  currency: 'usd',
  customerId: 'cus_customer123',
  description: 'Premium Course Access',
  paymentMethod: 'stripe'
});`
  },
  {
    id: 'communication-automation',
    title: 'Communication Automation',
    description: 'Automate team communication with Slack bots, email campaigns, and intelligent notifications.',
    category: 'Communication & Social',
    difficulty: 'intermediate',
    services: ['Slack', 'SendGrid', 'ChatGPT'],
    features: ['Slash Commands', 'Email Templates', 'AI Integration'],
    typescript: `import { SlackAPI, SendGridAPI, ChatGPT } from 'macro_api';

interface NotificationConfig {
  channels: string[];
  emailLists: string[];
  urgency: 'low' | 'medium' | 'high';
  includeAISummary: boolean;
}

class CommunicationHub {
  private slack: SlackAPI;
  private sendgrid: SendGridAPI;
  private chatgpt: ChatGPT;

  constructor() {
    this.slack = new SlackAPI({ 
      botToken: process.env.SLACK_BOT_TOKEN! 
    });
    this.sendgrid = new SendGridAPI({
      apiKey: process.env.SENDGRID_API_KEY!
    });
    this.chatgpt = new ChatGPT({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  async createSlackBot(): Promise<void> {
    // Set up slash command handlers
    await this.setupSlashCommands();
    
    // Monitor channels for keywords
    await this.setupKeywordMonitoring();
  }

  private async setupSlashCommands(): Promise<void> {
    // Example: /deploy command
    const deployCommand = async (payload: any) => {
      const { text, user_id, channel_id } = payload;
      
      try {
        // Send immediate response
        await this.slack.sendMessage(channel_id, 
          \`🚀 Starting deployment of \${text}...\`, 
          { thread_ts: payload.ts }
        );

        // Simulate deployment process
        await this.simulateDeployment(text);
        
        // Send success message
        await this.slack.sendMessage(channel_id,
          \`✅ Deployment of \${text} completed successfully!\`,
          { 
            thread_ts: payload.ts,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: \`*Deployment Summary*\\n• Service: \${text}\\n• Status: ✅ Success\\n• Duration: 2m 34s\`
                }
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: 'View Logs' },
                    url: \`https://dashboard.example.com/deployments/\${text}\`
                  }
                ]
              }
            ]
          }
        );
      } catch (error) {
        await this.slack.sendMessage(channel_id,
          \`❌ Deployment failed: \${error.message}\`
        );
      }
    };

    // Register command handler
    // Note: In a real application, you'd set up a web server to handle webhooks
    console.log('Slash command handlers registered');
  }

  async sendIntelligentNotification(
    title: string,
    content: string,
    config: NotificationConfig
  ): Promise<void> {
    let processedContent = content;
    
    // Generate AI summary if requested
    if (config.includeAISummary) {
      const summary = await this.chatgpt.chat(
        \`Summarize this notification in 2-3 bullet points:\\n\\n\${content}\`,
        'You are a concise communication assistant.'
      );
      processedContent = \`📋 **AI Summary:**\\n\${summary}\\n\\n📄 **Full Details:**\\n\${content}\`;
    }

    // Send to Slack channels
    for (const channel of config.channels) {
      await this.sendSlackNotification(channel, title, processedContent, config.urgency);
    }

    // Send email notifications
    if (config.emailLists.length > 0) {
      await this.sendEmailNotification(title, processedContent, config);
    }
  }

  private async sendSlackNotification(
    channel: string, 
    title: string, 
    content: string, 
    urgency: string
  ): Promise<void> {
    const urgencyEmoji = {
      low: '💭',
      medium: '⚠️',
      high: '🚨'
    };

    const urgencyColor = {
      low: '#36a64f',
      medium: '#ff9500', 
      high: '#ff0000'
    };

    await this.slack.sendMessage(channel, '', {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: \`\${urgencyEmoji[urgency]} \${title}\`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: content
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: \`Urgency: *\${urgency.toUpperCase()}* | \${new Date().toLocaleString()}\`
            }
          ]
        }
      ]
    });
  }

  private async sendEmailNotification(
    title: string,
    content: string,
    config: NotificationConfig
  ): Promise<void> {
    const emailContent = content.replace(/\\*/g, ''); // Remove markdown
    
    for (const listId of config.emailLists) {
      await this.sendgrid.sendEmail({
        to: \`list-\${listId}@company.com\`,
        subject: title,
        html: \`
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #333;">\${title}</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              \${emailContent.replace(/\\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Sent via macro_api Communication Hub
            </p>
          </div>
        \`
      });
    }
  }

  async createScheduledCampaign(
    subject: string,
    templateId: string,
    audienceId: string,
    scheduleTime: Date,
    personalizations: Record<string, any>[]
  ): Promise<void> {
    // Create email template with dynamic content
    const template = await this.sendgrid.createTemplate(
      \`Campaign: \${subject}\`,
      'dynamic'
    );

    // Schedule the campaign
    const scheduledEmail = await this.sendgrid.scheduleEmail({
      to: personalizations.map(p => p.email),
      subject,
      templateId,
      dynamicTemplateData: personalizations
    }, scheduleTime);

    // Notify team about scheduled campaign
    await this.slack.sendMessage('#marketing',
      \`📧 Email campaign "\${subject}" scheduled for \${scheduleTime.toLocaleString()}\`,
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: \`*Campaign Details*\\n• Subject: \${subject}\\n• Recipients: \${personalizations.length}\\n• Send Time: \${scheduleTime.toLocaleString()}\`
            }
          }
        ]
      }
    );
  }

  private async simulateDeployment(service: string): Promise<void> {
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async setupAlertSystem(): Promise<void> {
    // Monitor system health and send alerts
    setInterval(async () => {
      const systemHealth = await this.checkSystemHealth();
      
      if (systemHealth.status === 'critical') {
        await this.sendIntelligentNotification(
          '🚨 Critical System Alert',
          \`System health check failed:\\n• CPU: \${systemHealth.cpu}%\\n• Memory: \${systemHealth.memory}%\\n• Disk: \${systemHealth.disk}%\`,
          {
            channels: ['#alerts', '#engineering'],
            emailLists: ['on-call'],
            urgency: 'high',
            includeAISummary: false
          }
        );
      }
    }, 300000); // Check every 5 minutes
  }

  private async checkSystemHealth(): Promise<any> {
    // Mock system health check
    return {
      status: Math.random() > 0.95 ? 'critical' : 'healthy',
      cpu: Math.round(Math.random() * 100),
      memory: Math.round(Math.random() * 100),
      disk: Math.round(Math.random() * 100)
    };
  }
}

// Usage example
const commsHub = new CommunicationHub();

// Set up the communication system
await commsHub.createSlackBot();
await commsHub.setupAlertSystem();

// Send intelligent notification
await commsHub.sendIntelligentNotification(
  'Weekly Product Update',
  \`This week we launched 3 new features, fixed 12 bugs, and improved performance by 25%. User engagement is up 15% compared to last week.\`,
  {
    channels: ['#general', '#product-updates'],
    emailLists: ['all-hands', 'stakeholders'],
    urgency: 'medium',
    includeAISummary: true
  }
);

// Schedule email campaign
await commsHub.createScheduledCampaign(
  'New Feature Announcement',
  'd-feature-announcement',
  'all-users',
  new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  [
    { email: 'user1@example.com', name: 'John', feature: 'Smart Analytics' },
    { email: 'user2@example.com', name: 'Jane', feature: 'Advanced Search' }
  ]
);`,
    javascript: `const { SlackAPI, SendGridAPI, ChatGPT } = require('macro_api');

class CommunicationHub {
  constructor() {
    this.slack = new SlackAPI({ 
      botToken: process.env.SLACK_BOT_TOKEN 
    });
    this.sendgrid = new SendGridAPI({
      apiKey: process.env.SENDGRID_API_KEY
    });
    this.chatgpt = new ChatGPT({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async sendIntelligentNotification(title, content, config) {
    let processedContent = content;
    
    // Generate AI summary if requested
    if (config.includeAISummary) {
      const summary = await this.chatgpt.chat(
        \`Summarize this notification in 2-3 bullet points:\\n\\n\${content}\`,
        'You are a concise communication assistant.'
      );
      processedContent = \`📋 **AI Summary:**\\n\${summary}\\n\\n📄 **Full Details:**\\n\${content}\`;
    }

    // Send to Slack channels
    for (const channel of config.channels) {
      await this.sendSlackNotification(channel, title, processedContent, config.urgency);
    }

    // Send email notifications
    if (config.emailLists.length > 0) {
      await this.sendEmailNotification(title, processedContent, config);
    }
  }

  async sendSlackNotification(channel, title, content, urgency) {
    const urgencyEmoji = {
      low: '💭',
      medium: '⚠️',
      high: '🚨'
    };

    await this.slack.sendMessage(channel, '', {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: \`\${urgencyEmoji[urgency]} \${title}\`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: content
          }
        }
      ]
    });
  }
}

// Usage
const commsHub = new CommunicationHub();

await commsHub.sendIntelligentNotification(
  'Weekly Product Update',
  'This week we launched 3 new features and improved performance by 25%.',
  {
    channels: ['#general', '#product-updates'],
    emailLists: ['all-hands'],
    urgency: 'medium',
    includeAISummary: true
  }
);`
  },
  {
    id: 'cloud-deployment',
    title: 'Cloud Deployment Pipeline',
    description: 'Automated deployment pipeline using Vercel, Docker Hub, and AWS S3 with comprehensive monitoring.',
    category: 'Development & Cloud',
    difficulty: 'advanced',
    services: ['Vercel', 'DockerHub', 'S3', 'GitHub', 'Slack'],
    features: ['CI/CD', 'Container Registry', 'File Storage', 'Webhooks'],
    typescript: `import { VercelAPI, DockerHubAPI, S3API, GitHubAPI, SlackAPI } from 'macro_api';
import { createReadStream } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  projectName: string;
  environment: 'staging' | 'production';
  gitBranch: string;
  dockerImage?: string;
  envVars: Record<string, string>;
  domains?: string[];
}

interface BuildArtifact {
  name: string;
  path: string;
  type: 'build' | 'asset' | 'config';
}

class CloudDeploymentPipeline {
  private vercel: VercelAPI;
  private dockerhub: DockerHubAPI;
  private s3: S3API;
  private github: GitHubAPI;
  private slack: SlackAPI;

  constructor() {
    this.vercel = new VercelAPI({
      accessToken: process.env.VERCEL_TOKEN!
    });
    this.dockerhub = new DockerHubAPI({
      token: process.env.DOCKER_TOKEN!
    });
    this.s3 = new S3API({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      bucketName: process.env.S3_BUCKET!
    });
    this.github = new GitHubAPI({
      token: process.env.GITHUB_TOKEN!
    });
    this.slack = new SlackAPI({
      botToken: process.env.SLACK_BOT_TOKEN!
    });
  }

  async deployApplication(config: DeploymentConfig): Promise<string> {
    const deploymentId = \`deploy-\${Date.now()}\`;
    
    try {
      // Notify start of deployment
      await this.notifyDeploymentStart(config, deploymentId);
      
      // Step 1: Build and push Docker image if specified
      if (config.dockerImage) {
        await this.buildAndPushImage(config);
      }
      
      // Step 2: Upload build artifacts to S3
      const artifacts = await this.uploadBuildArtifacts(config, deploymentId);
      
      // Step 3: Deploy to Vercel
      const deployment = await this.deployToVercel(config, artifacts);
      
      // Step 4: Configure domains
      if (config.domains) {
        await this.configureDomains(deployment.projectId, config.domains);
      }
      
      // Step 5: Wait for deployment to complete
      const finalDeployment = await this.vercel.waitForDeployment(
        deployment.uid, 
        600000 // 10 minutes timeout
      );
      
      // Step 6: Run post-deployment tests
      await this.runPostDeploymentTests(finalDeployment.url);
      
      // Step 7: Update GitHub deployment status
      await this.updateGitHubDeploymentStatus(config, finalDeployment.url, 'success');
      
      // Step 8: Notify successful deployment
      await this.notifyDeploymentSuccess(config, finalDeployment);
      
      return finalDeployment.url;
      
    } catch (error) {
      await this.handleDeploymentFailure(config, deploymentId, error);
      throw error;
    }
  }

  private async buildAndPushImage(config: DeploymentConfig): Promise<void> {
    const imageName = \`\${config.projectName}:\${config.environment}-\${Date.now()}\`;
    
    // Check if repository exists
    const repoExists = await this.dockerhub.repositoryExists(config.projectName);
    
    if (!repoExists) {
      await this.dockerhub.createRepository(config.projectName, {
        description: \`\${config.projectName} \${config.environment} environment\`,
        isPrivate: config.environment === 'production'
      });
    }
    
    // In a real implementation, you'd trigger a build process here
    console.log(\`Building Docker image: \${imageName}\`);
    
    // Simulate build time
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log(\`Pushed Docker image: \${imageName}\`);
  }

  private async uploadBuildArtifacts(
    config: DeploymentConfig, 
    deploymentId: string
  ): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [
      { name: 'build.zip', path: '/tmp/build.zip', type: 'build' },
      { name: 'assets.tar.gz', path: '/tmp/assets.tar.gz', type: 'asset' },
      { name: 'config.json', path: '/tmp/config.json', type: 'config' }
    ];
    
    for (const artifact of artifacts) {
      const key = \`deployments/\${deploymentId}/\${artifact.name}\`;
      
      // Create mock file content
      const content = Buffer.from(\`Mock \${artifact.type} artifact for \${config.projectName}\`);
      
      const uploadResult = await this.s3.uploadObject(key, content, {
        contentType: this.getContentType(artifact.name),
        metadata: {
          deployment_id: deploymentId,
          project: config.projectName,
          environment: config.environment,
          type: artifact.type
        }
      });
      
      console.log(\`Uploaded artifact: \${artifact.name} to \${uploadResult.location}\`);
    }
    
    return artifacts;
  }

  private async deployToVercel(
    config: DeploymentConfig, 
    artifacts: BuildArtifact[]
  ): Promise<any> {
    // Check if project exists
    let project;
    try {
      project = await this.vercel.getProject(config.projectName);
    } catch (error) {
      // Create project if it doesn't exist
      project = await this.vercel.createProject(config.projectName, {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        outputDirectory: 'dist'
      });
    }
    
    // Set environment variables
    for (const [key, value] of Object.entries(config.envVars)) {
      await this.vercel.createEnvironmentVariable(
        project.id,
        key,
        value,
        config.environment === 'production' ? ['production'] : ['preview']
      );
    }
    
    // Create deployment
    const deployment = await this.vercel.createDeployment({
      name: config.projectName,
      gitSource: {
        type: 'github',
        repo: \`owner/\${config.projectName}\`,
        ref: config.gitBranch
      },
      env: config.envVars,
      regions: ['iad1', 'sfo1'], // Multiple regions for better performance
      functions: {
        'pages/api/**': {
          runtime: 'nodejs18.x',
          memory: 1024,
          maxDuration: 30
        }
      }
    });
    
    return deployment;
  }

  private async configureDomains(projectId: string, domains: string[]): Promise<void> {
    for (const domain of domains) {
      try {
        // Add domain to project
        await this.vercel.addDomain(projectId, domain);
        
        // Verify domain
        await this.vercel.verifyDomain(projectId, domain);
        
        console.log(\`Configured domain: \${domain}\`);
      } catch (error) {
        console.warn(\`Failed to configure domain \${domain}:\`, error);
      }
    }
  }

  private async runPostDeploymentTests(deploymentUrl: string): Promise<void> {
    console.log(\`Running post-deployment tests for \${deploymentUrl}\`);
    
    // Health check
    const healthResponse = await fetch(\`\${deploymentUrl}/api/health\`);
    if (!healthResponse.ok) {
      throw new Error(\`Health check failed: \${healthResponse.status}\`);
    }
    
    // Performance test
    const start = Date.now();
    await fetch(deploymentUrl);
    const loadTime = Date.now() - start;
    
    if (loadTime > 3000) {
      console.warn(\`Slow load time detected: \${loadTime}ms\`);
    }
    
    console.log('All post-deployment tests passed');
  }

  private async updateGitHubDeploymentStatus(
    config: DeploymentConfig,
    deploymentUrl: string,
    status: 'success' | 'failure'
  ): Promise<void> {
    // This would typically be done via GitHub's deployment API
    console.log(\`GitHub deployment status updated: \${status}\`);
  }

  private async notifyDeploymentStart(
    config: DeploymentConfig, 
    deploymentId: string
  ): Promise<void> {
    await this.slack.sendMessage('#deployments',
      \`🚀 Starting deployment of *\${config.projectName}* to *\${config.environment}*\`,
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: \`🚀 *Deployment Started*\\n• Project: \${config.projectName}\\n• Environment: \${config.environment}\\n• Branch: \${config.gitBranch}\\n• ID: \${deploymentId}\`
            }
          }
        ]
      }
    );
  }

  private async notifyDeploymentSuccess(
    config: DeploymentConfig, 
    deployment: any
  ): Promise<void> {
    await this.slack.sendMessage('#deployments',
      \`✅ Successfully deployed *\${config.projectName}* to *\${config.environment}*\`,
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: \`✅ *Deployment Successful*\\n• Project: \${config.projectName}\\n• Environment: \${config.environment}\\n• URL: \${deployment.url}\\n• Status: \${deployment.state}\`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Deployment' },
                url: deployment.url
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Logs' },
                url: \`https://vercel.com/deployments/\${deployment.uid}\`
              }
            ]
          }
        ]
      }
    );
  }

  private async handleDeploymentFailure(
    config: DeploymentConfig,
    deploymentId: string,
    error: any
  ): Promise<void> {
    await this.slack.sendMessage('#deployments',
      \`❌ Deployment of *\${config.projectName}* failed\`,
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: \`❌ *Deployment Failed*\\n• Project: \${config.projectName}\\n• Environment: \${config.environment}\\n• Error: \${error.message}\\n• ID: \${deploymentId}\`
            }
          }
        ]
      }
    );
    
    console.error('Deployment failed:', error);
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      'zip': 'application/zip',
      'gz': 'application/gzip',
      'json': 'application/json',
      'js': 'application/javascript',
      'css': 'text/css'
    };
    return types[ext || ''] || 'application/octet-stream';
  }

  async rollbackDeployment(projectName: string, targetVersion: string): Promise<void> {
    // Implementation for rollback functionality
    console.log(\`Rolling back \${projectName} to version \${targetVersion}\`);
  }

  async getDeploymentMetrics(deploymentUrl: string): Promise<any> {
    // Get performance metrics
    return {
      loadTime: Math.random() * 2000,
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 100,
      requestCount: Math.floor(Math.random() * 10000)
    };
  }
}

// Usage example
const pipeline = new CloudDeploymentPipeline();

// Deploy to staging
const stagingUrl = await pipeline.deployApplication({
  projectName: 'my-next-app',
  environment: 'staging',
  gitBranch: 'develop',
  dockerImage: 'my-next-app:staging',
  envVars: {
    NODE_ENV: 'staging',
    API_URL: 'https://api-staging.example.com',
    DATABASE_URL: process.env.STAGING_DB_URL!
  }
});

// Deploy to production
const productionUrl = await pipeline.deployApplication({
  projectName: 'my-next-app',
  environment: 'production',
  gitBranch: 'main',
  dockerImage: 'my-next-app:production',
  envVars: {
    NODE_ENV: 'production',
    API_URL: 'https://api.example.com',
    DATABASE_URL: process.env.PRODUCTION_DB_URL!
  },
  domains: ['app.example.com', 'www.app.example.com']
});

console.log(\`Staging deployed to: \${stagingUrl}\`);
console.log(\`Production deployed to: \${productionUrl}\`);`,
    javascript: `const { VercelAPI, DockerHubAPI, S3API, GitHubAPI, SlackAPI } = require('macro_api');

class CloudDeploymentPipeline {
  constructor() {
    this.vercel = new VercelAPI({
      accessToken: process.env.VERCEL_TOKEN
    });
    this.dockerhub = new DockerHubAPI({
      token: process.env.DOCKER_TOKEN
    });
    this.s3 = new S3API({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucketName: process.env.S3_BUCKET
    });
    this.slack = new SlackAPI({
      botToken: process.env.SLACK_BOT_TOKEN
    });
  }

  async deployApplication(config) {
    const deploymentId = \`deploy-\${Date.now()}\`;
    
    try {
      // Notify start
      await this.notifyDeploymentStart(config, deploymentId);
      
      // Upload artifacts to S3
      const artifacts = await this.uploadBuildArtifacts(config, deploymentId);
      
      // Deploy to Vercel
      const deployment = await this.deployToVercel(config, artifacts);
      
      // Wait for completion
      const finalDeployment = await this.vercel.waitForDeployment(deployment.uid, 600000);
      
      // Notify success
      await this.notifyDeploymentSuccess(config, finalDeployment);
      
      return finalDeployment.url;
      
    } catch (error) {
      await this.handleDeploymentFailure(config, deploymentId, error);
      throw error;
    }
  }

  async uploadBuildArtifacts(config, deploymentId) {
    const artifacts = [
      { name: 'build.zip', type: 'build' },
      { name: 'assets.tar.gz', type: 'asset' }
    ];
    
    for (const artifact of artifacts) {
      const key = \`deployments/\${deploymentId}/\${artifact.name}\`;
      const content = Buffer.from(\`Mock \${artifact.type} artifact\`);
      
      await this.s3.uploadObject(key, content, {
        metadata: {
          deployment_id: deploymentId,
          project: config.projectName,
          environment: config.environment
        }
      });
    }
    
    return artifacts;
  }
}

// Usage
const pipeline = new CloudDeploymentPipeline();

const deploymentUrl = await pipeline.deployApplication({
  projectName: 'my-app',
  environment: 'production',
  gitBranch: 'main',
  envVars: {
    NODE_ENV: 'production',
    API_URL: 'https://api.example.com'
  }
});`
  },
  {
    id: 'gaming-analytics',
    title: 'Gaming Analytics Dashboard',
    description: 'Comprehensive gaming analytics using Valorant API and Football API with real-time statistics and leaderboards.',
    category: 'Gaming & Entertainment',
    difficulty: 'intermediate',
    services: ['Valorant', 'Football', 'Notion', 'Slack'],
    features: ['Statistics Tracking', 'Leaderboards', 'Data Storage', 'Notifications'],
    typescript: `import { Valorant, FootballAPI, NotionAPI, SlackAPI } from 'macro_api';

interface PlayerStats {
  puuid: string;
  gameName: string;
  tagLine: string;
  rank: string;
  rr: number;
  kd: number;
  winRate: number;
  recentMatches: any[];
}

interface TeamStats {
  teamId: number;
  name: string;
  league: string;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  position: number;
}

class GamingAnalyticsDashboard {
  private valorant: Valorant;
  private football: FootballAPI;
  private notion: NotionAPI;
  private slack: SlackAPI;
  private playerDatabase: string; // Notion database ID
  private teamDatabase: string; // Notion database ID

  constructor() {
    this.valorant = new Valorant(process.env.HENRIK_API_KEY);
    this.football = new FootballAPI({
      apiKey: process.env.FOOTBALL_API_KEY!
    });
    this.notion = new NotionAPI({
      apiKey: process.env.NOTION_API_KEY!
    });
    this.slack = new SlackAPI({
      botToken: process.env.SLACK_BOT_TOKEN!
    });
    this.playerDatabase = process.env.NOTION_PLAYER_DB!;
    this.teamDatabase = process.env.NOTION_TEAM_DB!;
  }

  async trackValorantPlayer(gameName: string, tagLine: string, region: string = 'na'): Promise<PlayerStats> {
    try {
      // Get player account
      const account = await this.valorant.getAccount(gameName, tagLine);
      
      // Get MMR data
      const mmrData = await this.valorant.getMMR(gameName, tagLine, { region });
      
      // Get match history
      const matchHistory = await this.valorant.getMatchHistory(region, gameName, tagLine, {
        queue: 'competitive'
      });
      
      // Calculate detailed stats
      const playerStats = await this.valorant.getPlayerStats(region, gameName, tagLine);
      
      const stats: PlayerStats = {
        puuid: account.puuid,
        gameName: account.name,
        tagLine: account.tag,
        rank: mmrData.currenttierpatched || 'Unranked',
        rr: mmrData.ranking_in_tier || 0,
        kd: parseFloat((playerStats.combat?.kd || '0').toString()),
        winRate: parseFloat((playerStats.overview?.winRate || '0%').replace('%', '')),
        recentMatches: matchHistory.slice(0, 5)
      };
      
      // Store in Notion database
      await this.storePlayerStats(stats);
      
      // Check for rank changes and notify
      await this.checkRankChanges(stats);
      
      return stats;
    } catch (error) {
      console.error('Error tracking Valorant player:', error);
      throw error;
    }
  }

  async trackFootballTeam(teamId: number, leagueId: number, season: number): Promise<TeamStats> {
    try {
      // Get team information
      const teamInfo = await this.football.getTeams({ id: teamId });
      const team = teamInfo[0];
      
      // Get team statistics
      const teamStats = await this.football.getTeamStatistics({
        league: leagueId,
        team: teamId,
        season
      });
      
      // Get league standings
      const standings = await this.football.getStandings({
        league: leagueId,
        season,
        team: teamId
      });
      
      const stats: TeamStats = {
        teamId: team.id,
        name: team.name,
        league: teamStats.league.name,
        wins: teamStats.fixtures.wins.total,
        losses: teamStats.fixtures.loses.total,
        draws: teamStats.fixtures.draws.total,
        goalsFor: teamStats.goals.for.total.total,
        goalsAgainst: teamStats.goals.against.total.total,
        position: standings[0].league.standings[0].find((s: any) => s.team.id === teamId)?.rank || 0
      };
      
      // Store in Notion database
      await this.storeTeamStats(stats);
      
      // Check for significant changes
      await this.checkTeamPerformance(stats);
      
      return stats;
    } catch (error) {
      console.error('Error tracking football team:', error);
      throw error;
    }
  }

  private async storePlayerStats(stats: PlayerStats): Promise<void> {
    const properties = {
      'Player Name': {
        title: [{ text: { content: \`\${stats.gameName}#\${stats.tagLine}\` } }]
      },
      'PUUID': {
        rich_text: [{ text: { content: stats.puuid } }]
      },
      'Rank': {
        select: { name: stats.rank }
      },
      'RR': {
        number: stats.rr
      },
      'K/D Ratio': {
        number: stats.kd
      },
      'Win Rate': {
        number: stats.winRate
      },
      'Last Updated': {
        date: { start: new Date().toISOString() }
      }
    };

    await this.notion.createPage({
      parent: { database_id: this.playerDatabase },
      properties
    });
  }

  private async storeTeamStats(stats: TeamStats): Promise<void> {
    const properties = {
      'Team Name': {
        title: [{ text: { content: stats.name } }]
      },
      'League': {
        select: { name: stats.league }
      },
      'Position': {
        number: stats.position
      },
      'Wins': {
        number: stats.wins
      },
      'Losses': {
        number: stats.losses
      },
      'Draws': {
        number: stats.draws
      },
      'Goals For': {
        number: stats.goalsFor
      },
      'Goals Against': {
        number: stats.goalsAgainst
      },
      'Last Updated': {
        date: { start: new Date().toISOString() }
      }
    };

    await this.notion.createPage({
      parent: { database_id: this.teamDatabase },
      properties
    });
  }

  private async checkRankChanges(currentStats: PlayerStats): Promise<void> {
    // Query previous stats from Notion
    const previousData = await this.notion.queryDatabase(this.playerDatabase, {
      filter: {
        property: 'PUUID',
        rich_text: { equals: currentStats.puuid }
      },
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }]
    });

    if (previousData.results.length > 1) {
      const previousEntry = previousData.results[1];
      const previousRank = this.getPropertyValue(previousEntry.properties, 'Rank');
      
      if (previousRank !== currentStats.rank) {
        await this.slack.sendMessage('#gaming-updates',
          \`🎮 Rank Update: *\${currentStats.gameName}#\${currentStats.tagLine}* \\n\${previousRank} ➡️ \${currentStats.rank}\`,
          {
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: \`🎮 *Valorant Rank Update*\\n• Player: \${currentStats.gameName}#\${currentStats.tagLine}\\n• Previous: \${previousRank}\\n• Current: \${currentStats.rank}\\n• RR: \${currentStats.rr}\\n• K/D: \${currentStats.kd}\\n• Win Rate: \${currentStats.winRate}%\`
                }
              }
            ]
          }
        );
      }
    }
  }

  private async checkTeamPerformance(currentStats: TeamStats): Promise<void> {
    // Check if team is in top 4 (Champions League spots)
    if (currentStats.position <= 4) {
      await this.slack.sendMessage('#football-updates',
        \`⚽ Champions League Position: *\${currentStats.name}* is currently \${this.getPositionSuffix(currentStats.position)} in \${currentStats.league}!\`,
        {
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: \`⚽ *\${currentStats.name} Performance*\\n• Position: \${currentStats.position}\\n• League: \${currentStats.league}\\n• Record: \${currentStats.wins}W-\${currentStats.draws}D-\${currentStats.losses}L\\n• Goals: \${currentStats.goalsFor} for, \${currentStats.goalsAgainst} against\`
              }
            }
          ]
        }
      );
    }
  }

  async generateLeaderboard(type: 'valorant' | 'football'): Promise<string> {
    if (type === 'valorant') {
      const playersData = await this.notion.queryDatabase(this.playerDatabase, {
        sorts: [{ property: 'RR', direction: 'descending' }]
      });

      let leaderboard = '🏆 **Valorant Leaderboard**\\n\\n';
      playersData.results.slice(0, 10).forEach((player, index) => {
        const name = this.getPropertyValue(player.properties, 'Player Name');
        const rank = this.getPropertyValue(player.properties, 'Rank');
        const rr = this.getPropertyValue(player.properties, 'RR');
        const kd = this.getPropertyValue(player.properties, 'K/D Ratio');
        
        leaderboard += \`\${index + 1}. **\${name}** - \${rank} (\${rr} RR) | K/D: \${kd}\\n\`;
      });

      return leaderboard;
    } else {
      const teamsData = await this.notion.queryDatabase(this.teamDatabase, {
        sorts: [{ property: 'Position', direction: 'ascending' }]
      });

      let leaderboard = '⚽ **Football Standings**\\n\\n';
      teamsData.results.slice(0, 10).forEach((team) => {
        const name = this.getPropertyValue(team.properties, 'Team Name');
        const position = this.getPropertyValue(team.properties, 'Position');
        const wins = this.getPropertyValue(team.properties, 'Wins');
        const draws = this.getPropertyValue(team.properties, 'Draws');
        const losses = this.getPropertyValue(team.properties, 'Losses');
        
        leaderboard += \`\${position}. **\${name}** - \${wins}W \${draws}D \${losses}L\\n\`;
      });

      return leaderboard;
    }
  }

  async scheduleUpdates(): Promise<void> {
    // Update Valorant players every hour
    setInterval(async () => {
      const players = ['TenZ', 'Shroud', 'tarik']; // Example players
      for (const player of players) {
        try {
          await this.trackValorantPlayer(player, 'NA1');
        } catch (error) {
          console.error(\`Error updating \${player}:\`, error);
        }
      }
    }, 3600000); // 1 hour

    // Update football teams twice daily
    setInterval(async () => {
      const teams = [33, 40, 50]; // Example team IDs (Real Madrid, Liverpool, Manchester City)
      for (const teamId of teams) {
        try {
          await this.trackFootballTeam(teamId, 39, 2023); // Premier League 2023
        } catch (error) {
          console.error(\`Error updating team \${teamId}:\`, error);
        }
      }
    }, 43200000); // 12 hours

    // Send daily leaderboard updates
    setInterval(async () => {
      const valorantLeaderboard = await this.generateLeaderboard('valorant');
      const footballLeaderboard = await this.generateLeaderboard('football');
      
      await this.slack.sendMessage('#daily-stats', valorantLeaderboard);
      await this.slack.sendMessage('#daily-stats', footballLeaderboard);
    }, 86400000); // 24 hours
  }

  private getPropertyValue(properties: any, propertyName: string): any {
    const property = properties[propertyName];
    if (!property) return null;
    
    switch (property.type) {
      case 'title':
        return property.title[0]?.plain_text || '';
      case 'rich_text':
        return property.rich_text[0]?.plain_text || '';
      case 'select':
        return property.select?.name || '';
      case 'number':
        return property.number || 0;
      default:
        return null;
    }
  }

  private getPositionSuffix(position: number): string {
    const suffixes = ['', '1st', '2nd', '3rd'];
    return suffixes[position] || \`\${position}th\`;
  }
}

// Usage example
const analytics = new GamingAnalyticsDashboard();

// Track individual players/teams
const valorantStats = await analytics.trackValorantPlayer('TenZ', 'NA1');
const footballStats = await analytics.trackFootballTeam(33, 39, 2023); // Real Madrid in Premier League

// Generate and send leaderboards
const valorantLeaderboard = await analytics.generateLeaderboard('valorant');
const footballLeaderboard = await analytics.generateLeaderboard('football');

console.log('Valorant Stats:', valorantStats);
console.log('Football Stats:', footballStats);

// Start automated tracking
await analytics.scheduleUpdates();`,
    javascript: `const { Valorant, FootballAPI, NotionAPI, SlackAPI } = require('macro_api');

class GamingAnalyticsDashboard {
  constructor() {
    this.valorant = new Valorant(process.env.HENRIK_API_KEY);
    this.football = new FootballAPI({
      apiKey: process.env.FOOTBALL_API_KEY
    });
    this.notion = new NotionAPI({
      apiKey: process.env.NOTION_API_KEY
    });
    this.slack = new SlackAPI({
      botToken: process.env.SLACK_BOT_TOKEN
    });
    this.playerDatabase = process.env.NOTION_PLAYER_DB;
    this.teamDatabase = process.env.NOTION_TEAM_DB;
  }

  async trackValorantPlayer(gameName, tagLine, region = 'na') {
    try {
      // Get player data
      const account = await this.valorant.getAccount(gameName, tagLine);
      const mmrData = await this.valorant.getMMR(gameName, tagLine, { region });
      const playerStats = await this.valorant.getPlayerStats(region, gameName, tagLine);
      
      const stats = {
        puuid: account.puuid,
        gameName: account.name,
        tagLine: account.tag,
        rank: mmrData.currenttierpatched || 'Unranked',
        rr: mmrData.ranking_in_tier || 0,
        kd: parseFloat(playerStats.combat?.kd || '0'),
        winRate: parseFloat((playerStats.overview?.winRate || '0%').replace('%', ''))
      };
      
      // Store in Notion
      await this.storePlayerStats(stats);
      
      // Check for changes
      await this.checkRankChanges(stats);
      
      return stats;
    } catch (error) {
      console.error('Error tracking player:', error);
      throw error;
    }
  }

  async generateLeaderboard(type) {
    if (type === 'valorant') {
      const playersData = await this.notion.queryDatabase(this.playerDatabase, {
        sorts: [{ property: 'RR', direction: 'descending' }]
      });

      let leaderboard = '🏆 **Valorant Leaderboard**\\n\\n';
      playersData.results.slice(0, 10).forEach((player, index) => {
        const name = this.getPropertyValue(player.properties, 'Player Name');
        const rank = this.getPropertyValue(player.properties, 'Rank');
        const rr = this.getPropertyValue(player.properties, 'RR');
        
        leaderboard += \`\${index + 1}. **\${name}** - \${rank} (\${rr} RR)\\n\`;
      });

      return leaderboard;
    }
  }
}

// Usage
const analytics = new GamingAnalyticsDashboard();

const stats = await analytics.trackValorantPlayer('TenZ', 'NA1');
const leaderboard = await analytics.generateLeaderboard('valorant');

console.log('Player Stats:', stats);`
  }
];

export default codeExamples;