import { getGeminiModel } from "@/lib/gemini-config"
import { type NextRequest, NextResponse } from "next/server"

// Remove the genAI declaration since we're importing getGeminiModel

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json()

    const model = getGeminiModel("gemini-1.5-flash")

    const prompt = `Create a SIMPLIFIED, LOW-COST execution plan for this business idea using AI tools and no-code solutions:
    
    Title: ${idea.title}
    Description: ${idea.description}
    Category: ${idea.category}
    Difficulty: ${idea.difficulty}
    
    Generate a lean startup execution plan with VARIED budget ranges and strategies. Use one of these budget approaches randomly:
    - Ultra-lean: Under $1,000 total
    - Bootstrap: $1,000-$3,000 total  
    - Moderate: $2,500-$5,000 total
    - Growth-ready: $3,000-$7,500 total
    
    Vary the phase budgets accordingly and mix different strategies:
    - Some plans focus heavily on free tools
    - Others include paid premium tools for faster growth
    - Mix community-driven vs paid marketing approaches
    - Vary between MVP-first vs research-heavy approaches
    
    Format the response as a comprehensive but simplified plan in JSON:
    
    {
      "phases": [
        {
          "phase": "🧠 1. Research & Planning (3–8 weeks)",
          "budget": "$100–$800", // Vary this range significantly
          "objective": "Understand user needs, validate the idea, and plan lean execution",
          "duration": "3-8 weeks", // Vary duration too
          "tasks": [
            "Use ChatGPT/Claude for market research & competitor analysis (Free)",
            "Create surveys with Google Forms or Typeform (Free-$50/mo)",
            "Generate business plan with Notion + AI templates (Free)",
            "Design pitch deck with Canva Pro ($15/mo) or Figma (Free)",
            "Get legal templates from LegalZoom ($200) or Docracy (Free)"
          ]
        },
        {
          "phase": "🧪 2. MVP Development (4–12 weeks)",
          "budget": "$200–$2,500", // Vary significantly 
          "objective": "Build functional MVP with AI and no-code tools",
          "duration": "4-12 weeks", 
          "tasks": [
            "Build app with Bubble ($29/mo), FlutterFlow ($30/mo), or Glide (Free)",
            "Integrate APIs for core functionality ($50-$300/mo)",
            "Use OpenAI API ($20-$200/mo) or HuggingFace (Free) for AI features",
            "Design UI/UX with Figma Pro ($15/mo) or Canva (Free)",
            "Set up analytics with Mixpanel ($20/mo) or PostHog (Free)"
          ]
        },
        {
          "phase": "🧪 3. Testing & Launch (2–6 weeks)",
          "budget": "$100–$1,200", 
          "objective": "Validate with real users and launch",
          "duration": "2-6 weeks",
          "tasks": [
            "Gather 20-100 beta users via Discord/Reddit (Free) or Facebook Ads ($200)",
            "Collect feedback with Typeform Pro ($35/mo) or Google Forms (Free)",
            "Create marketing content with Canva Pro + ChatGPT ($15/mo) or free tools",
            "Build landing page with Webflow ($14/mo), Carrd ($19/year), or Framer (Free)",
            "Launch on Product Hunt ($0), Reddit ($0), or run Google Ads ($300-$500)"
          ]
        },
        {
          "phase": "📈 4. Growth & Iteration (Ongoing)",
          "budget": "$50–$800/month",
          "objective": "Improve based on feedback and grow organically", 
          "duration": "Ongoing",
          "tasks": [
            "Use analytics tools like Amplitude ($61/mo), Hotjar ($32/mo), or Plausible (Free)",
            "Refine AI features with OpenAI API ($50-$300/mo) or free alternatives",
            "Partner with communities (Free) or run targeted ads ($200-$500/mo)",
            "Implement freemium model with Stripe ($0.30 per transaction)",
            "Content marketing via Buffer ($15/mo) or manual posting (Free)"
          ]
        }
      ],
      "resources": [
        "🛠️ No-Code Development: Bubble ($29/mo), Webflow ($14/mo), or Glide (Free)",
        "🤖 AI Tools: OpenAI API ($20-$200/mo), Claude API ($15-$150/mo), or HuggingFace (Free)",
        "🎨 Design: Figma Pro ($15/mo), Canva Pro ($15/mo), or free alternatives",
        "📊 Analytics: Mixpanel ($20/mo), Amplitude ($61/mo), or PostHog (Free)",
        "📝 Content: Notion Pro ($10/mo), Airtable ($20/mo), or Google Workspace (Free)",
        "🌐 Website: Webflow ($14/mo), Squarespace ($18/mo), or Carrd ($19/year)",
        "📧 Email: ConvertKit ($29/mo), Mailchimp ($13/mo), or free tiers",
        "💬 Community: Discord (Free), Slack Pro ($8/mo), or Circle ($39/mo)"
      ],
      "keyMilestones": [
        "✅ Week 1-3: Market validation & persona creation using AI + surveys",
        "✅ Week 4-6: MVP outline + UI prototype using chosen no-code platform", 
        "✅ Week 7-14: Functional MVP with AI integration and user testing",
        "✅ Week 15-18: Beta launch, user feedback collection, and product iteration",
        "✅ Week 19+: Public release + growth strategy execution via chosen channels"
      ],
      "totalBudget": "Randomly select from: Under $1,000 | $1,000-$3,000 | $2,500-$5,000 | $3,000-$7,500",
      "targetOutcome": "Build and validate the idea with minimal cost using AI tools, no-code platforms, and either community-driven or paid growth strategies based on budget tier"
    }
    
    IMPORTANT: Randomize the budget ranges, tool selections, and strategies for each generation. Make each plan feel unique while maintaining the simplified, actionable format.
    
    Return only the JSON object without any markdown formatting.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let executionPlan
    try {
      executionPlan = JSON.parse(text)
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        executionPlan = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Failed to parse JSON response")
      }
    }

    return NextResponse.json({ executionPlan })
  } catch (error) {
    console.error("Error generating execution plan:", error)
    return NextResponse.json({ error: "Failed to generate execution plan" }, { status: 500 })
  }
}
