import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { GiftedChat, Send } from 'react-native-gifted-chat';
import { StyleSheet } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MY_API_KEY } from '@env';
import callPythonFunction from "./callPythonFunction";

// const API_URL = 'https://api.openai.com/v1/engines/text-davinci-002/completions';

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: `
      You are SmooBot, an automated ChatBot meant to serve as an interactive Library Management service.
      You will follow the steps accordingly whenever you meet a customer:
      1. Introduce yourself in a kind and polite manner.
      3. Ask the customer for their name and always refer to them by their name.
      4. Ask them if they want to ask questions or search the library database.
      5. If they want to search the library database, ask them if they want to check their graduate learning outcome results or find a specific item.
      6. If they want to check their graduate learning outcome, ask for their student id.
      7. If they want to find a specific item, ask them if they have the call number or the name of the book.
      8. Create a JSON summary of the collected information. The fields to include should be in the following format between the "*" symbols:
      /*
       * Object = {
       *   "method": "check_dataset",
       *   "context": 'find a book that contains ship',
       *   "student_id": '5d66ee1de283ad380812600cbc8859789df54b15425ac883a5ff32a941248115',
       *   "call_number": 'JA66 .H795 1968',
       *   "name": 'The Obama phenomenon'
       * }
       */
      9. Check again that all information has been collected and that all steps have been observed before continuing.
      `,
    }

  ]);

  const [result, setResult] = useState(null);

  const API_URL = 'https://api.openai.com/v1/chat/completions';
  // const API_KEY = MY_API_KEY;
  const API_KEY = '';

  console.log(API_KEY)
  console.log(API_URL)
  // data to be displayed on screen
  const [data, setData] = useState([]);
  const [textInput, setTextInput] = useState("");

  console.log('data is: ')
  console.log(data)


  const handleSend = async () => {
    // const prompt = textInput;
    console.log('text inpt is')
    console.log(textInput)

    // add user Message after get input
    const userMessage = {
      role: 'user',
      content: textInput,
    };
    setMessages([...messages, userMessage]);

    const response = await axios.post(API_URL, {
      "model": "gpt-4",
      "temperature": 0.2,
      "messages": [...messages, userMessage],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
    }).catch(error => {
      console.log(error);
    })

    console.log(API_KEY, API_URL)

    console.log(JSON.stringify(response))
    botResponse = JSON.stringify(response.data.choices[0].message.content).slice(1, -1);


    //call python function here
    try {
      const responsePy = await callPythonFunction(botResponse);
      setResult(responsePy);

      console.log('Response from Python:', responsePy);
      newObject = {
        "role": 'user',
        "content": "Please form an english sentence with this: " + JSON.stringify(responsePy)
      }

      const newResponse = await axios.post(API_URL, {
        "model": "gpt-4",
        "temperature": 0.2,
        "messages": [...messages, newObject],
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }).catch(error => {
        console.log(error);
      })

      console.log('inside loop');
      console.log(newResponse)

    } catch (error) {
      console.error(error);
    }

    // Append the bot's response to the messages state
    const botMessage = {
      role: 'system',
      content: botResponse,
    };
    // to whole convo history
    setMessages([...messages, botMessage]);

    console.log('data here is')
    //reset
    setData([...data, { type: "user", 'text': textInput }, { type: "bot", 'text': botResponse }]);
    setTextInput('');
  }

  // const onSend = async (newMessages = []) => {

  //   const userInput = newMessages[0].text;
  //   console.log("user input is: ")
  //   console.log(userInput)
  //   // Append newMessages to the messages state with unique _id
  //   const messagesWithId = newMessages.map(message => ({
  //     ...message,
  //     _id: Math.round(Math.random() * 1000000).toString(), // Generate a unique _id
  //   }));

  //   // Append newMessages to the messages state
  //   setMessages(previousMessages =>
  //     GiftedChat.append(previousMessages, messagesWithId)
  //   );


  //   // messages to include user inputs after user types, ensure this always loads after receiving user input
  //   try {
  //     const response = await axios.post(`${API_URL}`, {
  //       "model": "gpt-4",
  //       "temperature": 0.2,
  //       "messages": [
  //         { "role": "system", "content": "You are SmooBot, an automated ChatBot meant to serve as an interactive Library Management service. \n You will follow the steps accordingly whenever you meet a customer: \n 1. Introduce yourself in a kind and polite manner. \n 3. Ask the customer for their name and always refer to them by their name. \n 4. Ask them what they would like to do. \n " },
  //         { "role": "user", "content": messagesWithId }

  //       ]
  //       ,
  //     }, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${API_KEY}`,
  //       },
  //     });

  //     // Assign a unique _id to the response message
  //     response.data._id = Math.round(Math.random() * 1000000).toString();
  //     console.log("RESPONSE DATA IS: ")
  //     console.log(response.data);

  //     x = JSON.stringify(response.data.choices[0].message.content).slice(1, -1);
  //     console.log(x)

  //     // Create a bot message
  //     const botMessage = {
  //       _id: Math.round(Math.random() * 1000000).toString(), // Unique _id for the bot message
  //       text: x,
  //       createdAt: new Date(),
  //       user: BOT_USER,
  //     };

  //     console.log(botMessage);

  //     // Append the bot's response to the messages state
  //     setMessages(previousMessages =>
  //       GiftedChat.append(previousMessages, [botMessage])
  //     );
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const lastMessage = "";
  // need to change to make it always get the output from user input
  // useEffect(() => {

  //   if (messages.length > 0) {
  //     const lastMessage = messages[messages.length - 1];
  //     onSend([{
  //       // _id: Math.round(Math.random() * 1000000).toString(), // Generate a unique _id
  //       text: lastMessage,
  //       // user: USER,
  //       // createdAt: new Date(),
  //     }]);
  //   }

  // }, [messages]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmooBot</Text>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        style={styles.body}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', padding: 10, alignItems: 'flex-start' }}>
            <Text style={{ padding: 7, fontWeight: 'bold', borderRadius: 10, fontSize: 16, color: item.type === 'user' ? '#00897b' : '#7cb342', marginLeft: 10, alignSelf: 'flex-start' }}>
              {item.type === 'user' ? 'You' : 'SmooBot'}
            </Text>
            <View style={{ flex: 2, padding: 7 }}>
              <Text style={{ flexWrap: 'wrap' }}>{item.text}</Text>
            </View>
          </View>
        )}
      />


      <TextInput
        style={styles.input}
        value={textInput}
        onChangeText={(text) => setTextInput(text)}
        placeholder="Ask me anything" />
      <TouchableOpacity onPress={handleSend}
        style={styles.button}>
        <Text style={styles.buttonText}>Let's Go</Text>
      </TouchableOpacity>

    </View>
  );
}

