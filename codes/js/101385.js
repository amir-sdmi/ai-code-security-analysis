import { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'

function App() {
    const [message, setMessage] = useState(null)
    const [value, setValue] = useState('')
    const [previousChats, setPreviousChats] = useState([])
    const [currentTitle, setCurrentTitle] = useState(null)

    const getMessages = async () => {
        const options = {
            method:"POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: value,
            })
        }
        try {
            const response = await fetch('http://localhost:4000/completions', options)
            const data = await response.json()
            setMessage(data.choices[0].message)
        } catch (error) {
            toast.error("Something is wrong with ChatGPT", {
                position: "top-right",
                autoClose: 2000,
                className: 'toast-message'
            });
            return;
        }
    }


    const createNewChat = () => {
        setMessage(null);
        setValue('');
        setCurrentTitle(null);
    }

    const handleClick = (uniqueTitle) => {
        setCurrentTitle(uniqueTitle)
    }

    useEffect(() => {
        console.log(currentTitle, value, message)
        if (!currentTitle && value && message) {
            setCurrentTitle(value)
        }
        if (currentTitle && value && message) {
            setPreviousChats(previousChats => (
                [...previousChats,
                {
                    title: currentTitle,
                    role: "user",
                    content: value,
                },
                {
                    title: currentTitle,
                    role: message.role,
                    content: message.content,
                }
                ]
            ))
        }
    }, [message, currentTitle])

    const currentChat = previousChats.filter(previousChat => previousChat.title === currentTitle)
    const uniqueTitles = Array.from(new Set(previousChats.map(previousChat => previousChat.title)))

    return (
        <div className="App">
            <section className='side-bar'>
            <ToastContainer />
                <button onClick={createNewChat}>+ New Chat</button>
                <ul className="history">
                    {uniqueTitles.map((uniqueTitle, index) => {
                        return (<li key={index} onClick={() => handleClick(uniqueTitle)}>
                            {uniqueTitle}
                        </li>)
                    })}
                </ul>
                <nav>
                    <p>Made by bhavya</p>
                </nav>
            </section>


            <section className='main'>

                {!currentTitle && <h1>ChatGPT</h1>}
                <ul className='feed'>
                    {currentChat.map((chatMessage, index) => {
                        return (<li key={index} style={chatMessage.role === "assistant" ? { backgroundColor: '#444654' } : { backgroundColor: "none" }}>
                            <p className='role'>{chatMessage.role}</p>
                            <p className='message'> {chatMessage.content}</p>
                        </li>)
                    })}
                </ul>
                <div className='bottom-section'>
                    <div className='input-container'>
                        <input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
                        <div id='submit' onClick={getMessages}>➢</div>
                    </div>
                    <p className='info'>
                        Chat GPT Mar 14 Version. Free Research Preview
                        Our goal is to make AI systems more natural and safe to interact with.
                        Your feedback will help us improve.
                    </p>
                </div>
            </section>
            
        </div>
    );
}

export default App;
