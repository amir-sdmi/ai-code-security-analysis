const { spawn } = require('child_process');
const path = require('path');

// We don't need to start the ML service anymore since we're using Gemini API
console.log('Starting Node.js server...');
const nodeServer = spawn('node', [path.join(__dirname, 'server', 'app.js')]);

nodeServer.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
});

nodeServer.stderr.on('data', (data) => {
  console.error(`Server Error: ${data}`);
});

console.log('Server starting up...');