// app.ts

//////////////////////////////////////////////////////
// 1) Imports
//////////////////////////////////////////////////////
import "dotenv/config";              // loads environment variables from .env
import * as fs from "fs";           // for reading JSON file
import * as path from "path";       // to form file paths
import { z } from "zod";            // for data validation
import dayjs from "dayjs";          // for simple date handling
import OpenAI from "openai";        // the openai library, used with OpenRouter

//////////////////////////////////////////////////////
// 2) Environment / Config Setup
//////////////////////////////////////////////////////
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY in your .env file!");
}

// Optional for openrouter scoreboard
const SITE_URL = process.env.OPENROUTER_SITE_URL || "https://example.com";
const SITE_NAME = process.env.OPENROUTER_SITE_NAME || "PhaseApp";

// The LLM model we want: gemini flash experiment
// If you want GPT-4, use "openai/gpt-4", etc.
const GEMINI_MODEL = "google/gemini-2.0-flash-exp:free";

//////////////////////////////////////////////////////
// 3) Zod Schemas for JSON
//////////////////////////////////////////////////////
// The conversation JSON from your <example> is an array with an object
// that has "messageThreads: [ ... ]"
const TextContentSchema = z.object({
  body: z.string(),
}).passthrough(); // pass other fields

const EventDescriptionContentSchema = z.object({
  eventType: z.string(),
}).passthrough();

const MessageContentSchema = z.object({
  textContent: TextContentSchema.optional(),
  eventDescriptionContent: EventDescriptionContentSchema.optional(),
}).passthrough();

const MessageSchema = z.object({
  createdAt: z.string().transform((str) => new Date(str)), // parse to Date
  accountType: z.string().optional(),
  id: z.number().optional(),
  // extra fields
  isPrivate: z.boolean().optional(),
  contentType: z.string().optional(),
}).passthrough();

const MessagesAndContentsSchema = z.object({
  message: MessageSchema,
  messageContent: MessageContentSchema.optional(),
}).passthrough();

const MessageThreadSchema = z.object({
  id: z.number(),
  messagesAndContents: z.array(MessagesAndContentsSchema),
}).passthrough();

const RootItemSchema = z.object({
  messageThreads: z.array(MessageThreadSchema),
}).passthrough();

// The entire top-level is an array of these "RootItem"
const RootSchema = z.array(RootItemSchema);

export {
  RootSchema,
  MessagesAndContentsSchema,
  ConversationPhase,
  detectConversationPhases,
  summarizePhase,
}; // Export necessary schemas and functions

//////////////////////////////////////////////////////
// 4) Phase Detection
//////////////////////////////////////////////////////
/**
 * We define an enum of possible phases in the conversation.
 */
enum ConversationPhase {
  INQUIRY = "INQUIRY",
  BOOKING_AND_PREARRIVAL = "BOOKING_AND_PREARRIVAL",
  DURING_STAY = "DURING_STAY",
  DEPARTURE = "DEPARTURE",
  END_OF_THREAD = "END_OF_THREAD",
}

/**
 * detectConversationPhases(...)
 *
 * Input:
 *   - messages: The array of "message + messageContent" items
 *   - checkinDate / checkoutDate: Example times for the booking
 *
 * We'll keep the same triggers:
 *   1) "booking confirm" text => switch to BOOKING/PreArrival
 *   2) after checkin => DURING_STAY
 *   3) day before checkout => DEPARTURE
 *   4) final message => END_OF_THREAD
 */
