const express = require('express');
const fs = require('fs');
const path = require('path');
const getToken = require('./token');
const talkerValidate = require('./talkerValidate');
// const nameValidate = require('./nameValidate');
// const ageValidate = require('./ageValidate');
// const talkValidate = require('./talkValidate');
// const rateValidate = require('./rateValidate');
const tokenValidate = require('./tokenValidate');

const app = express();
app.use(express.json());

const HTTP_OK_STATUS = 200;
const PORT = process.env.PORT || '3001';
const FILE_NAME = 'talker.json';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.get('/talker/search', tokenValidate, (req, res) => {
  const { q } = req.query;
  const data = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(data);
  const talker = talkersList.filter((t) => t.name.includes(q));
  if (typeof q === 'undefined') {
    return res.status(200).json(talkersList);
  }
  if (talker.length === 0) {
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }
  return res.status(200).json(talker);
});

app.get('/talker/search', tokenValidate, (req, res) => {
  const { rate } = req.query;
  const data = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(data);
  const talker = talkersList.filter((t) => t.name.includes(rate));
  if (typeof rate === 'undefined') {
    return res.status(200).json(talkersList);
  }
  if (talker.length === 0) {
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }
  return res.status(200).json(talker);
});

app.get('/talker', async (_request, response) => {
  const talkerData = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(talkerData);
  if (!talkersList) {
    return response.status(HTTP_OK_STATUS).json([]);
  } 
  return response.status(HTTP_OK_STATUS).json(talkersList);  
});

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;  
  const talkerData = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(talkerData);
  
  console.log('TALKER LIST : ', talkersList);

  if (!talkersList) {
    return res.status(HTTP_OK_STATUS).json([]);
  }
  
  const talkerID = talkersList.find((talker) => talker.id === Number(id));
  if (!talkerID) {
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }
  return res.status(HTTP_OK_STATUS).json(talkerID);  
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // created by chatGPT
  if (!email) {
    return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }
  if (!password) {
    return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  
  const token = getToken();
  return res.status(200).json({ token });
});

app.post('/talker', tokenValidate, async (req, res) => {
  const data = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(data);
  const { name, age, talk } = req.body;
  const talker = { name, age, talk, id: talkersList.length + 1 };
  const validate = talkerValidate(talker);
  if (validate.message) { return res.status(400).json({ message: validate.message }); }
  talkersList.push(talker);
  fs.writeFileSync(path.join(__dirname, FILE_NAME), JSON.stringify(talkersList));
  return res.status(201).json(talker);
});

app.put('/talker/:id', tokenValidate, async (req, res) => {
  const { id } = req.params;
  const data = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(data);
  const { name, age, talk } = req.body;
  const talker = { name, age, talk, id: Number(id) };
  const validate = talkerValidate(talker);
  if (validate.message) { return res.status(400).json({ message: validate.message }); }
  const index = talkersList.findIndex((t) => t.id === Number(id));
  if (index === -1) { 
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }
  talkersList[index] = talker;
  fs.writeFileSync(path.join(__dirname, FILE_NAME), JSON.stringify(talkersList));
  return res.status(200).json(talker);
});

app.delete('/talker/:id', tokenValidate, async (req, res) => {
  const { id } = req.params;
  const data = fs.readFileSync(path.join(__dirname, FILE_NAME), 'utf-8');
  const talkersList = JSON.parse(data);
  const index = talkersList.findIndex((t) => t.id === Number(id));
  talkersList.splice(index, 1);
  fs.writeFileSync(path.join(__dirname, FILE_NAME), JSON.stringify(talkersList));
  return res.status(204).json({ message: 'Pessoa palestrante deletada com sucesso' });
});

app.listen(PORT, () => {
  console.log('Online');
});
