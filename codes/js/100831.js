import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import ContactUsPage from './ContactUsPage';
import SignUpPage from './SignUpPage';
import LoginPage from './LoginPage';
import DatePage from './DatePage';
import TimePage from './TimePage';
import CalculatorPage from './CalculatorPage'; // Import the CalculatorPage component
import './styles.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>MK React Using CHATGPT </h1>
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li>
                <Link to="/signup">Sign Up</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/date">Date Page</Link>
              </li>
              <li>
                <Link to="/time">Time Page</Link>
              </li>
              <li>
                <Link to="/calculator">Calculator</Link> {/* New link for Calculator Page */}
              </li>
            </ul>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/date" element={<DatePage />} />
          <Route path="/time" element={<TimePage />} />
          <Route path="/calculator" element={<CalculatorPage />} /> {/* Add route for CalculatorPage */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