function detectConversationPhases(
  messages: z.infer<typeof MessagesAndContentsSchema>[],
  checkinDate: Date,
  checkoutDate: Date
): Record<number, ConversationPhase> {
  // sort messages by createdAt time
  const sorted = messages.slice().sort((a, b) => {
    const tA = a.message.createdAt.getTime();
    const tB = b.message.createdAt.getTime();
    return tA - tB;
  });

  let currentPhase = ConversationPhase.INQUIRY;
  const phaseMap: Record<number, ConversationPhase> = {};

  // define the day before checkout
  const oneDayBeforeCheckout = new Date(checkoutDate.getTime() - 24 * 3600 * 1000);

  for (const mc of sorted) {
    const msg = mc.message;
    // skip if no id
    if (!msg.id) continue;

    // get the text content if present
    let bodyText = "";
    if (mc.messageContent?.textContent?.body) {
      bodyText = mc.messageContent.textContent.body.toLowerCase();
    }

    // Trigger #1: "booking confirm" => BOOKING_AND_PREARRIVAL
    if (bodyText.includes("booking confirm")) {
      currentPhase = ConversationPhase.BOOKING_AND_PREARRIVAL;
    }

    // Trigger #2: if we pass checkin time => DURING_STAY
    if (
      msg.createdAt >= checkinDate &&
      (currentPhase === ConversationPhase.INQUIRY ||
        currentPhase === ConversationPhase.BOOKING_AND_PREARRIVAL)
    ) {
      currentPhase = ConversationPhase.DURING_STAY;
    }

    // Trigger #3: if msg time >= day before checkout => DEPARTURE
    if (msg.createdAt >= oneDayBeforeCheckout) {
      currentPhase = ConversationPhase.DEPARTURE;
    }

    // store the current phase
    phaseMap[msg.id] = currentPhase;
  }

  // last message => end_of_thread
  // if (sorted.length > 0) {
  //   const lastMsgId = sorted[sorted.length - 1].message.id;
  //   if (lastMsgId) {
  //     phaseMap[lastMsgId] = ConversationPhase.END_OF_THREAD;
  //   }
  // }

  return phaseMap;
}

