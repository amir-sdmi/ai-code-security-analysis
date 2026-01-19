import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader, AlertCircle, Image, Info, ChevronDown, Zap, Search, Sparkles } from 'lucide-react';

// Replace with the provided API key
const GEMINI_API_KEY = "api_key";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
// Using gemini-1.5-flash model as specified in the reference
const GEMINI_VISION_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I\'m your AquaGrow assistant. How can I help you with your aquaponics system today? You can also upload images of your plants or fish for disease analysis.' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [typingAnimation, setTypingAnimation] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      setTypingAnimation(true);
    } else {
      const timer = setTimeout(() => {
        setTypingAnimation(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.includes('image/')) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: 'Please upload an image file (JPEG, PNG, etc.).' }
      ]);
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: 'Please upload an image smaller than 5MB.' }
      ]);
      return;
    }

    setSelectedImage(file);
    
    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    // Add user message with image
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: 'Please analyze this image for plant or fish diseases and provide recommendations.', 
        image: imagePreviewUrl 
      }
    ]);
    
    try {
      // Convert image to base64
      const base64Image = await getBase64FromFile(selectedImage);
      
      // Prepare structured prompt based on the reference
      const prompt = `Analyze this aquaponics image and provide a detailed assessment. Format the response exactly as follows:

*DIAGNOSED CONDITION:*
* *[PRIMARY DISEASE NAME IN CAPS]*
* Confidence Level: [High/Medium/Low]

*KEY SYMPTOMS OBSERVED:*
* *[SYMPTOM IN CAPS]*: [Description]
* *[SYMPTOM IN CAPS]*: [Description]
(List all visible symptoms)

*ADDITIONAL INFORMATION:*
* Severity Level: [Mild/Moderate/Severe]
* Affected Area: [Plant part or fish area description]
* Pattern: [Localized/Widespread]

*RECOMMENDATIONS:*
1. [Treatment suggestions]
2. [System adjustments]
3. [Prevention measures]

*DISCLAIMER:*
This is an AI-assisted analysis and should not replace professional agricultural/aquacultural diagnosis.`;
      
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: selectedImage.type,
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,  // Lower temperature for more structured responses
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };
      
      console.log("Sending request to Gemini Vision API...");
      
      const response = await fetch(`${GEMINI_VISION_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        const content = data.candidates[0].content;
        
        if (content.parts && content.parts.length > 0 && content.parts[0].text) {
          const analysis = content.parts[0].text;
          
          // Simulate typing effect by adding a small delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Format the analysis to ensure proper rendering in chat
          const formattedAnalysis = formatAnalysisResponse(analysis);
          setMessages(prev => [...prev, { 
            role: 'bot', 
            content: formattedAnalysis,
            isHtml: true // Flag to indicate HTML content
          }]);
        } else {
          throw new Error('Response missing text content');
        }
      } else {
        if (data.promptFeedback && data.promptFeedback.blockReason) {
          // Handle content filtering blocks
          const blockReason = data.promptFeedback.blockReason;
          setMessages(prev => [
            ...prev, 
            { 
              role: 'bot', 
              content: `I couldn't analyze this image because it was flagged by content filters (${blockReason}). Please try a different image.` 
            }
          ]);
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: `Sorry, I encountered an error analyzing your image: ${error.message}. Please try again with a clearer photo.` 
        }
      ]);
    } finally {
      setIsLoading(false);
      removeSelectedImage();
    }
  };

  // Helper function to format the analysis response similar to the reference code
  const formatAnalysisResponse = (text) => {
    // Split the text into sections
    const sections = text.split(/\*([^*]+)\*/).filter(Boolean);
    let formattedHtml = '';
    
    // Process each section and add appropriate HTML formatting
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      // Main section headings (DIAGNOSED CONDITION, KEY SYMPTOMS, etc.)
      if (section.includes('DIAGNOSED CONDITION') || 
          section.includes('KEY SYMPTOMS OBSERVED') || 
          section.includes('ADDITIONAL INFORMATION') || 
          section.includes('RECOMMENDATIONS') || 
          section.includes('DISCLAIMER')) {
        formattedHtml += `<div class="font-bold text-emerald-700 mt-3 mb-1">${section}:</div>`;
      } 
      // Disease name or symptom name in CAPS
      else if (section.match(/^[A-Z\s()]+$/) && !section.includes(':')) {
        formattedHtml += `<div class="font-bold text-emerald-600 ml-2">${section}</div>`;
      }
      // Confidence level, severity, etc.
      else if (section.includes('Confidence Level:') || 
               section.includes('Severity Level:') || 
               section.includes('Affected Area:') || 
               section.includes('Pattern:')) {
        const [label, value] = section.split(':');
        formattedHtml += `<div class="ml-2 mt-1"><span class="font-medium">${label}:</span>${value}</div>`;
      }
      // Numbered recommendations
      else if (section.match(/^\d+\.\s/)) {
        formattedHtml += `<div class="ml-2 mt-1">${section}</div>`;
      }
      // Regular text content
      else if (section.length > 2) {
        formattedHtml += `<div class="ml-2 mb-1">${section}</div>`;
      }
    }
    
    return formattedHtml;
  };

  const getBase64FromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If there's an image selected, analyze it
    if (selectedImage) {
      await analyzeImage();
      return;
    }
    
    // Otherwise, process text input
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Adding aquaponics context to each request
      const prompt = `You are an AI assistant specialized in aquaponics farming. 
                     You provide helpful, accurate, and concise information about aquaponics systems,
                     water quality, fish health, plant growth, and sustainable farming practices.
                     
                     User query: ${inputValue}`;
      
      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
        const botResponse = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: `Sorry, I encountered an error processing your request: ${error.message}. Please try again later.` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated suggestions with categories for a more modern UI
  const suggestionCategories = [
    {
      name: "Common Issues",
      items: [
        "How to fix low oxygen levels?",
        "Why are my plant leaves turning yellow?",
        "What causes fish stress in aquaponics?"
      ]
    },
    {
      name: "Getting Started",
      items: [
        "What fish are best for beginners?",
        "Best vegetables for aquaponics",
        "How to cycle a new system"
      ]
    },
    {
      name: "Maintenance",
      items: [
        "Optimal water temperature for tilapia",
        "How often to test water quality",
        "Recommended fish stocking density"
      ]
    }
  ];
  
  // Handle suggestion click - updated to immediately send the query
  const handleSuggestionClick = async (suggestion) => {
    // Set the input value (visual feedback)
    setInputValue(suggestion);
    
    // Create and add user message
    const userMessage = { role: 'user', content: suggestion };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and show loading
    setInputValue('');
    setIsLoading(true);
    setIsSuggestionOpen(false);
    
    // Process the query immediately
    try {
      // Adding aquaponics context to each request
      const prompt = `You are an AI assistant specialized in aquaponics farming. 
                     You provide helpful, accurate, and concise information about aquaponics systems,
                     water quality, fish health, plant growth, and sustainable farming practices.
                     
                     User query: ${suggestion}`;
      
      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
        const botResponse = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: `Sorry, I encountered an error processing your request: ${error.message}. Please try again later.` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {/* Chat toggle button with animation */}
      <button
        onClick={toggleChat}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transform transition-all duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600 rotate-90' : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-110'
        } text-white`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* New feature indicator */}
      {!isOpen && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      )}

      {/* Chat interface - modernized UI */}
      {isOpen && (
        <div 
          className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 transition-all duration-300 transform animate-slideUp"
          style={{ height: '520px', maxHeight: '80vh' }}
        >
          {/* Chat header with improved styling */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-1.5 rounded-lg mr-2 backdrop-blur-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">AquaGrow Assistant</h3>
                <div className="flex items-center text-xs text-emerald-100">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-300 mr-1.5"></span>
                  AI-Powered Support
                </div>
              </div>
            </div>
            <button 
              onClick={toggleChat} 
              className="text-white hover:text-gray-200 bg-white/10 rounded-full p-1.5 hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages area with improved styling */}
          <div 
            className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4" 
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%239EE6B5" fill-opacity="0.05" fill-rule="evenodd"/%3E%3C/svg%3E")', backgroundAttachment: 'fixed' }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-tr-none shadow-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                  } animate-fadeIn`}
                >
                  {msg.image && (
                    <div className="mb-2">
                      <img 
                        src={msg.image} 
                        alt="User uploaded" 
                        className="max-w-full rounded-md shadow-sm" 
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                  )}
                  {msg.isHtml ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: msg.content }} 
                      className="analysis-result" // Add named class for styling
                    />
                  ) : (
                    msg.content
                  )}
                </div>
                
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center ml-2 flex-shrink-0 shadow-sm">
                    <span className="text-white text-xs font-medium">
                      {msg.content.length > 0 ? msg.content[0].toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator animation */}
            {typingAnimation && (
              <div className="flex justify-start mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mr-2 flex-shrink-0 shadow-sm">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Image preview with improved styling */}
          {imagePreviewUrl && (
            <div className="p-3 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
              <div className="relative inline-block group">
                <img 
                  src={imagePreviewUrl} 
                  alt="Preview" 
                  className="max-h-24 max-w-full rounded-lg border border-gray-300 shadow-sm transition-transform group-hover:scale-[1.02]" 
                />
                <button 
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-700 flex items-center">
                <Info className="w-3 h-3 mr-1 text-emerald-600" />
                Click send to analyze this image
              </div>
            </div>
          )}

          {/* Enhanced suggestions section with categories - Fixed scrolling issue */}
          <div className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 p-3">
            <button 
              onClick={() => setIsSuggestionOpen(!isSuggestionOpen)}
              className="flex items-center justify-between w-full text-sm text-gray-700 hover:text-emerald-600 transition-colors"
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-emerald-500" />
                <span className="font-medium">Ask me about</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSuggestionOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {isSuggestionOpen && (
              <div className="mt-3">
                <div className="max-h-52 overflow-y-auto pr-1 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                  <div className="space-y-3 pb-1">
                    {suggestionCategories.map((category, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0 bg-white bg-opacity-90 backdrop-blur-sm py-1 z-10">{category.name}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {category.items.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-sm bg-white p-2.5 rounded-lg border border-gray-200 text-left hover:border-emerald-300 hover:bg-emerald-50 transition-all group flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <span className="truncate">{suggestion}</span>
                              <Send className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area with improved styling */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center rounded-xl border border-gray-300 bg-gray-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden shadow-sm">
              {!selectedImage && (
                <input
                  type="text"
                  placeholder="Ask about aquaponics..."
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="flex-grow px-4 py-3 bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                />
              )}
              
              {selectedImage && (
                <div className="flex-grow px-4 py-3 text-sm text-emerald-600 font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Image ready for analysis
                </div>
              )}
              
              <button
                type="button"
                onClick={() => selectedImage ? removeSelectedImage() : fileInputRef.current.click()}
                disabled={isLoading}
                className={`p-2 transition-colors ${
                  selectedImage 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-emerald-600'
                }`}
                title={selectedImage ? "Remove image" : "Upload image"}
              >
                {selectedImage ? <X className="w-5 h-5" /> : <Image className="w-5 h-5" />}
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="submit"
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className={`m-1 p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  isLoading || (!inputValue.trim() && !selectedImage)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-md'
                } text-white`}
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                Powered by Gemini AI
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
