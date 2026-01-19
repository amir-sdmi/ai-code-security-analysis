import { GoogleGenerativeAI } from '@google/generative-ai'

// Load your Gemini API key
const API_KEY = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

// Define response schema for task object
const taskResponseSchema = {
    type: "OBJECT",
    properties: {
        title: {
            type: "STRING",
            description: "Clear, actionable title for the task"
        },
        description: {
            type: "STRING",
            description: "Detailed description of what needs to be done. Keep it concise, maximum 30 words."
        },
        dueDate: {
            type: "STRING",
            description: "ISO 8601 date string, optional - only if email mentions specific deadline"
        },
        tags: {
            type: "ARRAY",
            items: {
                type: "STRING"
            },
            description: "Relevant tags categorizing the task"
        },
        relatedLinks: {
            type: "ARRAY",
            items: {
                type: "STRING"
            },
            description: "URLs or links mentioned in the email that are relevant to the task"
        }
    },
    required: ["title", "description", "tags", "relatedLinks"]
}

// Utility: create a structured prompt for email to task conversion
function buildEmailToTaskPrompt(email) {
    return `
You are an intelligent task management assistant. Convert the following email into a structured task object.

Extract key information and create an actionable task with:
- A clear, concise title (action-oriented)
- A detailed description of what needs to be done
- Due date (ISO 8601 format) ONLY if explicitly mentioned in the email
- Relevant tags (categorize by type, priority, department, etc.)
- Any links or URLs mentioned in the email content

Email Details:
- Subject: ${email.subject}
- Snippet: ${email.snippet}
- Content/Body: ${email.body}
- Sender Name: ${email.senderName}
- Sender Email: ${email.senderEmail}
- Gmail Category: ${email.gmailCategory}
- Received Date: ${email.receivedDate || new Date().toISOString()}

Guidelines:
- Make the title actionable (start with verbs like "Review", "Complete", "Schedule", etc.)
- Include context from sender and email category in description
- Only set dueDate if email explicitly mentions a deadline
- Use relevant tags like priority levels, departments, task types
- Extract any URLs, meeting links, document links from the content
- If no links are present, return an empty array for relatedLinks
`
}

// Convert email to task using Gemini API
export async function convertEmailToTask(email) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = buildEmailToTaskPrompt(email)

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: taskResponseSchema
            }
        })

        const response = await result.response
        const text = response.text().trim()

        // Parse the JSON response
        const taskObject = JSON.parse(text)

        // Validate required fields
        if (taskObject.title && taskObject.description &&
            Array.isArray(taskObject.tags) && Array.isArray(taskObject.relatedLinks)) {

            // Clean up dueDate - remove if empty or invalid
            if (!taskObject.dueDate || taskObject.dueDate.trim() === "") {
                delete taskObject.dueDate
            } else {
                // Validate ISO date format
                try {
                    new Date(taskObject.dueDate).toISOString()
                } catch (e) {
                    console.warn("Invalid date format, removing dueDate")
                    delete taskObject.dueDate
                }
            }

            return taskObject
        } else {
            throw new Error("Invalid task object structure")
        }
    } catch (err) {
        console.error("Email to Task conversion failed:", err)

        // Fallback task object
        return {
            title: `Follow up: ${email.subject}`,
            description: `Review email from ${email.senderName} (${email.senderEmail}) regarding: ${email.snippet}`,
            tags: ["Email", "Follow-up", email.gmailCategory || "General"],
            relatedLinks: []
        }
    }
}

// Batch convert multiple emails to tasks
export async function convertEmailsToTasks(emails) {
    const tasks = []

    for (const email of emails) {
        const task = await convertEmailToTask(email)
        tasks.push(task)

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    return tasks
}

// Test data
const testEmails = [
    {
        subject: "Data Science Placement Guarantee Program: Important Update",
        snippet: "Cuvette Tech Dear Aditya, Hope you are doing well. We have an important update regarding your Data Science placement program. Please review the new curriculum changes by July 15th and confirm your participation. Visit https://cuvette.tech/program-updates for details.",
        body: "Cuvette Tech is a leading provider of Data Science and AI solutions. We are committed to helping our students secure placements in top tech companies. With our Data Science Placement Guarantee Program, we ensure that every student receives a top-notch placement package. Join us in this mission to make Data Science accessible to all. Visit https://cuvette.tech/placement-guarantee for more details.",
        senderName: "Job Guarantee Course | Cuvette Tech",
        senderEmail: "team@cuvette.tech",
        gmailCategory: "updates",
        receivedDate: "2025-06-23T10:30:00.000Z"
    },
    {
        subject: "Weekly Team Meeting - Action Items Required",
        snippet: "hi team",
        senderName: "Sarah Johnson",
        body: "Hi Team, Following up on our weekly standup. Please complete the following by Friday: 1) Update project status 2) Review design mockups at https://figma.com/team-designs 3) Submit time logs. Meeting notes: https://docs.google.com/team-notes",
        senderEmail: "sarah.johnson@company.com",
        gmailCategory: "primary",
        receivedDate: "2025-06-23T09:15:00.000Z"
    },
    {
        subject: "Invoice #12345 - Payment Due",
        snippet: "your invoice is due",
        body: "Your invoice #12345 for $250 is due by June 30th, 2025. Please process payment at https://billing.service.com/pay/12345 or contact us for payment arrangements.",
        senderName: "Billing Department",
        senderEmail: "billing@service.com",
        gmailCategory: "updates",
        receivedDate: "2025-06-23T08:45:00.000Z"
    }
]

// Test the conversion
async function testEmailToTaskConversion() {
    console.log("Converting emails to tasks...\n")

    for (let i = 0; i < testEmails.length; i++) {
        const email = testEmails[i]
        console.log(`Email ${i + 1}: "${email.subject}"`)

        const task = await convertEmailToTask(email)
        console.log("Generated Task:", JSON.stringify(task, null, 2))
        console.log("---")
    }
}

// Run test
// testEmailToTaskConversion()