const questionsJSON= {
  "inquiry_phase_and_conversion": {
    "category": "Inquiry Phase & Conversion",
    "sub_categories": [
      {
        "sub_category": "Inquiry Patterns",
        "questions": [
          "Which conversation patterns in initial inquiries predict highest-value bookings?",
          "What message indicators suggest a guest will book at premium rates?",
          "Which conversation patterns are associated with quick conversions vs. slow or abandoned inquiries?"
        ]
      },
      {
        "sub_category": "Pain Points & Key Factors",
        "questions": [
          "What are all the pain points that guests express in the inquiry phase?",
          "What is the most important factor guests are looking for in the inquiry phase?",
          "Which guest questions appear most frequently, and how can we address them up front?"
        ]
      },
      {
        "sub_category": "Abandonment vs. Booking",
        "questions": [
          "Which types of inquiries fail to convert, and why? (price concerns, slow response, unclear listing details, etc.)",
          "What do successful inquiries (those that turn into bookings) have in common?",
          "Does host response time significantly impact conversion rate?"
        ]
      },
      {
        "sub_category": "Inquiry to Booking",
        "questions": [
          "How quickly do guests typically finalize the booking after initial contact?",
          "How do discount requests or negotiations affect inquiry outcomes?",
          "Which aspects of the listing are potential guests most uncertain about (rules, location, amenities, pricing)?"
        ]
      }
    ]
  },
  "booking_and_pre_arrival": {
    "category": "Booking & Pre-Arrival",
    "sub_categories": [
      {
        "sub_category": "Booking Confirmation & Pre-Arrival Coordination",
        "questions": [
          "Which guest questions or concerns appear immediately after booking confirmation?",
          "How often do guests request changes (dates, occupancy, special arrangements)?",
          "What are the top 'pain points' in the pre-arrival stage (e.g., confusion about check-in instructions, payment schedule)?"
        ]
      },
      {
        "sub_category": "Response & Communication Style",
        "questions": [
          "Which pre-arrival communication styles lead to smoother check-in experiences?",
          "Are certain forms of host messaging (e.g., friendly personalized notes vs. automated templates) more effective at reassuring guests?"
        ]
      },
      {
        "sub_category": "Factors Leading to Last-Minute Cancellations",
        "questions": [
          "Which new or unexpected demands in pre-arrival discussions sometimes result in cancellations?",
          "Does clarity on house rules reduce last-minute drop-offs?"
        ]
      },
      {
        "sub_category": "Preparation Efficiency",
        "questions": [
          "How many messages and how much time does it usually take to finalize arrival details?",
          "Is there a correlation between thorough pre-arrival instructions and fewer mid-stay issues?"
        ]
      }
    ]
  },
  "during_stay": {
    "category": "During Stay",
    "sub_categories": [
      {
        "sub_category": "Maintenance & Issue Resolution",
        "questions": [
          "Which message patterns predict maintenance issues?",
          "What are the most common requests or complaints (Wi-Fi, AC, cleanliness, noise)?",
          "How quickly is each request resolved, and does this resolution speed correlate with final review scores?"
        ]
      },
      {
        "sub_category": "Guest Experience & Satisfaction",
        "questions": [
          "Which conversation topics or host interventions lead to very satisfied guests (or 5-star reviews)?",
          "Are there specific mid-stay 'pain points' that, if prevented, yield better overall reviews?"
        ]
      },
      {
        "sub_category": "Emergency Situations",
        "questions": [
          "What types of urgent messages arise, and how often?",
          "Is there a pattern to these emergencies (lockouts, plumbing, electricity) that can be preemptively addressed?"
        ]
      },
      {
        "sub_category": "Predicting High-Care Guests",
        "questions": [
          "Which early conversation markers suggest a guest may require disproportionate attention or have higher demands during their stay?"
        ]
      }
    ]
  },
  "departure_post_stay": {
    "category": "Departure & Post-Stay",
    "sub_categories": [
      {
        "sub_category": "Departure Process",
        "questions": [
          "What are all the pain points that guests express in the departure phase?",
          "Which factors do guests care about most when checking out (flexible checkout time, easy key return)?",
          "How do final messages (like checkout reminders) influence overall satisfaction or reviews?"
        ]
      },
      {
        "sub_category": "Review Influences",
        "questions": [
          "What leads guests to leave 5-star reviews?",
          "What leads guests to leave non-5-star reviews (4-star or less)?",
          "Which final host messages or gestures (e.g., a thank-you note) correlate with higher review rates or improved ratings?"
        ]
      },
      {
        "sub_category": "Repeat Bookings",
        "questions": [
          "Which guest communication styles correlate with repeat bookings or direct rebook requests?",
          "How often do guests express interest in returning, and do they follow through?"
        ]
      }
    ]
  },
  "pricing_and_value_perception": {
    "category": "Pricing & Value Perception",
    "sub_categories": [
      {
        "sub_category": "Premium Booking Indicators",
        "questions": [
          "Which conversation or textual cues suggest guests are willing to pay premium rates?",
          "What aspects of our property/service do guests mention to justify higher pricing?",
          "Does discussing certain amenities (private pool, scenic view, location convenience) lead to successful upsells or acceptance of premium pricing?"
        ]
      },
      {
        "sub_category": "Discount Requests",
        "questions": [
          "How often do discount or negotiation requests appear, and what is the acceptance vs. booking success rate?",
          "Do guests who request a discount end up converting at a high or low rate?"
        ]
      }
    ]
  },
  "guest_needs_priorities": {
    "category": "Guest Needs & Priorities",
    "sub_categories": [
      {
        "sub_category": "Category Analysis of Questions",
        "questions": [
          "What unmet guest needs are repeatedly expressed across all phases?",
          "Which guest requirements are we uniquely good at satisfying? (child-friendly, pet-friendly, location near a major venue, etc.)",
          "Which property features or policies do guests frequently ask to clarify?"
        ]
      },
      {
        "sub_category": "House Rules & Policy Clarifications",
        "questions": [
          "Which rules cause the most friction or confusion (e.g., quiet hours, pet limitations, extra guest fees)?",
          "When do guests typically ask about them, and does clarity or promptness help?"
        ]
      },
      {
        "sub_category": "Value Proposition",
        "questions": [
          "What do guests mention as most important or valuable about our place (location, design, amenities, host responsiveness)?",
          "Which statements from guests confirm that certain features justify premium pricing?"
        ]
      }
    ]
  },
  "conversion_and_revenue_maximization": {
    "category": "Conversion & Revenue Maximization",
    "sub_categories": [
      {
        "sub_category": "Inquiry → High-Value Booking",
        "questions": [
          "What conversation patterns in initial messages lead to the largest revenue bookings?",
          "Do guests who talk about certain features or length of stay typically yield more profit?"
        ]
      },
      {
        "sub_category": "Lifetime Value & Repeat Guests",
        "questions": [
          "Which guests or conversation styles predict repeated visits or extended stays?",
          "Does offering certain add-ons or demonstrating certain hospitality lead them to rebook or recommend us?"
        ]
      },
      {
        "sub_category": "Time Efficiency",
        "questions": [
          "Which types of guests require disproportionate time/attention?",
          "Is the cost of hosting certain travelers too high relative to the revenue they bring?"
        ]
      }
    ]
  },
  "operations_host_response": {
    "category": "Operations & Host Response",
    "sub_categories": [
      {
        "sub_category": "Response Time Metrics",
        "questions": [
          "What is the average host first response time, and how does that correlate with booking success or final reviews?",
          "What percentage of first responses happen within 10 minutes, 30 minutes, or 24 hours?",
          "How does slow response timing drive conversation abandonment or negative feedback?"
        ]
      },
      {
        "sub_category": "Conversation Volume & Patterns",
        "questions": [
          "How many back-and-forth messages typically occur per successful booking vs. unsuccessful?",
          "Do short, direct threads convert better than lengthy, drawn-out ones?"
        ]
      },
      {
        "sub_category": "Overall Efficiency",
        "questions": [
          "Could automating certain FAQ answers significantly reduce the volume of manual host replies?",
          "Which repeated questions can be preempted by improved listings or auto-responses?"
        ]
      }
    ]
  },
  "risk_problem_guest_detection": {
    "category": "Risk & Problem Guest Detection",
    "sub_categories": [
      {
        "sub_category": "Potential Problem Guest Red Flags",
        "questions": [
          "What early message patterns indicate potential problem guests (e.g., repeated demands, hints of parties)?",
          "Are certain discount demands or suspicious requests correlated with property damage or negative experiences?"
        ]
      },
      {
        "sub_category": "Property Care Standards",
        "questions": [
          "What conversation markers suggest high property care standards from the guest’s side? (polite, responsible, mention 'We’ll treat your place as our home,' etc.)",
          "Which markers do the opposite?"
        ]
      },
      {
        "sub_category": "Exceptional Circumstances",
        "questions": [
          "Which urgent or special handling cases appear frequently, and how do we typically address them?",
          "Do they lead to cancellations, reschedules, or negative reviews if mishandled?"
        ]
      }
    ]
  },
  "outcome_review_analysis": {
    "category": "Outcome & Review Analysis",
    "sub_categories": [
      {
        "sub_category": "5-Star Drivers",
        "questions": [
          "Which conversation behaviors or property elements clearly lead to 5-star reviews?",
          "What do 5-star review guests consistently mention about the host or the property?"
        ]
      },
      {
        "sub_category": "Non–5-Star Drivers",
        "questions": [
          "What triggers 3- or 4-star reviews, or even negative ratings, according to the messages?",
          "Are they tied to certain mid-stay frustrations or poor pre-arrival instructions?"
        ]
      },
      {
        "sub_category": "Post-Stay Follow-Up",
        "questions": [
          "Does a final 'thank you' or follow-up message about leaving a review raise the average rating?",
          "How do departure-phase interactions influence final guest sentiment?"
        ]
      }
    ]
  },
  "automation_data_driven_improvements": {
    "category": "Automation & Data-Driven Improvements",
    "sub_categories": [
      {
        "sub_category": "Potential for Auto-Replies",
        "questions": [
          "Which frequently asked questions or concerns can be automated to speed up response time?",
          "How does an immediate auto-reply with key info affect conversion or satisfaction?"
        ]
      },
      {
        "sub_category": "Listing Optimization",
        "questions": [
          "Which repeated confusion in messages could be resolved by updating the listing description or photos?",
          "How can we highlight top strengths that frequently appear in successful booking threads?"
        ]
      },
      {
        "sub_category": "Business Strategy",
        "questions": [
          "Should we pivot to attract more premium or mid-range travelers?",
          "If guests keep asking about a certain feature we lack (hot tub, parking pass, etc.), is it worth investing to add it?"
        ]
      }
    ]
  }
}


