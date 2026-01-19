/**
 * Create Screen - New Dream Entry
 * 
 * This screen allows users to create new dream entries with AI-assisted
 * mood analysis. Features include:
 * 
 * - Text input for dream content with real-time validation
 * - Speech-to-text functionality for hands-free input
 * - AI-powered mood analysis using Gemini API
 * - Swipe navigation between tabs
 * - Smooth animations and transitions
 * - Auto-save with timestamp and metadata
 * 
 * @author Cole Puls
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Alert, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PenTool, Save, Undo } from 'lucide-react-native';
import Animated, { 
  FadeIn,
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import SaveDreamModal from '../components/SaveDreamModal';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import SpeechToText from '../components/SpeechToText';
import { generateMoodTag, rewriteDream } from '../apis/GeminiAPI';
import Header from '../components/Header';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Create Screen Component
 * 
 * Main screen for creating new dream entries with AI assistance.
 * Handles text input, speech recognition, mood analysis, and dream storage.
 * 
 * @param {Object} navigation - React Navigation object for screen transitions
 * @returns {JSX.Element} Create screen with input forms and controls
 */
export default function Create({ navigation }) {
  // Core state for dream creation
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedMood, setSavedMood] = useState('');
  const [generatedMood, setGeneratedMood] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [hasBeenImproved, setHasBeenImproved] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '', onRetry: null });

  // Swipe navigation configuration
  const screenWidth = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = screenWidth * 0.3; // 30% of screen width triggers navigation
  
  // Animation shared values for smooth transitions
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Staggered animation values for progressive UI reveal
  const inputOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  /**
   * Gesture handler for swipe navigation between tabs
   * Detects horizontal swipes and navigates to adjacent screens
   * with smooth spring animations and velocity-based triggers
   */
  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      const { translationX, velocityX } = event;
      
      if (translationX > SWIPE_THRESHOLD || velocityX > 500) {
        // Swipe right - navigate to Home/Journal tab
        translateX.value = withSpring(screenWidth, { damping: 20, stiffness: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(navigation.navigate)('Home');
      } else if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
        // Swipe left - navigate to Stats tab
        translateX.value = withSpring(-screenWidth, { damping: 20, stiffness: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(navigation.navigate)('Stats');
      } else {
        // Reset to original position if swipe doesn't meet threshold
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        opacity.value = withTiming(1, { duration: 200 });
      }
    },
    onFail: () => {
      // Reset values if gesture fails or is interrupted
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    },
  });

  /**
   * Animated style for the main container with transform and opacity
   */
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value }
      ],
      opacity: opacity.value,
    };
  });

  // Individual animated styles for staggered UI elements
  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  /**
   * Reset and trigger animations when screen comes into focus
   * Creates a staggered animation sequence for smooth UI reveal
   * Only shows save button if there's already text content
   */
  useFocusEffect(
    useCallback(() => {
      // Reset main animation values
      translateX.value = 0;
      opacity.value = 1;

      // Reset staggered animation values
      inputOpacity.value = 0;
      buttonOpacity.value = 0;

      // Trigger staggered animations with cascading timing
      inputOpacity.value = withTiming(1, { duration: 600 }, () => {
        // Only show button if there's already text
        if (body.trim()) {
          buttonOpacity.value = withTiming(1, { duration: 600 });
        }
      });
    }, []) // Remove body dependency to prevent re-triggering on every keystroke
  );

  /**
   * Handle button visibility when text content changes
   * Shows/hides save button based on whether there's content to save
   * Also resets improvement state when text is manually changed
   */
  useEffect(() => {
    if (body.trim()) {
      buttonOpacity.value = withTiming(1, { duration: 300 });
    } else {
      buttonOpacity.value = withTiming(0, { duration: 300 });
    }
    
    // Reset improvement state if user manually changes text after improvement
    // Only reset if the current text is different from the last improved version
    // and also different from the original text (to avoid resetting during revert)
    if (hasBeenImproved && body !== rewrittenText && body !== originalText) {
      setHasBeenImproved(false);
      setOriginalText('');
      setRewrittenText('');
    }
    // If user reverts and then makes changes, we should reset the improvement state
    else if (hasBeenImproved && body === originalText && rewrittenText === '') {
      // User has reverted and is now making changes to the original text
      // Keep the improvement state but update rewrittenText to track changes
      setRewrittenText(body);
    }
  }, [body]);

  /**
   * Sort dreams by timestamp in descending order (newest first)
   * Handles cases where timestamp might be missing
   * 
   * @param {Array} dreamsArray - Array of dream objects to sort
   * @returns {Array} Sorted array of dreams
   */
  const sortDreamsByTimestamp = (dreamsArray) => {
    return dreamsArray.sort((a, b) => {
      const timestampA = new Date(a.timestamp || 0);
      const timestampB = new Date(b.timestamp || 0);
      return timestampB - timestampA;
    });
  };

  /**
   * Handle dream submission with AI mood analysis
   * Generates mood tag using Gemini API before showing save modal
   */
  const handleSubmit = async () => {
    if (!body.trim()) return;
    
    // Generate mood before showing modal
    let mood = 'Neutral'; // Default to Neutral
    try {
      console.log('Generating mood for dream:', body.substring(0, 100) + '...');
      mood = await generateMoodTag(body);
      console.log('Generated mood:', mood);
    } catch (err) {
      console.error('Failed to get mood from AI:', err);
      // Keep the default 'Neutral' mood
    }
    
    setGeneratedMood(mood);
    setShowModal(true);
  };

  /**
   * Handle AI rewrite of dream content
   * Uses AI to improve grammar and writing quality while preserving all details
   */
  const handleRewrite = async () => {
    if (!body.trim()) return;
    
    setIsRewriting(true);
    try {
      console.log('Rewriting dream with AI...');
      // Store the original text only on the first improvement
      if (!hasBeenImproved) {
        setOriginalText(body);
      }
      const improvedText = await rewriteDream(body);
      
      setRewrittenText(improvedText);
      setBody(improvedText);
      setHasBeenImproved(true);
      console.log('Dream rewritten successfully');
    } catch (err) {
      console.error('Failed to rewrite dream:', err);
      setErrorModalData({
        title: 'Improvement Failed',
        message: err.message || 'Failed to improve writing. Please try again.',
        onRetry: handleRewrite
      });
      setShowErrorModal(true);
    } finally {
      setIsRewriting(false);
    }
  };

  /**
   * Handle reverting AI improvements back to original text
   * Restores the original user input and hides the revert button
   */
  const handleRevert = () => {
    setBody(originalText);
    // Reset improvement state to hide the revert button
    setHasBeenImproved(false);
    setOriginalText('');
    setRewrittenText('');
  };

  /**
   * Save dream to AsyncStorage with metadata
   * Creates new dream object with timestamp and AI-generated mood
   * Maintains sorted order in storage
   */
  const saveDream = async () => {
    if (!title.trim()) return;

    const newDream = {
      id: Date.now(),
      title: title.trim(),
      text: body,
      mood: generatedMood,
      timestamp: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(await AsyncStorage.getItem('dreams')) || [];
      existing.push(newDream);
      // Sort dreams by timestamp in descending order (newest first)
      const sortedDreams = sortDreamsByTimestamp(existing);
      await AsyncStorage.setItem('dreams', JSON.stringify(sortedDreams));
      setBody('');
      setTitle('');
      setShowModal(false);
      setGeneratedMood('');
      setHasBeenImproved(false);
      setOriginalText('');
      setRewrittenText('');
      
      // Show success modal instead of alert
      setSavedMood(generatedMood);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error saving dream:', err);
      Alert.alert('Error', 'Failed to save dream.');
    }
  };

  /**
   * Process speech-to-text input and append to existing content
   * Handles proper spacing and punctuation between speech segments
   * 
   * @param {string} text - Speech recognition result text
   */
  const handleSpeechText = (text) => {
    // Append the speech text to the existing text with proper spacing
    setBody(prevBody => {
      const trimmedPrev = prevBody.trim();
      const trimmedNew = text.trim();
      
      if (!trimmedPrev) {
        return trimmedNew;
      }
      
      // Add proper spacing and punctuation
      const lastChar = trimmedPrev.slice(-1);
      const needsSpace = lastChar !== ' ' && lastChar !== '.' && lastChar !== '!' && lastChar !== '?';
      const needsPeriod = !lastChar.match(/[.!?]/);
      
      let separator = needsSpace ? ' ' : '';
      if (needsPeriod && !trimmedNew.startsWith('and') && !trimmedNew.startsWith('but') && !trimmedNew.startsWith('or')) {
        separator += '. ';
      }
      
      return trimmedPrev + separator + trimmedNew;
    });
  };

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetX={[-6, 6]}
      failOffsetY={[-25, 25]}
      simultaneousHandlers
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        <Animated.View entering={FadeIn.duration(400).delay(100)} style={{ flex: 1 }}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <Header 
                icon={PenTool}
                title="Record Your Dream"
              />

              {/* Dream Input */}
              <Animated.View style={[styles.inputContainer, inputStyle]}>
                <View style={styles.inputHeader}>
                  <Text style={styles.inputLabel}>Describe your dream</Text>
                </View>
                <TextInput
                  placeholder="Write down every detail you remember from your dream..."
                  placeholderTextColor="#6B7280"
                  value={body}
                  onChangeText={setBody}
                  multiline
                  style={styles.input}
                  textAlignVertical="top"
                  keyboardAppearance="dark"
                />
                <Text style={styles.characterCount}>
                  {body.length} characters
                </Text>
                
                {/* Speech to Text Component */}
                <SpeechToText />
              </Animated.View>

              {/* Action Buttons */}
              {body.trim() && (
                <Animated.View style={[styles.buttonContainer, buttonStyle]}>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                  >
                    <Save size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Dream</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.rewriteButton, (isRewriting || hasBeenImproved) && styles.rewriteButtonDisabled]}
                    onPress={handleRewrite}
                    activeOpacity={0.8}
                    disabled={isRewriting || hasBeenImproved}
                  >
                    <Text style={styles.rewriteButtonText}>
                      {isRewriting ? 'Improving...' : hasBeenImproved ? 'Already Improved' : 'Improve Writing'}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Revert Changes Button - only show when text has been improved */}
                  {hasBeenImproved && (
                    <TouchableOpacity 
                      style={styles.revertButton}
                      onPress={handleRevert}
                      activeOpacity={0.8}
                    >
                      <Undo size={20} color="#FFFFFF" />
                      <Text style={styles.revertButtonText}>Revert Changes</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>

        <SaveDreamModal
          visible={showModal}
          titleValue={title}
          onTitleChange={setTitle}
          onSave={saveDream}
          onCancel={() => {
            setShowModal(false);
            setGeneratedMood('');
          }}
          mood={generatedMood}
        />

        <SuccessModal
          visible={showSuccessModal}
          mood={savedMood}
          onClose={() => setShowSuccessModal(false)}
        />

        <ErrorModal 
          visible={showErrorModal}
          title={errorModalData.title}
          message={errorModalData.message}
          onRetry={errorModalData.onRetry}
          onClose={() => setShowErrorModal(false)}
        />
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  inputContainer: {
    margin: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputHeader: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  buttonContainer: {
    marginHorizontal: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rewriteButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rewriteButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.6,
  },
  rewriteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  revertButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  revertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
