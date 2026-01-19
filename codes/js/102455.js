import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Backend API configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

// Check if API key is configured
if (!GEMINI_API_KEY) {
  console.error('⚠️ REACT_APP_GEMINI_API_KEY is not configured. Please check your .env file.');
}

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Sonetica, and I help bring your poems and stories to life through custom videos. Share your poem or story with me to get started!",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [audioFile, setAudioFile] = useState(null);
  const [waitingForAudio, setWaitingForAudio] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [audioAnalysisData, setAudioAnalysisData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch videos for EchoVerse
  const fetchVideos = async () => {
    try {
      setLoadingVideos(true);
              const response = await fetch(`${BACKEND_URL}/api/videos`);
      if (response.ok) {
        const videoData = await response.json();
        setVideos(videoData.videos || []);
      } else {
        console.error('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Fetch videos when EchoVerse tab is opened
  useEffect(() => {
    if (activeTab === 'echoverse') {
      fetchVideos();
      
      // Set up polling to check for new videos every 10 seconds
      const interval = setInterval(fetchVideos, 10000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Also refresh videos when a new video is successfully generated
  useEffect(() => {
    if (activeTab === 'echoverse') {
      fetchVideos();
      
      // Restart auto-playing videos when switching to EchoVerse
      setTimeout(() => {
        const backgroundVideos = document.querySelectorAll('.background-video');
        backgroundVideos.forEach(video => {
          video.play().catch(err => {
            console.log('Auto-play prevented:', err);
          });
        });
      }, 100);
    }
  }, [messages, activeTab]); // Refresh when messages change (new video generated) or tab changes

  // Connection status check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Test Gemini API with a simple request
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Hello'
              }]
            }]
          }),
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('connected'); // Set as connected anyway to avoid blocking the UI
      }
    };
    
    checkConnection();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() && !audioFile) return;

    const userMessage = {
      id: Date.now(),
      text: input || (audioFile ? `[Audio file: ${audioFile.name}]` : ''),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (!waitingForAudio && !audioFile && input.trim()) {
        // First interaction - collect the story/poem
        console.log('Storing story text:', input);
        setStoryText(input);
        setWaitingForAudio(true);
        
        const aiResponse = {
          id: Date.now() + 1,
          text: "Beautiful! Now you can optionally upload some music to enhance your story, or just type 'create video' to generate your custom video.",
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setInput('');
        setIsLoading(false);
        return;
      }

      if (input.toLowerCase().includes('create video') && storyText) {
        // Generate video with story text (no audio)
        console.log('Creating video with story only:', storyText);
        await generateVideo();
        return;
      }

      // Handle other responses during audio waiting phase
      const aiResponse = {
        id: Date.now() + 1,
        text: "You can upload music to enhance your story, or type 'create video' to generate your video now.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        text: "I'm having trouble right now. Please try again in a moment.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setInput('');
      setIsLoading(false);
    }
  };

  const analyzeAudio = async (file) => {
    try {
      console.log('Starting audio analysis for:', file.name);
      const audioFormData = new FormData();
      audioFormData.append('audio', file);
      
      const audioResponse = await fetch(`${BACKEND_URL}/analyze-audio`, {
        method: 'POST',
        body: audioFormData,
      });
      
      if (audioResponse.ok) {
        const analysisData = await audioResponse.json();
        console.log('Audio analysis successful:', analysisData);
        setAudioAnalysisData(analysisData);
        return analysisData;
      } else {
        console.error('Audio analysis failed:', audioResponse.status);
        const errorText = await audioResponse.text();
        console.error('Audio analysis error details:', errorText);
        throw new Error(`Audio analysis failed: ${audioResponse.status}`);
      }
    } catch (error) {
      console.error('Audio analysis error:', error);
      throw error;
    }
  };

  const generateVideo = async () => {
    console.log('Starting video generation...');
    console.log('Current story text:', storyText);
    console.log('Current audio file:', audioFile?.name);
    console.log('Current audio analysis data:', audioAnalysisData);

    if (!storyText) {
      console.error('No story text available for video generation');
      const errorResponse = {
        id: Date.now() + 1,
        text: "I need your story or poem first. Please share it with me!",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      return;
    }

    const processingMessage = {
      id: Date.now() + 1,
      text: "Creating your custom video... This may take a few minutes.",
      sender: 'ai',
      timestamp: new Date(),
      isProcessing: true,
      isVideoGeneration: true
    };
    
    setMessages(prev => [...prev, processingMessage]);

    try {
      let analysisData = audioAnalysisData;
      
      // If we have an audio file but no analysis data, analyze it now
      if (audioFile && !analysisData) {
        console.log('Analyzing audio file before video generation...');
        analysisData = await analyzeAudio(audioFile);
      }

      // Generate video prompt using Gemini
      let promptText = `Story/Poem: ${storyText}`;
      
      if (analysisData && analysisData.features) {
        promptText += `\n\nAudio Analysis: Tempo: ${analysisData.features.tempo} BPM, Key: ${analysisData.features.estimated_key}, Energy: ${analysisData.features.rms_energy_mean}, Mood: ${analysisData.features.visual_mapping?.mood || 'neutral'}`;
      }
      
      promptText += `\n\nCreate a single, concise visual prompt (max 50 words) for Stable Diffusion that captures the essence of this story/poem${analysisData ? ' and matches the musical mood' : ''}. IMPORTANT: Use ONLY landscapes, nature scenes, objects, architecture, weather, lighting, or abstract concepts. NEVER include people, humans, faces, figures, characters, or any human-like beings. Focus on the environment and atmosphere instead.`;

      console.log('Generating prompt with Gemini using text:', promptText);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }]
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API failed with status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini response:', data);
      
      const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedPrompt) {
        console.error('No prompt generated by Gemini, response:', data);
        throw new Error('No prompt generated by Gemini');
      }

      console.log('Generated prompt:', generatedPrompt);
      console.log('Original story text used for prompt generation:', storyText);
      console.log('Full Gemini prompt text sent:', promptText);

      // Generate video using the prompt
      const videoFormData = new FormData();
      videoFormData.append('prompts', generatedPrompt);

      console.log('Sending to video generation with prompt:', generatedPrompt);
      const videoResponse = await fetch(`${BACKEND_URL}/generate-animation`, {
        method: 'POST',
        body: videoFormData,
      });

      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        console.error('Video generation failed:', errorText);
        throw new Error(`Video generation failed: ${errorText}`);
      }

      const videoResult = await videoResponse.json();
      console.log('Video generation result:', videoResult);
      
      if ((videoResult.success || videoResult.status === 'success') && videoResult.video_path) {
        const videoMessage = {
          id: Date.now() + 2,
          text: "Your custom video is ready!",
          sender: 'ai',
          timestamp: new Date(),
          videoPath: videoResult.video_path
        };
        
        setMessages(prev => [...prev.slice(0, -1), videoMessage]);
        
        // Reset for next story
        setWaitingForAudio(false);
        setStoryText('');
        setAudioFile(null);
        setAudioAnalysisData(null);
        
        // Add prompt for next story
        setTimeout(() => {
          const nextStoryMessage = {
            id: Date.now() + 3,
            text: "Would you like to create another video? Share your next poem or story!",
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, nextStoryMessage]);
        }, 2000);
        
      } else {
        console.error('Video generation failed - no video path returned:', videoResult);
        throw new Error('Video generation failed - no video path returned');
      }

    } catch (error) {
      console.error('Video generation error:', error);
      let errorMessage = "I couldn't create your video right now. Please try again.";
      
      if (error.message.includes('timeout')) {
        errorMessage = "The video is taking longer than expected. Please try again.";
      } else if (error.message.includes('Gemini')) {
        errorMessage = "There was an issue generating the video prompt. Please try again.";
      } else if (error.message.includes('Video generation failed')) {
        errorMessage = "The video generation service is having issues. Please try again in a moment.";
      }
      
      const errorResponse = {
        id: Date.now() + 2,
        text: errorMessage,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev.slice(0, -1), errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/wav', 'audio/ogg'];
      if (allowedTypes.includes(file.type)) {
        console.log('Audio file selected:', file.name);
        setAudioFile(file);
        
        const audioMessage = {
          id: Date.now(),
          text: `[Audio file: ${file.name}]`,
          sender: 'user',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, audioMessage]);
        
        // If we have both story and audio, generate video automatically
        if (storyText) {
          console.log('Both story and audio available, generating video...');
          setTimeout(() => {
            generateVideo();
          }, 500);
        } else {
          // Just analyze the audio for now
          try {
            await analyzeAudio(file);
            console.log('Audio analyzed and stored for later use');
          } catch (error) {
            console.error('Failed to analyze audio:', error);
          }
        }
      } else {
        alert('Please select a valid audio file (MP3, M4A, AAC, FLAC, WAV, or OGG)');
      }
    }
    // Reset file input
    event.target.value = '';
  };

  // Handle input change with auto-resize
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <div className="tab-container">
        <div className="tab-header">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button 
              className={`tab-button ${activeTab === 'echoverse' ? 'active' : ''}`}
              onClick={() => setActiveTab('echoverse')}
            >
              EchoVerse
            </button>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <div className="chat-container">
            <div className="chat-header">
              <div className="bot-info">
                <div className="bot-avatar">
                  <div className="avatar-circle"></div>
                </div>
                <div className="bot-details">
                  <h3>Sonetica AI</h3>
                  <span className={`status ${connectionStatus}`}>
                    <span className="status-dot"></span>
                    {connectionStatus === 'connected' ? 'Online Now' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 
                     'Offline'}
                  </span>
                </div>
              </div>
            </div>
        
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}>
              <div className="message-content">
                {message.sender === 'user' ? (
                  <>
                    <p className="user-text">{message.text}</p>
                  </>
                ) : (
                  <>
                    <div className="ai-text">
                      {message.isProcessing ? (
                        message.isVideoGeneration ? (
                          <div className="video-generation-animation">
                            <div className="video-thinking-container">
                              <div className="video-icon">🎬</div>
                              <div className="thinking-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                              <div className="generation-text">
                                <p className="generation-stage">Crafting your cinematic vision...</p>
                                <div className="progress-indicators">
                                  <div className="stage-indicator">🎨 Generating artwork</div>
                                  <div className="stage-indicator">🎥 Creating video</div>
                                  <div className="stage-indicator">🎵 Adding audio</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="typing-animation">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        )
                      ) : (
                        <p>{message.text}</p>
                      )}
                      
                      {message.videoPath && (
                        <div className="video-container">
                          <video 
                            controls 
                            autoPlay 
                            muted 
                            loop
                            className="generated-video"
                            onError={(e) => {
                              console.error('Video load error:', e);
                            }}
                          >
                            <source src={`${BACKEND_URL}/${message.videoPath}`} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai-message">
              <div className="message-content">
                <div className="ai-text">
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-form">
          <div className="input-container">
            <button 
              className="attachment-button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload audio file"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            
            <textarea
              ref={textareaRef}
              className="message-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Share your poem or story..."
              disabled={isLoading}
              rows="1"
            />
            
            <button 
              className="send-button" 
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && !audioFile)}
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="audio/*"
          />
        </div>
      </div>
    ) : (
      <div className="echoverse-container">
        <div className="echoverse-header">
          <h2>EchoVerse</h2>
        </div>
        
        {loadingVideos ? (
          <div className="loading-videos">
            <div className="typing-animation">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Loading your videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="no-videos">
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <h3>No videos yet</h3>
              <p>Create your first video in the Chat tab!</p>
            </div>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video, index) => (
              <div key={index} className="video-card">
                <div className="video-wrapper">
                  <video 
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="background-video"
                    onError={(e) => {
                      console.error('Video load error:', e);
                    }}
                    onLoadedData={(e) => {
                      // Ensure video plays when data is loaded
                      e.target.play().catch(err => {
                        console.log('Auto-play prevented:', err);
                      });
                    }}
                    ref={(videoEl) => {
                      if (videoEl && activeTab === 'echoverse') {
                        // Try to play when tab becomes active
                        videoEl.play().catch(err => {
                          console.log('Auto-play prevented:', err);
                        });
                      }
                    }}
                  >
                    <source src={`${BACKEND_URL}/${video.path}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  <div className="video-overlay" onClick={(e) => {
                    // Try to play the background video if it's paused (fallback for autoplay restrictions)
                    const backgroundVideo = e.currentTarget.previousElementSibling;
                    if (backgroundVideo && backgroundVideo.paused) {
                      backgroundVideo.play().catch(err => console.log('Play failed:', err));
                      return;
                    }
                    
                    // Create and show video modal with controls
                    const modal = document.createElement('div');
                    modal.className = 'video-modal';
                    modal.innerHTML = `
                      <div class="video-modal-content">
                        <span class="video-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                        <video controls autoplay ${video.has_audio ? '' : 'muted'} style="width: 100%; max-width: 800px; height: auto;">
                          <source src="${BACKEND_URL}/${video.path}" type="video/mp4" />
                        </video>
                        <div class="video-modal-info">
                          <h3>${video.title}</h3>
                          <p>Created: ${new Date(video.created).toLocaleDateString()}</p>
                          <p>Size: ${(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                          ${video.has_audio ? '<p>🎵 With Audio</p>' : '<p>🔇 No Audio</p>'}
                        </div>
                      </div>
                    `;
                    modal.onclick = (e) => {
                      if (e.target === modal) modal.remove();
                    };
                    document.body.appendChild(modal);
                  }}>
                    <div className="play-button">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <polygon points="8,5 19,12 8,19"/>
                      </svg>
                    </div>
                    <div className="video-info">
                      <div className="video-title">{video.title}</div>
                      <div className="video-meta">
                        <span className="video-date">
                          {new Date(video.created).toLocaleDateString()}
                        </span>
                        {video.has_audio && (
                          <span className="audio-indicator">🎵</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    </div>
    </div>
  );
};

export default App; 