import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import { GoogleGenAI } from '@google/genai';

interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Use Hono's built-in WebSocket support
app.get('/ws', upgradeWebSocket((c) => {
  return {
    async onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data.toString());
        console.log('Received message:', data);
        
        if (data.type === 'message') {
          const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
          const model = data.model || 'gemini-2.0-flash-001';
          
          // Configure based on model capabilities
          const config: any = {
            temperature: 0.7,
            maxOutputTokens: 1000,
            systemInstruction: 'You are a helpful, friendly voice assistant. Keep your responses concise and conversational, suitable for being read aloud by text-to-speech.'
          };
          
          // Add model-specific features
          if (model.includes('2.0')) {
            // Gemini 2.0 supports Google Search
            config.tools = [{ googleSearch: {} }];
          } else if (model.includes('2.5')) {
            // Gemini 2.5 supports thinking AND search
            config.tools = [{ googleSearch: {} }];
            config.thinkingConfig = {
              includeThoughts: true,
              thinkingBudget: 8192 // Medium thinking budget
            };
          }
          
          // Stream response using selected model
          try {
            const response = await ai.models.generateContentStream({
              model: model,
              contents: data.message,
              config: config
            });

            // TTS chunking variables
            let textBuffer = '';
            let audioChunkIndex = 0;
            
            // Helper function to process TTS for a text chunk
            const processTTSChunk = async (text: string, isLast = false) => {
              if (!data.tts || !text.trim()) return;
              
              try {
                const ttsResponse = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-preview-tts', // Use TTS-specific model
                  contents: [{ parts: [{ text: text.trim() }] }], // Proper content structure for TTS
                  config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                      }
                    }
                  }
                });
                
                const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                  ws.send(JSON.stringify({
                    type: 'audio_chunk',
                    data: audioData,
                    index: audioChunkIndex++,
                    isLast: isLast
                  }));
                }
              } catch (ttsError: any) {
                console.error('TTS Chunk Error:', ttsError);
                // Send error to client for debugging
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `TTS Error: ${ttsError?.message || 'Unknown TTS error'}`
                }));
              }
            };
            
            // Stream chunks back to client and process TTS in real-time
            for await (const chunk of response) {
              // Handle thinking thoughts for 2.5 models
              if (model.includes('2.5') && chunk.candidates?.[0]?.content?.parts) {
                for (const part of chunk.candidates[0].content.parts) {
                  if (part.thought && part.text) {
                    ws.send(JSON.stringify({
                      type: 'thinking',
                      content: '🤔 ' + part.text
                    }));
                  }
                }
              }
              
              // Handle search grounding for both models
              if (chunk.candidates?.[0]?.groundingMetadata?.webSearchQueries) {
                const queries = chunk.candidates[0].groundingMetadata.webSearchQueries;
                if (queries && queries.length > 0) {
                  ws.send(JSON.stringify({
                    type: 'search',
                    content: '🔍 Searching: ' + queries.join(', ')
                  }));
                }
              }
              
              if (chunk.text) {
                // Send text chunk immediately
                ws.send(JSON.stringify({
                  type: 'chunk',
                  content: chunk.text
                }));
                
                // Add to buffer for TTS processing
                if (data.tts) {
                  textBuffer += chunk.text;
                  
                  // Process TTS when we have complete sentences
                  const sentences = textBuffer.split(/[.!?]+/);
                  
                  if (sentences.length > 1) {
                    const completeSentences = sentences.slice(0, -1).join('. ').trim();
                    textBuffer = sentences[sentences.length - 1] || '';
                    
                    if (completeSentences) {
                      processTTSChunk(completeSentences + '.');
                    }
                  }
                  // Process if buffer gets too long
                  else if (textBuffer.length > 200) {
                    const textToProcess = textBuffer.trim();
                    textBuffer = '';
                    if (textToProcess) {
                      processTTSChunk(textToProcess);
                    }
                  }
                }
              }
            }
            
            // Process any remaining text buffer for TTS
            if (data.tts && textBuffer.trim()) {
              await processTTSChunk(textBuffer, true);
            }
            
            // Send completion signal
            ws.send(JSON.stringify({ 
              type: 'complete',
              audioComplete: !data.tts || audioChunkIndex === 0
            }));
            
          } catch (apiError: any) {
            console.error('Gemini API Error:', apiError);
            ws.send(JSON.stringify({
              type: 'error',
              message: `API Error: ${apiError?.message || 'Unknown API error'}`
            }));
          }
        }
        
        // Handle audio messages - Gemini 2.0 can process audio directly
        else if (data.type === 'audio_message') {
          try {
            console.log('Processing audio input...');
            
            const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
            const model = data.model || 'gemini-2.0-flash-001';
            
            // Convert base64 audio to proper format for Gemini
            const audioBlob = {
              inlineData: {
                data: data.audioData,
                mimeType: data.mimeType || 'audio/webm'
              }
            };
            
            // Configure based on model capabilities
            const config: any = {
              temperature: 0.7,
              maxOutputTokens: 1000,
              systemInstruction: 'You are a helpful, friendly voice assistant. Keep your responses concise and conversational, suitable for being read aloud by text-to-speech.'
            };
            
            // Add model-specific features
            if (model.includes('2.0')) {
              config.tools = [{ googleSearch: {} }];
            } else if (model.includes('2.5')) {
              // Gemini 2.5 supports thinking AND search
              config.tools = [{ googleSearch: {} }];
              config.thinkingConfig = {
                includeThoughts: true,
                thinkingBudget: 8192
              };
            }
            
            // Use Gemini to transcribe and respond to the audio
            const response = await ai.models.generateContentStream({
              model: model,
              contents: [
                {
                  parts: [
                    { text: "Please transcribe this audio and then respond to what the user said:" },
                    audioBlob
                  ]
                }
              ],
              config: config
            });

            // Process the streaming response same as text
            let textBuffer = '';
            let audioChunkIndex = 0;
            
            // Helper function for audio TTS processing
            const processAudioTTSChunk = async (text: string, isLast = false) => {
              if (!data.tts || !text.trim()) return;
              
              try {
                const ttsResponse = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-preview-tts', // Use TTS-specific model
                  contents: [{ parts: [{ text: text.trim() }] }], // Proper content structure for TTS
                  config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                      }
                    }
                  }
                });
                
                const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                  ws.send(JSON.stringify({
                    type: 'audio_chunk',
                    data: audioData,
                    index: audioChunkIndex++,
                    isLast: isLast
                  }));
                }
              } catch (ttsError: any) {
                console.error('Audio TTS Chunk Error:', ttsError);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `Audio TTS Error: ${ttsError?.message || 'Unknown TTS error'}`
                }));
              }
            };
            
            for await (const chunk of response) {
              // Handle thinking thoughts for 2.5 models
              if (model.includes('2.5') && chunk.candidates?.[0]?.content?.parts) {
                for (const part of chunk.candidates[0].content.parts) {
                  if (part.thought && part.text) {
                    ws.send(JSON.stringify({
                      type: 'thinking',
                      content: '🤔 ' + part.text
                    }));
                  }
                }
              }
              
              // Handle search grounding for both models
              if (chunk.candidates?.[0]?.groundingMetadata?.webSearchQueries) {
                const queries = chunk.candidates[0].groundingMetadata.webSearchQueries;
                if (queries && queries.length > 0) {
                  ws.send(JSON.stringify({
                    type: 'search',
                    content: '🔍 Searching: ' + queries.join(', ')
                  }));
                }
              }
              
              if (chunk.text) {
                ws.send(JSON.stringify({
                  type: 'chunk',
                  content: chunk.text
                }));
                
                // Add to buffer for TTS processing
                if (data.tts) {
                  textBuffer += chunk.text;
                  
                  const sentences = textBuffer.split(/[.!?]+/);
                  if (sentences.length > 1) {
                    const completeSentences = sentences.slice(0, -1).join('. ').trim();
                    textBuffer = sentences[sentences.length - 1] || '';
                    
                    if (completeSentences) {
                      await processAudioTTSChunk(completeSentences + '.');
                    }
                  }
                  else if (textBuffer.length > 200) {
                    const textToProcess = textBuffer.trim();
                    textBuffer = '';
                    if (textToProcess) {
                      await processAudioTTSChunk(textToProcess);
                    }
                  }
                }
              }
            }
            
            // Process remaining buffer
            if (data.tts && textBuffer.trim()) {
              await processAudioTTSChunk(textBuffer, true);
            }
            
            ws.send(JSON.stringify({ 
              type: 'complete',
              audioComplete: !data.tts || audioChunkIndex === 0
            }));
            
          } catch (audioError: any) {
            console.error('Audio processing error:', audioError);
            ws.send(JSON.stringify({
              type: 'error',
              message: `Audio Error: ${audioError?.message || 'Failed to process audio'}`
            }));
          }
        }
        
      } catch (error: any) {
        console.error('WebSocket Message Error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: `Message Error: ${error?.message || 'Unknown error'}`
        }));
      }
    },
    
    onClose: (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
    },
    
    onError: (event) => {
      console.error('WebSocket error:', event);
    }
  };
}));

