import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Visit us at: Bialik 55, Ramat Gan, Israel</p>
        <p>Phone: +972 3-555-1234</p>
        <div className="social-media-links">
          <a href="mailto:contact@catcoffee.com">Email: contact@catcoffee.com</a>
          <span>|</span>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a> 
          <span>|</span>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </div>
      <div style={{ marginTop: '35px' }}>This website code & content is entirely fictional and was generated using ChatGPT...</div>
    </footer>
  );
};

export default Footer;
