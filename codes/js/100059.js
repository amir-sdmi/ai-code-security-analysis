import React from 'react'
import  { createRoot }  from 'react-dom/client';
import App from './src/App.js'

const container = document.getElementById('root');
const root = createRoot(container);

// Custom favicon asset generated with ChatGPT
const faviconPath =  'src/assets/images/favicon.ico?';

const link = document.createElement('link');
link.rel = 'icon';
link.type = 'image/x-icon';
link.href = `${process.env.PUBLIC_PATH}${faviconPath}`;
document.head.appendChild(link);

root.render(<App/>);