import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { xai } from "@ai-sdk/xai"
import { requireAuth } from "@/lib/auth"

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    const { timeRange, dataCenterId, activityType } = await request.json()

    // Fetch relevant data for analysis
    let query = `
      SELECT 
        al.id, 
        al.timestamp, 
        al.proximity_meters, 
        al.duration_minutes,
        te.entity_id,
        at.name as activity_type,
        dc.name as data_center_name
      FROM activity_logs al
      JOIN tracked_entities te ON al.entity_id = te.id
      JOIN activity_types at ON te.type_id = at.id
      JOIN data_centers dc ON al.data_center_id = dc.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (timeRange) {
      query += ` AND al.timestamp >= NOW() - INTERVAL '${timeRange}'`
    }

    if (dataCenterId) {
      query += ` AND al.data_center_id = $${paramIndex++}`
      params.push(dataCenterId)
    }

    if (activityType) {
      query += ` AND at.name = $${paramIndex++}`
      params.push(activityType)
    }

    query += ` ORDER BY al.timestamp DESC LIMIT 500`

    const activityData = await sql.query(query, params)

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        AVG(proximity_meters) as avg_proximity,
        MIN(proximity_meters) as min_proximity,
        MAX(proximity_meters) as max_proximity,
        AVG(duration_minutes) as avg_duration
      FROM activity_logs al
      JOIN tracked_entities te ON al.entity_id = te.id
      JOIN activity_types at ON te.type_id = at.id
      WHERE 1=1
    `

    // Apply the same filters
    const statsResult = await sql.query(statsQuery, params)
    const stats = statsResult.rows[0]

    // Prepare data for AI analysis
    const dataForAnalysis = {
      activities: activityData.rows,
      statistics: stats,
      timeRange,
      dataCenterId,
      activityType,
    }

    // Use Groq for analysis
    const { text: groqAnalysis } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `
        Analyze this data center activity data and provide insights:
        ${JSON.stringify(dataForAnalysis, null, 2)}
        
        Please provide:
        1. Key patterns or trends you observe
        2. Anomalies or unusual activities
        3. Recommendations for monitoring or security
        4. Potential environmental impact insights
        
        Format your response as JSON with these sections.
      `,
    })

    // Use Grok for a second opinion
    const { text: grokAnalysis } = await generateText({
      model: xai("grok-1"),
      prompt: `
        You are an AI assistant specializing in data center operations and security.
        Analyze this activity data near data centers and provide different insights than what might be obvious:
        ${JSON.stringify(dataForAnalysis, null, 2)}
        
        Focus on:
        1. Subtle patterns that might indicate security concerns
        2. Operational efficiency insights
        3. Correlation between human and vessel activities
        4. Potential optimization recommendations
        
        Format your response as JSON with these sections.
      `,
    })

    // Combine the analyses
    return NextResponse.json({
      groqAnalysis: JSON.parse(groqAnalysis),
      grokAnalysis: JSON.parse(grokAnalysis),
      rawData: {
        activities: activityData.rows.slice(0, 50), // Limit for response size
        statistics: stats,
      },
    })
  } catch (error) {
    console.error("Error analyzing activity data:", error)
    return NextResponse.json({ error: "Failed to analyze activity data" }, { status: 500 })
  }
}
