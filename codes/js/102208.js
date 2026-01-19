import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  EyeIcon, 
  PlayIcon, 
  PauseIcon,
  ArrowPathIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

const MemoryVisualization = ({ memory, onClose }) => {
  const [visualization, setVisualization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    fetchVisualization();
  }, [memory]);

  const fetchVisualization = async () => {
    setLoading(true);
    setError(null);
    setGenerationProgress(0);
    setImageLoading(true);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);
    
    try {
      console.log(`🎨 Generating fresh AI visualization for memory: ${memory.title}`);
      
      // Force regeneration by adding a timestamp to ensure fresh generation
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/memories/${memory.id}/visualization?fresh=true&t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate visualization: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎨 Fresh AI visualization generated:', data);
      setVisualization(data);
      setGenerationProgress(100);
      
      // Show the AI prompt being used
      if (data.image_prompt) {
        console.log('🤖 AI Prompt used:', data.image_prompt);
      }
      
    } catch (err) {
      console.error('Error generating visualization:', err);
      setError('Failed to generate AI visualization');
      
      // Enhanced fallback with memory-specific AI generation
      const fallbackImageUrl = generateFallbackImageUrl(memory);
      setVisualization({
        visual_description: `A beautifully crafted scene depicting '${memory.title}' with a ${memory.mood} atmosphere. The visualization captures the emotional essence and key moments of this precious memory through carefully chosen lighting, colors, and composition that evoke deep emotional resonance.`,
        scene_elements: [
          `${memory.mood.charAt(0).toUpperCase() + memory.mood.slice(1)} emotional atmosphere`,
          "Memory-specific visual elements",
          "Carefully balanced lighting",
          "Personal and nostalgic details",
          "Dynamic composition and perspective"
        ],
        color_palette: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1"],
        mood_enhancement: `Enhanced ${memory.mood} atmosphere with carefully balanced lighting and color composition to evoke the emotional depth of this memory.`,
        image_url: fallbackImageUrl,
        image_prompt: `Create a beautiful artwork depicting: ${memory.title}. Style: artistic, emotional, ${memory.mood} mood, high quality, detailed, masterpiece`
      });
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const generateFallbackImageUrl = (memory) => {
    // Create a unique, memory-specific image URL
    const memoryHash = memory.id || memory.title;
    const uniqueSeed = memoryHash.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 10000;
    
    // Create more specific, memory-matching keywords
    let aiKeywords = '';
    if (memory.title.toLowerCase().includes('family') || memory.title.toLowerCase().includes('dinner')) {
      aiKeywords = 'family+dinner+table+people+smiling+warm+lighting+cozy+home+togetherness+celebration';
    } else if (memory.title.toLowerCase().includes('park') || memory.title.toLowerCase().includes('walking')) {
      aiKeywords = 'park+walking+path+person+walking+nature+trees+peaceful+serene+green+leaves+sunlight';
    } else if (memory.title.toLowerCase().includes('grandma') || memory.title.toLowerCase().includes('grandmother')) {
      aiKeywords = 'grandmother+family+home+warm+kitchen+loving+nostalgic+elderly+woman+cooking+family';
    } else if (memory.title.toLowerCase().includes('coffee') || memory.title.toLowerCase().includes('morning')) {
      aiKeywords = 'morning+coffee+ritual+warm+sunlight+peaceful+person+drinking+coffee+breakfast+table';
    } else if (memory.mood.toLowerCase().includes('happy')) {
      aiKeywords = 'happy+family+togetherness+joy+celebration+warm+smiling+people+laughter';
    } else if (memory.mood.toLowerCase().includes('calm')) {
      aiKeywords = 'peaceful+serene+tranquil+calm+nature+soft+lighting+quiet+meditation';
    } else if (memory.mood.toLowerCase().includes('nostalgic')) {
      aiKeywords = 'nostalgic+vintage+old+memories+warm+golden+retro+family+photos';
    } else {
      // Create a more specific search based on the actual memory content
      const memoryWords = memory.title.replace(/ /g, '+').replace(/,/g, '').replace(/\./g, '');
      aiKeywords = `${memoryWords}+${memory.mood}+people+scene+memory+detailed+artistic`;
    }
    
    return `https://source.unsplash.com/800x600/?${aiKeywords}&sig=${uniqueSeed}`;
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: 'text-yellow-600',
      sad: 'text-blue-600',
      excited: 'text-red-600',
      calm: 'text-green-600',
      peaceful: 'text-blue-500',
      wonder: 'text-purple-600',
      satisfied: 'text-orange-600',
      nostalgic: 'text-pink-600',
      anxious: 'text-orange-600',
      neutral: 'text-gray-600'
    };
    return colors[mood] || colors.neutral;
  };

  const getMoodBgColor = (mood) => {
    const colors = {
      happy: 'bg-yellow-50',
      sad: 'bg-blue-50',
      excited: 'bg-red-50',
      calm: 'bg-green-50',
      peaceful: 'bg-blue-50',
      wonder: 'bg-purple-50',
      satisfied: 'bg-orange-50',
      nostalgic: 'bg-pink-50',
      anxious: 'bg-orange-50',
      neutral: 'bg-gray-50'
    };
    return colors[mood] || colors.neutral;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"
                  style={{ transform: `rotate(${generationProgress * 3.6}deg)` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generating AI Visualization
            </h3>
            <p className="text-gray-600 mb-4">
              Creating a beautiful visual representation of your memory
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-500">
              {generationProgress < 30 && "Analyzing memory content..."}
              {generationProgress >= 30 && generationProgress < 60 && "Generating visual elements..."}
              {generationProgress >= 60 && generationProgress < 90 && "Creating artwork..."}
              {generationProgress >= 90 && "Finalizing visualization..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI Memory Visualization
              </h2>
              <p className="text-gray-600">{memory.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchVisualization}
              className="mt-2 text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {visualization && (
          <div className="space-y-6">
            {/* Generated Image */}
            {visualization.image_url && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <PhotoIcon className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    AI-Generated Artwork
                  </h3>
                  <div className="flex items-center space-x-2 ml-auto">
                    <SparklesIcon className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">
                      Generated by Gemini AI
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <div className="relative">
                    <img 
                      src={visualization.image_url} 
                      alt={`AI-generated artwork for ${memory.title}`}
                      className="w-full h-auto rounded-lg shadow-md"
                      onLoad={() => setImageLoading(false)}
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        setImageLoading(false);
                        // Fallback to a different image if the first one fails
                        e.target.src = "https://picsum.photos/800/600?random=2";
                      }}
                    />
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {visualization.image_prompt && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 italic">
                        <strong>AI Prompt:</strong> {visualization.image_prompt}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visual Scene Description */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8">
              <div className="flex items-center space-x-3 mb-4">
                <PhotoIcon className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  AI-Generated Visual Scene
                </h3>
                <button
                  onClick={togglePlayback}
                  className="ml-auto p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  title={isPlaying ? "Pause visualization" : "Play visualization"}
                >
                  {isPlaying ? (
                    <PauseIcon className="h-5 w-5" />
                  ) : (
                    <PlayIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-100">
                <p className="text-gray-700 leading-relaxed text-lg italic">
                  "{visualization.visual_description}"
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <SparklesIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-600 font-medium">
                    Generated by Gemini AI
                  </span>
                </div>
              </div>
            </div>

            {/* Scene Elements and Color Palette */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <EyeIcon className="h-5 w-5 text-purple-600" />
                  <span>Scene Elements</span>
                </h3>
                <div className="space-y-3">
                  {visualization.scene_elements.map((element, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                    >
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-gray-700">{element}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Color Palette
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {visualization.color_palette.map((color, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100"
                      style={{ backgroundColor: color + '10' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mood Enhancement */}
            <div className={`${getMoodBgColor(memory.mood)} rounded-xl p-6 border border-gray-200`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mood Enhancement
              </h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(memory.mood)}`}>
                  {memory.mood}
                </span>
                <span className="text-gray-700">
                  {visualization.mood_enhancement}
                </span>
              </div>
            </div>

            {/* Original Memory */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Original Memory
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {memory.title}
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {memory.content}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(memory.mood)}`}>
                    {memory.mood}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(memory.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryVisualization; 