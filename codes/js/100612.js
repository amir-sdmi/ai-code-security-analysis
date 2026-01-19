import logo from './logo.svg';
import './App.css';
import FontLoader from './FontLoader';


function App() {
  return (
    <>
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React with ChatGPT
        </a>
      </header>
    </div>
    <div className="App">
    <h1>OpenType.js with React</h1>
    <FontLoader />
  </div>
  </>
  );
}

export default App;

/* 
import React from 'react';
import FontLoader from './FontLoader';

function App() {
  return (
    <div className="App">
      <h1>OpenType.js with React</h1>
      <FontLoader />
    </div>
  );
}

export default App;

*/