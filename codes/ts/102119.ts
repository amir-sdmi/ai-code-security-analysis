// 🤖 AI Narrative Summary Service with Gemini
// Generates clinical progress summaries from assessment data + biometrics + micro-wins

import { supabase } from '@/lib/supabase';

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

interface ProgressData {
  assessmentResults: any[];
  biometricsData: any[];
  microWins: any[];
  timeframe: string;
}

export class AISummaryService {
  
  /**
   * Generate narrative summary for a client's progress
   */
  static async generateNarrativeSummary(clientId: string): Promise<string> {
    try {
      console.log(`🤖 Generating AI summary for client ${clientId}`);
      
      // 1. Gather progress data from last 30 days
      const progressData = await this.collectProgressData(clientId);
      
      // 2. Generate AI summary with Gemini
      const summary = await this.callGeminiAPI(progressData);
      
      // 3. Cache the summary
      await this.cacheSummary(clientId, summary);
      
      console.log(`✅ AI summary generated and cached`);
      return summary;
      
    } catch (error) {
      console.error('Error generating AI summary:', error);
      
      // Fallback to rule-based summary
      return this.generateFallbackSummary(clientId);
    }
  }
  
  /**
   * Get cached summary or generate new one if stale
   */
  static async getCachedSummary(clientId: string): Promise<string> {
    const { data: cached } = await supabase
      .from('summary_cache')
      .select('summary, refreshed_at')
      .eq('client_id', clientId)
      .single();
    
    // If cache is fresh (< 24 hours), return it
    if (cached && this.isCacheFresh(cached.refreshed_at)) {
      console.log(`📋 Using cached summary for client ${clientId}`);
      return cached.summary;
    }
    
    // Otherwise, generate new summary
    console.log(`🔄 Cache stale or missing for client ${clientId}, generating new summary`);
    return this.generateNarrativeSummary(clientId);
  }
  
  /**
   * Force refresh summary (bypass cache)
   */
  static async refreshSummary(clientId: string): Promise<string> {
    console.log(`🔄 Force refreshing summary for client ${clientId}`);
    return this.generateNarrativeSummary(clientId);
  }
  
  private static async collectProgressData(clientId: string): Promise<ProgressData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`📊 Collecting progress data for client ${clientId} (last 30 days)`);
    
    // Fetch assessment results
    const { data: assessments } = await supabase
      .from('assessment_results')
      .select(`
        score,
        severity_level,
        interpretation,
        completed_at,
        assessments!inner(instrument)
      `)
      .eq('assessments.client_id', clientId)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false })
      .limit(10);
    
    console.log(`📈 Found ${assessments?.length || 0} assessment results`);
    
    // Fetch biometrics data
    const { data: biometrics } = await supabase
      .from('biometrics_hourly')
      .select('metric, value, recorded_at')
      .eq('client_id', clientId)
      .gte('recorded_at', thirtyDaysAgo.toISOString())
      .in('metric', ['steps', 'sleep_minutes'])
      .order('recorded_at', { ascending: false });
    
    console.log(`📊 Found ${biometrics?.length || 0} biometric data points`);
    
    // Fetch micro-wins
    const { data: wins } = await supabase
      .from('micro_wins')
      .select('win_text, detected_at, confidence_score')
      .eq('client_id', clientId)
      .gte('detected_at', thirtyDaysAgo.toISOString())
      .order('detected_at', { ascending: false })
      .limit(5);
    
    console.log(`🎉 Found ${wins?.length || 0} micro-wins`);
    
    return {
      assessmentResults: assessments || [],
      biometricsData: biometrics || [],
      microWins: wins || [],
      timeframe: '30 days'
    };
  }
  
  private static async callGeminiAPI(data: ProgressData): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    
    const prompt = this.buildProgressPrompt(data);
    
    console.log(`🤖 Calling Gemini API for narrative summary`);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error (${response.status}):`, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!summary) {
      console.error('❌ No summary generated by Gemini API', result);
      throw new Error('No summary generated by Gemini API');
    }
    
    console.log(`✅ Generated summary: ${summary.substring(0, 100)}...`);
    return summary.trim();
  }
  
  private static buildProgressPrompt(data: ProgressData): string {
    const { assessmentResults, biometricsData, microWins } = data;
    
    // Calculate trends
    const assessmentTrend = this.calculateAssessmentTrend(assessmentResults);
    const activitySummary = this.summarizeBiometrics(biometricsData);
    const winsText = microWins.map(w => w.win_text).join('; ');
    
    return `
As a clinical AI assistant, analyze this patient's 30-day progress and write a concise narrative summary in exactly 3 sentences. Use professional but encouraging language suitable for both patient and therapist.

ASSESSMENT DATA:
${assessmentTrend}

ACTIVITY & SLEEP DATA:
${activitySummary}

MICRO-WINS DETECTED:
${winsText || 'No specific achievements detected in this period'}

Write a 3-sentence summary covering:
1. Overall trend in mental health assessment scores and interpretation
2. Physical activity/sleep patterns and any correlation with mood
3. Notable achievements, behavioral changes, or areas for continued focus

