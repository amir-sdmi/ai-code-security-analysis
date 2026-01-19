import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import {
  processSchedulingRequest,
  extractEventsFromPrompt,
  convertExtractedEventsToCalendarEvents,
  findTimeConflicts,
} from "@/lib/gemini-ai";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  generateEventTimesFromRequest,
  extractMultipleEvents,
  parseUserScheduleRequest,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get user's calendar events for the next 14 days
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: twoWeeksLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsResponse.data.items;

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { goal } = await request.json();

    if (!goal || typeof goal !== "string") {
      return NextResponse.json(
        { error: "Goal is required and must be a string" },
        { status: 400 }
      );
    }

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get existing events to avoid conflicts
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: twoWeeksLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const existingEvents = eventsResponse.data.items || [];

    // IMPROVED APPROACH: Use Gemini to extract events from natural language input first
    console.log("Using enhanced AI extraction for prompt:", goal);

    try {
      // Step 1: Extract structured event information from the natural language input
      const extractedEvents = await extractEventsFromPrompt(goal);
      console.log(
        `AI extracted ${extractedEvents.length} events from the prompt`
      );

      if (extractedEvents.length === 0) {
        console.log("No events extracted, falling back to traditional parsing");
        return fallbackToTraditionalParsing(
          goal,
          existingEvents,
          now,
          twoWeeksLater,
          calendar
        );
      }

      // Step 2: Convert the extracted events to properly formatted calendar events
      const calendarEvents = await convertExtractedEventsToCalendarEvents(
        extractedEvents,
        now
      );

      // Step 3: Check for conflicts with existing events
      const conflicts = findTimeConflicts(existingEvents, calendarEvents);

      if (conflicts.length > 0) {
        console.log(`Found ${conflicts.length} conflicts with existing events`);

        // Return conflicts to the frontend for user confirmation
        return NextResponse.json({
          conflicts,
          proposedEvents: calendarEvents,
          hasConflicts: true,
        });
      }

      // No conflicts, proceed with creating the events
      const createdEvents = [];
      for (const event of calendarEvents) {
        try {
          console.log(`Creating event at exact time: ${event.start.dateTime}`);

          // Make sure to preserve the exact time specified by the user
          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
              ...event,
              // Ensure we're using the Europe/London timezone and not adjusting times
              start: {
                ...event.start,
                timeZone: "Europe/London",
              },
              end: {
                ...event.end,
                timeZone: "Europe/London",
              },
            },
          });
          createdEvents.push(response.data);
        } catch (eventError) {
          console.error("Error creating individual event:", eventError);
          // Continue with other events even if one fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdEvents.length} events on your calendar`,
        events: createdEvents,
      });
    } catch (aiError) {
      console.error("AI-based extraction failed:", aiError);
      console.log("Falling back to traditional parsing approach");

      // If AI extraction fails, fall back to traditional approach
      return fallbackToTraditionalParsing(
        goal,
        existingEvents,
        now,
        twoWeeksLater,
        calendar
      );
    }
  } catch (error) {
    console.error("Error in schedule API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function for the traditional parsing approach as fallback
async function fallbackToTraditionalParsing(
  goal: string,
  existingEvents: any[],
  now: Date,
  twoWeeksLater: Date,
  calendar: any
) {
  // Extract multiple event requests from the single prompt using the local extraction
  const eventRequests = extractMultipleEvents(goal);
  console.log(`Extracted ${eventRequests.length} event requests locally`);

  if (eventRequests.length > 1) {
    // Multiple events detected, process each one
    const createdEvents = [];
    const conflicts = [];
    let hasConflicts = false;

    for (const eventRequest of eventRequests) {
      // Try to parse each event using direct time detection first
      const parsedTimes = generateEventTimesFromRequest(eventRequest, now);

      if (parsedTimes) {
        // Event has a specific time reference, create it directly
        console.log(`Direct time detection found for: "${eventRequest}"`);

        // Extract event name from the request
        const parsed = parseUserScheduleRequest(eventRequest);
        const eventName = parsed?.eventName || "New Event";

        const newEvent = {
          summary: eventName,
          description: `Automatically created from: "${eventRequest}"`,
          start: {
            dateTime: parsedTimes.start.toISOString(),
            timeZone: "Europe/London",
          },
          end: {
            dateTime: parsedTimes.end.toISOString(),
            timeZone: "Europe/London",
          },
        };

        // Check for conflicts
        const eventConflict = checkForConflict(
          existingEvents,
          parsedTimes.start,
          parsedTimes.end
        );

        if (eventConflict) {
          // Add to conflicts list
          conflicts.push({
            existingEvent: eventConflict,
            proposedEvent: newEvent,
            overlapMinutes: 60, // Approximation
          });
          hasConflicts = true;
        } else {
          // No conflicts, create the event
          try {
            const response = await calendar.events.insert({
              calendarId: "primary",
              requestBody: newEvent,
            });
            createdEvents.push(response.data);
          } catch (error) {
            console.error(
              `Error creating event from request "${eventRequest}":`,
              error
            );
          }
        }
      } else {
        // If no specific times were found, check if this is a task/all-day event
        const parsed = parseUserScheduleRequest(eventRequest);

        // If we have a date but no specific time, treat as an all-day event
        if (parsed?.date && !parsed.timeDetail) {
          console.log(`All-day event detected for: "${eventRequest}"`);

          const eventDate = parsed.date;
          const nextDay = new Date(eventDate);
          nextDay.setDate(nextDay.getDate() + 1);

          // Format dates for all-day event
          const dateStr = eventDate.toISOString().split("T")[0];
          const nextDayStr = nextDay.toISOString().split("T")[0];

          const allDayEvent = {
            summary: parsed.eventName || "New Event",
            description: `All-day event created from: "${eventRequest}"`,
            start: {
              date: dateStr,
              timeZone: "Europe/London",
            },
            end: {
              date: nextDayStr, // End date is exclusive, so use the next day
              timeZone: "Europe/London",
            },
          };

          try {
            const response = await calendar.events.insert({
              calendarId: "primary",
              requestBody: allDayEvent,
            });
            createdEvents.push(response.data);
          } catch (error) {
            console.error(
              `Error creating all-day event from request "${eventRequest}":`,
              error
            );
          }
        } else {
          // If we can't parse directly, fall back to Gemini AI for the full request
          console.log(
            `Could not directly parse event: "${eventRequest}", falling back to Gemini AI`
          );
          return processWithAI(
            goal,
            existingEvents,
            now,
            twoWeeksLater,
            calendar
          );
        }
      }
    }

    // After processing all events
    if (hasConflicts) {
      // Return the conflicts to show the user
      return NextResponse.json({
        conflicts,
        proposedEvents: conflicts.map((conflict) => conflict.proposedEvent),
        hasConflicts: true,
        partialSuccess: createdEvents.length > 0,
        createdEvents: createdEvents.length > 0 ? createdEvents : undefined,
      });
    }

    // All events created successfully
    return NextResponse.json({
      success: true,
      message: `Created ${createdEvents.length} events on your calendar`,
      events: createdEvents,
    });
  } else {
    // Single event or couldn't split the request, use traditional approach
    return processWithAI(goal, existingEvents, now, twoWeeksLater, calendar);
  }
}

// Helper function to check for conflicts between events
function checkForConflict(existingEvents, newStart, newEnd) {
  const newStartTime = new Date(newStart).getTime();
  const newEndTime = new Date(newEnd).getTime();

  return existingEvents.find((existingEvent) => {
    if (!existingEvent.start?.dateTime || !existingEvent.end?.dateTime) {
      return false; // Skip all-day events or events without proper datetime
    }

    const existingStart = new Date(existingEvent.start.dateTime).getTime();
    const existingEnd = new Date(existingEvent.end.dateTime).getTime();

    return (
      (newStartTime >= existingStart && newStartTime < existingEnd) ||
      (newEndTime > existingStart && newEndTime <= existingEnd) ||
      (newStartTime <= existingStart && newEndTime >= existingEnd)
    );
  });
}

// Helper function to process requests using full Gemini AI approach
async function processWithAI(
  goal,
  existingEvents,
  startDate,
  endDate,
  calendar
) {
  try {
    // Process the user's goal with Gemini AI
    const result = await processSchedulingRequest({
      goal,
      existingEvents,
      startDate,
      endDate,
    });

    // Check if we have conflicts and handle them appropriately
    if (result.hasConflicts) {
      // Return the conflicts to show the user
      return NextResponse.json({
        conflicts: result.conflicts,
        proposedEvents: result.events,
        hasConflicts: true,
      });
    }

    // No conflicts, proceed with creating events
    const scheduledEvents = result.events || result; // Handle both the conflict object and regular array response

    // Log successful Gemini response
    console.log(`Received ${scheduledEvents.length} events from Gemini AI`);

    // Create the events in Google Calendar
    const createdEvents = [];
    for (const event of scheduledEvents) {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          ...event,
        },
      });

      createdEvents.push(response.data);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdEvents.length} events on your calendar`,
      events: createdEvents,
    });
  } catch (error) {
    console.error("Error processing scheduling with Gemini:", error);
    return NextResponse.json(
      {
        error: "Failed to process scheduling request with AI",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
