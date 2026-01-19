import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Upload, Quiz, Question } from '../types/quiz';
import { geminiQuizGenerator, GeneratedQuestion, GeminiQuizGenerator, generateYouTubeQuizEdge } from '../lib/gemini';
import { DocumentProcessor } from '../lib/documentProcessor';
import { useNavigate } from 'react-router-dom';

export function useQuizHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUploads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (err) {
      console.error('Error fetching uploads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch uploads');
    }
  };

  const fetchQuizzes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          upload:uploads(*),
          questions(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quizzes');
    }
  };

  const uploadFile = async (file: File): Promise<Upload> => {
    if (!user) throw new Error('User not authenticated');

    // Validate file size
    if (!DocumentProcessor.validateFileSize(file)) {
      throw new Error('File size must be less than 50MB');
    }

    // Validate file type
    if (!DocumentProcessor.isFileTypeSupported(file.type)) {
      throw new Error('Unsupported file type');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quiz-uploads')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('quiz-uploads')
      .getPublicUrl(fileName);

    // Determine file type
    let type: 'video' | 'document' | 'image';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('video/')) {
      type = 'video';
    } else {
      type = 'document';
    }

    // Save upload record
    const { data, error } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        type,
        url: publicUrl,
        filename: file.name,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const createYouTubeUpload = async (url: string): Promise<Upload> => {
    console.log('📹 QUIZ HUB: Creating YouTube upload record for URL:', url);
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        type: 'video',
        url,
        filename: 'YouTube Video',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ QUIZ HUB: Error creating YouTube upload record:', error);
      throw error;
    }

    console.log('✅ QUIZ HUB: YouTube upload record created:', data.id);
    return data;
  };

  const generateQuizWithAI = async (
    upload: Upload, 
    title: string,
    options: {
      numQuestions?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      useAI?: boolean;
      autoNavigate?: boolean;
    } = {}
  ): Promise<Quiz> => {
    console.log('🧠 QUIZ HUB: generateQuizWithAI called with:', { uploadId: upload.id, title, options });
    
    if (!user) throw new Error('User not authenticated');

    const { numQuestions = 5, difficulty = 'mixed', useAI = true, autoNavigate = false } = options;

    console.log('📝 QUIZ HUB: Creating quiz record in database...');
    // Create quiz record first
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        upload_id: upload.id,
        title,
        description: `Generated from ${upload.filename || 'uploaded content'}`,
      })
      .select()
      .single();

    if (quizError) {
      console.error('❌ QUIZ HUB: Error creating quiz record:', quizError);
      throw quizError;
    }

    console.log('✅ QUIZ HUB: Quiz record created:', quiz.id);

    let generatedQuestions: GeneratedQuestion[] = [];
    let usedAI = false;
    let errorDetails = null;

    if (useAI && GeminiQuizGenerator.isConfigured()) {
      console.log('🤖 QUIZ HUB: Using Gemini AI for question generation...');
      // Generate questions using Gemini AI based on upload type
      if (upload.type === 'video' && upload.url.includes('youtube')) {
        console.log('🎥 QUIZ HUB: Generating questions from YouTube video (Edge Function first)...');
        try {
          generatedQuestions = await generateYouTubeQuizEdge(upload.url);
          console.log('✅ QUIZ HUB: YouTube video questions generated via Edge Function:', generatedQuestions.length);
          usedAI = true;
        } catch (edgeError) {
          console.error('❌ QUIZ HUB: Edge Function failed, falling back to direct Gemini API:', edgeError);
          try {
            generatedQuestions = await geminiQuizGenerator.generateFromYouTube(
              upload.url, 
              title,
              { numQuestions, difficulty }
            );
            console.log('✅ QUIZ HUB: YouTube video questions generated via Gemini:', generatedQuestions.length);
            usedAI = true;
          } catch (youtubeError) {
            console.error('❌ QUIZ HUB: DETAILED YouTube generation error:', youtubeError);
            let errObj: any = youtubeError;
            errorDetails = {
              type: typeof youtubeError,
              name: errObj && typeof errObj === 'object' && 'name' in errObj ? errObj.name : '',
              message: errObj && typeof errObj === 'object' && 'message' in errObj ? errObj.message : String(youtubeError),
              stack: errObj && typeof errObj === 'object' && 'stack' in errObj ? errObj.stack : ''
            };
            // Let it fall through to sample questions
          }
        }
      } else if (upload.type === 'document') {
        console.log('📄 QUIZ HUB: Generating questions from document...');
        try {
          // For documents, we would extract text first
          const documentText = `Document: ${upload.filename}\n\nThis document contains educational content that can be used to generate study questions.`;
          generatedQuestions = await geminiQuizGenerator.generateFromText(
            documentText,
            title,
            { numQuestions, difficulty }
          );
          console.log('✅ QUIZ HUB: Document questions generated:', generatedQuestions.length);
          usedAI = true;
        } catch (docError) {
          console.error('❌ QUIZ HUB: Document AI generation failed:', docError);
          let errObj: any = docError;
          errorDetails = { type: 'document', error: errObj && typeof errObj === 'object' && 'message' in errObj ? errObj.message : String(docError) };
        }
      } else if (upload.type === 'image') {
        console.log('🖼️ QUIZ HUB: Generating questions from image...');
        try {
          const imageDescription = `Educational image: ${upload.filename}`;
          generatedQuestions = await geminiQuizGenerator.generateFromImage(
            imageDescription,
            title,
            { numQuestions, difficulty }
          );
          console.log('✅ QUIZ HUB: Image questions generated:', generatedQuestions.length);
          usedAI = true;
        } catch (imageError) {
          console.error('❌ QUIZ HUB: Image AI generation failed:', imageError);
          let errObj: any = imageError;
          errorDetails = { type: 'image', error: errObj && typeof errObj === 'object' && 'message' in errObj ? errObj.message : String(imageError) };
        }
      }
    } else {
      console.log('⚠️ QUIZ HUB: Gemini AI not configured or disabled, using sample questions');
    }

    // If AI generation failed or is not configured, use sample questions
    if (generatedQuestions.length === 0) {
      console.log('📚 QUIZ HUB: Generating sample questions...');
      console.log('🔍 QUIZ HUB: Reason for sample questions:', {
        useAI,
        isAIConfigured: GeminiQuizGenerator.isConfigured(),
        usedAI,
        questionsLength: generatedQuestions.length,
        errorDetails
      });
      
      generatedQuestions = [
        {
          question: "What is the main topic discussed in this content?",
          answer: "The main topic covers the key concepts and ideas presented in the material.",
          difficulty: 'medium' as const,
          topic: "Overview"
        },
        {
          question: "What are the key learning objectives?",
          answer: "The learning objectives focus on understanding the fundamental principles and their applications.",
          difficulty: 'medium' as const,
          topic: "Objectives"
        },
        {
          question: "How can this information be applied practically?",
          answer: "This information can be applied in real-world scenarios to solve problems and make informed decisions.",
          difficulty: 'hard' as const,
          topic: "Application"
        },
        {
          question: "What are the most important points to remember?",
          answer: "The most important points include the core concepts, key terminology, and practical implications.",
          difficulty: 'easy' as const,
          topic: "Summary"
        },
        {
          question: "What additional resources would help deepen understanding?",
          answer: "Additional resources might include related readings, practice exercises, and real-world examples.",
          difficulty: 'medium' as const,
          topic: "Further Study"
        }
      ].slice(0, numQuestions);
      console.log('✅ QUIZ HUB: Sample questions generated:', generatedQuestions.length);
    } else {
      console.log('🎯 QUIZ HUB: Using AI-generated questions:', generatedQuestions.length);
    }

    console.log('💾 QUIZ HUB: Inserting questions into database...');
    // Insert questions into database
    const questionsToInsert = generatedQuestions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      answer_text: q.answer,
      is_flashcard: true,
      order_index: index + 1,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('❌ QUIZ HUB: Error inserting questions:', questionsError);
      throw questionsError;
    }

    console.log('✅ QUIZ HUB: Questions inserted successfully');

    // Auto-navigate to Quiz Hub if requested
    if (autoNavigate) {
      console.log('🧭 QUIZ HUB: Auto-navigating to Quiz Hub...');
      setTimeout(() => {
        navigate('/quiz-hub');
      }, 1500); // Small delay to let the user see the success message
    }

    return quiz;
  };

  // Legacy method for backward compatibility
  const generateQuiz = async (upload: Upload, title: string): Promise<Quiz> => {
    return generateQuizWithAI(upload, title, { useAI: true });
  };

  const deleteQuiz = async (quizId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  const deleteUpload = async (uploadId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', user.id);

    if (error) throw error;
  };

  const processFileAndGenerateQuiz = async (
    file: File,
    options: {
      title?: string;
      numQuestions?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      useAI?: boolean;
      autoNavigate?: boolean;
    } = {}
  ): Promise<Quiz> => {
    console.log('📁 QUIZ HUB: processFileAndGenerateQuiz called with:', { fileName: file.name, fileSize: file.size, options });
    
    const { 
      title = `Quiz from ${file.name}`,
      numQuestions = 5,
      difficulty = 'mixed',
      useAI = true,
      autoNavigate = false
    } = options;

    // Upload file first
    console.log('📤 QUIZ HUB: Uploading file...');
    const upload = await uploadFile(file);
    console.log('✅ QUIZ HUB: File uploaded:', upload.id);

    // For images, try to use Gemini's vision capabilities
    if (upload.type === 'image' && useAI && GeminiQuizGenerator.isConfigured()) {
      console.log('🖼️ QUIZ HUB: Using Gemini vision for image analysis...');
      try {
        // Create quiz record first
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            user_id: user!.id,
            upload_id: upload.id,
            title,
            description: `Generated from ${upload.filename || 'uploaded content'}`,
          })
          .select()
          .single();

        if (quizError) throw quizError;

        // Generate questions using Gemini's vision capabilities
        const generatedQuestions = await geminiQuizGenerator.generateFromImageFile(
          file,
          title,
          { numQuestions, difficulty }
        );

        // Insert questions into database
        const questionsToInsert = generatedQuestions.map((q, index) => ({
          quiz_id: quiz.id,
          question_text: q.question,
          answer_text: q.answer,
          is_flashcard: true,
          order_index: index + 1,
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;

        // Auto-navigate to Quiz Hub if requested
        if (autoNavigate) {
          setTimeout(() => {
            navigate('/quiz-hub');
          }, 1500);
        }

        return quiz;
      } catch (error) {
        console.error('❌ QUIZ HUB: Error with Gemini vision processing, falling back to standard generation:', error);
        // Fall back to standard generation
      }
    }

    // Generate quiz with AI (standard method)
    const quiz = await generateQuizWithAI(upload, title, {
      numQuestions,
      difficulty,
      useAI,
      autoNavigate
    });

    return quiz;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([fetchUploads(), fetchQuizzes()]);
      } catch (err) {
        console.error('Error loading quiz hub data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  return {
    uploads,
    quizzes,
    loading,
    error,
    uploadFile,
    createYouTubeUpload,
    generateQuiz,
    generateQuizWithAI,
    processFileAndGenerateQuiz,
    deleteQuiz,
    deleteUpload,
    refetch: () => Promise.all([fetchUploads(), fetchQuizzes()]),
    isAIConfigured: GeminiQuizGenerator.isConfigured(),
  };
}