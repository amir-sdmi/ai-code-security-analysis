import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { parseTaskWithGemini, generateAIResponse, generateSuggestion } from '../services/geminiAI';
import { scheduleTaskReminder, getNotificationSettings } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

const AIChatScreen = () => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const getDateFromText = (dateText) => {
    if (!dateText) return new Date().toISOString().split('T')[0];
    
    const today = new Date();
    const lowerDate = dateText.toLowerCase();
    
    if (lowerDate === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    if (lowerDate === 'today') {
      return today.toISOString().split('T')[0];
    }
    
    // For days of the week, find the next occurrence
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(lowerDate);
    
    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const todayDay = today.getDay();
      const daysUntilTarget = (dayIndex - todayDay + 7) % 7 || 7;
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return targetDate.toISOString().split('T')[0];
    }
    
    return today.toISOString().split('T')[0];
  };

  const addTaskFromAI = async (parsedTask) => {
    try {
      const taskDate = getDateFromText(parsedTask.date);
      
      const docRef = await addDoc(collection(db, 'tasks'), {
        title: parsedTask.title,
        isComplete: false,
        date: taskDate,
        time: parsedTask.time,
        priority: parsedTask.priority || 'Medium',
        category: parsedTask.category || 'Personal',
        userId: user.uid,
        createdAt: new Date(),
        createdBy: 'AI',
      });

      // Schedule notification if time is specified and notifications are enabled
      const notificationSettings = await getNotificationSettings();
      if (parsedTask.time && notificationSettings.taskReminders) {
        const taskWithId = {
          id: docRef.id,
          title: parsedTask.title,
          time: parsedTask.time,
          date: parsedTask.date,
        };
        await scheduleTaskReminder(taskWithId);
      }

      return { success: true, task: parsedTask };
    } catch (error) {
      console.error('Error adding task:', error);
      return { success: false, error };
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userInput = inputText.trim();
    const userMessage = {
      id: Date.now(),
      text: userInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Use Gemini AI to parse the task
      const parsedTask = await parseTaskWithGemini(userInput);
      
      if (parsedTask.title && parsedTask.title.length > 2) {
        // Try to add the task
        const result = await addTaskFromAI(parsedTask);
        
        if (result.success) {
          // Generate AI response using Gemini
          const aiResponseText = await generateAIResponse(result.task);
          
          const aiResponse = {
            id: Date.now() + 1,
            text: aiResponseText,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiResponse]);
        } else {
          const errorResponse = {
            id: Date.now() + 1,
            text: "Sorry, I couldn't add that task right now. Please try again in a moment.",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorResponse]);
        }
      } else {
        // Generate suggestion using Gemini
        const suggestionText = await generateSuggestion(userInput);
        
        const clarificationResponse = {
          id: Date.now() + 1,
          text: suggestionText,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, clarificationResponse]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorResponse = {
        id: Date.now() + 1,
        text: "I'm having trouble understanding that right now. Try something like 'Remind me to call Mom at 8pm' or 'Add workout to tomorrow'.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    }
    
    setIsTyping(false);
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={[
        styles.messageText,
        message.isUser ? styles.userMessageText : styles.aiMessageText,
      ]}>
        {message.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.brainIcon}>
            <Text style={styles.brainText}>🧠</Text>
          </View>
          <Text style={styles.logo}>tasQ.ai</Text>
        </View>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Hi! I'm your AI task assistant. Tell me what you need to do and I'll help you organize it.
            </Text>
            <Text style={styles.exampleText}>
              Try: "Remind me to call Mom at 8pm tomorrow"
            </Text>
          </View>
        )}
        
        {messages.map(renderMessage)}
        
        {isTyping && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="type to manage tasks..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brainIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brainText: {
    fontSize: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  welcomeContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 16,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#000',
  },
  aiMessageText: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  textInput: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 25,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#fff',
    marginRight: 12,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIChatScreen; 