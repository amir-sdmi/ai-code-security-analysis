//I wrote this with ChatGPT

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Serve the static HTML files
app.use(express.static(path.join(__dirname, 'public')));

// Get the database (db.json)
function getDatabase() {
  const data = fs.readFileSync(path.join(__dirname, 'db.json'));
  return JSON.parse(data);
}

// Save to the database (db.json)
function saveDatabase(data) {
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(data, null, 2));
}

// Endpoint to get products
app.get('/api/products', (req, res) => {
  const db = getDatabase();
  res.json(db.products);
});

// Endpoint to get sales
app.get('/api/sales', (req, res) => {
  const db = getDatabase();
  res.json(db.sales);
});

// Endpoint to add a sale
app.post('/api/sales', (req, res) => {
  const db = getDatabase();
  const newSale = req.body;
  db.sales.push(newSale);
  saveDatabase(db);
  res.status(201).json(newSale);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
