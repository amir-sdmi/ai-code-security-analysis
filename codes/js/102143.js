import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { processWithPhi, processWithChatGPT } from '../../services/AIService';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const LilyAvatar = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm Lily, your learning companion. How can I help you today?", isUser: false }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [avatarPersona, setAvatarPersona] = useState('default');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);

  // Animation for the avatar when speaking
  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSpeaking, pulseAnim]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { id: messages.length + 1, text: input, isUser: true };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Determine which AI model to use based on query complexity
      let response;
      
      if (isComplexQuery(input)) {
        // Use ChatGPT for complex or educational queries
        response = await processWithChatGPT(input);
        
        // Check if we should change avatar persona based on topic
        const newPersona = determinePersona(input);
        if (newPersona !== avatarPersona) {
          setAvatarPersona(newPersona);
        }
      } else {
        // Use Phi for simple, quick responses
        response = await processWithPhi(input);
      }
      
      const aiMessage = { id: messages.length + 2, text: response, isUser: false };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Speak the response
      speakResponse(response);
      
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = { 
        id: messages.length + 2, 
        text: "I'm sorry, I couldn't process your request. Please try again.", 
        isUser: false 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakResponse = (text) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const isComplexQuery = (query) => {
    // Logic to determine if query is complex enough for ChatGPT
    const complexKeywords = [
      'explain', 'how', 'why', 'define', 'compare', 
      'difference', 'analyze', 'solve', 'calculate'
    ];
    
    return complexKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)) || query.length > 50;
  };

  const determinePersona = (query) => {
    // Change avatar persona based on subject matter
    if (query.match(/math|equation|algebra|geometry|calculus/i)) return 'math';
    if (query.match(/history|century|civilization|war|ancient/i)) return 'history';
    if (query.match(/science|physics|chemistry|biology|experiment/i)) return 'science';
    if (query.match(/literature|book|novel|poem|author|shakespeare/i)) return 'literature';
    return 'default';
  };
  
  // Function to get avatar style based on persona
  const getAvatarStyle = () => {
    switch(avatarPersona) {
      case 'math':
        return { backgroundColor: '#4CAF50' }; // Green for math
      case 'history':
        return { backgroundColor: '#FF9800' }; // Orange for history
      case 'science':
        return { backgroundColor: '#2196F3' }; // Blue for science
      case 'literature':
        return { backgroundColor: '#9C27B0' }; // Purple for literature
      default:
        return { backgroundColor: '#6200EE' }; // Default purple
    }
  };
  
  // Function to get avatar icon based on persona
  const getAvatarIcon = () => {
    switch(avatarPersona) {
      case 'math':
        return 'calculator';
      case 'history':
        return 'time';
      case 'science':
        return 'flask';
      case 'literature':
        return 'book';
      default:
        return 'school';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lily</Text>
        {isSpeaking ? (
          <TouchableOpacity onPress={stopSpeaking} style={styles.speakButton}>
            <Ionicons name="volume-mute" size={24} color="#6200EE" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      
      <View style={styles.avatarContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {/* Replace Image with Ionicons-based avatar */}
          <View style={[styles.avatarCircle, getAvatarStyle()]}>
            <Ionicons name={getAvatarIcon()} size={60} color="#fff" />
          </View>
        </Animated.View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={item.isUser ? styles.userMessage : styles.botMessage}>
            <Text style={item.isUser ? styles.userMessageText : styles.botMessageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Lily is typing</Text>
          <ActivityIndicator size="small" color="#6200EE" />
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Lily anything..."
          multiline
        />
        <TouchableOpacity 
          onPress={handleSend} 
          style={styles.sendButton}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  speakButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6200EE',
    padding: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    marginVertical: 8,
    maxWidth: '80%',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginVertical: 8,
    maxWidth: '80%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessageText: {
    fontSize: 16,
    color: '#fff',
  },
  botMessageText: {
    fontSize: 16,
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 80,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 16,
  },
  typingText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 20,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#6200EE',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default LilyAvatar;
