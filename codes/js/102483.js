// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   ActivityIndicator,
//   Image,
//   SafeAreaView
// } from 'react-native';
// import axios from 'axios';
// import { Ionicons } from '@expo/vector-icons';
// import { General } from '../constants';

// const AiChatBot = () => {
//   const [messages, setMessages] = useState([
//     {
//       id: 'welcome',
//       text: 'Hello! I\'m your waste management assistant. I can help with app features, recycling tips, or answer questions about our waste collection services.',
//       sender: 'bot',
//       timestamp: new Date(),
//     },
//     {
//       id: 'suggestion',
//       text: 'Try asking about pickup schedules, how to sort waste, or how to book a collection.',
//       sender: 'bot',
//       timestamp: new Date(),
//     }
//   ]);
//   const [inputText, setInputText] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const scrollViewRef = useRef();

//   // Suggested questions for the user
//   const suggestedQueries = [
//     "How do I book a pickup?",
//     "What items can I recycle?",
//     "How to earn rewards?",
//     "Environmental tips"
//   ];

//   const handleSend = async () => {
//     if (inputText.trim() === '') return;
    
//     const userMessage = {
//       id: Date.now().toString(),
//       text: inputText,
//       sender: 'user',
//       timestamp: new Date()
//     };
    
//     setMessages(prevMessages => [...prevMessages, userMessage]);
//     setInputText('');
//     setIsLoading(true);
    
//     try {
//       const response = await axios.post(`${General.API_BASE_URL}api/ai/chat`, {
//         message: inputText
//       });
      
//       const botMessage = {
//         id: (Date.now() + 1).toString(),
//         text: response.data.response,
//         sender: 'bot',
//         timestamp: new Date()
//       };
      
//       setMessages(prevMessages => [...prevMessages, botMessage]);
//     } catch (error) {
//       console.error('Error getting chatbot response:', error);
      
//       const errorMessage = {
//         id: (Date.now() + 1).toString(),
//         text: "Sorry, I'm having trouble connecting right now. Please try again later.",
//         sender: 'bot',
//         timestamp: new Date()
//       };
      
//       setMessages(prevMessages => [...prevMessages, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSuggestedQuery = (query) => {
//     setInputText(query);
//   };

