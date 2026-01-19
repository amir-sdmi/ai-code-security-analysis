// obviously needed
import React, { useEffect, useState } from 'react';

// for fetching python stuff
import axios from 'axios';

// css
import './App.css';

// image 
import stars from './starssmall.png';

// spotify embed
import { Spotify } from 'react-spotify-embed';

// invert a hex color (written by copilot) for text on background
function invertColor(hex) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  // invert color components
  var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
      g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
      b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b);
}

// pad zeros (written by copilot) for invertColor
function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

// lighten a hex color (written by copilot) for background to be nicer
function lightenColor(color, percent) {
  var num = parseInt(color.replace("#",""), 16),
  amt = Math.round(2.55 * percent),
  R = (num >> 16) + amt,
  G = ((num >> 8) & 0x00FF) + amt,
  B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
};

// main app function
function App() {

  // set up states
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [url, setUrl] = useState('');
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [albumUrl, setAlbumUrl] = useState('');
  const [palette, setPalette] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // on load, get a random text for the form box from the python function
  useEffect(() => {
    axios.get('http://localhost:5000/api/randomtext')
      .then(response => {
        setText(response.data.text);
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, []);

  // form input
  const handleSubmit = (event) => {
    event.preventDefault();
    
    // loading spinner activates
    setIsLoading(true);

    // post to python function
    axios.post('http://localhost:5000/api/submit', { input })
      .then(response => {

        // loading stops
        setIsLoading(false);
        
        // set states based on output of python
        setResponseMessage(response.data.generated_text);
        setUrl(response.data.spotify_url);
        setSong(response.data.song);
        setArtist(response.data.artist);
        setAlbumUrl(response.data.album_image_url);
        setPalette(response.data.palette);
      })
      .catch(error => {
        // catch errors and stop loading
        setIsLoading(false);
        console.error('There was an error fetching the data!', error);
      });
  };

  // for spotify widget, need the track ID (last part of the spotify URL)
  let parts = url.split("/");
  let lastPart = parts[parts.length - 1];

  // render app
  return (
      // main div
      <div>

        {/* Title and submit form */}
        <header className="App-header">
        <h1> AI MoodSync  </h1>
        <form onSubmit={handleSubmit}>
          <div class="info-icon">
            <i>🛈</i>
            <span class="info-text">
              Performs a vector search on your input with a database of songs, 
              and gives an AI generated recommendation as to why the recommended song is chosen. 
              <br></br><br></br> 
              Uses Weaviate for the vector search, and Spotify for the song recommendation.
            </span>
          </div>
          <textarea
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={text}
          />

          {/* Submit button with loading spinner */}
          <button type="submit">
              <div className="button-content">
                <p className="button-text" style={{visibility: !isLoading ? 'visible' : 'collapse' }}>🎵 Recommend</p>
                
                {/* Loading spinner */}
                <center className="loader-container" style={{visibility: isLoading ? 'visible' : 'collapse' }}>
                  <div className="loader" id="loader"/>
                </center>
              </div>
            </button>
          
        </form>
      </header>

      {/* Main area with loading spinner */}
      <div className="center-loading">

  
      

        {/* Boxes for album art, song title, artist name, recommendation, and spotify widget */}
        {albumUrl &&
          <div className="center-box">
            
            {/* Album + song name + artist */}
            <div className="imagebox" style={{ backgroundColor: lightenColor(palette[0], 5) }}>
              <div className="image-container">
                <img src={albumUrl} alt="Album art" />
                {song && <h1 style={{color: invertColor(palette[0]) }}> {song} </h1> }
                {artist && <h2 style={{color: invertColor(palette[1]) }}> {artist} </h2>}
              </div>
            </div>

            {/* Vertically split recommendation and spotify widget */}
            <div className="vertical-area">
              <div className="textbox">
                <div className="image-container">
                  <img src={stars} alt="AI generation symbol" />
                </div>
                {responseMessage && <p > {responseMessage} </p>}
              </div>

              <div className="spotify">
                {albumUrl &&
                  <Spotify wide link={`https://open.spotify.com/track/${lastPart}`} />
                }
              </div>
            </div>

          </div>
        }
        </div>
      </div>
  );
}

export default App;