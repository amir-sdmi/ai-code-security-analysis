"use client"

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, ChartBarIcon, GiftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { ClockIcon, CogIcon, CheckIcon, XMarkIcon, TrophyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'framer-motion';


export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [captureMethod, setCaptureMethod] = useState('camera'); // 'camera' or 'upload'
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMotivationalPopup, setShowMotivationalPopup] = useState(false);
  
  // No API Key since this is published in Github
  const genAI = new GoogleGenerativeAI("");

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setCaptureMethod('camera');
    setErrorMessage('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        setCaptureMethod('upload');
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage('Please select a valid image file.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setReceiptItems([]);
    setShowResults(false);
    setErrorMessage('');
    setShowDatePicker(false);
  };

  const confirmPhoto = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      await processReceiptWithGemini(capturedImage);
    } catch (error) {
      console.error("Error processing receipt:", error);
      setErrorMessage('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowResults(true);
    }
  };

  const processReceiptWithGemini = async (imageBase64) => {
    try {
      // Strip the data URL prefix to get just the base64 data
      const base64Data = imageBase64.split(',')[1];
      
      // Initialize the Gemini 1.5 Flash model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Prepare the image data
      const imageData = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
      
      // Updated prompt for Philippine Peso and item code inference
      const prompt = `
        Extract the receipt information from this image.
        
        I need you to:
        1. Identify individual items purchased
        2. Extract the price for each item in Philippine Pesos (₱)
        3. Categorize each item (e.g., Groceries, Electronics, Restaurant)
        4. If an item is represented by a code or abbreviation, infer what the actual product is
        
        For example, if you see "ITM123" or any abbreviated code, try to determine what product it actually represents based on context, price, and category.
        
        Return ONLY a valid JSON object with this structure:
        {
          "items": [
            {
              "name": "Actual product name (not code)",
              "price": 10.99,
              "category": "Category name"
            },
            ...more items
          ]
        }
        
        Prices should be in Philippine Pesos, but don't include the ₱ symbol in the price value (just the number).
        Do not include any explanation or text outside of the JSON structure.
        The response must be parseable as JSON.
      `;
      
      // Generate content from the image
      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      console.log("Raw response from Gemini:", text);
      
      // Extract JSON using regex to handle various response formats
      let jsonData;
      try {
        // First try: Look for code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonData = JSON.parse(jsonMatch[1].trim());
        }
        // Second try: Look for raw JSON objects
        else if (text.includes('{') && text.includes('}')) {
          const jsonStr = text.substring(
            text.indexOf('{'),
            text.lastIndexOf('}') + 1
          );
          jsonData = JSON.parse(jsonStr);
        }
        // Third try: Try the entire text as JSON
        else {
          jsonData = JSON.parse(text.trim());
        }
        
        console.log("Successfully parsed JSON:", jsonData);
        
        if (jsonData && jsonData.items && Array.isArray(jsonData.items)) {
          setReceiptItems(jsonData.items);
        } else {
          // If JSON doesn't have the expected structure
          throw new Error("Unexpected JSON structure");
        }
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini:", parseError);
        
        // As a fallback, try to extract data using a very simple approach
        // This is useful when the model doesn't return proper JSON
        const itemRegex = /[\w\s]+\s+\$?\d+\.\d+/g;
        const items = text.match(itemRegex);
        
        if (items && items.length > 0) {
          const extractedItems = items.map(item => {
            const parts = item.trim().split(/\s+(?=\$?\d+\.\d+$)/);
            const name = parts[0].trim();
            const priceStr = parts[1].replace('$', '').trim();
            const price = parseFloat(priceStr);
            
            return {
              name,
              price,
              category: "Uncategorized"
            };
          });
          
          setReceiptItems(extractedItems);
        } else {
          throw new Error("Failed to extract receipt data");
        }
      }
    } catch (error) {
      console.error("Error with Gemini API:", error);
      throw error;
    }
  };

  const addToExpenses = () => {
    // Create expense object with items and date
    const expense = {
      date: expenseDate,
      items: receiptItems,
      total: receiptItems.reduce((sum, item) => sum + item.price, 0),
      timestamp: new Date().toISOString()
    };
    
    // Get existing expenses from localStorage or initialize empty array
    const existingExpenses = JSON.parse(localStorage.getItem('kachingko-expenses') || '[]');
    
    // Add new expense to array
    const updatedExpenses = [...existingExpenses, expense];
    
    // Save back to localStorage
    localStorage.setItem('kachingko-expenses', JSON.stringify(updatedExpenses));
    
    // Show motivational popup instead of alert
    setShowDatePicker(false);
    setShowMotivationalPopup(true);
  };

  // Close popup and navigate to budget page
  const closePopup = () => {
    setShowMotivationalPopup(false);
    router.push('/smart-budget');
  };

  // Handle tab navigation
  const handleTabChange = (path) => {
    router.push(path);
  };

  // Helper function to determine active tab based on current pathname
  const isActiveTab = (path) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-screen pb-16">
      {/* Top header with logo and icons */}
      <header className="bg-white py-3 px-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center">
          <img 
            src="/images/kachingko_logo.png" 
            alt="KachingKo Logo" 
            className="h-12 w-auto mr-2" 
          />
          <div>
            <h1 className="text-xl font-bold text-blue-500">KachingKo</h1>
            <p className="text-xs text-gray-500">by NeoSolve 2025</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/history" className="p-2">
            <ClockIcon className="w-6 h-6 text-gray-600" />
          </Link>
          <Link href="/settings" className="p-2">
            <CogIcon className="w-6 h-6 text-gray-600" />
          </Link>
        </div>
      </header>
      
      {/* Main content area - only render the scanner UI when on the home page */}
      {pathname === '/' && (
        <main className="flex-grow flex flex-col">
          {!capturedImage ? (
            <div className="relative flex-grow flex flex-col items-center justify-center bg-black">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "environment" // Use the back camera if available
                }}
                className="w-full h-full object-cover"
              />
              
              {/* Google Lens-like scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] h-[70%] border-2 border-white border-opacity-70 rounded-lg flex flex-col">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
                  
                  {/* Scanning animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 animate-scan-vertical"></div>
                </div>
              </div>
              
              {/* Rest of your camera UI */}
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Capture and upload buttons */}
              <div className="absolute bottom-6 flex space-x-4 items-center">
                <button 
                  onClick={triggerFileInput}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <ArrowUpTrayIcon className="w-6 h-6 text-blue-500" />
                </button>
                <button 
                  onClick={capture}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <CameraIcon className="w-8 h-8 text-blue-500" />
                </button>
              </div>
              
              {/* Helper text */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-white bg-black bg-opacity-50 inline-block px-4 py-2 rounded-lg">
                  Position receipt in frame and tap the camera button
                </p>
              </div>
            </div>
          ) : showResults ? (
            <div className="flex-grow p-4 overflow-auto">
              <h2 className="text-xl font-bold mb-4">Receipt Items</h2>
              
              {errorMessage && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                  <p>{errorMessage}</p>
                </div>
              )}
              
              {receiptItems.length > 0 ? (
                <div className="space-y-3">
                  {receiptItems.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg shadow flex justify-between items-center text-black">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-black-500">{item.category}</p>
                      </div>
                      <p className="font-semibold">₱{item.price.toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t mt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₱{receiptItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Date picker and Add to expense button */}
                  <div className="mt-4">
                    {showDatePicker ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expense Date
                        </label>
                        <input 
                          type="date" 
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                        
                        <button 
                          onClick={addToExpenses}
                          className="mt-2 w-full bg-green-500 text-white py-2 rounded-lg"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowDatePicker(true)}
                        className="w-full bg-green-500 text-white py-2 rounded-lg"
                      >
                        Add to Expense
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={retakePhoto}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg"
                  >
                    Scan Another Receipt
                  </button>
                </div>
              ) : (
                <div className="text-center p-6">
                  <p>No items detected. Try scanning again.</p>
                  <button 
                    onClick={retakePhoto}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    Scan Again
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex-grow">
              {/* Display captured image */}
              <img 
                src={capturedImage} 
                alt="Captured receipt" 
                className="w-full h-full object-contain bg-black"
              />
              
              {/* Confirmation overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4">
                <div className="flex justify-center space-x-8">
                  <button 
                    onClick={retakePhoto}
                    className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                    disabled={isProcessing}
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </button>
                  <button 
                    onClick={confirmPhoto}
                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckIcon className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                <p className="text-white text-center mt-2">
                  {isProcessing ? "Processing receipt..." : "Use this photo?"}
                </p>
              </div>
            </div>
          )}
        </main>
      )}
      
      {/* Motivational Popup */}
      <AnimatePresence>
        {showMotivationalPopup && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div 
              className="bg-white rounded-xl p-6 max-w-sm text-center shadow-xl"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20, 
                  delay: 0.2 
                }}
                className="flex justify-center mb-6"
              >
                <TrophyIcon className="w-20 h-20 text-yellow-500" />
              </motion.div>
              
              <motion.h2 
                className="text-xl font-bold text-black mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Great job tracking your expense!
              </motion.h2>
              
              <motion.p 
                className="text-gray-700 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                You are likely to crush your financial goals if you consistently track your expenses.
              </motion.p>
              
              <motion.button
                className="bg-blue-500 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closePopup}
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}