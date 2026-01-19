
export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  testimonial?: {
    quote: string;
    author: string;
    position: string;
  };
  workflowId: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'cs-1',
    title: 'Automating Customer Support for SaaS Company',
    client: 'CloudTech Solutions',
    industry: 'SaaS',
    challenge: 'CloudTech was struggling with a high volume of support tickets, leading to slow response times and customer dissatisfaction. Their team was spending 70% of their time answering repetitive questions.',
    solution: 'We implemented an AI-powered support automation workflow using n8n that integrates with their help desk. The system automatically categorizes tickets, answers common questions, and only escalates complex issues to human agents.',
    results: [
      '68% reduction in first-response time',
      '42% decrease in support tickets requiring human intervention',
      '89% customer satisfaction rating for AI-handled tickets',
      'Support team now focused on complex product improvements instead of repetitive tasks'
    ],
    testimonial: {
      quote: 'The automation workflow has transformed our support operations. Our team is happier, our customers get faster responses, and we\'ve been able to reallocate resources to product development.',
      author: 'Maria Chen',
      position: 'Head of Customer Success, CloudTech Solutions'
    },
    workflowId: 'support-automation'
  },
  {
    id: 'cs-2',
    title: 'Lead Qualification and Nurturing Automation',
    client: 'GrowthForce Marketing',
    industry: 'Marketing Agency',
    challenge: 'GrowthForce was manually qualifying and nurturing leads for their clients, requiring significant staff time and resulting in inconsistent follow-up. They needed to scale operations without adding staff.',
    solution: 'We built a comprehensive n8n workflow that integrates with their CRM and marketing tools to automatically score leads based on behavior, segment audiences, and trigger personalized nurturing sequences with AI-generated content.',
    results: [
      '215% increase in qualified leads',
      '76% reduction in lead follow-up time',
      '28% improvement in conversion rate',
      'Ability to handle 3x more clients with the same team size'
    ],
    testimonial: {
      quote: 'This automation has been a game-changer for our agency. We\'re delivering much better results for clients while actually reducing the workload on our team.',
      author: 'James Wilson',
      position: 'CEO, GrowthForce Marketing'
    },
    workflowId: 'lead-nurturing'
  },
  {
    id: 'cs-3',
    title: 'Inventory Management Automation for E-Commerce',
    client: 'Urban Outfitters Online',
    industry: 'E-Commerce',
    challenge: 'Urban Outfitters was struggling with inventory synchronization across multiple sales channels, leading to overselling, customer disappointment, and manual reconciliation efforts.',
    solution: 'We created an n8n workflow that connects their e-commerce platform, warehouse management system, and marketplace listings, providing real-time inventory updates and automated purchase order generation.',
    results: [
      'Eliminated overselling incidents completely',
      '94% reduction in inventory management time',
      'Automated purchase orders based on inventory thresholds',
      'Improved cash flow through optimized inventory levels'
    ],
    testimonial: {
      quote: 'The inventory automation system has eliminated our biggest operational headache. We no longer have to worry about overselling or spending hours reconciling stock levels.',
      author: 'Sarah Johnson',
      position: 'Operations Director, Urban Outfitters Online'
    },
    workflowId: 'inventory-sync'
  }
];

