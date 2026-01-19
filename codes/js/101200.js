import axios from 'axios';
import React, { useState } from 'react';
import CharacterSheet from '../components/CharacterSheet.js';
import ChatWindow from '../components/ChatWindow.js';

/*
I just found out that chatgpt is pay-per-use and my trial
has expired. therefore, this project is now deprecated.
*/

/* todo
- perhaps find a way to condense chatGPT response so there are breaks in-between lines??
- beautify the page (flexbox, materialCSS)
- update About and Contact
- find somewhere to host (netlify, render)
*/

function Home() {

  const API_URL = process.env.REACT_APP_API_URL;
  const API_KEY = process.env.REACT_APP_API_KEY;

  const [messages, setMessages] = useState([]);
  const [request, setRequest] = useState('');

  const [myCharacter, setMyCharacter] = useState([{
    myName: 'Unnamed', 
    myRace: 'Human', 
    myClass: 'Barbarian' }
  ]);

  //display message(s) onto the window
  const displayMessage = (message) => {
    const textMsg = `${message}`;
    const newMessage = {
        text: `${textMsg}`,
        timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((currentMessages) => [...currentMessages, newMessage]);
  };

  //this function communicates with chatgpt via axios
  const sendMessage = async () => {
    try {
      const response = await axios.post(API_URL, {
        model: 'gpt-3.5-turbo',
        // messages: [
        //     { role: 'system', content: 'You are a helpful assistant.' },
        //     { role: 'user', content: request },
        // ],
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: `I want a you to start me a short RPG scenario where I am a ${myCharacter[0].myRace} ${myCharacter[0].myClass} under the name ${myCharacter[0].myName}. I just need a character lore and a current rpg situation, no choices nor outcomes. Do not respond with "Sure!" or anything that depicts AI-language. Make sure to include my name, class, and race in the response.` },
          ],
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
          }
      );

      console.log(response);
      
      displayMessage(response.data.choices[0].message.content);

    } 
    catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    console.log("submitted");
    const inputText = e.target.innerText;

    //connect to chatgpt here
    setRequest(inputText);
    sendMessage();
    displayMessage(inputText);
  }

  return (
    <div>
      <h1>RPG Scenario Generator</h1>
      <p>Customize a character and generate a start to an RPG scenario</p>

      <div className="chatWindow-div">
        <CharacterSheet myCharacter={myCharacter} setMyCharacter={setMyCharacter} handleSendMessage={handleSendMessage}/>
        <ChatWindow messages={messages}/>
      </div>
      
    </div>
  );
}

export default Home;