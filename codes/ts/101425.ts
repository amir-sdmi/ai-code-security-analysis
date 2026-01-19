import { useState, useCallback } from 'react';
import { AIAnalysis } from '../types';
import { chatGPTService } from '../services/chatgpt';
import { roboflowService } from '../services/roboflow';
import { mouseTrackingService } from '../services/mouseTracking';

export const useEnhancedAnalysis = () => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [uiElements, setUiElements] = useState<any[]>([]);

  const analyzeScreen = useCallback(async (imageData: string, query?: string): Promise<AIAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting enhanced screen analysis with ChatGPT 4o-mini...');
      
      // Start all analysis tasks in parallel for better performance
      const analysisPromises = [
        // Enhanced OCR with ChatGPT
        chatGPTService.extractOCRText(imageData).catch(err => {
          console.warn('ChatGPT OCR extraction failed:', err);
          return '';
        }),

        // UI Detection with Roboflow
        roboflowService.detectUIElements(imageData).catch(err => {
          console.warn('UI detection failed:', err);
          return [];
        })
      ];

      const [extractedText, detectedElements] = await Promise.all(analysisPromises);

      console.log('ChatGPT OCR - text length:', extractedText.length);
      console.log('UI elements detected:', detectedElements.length);

      // Get mouse tracking data for context
      const mouseData = mouseTrackingService.getAnalyticsData();

      // Store results
      setOcrText(extractedText);
      setUiElements(detectedElements);

      // Get enhanced AI analysis with ChatGPT 4o-mini
      const aiResponse = await chatGPTService.analyzeScreenWithVision(
        imageData, 
        query, 
        extractedText, 
        detectedElements
      );

      // Create comprehensive analysis object
      const result: AIAnalysis = {
        elements: detectedElements.map((element, index) => ({
          id: `element-${index}`,
          type: element.class as any,
          text: element.class,
          coordinates: {
            x: element.x - (element.width || 0) / 2,
            y: element.y - (element.height || 0) / 2,
            width: element.width || 0,
            height: element.height || 0
          },
          confidence: element.confidence
        })),
        currentTask: query || 'Analyzing screen content with ChatGPT 4o-mini enhanced analysis...',
        suggestions: [aiResponse],
        nextAction: {
          type: 'wait',
          description: 'Follow the detailed ChatGPT 4o-mini powered guidance above, then capture another frame for continued assistance.'
        },
        ocrText: extractedText,
        mouseContext: mouseData
      };

      setAnalysis(result);
      console.log('Enhanced analysis with ChatGPT 4o-mini completed successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze screen with ChatGPT enhanced features';
      setError(errorMessage);
      console.error('Enhanced screen analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startMouseTracking = useCallback(() => {
    try {
      mouseTrackingService.startTracking();
      console.log('Mouse tracking started');
    } catch (error) {
      console.warn('Failed to start mouse tracking:', error);
    }
  }, []);

  const stopMouseTracking = useCallback(() => {
    try {
      mouseTrackingService.stopTracking();
      console.log('Mouse tracking stopped');
    } catch (error) {
      console.warn('Failed to stop mouse tracking:', error);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    ocrText,
    uiElements,
    analyzeScreen,
    setAnalysis,
    clearError,
    startMouseTracking,
    stopMouseTracking
  };
};