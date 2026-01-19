import { useState, useEffect } from 'react'

const App = () => {
  const [value, setValue] = useState('')
  const [message, setMessage] = useState(null)
  const [prevChats, setPrevChats] = useState([])
  const [currentTitle, setCurrentTitle] = useState(null)

  const createNewChat = () => {
    setMessage(null)
    setValue('')
    setCurrentTitle(null)
  }

  const handleClick = (uniqueTitle) => {
    setCurrentTitle(uniqueTitle)
  }

  const getMessages = async (e) => {
    e.preventDefault()
    const options = {
      method: 'POST',
      body: JSON.stringify({
        message: value
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
    try {
      const res = await fetch('http://localhost:8000/completions', options)
      const data = await res.json()
      console.log(data)
      setMessage(data.choices[0].message)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    console.log(currentTitle, value, message)
    if(!currentTitle && value && message) {
      setCurrentTitle(value)
    }
    if(currentTitle && value && message) {
      setPrevChats(prevChats => (
        [...prevChats, 
          {
            title: currentTitle,
            role: 'user',
            content: 'value'
          }, 
          {
            title: currentTitle,
            role: message.role,
            content: message.content
          }
        ]
      ))
    }
  }, [message, currentTitle, value])

  console.log(prevChats)

  const currentChat = prevChats.filter(prevChats => prevChats.title === currentTitle)
  const uniqueTitles = Array.from(new Set(prevChats.map(prevChats => prevChats.title)))
  console.log(uniqueTitles)


  return (
    <div className="app">
      <section className='side-bar'>
        <button onClick={createNewChat}>+ New chat</button>
        <ul className='history'>
          {uniqueTitles?.map((uniqueTitle, index) => <li key={index} onClick={() => handleClick(uniqueTitle)}>{uniqueTitle}</li>)}
        </ul>
        <button>Login</button>
        <nav>
          <p>Powered by chatGPT</p>
        </nav>
      </section>
      <section className='main'>
        {!currentTitle && <h1>ChatGPT</h1>}
        <ul className="feed">
          {currentChat?.map((chatMessage, index) => <li key={index}>
            <p className='role'>{chatMessage.role}</p>
            <p>{chatMessage.content}</p>
            </li>)}
        </ul>
        <div className="bottom-section">
          <form onSubmit={getMessages} className='input-container'>
            <input 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              placeholder='Send a message.'
            />
            <div id='submit' type='submit' onClick={getMessages}>{'\u27A2'}</div>
          </form>
          <p className="info">
          Free Research Preview. ChatGPT may produce inaccurate information about people, places, or facts. ChatGPT May 12 Version
          </p>
        </div>
      </section>
    </div>
  );
}

export default App;