Guidelines:
- Use clinical but encouraging language
- Be specific about score changes and trends
- Mention correlations between physical and mental health metrics
- Highlight positive developments and achievements
- Keep each sentence focused and informative
- Avoid medical diagnosis or prescriptive language

Example format:
"Patient demonstrates steady improvement in depression symptoms with PHQ-9 scores declining from 14 to 9 over the past month, indicating a shift from moderate to mild depression. Physical activity has increased to an average of 8,500 daily steps with sleep stabilizing at 7-8 hours nightly, both showing positive correlation with improved mood ratings. Notable achievements include successfully managing work presentations and establishing a consistent morning routine, suggesting improved coping strategies and self-efficacy."

Clinical Summary (exactly 3 sentences):
    `.trim();
  }
  
  private static calculateAssessmentTrend(results: any[]): string {
    if (!results.length) return 'No recent assessment data available for analysis';
    
    const byInstrument = results.reduce((acc, r) => {
      const instrument = r.assessments.instrument;
      if (!acc[instrument]) acc[instrument] = [];
      acc[instrument].push({ 
        score: r.score, 
        date: r.completed_at,
        severity: r.severity_level 
      });
      return acc;
    }, {});
    
    const trends = Object.entries(byInstrument).map(([instrument, scores]: [string, any[]]) => {
      if (scores.length < 2) {
        return `${instrument}: Current score ${scores[0]?.score || 'N/A'} (${scores[0]?.severity || 'unknown'})`;
      }
      
      const latest = scores[0].score;
      const earliest = scores[scores.length - 1].score;
      const change = latest - earliest;
      const direction = change < 0 ? 'decreased' : change > 0 ? 'increased' : 'remained stable';
      const changeAmount = Math.abs(change);
      
      return `${instrument}: scores ${direction} from ${earliest} to ${latest} (${changeAmount} point change, currently ${scores[0].severity})`;
    });
    
    return trends.join('; ');
  }
  
  private static summarizeBiometrics(biometrics: any[]): string {
    if (!biometrics.length) return 'No biometric activity data available for this period';
    
    const stepData = biometrics.filter(b => b.metric === 'steps');
    const sleepData = biometrics.filter(b => b.metric === 'sleep_minutes');
    
    const avgSteps = stepData.length > 0 
      ? Math.round(stepData.reduce((sum, d) => sum + d.value, 0) / stepData.length)
      : 0;
      
    const avgSleep = sleepData.length > 0
      ? Math.round(sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length / 60 * 10) / 10
      : 0;
    
    const stepsText = avgSteps > 0 ? `averaging ${avgSteps.toLocaleString()} daily steps` : 'limited step tracking';
    const sleepText = avgSleep > 0 ? `${avgSleep} hours average sleep` : 'limited sleep tracking';
    
    // Calculate trend if we have enough data
    let trendInfo = '';
    if (stepData.length > 7) {
      const recentSteps = stepData.slice(0, Math.floor(stepData.length/2)).reduce((sum, d) => sum + d.value, 0) / Math.floor(stepData.length/2);
      const earlierSteps = stepData.slice(Math.floor(stepData.length/2)).reduce((sum, d) => sum + d.value, 0) / (stepData.length - Math.floor(stepData.length/2));
      const stepTrend = recentSteps > earlierSteps ? 'increasing' : recentSteps < earlierSteps ? 'decreasing' : 'stable';
      trendInfo = `, with ${stepTrend} activity trend`;
    }
    
    return `Physical activity shows ${stepsText} and ${sleepText}${trendInfo}`;
  }
  
  private static async cacheSummary(clientId: string, summary: string): Promise<void> {
    const { error } = await supabase
      .from('summary_cache')
      .upsert({
        client_id: clientId,
        summary,
        generated_by: 'gemini-pro',
        refreshed_at: new Date().toISOString(),
        metadata: {
          generated_at: new Date().toISOString(),
          version: '1.0'
        }
      });
    
    if (error) {
      console.error('Error caching summary:', error);
      throw error;
    }
    
    console.log(`📋 Summary cached for client ${clientId}`);
  }
  
  private static async generateFallbackSummary(clientId: string): Promise<string> {
    console.log(`🔄 Generating fallback summary for client ${clientId}`);
    
    // Simple rule-based fallback
    const { data: recent } = await supabase
      .from('assessment_results')
      .select(`
        score, 
        severity_level,
        assessments!inner(instrument)
      `)
      .eq('assessments.client_id', clientId)
      .order('completed_at', { ascending: false })
      .limit(1);
    
    if (recent?.[0]) {
      const { score, severity_level, assessments } = recent[0];
      const instrument = assessments.instrument;
      
      return `Recent ${instrument} assessment shows a score of ${score} indicating ${severity_level} symptoms. Patient is actively engaged with regular assessment tracking and monitoring. Continue current therapeutic approach while maintaining consistent assessment schedule for ongoing progress evaluation.`;
    }
    
    return 'Patient is actively engaged with assessment tracking system. Regular monitoring shows commitment to therapeutic process. Encourage continued participation for comprehensive progress insights and personalized care optimization.';
  }
  
  private static isCacheFresh(refreshedAt: string): boolean {
    const cacheAge = Date.now() - new Date(refreshedAt).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return cacheAge < maxAge;
  }
}

// Export for use in components
export default AISummaryService; 