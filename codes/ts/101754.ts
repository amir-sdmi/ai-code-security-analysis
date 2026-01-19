
import { supabase } from '@/integrations/supabase/client';
import { generateStudySessions } from '@/lib/gemini';

// Fetch study sessions for a user
export const fetchStudySessions = async (clerkId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('clerk_id', clerkId)
    .order('start_time', { ascending: true });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Add a study session
export const addStudySession = async (sessionData: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Update a study session
export const updateStudySession = async (sessionId: string, sessionData: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(sessionData)
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Delete a study session
export const deleteStudySession = async (sessionId: string) => {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId);
  
  if (error) {
    throw error;
  }
  
  return true;
};

// Fetch tasks for a user
export const fetchTasks = async (clerkId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('clerk_id', clerkId)
    .order('due_date', { ascending: true });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Add a task
export const addTask = async (taskData: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Update a task
export const updateTask = async (taskId: string, taskData: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Delete a task
export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) {
    throw error;
  }
  
  return true;
};

// Generate and save study sessions from tasks using Gemini AI
export const generateAndSaveStudySessions = async (clerkId: string) => {
  try {
    // Fetch user's tasks
    const tasks = await fetchTasks(clerkId);
    
    if (tasks.length === 0) {
      throw new Error('No tasks found to generate study sessions');
    }
    
    // Generate study sessions using Gemini
    const studySessions = await generateStudySessions(tasks);
    
    if (!studySessions || studySessions.length === 0) {
      throw new Error('Failed to generate study sessions');
    }
    
    // Add clerk_id to each session
    const sessionsWithClerkId = studySessions.map((session: any) => ({
      ...session,
      clerk_id: clerkId
    }));
    
    // Insert all sessions
    const { data, error } = await supabase
      .from('study_sessions')
      .insert(sessionsWithClerkId)
      .select();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error generating sessions:', error);
    throw error;
  }
};

// User methods for Supabase
export const createOrUpdateUser = async (userData: any) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(userData)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const getUser = async (clerkId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .maybeSingle();
  
  if (error) {
    throw error;
  }
  
  return data;
};
