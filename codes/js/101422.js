import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
// ChatGPT API Key
const openAiApiKey = "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"; 
// OMDB API Key
const omdbApiKey = 'bf639062'; 

const MoodResults = () => {
  const { mood } = useParams();
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState([]);
  const [titlesFetched, setTitlesFetched] = useState(false); // Prevent fetching titles multiple times
  const [moviesFetched, setMoviesFetched] = useState(false); // Prevent fetching movie details multiple times
  const [error, setError] = useState(null); // For displaying errors

  // Fetch movie titles based on the mood using ChatGPT
  const fetchMovieTitlesFromChatGPT = async () => {
    console.log("Fetching titles from ChatGPT...");

    try {
      const prompt = `Give me 10 movie titles based on the mood "${mood}". Provide just the names of the movies, no numbering, and no special characters.`;
      const userInput = `Give me movie titles for the mood: ${mood}`;

      const result = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userInput },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiApiKey}`,
          },
        }
      );
      //choices[0] is is an array of respones given by chatgpt as it means which response you want to use, default is 0
      const movieTitles = result.data.choices[0].message.content.split('\n').map(title => title.trim());
      console.log("Fetched titles:", movieTitles);

      return movieTitles;
    } catch (error) {
      console.error('Error fetching titles from ChatGPT:', error);
      setError('Failed to fetch movie titles. Please try again.');
      return [];
    }
  };

  // Fetch movie details from OMDB
  const fetchMovieDetails = async (title) => {
    console.log("Fetching movies from OMDB...");

    try {
      const response = await axios.get(`http://www.omdbapi.com/?apikey=${omdbApiKey}&t=${title}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie details for ${title}:`, error);
      return null;
    }
  };

  // Fetch the movies and handle both fetching titles and details
  const fetchMovies = async () => {
    if (titlesFetched || moviesFetched) return; // Skip if titles or movies are already fetched

    setTitlesFetched(true); 
    const movieTitles = await fetchMovieTitlesFromChatGPT();
    if (movieTitles.length === 0) return; // If no titles returned, exit

    // Fetch movie details for each title
    const moviePromises = movieTitles.map((title) => fetchMovieDetails(title));
    const movieDetails = await Promise.all(moviePromises);

    const validMovies = movieDetails.filter((movie) => movie && movie.Response !== 'False');
    setMovies(validMovies);
    setMoviesFetched(true); // Indicate that movies are fetched
  };

  useEffect(() => {
    // Reset flags when mood changes
    setTitlesFetched(false);
    setMoviesFetched(false);
    setMovies([]); // Reset movies list
    setError(null); // Reset error

    fetchMovies(); // Fetch movies based on the mood
  }, [mood]); // Trigger on mood change

  return (
    <div className="mood-results-container">
      <h1>Movies for the mood: {mood}</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="movie-list">
        {movies.length === 0 ? (
          <span>Loading...</span>
        ) : (
          movies.map((movie) => (
            <div key={movie.imdbID} className="movie-card">
              <img src={movie.Poster} alt={movie.Title} />
              <div className="movie-details">
                <h2>{movie.Title}</h2>
                <p>{movie.Plot}</p>
                <Link 
                  to={`/moviesDetails/${movie.imdbID}`} 
                  className="favorite-button"  
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoodResults;