//////////////////////////////////////////////////////
// 5) LLM Integration with Gemini on OpenRouter
//////////////////////////////////////////////////////

// create the openai instance pointing to openrouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": SITE_URL,
    "X-Title": SITE_NAME,
  },
});

/**
 * summarizePhase(...)
 *
 * We'll feed a group of messages from a particular phase
 * to the Gemini model, asking for a short summary.
 */
async function summarizePhase(phaseName: string, messages: string[]): Promise<string> {
  // build the user request content
  // gemini expects standard "messages" array, but we'll just do a single user message
  // summarizing the text we feed in
  const userContent = `Category, subcategory and question json - ${JSON.stringify(questionsJSON)}
  \n\nBelow are the conversation lines from the ${phaseName} phase:\n\n` +
    messages.join("\n") +
    `\n\nPlease provide a concise summary and which category, subcategory and question it match. return the data as JSON format.`;
console.log(userContent);
console.log(phaseName);


  // call gemini
  const completion = await openai.chat.completions.create({
    model: GEMINI_MODEL, // "google/gemini-2.0-flash-exp:free"
    messages: [
      {
        role: "system",
        content: "You are a helpful system that summarizes conversation logs.",
      },
      {
        role: "user",
        content: userContent, 
      },
    ],
    // optional
    temperature: 0.7,
    max_tokens: 400,
  });
  console.log(completion);
  
  const text = completion?.choices?.length > 0 ? completion?.choices[0]?.message?.content : "";
  return text!.trim();
}