//   // Format timestamp to readable time
//   const formatTime = (timestamp) => {
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   useEffect(() => {
//     // Scroll to bottom whenever messages change
//     if (scrollViewRef.current) {
//       setTimeout(() => {
//         scrollViewRef.current.scrollToEnd({ animated: true });
//       }, 100);
//     }
//   }, [messages]);

//   // Render individual message
//   const renderMessage = (message) => {
//     const isBot = message.sender === 'bot';
    
//     return (
//       <View 
//         key={message.id} 
//         style={[
//           styles.messageBubble,
//           isBot ? styles.botBubble : styles.userBubble
//         ]}
//       >
//         {isBot && (
//           <View style={styles.botAvatarContainer}>
//             <View style={styles.botAvatar}>
//               <Text style={styles.botAvatarText}>🌿</Text>
//             </View>
//           </View>
//         )}
//         <View style={[
//           styles.messageContent,
//           isBot ? styles.botContent : styles.userContent
//         ]}>
//           <Text style={[
//             styles.messageText,
//             isBot ? styles.botText : styles.userText
//           ]}>
//             {message.text}
//           </Text>
//           <Text style={styles.timestamp}>
//             {formatTime(message.timestamp)}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.container}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
//       >
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Eco Assistant</Text>
//           <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
//         </View>
        
//         <ScrollView 
//           ref={scrollViewRef}
//           style={styles.messagesContainer}
//           contentContainerStyle={styles.messagesContent}
//         >
//           {messages.map(renderMessage)}
          
//           {isLoading && (
//             <View style={styles.loadingContainer}>
//               <View style={styles.loadingBubble}>
//                 <ActivityIndicator size="small" color="#5d6839" />
//                 <Text style={styles.loadingText}>Thinking...</Text>
//               </View>
//             </View>
//           )}
//         </ScrollView>
        
//         <View style={styles.suggestedQueriesContainer}>
//           <ScrollView 
//             horizontal 
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.suggestedQueriesContent}
//           >
//             {suggestedQueries.map((query, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={styles.suggestedQuery}
//                 onPress={() => handleSuggestedQuery(query)}
//               >
//                 <Text style={styles.suggestedQueryText}>{query}</Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
        
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Ask me anything..."
//             placeholderTextColor="#A8A8A8"
//             multiline
//           />
//           <TouchableOpacity 
//             style={[
//               styles.sendButton,
//               !inputText.trim() && styles.sendButtonDisabled
//             ]}
//             onPress={handleSend}
//             disabled={!inputText.trim() || isLoading}
//           >
//             <Ionicons 
//               name="send" 
//               size={24} 
//               color={!inputText.trim() ? "#CCC" : "#fff"} 
//             />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#f2f3ee',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#f2f3ee',
//   },
//   header: {
//     backgroundColor: '#606c3b',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//   },
//   headerSubtitle: {
//     fontSize: 12,
//     color: 'rgba(255, 255, 255, 0.8)',
//     textAlign: 'center',
//     marginTop: 2,
//   },
//   messagesContainer: {
//     flex: 1,
//     padding: 10,
//   },
//   messagesContent: {
//     paddingBottom: 10,
//   },
//   messageBubble: {
//     flexDirection: 'row',
//     marginVertical: 5,
//     maxWidth: '85%',
//   },
//   botBubble: {
//     alignSelf: 'flex-start',
//   },
//   userBubble: {
//     alignSelf: 'flex-end',
//     flexDirection: 'row-reverse',
//   },
//   botAvatarContainer: {
//     marginRight: 8,
//     alignSelf: 'flex-end',
//   },
//   botAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#a5bc64',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   botAvatarText: {
//     fontSize: 18,
//   },
//   messageContent: {
//     borderRadius: 18,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     marginBottom: 5,
//   },
//   botContent: {
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#dee2cb',
//   },
//   userContent: {
//     backgroundColor: '#606c3b',
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//   },
//   botText: {
//     color: '#333',
//   },
//   userText: {
//     color: '#fff',
//   },
//   timestamp: {
//     fontSize: 10,
//     color: '#999',
//     alignSelf: 'flex-end',
//     marginTop: 4,
//   },
//   loadingContainer: {
//     alignItems: 'flex-start',
//     paddingHorizontal: 5,
//     marginTop: 10,
//   },
//   loadingBubble: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//     padding: 10,
//     borderRadius: 18,
//   },
//   loadingText: {
//     marginLeft: 10,
//     color: '#606c3b',
//     fontSize: 14,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 10,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#dee2cb',
//     alignItems: 'flex-end',
//   },
//   input: {
//     flex: 1,
//     backgroundColor: '#f2f3ee',
//     padding: 12,
//     borderRadius: 20,
//     fontSize: 16,
//     maxHeight: 120,
//     color: '#333',
//   },
//   sendButton: {
//     marginLeft: 10,
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#606c3b',
//     justifyContent: 'center',
//     alignItems: 'center',
//     alignSelf: 'flex-end',
//   },
//   sendButtonDisabled: {
//     backgroundColor: '#e0e0e0',
//   },
//   suggestedQueriesContainer: {
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#dee2cb',
//     paddingVertical: 10,
//   },
//   suggestedQueriesContent: {
//     paddingHorizontal: 10,
//   },
//   suggestedQuery: {
//     backgroundColor: '#dee2cb',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginHorizontal: 5,
//     borderWidth: 1,
//     borderColor: '#c5cda6',
//   },
//   suggestedQueryText: {
//     color: '#5d6839',
//     fontSize: 14,
//   }
// });

// export default AiChatBot;

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
  Keyboard,
  StatusBar,
  SafeAreaView
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { General } from '../constants';
import { Seperator } from '../components';

const AiChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: 'Hello! I\'m your waste management assistant. I can help with app features, recycling tips, or answer questions about our waste collection services.',
      sender: 'bot',
      timestamp: new Date(),
    },
    {
      id: 'suggestion',
      text: 'Try asking about pickup schedules, how to sort waste, or how to book a collection.',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef();

  // Suggested questions for the user
  const suggestedQueries = [
    "How do I book a pickup?",
    "What items can I recycle?",
    "How to earn rewards?",
    "Environmental tips"
  ];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${General.API_BASE_URL}api/ai/chat`, {
        message: inputText
      });
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (query) => {
    setInputText(query);
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Render individual message
  const renderMessage = (message) => {
    const isBot = message.sender === 'bot';
    
    return (
      <View 
        key={message.id} 
        style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble
        ]}
      >
       
        {isBot && (
          <View style={styles.botAvatarContainer}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🌿</Text>
            </View>
          </View>
        )}
        <View style={[
          styles.messageContent,
          isBot ? styles.botContent : styles.userContent
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botText : styles.userText
          ]}>
            {message.text}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
       <Seperator/>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eco Assistant</Text>
        <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#5d6839" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      {!keyboardVisible && (
        <View style={styles.suggestedQueriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedQueriesContent}
          >
            {suggestedQueries.map((query, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedQuery}
                onPress={() => handleSuggestedQuery(query)}
              >
                <Text style={styles.suggestedQueryText}>{query}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor="#A8A8A8"
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={!inputText.trim() ? "#CCC" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f3ee',
  },
  container: {
    flex: 1,
    backgroundColor: '#f2f3ee',
  },
  header: {
    backgroundColor: '#606c3b',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '85%',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botAvatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#a5bc64',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarText: {
    fontSize: 18,
  },
  messageContent: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 5,
  },
  botContent: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2cb',
  },
  userContent: {
    backgroundColor: '#606c3b',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    marginTop: 10,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 18,
  },
  loadingText: {
    marginLeft: 10,
    color: '#606c3b',
    fontSize: 14,
  },
  suggestedQueriesContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#dee2cb',
    paddingVertical: 8,
  },
  suggestedQueriesContent: {
    paddingHorizontal: 10,
  },
  suggestedQuery: {
    backgroundColor: '#dee2cb',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#c5cda6',
  },
  suggestedQueryText: {
    color: '#5d6839',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#dee2cb',
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f3ee',
    padding: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 120,
    color: '#333',
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#606c3b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  }
});

export default AiChatBot;