import { supabase } from '../lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const parseProblemFile = async (file: File): Promise<any[]> => {
  try {
    const fileContent = await readFileAsText(file);
    
    // Use Gemini to parse the file content
    const prompt = `
      Parse this CSV/Excel data into a structured JSON format for coding problems.
      The data contains coding problems with their details.
      
      Here's the content:
      ${fileContent}
      
      Convert it to an array of objects with these fields:
      - title: The problem title
      - description: Full problem description
      - difficulty: "easy", "medium", or "hard"
      - category: The problem category (e.g., "Algorithms", "Data Structures")
      - tags: Array of relevant tags
      - starter_code: Initial code template
      - solution_code: Solution code
      - test_cases: Array of objects with "input" and "expected_output" fields
      - is_sample: Boolean indicating if this is a sample test case
      - time_limit_ms: Time limit in milliseconds (default 1000)
      - memory_limit_mb: Memory limit in MB (default 128)
      - points: Points awarded for solving (default 100)
      
      Return ONLY valid JSON without any explanation.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse file content');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    return parsedData;
  } catch (error) {
    console.error('Error parsing problem file:', error);
    throw new Error('Failed to parse file. Please ensure it\'s in the correct format.');
  }
};

export const uploadProblemImport = async (file: File, userId: string): Promise<string> => {
  try {
    // Create import record
    const { data: importData, error: importError } = await supabase
      .from('problem_imports')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        status: 'pending'
      })
      .select()
      .single();

    if (importError) {
      throw importError;
    }

    return importData.id;
  } catch (error) {
    console.error('Error creating problem import:', error);
    throw error;
  }
};

export const processProblemImport = async (importId: string, problems: any[]): Promise<any> => {
  try {
    // Call the process-problem-import edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-problem-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        importId,
        problems
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process problem import');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing problem import:', error);
    throw error;
  }
};

export const submitProblemSolution = async (
  problemId: string,
  code: string,
  language: string,
  challengeId?: string
): Promise<any> => {
  try {
    // Call the judge-problem edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/judge-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        problemId,
        code,
        language,
        challengeId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit solution');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting problem solution:', error);
    throw error;
  }
};

export const createProblem = async (problem: any): Promise<any> => {
  try {
    // Insert problem
    const { data: problemData, error: problemError } = await supabase
      .from('problems')
      .insert({
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category || null,
        tags: problem.tags || [],
        starter_code: problem.starter_code || '',
        solution_code: problem.solution_code || '',
        time_limit_ms: problem.time_limit_ms || 1000,
        memory_limit_mb: problem.memory_limit_mb || 128,
        points: problem.points || 100,
        created_by: problem.created_by
      })
      .select()
      .single();

    if (problemError) {
      throw problemError;
    }

    // Insert test cases if provided
    if (problem.test_cases && Array.isArray(problem.test_cases)) {
      const testCases = problem.test_cases.map((tc: any, index: number) => ({
        problem_id: problemData.id,
        input: tc.input,
        expected_output: tc.expected_output,
        is_sample: tc.is_sample || index < 2, // Make first two test cases samples by default
        order_index: index
      }));

      const { error: testCasesError } = await supabase
        .from('problem_test_cases')
        .insert(testCases);

      if (testCasesError) {
        throw testCasesError;
      }
    }

    return problemData;
  } catch (error) {
    console.error('Error creating problem:', error);
    throw error;
  }
};

export const createCodingChallenge = async (challenge: any): Promise<any> => {
  try {
    // Insert challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('coding_challenges')
      .insert({
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        category: challenge.category || null,
        tags: challenge.tags || [],
        start_date: challenge.start_date || null,
        end_date: challenge.end_date || null,
        is_active: challenge.is_active !== undefined ? challenge.is_active : true,
        created_by: challenge.created_by
      })
      .select()
      .single();

    if (challengeError) {
      throw challengeError;
    }

    // Add problems to challenge if provided
    if (challenge.problem_ids && Array.isArray(challenge.problem_ids)) {
      const challengeProblems = challenge.problem_ids.map((problemId: string, index: number) => ({
        challenge_id: challengeData.id,
        problem_id: problemId,
        order_index: index,
        points_multiplier: 1.0
      }));

      const { error: problemsError } = await supabase
        .from('coding_challenge_problems')
        .insert(challengeProblems);

      if (problemsError) {
        throw problemsError;
      }
    }

    return challengeData;
  } catch (error) {
    console.error('Error creating coding challenge:', error);
    throw error;
  }
};

// Utility function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// Get difficulty color class for styling
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'text-green-500 bg-green-900 bg-opacity-30';
    case 'medium':
      return 'text-yellow-500 bg-yellow-900 bg-opacity-30';
    case 'hard':
      return 'text-red-500 bg-red-900 bg-opacity-30';
    default:
      return 'text-gray-500 bg-gray-700';
  }
};

// Get status color class for styling
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'accepted':
      return 'text-green-500';
    case 'wrong_answer':
      return 'text-red-500';
    case 'time_limit_exceeded':
      return 'text-yellow-500';
    case 'memory_limit_exceeded':
      return 'text-orange-500';
    case 'runtime_error':
    case 'compilation_error':
      return 'text-red-400';
    case 'pending':
    case 'running':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};