//////////////////////////////////////////////////////
// 6) Main Execution
//////////////////////////////////////////////////////
async function main() {
  try {
    // 1) Load the conversation JSON from "threads.json"
    const filePath = path.join(__dirname, "messages.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(rawData);

    // 2) Validate with our RootSchema
    const rootItems = RootSchema.parse(parsed);

    // We'll define a single checkin/checkout for demonstration.
    // In a real system, each thread might have its own dates from the booking system.
    const checkinDate = dayjs("2025-01-20T14:00:00Z").toDate();
    const checkoutDate = dayjs("2025-01-25T10:00:00Z").toDate();

    // 3) We'll iterate over the top-level array of RootItem
    for (let i = 0; i < rootItems.length; i++) {
      const item = rootItems[i];
      // item has "messageThreads: [ ... ]"
      const { messageThreads } = item;

      // For each thread, detect phases
      for (const thread of messageThreads) {
        console.log(`\n=== Processing RootIndex ${i}, ThreadID ${thread.id} ===`);

        // detect phases for each message
        const phasesMap = detectConversationPhases(
          thread.messagesAndContents,
          checkinDate,
          checkoutDate
        );

        // We'll group the messages by the assigned phase so we can do a summary
        const groupedByPhase: Record<ConversationPhase, string[]> = {
          [ConversationPhase.INQUIRY]: [],
          [ConversationPhase.BOOKING_AND_PREARRIVAL]: [],
          [ConversationPhase.DURING_STAY]: [],
          [ConversationPhase.DEPARTURE]: [],
          [ConversationPhase.END_OF_THREAD]: [],
        };

        // We want to store the text of each message in the correct phase
        // We'll also store them in chronological order
        const sorted = [...thread.messagesAndContents].sort(
          (a, b) => a.message.createdAt.getTime() - b.message.createdAt.getTime()
        );

        for (const mc of sorted) {
          const msgId = mc.message.id;
          if (!msgId) continue;
          const phase = phasesMap[msgId];
          // retrieve text
          let bodyText = "";
          if (mc.messageContent?.textContent?.body) {
            bodyText = mc.messageContent.textContent.body;
          } else {
            bodyText = "[No textContent or unrecognized format]";
          }
          groupedByPhase[phase].push(`Msg#${msgId}: ${bodyText}`);
        }

        // now let's do a LLM call summarizing each phase
        for (const phaseKey of Object.values(ConversationPhase)) {
          const lines = groupedByPhase[phaseKey];
          if (lines.length === 0) {
            // skip empty phases
            continue;
          }
          // We'll call gemini to summarize these lines
          console.log(`\n--- Summarizing Phase: ${phaseKey}  (count: ${lines.length}) ---`);
          const summary = await summarizePhase(phaseKey, lines);
          console.log("SUMMARY =>", summary);
        }
      }
    }
  } catch (err) {
    console.error("Error in main():", err);
    process.exit(1);
  }
}

// 7) Run main if this file is invoked directly
if (require.main === module) {
  main();
}