// Sample basic n8n workflow for visualization
export const sampleWorkflows = {
  'support-automation': {
    "meta": {
      "instanceId": "45e293393b5dd8437fb351e5b1ef5511ef67e6e0826a1c10b9b68be850b67593",
      "templateCredsSetupCompleted": true
    },
    "nodes": [
      {
        "id": "618c19de-7259-46f7-a02f-d8a4fc140bf3",
        "name": "Structured Output Parser",
        "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
        "position": [
          700,
          380
        ],
        "parameters": {
          "jsonSchemaExample": "{\n\t\"response\": \"N\"\n}"
        },
        "typeVersion": 1.2
      },
      {
        "id": "7dae5a0e-353b-4a7b-a773-4bcc4ce580ed",
        "name": "OpenAI Chat Model",
        "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        "position": [
          540,
          380
        ],
        "parameters": {
          "options": {
            "baseURL": "https://api.openai.com/v1"
          }
        },
        "credentials": {
          "openAiApi": {
            "id": "htEWFtfoajtuKpAT",
            "name": "OpenAi account"
          }
        },
        "typeVersion": 1
      },
      {
        "id": "bab7f1c9-25a8-4c64-b963-ea684afc2380",
        "name": "Text Email",
        "type": "n8n-nodes-base.telegram",
        "position": [
          1480,
          180
        ],
        "webhookId": "da6bb30b-cd00-47ee-8383-d39dcba33ca1",
        "parameters": {
          "text": "=Email ID: {{ $('New Email Received').item.json.id }}\nThread ID: {{ $('New Email Received').item.json.threadId }}\nFrom: {{ $('New Email Received').item.json.from.value[0].name }}\nEmail: {{ $('New Email Received').item.json.from.value[0].address }}\nSubject: {{ $('New Email Received').item.json.subject }}\n\n{{ $('New Email Received').item.json.text.replace(/_/g, '\\\\_')\n        .replace(/\\*/g, '\\\\*')\n        .replace(/\\[/g, '\\\\[')\n        .replace(/\\]/g, '\\\\]')\n        .replace(/\\(/g, '\\\\(')\n        .replace(/\\)/g, '\\\\)')\n        .replace(/~/g, '\\\\~')\n        .replace(/`/g, '\\\\`')\n        .replace(/>/g, '\\\\>')\n        .replace(/#/g, '\\\\#')\n        .replace(/\\+/g, '\\\\+')\n        .replace(/-/g, '\\\\-')\n        .replace(/=/g, '\\\\=')\n        .replace(/\\|/g, '\\\\|')\n        .replace(/\\{/g, '\\\\{')\n        .replace(/\\}/g, '\\\\}')\n        .replace(/\\./g, '\\\\.')\n        .replace(/!/g, '\\\\!')\n        .replace(/\\\\/g, '\\\\\\\\').substring(0, 100) + '...'; }}",
          "chatId": "={{ $json.chat_id }}",
          "additionalFields": {
            "appendAttribution": false
          }
        },
        "credentials": {
          "telegramApi": {
            "id": "iwigkJVzQ94wd6zp",
            "name": "Telegram account"
          }
        },
        "typeVersion": 1.2
      },
      {
        "id": "0d2490f2-96be-46f2-aa1f-fd63e49c81f4",
        "name": "OpenAI",
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "position": [
          800,
          820
        ],
        "parameters": {
          "options": {},
          "resource": "audio",
          "operation": "transcribe"
        },
        "credentials": {
          "openAiApi": {
            "id": "htEWFtfoajtuKpAT",
            "name": "OpenAi account"
          }
        },
        "typeVersion": 1.5
      },
      {
        "id": "1911c739-07a4-42d4-aeb9-d90bb2cb2828",
        "name": "New Email Received",
        "type": "n8n-nodes-base.gmailTrigger",
        "position": [
          -100,
          220
        ],
        "parameters": {
          "simple": false,
          "filters": {},
          "options": {},
          "pollTimes": {
            "item": [
              {
                "mode": "everyMinute"
              }
            ]
          }
        },
        "credentials": {
          "gmailOAuth2": {
            "id": "aXTuNMJaYuKFOKTa",
            "name": "Gmail account"
          }
        },
        "typeVersion": 1.1
      },
      {
        "id": "e37d6747-a63f-4aee-bd3d-30c02b6fdc15",
        "name": "In the Inbox?",
        "type": "n8n-nodes-base.if",
        "position": [
          120,
          220
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "3f7094d8-2756-493d-8721-be7d4c83297b",
                "operator": {
                  "type": "array",
                  "operation": "contains",
                  "rightType": "any"
                },
                "leftValue": "={{ $json.labelIds }}",
                "rightValue": "INBOX"
              }
            ]
          }
        },
        "typeVersion": 2.2
      },
      {
        "id": "c6eaa6bf-aa92-4dc2-93b9-9695b79c3047",
        "name": "Needs a response?",
        "type": "n8n-nodes-base.if",
        "position": [
          900,
          200
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "8aa9d41a-a218-456c-8b46-70b2e4a1af03",
                "operator": {
                  "name": "filter.operator.equals",
                  "type": "string",
                  "operation": "equals"
                },
                "leftValue": "={{ $json.output.response }}",
                "rightValue": "Y"
              }
            ]
          }
        },
        "typeVersion": 2.2
      },
      {
        "id": "44369d4b-6271-4f01-af9b-3b022ab50fb0",
        "name": "Telegram Bot Message Received",
        "type": "n8n-nodes-base.telegramTrigger",
        "position": [
          -100,
          840
        ],
        "webhookId": "5dfd3832-9606-4b68-904c-0c3e9ef3d7a0",
        "parameters": {
          "updates": [
            "message"
          ],
          "additionalFields": {}
        },
        "credentials": {
          "telegramApi": {
            "id": "iwigkJVzQ94wd6zp",
            "name": "Telegram account"
          }
        },
        "typeVersion": 1.1
      },
      {
        "id": "f487f113-da38-41ab-8d1a-c6296fedb91e",
        "name": "It needs to be an audio message + a reply!",
        "type": "n8n-nodes-base.telegram",
        "position": [
          320,
          940
        ],
        "webhookId": "1d9ee2f9-fbdf-4929-b149-c537ddcde290",
        "parameters": {
          "text": "=Sorry, I didn't catch that! \n\nTo send your email for you, I need you to respond with a voice note in reply to one of my other messages.",
          "chatId": "={{ $json.message.chat.id }}",
          "additionalFields": {
            "appendAttribution": false
          }
        },
        "credentials": {
          "telegramApi": {
            "id": "iwigkJVzQ94wd6zp",
            "name": "Telegram account"
          }
        },
        "typeVersion": 1.2
      },
      {
        "id": "215fd988-7e02-4bae-9b57-284e59a7a467",
        "name": "Get Audio File",
        "type": "n8n-nodes-base.telegram",
        "position": [
          620,
          820
        ],
        "webhookId": "2a804883-546e-410d-bfef-ff91f9ce0b4a",
        "parameters": {
          "fileId": "={{ $json.message.voice.file_id }}",
          "resource": "file"
        },
        "credentials": {
          "telegramApi": {
            "id": "iwigkJVzQ94wd6zp",
            "name": "Telegram account"
          }
        },
        "typeVersion": 1.2
      },
      {
        "id": "a8b83c7a-442a-445a-a55b-2ad7fdd1674b",
        "name": "Create Email Draft",
        "type": "n8n-nodes-base.gmail",
        "position": [
          1400,
          820
        ],
        "webhookId": "66db4f27-f871-4600-b4a9-fb8bbbd0c8c8",
        "parameters": {
          "message": "={{ $json.text }}",
          "options": {
            "sendTo": "={{$('Telegram Bot Message Received').item.json.message.reply_to_message.text.match(/Email:\\s(.+?@.+?\\.\\w+)/i)[1]}}",
            "threadId": "={{$('Telegram Bot Message Received').item.json.message.reply_to_message.text.match(/Thread ID:\\s([a-f0-9]+)/i)[1]}}"
          },
          "subject": "=RE:  {{ $('Telegram Bot Message Received').item.json.message.reply_to_message.text.match(/Subject:\\s(.+)/i)[1] }}",
          "resource": "draft"
        },
        "credentials": {
          "gmailOAuth2": {
            "id": "aXTuNMJaYuKFOKTa",
            "name": "Gmail account"
          }
        },
        "typeVersion": 2.1
      },
      {
        "id": "cf942bba-201b-4135-bac9-a5cdbd516749",
        "name": "Direct to Draft",
        "type": "n8n-nodes-base.telegram",
        "position": [
          1560,
          820
        ],
        "webhookId": "a49b47f9-994a-485d-86e4-1222bc192565",
        "parameters": {
          "text": "=Draft Created:\n\n{{ $('Write Polished Reply').item.json.output }}\n\n[View here](https://mail.google.com/mail/#all/{{ $json.message.threadId }})",
          "chatId": "={{ $('Telegram Bot Message Received').item.json.message.reply_to_message.chat.id }}",
          "additionalFields": {
            "appendAttribution": false,
            "reply_to_message_id": "={{ $('Telegram Bot Message Received').item.json.message.message_id }}"
          }
        },
        "credentials": {
          "telegramApi": {
            "id": "iwigkJVzQ94wd6zp",
            "name": "Telegram account"
          }
        },
        "typeVersion": 1.2
      },
      {
        "id": "b21f66c4-544c-4401-96b6-b7e0239702e4",
        "name": "Sticky Note4",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          -160,
          -20
        ],
        "parameters": {
          "color": 7,
          "width": 560,
          "height": 580,
          "content": "## 1. New Email Received\n\nOur workflow is triggered when a new email comes in. \n\nWe use an IF node here to only run the automation on incoming emails to the INBOX - not in the SENT folder."
        },
        "typeVersion": 1
      },
      {
        "id": "595b7700-97b9-400a-a96b-516452c3db86",
        "name": "Sticky Note",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          460,
          -20
        ],
        "parameters": {
          "color": 7,
          "width": 740,
          "height": 580,
          "content": "## 2. Check If Email Needs a Response\n\nWe use ChatGPT to check if the email needs a reply. Anything sent with an \"unsubscribe\" button or \"manage preferences\" is ignored. Anything that comes from a company (e.g. sent from \"noreply@example.com\"), or has the format of a newsletter doesn't need a response.\n\nWe use an output parser so that we can use an IF node on the output."
        },
        "typeVersion": 1
      },
      {
        "id": "42551c14-0b70-42b7-a7ca-0bab580e050a",
        "name": "Does Email Need a Response?",
        "type": "@n8n/n8n-nodes-langchain.chainLlm",
        "position": [
          520,
          200
        ],
        "parameters": {
          "text": "=Do you think the following email requires me to create a response or not? Your answer should be Y if yes, or N if not. Format your answer as a JSON as either { response: Y } or { response: N } Do not add anything else to your answer at all.\n\nCriteria for emails that require a reply:\n- Direct questions or requests for information, action, or confirmation.\n- Messages seeking clarification or feedback.\n- Invitations to meetings or events that need a confirmation or rejection.\n- Emails indicating follow-up is expected or explicitly asking for a reply.\n- Client/customer queries or feedback that require acknowledgment.\n- Personal emails from somebody who might be my friend\n\nCriteria for emails that do not require a reply:\n- The email address contains \"no-reply\" or \"noreply\"!\n- Informational or update emails with no explicit call for action or response.\n- Automated notifications (e.g., system alerts, newsletters, etc.).\n- CC/BCC emails where no direct response is expected.\nReplies that only acknowledge receipt (e.g., \"Thank you,\" \"Noted\").\n\nExamples:\n\nInput:\nFrom - \"Nutricals Men's Wellness\" <store+67435528508@g.shopifyemail.com>\nSubject - Copy of British Men Swear By This\nBody: Are You Ready to Try? 🚀\\n ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­ \\nFree Next Day Delivery Available In The UK\\n\\nBanner with 15% text\\n[https://cdn.shopify.com/s/files/1/0674/3552/8508/files/15OFF_Banner.jpg?v=1728477865]\\nhttps://nutricalsupps.co.uk/_t/c/A1020005-17FCCB1E01B626BC-1AA5C384?l=AADVDennHNHTkxTcdbVb1tb0k0%2FTC%2Fc8r1oThucVEB90pLLtSPl7AIQ1Pb9xXOddTdS0LwJxcVWIvdCayYts30R9tSMtSJ%2BPvLGsZZseeSGN2rHePGVqDYgtLuJsY2HI69JX6WbRq1iYUlXSq%2BKNxtXanpxs7nnIJ3ZdkE13y0A15nlmHP9acPNXhMWS%2Bd9u6XHdQbNswPaahUU63LHAoPKnTC0%2BtsAtcEkCjy66DsXK6OI%2B5MIqszqgzLgeIZYZtJh6Y4WGQMYmTICOGiL3tMSKvfgo3H8UTK9vRVt2%2Bcb86vq9sMXwQuPQYYvuX7jlv0C5IHUH%2BTOSY80eeAAbFD0%2FqFQjHyHarU6SLBXX5UbqPRcTXVPYbNQVXuSQ02WHvKV3689adUNADNX6bg%3D%3D&c=AAB%2FvMTPfjPPwDmVhyk7kEi4pC%2FYi72OVsQsQVTXGWGtSevCqIphtQsYobAeSojbmQlyXUwnlrcaJnu4Dnbct%2BKoO94xvzo6cayXi3YxC90%2FoNS%2BjkilKKRWFCvt4li9bhq5f6GrnmCKm9EQq%2B3mZq%2FHl8NJIMVmoSdIlCLXcjlI2GUzp3JGBEJH2H1MFq67GlXN9iA2ZpwkPo%2BbqSD2HsGfmPQYaudt4kwI6lB5p9%2F08RLniPfvqPmWgkaIkWVmDfbOTTKGl0g%2FNaxSr6oisLnymr%2Bw37cjcBuyRjUhaspoj2weQ9XZbTzzpfkhpfJ3U0C0Roen1nozHk9o32hSefxSUVzGGXMtNSKzSmNVeolJZL9jggSV5NJDIALxxwF0kB1WlEyLGfwbwvTgfbDMH5Ql04aKTolL4K%2Bez10V9R2quqannt35jRahLJZy5cVMWAzPEwleOePSqwD%2BW9sjQcvyuGX%2F23JVrS2chinfmVdCCXWxpYvso3PbtYcgjZ2oAuUaxqhQRYYDxzfe0GZjzqqRmDeP%2BV78FAJESLRAeRoA23tCmQk7FASAY3FjmfbJXnB6%2B40JMthwQKAURDAbBO1ekx1tDdYd3OXZnFk3fDYQwzICVIo3MZah3e3cjRobzS2SSJlAVA%3D%3D\\nAs Seen on Nutricals\\n[https://cdn.shopify.com/s/files/1/0674/3552/8508/files/as-seen-on-Nutricals-MOBILE.png?v=1692371484]\\n\\n\\n\\n\\n\\n\\n\\nNutricals® UK\\n\\n128 City Road\\nLondon\\nEC1V 2NX\\nUnited Kingdom\\n\\n+442037288889\\nhello@nutricalsupps.co.uk\\n\\n\\n\\nUnsubscribe\\n[https://nutricalsupps.co.uk/account/unsubscribe?token=vkf5H_6XoktnfEKt8qUMcTJEZip6rqyFKGzuFs7BriPM7YFaHIHssoxhRIHW7iJqfzvyVTShmV7_NBTJ2ufoY41w69Mmx4mQ3uR6XBMx06s%3D&se_activity_id=183600415036&utm_source=shopify_email&utm_medium=email&utm_campaign=Copy+of+British+Men+Swear+By+This_183600415036]\\n\\n© 2023 Nutricals® UK\\n\\n[https://cdn.shopify.com/shopify-email/ivc5fufdfucnxibnsh0qhjn9b2ua.png]\\n\\n[https://nutricalsupps.co.uk/_t/open/A1020005-17FCCB1E01B626BC-1AA5C384?en=AABXSr%2BWjAgDVQvPeN2wSOJLFNs1iBRZX%2FfKuzaUN3%2BpO6e9HC0oI9UQmUc2wVl%2F57dDk19OAdrS8hSegwp59%2B7vlk4odUc4YXTSf%2B5RHsfE2HlcuPcEpb9DiMUs7NDW67v2L9CiwR6%2FEZVFbTcCJhd0Gh5EYv%2BBeEwn6zXVIpzWpzWKhLMvA8YYxzZk%2BDxdPCI7%2F5vBO34YytHAupYfHYaj%2B2%2B7clAPN%2BYQHs9AzFfu0IHdXTWLAbdVcPA%2B1X71sJwwJMOvPaaLS60yJyYGuqha3qehHCQxTfPCeEGoCjTruLjdrFDOPr80jHate0BKUTEXxG%2FTXSdnnMJWQz%2F15NG%2FliPNXM9CTVFa%2Be3XMsMp2ZYpdPzqQ8YSuXNc6jZsRJm2oxTjqUoIT8Cd2DubOf7ZATCR5Aj%2FKUYoCLEydg7U7atW5ghJTJbtYmTLatPcPOqgGpyaZRygBarsNpZ%2B%2FACUGYLoIuSzYuKJGd%2B5I3CQAsY7POqE4FP%2BE6lk1wUSaSCl7GNEegZ0JaJ0e5QsMZQnpANFLNt3dAhYQdu0mPldxD6U0DmszqPsqJAJ80E7Z0jg9pb8BgYHi72QyqXMbjrzww%3D%3D]\n\nAnswer: \n{\n\t\"response\": \"N\"\n}\n\n-----\n\nInput:\nFrom - {{ $json.from.value[0].name }} <{{ $json.from.value[0].address }}>\nSubject - {{ $json.subject }}\nBody: {{ $json.text }}",
          "promptType": "define",
          "hasOutputParser": true
        },
        "typeVersion": 1.4
      },
      {
        "id": "ac18470f-4884-43ca-80b5-c8936fc4d4cd",
        "name": "Sticky Note1",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          1240,
          -20
        ],
        "parameters": {
          "color": 7,
          "width": 520,
          "height": 580,
          "content": "## 3. Send Email to Telegram\n\nWe use a VoicerEmailer bot to send the email over a Telegram message to our account on Telegram."
        },
        "typeVersion": 1
      },
      {
        "id": "be53cc8e-c5dd-4b82-aa78-c7870bf7de7b",
        "name": "Is Type Audio Message + Reply?",
        "type": "n8n-nodes-base.if",
        "position": [
          100,
          840
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "860f30dc-bfa7-46f5-a45d-b12c13194c41",
                "operator": {
                  "type": "object",
                  "operation": "exists",
                  "singleValue": true
                },
                "leftValue": "={{ $json.message.reply_to_message }}",
                "rightValue": ""
              },
              {
                "id": "9647524d-e0f2-4fff-9287-7e3752488343",
                "operator": {
                  "type": "object",
                  "operation": "exists",
                  "singleValue": true
                },
                "leftValue": "={{ $json.message.voice }}",
                "rightValue": ""
              }
            ]
          }
        },
        "typeVersion": 2.2
      },
      {
        "id": "280d69b3-4cf5-4515-8ae8-c499b21e4d99",
        "name": "Sticky Note5",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          -160,
          600
        ],
        "parameters": {
          "color": 7,
          "width": 680,
          "height": 580,
          "content": "## 4. Telegram Reply Received\n\nThis workflow is triggered when the Telegram bot receives a message. \n\nWe check that the message is a reply to a previous email message, and that the reply is an audio message. \n\nIf not, we send a message back telling them what they did wrong."
        },
        "typeVersion": 1
      },
      {
        "id": "168f9296-8ff4-4598-91ab-81967cf36dd2",
        "name": "Sticky Note6",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          560,
          600
        ],
        "parameters": {
          "color": 7,
          "width": 440,
          "height": 580,
          "content": "## 5. Audio Transcription\n\nWe get the audio file from the Telegram message and send it to OpenAI's Whisper API to get a transcription of the message."
        },
        "typeVersion": 1
      },
      {
        "id": "8e2731c6-c4ca-40f3-8c26-6421b57f95e2",
        "name": "OpenAI Chat Model1",
        "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        "position": [
          1120,
          1000
        ],
        "parameters": {
          "options": {
            "baseURL": "https://api.openai.com/v1"
          }
        },
        "credentials": {
          "openAiApi": {
            "id": "htEWFtfoajtuKpAT",
            "name": "OpenAi account"
          }
        },
        "typeVersion": 1
      },
      {
        "id": "7c350b3d-1cad-4ae9-8330-8bb55fbcea15",
        "name": "Write Polished Reply",
        "type": "@n8n/n8n-nodes-langchain.chainLlm",
        "position": [
          1100,
          820
        ],
        "parameters": {
          "text": "=Received Email:\n{{ $('Telegram Bot Message Received').item.json.message.reply_to_message.text }}\n\nVoice Note Response:\n{{ $json.text }}",
          "messages": {
            "messageValues": [
              {
                "message": "=You are a helpful assistant who translates rough voicemail messages into polished emails.\n\nYou will be given an email which is expecting a reply, as well as a voice message transcription which address the email. You should output a reply.\n\nDon't include the subject line. Only include a rephrasing of the answer given in the voice note. Do not make up an answer to fit any questions in the original email. \n\nUse the same tone, and broadly the same phrasing, as the voice note. Include a sign-off.\n\nDon't include any other padding or explanation in your answer.\n\nExamples:\n\nUSER INPUT:\n\nReceived Email:\nEmail ID: 19272309c9c81678\nThread ID: 19272309c9c81678\nFrom: ulrike roesler (via tibet-core Mailing List)\nEmail: tibet-core@maillist.ox.ac.uk\nSubject: Pre-term gathering this Friday, 7pm\n\nDear Adam,\n\nJust a brief reminder that the Tibetan & Himalayan Studies pre\\\\-term\ngathering will take place \\*this Friday from 7pm at the Royal Oak \\\\(Woodstock\nRoad\\\\)\\*\\\\. I have reserved a table for \"Tibetan Studies\"\\\\.\n\nWe will start by discussing the timetable, and those attending classes this\ncoming term are therefore asked to arrive at 7pm\\\\. Everyone else is welcome\nto join anytime during the evening\\\\.\n\nI attach a draft timetable, but please note that there may still be some\nsmall adjustments to the class times\\\\. The final version of the timetable\nwill be circulated after our meeting\\\\.\n\nI look forward to seeing you soon,\n\nUlrike\n\n\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*\nUlrike Roesler\nProfessor of Tibetan and Himalayan Studies\nOriental Institute\nPusey Lane\nOxford, OX1 2LE\n\\\\+44\\\\-1865\\\\-278236\n\nVoice Note Response:\nHey Ulrike, sorry, I won't be there because I'm currently in San Marcos La Laguna in Guatemala So I can't be there for the Tibetan Studies gathering This coming Friday, I'm sorry\n\n---\n\nASSISTANT RESPONSE:\n\nHi Ulrike,\n\nThanks for letting me know about the pre-term gathering this Friday. \n\nUnfortunately, I won’t be able to attend, as I'm currently in San Marcos La Laguna, Guatemala. \n\nI'm sorry to miss out on the discussion.\n\nThanks,\n\nAdam"
              }
            ]
          },
          "promptType": "define",
          "hasOutputParser": true
        },
        "typeVersion": 1.4
      },
      {
        "id": "37905767-3cca-4789-b016-2fec4f21e45b",
        "name": "Sticky Note7",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          1040,
          600
        ],
        "parameters": {
          "color": 7,
          "width": 720,
          "height": 580,
          "content": "## 5. Create Email Draft\n\nFinally, we get ChatGPT to write up a response, given the original email for context and our voice note reply. \n\nWe create a new draft in Gmail, which shows up in the same email thread. We sent a link to the newly created draft to the user via Telegram."
        },
        "typeVersion": 1
      },
      {
        "id": "a9942f9d-8896-45cd-b715-1228d8e3295c",
        "name": "Set Chat ID",
        "type": "n8n-nodes-base.set",
        "position": [
          1300,
          180
        ],
        "parameters": {
          "options": {},
          "assignments": {
            "assignments": [
              {
                "id": "d2980bdf-c0c2-47a7-885c-6a1aea58396c",
                "name": "chat_id",
                "type": "string",
                "value": "=6963887105"
              }
            ]
          }
        },
        "typeVersion": 3.4
      },
      {
        "id": "5a60bcd6-da89-4892-9a3f-1b04a2238ab6",
        "name": "Sticky Note2",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          1280,
          340
        ],
        "parameters": {
          "width": 160,
          "height": 120,
          "content": "## Edit here\nAdd in your Chat ID here."
        },
        "typeVersion": 1
      }
    ],
    "pinData": {
      "Telegram Bot Message Received": [
        {
          "message": {
            "chat": {
              "id": 1981391864,
              "type": "private",
              "username": "clairebaker0",
              "last_name": "Baker",
              "first_name": "Claire"
            },
            "date": 1728670178,
            "from": {
              "id": 1981391864,
              "is_bot": false,
              "username": "clairebaker0",
              "last_name": "Baker",
              "first_name": "Claire",
              "is_premium": true,
              "language_code": "en"
            },
            "voice": {
              "file_id": "AwACAgQAAxkBAANSZwlp4lXETIQffnMjGYNf_9KBCHEAAnwZAAKYI1FQZmfPK4JXJl82BA",
              "duration": 84,
              "file_size": 326514,
              "mime_type": "audio/ogg",
              "file_unique_id": "AgADfBkAApgjUVA"
            },
            "message_id": 82,
            "reply_to_message": {
              "chat": {
                "id": 1981391864,
                "type": "private",
                "username": "clairebaker0",
                "last_name": "Baker",
                "first_name": "Claire"
              },
              "date": 1728632446,
              "from": {
                "id": 7199424210,
                "is_bot": true,
                "username": "Email12345Bot",
                "first_name": "EmailBot"
              },
              "text": "Email ID: 1927a85634ae8e72\nThread ID: 1927a85634ae8e72\nFrom: Hannah Brown\nEmail: hannahbrown82@googlemail.com\nSubject: Re: October Updates ❤️\n\nHello lovelies\n\nThanks for these updates\\\\.\n\nSo interested in your decision to change the elemental ...",
              "entities": [
                {
                  "type": "email",
                  "length": 28,
                  "offset": 81
                }
              ],
              "message_id": 74
            }
          },
          "update_id": 408806372
        }
      ]
    },
    "connections": {
      "OpenAI": {
        "main": [
          [
            {
              "node": "Write Polished Reply",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Set Chat ID": {
        "main": [
          [
            {
              "node": "Text Email",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "In the Inbox?": {
        "main": [
          [
            {
              "node": "Does Email Need a Response?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Audio File": {
        "main": [
          [
            {
              "node": "OpenAI",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Needs a response?": {
        "main": [
          [
            {
              "node": "Set Chat ID",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "OpenAI Chat Model": {
        "ai_languageModel": [
          [
            {
              "node": "Does Email Need a Response?",
              "type": "ai_languageModel",
              "index": 0
            }
          ]
        ]
      },
      "Create Email Draft": {
        "main": [
          [
            {
              "node": "Direct to Draft",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "New Email Received": {
        "main": [
          [
            {
              "node": "In the Inbox?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "OpenAI Chat Model1": {
        "ai_languageModel": [
          [
            {
              "node": "Write Polished Reply",
              "type": "ai_languageModel",
              "index": 0
            }
          ]
        ]
      },
      "Write Polished Reply": {
        "main": [
          [
            {
              "node": "Create Email Draft",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Structured Output Parser": {
        "ai_outputParser": [
          [
            {
              "node": "Does Email Need a Response?",
              "type": "ai_outputParser",
              "index": 0
            }
          ]
        ]
      },
      "Does Email Need a Response?": {
        "main": [
          [
            {
              "node": "Needs a response?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Telegram Bot Message Received": {
        "main": [
          [
            {
              "node": "Is Type Audio Message + Reply?",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Type Audio Message + Reply?": {
        "main": [
          [
            {
              "node": "Get Audio File",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "It needs to be an audio message + a reply!",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  },
  'lead-nurturing': {
    "id": "QO4Mg23JvVfNCICy",
    "meta": {
      "instanceId": "a2b23892dd6989fda7c1209b381f5850373a7d2b85609624d7c2b7a092671d44",
      "templateCredsSetupCompleted": true
    },
    "name": "Build a Phone Agent to qualify outbound leads and inbound calls with RetellAI -vide",
    "tags": [
      {
        "id": "12w64ydbjEKDaM0B",
        "name": "inbound",
        "createdAt": "2025-05-06T20:31:43.427Z",
        "updatedAt": "2025-05-06T20:31:43.427Z"
      },
      {
        "id": "xSqaFWDcbJCRECKZ",
        "name": "outbound",
        "createdAt": "2025-05-06T20:31:38.072Z",
        "updatedAt": "2025-05-06T20:31:38.072Z"
      }
    ],
    "nodes": [
      {
        "id": "78f39980-c9f8-49b6-93bb-a1f61d347ac3",
        "name": "Sticky Note",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          -240,
          0
        ],
        "parameters": {
          "width": 1260,
          "height": 320,
          "content": "# Outbound lead qualification call workflow"
        },
        "typeVersion": 1
      },
      {
        "id": "661006b9-dac7-4ac0-882a-2e0cba9dbae1",
        "name": "Sticky Note4",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          -240,
          360
        ],
        "parameters": {
          "color": 5,
          "width": 1260,
          "height": 320,
          "content": "# Inbound call appointment scheduler workflow"
        },
        "typeVersion": 1
      },
      {
        "id": "96a278b9-8d2e-4f85-9f6a-2997932a7ca4",
        "name": "Sticky Note2",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          1060,
          -420
        ],
        "parameters": {
          "color": 4,
          "width": 1400,
          "height": 1100,
          "content": "# Post-call workflow\n## Triggers when a new lead is added in Google Sheets:\n\n### 1 -Sends SMS to remind rep to call in 5 min\n### 2- (Optional delay step)\n### 3- Triggers RetellAI to place an automated call to the lead\n\n## 💡 Requires phone numbers to be formatted in E.164"
        },
        "typeVersion": 1
      },
      {
        "id": "d082f904-f185-4615-b0d8-9438c731786f",
        "name": "Detect new lead in Google Sheets",
        "type": "n8n-nodes-base.googleSheetsTrigger",
        "position": [
          -160,
          100
        ],
        "parameters": {
          "event": "rowAdded",
          "options": {},
          "pollTimes": {
            "item": [
              {
                "mode": "everyHour"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "id",
            "value": "="
          },
          "documentId": {
            "__rl": true,
            "mode": "id",
            "value": "="
          }
        },
        "credentials": {
          "googleSheetsTriggerOAuth2Api": {
            "id": "pXaVMshaL2QzVDYh",
            "name": "Google Sheets Trigger account"
          }
        },
        "typeVersion": 1
      },
      {
        "id": "c61172c2-7795-47be-acaa-d4824ca69680",
        "name": "Send SMS reminder to call lead in 5 minutes",
        "type": "n8n-nodes-base.twilio",
        "position": [
          140,
          100
        ],
        "parameters": {
          "to": "={{ $json['Phone Number'] }}",
          "from": "+33600000000",
          "message": "Hello, thanks for your interest in our roofing services. We'll be calling you shortly to ask about your project!",
          "options": {},
          "resource": "call"
        },
        "credentials": {
          "twilioApi": {
            "id": "udXVmM3xHYZbMW4g",
            "name": "Twilio account"
          }
        },
        "typeVersion": 1
      },
      {
        "id": "d88573d4-ec99-40e4-8603-f1e910d034d1",
        "name": "Wait 5 minutes before making call",
        "type": "n8n-nodes-base.wait",
        "position": [
          460,
          100
        ],
        "webhookId": "344c2d5d-5629-4466-866b-ac6359b3b042",
        "parameters": {
          "unit": "minutes",
          "amount": 1
        },
        "typeVersion": 1.1
      },
      {
        "id": "d6778895-90dd-471e-9d9d-c48a35154291",
        "name": "Call new lead using RetellAI",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          760,
          100
        ],
        "parameters": {
          "url": "https://api.retellai.com/v2/create-phone-call",
          "method": "POST",
          "options": {},
          "jsonBody": "={\n  \"from_number\": \"+33600000000\",\n  \"to_number\": \"{{ $json['Phone Number'] }}\",\n  \"retell_llm_dynamic_variables\": {\n    \"uuid\": \"{{ $('Detect new lead in Google Sheets').item.json.UUID }}\"\n  }\n}",
          "sendBody": true,
          "sendHeaders": true,
          "specifyBody": "json",
          "headerParameters": {
            "parameters": [
              {
                "name": "Authorization",
                "value": "Bearer key_XXXXXXXXX"
              },
              {
                "name": "Content-Type",
                "value": "application/json"
              }
            ]
          }
        },
        "typeVersion": 4.2
      },
      {
        "id": "8e7e7c0c-2600-4b20-ba30-b855d456d302",
        "name": "Receive inbound call from RetellAI (webhook)",
        "type": "n8n-nodes-base.webhook",
        "position": [
          -160,
          460
        ],
        "webhookId": "ebd11c9b-129c-4b59-8c27-9a4b567305f7",
        "parameters": {
          "path": "ebd11c9b-129c-4b59-8c27-9a4b567305f7",
          "options": {},
          "httpMethod": "POST",
          "responseMode": "responseNode"
        },
        "typeVersion": 2
      },
      {
        "id": "36bf25b0-d39d-4127-b005-5e3619069744",
        "name": "Check if phone number exists in Google Sheets",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          300,
          460
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json.body.call_inbound.from_number }}",
                "lookupColumn": "Phone Number"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "id",
            "value": "="
          },
          "documentId": {
            "__rl": true,
            "mode": "id",
            "value": "="
          }
        },
        "credentials": {
          "googleSheetsOAuth2Api": {
            "id": "51us92xkOlrvArhV",
            "name": "Google Sheets account"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "0b2dc7b9-84c1-488b-9d02-47cf6ee460c7",
        "name": "Send response to inbound webhook call",
        "type": "n8n-nodes-base.respondToWebhook",
        "position": [
          760,
          460
        ],
        "parameters": {
          "options": {},
          "respondWith": "json",
          "responseBody": "={\n  \"call_inbound\": {\n    \"dynamic_variables\": {\n        \"name\": \"{{ $json.Name }}\"\n    }\n  }\n}"
        },
        "typeVersion": 1.1
      },
      {
        "id": "063a4a31-429f-4cf0-b248-869131e92633",
        "name": "Receive post-call data from RetellAI (webhook)",
        "type": "n8n-nodes-base.webhook",
        "position": [
          1180,
          80
        ],
        "webhookId": "f8878b78-43ea-4caa-b16c-cde9aaf2e9b1",
        "parameters": {
          "path": "f8878b78-43ea-4caa-b16c-cde9aaf2e9b1",
          "options": {},
          "httpMethod": "POST"
        },
        "typeVersion": 2
      },
      {
        "id": "215e2031-983a-4785-b46d-026f64c115e4",
        "name": "Filter for analyzed calls only",
        "type": "n8n-nodes-base.filter",
        "position": [
          1400,
          80
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "a0e40476-0054-43ec-b7a7-e872d1c6061a",
                "operator": {
                  "name": "filter.operator.equals",
                  "type": "string",
                  "operation": "equals"
                },
                "leftValue": "={{ $json.body.event }}",
                "rightValue": "call_analyzed"
              }
            ]
          }
        },
        "typeVersion": 2.2
      },
      {
        "id": "f8cae0c3-1b5d-47e6-b7fd-b47558c30d3f",
        "name": "Check if call was outbound",
        "type": "n8n-nodes-base.if",
        "position": [
          1620,
          80
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "46590184-4e33-48fd-a9f4-c63b13f88c1f",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                },
                "leftValue": "={{ $json.body.call.direction }}",
                "rightValue": "outbound"
              }
            ]
          }
        },
        "typeVersion": 2.2
      },
      {
        "id": "8997d5ec-bfb9-4ce9-9e13-6035f02b634e",
        "name": "Update lead record in Google Sheets",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          1860,
          -40
        ],
        "parameters": {
          "columns": {
            "value": {
              "UUID": "={{ $json.body.call.retell_llm_dynamic_variables.uuid }}",
              "Qualification": "={{ $json.body.call.call_analysis.custom_analysis_data.qualification }}"
            },
            "schema": [
              {
                "id": "UUID",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "UUID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Name",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Name",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Phone Number",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Phone Number",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Datetime Called",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Datetime Called",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Qualification",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Qualification",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "row_number",
                "type": "string",
                "display": true,
                "removed": true,
                "readOnly": true,
                "required": false,
                "displayName": "row_number",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "defineBelow",
            "matchingColumns": [
              "UUID"
            ],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "update",
          "sheetName": {
            "__rl": true,
            "mode": "id",
            "value": "="
          },
          "documentId": {
            "__rl": true,
            "mode": "id",
            "value": "="
          }
        },
        "credentials": {
          "googleSheetsOAuth2Api": {
            "id": "51us92xkOlrvArhV",
            "name": "Google Sheets account"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "20757ff8-6604-4c80-96ec-32bfac983ed7",
        "name": "Send call summary email",
        "type": "n8n-nodes-base.gmail",
        "position": [
          2220,
          -40
        ],
        "webhookId": "806ec3f9-8bcb-48ef-8e22-9d1ce3b06bf0",
        "parameters": {
          "sendTo": "youremail@gmail.com",
          "message": "=Name:\n{{ $json.body.call.call_analysis.custom_analysis_data.first_name }}\n\nNumber:\n{{ $json.body.call.call_analysis.custom_analysis_data.phone_number }}\n\nQualification:\n{{ $json.body.call.call_analysis.custom_analysis_data.qualification }}\n\n\nCall Summary:\n{{ $json.body.call.call_analysis.custom_analysis_data.call_summary }}",
          "options": {},
          "subject": "=New Lead - Call Summary",
          "emailType": "text"
        },
        "credentials": {
          "gmailOAuth2": {
            "id": "rKxQHWZ2F5XLJmwF",
            "name": "Gmail account"
          }
        },
        "typeVersion": 2.1
      },
      {
        "id": "753bd92d-b95b-4710-bf49-6da89a43223f",
        "name": "Generate call summary with OpenAI",
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "position": [
          1860,
          180
        ],
        "parameters": {
          "modelId": {
            "__rl": true,
            "mode": "list",
            "value": "gpt-4.1",
            "cachedResultName": "GPT-4.1"
          },
          "options": {},
          "messages": {
            "values": [
              {
                "content": "=Analyze this call transcript to identify how the call went and identify possible improvements to the voice prompt:\n\n{{ $json.body.call.transcript }}"
              }
            ]
          }
        },
        "credentials": {
          "openAiApi": {
            "id": "6h3DfVhNPw9I25nO",
            "name": "OpenAi account"
          }
        },
        "typeVersion": 1.8
      },
      {
        "id": "cf600277-bb07-4f7a-a9b7-3e20017f716d",
        "name": "Send confirmation email to lead",
        "type": "n8n-nodes-base.gmail",
        "position": [
          2220,
          180
        ],
        "webhookId": "453fe9d9-1de6-40a2-bd0c-88cb9c1cc7ef",
        "parameters": {
          "sendTo": "youremail@gmail.com",
          "message": "=New roofing appointment:\n\nClient Name:\n{{ $('Check if call was outbound').item.json.body.call.call_analysis.custom_analysis_data.first_name }}\n\nClient Number:\n{{ $('Check if call was outbound').item.json.body.call.call_analysis.custom_analysis_data.phone_number }}\n\nAvailabilities:\n{{ $('Check if call was outbound').item.json.body.call.call_analysis.custom_analysis_data.availabilities }}\n\n\nCall Summary:\n{{ $('Check if call was outbound').item.json.body.call.call_analysis.call_summary }}\n\n\nChatGPT analysis of how the call went and suggestions for improving the voice prompt:\n{{ $json.message.content }}",
          "options": {},
          "subject": "=Roofing Appointment Scheduled",
          "emailType": "text"
        },
        "credentials": {
          "gmailOAuth2": {
            "id": "rKxQHWZ2F5XLJmwF",
            "name": "Gmail account"
          }
        },
        "typeVersion": 2.1
      },
      {
        "id": "f75763b6-0867-4625-89e1-cafa3c9e6e44",
        "name": "Sticky Note1",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          -240,
          -420
        ],
        "parameters": {
          "width": 1260,
          "height": 400,
          "content": "# ✅ General Workflow Explanation\n##  This workflow automates outbound and inbound lead calls with RetellAI, Google Sheets, OpenAI, and Gmail. It handles:\n\nScheduling and reminding outbound qualification calls\nHandling inbound appointment calls\nAutomatically updating records and sending summaries post-call\n\n## 👉 Dependencies:\n\nActive RetellAI API key\nGoogle Sheet set up with lead data\nGmail API credentials configured"
        },
        "typeVersion": 1
      }
    ],
    "active": false,
    "pinData": {},
    "settings": {
      "executionOrder": "v1"
    },
    "versionId": "879f8e4d-91d7-41fc-825d-08f2ef283c25",
    "connections": {
      "Check if call was outbound": {
        "main": [
          [
            {
              "node": "Update lead record in Google Sheets",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Generate call summary with OpenAI",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Filter for analyzed calls only": {
        "main": [
          [
            {
              "node": "Check if call was outbound",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Detect new lead in Google Sheets": {
        "main": [
          [
            {
              "node": "Send SMS reminder to call lead in 5 minutes",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Generate call summary with OpenAI": {
        "main": [
          [
            {
              "node": "Send confirmation email to lead",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Wait 5 minutes before making call": {
        "main": [
          [
            {
              "node": "Call new lead using RetellAI",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Update lead record in Google Sheets": {
        "main": [
          [
            {
              "node": "Send call summary email",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Send SMS reminder to call lead in 5 minutes": {
        "main": [
          [
            {
              "node": "Wait 5 minutes before making call",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Receive inbound call from RetellAI (webhook)": {
        "main": [
          [
            {
              "node": "Check if phone number exists in Google Sheets",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Check if phone number exists in Google Sheets": {
        "main": [
          [
            {
              "node": "Send response to inbound webhook call",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Receive post-call data from RetellAI (webhook)": {
        "main": [
          [
            {
              "node": "Filter for analyzed calls only",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  },
  'inventory-sync': {
    "meta": {
      "instanceId": "3da9aa1165fccd6e57ad278dd59febaa1dfaafc31e0e52a95d11801200f09024",
      "templateCredsSetupCompleted": true
    },
    "nodes": [
      {
        "id": "c983fae5-a779-4a56-ace0-304aaefe0433",
        "name": "Append Material Request",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          6780,
          3240
        ],
        "parameters": {
          "columns": {
            "value": {},
            "schema": [
              {
                "id": "Timestamp",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Timestamp",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Product ID",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Product ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Quantity Requested",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Quantity Requested",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Measurement Unit",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Measurement Unit",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Requested By",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Requested By",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Issue Date",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Issue Date",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Description",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Description",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Submission ID",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Submission ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Status",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Status",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Approval Link",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Approval Link",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Request Date",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Request Date",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "autoMapInputData",
            "matchingColumns": [],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "append",
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 328307238,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=328307238",
            "cachedResultName": "Materials Issued"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "25d745c1-8167-4c55-9f88-461f94843286",
        "name": "Get Approvals",
        "type": "n8n-nodes-base.webhook",
        "position": [
          5900,
          4060
        ],
        "webhookId": "33876465-33a7-4cc1-bbb5-bc8c630edd9f",
        "parameters": {
          "path": "/approve-issue",
          "options": {}
        },
        "typeVersion": 2
      },
      {
        "id": "c4d96a9c-b70b-4e40-bf9d-5e8f9426ee22",
        "name": "Standardize Data",
        "type": "n8n-nodes-base.set",
        "position": [
          6120,
          3400
        ],
        "parameters": {
          "options": {},
          "assignments": {
            "assignments": [
              {
                "id": "77dc2acf-9657-4013-9675-99311d299abe",
                "name": "Timestamp",
                "type": "string",
                "value": "={{ $json[\"Timestamp\"] || new Date().toISOString() }}"
              },
              {
                "id": "a5706f57-d7ba-4ffa-a8c6-030bdb2e3d55",
                "name": "Product ID",
                "type": "string",
                "value": "={{ $json.body['Product ID'] }}"
              },
              {
                "id": "53e04ca2-88cb-49a6-b878-4d7abde8806d",
                "name": "Quantity Requested",
                "type": "number",
                "value": "={{ $json.body['Quantity Requested'] }}"
              },
              {
                "id": "9612c7a7-1f76-4168-9c89-d89421cc7c5a",
                "name": "Requested By",
                "type": "string",
                "value": "={{ $json.body['Requested By'] }}"
              },
              {
                "id": "4b0f98cc-3e9f-42a4-81e7-c4c8c0a904eb",
                "name": "Description",
                "type": "string",
                "value": "={{ $json.body.Description }}"
              },
              {
                "id": "a6a134ac-280c-4ef2-bbd6-e121376f9bbf",
                "name": "Submission ID",
                "type": "string",
                "value": "={{ $json.body['Submission ID'] }}"
              },
              {
                "id": "e3a62912-773f-43f2-bf35-5b5e757c345d",
                "name": "Approval Link",
                "type": "string",
                "value": "=https://test.app.n8n.cloud/webhook/approve-issue?submissionId={{ $json.body['Submission ID'] }}\n\n"
              },
              {
                "id": "22fb6d08-5f7e-42dc-a3ea-015f1f4f890c",
                "name": "Status",
                "type": "string",
                "value": "Pending"
              },
              {
                "id": "2c3340dc-b995-4342-9e51-fff09d3d4ca6",
                "name": "Measurement Unit",
                "type": "string",
                "value": "={{ $json.body['Measurement Unit'] }}"
              }
            ]
          },
          "includeOtherFields": "="
        },
        "typeVersion": 3.4
      },
      {
        "id": "47d2bb01-99e6-4ab1-b19d-bc9912243150",
        "name": "Update Stock",
        "type": "n8n-nodes-base.code",
        "position": [
          7440,
          3860
        ],
        "parameters": {
          "jsCode": "const currentStock = parseFloat($input.first().json['Current Stock']\n );\nconst approvedQuantity = parseFloat(\n $('Verify Approval Data').first().json['Approved Quantity']);\nconst newStock = currentStock - approvedQuantity;\n\nif (newStock < 0) throw new Error(`Insufficient stock for ${\n  $('Retrieve Issue Request Details').first().json['Product ID']}`);\n\nreturn {\n  json: {\n    ...$json,\n    \"Updated Current Stock\": newStock,\n\"Material Name\":$input.first().json['Material Name'],\"Measurement Unit\":$input.first().json['Measurement Unit'],\n\"Minimum Stock Level\": \n  $input.first().json['Minimum Stock Level'],\n  \"Issue Date\":\n    $('Retrieve Issue Request Details').first().json['Issue Date'],\n\"Product ID\": \n  $('Retrieve Issue Request Details').first().json['Product ID']\n \n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "dcbb196f-1ecf-4137-af29-e511c4b7b9d9",
        "name": "Receive Issue Request",
        "type": "n8n-nodes-base.webhook",
        "position": [
          5900,
          3400
        ],
        "webhookId": "73d4bdfc-2d8b-42f4-85d5-43ecae0953c1",
        "parameters": {
          "path": "raw-materials-issue",
          "options": {},
          "httpMethod": "POST"
        },
        "typeVersion": 2
      },
      {
        "id": "430599b6-3758-4eb7-a924-8530a7c5dc7e",
        "name": "Send Approval Request",
        "type": "n8n-nodes-base.gmail",
        "position": [
          7660,
          3400
        ],
        "webhookId": "db24c5e3-8113-4d8a-b562-9c248f47fa3c",
        "parameters": {
          "sendTo": "example@gmail.com",
          "message": "=<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Material Issue Request Approval</title>\n  <style>\n    /* Reset and Base Styles */\n    body {\n      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n      line-height: 1.5;\n      color: #444;\n      background-color: #f0f4f8;\n      margin: 0;\n      padding: 0;\n    }\n    .container {\n      width: 90%;\n      max-width: 550px;\n      margin: 15px auto;\n      background-color: #ffffff;\n      border-radius: 8px;\n      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);\n      overflow: hidden;\n      border: 1px solid #e0e6ed;\n    }\n    /* Header with Gradient */\n    .header {\n      background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%);\n      padding: 15px;\n      text-align: center;\n      border-top-left-radius: 8px;\n      border-top-right-radius: 8px;\n    }\n    h2 {\n      color: #ffffff;\n      font-size: 20px;\n      margin: 0;\n      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);\n    }\n    /* Content Area */\n    .content {\n      padding: 15px;\n    }\n    p {\n      margin: 5px 0;\n      font-size: 14px;\n    }\n    p.greeting {\n      font-size: 16px;\n      font-weight: 500;\n      color: #2c3e50;\n    }\n    /* Details List */\n    ul {\n      list-style-type: none;\n      padding: 0;\n      margin: 10px 0;\n      background-color: #f8fafc;\n      padding: 10px;\n      border-radius: 6px;\n      border-left: 4px solid #3498db;\n      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);\n    }\n    ul li {\n      margin: 6px 0;\n      font-size: 13px;\n      display: flex;\n      align-items: center;\n    }\n    ul li strong {\n      display: inline-block;\n      width: 130px;\n      color: #2c3e50;\n      font-weight: 600;\n    }\n    /* Action Buttons */\n    .actions {\n      text-align: center;\n      margin: 10px 0;\n      display: flex;\n      justify-content: center;\n      gap: 10px;\n    }\n    .btn {\n      display: inline-block;\n      padding: 8px 20px;\n      text-decoration: none;\n      color: #ffffff;\n      font-size: 13px;\n      font-weight: 600;\n      border-radius: 20px;\n      transition: transform 0.2s ease, box-shadow 0.3s ease;\n      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n    }\n    .btn:hover {\n      transform: translateY(-2px);\n      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);\n    }\n    .btn-approve {\n      background: linear-gradient(90deg, #2ecc71, #27ae60);\n    }\n    .btn-reject {\n      background: linear-gradient(90deg, #e74c3c, #c0392b);\n    }\n    /* Footer */\n    .footer {\n      text-align: center;\n      padding: 10px;\n      background-color: #f8fafc;\n      border-bottom-left-radius: 8px;\n      border-bottom-right-radius: 8px;\n      font-size: 12px;\n      color: #777;\n      border-top: 1px solid #e0e6ed;\n    }\n    .footer p {\n      margin: 0;\n    }\n    /* Responsive Adjustments */\n    @media (max-width: 600px) {\n      .container {\n        width: 95%;\n        margin: 10px auto;\n      }\n      .header {\n        padding: 10px;\n      }\n      h2 {\n        font-size: 18px;\n      }\n      .content {\n        padding: 10px;\n      }\n      ul li {\n        flex-direction: column;\n        align-items: flex-start;\n      }\n      ul li strong {\n        width: auto;\n        margin-bottom: 3px;\n      }\n      .actions {\n        flex-direction: column;\n        gap: 8px;\n      }\n      .btn {\n        width: 80%;\n      }\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <!-- Header -->\n    <div class=\"header\">\n      <h2>Material Issue Request Approval</h2>\n    </div>\n\n    <!-- Content -->\n    <div class=\"content\">\n      <p class=\"greeting\">Dear XXX,</p>\n      <p>Please review the following material issue request:</p>\n\n      <ul>\n        <li><strong>Product ID:</strong> {{ $('Append Material Request').item.json['Product ID'] }}</li>\n        <li><strong>Material:</strong> {{ $json[\"Material Name\"] }}</li>\n        <li><strong>Quantity Requested:</strong> {{ $('Append Material Request').item.json['Quantity Requested'] }} {{ $json[\"Measurement Unit\"] }}</li>\n        <li><strong>Current Stock:</strong> {{ $json[\"Current Stock\"] }} {{ $json[\"Measurement Unit\"] }}</li>\n        <li><strong>Requested By:</strong> {{ $('Append Material Request').item.json['Requested By'] }}</li>\n       \n        <li><strong>Description:</strong> {{ $('Append Material Request').item.json['Description'] }}</li>\n        <li><strong>Submission ID:</strong> {{ $('Append Material Request').item.json['Submission ID'] }}</li>\n        <li><strong>Stock Available:</strong> {{ $json[\"Is Enough\"] ? \"Yes\" : \"No\" }}</li>\n      </ul>\n\n      <div class=\"actions\">\n        <p><strong>To approve:</strong></p>\n        <a href=\"{{ $('Append Material Request').item.json['Approval Link'] }}&action=approve&quantity={{ $('Append Material Request').item.json['Quantity Requested'] }}&approvedBy=PB\" class=\"btn btn-approve\">Approve Request</a>\n        <p><strong>To reject:</strong></p>\n        <a href=\"{{ $('Append Material Request').item.json['Approval Link'] }}&action=reject&approvedBy=PB\" class=\"btn btn-reject\">Reject Request</a>\n      </div>\n    </div>\n\n    <!-- Footer -->\n    <div class=\"footer\">\n      <p>Regards,<br>Your Company<</p>\n    </div>\n  </div>\n</body>\n</html>",
          "options": {},
          "subject": "=Approval Required: Material Issue Request - {{ $json['Product ID'] }}"
        },
        "typeVersion": 2.1
      },
      {
        "id": "7c68ef5d-5518-4236-803c-157fe8c581dd",
        "name": "Prepare Approval",
        "type": "n8n-nodes-base.code",
        "position": [
          7440,
          3400
        ],
        "parameters": {
          "jsCode": "const currentStock = parseFloat(\n  $input.first().json['Current Stock']|| 0);\nconst quantityRequested = parseFloat(\n$('Append Material Request').first().json['Quantity Requested']);\nconst isEnough = currentStock >= quantityRequested;\n\nreturn {\n  json: {\n  ...$json,\n    \"Current Stock\": currentStock,\n    \"Is Enough\": isEnough,\n    \"Material Name\":$input.first().json['Material Name'],\n\"Unit\":$input.first().json['Measurement Unit'],\n\"Minimum Stock Level\": $input.first().json['Minimum Stock Level']\n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "bf6487d1-dd4e-4bc1-9447-c3aaeffd5df0",
        "name": "Create Record Issue",
        "type": "n8n-nodes-base.supabase",
        "position": [
          6780,
          3560
        ],
        "parameters": {
          "tableId": "Materials Issued",
          "dataToSend": "autoMapInputData"
        },
        "typeVersion": 1
      },
      {
        "id": "86899f38-6412-447f-9b6d-a402f6c39fcd",
        "name": "Search Product ID",
        "type": "n8n-nodes-base.supabase",
        "position": [
          7000,
          3560
        ],
        "parameters": {
          "filters": {
            "conditions": [
              {
                "keyName": "Product ID",
                "keyValue": "={{ $json[\"Product ID\"] }}",
                "condition": "eq"
              }
            ]
          },
          "tableId": "Current Stock",
          "operation": "getAll"
        },
        "typeVersion": 1
      },
      {
        "id": "6bb9053b-9a46-4e9e-9097-d5e2ae99e259",
        "name": "Searck Issues",
        "type": "n8n-nodes-base.supabase",
        "position": [
          6560,
          4220
        ],
        "parameters": {
          "filters": {
            "conditions": [
              {
                "keyName": "Submission ID",
                "keyValue": "={{ $json[\"Submission ID\"] }}",
                "condition": "eq"
              }
            ]
          },
          "tableId": "Materials Issued",
          "operation": "getAll"
        },
        "typeVersion": 1
      },
      {
        "id": "420d242b-6a17-4538-bca1-09283a49742f",
        "name": "Update Current Stck",
        "type": "n8n-nodes-base.supabase",
        "position": [
          7680,
          3740
        ],
        "parameters": {
          "filters": {
            "conditions": [
              {
                "keyName": "Product ID",
                "keyValue": "={{ $json['Product ID'] }}",
                "condition": "eq"
              }
            ]
          },
          "tableId": "Current Stock",
          "fieldsUi": {
            "fieldValues": [
              {
                "fieldId": "Material Name",
                "fieldValue": "={{ $json['Material Name'] }}"
              },
              {
                "fieldId": "Previous Stock",
                "fieldValue": "={{ $json['Current Stock'] }}"
              },
              {
                "fieldId": "Current Stock",
                "fieldValue": "={{ $json['Updated Current Stock'] }}"
              },
              {
                "fieldId": "Last Updated",
                "fieldValue": "={{ $json['Last Updated'] }}"
              },
              {
                "fieldId": "Minimum Stock Level",
                "fieldValue": "={{ $json['Minimum Stock Level'] }}"
              }
            ]
          },
          "operation": "update"
        },
        "typeVersion": 1
      },
      {
        "id": "f4c8cb13-acd9-4d7e-ac73-fb528c1700e1",
        "name": "Merge Lookups",
        "type": "n8n-nodes-base.merge",
        "position": [
          7220,
          3400
        ],
        "parameters": {
          "mode": "chooseBranch"
        },
        "typeVersion": 3.1,
        "alwaysOutputData": true
      },
      {
        "id": "0cc01e7c-aa88-4783-af20-5b98f8795935",
        "name": "Update Current Stock1",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7660,
          3960
        ],
        "parameters": {
          "columns": {
            "value": {
              "Product ID": "={{ $json['Product ID'] }}",
              "Last Updated": "={{ $json['Last Updated'] }}",
              "Current Stock": "={{ $json['Updated Current Stock'] }}",
              "Material Name": "={{ $json['Material Name'] }}",
              "Previous Stock": "={{ $json['Current Stock'] }}",
              "Minimum Stock Level": "={{ $json['Minimum Stock Level'] }}"
            },
            "schema": [
              {
                "id": "Product ID",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Product ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Material Name",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Material Name",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Previous Stock",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Previous Stock",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Current Stock",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Current Stock",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Measurement Unit",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Measurement Unit",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Last Updated",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Last Updated",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Minimum Stock Level",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Minimum Stock Level",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "row_number",
                "type": "string",
                "display": true,
                "removed": true,
                "readOnly": true,
                "required": false,
                "displayName": "row_number",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "defineBelow",
            "matchingColumns": [
              "Product ID"
            ],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "update",
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "67cf6b2c-7166-4075-904b-67c82d94df70",
        "name": "LookUp Current stock1",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7880,
          3960
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json['Product ID'] }}",
                "lookupColumn": "Product ID"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "bb65a800-e307-46a9-a668-b3e7afa32792",
        "name": "Low stock Detection1",
        "type": "n8n-nodes-base.code",
        "position": [
          8100,
          3960
        ],
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": "const currentStock = parseFloat($input.item.json[\"Current Stock\"]);\nconst minStock = parseFloat($input.item.json[\"Minimum Stock Level\"]);\n\n// Check if stock is below minimum\nconst isLow = currentStock < minStock;\n\nreturn {\n  json: {\n    ...$input.item.json,\n    \"Is Low\": isLow,\n    \"Alert Message\": isLow ? \n      `Low stock alert: ${$input.item.json[\"Material Name\"]} (ID: ${$input.item.json[\"Product ID\"]}) - Current Stock: ${currentStock} ${$input.item.json[\"Measurement Unit\"]}, Minimum: ${minStock}` \n      : null\n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "02bd1da9-ecdf-4d05-aa1f-9974f00849b7",
        "name": "Merge1",
        "type": "n8n-nodes-base.merge",
        "position": [
          6780,
          4060
        ],
        "parameters": {
          "mode": "chooseBranch"
        },
        "typeVersion": 3.1,
        "alwaysOutputData": true
      },
      {
        "id": "1e06a4e7-243a-40cd-8aef-1a06a373778a",
        "name": "Sticky Note",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          5840,
          3060
        ],
        "parameters": {
          "width": 2820,
          "height": 1400,
          "content": "# Material Issue Request and Approval"
        },
        "typeVersion": 1
      },
      {
        "id": "ee7270e1-83ff-4d91-8ba8-db4f13c63a57",
        "name": "Append Raw Materials",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          6660,
          1820
        ],
        "parameters": {
          "columns": {
            "value": {},
            "schema": [
              {
                "id": "Timestamp",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Timestamp",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Product ID",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Product ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Supplier Name",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Supplier Name",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Material Name",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Material Name",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Quantity Received",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Quantity Received",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Description",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Description",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Measurement Unit",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Measurement Unit",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Unit Price",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Unit Price",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Date of Delivery",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Date of Delivery",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Received By",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Received By",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Total Price",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Total Price",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Submission ID",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Submission ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "autoMapInputData",
            "matchingColumns": [],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "append",
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1680576943,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1680576943",
            "cachedResultName": "Raw Materials"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "21c17077-9f9a-489a-b6a5-ea7a70a85cee",
        "name": "Calculate Total Price",
        "type": "n8n-nodes-base.code",
        "position": [
          6340,
          2040
        ],
        "parameters": {
          "jsCode": "// Get the input data\nconst input = $input.all()[0].json;\n\n// Debug: Log the entire input to see all available fields\nconsole.log(\"Complete Input Data:\", JSON.stringify(input, null, 2));\n\n// Improved number parser that handles different formats\nconst getNumber = (value) => {\n  if (value === undefined || value === null || value === \"\") return null;\n  \n  // Remove any currency symbols, commas, or extra spaces\n  const cleaned = String(value)\n    .replace(/[^\\d.-]/g, '')\n    .trim();\n    \n  const num = parseFloat(cleaned);\n  return isNaN(num) ? null : num;\n};\n\n// Use EXACT field names from your webhook payload\nconst quantity = getNumber(input[\"Quantity Received\"]);  // Not \"Quantity Received\"\nconst unitPrice = getNumber(input[\"Unit Price\"]);    // Not \"Unit Price\"\n\n// Validate\nif (quantity === null) throw new Error(`Invalid quantity: ${input[\"Quantity Received\"]}`);\nif (unitPrice === null) throw new Error(`Invalid price: ${input[\"Unit Price\"]}`);\n\n// Calculate total\nconst totalPrice = quantity * unitPrice;\n\n// Return results\n// Return clean output without debug info\nreturn {\n  json: {\n    \"Timestamp\": new Date().toISOString(),\n    \"Product ID\": input[\"Product ID\"],\n    \"Supplier Name\": input[\"Supplier Name\"],\n    \"Material Name\": input[\"Material Name\"],\n    \"Quantity Received\": quantity,\n    \"Description\": input[\"Description\"] || \"\",\n    \"Measurement Unit\": input[\"Measurement Unit\"],\n    \"Unit Price\": unitPrice,\n    \"Total Price\": totalPrice.toFixed(2),\n    \"Date of Delivery\": input[\"Date of Delivery\"],\n    \"Received By\": input[\"Received By\"],\n    \"Submission ID\": input[\"Submission ID\"]\n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "4ce817b0-2283-438f-82c7-6f4901fffdd3",
        "name": "Calculate Updated Current Stock",
        "type": "n8n-nodes-base.code",
        "position": [
          7640,
          1840
        ],
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": "const existingStock = parseFloat(\n$('Lookup Existing Stock').first().json['Current Stock']\n|| 0);\nconst newQuantity = parseFloat(\n  $('Validate Quantity Received').first().json['Quantity Received']);\nconst updatedStock = existingStock + newQuantity;\n\n\n  \nreturn {\n  json: {\n    ...$json,\n    \"Updated Current Stock\": updatedStock\n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "79fa9b6a-45c7-43bd-b5ba-bc2526a87d1e",
        "name": "Validate Quantity Received",
        "type": "n8n-nodes-base.code",
        "position": [
          6840,
          1820
        ],
        "parameters": {
          "jsCode": "const input = $input.all()[0].json;\n\nconst getNumber = (value) => {\n  if (!value) return 0; // Default to 0 if null/undefined\n  const cleaned = String(value).replace(/[^\\d.-]/g, '').trim();\n  const num = parseFloat(cleaned);\n  return isNaN(num) ? 0 : num;\n};\n\n\n// Use EXACT field names from your webhook payload\nconst quantity = getNumber(input[\"Quantity Received\"]);  // Not \"Quantity Received\"\nif (quantity === 0) throw new Error(`Invalid quantity: ${input[\"Quantity Received\"]}`);\n\nreturn {\n  json: {\n    ...input,\n    \"Quantity Received\": quantity // Ensure it’s a number\n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "298cee40-074c-4888-af10-05b0be136a75",
        "name": "Initialize New Product stock",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7860,
          2200
        ],
        "parameters": {
          "columns": {
            "value": {
              "Product ID": "={{ $('Validate Quantity Received').item.json['Product ID'] }}",
              "Last Updated": "={{ $('Validate Quantity Received').item.json['Date of Delivery'] }}",
              "Current Stock": "={{ $('Validate Quantity Received').item.json['Quantity Received'] }}",
              "Material Name": "={{ $('Validate Quantity Received').item.json['Material Name'] }}",
              "Previous Stock": "=0",
              "Measurement Unit": "={{ $('Validate Quantity Received').item.json['Measurement Unit'] }}",
              "Minimum Stock Level": "50"
            },
            "schema": [
              {
                "id": "Product ID",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Product ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Material Name",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Material Name",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Previous Stock",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Previous Stock",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Current Stock",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Current Stock",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Measurement Unit",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Measurement Unit",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Last Updated",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Last Updated",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Minimum Stock Level",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Minimum Stock Level",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "defineBelow",
            "matchingColumns": [],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "append",
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "4f102052-db49-4767-b856-41d5e4a6cf33",
        "name": "Update Current Stock",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7860,
          1940
        ],
        "parameters": {
          "columns": {
            "value": {
              "Product ID": "={{ $json[\"Product ID\"] }}",
              "Last Updated": "={{ $json['Last Updated'] }}",
              "Current Stock": "={{ $json['Updated Current Stock'] }}",
              "Material Name": "={{ $json['Material Name'] }}",
              "Measurement Unit": "={{ $json['Measurement Unit'] }}",
              "Minimum Stock Level": "50"
            },
            "schema": [
              {
                "id": "Product ID",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Product ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Material Name",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Material Name",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Previous Stock",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Previous Stock",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Current Stock",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Current Stock",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Measurement Unit",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Measurement Unit",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Last Updated",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Last Updated",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Minimum Stock Level",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Minimum Stock Level",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "row_number",
                "type": "string",
                "display": true,
                "removed": true,
                "readOnly": true,
                "required": false,
                "displayName": "row_number",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "defineBelow",
            "matchingColumns": [
              "Product ID"
            ],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "update",
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "33d107ac-960e-44aa-b643-993ef4973beb",
        "name": "LookUp Current stock",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          8080,
          1940
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json['Product ID'] }}",
                "lookupColumn": "Product ID"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "e0c03d90-f580-43f4-b794-2d278d123b08",
        "name": "New Row Current Stock",
        "type": "n8n-nodes-base.supabase",
        "position": [
          7860,
          2520
        ],
        "parameters": {
          "tableId": "Current Stock",
          "fieldsUi": {
            "fieldValues": [
              {
                "fieldId": "Product ID",
                "fieldValue": "={{ $('Validate Quantity Received').item.json['Product ID'] }}"
              },
              {
                "fieldId": "Material Name",
                "fieldValue": "={{ $('Validate Quantity Received').item.json['Material Name'] }}"
              },
              {
                "fieldId": "Previous Stock",
                "fieldValue": "0"
              },
              {
                "fieldId": "Current Stock",
                "fieldValue": "={{ $('Validate Quantity Received').item.json['Quantity Received'] }}"
              },
              {
                "fieldId": "Measurement Unit",
                "fieldValue": "={{ $('Validate Quantity Received').item.json['Measurement Unit'] }}"
              },
              {
                "fieldId": "Last Updated",
                "fieldValue": "={{ $('Validate Quantity Received').item.json['Date of Delivery'] }}"
              },
              {
                "fieldId": "Minimum Stock Level",
                "fieldValue": "50"
              }
            ]
          }
        },
        "typeVersion": 1
      },
      {
        "id": "f9e1fae8-ce0a-4ab7-9dbb-f2eaccdf0ac9",
        "name": "Current Stock Update",
        "type": "n8n-nodes-base.supabase",
        "position": [
          7860,
          1720
        ],
        "parameters": {
          "filters": {
            "conditions": [
              {
                "keyName": "Product ID",
                "keyValue": "={{ $json['Product ID'] }}",
                "condition": "eq"
              }
            ]
          },
          "tableId": "Current Stock",
          "fieldsUi": {
            "fieldValues": [
              {
                "fieldId": "Product ID",
                "fieldValue": "={{ $json['Product ID'] }}"
              },
              {
                "fieldId": "Material Name",
                "fieldValue": "={{ $json['Material Name'] }}"
              },
              {
                "fieldId": "Current Stock",
                "fieldValue": "={{ $json['Updated Current Stock'] }}"
              },
              {
                "fieldId": "Measurement Unit",
                "fieldValue": "={{ $json['Measurement Unit'] }}"
              },
              {
                "fieldId": "Last Updated",
                "fieldValue": "={{ $json['Last Updated'] }}"
              },
              {
                "fieldId": "Minimum Stock Level",
                "fieldValue": "50"
              }
            ]
          },
          "operation": "update"
        },
        "typeVersion": 1
      },
      {
        "id": "ef8ac9f6-a26e-4e74-b0f6-59066991a343",
        "name": "Search Current Stock",
        "type": "n8n-nodes-base.supabase",
        "position": [
          6960,
          2260
        ],
        "parameters": {
          "filters": {
            "conditions": [
              {
                "keyName": "Product ID",
                "keyValue": "={{ $json[\"Product ID\"] }}",
                "condition": "eq"
              }
            ]
          },
          "tableId": "Current Stock",
          "operation": "getAll",
          "returnAll": true
        },
        "typeVersion": 1,
        "alwaysOutputData": true
      },
      {
        "id": "3e519621-e955-4033-8197-249c5e153dea",
        "name": "Format response",
        "type": "n8n-nodes-base.itemLists",
        "position": [
          7620,
          2220
        ],
        "parameters": {
          "operation": "removeDuplicates"
        },
        "typeVersion": 3
      },
      {
        "id": "16b0aefb-b295-47ef-b818-ab133ac8190f",
        "name": "Merge",
        "type": "n8n-nodes-base.merge",
        "position": [
          7200,
          2040
        ],
        "parameters": {
          "mode": "chooseBranch"
        },
        "typeVersion": 3.1,
        "alwaysOutputData": true
      },
      {
        "id": "d7f06346-91fc-427a-ad23-e1547180f3e3",
        "name": "Low stock Detection2",
        "type": "n8n-nodes-base.code",
        "position": [
          8380,
          1940
        ],
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": "const currentStock = parseFloat($input.item.json[\"Current Stock\"]);\nconst minStock = parseFloat($input.item.json[\"Minimum Stock Level\"]);\n\n// Check if stock is below minimum\nconst isLow = currentStock < minStock;\n\nreturn {\n  json: {\n    ...$input.item.json,\n    \"Is Low\": isLow,\n    \"Alert Message\": isLow ? \n      `Low stock alert: ${$input.item.json[\"Material Name\"]} (ID: ${$input.item.json[\"Product ID\"]}) - Current Stock: ${currentStock} ${$input.item.json[\"Measurement Unit\"]}, Minimum: ${minStock}` \n      : null\n  }\n};"
        },
        "typeVersion": 2
      },
      {
        "id": "1c054902-eb01-4f22-9e0b-31077a0ea978",
        "name": "Sticky Note4",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          5820,
          1620
        ],
        "parameters": {
          "color": 3,
          "width": 2840,
          "height": 1380,
          "content": "# Raw Materials Receiving and Stock Update"
        },
        "typeVersion": 1
      },
      {
        "id": "e0003f1e-1ab5-4b7e-a241-02eeed000c51",
        "name": "Sticky Note2",
        "type": "n8n-nodes-base.stickyNote",
        "position": [
          8720,
          1620
        ],
        "parameters": {
          "width": 2700,
          "height": 2840,
          "content": "![INVENTORY AUTOMATION SYSTEM.png](1)\n# Raw Materials Inventory Management with Google Sheets and Supabase using n8n Webhooks\n\n\n## Introduction\nThis n8n automation streamlines raw materials inventory management by automating the receipt of materials, issuing materials upon approval, updating stock levels, and sending low stock alerts. It integrates webhooks, Google Sheets, Supabase, and Gmail to ensure efficient inventory tracking and communication.\n\n## Problem Statement\nManual inventory management is time-consuming and error-prone, often leading to stock discrepancies, delayed approvals for material issuance, and missed low stock alerts. This automation addresses these issues by providing a seamless workflow for receiving raw materials, processing issue requests, and monitoring stock levels in real time.\n\n## Target Audience\nThis template is designed for:\n- Small to medium-sized businesses managing raw materials inventory.\n- Inventory managers seeking to automate stock updates and approvals.\n- n8n users familiar with Google Sheets, Supabase, and Gmail integrations.\n\n## Description\n\n### Flow 1: Raw Materials Receiving and Stock Update\n**Purpose**: Automates the receipt of raw materials, calculates costs, updates stock, and sends low stock alerts.\n\n- **Receive Raw Materials Webhook**\n  - **Purpose**: Receives raw material data via HTTP POST at a webhook URL from a form submission.\n  - **Input**: JSON with fields like `product_id`, `quantity_received`, `unit_price`, submitted via a form (e.g., Google Form or custom form).\n  - **Output**: Raw webhook data.\n  - **Notes**: Expects `Content-Type: application/json`.\n\n- **Standardize Raw Material Data**\n  - **Purpose**: Maps webhook data into a consistent format.\n  - **Input**: Webhook JSON from form submission.\n  - **Output**: JSON with fields like `Timestamp`, `Product ID`, `Quantity Received`.\n  - **Notes**: Aligns field names for downstream nodes.\n\n- **Calculate Total Price**\n  - **Purpose**: Computes total cost and validates numeric inputs.\n  - **Input**: Standardized JSON.\n  - **Output**: JSON with `Total Price` (Quantity Received * Unit Price).\n  - **Notes**: Uses a custom function to handle invalid numbers.\n\n- **Append Raw Materials**\n  - **Purpose**: Records the receipt in Google Sheets.\n  - **Input**: Calculated JSON.\n  - **Output**: Updated \"Raw Materials\" sheet with new record.\n  - **Notes**: Requires Google Sheets credentials (to be configured by the user).\n\n- **Check Quantity Received Validity**\n  - **Purpose**: Ensures `Quantity Received` is a positive number.\n  - **Input**: JSON from Append Raw Materials.\n  - **Output**: Validated JSON with numeric `Quantity Received`.\n  - **Notes**: Throws error if invalid.\n\n- **Lookup Existing Stock**\n  - **Purpose**: Retrieves existing stock for the `Product ID`.\n  - **Input**: Validated JSON.\n  - **Output**: JSON with `Current Stock` from \"Current Stock\" sheet.\n  - **Notes**: Google Sheets lookup by `Product ID`.\n\n- **Check If Product Exists**\n  - **Purpose**: Branches based on whether the `Product ID` exists in stock.\n  - **Input**: JSON from Lookup Existing Stock.\n  - **Output**: True/False branch.\n  - **Notes**: Condition checks for `Product ID` existence.\n\n- **Calculate Updated Current Stock** (True Branch)\n  - **Purpose**: Updates stock by adding `Quantity Received`.\n  - **Input**: JSON with existing stock.\n  - **Output**: JSON with `Updated Current Stock`.\n  - **Notes**: Ensures numeric accuracy.\n\n- **Update Current Stock** (True Branch)\n  - **Purpose**: Updates the \"Current Stock\" sheet with new stock.\n  - **Input**: Updated stock JSON.\n  - **Output**: Updated \"Current Stock\" sheet.\n  - **Notes**: Matches by `Product ID`.\n\n- **Retrieve Updated Stock for Check** (True Branch)\n  - **Purpose**: Retrieves updated stock for low stock check.\n  - **Input**: Updated stock JSON.\n  - **Output**: JSON with current stock data.\n  - **Notes**: Google Sheets lookup.\n\n- **Detect Low Stock Level** (True Branch)\n  - **Purpose**: Flags if stock falls below the minimum level.\n  - **Input**: Retrieved stock data.\n  - **Output**: JSON with `Is Low` flag and `Alert Message`.\n  - **Notes**: Compares with `Minimum Stock Level` (default: 50).\n\n- **Trigger Low Stock Alert** (True Branch)\n  - **Purpose**: Triggers notification if stock is low.\n  - **Input**: Low stock detection JSON.\n  - **Output**: True branch sends email.\n  - **Notes**: Condition: `{{ $json['Is Low'] }}`.\n\n- **Send Low Stock Email Alert** (True Branch, Low)\n  - **Purpose**: Sends low stock alert email to the stock manager.\n  - **Input**: JSON with alert details.\n  - **Output**: HTML email to a user-configured email address.\n  - **Notes**: Includes product info and reorder link; email address must be set by the user.\n\n- **Add New Product to Stock** (False Branch)\n  - **Purpose**: Adds new product to \"Current Stock\" sheet.\n  - **Input**: Validated JSON.\n  - **Output**: New row with initial stock (Quantity Received).\n  - **Notes**: Sets `Minimum Stock Level` to 50.\n\n- **Current Stock Update** (True Branch, Supabase)\n  - **Purpose**: Updates Supabase `Current Stock` table.\n  - **Input**: Updated stock JSON.\n  - **Output**: Updated Supabase record.\n  - **Notes**: Matches by `Product ID`; requires user-configured Supabase credentials.\n\n- **New Row Current Stock** (False Branch, Supabase)\n  - **Purpose**: Inserts new product into Supabase `Current Stock` table.\n  - **Input**: Validated JSON.\n  - **Output**: New Supabase record.\n  - **Notes**: Sets initial stock; requires Supabase credentials.\n\n- **Search Current Stock** (Supabase)\n  - **Purpose**: Retrieves `Current Stock` records for `Product ID`.\n  - **Input**: JSON with `Product ID`.\n  - **Output**: JSON array of matching records.\n  - **Notes**: Uses `returnAll: true`.\n\n- **New Record Raw** (Supabase)\n  - **Purpose**: Inserts raw material record into Supabase `Raw Materials` table.\n  - **Input**: Calculated JSON.\n  - **Output**: New Supabase record.\n  - **Notes**: Auto-maps input data.\n\n- **Format Response**\n  - **Purpose**: Removes duplicates from response.\n  - **Input**: Search Current Stock data.\n  - **Output**: Cleaned JSON array.\n  - **Notes**: Ensures unique records.\n\n- **Combine Stock Update Branches**\n  - **Purpose**: Combines branches (existing/new product).\n  - **Input**: Outputs from Check If Product Exists branches.\n  - **Output**: Merged JSON.\n  - **Notes**: Ensures data continuity.\n\n**Impact**: Automates raw material receipt, ensures accurate stock updates, and provides timely low stock notifications.\n\n### Flow 2: Material Issue Request and Approval\n**Purpose**: Automates material issue requests, processes approvals/rejections, updates stock, and sends low stock alerts.\n\n- **Receive Material Issue Webhook**\n  - **Purpose**: Receives material issue request via HTTP POST at a webhook URL from a form submission.\n  - **Input**: JSON with `Product ID`, `Quantity Requested`, etc., submitted via a form (e.g., Google Form or custom form).\n  - **Output**: Raw webhook data.\n  - **Notes**: Webhook trigger for issue requests.\n\n- **Standardize Data**\n  - **Purpose**: Normalizes request data and generates approval link.\n  - **Input**: Webhook JSON from form submission.\n  - **Output**: JSON with `Status` \"Pending,\" `Approval Link`.\n  - **Notes**: Maps form fields for consistency.\n\n- **Validate Issue Request Data**\n  - **Purpose**: Ensures `Quantity Requested` is a positive number.\n  - **Input**: Standardized JSON.\n  - **Output**: Validated JSON or error.\n  - **Notes**: JavaScript validation.\n\n- **Verify Requested Quantity**\n  - **Purpose**: Validates additional fields like `Product ID` and `Submission ID`.\n  - **Input**: Validated JSON.\n  - **Output**: Further validated JSON or error.\n  - **Notes**: Ensures data integrity.\n\n- **Append Material Request**\n  - **Purpose**: Records request in \"Materials Issued\" sheet.\n  - **Input**: Verified JSON.\n  - **Output**: Updated \"Materials Issued\" sheet.\n  - **Notes**: Google Sheets append operation.\n\n- **Check Available Stock for Issue**\n  - **Purpose**: Retrieves `Current Stock` for `Product ID`.\n  - **Input**: Appended JSON.\n  - **Output**: JSON with stock data.\n  - **Notes**: Google Sheets lookup.\n\n#### Approval Process\nThe following steps handle the approval of material issue requests, ensuring that requests are reviewed and either approved or rejected before stock is updated.\n\n- **Prepare Approval**\n  - **Purpose**: Checks if stock is sufficient to fulfill the request.\n  - **Input**: Stock data from Check Available Stock for Issue.\n  - **Output**: JSON with `Is Enough` flag (true if `Current Stock` >= `Quantity Requested`).\n  - **Notes**: Prepares data for the approval email.\n\n- **Send Approval Request**\n  - **Purpose**: Sends an email to the approver with clickable Approve/Reject buttons.\n  - **Input**: JSON with `Is Enough`, `Product ID`, `Quantity Requested`, and `Approval Link`.\n  - **Output**: HTML email to a user-configured email address.\n  - **Notes**: Email contains buttons linking to the Receive Approval Response webhook; email address must be set by the user.\n\n- **Receive Approval Response**\n  - **Purpose**: Captures the approver’s decision via a webhook triggered by clicking Approve/Reject.\n  - **Input**: Webhook parameters like `submissionId`, `action` (\"approve\" or \"reject\"), `quantity`.\n  - **Output**: Raw webhook data with approval details.\n  - **Notes**: Webhook URL must be configured to match the links in the approval email.\n\n- **Format Approval Response**\n  - **Purpose**: Processes the approval response and adds metadata.\n  - **Input**: Webhook JSON from Receive Approval Response.\n  - **Output**: JSON with `Action`, `Approved Quantity`, `Approval Date`.\n  - **Notes**: Sets `Approval Date` to the current timestamp.\n\n- **Verify Approval Data**\n  - **Purpose**: Validates the approval response to ensure it’s complete and correct.\n  - **Input**: Formatted JSON.\n  - **Output**: Validated JSON or error.\n  - **Notes**: Checks for valid `Submission ID`, `Action`, and `Approved Quantity` (> 0).\n\n- **Retrieve Issue Request Details**\n  - **Purpose**: Retrieves the original issue request for updating.\n  - **Input**: Validated JSON with `Submission ID`.\n  - **Output**: JSON with request data from \"Materials Issued\" sheet.\n  - **Notes**: Google Sheets lookup by `Submission ID`.\n\n- **Process Approval Decision**\n  - **Purpose**: Branches the flow based on the approver’s decision.\n  - **Input**: JSON with `Action` (\"approve\" or \"reject\").\n  - **Output**: True branch (approved) or False branch (rejected).\n  - **Notes**: Condition: `{{ $json['Action'] === \"approve\" }}`.\n\n#### Post-Approval Steps\n- **Get Stock for Issue Update** (True Branch, Approved)\n  - **Purpose**: Retrieves the latest `Current Stock` before updating.\n  - **Input**: Approved JSON.\n  - **Output**: JSON with stock data.\n  - **Notes**: Google Sheets lookup.\n\n- **Deduct Issued Stock** (True Branch, Approved)\n  - **Purpose**: Reduces stock by `Approved Quantity`.\n  - **Input**: Stock and approval data.\n  - **Output**: JSON with `Updated Current Stock`.\n  - **Notes**: Errors if stock is insufficient.\n\n- **Update Stock After Issue** (True Branch, Approved)\n  - **Purpose**: Updates \"Current Stock\" sheet with new stock.\n  - **Input**: Updated stock JSON.\n  - **Output**: Updated \"Current Stock\" sheet.\n  - **Notes**: Matches by `Product ID`.\n\n- **Retrieve Stock After Issue** (True Branch, Approved)\n  - **Purpose**: Retrieves updated stock for low stock check.\n  - **Input**: Updated stock JSON.\n  - **Output**: JSON with stock data.\n  - **Notes**: Google Sheets lookup.\n\n- **Detect Low Stock After Issue** (True Branch, Approved)\n  - **Purpose**: Flags if stock is low after issuance.\n  - **Input**: Retrieved stock data.\n  - **Output**: JSON with `Is Low` flag and `Alert Message`.\n  - **Notes**: Compares with `Minimum Stock Level`.\n\n- **Trigger Low Stock Alert After Issue** (True Branch, Approved)\n  - **Purpose**: Triggers notification if stock is low.\n  - **Input**: Low stock detection JSON.\n  - **Output**: True branch sends email.\n  - **Notes**: Condition: `{{ $json['Is Low'] }}`.\n\n- **Send Low Stock Email After Issue** (True Branch, Low)\n  - **Purpose**: Sends low stock alert email.\n  - **Input**: JSON with alert details.\n  - **Output**: HTML email to a user-configured email address.\n  - **Notes**: Includes product info; email address must be set by the user.\n\n- **Update Issue Request Status** (True/False Branch)\n  - **Purpose**: Updates request status in \"Materials Issued\" sheet.\n  - **Input**: Approval action JSON.\n  - **Output**: Updated sheet with `Status` \"Approved\" or \"Rejected.\"\n  - **Notes**: Google Sheets update; includes `Approved By` and `Approval Date` if approved.\n\n- **Combine Stock Lookup Results**\n  - **Purpose**: Combines stock lookup branches.\n  - **Input**: Outputs from Check Available Stock for Issue and Search Stock by Product ID.\n  - **Output**: Merged JSON.\n  - **Notes**: Ensures data continuity.\n\n- **Create Record Issue** (Supabase)\n  - **Purpose**: Inserts issue request into Supabase `Materials Issued` table.\n  - **Input**: Verified JSON.\n  - **Output**: New Supabase record.\n  - **Notes**: Auto-maps data; requires user-configured credentials.\n\n- **Search Stock by Product ID** (Supabase)\n  - **Purpose**: Retrieves `Current Stock` records.\n  - **Input**: JSON with `Product ID`.\n  - **Output**: JSON array of records.\n  - **Notes**: Filters by `Product ID`.\n\n- **Issues Table Update** (Supabase, True/False Branch)\n  - **Purpose**: Updates Supabase `Materials Issued` table.\n  - **Input**: Approval action JSON.\n  - **Output**: Updated Supabase record.\n  - **Notes**: Matches by `Submission ID`.\n\n- **Update Current Stock** (Supabase, True Branch)\n  - **Purpose**: Updates Supabase `Current Stock` table.\n  - **Input**: Updated stock JSON.\n  - **Output**: Updated Supabase record.\n  - **Notes**: Matches by `Product ID`.\n\n- **Combine Issue Lookup Branches**\n  - **Purpose**: Combines issue lookup branches.\n  - **Input**: Outputs from Retrieve Issue Request Details and Search Issue by Submission ID.\n  - **Output**: Merged JSON.\n  - **Notes**: Ensures data continuity.\n\n- **Search Issue by Submission ID** (Supabase)\n  - **Purpose**: Retrieves issue records by `Submission ID`.\n  - **Input**: Validated JSON.\n  - **Output**: JSON array of records.\n  - **Notes**: Filters by `Submission ID`.\n\n**Impact**: Streamlines material issuance, ensures accurate stock updates, and provides proactive low stock alerts.\n\n## Conclusion\nThis automation enhances inventory management by integrating n8n with Google Sheets, Supabase, and Gmail. It reduces manual effort, ensures data accuracy, and keeps teams informed with timely alerts. Community feedback and contributions are welcome!"
        },
        "typeVersion": 1
      },
      {
        "id": "8b6ee379-d020-44d7-892f-7b5479fa6944",
        "name": "Receive Raw Materials Webhook",
        "type": "n8n-nodes-base.webhook",
        "position": [
          5940,
          2040
        ],
        "webhookId": "be8290c0-bdd9-489e-938a-ba7a3dd5745e",
        "parameters": {
          "path": "Pb-raw-materials",
          "options": {
            "responseHeaders": {
              "entries": [
                {
                  "name": "Content-Type",
                  "value": "application/json"
                }
              ]
            }
          },
          "httpMethod": "POST"
        },
        "typeVersion": 2
      },
      {
        "id": "087a3182-2a5d-47a0-a3ac-33f1f3eb6a31",
        "name": "Standardize Raw Material Data",
        "type": "n8n-nodes-base.set",
        "position": [
          6160,
          2040
        ],
        "parameters": {
          "options": {},
          "assignments": {
            "assignments": [
              {
                "id": "f3b4487d-ab8e-4b5d-9bea-19ec7195a76c",
                "name": "Timestamp",
                "type": "string",
                "value": "={{ $json.body.timestamp }}"
              },
              {
                "id": "f2f15ff8-d8f6-4bd6-b892-ec2fc1f92c29",
                "name": "Product ID",
                "type": "string",
                "value": "={{ $json.body.product_id }}"
              },
              {
                "id": "9e48b196-6176-4077-bac9-32bef81dd1c0",
                "name": "Supplier Name",
                "type": "string",
                "value": "={{ $json.body.supplier_name }}"
              },
              {
                "id": "4b79875e-f4ee-4452-8507-5c7f2d85786e",
                "name": "Quantity Received",
                "type": "number",
                "value": "={{ $json.body.quantity_received }}"
              },
              {
                "id": "d223e0fa-f80a-4cdb-9d34-60f453feecc0",
                "name": "Description",
                "type": "string",
                "value": "={{ $json.body.description }}"
              },
              {
                "id": "f87b4c22-d8db-470b-9c65-14a3e07ba31a",
                "name": "Measurement Unit",
                "type": "string",
                "value": "={{ $json.body.measurement_unit }}"
              },
              {
                "id": "0a0be214-59b7-4cb6-9d0e-0c3e06bba070",
                "name": "Unit Price",
                "type": "number",
                "value": "={{ $json.body.unit_price }}"
              },
              {
                "id": "0bbac1f8-c89b-4af8-a82e-3f937014bbce",
                "name": "Date of Delivery",
                "type": "string",
                "value": "={{ $json.body.date_of_delivery }}"
              },
              {
                "id": "02cd7f92-cd88-48ed-9f9d-8a64a5d1c95e",
                "name": "Received By",
                "type": "string",
                "value": "={{ $json.body.received_by }}"
              },
              {
                "id": "5a484f8b-a3f7-48bf-a34c-78e1f5e22af5",
                "name": "Total Price",
                "type": "string",
                "value": "={{ $json.body.total_price }}"
              },
              {
                "id": "2bbf891b-372c-4f81-9176-bc50a94a543a",
                "name": "Material Name",
                "type": "string",
                "value": "={{ $json.body.material_name }}"
              },
              {
                "id": "f5ce72d9-a704-4410-ae5b-2c0b1a3b907b",
                "name": "Submission ID",
                "type": "string",
                "value": "={{ $json.body.submissionId }}"
              }
            ]
          },
          "includeOtherFields": "="
        },
        "typeVersion": 3.4
      },
      {
        "id": "ff7d279b-2447-4423-a0ff-4512e4a8a913",
        "name": "Lookup Existing Stock",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7000,
          1820
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json[\"Product ID\"] }}",
                "lookupColumn": "Product ID"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5,
        "alwaysOutputData": true
      },
      {
        "id": "52698913-69d6-4473-9e77-7ef4530bf81a",
        "name": "Check If Product ID Exists",
        "type": "n8n-nodes-base.if",
        "position": [
          7420,
          2040
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "loose"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "bcff2100-54d5-4480-87ab-1d7ce23bd007",
                "operator": {
                  "type": "string",
                  "operation": "exists",
                  "singleValue": true
                },
                "leftValue": "={{ $json[\"Product ID\"] }}",
                "rightValue": ""
              }
            ]
          },
          "looseTypeValidation": true
        },
        "typeVersion": 2.2
      },
      {
        "id": "ecc30bd0-206e-448f-952a-7a2c4ea98bc5",
        "name": "New Record Row",
        "type": "n8n-nodes-base.supabase",
        "position": [
          6700,
          2260
        ],
        "parameters": {
          "tableId": "Raw Materials",
          "dataToSend": "autoMapInputData"
        },
        "typeVersion": 1
      },
      {
        "id": "9ffaeb38-b6fc-47f7-8611-c7da61c9cd08",
        "name": "Trigger Low Stock Alert",
        "type": "n8n-nodes-base.if",
        "position": [
          8200,
          2280
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "e0493b94-1e9c-4f68-ba66-4abd2bd5b569",
                "operator": {
                  "type": "boolean",
                  "operation": "true",
                  "singleValue": true
                },
                "leftValue": "={{ $json['Is Low'] }}",
                "rightValue": "="
              }
            ]
          }
        },
        "typeVersion": 2.2
      },
      {
        "id": "469bb7fe-5595-4503-9034-8df0c974cbc2",
        "name": "Send Low Stock Email Alert",
        "type": "n8n-nodes-base.gmail",
        "position": [
          8440,
          2260
        ],
        "webhookId": "fd7aff46-cf63-4ca3-9406-0b90c2f8aa8b",
        "parameters": {
          "sendTo": "example@gmail.com",
          "message": "=<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Low Stock Alert</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n      color: #333;\n      background-color: #f4f4f4;\n      margin: 0;\n      padding: 0;\n    }\n    .container {\n      width: 80%;\n      max-width: 600px;\n      margin: 20px auto;\n      background-color: #fff;\n      padding: 20px;\n      border-radius: 8px;\n      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\n    }\n    h2 {\n      color: #e74c3c;\n      text-align: center;\n    }\n    p {\n      margin: 10px 0;\n    }\n    .alert-message {\n      background-color: #ffe6e6;\n      padding: 15px;\n      border-left: 4px solid #e74c3c;\n      margin: 20px 0;\n      font-weight: bold;\n    }\n    ul {\n      list-style-type: none;\n      padding: 0;\n      margin: 20px 0;\n      background-color: #f9f9f9;\n      padding: 15px;\n      border-left: 4px solid #3498db;\n    }\n    ul li {\n      margin: 8px 0;\n    }\n    ul li strong {\n      display: inline-block;\n      width: 150px;\n    }\n    .action {\n      text-align: center;\n      margin: 20px 0;\n    }\n    .btn {\n      display: inline-block;\n      padding: 10px 20px;\n      text-decoration: none;\n      color: #fff;\n      background-color: #3498db;\n      border-radius: 5px;\n      font-weight: bold;\n    }\n    .footer {\n      text-align: center;\n      margin-top: 20px;\n      font-size: 0.9em;\n      color: #777;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <h2>Low Stock Alert</h2>\n    <p>Dear Stock Manager,</p>\n\n    <p>We have detected a low stock level for the following material:</p>\n\n    <div class=\"alert-message\">\n      {{ $json[\"Alert Message\"] }}\n    </div>\n\n    <ul>\n      <li><strong>Product ID:</strong> {{ $json[\"Product ID\"] }}</li>\n      <li><strong>Material:</strong> {{ $json[\"Material Name\"] }}</li>\n      <li><strong>Current Stock:</strong> {{ $json[\"Current Stock\"] }} {{ $json[\"Measurement Unit\"] }}</li>\n      <li><strong>Minimum Stock:</strong> {{ $json[\"Minimum Stock Level\"] }} {{ $json[\"Measurement Unit\"] }}</li>\n    </ul>\n\n    <div class=\"action\">\n      <p>Please take action to reorder this material.</p>\n      <a href=\"https://forms.gle/reorder-form\" class=\"btn\">Reorder Now</a>\n    </div>\n\n    <div class=\"footer\">\n      <p>Regards,<br>Your Company</p>\n    </div>\n  </div>\n</body>\n</html>",
          "options": {},
          "subject": "Low Stock Alert: Immediate Action Required"
        },
        "typeVersion": 2.1
      },
      {
        "id": "24fb479d-6f25-4d69-bc5a-925645ae4837",
        "name": "Low Stock Email Alert",
        "type": "n8n-nodes-base.gmail",
        "position": [
          8540,
          3940
        ],
        "webhookId": "fd7aff46-cf63-4ca3-9406-0b90c2f8aa8b",
        "parameters": {
          "sendTo": "example@gmail.com",
          "message": "=<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Low Stock Alert</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n      color: #333;\n      background-color: #f4f4f4;\n      margin: 0;\n      padding: 0;\n    }\n    .container {\n      width: 80%;\n      max-width: 600px;\n      margin: 20px auto;\n      background-color: #fff;\n      padding: 20px;\n      border-radius: 8px;\n      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\n    }\n    h2 {\n      color: #e74c3c;\n      text-align: center;\n    }\n    p {\n      margin: 10px 0;\n    }\n    .alert-message {\n      background-color: #ffe6e6;\n      padding: 15px;\n      border-left: 4px solid #e74c3c;\n      margin: 20px 0;\n      font-weight: bold;\n    }\n    ul {\n      list-style-type: none;\n      padding: 0;\n      margin: 20px 0;\n      background-color: #f9f9f9;\n      padding: 15px;\n      border-left: 4px solid #3498db;\n    }\n    ul li {\n      margin: 8px 0;\n    }\n    ul li strong {\n      display: inline-block;\n      width: 150px;\n    }\n    .action {\n      text-align: center;\n      margin: 20px 0;\n    }\n    .btn {\n      display: inline-block;\n      padding: 10px 20px;\n      text-decoration: none;\n      color: #fff;\n      background-color: #3498db;\n      border-radius: 5px;\n      font-weight: bold;\n    }\n    .footer {\n      text-align: center;\n      margin-top: 20px;\n      font-size: 0.9em;\n      color: #777;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <h2>Low Stock Alert</h2>\n    <p>Dear Stock Manager,</p>\n\n    <p>We have detected a low stock level for the following material:</p>\n\n    <div class=\"alert-message\">\n      {{ $json[\"Alert Message\"] }}\n    </div>\n\n    <ul>\n      <li><strong>Product ID:</strong> {{ $json[\"Product ID\"] }}</li>\n      <li><strong>Material:</strong> {{ $json[\"Material Name\"] }}</li>\n      <li><strong>Current Stock:</strong> {{ $json[\"Current Stock\"] }} {{ $json[\"Measurement Unit\"] }}</li>\n      <li><strong>Minimum Stock:</strong> {{ $json[\"Minimum Stock Level\"] }} {{ $json[\"Measurement Unit\"] }}</li>\n    </ul>\n\n    <div class=\"action\">\n      <p>Please take action to reorder this material.</p>\n      <a href=\"https://forms.gle/reorder-form\" class=\"btn\">Reorder Now</a>\n    </div>\n\n    <div class=\"footer\">\n      <p>Regards,<br>Your Company</p>\n    </div>\n  </div>\n</body>\n</html>",
          "options": {},
          "subject": "Low Stock Alert: Immediate Action Required"
        },
        "typeVersion": 2.1
      },
      {
        "id": "ac8781e9-f694-467d-b40b-95bdbab98880",
        "name": "Validate Issue Request Data",
        "type": "n8n-nodes-base.code",
        "position": [
          6340,
          3400
        ],
        "parameters": {
          "jsCode": "const input = $input.all()[0].json;\nconst quantityRequested= input[\"Quantity Requested\"];\n\nif (quantityRequested <= 0) throw new Error(`Invalid quantity Requested: ${quantityRequested}. Must be greater than 0`);\n\nreturn { json: input };"
        },
        "typeVersion": 2
      },
      {
        "id": "6d88db70-6b4f-47c5-8093-ab339762edbe",
        "name": "Verify Requested Quantity",
        "type": "n8n-nodes-base.code",
        "position": [
          6560,
          3400
        ],
        "parameters": {
          "jsCode": "const input = $input.all()[0].json;\nconst quantityRequested = input[\"Quantity Requested\"];\nif (!input[\"Product ID\"]) throw new Error(\"Product ID is missing\");\nif (quantityRequested <= 0) throw new Error(`Invalid quantity requested: ${quantityRequested}`);\nif (!input[\"Submission ID\"]) throw new Error(\"Submission ID is missing\");\nreturn { json: input };"
        },
        "typeVersion": 2
      },
      {
        "id": "bd2313cc-e3c9-4405-a1ed-8f64969e5bca",
        "name": "Check Available Stock for Issue",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7000,
          3240
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json[\"Product ID\"] }}",
                "lookupColumn": "Product ID"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "8cd87b7d-8dc8-41c7-b76e-b5ebe35278b0",
        "name": "Format Approval Response",
        "type": "n8n-nodes-base.set",
        "position": [
          6120,
          4060
        ],
        "parameters": {
          "options": {},
          "assignments": {
            "assignments": [
              {
                "id": "1b3dd2ac-a54f-49ea-8302-f3e490de5d00",
                "name": "Submission ID",
                "type": "string",
                "value": "={{ $json.query.submissionId }}"
              },
              {
                "id": "007d727d-09f1-4414-a114-6f526afe877a",
                "name": "Action",
                "type": "string",
                "value": "={{ $json.query.action }}"
              },
              {
                "id": "dbb729e9-feac-48de-add1-ba1f810fafde",
                "name": "Approved Quantity",
                "type": "number",
                "value": "={{ $json.query.quantity }}"
              },
              {
                "id": "8b516a0b-9ca1-4c12-90b3-7b442fef0f17",
                "name": "Approved By",
                "type": "string",
                "value": "={{ $json.query.approvedBy }}"
              },
              {
                "id": "b5a2e71a-038d-4bf7-9edc-2ea606bec091",
                "name": "Approval Date",
                "type": "string",
                "value": "={{ new Date().toISOString() }}"
              }
            ]
          }
        },
        "typeVersion": 3.4
      },
      {
        "id": "6749923b-1032-4adb-b805-eda6efd5ee1c",
        "name": "Verify Approval Data",
        "type": "n8n-nodes-base.code",
        "position": [
          6340,
          4060
        ],
        "parameters": {
          "jsCode": "const input = $input.all()[0].json;\nif (!input[\"Submission ID\"]) throw new Error(\"Submission ID is missing\");\nif (![\"approve\", \"reject\"].includes(input[\"Action\"])) throw new Error(\"Invalid action\");\nif (input[\"Action\"] === \"approve\" && input[\"Approved Quantity\"] <= 0) throw new Error(\"Approved quantity must be greater than 0\");\nreturn { json: input };"
        },
        "typeVersion": 2
      },
      {
        "id": "c5e34da4-81ec-47dc-aacf-4d6e0cf4256c",
        "name": "Retrieve Issue Request Details",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          6560,
          3840
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json[\"Submission ID\"] }}",
                "lookupColumn": "Submission ID"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 328307238,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=328307238",
            "cachedResultName": "Materials Issued"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "e3c9b60b-fa41-4ec2-9f8f-789ac4fc6323",
        "name": "Process Approval Decision",
        "type": "n8n-nodes-base.if",
        "position": [
          6980,
          4060
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "loose"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "c5734b4b-e63a-4ec4-866f-8c1dace02ef1",
                "operator": {
                  "type": "boolean",
                  "operation": "true",
                  "singleValue": true
                },
                "leftValue": "={{ $('Verify Approval Data').item.json.Action === \"approve\" }}",
                "rightValue": ""
              }
            ]
          },
          "looseTypeValidation": true
        },
        "typeVersion": 2.2
      },
      {
        "id": "406226c7-89b3-4a09-ba05-4b640a619ae1",
        "name": "Get Stock for Issue Update from Current",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7220,
          3780
        ],
        "parameters": {
          "options": {},
          "filtersUI": {
            "values": [
              {
                "lookupValue": "={{ $json['Product ID'] }}",
                "lookupColumn": "Product ID"
              }
            ]
          },
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 1019183415,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=1019183415",
            "cachedResultName": "Current Stock"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "75046f2a-7949-4280-b6a8-500848e41357",
        "name": "Update Stock After Issue",
        "type": "n8n-nodes-base.googleSheets",
        "position": [
          7240,
          4040
        ],
        "parameters": {
          "columns": {
            "value": {
              "Status": "={{ $('Verify Approval Data').item.json.Action === \"approve\" ? \"Approved\" : $('Verify Approval Data').item.json.Action === \"reject\" ? \"Rejected\" : $json[\"action\"] }}\n\n",
              "Timestamp": "={{ $json.Timestamp }}",
              "Issue Date": "={{ $('Verify Approval Data').item.json['Approval Date'] }}",
              "Product ID": "={{ $json['Product ID'] }}",
              "Description": "={{ $json.Description }}",
              "Requested By": "={{ $json['Requested By'] }}",
              "Approval Link": "={{ $json['Approval Link'] }}",
              "Submission ID": "={{ $json['Submission ID'] }}",
              "Measurement Unit": "={{ $json['Measurement Unit'] }}",
              "Quantity Requested": "={{ $json['Quantity Requested'] }}"
            },
            "schema": [
              {
                "id": "Timestamp",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Timestamp",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Product ID",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Product ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Quantity Requested",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Quantity Requested",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Measurement Unit",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Measurement Unit",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Requested By",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Requested By",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Issue Date",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Issue Date",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Description",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Description",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Submission ID",
                "type": "string",
                "display": true,
                "removed": false,
                "required": false,
                "displayName": "Submission ID",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Status",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Status",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "Approval Link",
                "type": "string",
                "display": true,
                "required": false,
                "displayName": "Approval Link",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              },
              {
                "id": "row_number",
                "type": "string",
                "display": true,
                "removed": true,
                "readOnly": true,
                "required": false,
                "displayName": "row_number",
                "defaultMatch": false,
                "canBeUsedToMatch": true
              }
            ],
            "mappingMode": "defineBelow",
            "matchingColumns": [
              "Submission ID"
            ],
            "attemptToConvertTypes": false,
            "convertFieldsToString": false
          },
          "options": {},
          "operation": "update",
          "sheetName": {
            "__rl": true,
            "mode": "list",
            "value": 328307238,
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit#gid=328307238",
            "cachedResultName": "Materials Issued"
          },
          "documentId": {
            "__rl": true,
            "mode": "list",
            "value": "1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw",
            "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1q0S6AVK7uxZG8sUQkpcZr01KToHPjOZ0gG3zKHLR6lw/edit?usp=drivesdk",
            "cachedResultName": "Plumbee Raw Material Delivery  (Responses)"
          }
        },
        "typeVersion": 4.5
      },
      {
        "id": "3005f241-e0c3-4acd-9998-9b3f2cdece0c",
        "name": "Materials Issue Table Update",
        "type": "n8n-nodes-base.supabase",
        "position": [
          7220,
          4260
        ],
        "parameters": {
          "filters": {
            "conditions": [
              {
                "keyName": "Submission ID",
                "keyValue": "={{ $json[\"Submission ID\"] }}",
                "condition": "eq"
              }
            ]
          },
          "tableId": "Materials Issued",
          "fieldsUi": {
            "fieldValues": [
              {
                "fieldId": "Timestamp",
                "fieldValue": "={{ $json.Timestamp }}"
              },
              {
                "fieldId": "Product ID",
                "fieldValue": "={{ $json['Product ID'] }}"
              },
              {
                "fieldId": "Quantity Requested",
                "fieldValue": "={{ $json['Quantity Requested'] }}"
              },
              {
                "fieldId": "Measurement Unit",
                "fieldValue": "={{ $json['Measurement Unit'] }}"
              },
              {
                "fieldId": "Requested By",
                "fieldValue": "={{ $json['Requested By'] }}"
              },
              {
                "fieldId": "Description",
                "fieldValue": "={{ $json.Description }}"
              },
              {
                "fieldId": "Status",
                "fieldValue": "={{ $('Verify Approval Data').item.json.Action === \"approve\" ? \"Approved\" : $('Verify Approval Data').item.json.Action === \"reject\" ? \"Rejected\" : $json[\"action\"] }}"
              },
              {
                "fieldId": "Approval Link",
                "fieldValue": "={{ $json['Approval Link'] }}"
              },
              {
                "fieldId": "Submission ID",
                "fieldValue": "={{ $json['Submission ID'] }}"
              },
              {
                "fieldId": "Issue Date",
                "fieldValue": "={{ $('Verify Approval Data').item.json['Approval Date'] }}"
              }
            ]
          },
          "operation": "update"
        },
        "typeVersion": 1
      },
      {
        "id": "808ce6c2-6620-40ae-8c6d-518cf28dce26",
        "name": "Is Stock is Low",
        "type": "n8n-nodes-base.if",
        "position": [
          8300,
          3960
        ],
        "parameters": {
          "options": {},
          "conditions": {
            "options": {
              "version": 2,
              "leftValue": "",
              "caseSensitive": true,
              "typeValidation": "strict"
            },
            "combinator": "and",
            "conditions": [
              {
                "id": "e0493b94-1e9c-4f68-ba66-4abd2bd5b569",
                "operator": {
                  "type": "boolean",
                  "operation": "true",
                  "singleValue": true
                },
                "leftValue": "={{ $json['Is Low'] }}",
                "rightValue": "="
              }
            ]
          }
        },
        "typeVersion": 2.2
      }
    ],
    "pinData": {},
    "connections": {
      "Merge": {
        "main": [
          [
            {
              "node": "Check If Product ID Exists",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Merge1": {
        "main": [
          [
            {
              "node": "Process Approval Decision",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Update Stock": {
        "main": [
          [
            {
              "node": "Update Current Stock1",
              "type": "main",
              "index": 0
            },
            {
              "node": "Update Current Stck",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Approvals": {
        "main": [
          [
            {
              "node": "Format Approval Response",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Merge Lookups": {
        "main": [
          [
            {
              "node": "Prepare Approval",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Searck Issues": {
        "main": [
          [
            {
              "node": "Merge1",
              "type": "main",
              "index": 1
            }
          ]
        ]
      },
      "New Record Row": {
        "main": [
          [
            {
              "node": "Search Current Stock",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Format response": {
        "main": [
          [
            {
              "node": "Initialize New Product stock",
              "type": "main",
              "index": 0
            },
            {
              "node": "New Row Current Stock",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Is Stock is Low": {
        "main": [
          [
            {
              "node": "Low Stock Email Alert",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Prepare Approval": {
        "main": [
          [
            {
              "node": "Send Approval Request",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Standardize Data": {
        "main": [
          [
            {
              "node": "Validate Issue Request Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Search Product ID": {
        "main": [
          [
            {
              "node": "Merge Lookups",
              "type": "main",
              "index": 1
            }
          ]
        ]
      },
      "Create Record Issue": {
        "main": [
          [
            {
              "node": "Search Product ID",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Append Raw Materials": {
        "main": [
          [
            {
              "node": "Validate Quantity Received",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "LookUp Current stock": {
        "main": [
          [
            {
              "node": "Low stock Detection2",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Low stock Detection1": {
        "main": [
          [
            {
              "node": "Is Stock is Low",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Low stock Detection2": {
        "main": [
          [
            {
              "node": "Trigger Low Stock Alert",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Search Current Stock": {
        "main": [
          [
            {
              "node": "Merge",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Update Current Stock": {
        "main": [
          [
            {
              "node": "LookUp Current stock",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Verify Approval Data": {
        "main": [
          [
            {
              "node": "Retrieve Issue Request Details",
              "type": "main",
              "index": 0
            },
            {
              "node": "Searck Issues",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Calculate Total Price": {
        "main": [
          [
            {
              "node": "Append Raw Materials",
              "type": "main",
              "index": 0
            },
            {
              "node": "New Record Row",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "LookUp Current stock1": {
        "main": [
          [
            {
              "node": "Low stock Detection1",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Lookup Existing Stock": {
        "main": [
          [
            {
              "node": "Merge",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Receive Issue Request": {
        "main": [
          [
            {
              "node": "Standardize Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Update Current Stock1": {
        "main": [
          [
            {
              "node": "LookUp Current stock1",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Append Material Request": {
        "main": [
          [
            {
              "node": "Check Available Stock for Issue",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Trigger Low Stock Alert": {
        "main": [
          [
            {
              "node": "Send Low Stock Email Alert",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Format Approval Response": {
        "main": [
          [
            {
              "node": "Verify Approval Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Process Approval Decision": {
        "main": [
          [
            {
              "node": "Update Stock After Issue",
              "type": "main",
              "index": 0
            },
            {
              "node": "Materials Issue Table Update",
              "type": "main",
              "index": 0
            },
            {
              "node": "Get Stock for Issue Update from Current",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Verify Requested Quantity": {
        "main": [
          [
            {
              "node": "Append Material Request",
              "type": "main",
              "index": 0
            },
            {
              "node": "Create Record Issue",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Check If Product ID Exists": {
        "main": [
          [
            {
              "node": "Calculate Updated Current Stock",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Format response",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Validate Quantity Received": {
        "main": [
          [
            {
              "node": "Lookup Existing Stock",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Validate Issue Request Data": {
        "main": [
          [
            {
              "node": "Verify Requested Quantity",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Receive Raw Materials Webhook": {
        "main": [
          [
            {
              "node": "Standardize Raw Material Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Standardize Raw Material Data": {
        "main": [
          [
            {
              "node": "Calculate Total Price",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Retrieve Issue Request Details": {
        "main": [
          [
            {
              "node": "Merge1",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Calculate Updated Current Stock": {
        "main": [
          [
            {
              "node": "Update Current Stock",
              "type": "main",
              "index": 0
            },
            {
              "node": "Current Stock Update",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Check Available Stock for Issue": {
        "main": [
          [
            {
              "node": "Merge Lookups",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Stock for Issue Update from Current": {
        "main": [
          [
            {
              "node": "Update Stock",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  }
};
