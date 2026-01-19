// Chapter 7 - APIs (Using Express and Postman)
// NOTE:
// This code has been refactored using CHATGPT (Does the same job as main.js, but this is shorter and more optimised)
const express = require('express');                            // Importing Express
const app = express();                                         // Initializing the app
const port = 3000;                                             // Port where the app will listen
const retrieveData = require("./routes/Random_Data.json");     // Importing JSON data
const fs = require('fs')                                       // Importing FS module

// Middleware to parse JSON & x-www-form-urlencoded
app.use(express.json(), express.urlencoded({ extended: true }));

// Logging Middleware
app.use((req, res, next) => {
  fs.appendFile("log.txt", `\n${Date.now()}: ${req.method}: ${req.path}`, next);
});

// GET routes
// 1. API Route - Sending JSON Data
app.get("/api/retrieveData", (req, res) => res.json(retrieveData));

// 2. HTML Route - Sending HTML Content
app.get("/retrieveData", (req, res) =>
  res.send(`<ul>${retrieveData.map(user => `<li>${user.first_name}</li>`).join('')}</ul>`)
);

// 3. Dynamic Path Parameters (FOR ID)
app.get("/api/retrieveData/:id", (req, res) => {
  const user = retrieveData.find(user => user.id === +req.params.id);
  res.status(user ? 200 : 404).json(user || { error: "Data not found" });
});

// 4. Dynamic Path Parameters (For Sorting People with Genders)
app.get("/api/peopleByGender/:gender", (req, res) => {
  const filtered = retrieveData.filter(person => person.gender.toLowerCase() === req.params.gender.toLowerCase());
  res.status(filtered.length ? 200 : 404).json(filtered.length ? filtered : { error: "No people found with this gender" });
});

// POST route
app.post("/api/retrieveData", (req, res) => {
  const newData = { ...req.body, id: retrieveData.length + 1 };
  retrieveData.push(newData);
  fs.writeFile("./routes/Random_Data.json", JSON.stringify(retrieveData), () =>
    res.json({ message: "Data added successfully" })
  );
});

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));