// Simple HTML client for testing
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Voice Assistant</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .container {
          width: 100%;
          max-width: 900px;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        
        .header p {
          color: #94a3b8;
          font-size: 1.1rem;
        }
        
        #messages {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          height: 500px;
          padding: 25px;
          overflow-y: auto;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        #messages::-webkit-scrollbar {
          width: 8px;
        }
        
        #messages::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }
        
        #messages::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        
        .message {
          margin: 15px 0;
          opacity: 0;
          animation: fadeIn 0.3s ease-out forwards;
          position: relative;
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        .message-content {
          position: relative;
          z-index: 2;
        }
        
        .message-waveform {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.1;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 0 20px;
          gap: 2px;
          overflow: hidden;
        }
        
        .message-wave {
          width: 3px;
          height: 60%;
          background: currentColor;
          border-radius: 2px;
          animation: messageWave 2s ease-in-out infinite;
        }
        
        @keyframes messageWave {
          0%, 100% { 
            transform: scaleY(0.3);
            opacity: 0.5;
          }
          50% { 
            transform: scaleY(1);
            opacity: 1;
          }
        }
        
        .message-wave:nth-child(1) { animation-delay: 0s; }
        .message-wave:nth-child(2) { animation-delay: 0.1s; }
        .message-wave:nth-child(3) { animation-delay: 0.2s; }
        .message-wave:nth-child(4) { animation-delay: 0.3s; }
        .message-wave:nth-child(5) { animation-delay: 0.4s; }
        .message-wave:nth-child(6) { animation-delay: 0.5s; }
        .message-wave:nth-child(7) { animation-delay: 0.6s; }
        .message-wave:nth-child(8) { animation-delay: 0.7s; }
        
        .user {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          padding: 15px 20px;
          border-radius: 18px 18px 5px 18px;
          align-self: flex-end;
          margin-left: auto;
          max-width: 70%;
          box-shadow: 0 3px 15px rgba(59, 130, 246, 0.3);
        }
        
        .assistant {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          padding: 15px 20px;
          border-radius: 18px 18px 18px 5px;
          max-width: 70%;
          box-shadow: 0 3px 15px rgba(249, 115, 22, 0.3);
        }
        
        .thinking {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          padding: 15px 20px;
          border-radius: 18px 18px 18px 5px;
          max-width: 70%;
          box-shadow: 0 3px 15px rgba(139, 92, 246, 0.3);
          font-style: italic;
        }
        
        .search {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 15px 20px;
          border-radius: 18px 18px 18px 5px;
          max-width: 70%;
          box-shadow: 0 3px 15px rgba(16, 185, 129, 0.3);
        }
        
        #thinkingBtn {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }
        
        #thinkingBtn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        
        .error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 15px 20px;
          border-radius: 12px;
          text-align: center;
        }
        
        .status {
          color: #64748b;
          font-style: italic;
          text-align: center;
          font-size: 0.9rem;
        }
        
        .waveform-container {
          height: 60px;
          margin: 20px 0;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: rgba(30, 41, 59, 0.3);
          display: none;
        }
        
        .waveform-container.active {
          display: block;
        }
        
        .waveform {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 0 20px;
        }
        
        .wave-bar {
          width: 4px;
          background: linear-gradient(to top, #3b82f6, #60a5fa);
          border-radius: 2px;
          animation: wave 1s ease-in-out infinite;
        }
        
        .assistant-waveform .wave-bar {
          background: linear-gradient(to top, #f97316, #fb923c);
        }
        
        @keyframes wave {
          0%, 100% { height: 20%; }
          50% { height: 80%; }
        }
        
        .wave-bar:nth-child(1) { animation-delay: 0s; }
        .wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .wave-bar:nth-child(5) { animation-delay: 0.4s; }
        .wave-bar:nth-child(6) { animation-delay: 0.5s; }
        .wave-bar:nth-child(7) { animation-delay: 0.6s; }
        .wave-bar:nth-child(8) { animation-delay: 0.7s; }
        .wave-bar:nth-child(9) { animation-delay: 0.8s; }
        .wave-bar:nth-child(10) { animation-delay: 0.9s; }
        
        .input-container {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .input-wrapper {
          display: flex;
          gap: 15px;
          align-items: center;
          margin-bottom: 15px;
        }
        
        #input {
          flex: 1;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #e2e8f0;
          padding: 15px 20px;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        
        #input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        #input::placeholder {
          color: #64748b;
        }
        
        button {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 15px 25px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        #recordBtn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          min-width: 140px;
        }
        
        #recordBtn.recording {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(239, 68, 68, 0.6); }
          100% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
        }
        
        #ttsBtn {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
        }
        
        #ttsBtn.active {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        
        .secondary-btn {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: none;
        }
        
        .secondary-btn:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: #3b82f6;
        }
        
        .waveform-label {
          position: absolute;
          top: 50%;
          left: 20px;
          transform: translateY(-50%);
          font-size: 0.8rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          z-index: 10;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AI Voice Assistant</h1>
          <p>Speak naturally or type your message</p>
        </div>
        
        <div id="messages"></div>
        
        <div id="userWaveform" class="waveform-container">
          <span class="waveform-label">Recording</span>
          <div class="waveform">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
          </div>
        </div>
        
        <div id="assistantWaveform" class="waveform-container assistant-waveform">
          <span class="waveform-label">Speaking</span>
          <div class="waveform">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
          </div>
        </div>
        
        <div class="input-container">
          <div class="input-wrapper">
            <input type="text" id="input" placeholder="Type a message or click Record to speak..." onkeypress="if(event.key==='Enter') sendMessage()">
            <button onclick="sendMessage()">Send</button>
          </div>
          <div class="button-group">
            <button id="recordBtn" onclick="toggleRecording()">🎤 Record</button>
            <button id="ttsBtn" onclick="toggleTTS()">🔊 TTS: OFF</button>
            <button id="thinkingBtn" onclick="toggleThinking()">🤔 Thinking: OFF</button>
            <button class="secondary-btn" onclick="clearMessages()">Clear Chat</button>
          </div>
        </div>
      </div>
      
      <script>
        let ws;
        let ttsEnabled = false;
        let thinkingEnabled = false;
        let currentAssistantMessage = '';
        let audioQueue = [];
        let isPlayingAudio = false;
        let audioIndicator = null;
        let mediaRecorder = null;
        let isRecording = false;
        
        function toggleThinking() {
          thinkingEnabled = !thinkingEnabled;
          const btn = document.getElementById('thinkingBtn');
          btn.textContent = thinkingEnabled ? '🤔 Thinking: ON' : '🤔 Thinking: OFF';
          btn.classList.toggle('active', thinkingEnabled);
        }
        
        function connect() {
          const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
          ws = new WebSocket(\`\${protocol}//\${location.host}/ws\`);
          
          ws.onopen = () => {
            addMessage('✅ Connected to voice agent', 'status');
          };
          
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
            
            if (data.type === 'chunk') {
              currentAssistantMessage += data.content;
              updateAssistantMessage(currentAssistantMessage);
            } else if (data.type === 'thinking') {
              addMessage(data.content, 'thinking');
            } else if (data.type === 'search') {
              addMessage(data.content, 'search');
            } else if (data.type === 'complete') {
              currentAssistantMessage = '';
              addMessage('✅ Response complete', 'status');
            } else if (data.type === 'audio_chunk') {
              if (audioQueue.length === 0 && !isPlayingAudio) {
                showAudioIndicator();
              }
              
              audioQueue.push({
                data: data.data,
                index: data.index,
                isLast: data.isLast
              });
              
              if (!isPlayingAudio) {
                processAudioQueue();
              }
            } else if (data.type === 'error') {
              addMessage(\`❌ Error: \${data.message}\`, 'error');
            }
          };
          
          ws.onclose = () => {
            addMessage('❌ Connection closed', 'status');
            setTimeout(connect, 3000);
          };
          
          ws.onerror = (error) => {
            addMessage('❌ Connection error', 'error');
            console.error('WebSocket error:', error);
          };
        }
        
        function sendMessage() {
          const input = document.getElementById('input');
          const message = input.value.trim();
          if (!message) return;
          
          addMessage(message, 'user');
          
          if (ws.readyState === WebSocket.OPEN) {
            const model = thinkingEnabled ? 'gemini-2.5-flash-preview-05-20' : 'gemini-2.0-flash-001';
            ws.send(JSON.stringify({
              type: 'message',
              message: message,
              tts: ttsEnabled,
              model: model
            }));
          } else {
            addMessage('❌ Not connected', 'error');
          }
          
          input.value = '';
        }
        
        function addMessage(content, type = 'assistant') {
          const messages = document.getElementById('messages');
          const div = document.createElement('div');
          div.className = \`message \${type}\`;
          
          // Add waveform background
          const waveform = document.createElement('div');
          waveform.className = 'message-waveform';
          for (let i = 0; i < 8; i++) {
            const wave = document.createElement('div');
            wave.className = 'message-wave';
            waveform.appendChild(wave);
          }
          div.appendChild(waveform);
          
          // Add message content
          const contentDiv = document.createElement('div');
          contentDiv.className = 'message-content';
          contentDiv.innerHTML = content;
          div.appendChild(contentDiv);
          
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
          
          if (type === 'assistant') {
            window.lastAssistantMessage = div;
          }
        }
        
        function updateAssistantMessage(content) {
          if (window.lastAssistantMessage) {
            const contentDiv = window.lastAssistantMessage.querySelector('.message-content');
            if (contentDiv) {
              contentDiv.innerHTML = content;
            }
          } else {
            addMessage(content, 'assistant');
          }
          document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
        }
        
        function toggleTTS() {
          ttsEnabled = !ttsEnabled;
          const btn = document.getElementById('ttsBtn');
          btn.textContent = ttsEnabled ? '🔊 TTS: ON' : '🔊 TTS: OFF';
          btn.classList.toggle('active', ttsEnabled);
        }
        
        function clearMessages() {
          document.getElementById('messages').innerHTML = '';
        }
        
        function showAudioIndicator() {
          const assistantWaveform = document.getElementById('assistantWaveform');
          assistantWaveform.classList.add('active');
        }
        
        function hideAudioIndicator() {
          const assistantWaveform = document.getElementById('assistantWaveform');
          assistantWaveform.classList.remove('active');
        }
        
        async function processAudioQueue() {
          if (isPlayingAudio || audioQueue.length === 0) return;
          
          isPlayingAudio = true;
          showAudioIndicator();
          
          audioQueue.sort((a, b) => a.index - b.index);
          
          while (audioQueue.length > 0) {
            const audioChunk = audioQueue.shift();
            await playAudioChunk(audioChunk.data);
          }
          
          isPlayingAudio = false;
          hideAudioIndicator();
        }
        
        function playAudioChunk(base64Data) {
          return new Promise((resolve, reject) => {
            try {
              // Convert base64 to raw PCM data
              const binaryString = atob(base64Data);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Create WAV header for 16-bit PCM at 24kHz
              const sampleRate = 24000;
              const numChannels = 1;
              const bitsPerSample = 16;
              const dataLength = bytes.length;
              
              const wavHeader = new ArrayBuffer(44);
              const view = new DataView(wavHeader);
              
              // RIFF chunk descriptor
              const setString = (offset, string) => {
                for (let i = 0; i < string.length; i++) {
                  view.setUint8(offset + i, string.charCodeAt(i));
                }
              };
              
              setString(0, 'RIFF');
              view.setUint32(4, 36 + dataLength, true);
              setString(8, 'WAVE');
              
              // fmt sub-chunk
              setString(12, 'fmt ');
              view.setUint32(16, 16, true); // Subchunk1Size
              view.setUint16(20, 1, true); // AudioFormat (PCM)
              view.setUint16(22, numChannels, true);
              view.setUint32(24, sampleRate, true);
              view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); // ByteRate
              view.setUint16(32, numChannels * bitsPerSample / 8, true); // BlockAlign
              view.setUint16(34, bitsPerSample, true);
              
              // data sub-chunk
              setString(36, 'data');
              view.setUint32(40, dataLength, true);
              
              // Combine header and PCM data
              const wavBlob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
              const audioUrl = URL.createObjectURL(wavBlob);
              const audio = new Audio(audioUrl);
              
              audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
              };
              audio.onerror = (e) => {
                console.error('Audio chunk play failed:', e);
                URL.revokeObjectURL(audioUrl);
                resolve();
              };
              
              audio.play().catch(e => {
                console.error('Audio chunk play failed:', e);
                URL.revokeObjectURL(audioUrl);
                resolve();
              });
            } catch (e) {
              console.error('Audio chunk creation failed:', e);
              resolve();
            }
          });
        }
        
        async function toggleRecording() {
          const btn = document.getElementById('recordBtn');
          
          if (!isRecording) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaRecorder = new MediaRecorder(stream);
              const audioChunks = [];
              
              mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
              };
              
              mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                  const base64Data = reader.result.split(',')[1];
                  
                  if (ws.readyState === WebSocket.OPEN) {
                    addMessage('🎤 Audio message sent', 'user');
                    const model = thinkingEnabled ? 'gemini-2.5-flash-preview-05-20' : 'gemini-2.0-flash-001';
                    ws.send(JSON.stringify({
                      type: 'audio_message',
                      audioData: base64Data,
                      mimeType: 'audio/webm',
                      tts: ttsEnabled,
                      model: model
                    }));
                  } else {
                    addMessage('❌ Not connected', 'error');
                  }
                };
                
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());
              };
              
              mediaRecorder.start();
              isRecording = true;
              btn.textContent = '⏹️ Stop';
              btn.classList.add('recording');
              
              // Show user waveform
              const userWaveform = document.getElementById('userWaveform');
              userWaveform.classList.add('active');
              
            } catch (error) {
              console.error('Error accessing microphone:', error);
              addMessage('❌ Microphone access denied', 'error');
            }
          } else {
            mediaRecorder.stop();
            isRecording = false;
            btn.textContent = '🎤 Record';
            btn.classList.remove('recording');
            
            // Hide user waveform
            const userWaveform = document.getElementById('userWaveform');
            userWaveform.classList.remove('active');
          }
        }
        
        // Connect when page loads
        connect();
        
        // Enable audio context on first user interaction
        document.addEventListener('click', function enableAudio() {
          const audio = new Audio();
          audio.play().catch(() => {});
          document.removeEventListener('click', enableAudio);
        }, { once: true });
      </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    gemini_key_configured: !!c.env.GEMINI_API_KEY
  });
});

export default app;
