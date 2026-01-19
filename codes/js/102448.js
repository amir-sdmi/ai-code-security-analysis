import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Download, Send, Trash2, Code, BarChart3, FileText, Zap, CheckCircle, Blocks } from 'lucide-react';
import BlocklyWorkspace from './BlocklyWorkspace';

const DartCodeOptimizer = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison');
  const [currentResult, setCurrentResult] = useState(null);
  const [blocksXml, setBlocksXml] = useState('');
  const chatEndRef = useRef(null);

  // Get API key from environment variable
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const extractDartCode = (text) => {
    // Look for dart code blocks first
    const dartBlocks = text.match(/```dart\s*([\s\S]*?)\s*```/);
    if (dartBlocks) return dartBlocks[1].trim();

    const codeBlocks = text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlocks) return codeBlocks[1].trim();

    // Liberal detection for any programming content
    const programmingIndicators = [
      '{', '}', '(', ')', ';', '=', 'class', 'void', 'int', 'String',
      'List', 'Map', 'var', 'final', 'const', 'if', 'for', 'while',
      'return', 'import', 'extends', 'implements'
    ];

    const lines = text.trim().split('\n');
    const hasProgrammingSymbols = programmingIndicators.filter(indicator => 
      text.includes(indicator)
    ).length;

    if ((lines.length > 2 && hasProgrammingSymbols >= 3) || 
        hasProgrammingSymbols >= 5 ||
        (text.includes('class') && text.includes('{')) ||
        (text.includes('void') && text.includes('('))) {
      return text.trim();
    }

    return null;
  };

  const estimateOriginalReadability = (code) => {
    let score = 5.0;

    // Positive indicators
    if (code.includes('class')) score += 0.5;
    if (/final|const/.test(code)) score += 0.3;
    if (/\/\/|\/\*/.test(code)) score += 0.4;
    if (code.includes('@override')) score += 0.2;

    // Negative indicators
    if ((code.match(/var /g) || []).length > 1) score -= 0.5;
    if ((code.match(/null/g) || []).length > 1) score -= 0.3;
    if (code.includes('!=') && code.includes('==')) score -= 0.2;
    if (code.split('{').length > code.split('\n').length / 3) score -= 0.4;
    if (code.split('\n').some(line => line.trim().length > 80)) score -= 0.3;
    if (!/(void |String |int |double |bool )/.test(code)) score -= 0.5;

    return Math.max(1.0, Math.min(9.0, score));
  };

  const optimizeDartCode = async (code, userMessage) => {
    if (!genAI) {
      throw new Error('API key not configured. Please check your .env file.');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert Dart developer. Optimize this Dart code and provide detailed analysis.

USER REQUEST: ${userMessage || "Optimize this code"}

DART CODE:
\`\`\`dart
${code}
\`\`\`

Please optimize the code focusing on:
1. Performance improvements
2. Null safety compliance
3. Modern Dart patterns
4. Code readability
5. Best practices

IMPORTANT: You MUST respond with a valid JSON object in this exact format:
{
  "optimized_code": "// Your complete optimized Dart code here with comments",
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ],
  "performance_impact": "Detailed explanation of performance improvements made",
  "readability_score": 8.5
}

Make sure the JSON is properly formatted and contains all required fields.`;

    try {
      const apiResponse = await model.generateContent(prompt);
      const responseText = apiResponse.response.text().trim();

      // Multiple attempts to extract JSON
      let jsonData = null;
      let extractedJson = '';

      // Method 1: Look for JSON code blocks
      const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        extractedJson = jsonBlockMatch[1];
      } else {
        // Method 2: Look for any JSON-like structure
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedJson = jsonMatch[0];
        } else {
          // Method 3: Try to find JSON between specific markers
          const startMarkers = ['{', '{\n', '{ \n'];
          const endMarkers = ['}', '\n}', '\n }'];
          
          for (const startMarker of startMarkers) {
            const startIndex = responseText.indexOf(startMarker);
            if (startIndex !== -1) {
              for (const endMarker of endMarkers) {
                const endIndex = responseText.lastIndexOf(endMarker);
                if (endIndex > startIndex) {
                  extractedJson = responseText.substring(startIndex, endIndex + endMarker.length);
                  break;
                }
              }
              if (extractedJson) break;
            }
          }
        }
      }

      if (!extractedJson) {
        // Fallback: Create response from raw text
        return {
          original_code: code,
          optimized_code: responseText.includes('```') 
            ? responseText.match(/```[\s\S]*?\n([\s\S]*?)```/)?.[1] || responseText
            : responseText,
          improvements: ["Code optimization completed", "Check the optimized code for improvements"],
          performance_impact: "Analysis provided in the response text",
          readability_score: 7.0
        };
      }
      
      try {
        jsonData = JSON.parse(extractedJson);
      } catch (parseError) {
        // Try to clean the JSON
        let cleanedJson = extractedJson
          .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/\n/g, ' ')     // Replace newlines with spaces
          .replace(/\s+/g, ' ')    // Collapse multiple spaces
          .trim();
        
        try {
          jsonData = JSON.parse(cleanedJson);
        } catch (secondParseError) {
          throw new Error('Failed to parse optimization result - invalid JSON format');
        }
      }

      // Validate required fields
      const requiredFields = ['optimized_code', 'improvements', 'performance_impact', 'readability_score'];
      const missingFields = requiredFields.filter(field => !jsonData.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        // Fill in missing fields with defaults
        missingFields.forEach(field => {
          switch (field) {
            case 'optimized_code':
              jsonData.optimized_code = code;
              break;
            case 'improvements':
              jsonData.improvements = ["Code optimization completed"];
              break;
            case 'performance_impact':
              jsonData.performance_impact = "Performance analysis not provided";
              break;
            case 'readability_score':
              jsonData.readability_score = 7.0;
              break;
          }
        });
      }

      const optimizationResult = {
        original_code: code,
        optimized_code: jsonData.optimized_code || code,
        improvements: Array.isArray(jsonData.improvements) ? jsonData.improvements : ["Code optimization completed"],
        performance_impact: jsonData.performance_impact || "Performance analysis not provided",
        readability_score: typeof jsonData.readability_score === 'number' ? jsonData.readability_score : 7.0
      };
      
      return optimizationResult;

    } catch (error) {
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !apiKey) {
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage('');

    const dartCode = extractDartCode(inputMessage);

    if (dartCode) {
      setIsLoading(true);
      try {
        const result = await optimizeDartCode(dartCode, inputMessage);
        setCurrentResult(result);

        const assistantMessage = {
          role: 'assistant',
          content: '✅ **Code optimization completed!** Here\'s your enhanced Dart code with visual blocks:',
          timestamp: new Date(),
          optimizationResult: result
        };

        setChatHistory(prev => [...prev, assistantMessage]);
        
        // Switch to blocks tab automatically when optimization is complete
        setTimeout(() => setActiveTab('blocks'), 1000);

      } catch (error) {
        const errorMessage = {
          role: 'assistant',
          content: `❌ **Error:** ${error.message}

**Troubleshooting:**
• Ensure your .env file contains REACT_APP_GEMINI_API_KEY
• Check your internet connection
• Try with simpler code first
• Restart the development server after adding .env variables`,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      const helpMessage = {
        role: 'assistant',
        content: `🤔 **I don't see any Dart code in your message.**

**How to share code with me:**
• Paste your Dart/Flutter code directly
• Use code blocks: \`\`\`dart ... \`\`\`
• Say: "Optimize this code" + your code

**What I can help with:**
• 🚀 Performance optimization
• 📖 Code readability improvements  
• 🔒 Null safety compliance
• 🆕 Modern Dart/Flutter patterns

**New Feature:** 🧩 **Visual Blocks View**
• See your optimized code as connected blocks
• Drag and drop to modify structure
• Export blocks for educational use`,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, helpMessage]);
    }
  };

  const downloadCode = (code, filename = 'optimized_code.dart') => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBlocksChange = (xmlText) => {
    setBlocksXml(xmlText);
  };

  const loadExample = () => {
    const exampleCode = `class userManager {
  var users;
  var activeUsers;
  
  userManager() {
    users = [];
    activeUsers = [];
  }
  
  void addUser(name, email, age) {
    if (name != null && email != null && age != null) {
      var user = {};
      user['name'] = name;
      user['email'] = email;
      user['age'] = age;
      user['isActive'] = true;
      users.add(user);
      activeUsers.add(user);
    }
  }
  
  findUserByEmail(email) {
    for (var i = 0; i < users.length; i++) {
      if (users[i]['email'] == email) {
        return users[i];
      }
    }
    return null;
  }
}`;
    setInputMessage(exampleCode);
  };

  const clearChat = () => {
    setChatHistory([]);
    setCurrentResult(null);
    setBlocksXml('');
  };

  const ComparisonView = ({ result }) => {
    const originalReadability = estimateOriginalReadability(result.original_code);
    const originalLines = result.original_code.split('\n').length;
    const optimizedLines = result.optimized_code.split('\n').length;
    const originalChars = result.original_code.length;
    const optimizedChars = result.optimized_code.length;
    const readabilityGain = result.readability_score - originalReadability;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">🔍 Side-by-Side Comparison</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium">📝 Original Code</h4>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{result.original_code}</code>
            </pre>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">📖 Original Readability</span>
                <span className="text-lg font-bold">{originalReadability.toFixed(1)}/10</span>
              </div>
              <div className="text-xs text-gray-600">
                📏 {originalLines} lines • {originalChars} characters
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium">✨ Optimized Code</h4>
            <pre className="bg-green-50 p-4 rounded-lg overflow-x-auto text-sm border-l-4 border-green-500">
              <code>{result.optimized_code}</code>
            </pre>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">📖 New Readability</span>
                <span className="text-lg font-bold text-green-600">
                  {result.readability_score}/10
                  <span className="text-sm ml-2 text-green-500">
                    (+{readabilityGain.toFixed(1)})
                  </span>
                </span>
              </div>
              <div className="text-xs text-gray-600">
                📏 {optimizedLines} lines • {optimizedChars} characters
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              +{readabilityGain.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">📈 Readability Gain</div>
            <div className="text-xs text-gray-500">
              {((readabilityGain/originalReadability)*100).toFixed(0)}% improvement
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {optimizedLines - originalLines >= 0 ? '+' : ''}{optimizedLines - originalLines}
            </div>
            <div className="text-sm text-gray-600">📏 Line Change</div>
            <div className="text-xs text-gray-500">
              {optimizedLines > originalLines ? 'More detailed' : 
               optimizedLines < originalLines ? 'More concise' : 'Same length'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {optimizedChars - originalChars >= 0 ? '+' : ''}{optimizedChars - originalChars}
            </div>
            <div className="text-sm text-gray-600">💾 Size Change</div>
            <div className="text-xs text-gray-500">
              {((optimizedChars - originalChars)/originalChars*100).toFixed(0)}% change
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OptimizedCodeView = ({ result }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">✨ Optimized Code</h3>
        <button
          onClick={() => downloadCode(result.optimized_code)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          Download Code
        </button>
      </div>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{result.optimized_code}</code>
      </pre>
    </div>
  );

  const AnalysisView = ({ result }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">📊 Quality Metrics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">📖 Final Readability</span>
            <span className="text-2xl font-bold text-green-600">
              {result.readability_score}/10
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(result.readability_score / 10) * 100}%` }}
            ></div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">🚀 Performance Impact</h4>
            <p className="text-sm text-gray-700">{result.performance_impact}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">✅ Improvements Made</h3>
        <div className="space-y-2">
          {result.improvements.map((improvement, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{improvement}</span>
            </div>
          ))}
        </div>
        {result.improvements.length > 0 && (
          <div className="bg-green-100 p-3 rounded-lg text-center">
            <span className="text-green-800 font-medium">
              🎯 {result.improvements.length} improvements applied successfully!
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const BlocksView = ({ result }) => (
    <div className="h-full">
      <BlocklyWorkspace 
        dartCode={result.optimized_code}
        onBlocksChange={handleBlocksChange}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎯 Dart Code Optimizer</h1>
          <p className="text-gray-600">Powered by Gemini 2.0 Flash • AI-Driven Code Enhancement with Visual Blocks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">⚙️ Configuration</h3>
              
              {!apiKey ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-800 text-sm font-medium mb-2">🔑 API Key Missing</p>
                  <p className="text-red-600 text-xs mb-3">
                    Please add your Gemini API key to your .env file:
                  </p>
                  <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
                    REACT_APP_GEMINI_API_KEY=your_api_key_here
                  </div>
                  <p className="text-red-600 text-xs mt-2">
                    Get your free API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                       className="underline">Google AI Studio</a>
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">🟢 API Key Loaded!</p>
                  <p className="text-green-600 text-xs">From .env file: ...{apiKey.slice(-8)}</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">🎛️ Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={clearChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Clear Chat
                </button>
                <button
                  onClick={loadExample}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText size={16} />
                  Load Bad Code Example
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">🧩 Features</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Visual block representation</div>
                <div>• Drag & drop code building</div>
                <div>• Connected block structures</div>
                <div>• Performance optimization</div>
                <div>• Null safety compliance</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">📊 Free Tier Limits</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• 15 requests/min</div>
                <div>• 1M tokens/min</div>
                <div>• 1,500 requests/day</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chat History */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">💬 Chat with the Optimizer</h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs mt-2 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="animate-spin" size={16} />
                        🔧 Optimizing your Dart code and generating blocks...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex gap-4">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter your message or paste Dart code..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !apiKey || isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Ctrl+Enter to send</p>
            </div>

            {/* Optimization Results */}
            {currentResult && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('comparison')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'comparison'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <BarChart3 size={16} className="inline mr-2" />
                      Before vs After
                    </button>
                    <button
                      onClick={() => setActiveTab('optimized')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'optimized'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Code size={16} className="inline mr-2" />
                      Optimized Code
                    </button>
                    <button
                      onClick={() => setActiveTab('analysis')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'analysis'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FileText size={16} className="inline mr-2" />
                      Analysis
                    </button>
                    <button
                      onClick={() => setActiveTab('blocks')}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'blocks'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Blocks size={16} className="inline mr-2" />
                      🧩 Visual Blocks
                    </button>
                  </div>
                </div>
                <div className="p-6" style={{ minHeight: activeTab === 'blocks' ? '600px' : 'auto' }}>
                  {activeTab === 'comparison' && <ComparisonView result={currentResult} />}
                  {activeTab === 'optimized' && <OptimizedCodeView result={currentResult} />}
                  {activeTab === 'analysis' && <AnalysisView result={currentResult} />}
                  {activeTab === 'blocks' && <BlocksView result={currentResult} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DartCodeOptimizer;