import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { openai } from '../../lib/openai';
import { put } from '@vercel/blob';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch memes from Supabase
    const { data: memes, error } = await supabase
      .from('memes')
      .select('id, text, imageUrl');

    if (error) throw error;

    for (const meme of memes) {
      // Generate name using ChatGPT
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates appropriate names for memes based on their content." },
          { role: "user", content: `Generate a short, appropriate name for a meme with the following text: "${meme.text}". The name should be suitable for use in a URL.` }
        ],
      });

      const newName = completion.choices[0].message.content.trim().toLowerCase().replace(/\s+/g, '-');

      // Update Vercel Blob Storage
      const oldUrl = new URL(meme.imageUrl);
      const fileName = oldUrl.pathname.split('/').pop();
      const fileExtension = fileName.split('.').pop();
      const newFileName = `${newName}.${fileExtension}`;
      
      const response = await fetch(meme.imageUrl);
      const blob = await response.blob();

      const { url: newUrl } = await put(newFileName, blob, {
        access: 'public',
      });

      // Update Supabase
      const { error: updateError } = await supabase
        .from('memes')
        .update({ imageUrl: newUrl })
        .eq('id', meme.id);

      if (updateError) throw updateError;
    }

    res.status(200).json({ message: 'Memes processed successfully' });
  } catch (error) {
    console.error('Error processing memes:', error);
    res.status(500).json({ message: 'Error processing memes', error: error.message });
  }
}
