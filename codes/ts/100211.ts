
import { deepSeekAI } from './deepSeekAI';
import { ExamProfile, GeneratedPlanResult } from '@/types/study';
import { parseChatGptPlan } from '@/services/planParserService';
import { convertPlanToDailyStudySessions } from '@/services/studySessionService';

export const generateStudyPlanFromApiData = async (
  profile: ExamProfile
): Promise<GeneratedPlanResult> => {
  try {
    // Use DeepSeek AI to generate the study plan
    const { studyPlan, subjects, subjectDetails } = await deepSeekAI.generateStudyPlan({
      examType: profile.examType,
      timeInMonths: profile.preparationMonths,
      timeAllocatedPerDay: profile.dailyHours
    });

    // Parse the study plan into our format
    const days = parseChatGptPlan(studyPlan);
    
    // Convert to daily sessions and study plan overview
    return convertPlanToDailyStudySessions(days, profile.preparationMonths, profile.dailyHours);
  } catch (error) {
    console.error('Error generating plan from API data:', error);
    throw error;
  }
};

// Re-export types for convenience
export type { StudySession, StudyPlan, ExamProfile } from '@/types/study';
