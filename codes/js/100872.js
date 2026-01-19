const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: `${process.env.OPENAI_API_KEY}`
});

const openai = new OpenAIApi(configuration);

//Test
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
// const User = require('../models/UserModel');
//Test

const User = require('./models/UserModel');

//Routers
const userRouter = require('./routes/UserRoutes');
const loginRouter = require('./routes/LogInRouter');
const teamRouter = require('./routes/TeamRouter');
const userPrivateRouter = require('./routes/UserPrivateRouter');
const app = express();

// Middlewares

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋!');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes

app.post('/chat', async (req, res) => {
  // Get the prompt from the request
  const { data } = req.body;

  // Generate a response with ChatGPT
  const completion = await openai.createCompletion({
    model: 'text-davinci-002',
    prompt: data
  });
  res.send(completion.data.choices[0].text);
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/LogIn', loginRouter);
app.use('/api/v1/teams', teamRouter);
app.use('/api/v1/user', userPrivateRouter);
module.exports = app;
