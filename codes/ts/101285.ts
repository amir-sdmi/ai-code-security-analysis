import { supabase } from '@/lib/supabase/client';
import { Note, InsertNote, UpdateNote } from '@/lib/supabase/types';
import { summarizeText } from '@/lib/utils/ai';

export async function getNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes');
  }

  return data || [];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    throw new Error('Failed to fetch note');
  }

  return data;
}

// api/notes.ts : Generate Summary for Notes

export async function createNote(note: InsertNote): Promise<Note> {
  // If content is provided, generate a summary using DeepSeek
  let summary = null;
  if (note.content && note.content.trim().length > 0) {
    summary = await summarizeText(note.content);  // This now calls Gemini's API
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([{ ...note, summary }])
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note');
  }

  return data;
}

export async function updateNote(id: string, note: UpdateNote): Promise<Note> {
  // If content is updated, regenerate summary using Gemini
  let updatedNote = { ...note };
  if (note.content) {
    updatedNote.summary = await summarizeText(note.content); // This calls DeepSeek's API
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ ...updatedNote, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw new Error('Failed to update note');
  }

  return data;
}


export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note');
  }
}

export async function generateNoteSummary(id: string, content: string): Promise<Note> {
  try {
    const summary = await summarizeText(content);
    
    const { data, error } = await supabase
      .from('notes')
      .update({ summary })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}