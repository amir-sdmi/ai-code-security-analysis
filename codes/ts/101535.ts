import { supabase } from '../config/supabase';
import OpenAI from 'openai';
import type { User, Story, Post } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const userService = {
  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('uid', userId);

    if (error) throw error;
  },

  async updateUserLanguage(userId: string, language: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 'settings->language': language })
      .eq('uid', userId);

    if (error) throw error;
  },

  async uploadMedia(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadStory(userId: string, file: Blob): Promise<string> {
    const fileExt = 'webm';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `stories/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('stories')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(filePath);

    const { error: storyError } = await supabase
      .from('stories')
      .insert([{
        user_id: userId,
        media_url: publicUrl,
        media_type: 'video',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }]);

    if (storyError) throw storyError;

    return publicUrl;
  },

  async generateBio(userId: string, interests: string[]): Promise<string> {
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Generate a friendly, professional bio for a user profile based on their interests. Keep it concise and engaging.'
        },
        {
          role: 'user',
          content: `Interests: ${interests.join(', ')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const bio = completion.choices[0].message.content;

    if (bio) {
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('uid', userId);

      if (error) throw error;
    }

    return bio || '';
  },

  async suggestConnections(userId: string): Promise<User[]> {
    // Get user's interests and current connections
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('bio, contacts')
      .eq('uid', userId)
      .single();

    if (userError) throw userError;

    // Use ChatGPT to analyze bio and suggest relevant interests
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Extract key interests and professional areas from this bio. Return as comma-separated list.'
        },
        {
          role: 'user',
          content: user.bio || ''
        }
      ],
      temperature: 0.3
    });

    const interests = completion.choices[0].message.content?.split(',').map(i => i.trim()) || [];

    // Find users with similar interests
    const { data: suggestions, error: suggestionError } = await supabase
      .from('profiles')
      .select('*')
      .not('uid', 'in', `(${[userId, ...(user.contacts || [])].join(',')})`)
      .textSearch('bio', interests.join(' | '))
      .limit(10);

    if (suggestionError) throw suggestionError;
    return suggestions as User[];
  }
};