// const generateResponse = async (text) => {
//   const response = await axios.post(CHATGPT_API_URL, {
//     prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.
//     Human: ${text}
//     AI:`,
//     max_tokens: 150,
//     temperature: 0.7,
//     n: 1,
//     stop: 'Human:',
//   }, {
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${API_KEY}`,
//     },
//   });

//   const { choices } = response.data;
//   const { text: generatedText } = choices[0];

//   return generatedText.trim();
// };

// export default function App() {

//   const [messages, setMessages] = useState([]);

//   const onSend = (newMessages = []) => {
//     this.setState(previousState => ({
//       messages: GiftedChat.append(previousState.messages, messages),
//     }), () => {
//       // send the user message to ChatGPT API
//       axios.post(`${API_URL}/predict`, { text: messages[0].text })
//         .then(response => {
//           const botMessage = {
//             _id: Math.round(Math.random() * 1000000),
//             text: response.data.text,
//             createdAt: new Date(),
//             user: BOT_USER,
//           };

//           this.setState(previousState => ({
//             messages: GiftedChat.append(previousState.messages, botMessage),
//           }));
//         })
//         .catch(error => {
//           console.log(error);
//         });
//     });

//     setMessages(GiftedChat.append(messages, newMessages))
//   };


//   return (
//     <View style={styles.container}>
//       <GiftedChat
//         messages={this.state.messages}
//         onSend={messages => this.onSend(messages)}
//         user={USER}
//         renderSend={props => (
//           <Send {...props}>
//             <View style={styles.sendButton}>
//               <Icon name="send" style={styles.sendIcon} />
//             </View>
//           </Send>
//         )}
//         renderLoading={() => <ActivityIndicator size="large" color="#5BC0EB" />}
//         renderChatFooter={() => <Text style={{ textAlign: 'center' }}>Powered by ChatGPT</Text>}
//         placeholder="Type your message here..."
//         renderBubble={this.renderBubble}
//         renderInputToolbar={this.renderInputToolbar}
//         showUserAvatar
//         alwaysShowSend
//         scrollToBottom
//         scrollToBottomComponent={() => (
//           <Icon name="chevron-down" size={36} color="#5BC0EB" />
//         )}
//       />
//     </View>
//   );

// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 70,
  },
  body: {
    backgroundColor: '#fff',
    margin: 5,
    width: '90%',

  },
  bot: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    width: 300,
    height: 50,
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
  },
  button: {
    backgroundColor: '#00897b',
    width: '90%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  }
});


