// init app 
const express = require('express')

// init server with copilot
const app = express()

app.get('/', (req, res) => { 
    res.send('Hello World!')
})

app.listen(3000, () => {
