require('dotenv').config()
const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const cors = require('cors')

//CREATE ROUTE
router.post('/signup', async (req, res) => {
    try {
        const newUser = new User(req.body)
        await newUser.save()
        const token = createToken(newUser)
        res.json({token, user: newUser}) //Added the user: after debigging with chatGpt
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
})

//LOGIN ROUTE
// receive credential from the user
// verify that the credential are accurate
// if the credentials are accurate then you return a token
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        if(!user) throw new Error(`Could not find this user in the database: User with username ${username}`)  
        const isPasswordMatched = await bcrypt.compare(password, user.password)
        if (!isPasswordMatched) throw new Error(`The password credentials shared did not match the credentials for the user with username ${username}`)
        const token = createToken(user)
        res.json({ token, user })
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
})
// createToken
function createToken(user){
   return jwt.sign({ user }, process.env.SECRET, { expiresIn: '24h' })
}

// verify a token
function checkToken(req, res, next){
    let token = req.get('Authorization')
    if(token){
        token = token.split(' ')[1]
        jwt.verify(token, process.env.SECRET, (err, decoded) => {
            req.user = err ? null : decoded.user
            req.exp = err ? null : new Date(decoded.exp * 1000)
        })
        return next()
    } else {
        req.user = null 
        return next()
    }
}

function ensureLoggedIn(req, res, next ){
    if(req.user) return next()
    res.status('401').json({ msg: 'Unauthorized You Shall Not Pass'})
}


// fetch a user details
router.get('/:id', checkToken, async(req,res) =>{
    try {
    const userID = req.params.id
    const theUser = await User.findById(userID)
    res.json(theUser)
} 
catch (err){
    console.log(err)
}}
)

// delete a user
router.delete("/:id", (req, res) => {
    User.findByIdAndDelete(req.params.id)
    .then(() => res.redirect("/"))
    .catch(() => res.send('Member not deleted successfully'))
    });

// update a user
router.put("/:id", async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, req.body, {new: true})
     // console.log(req.params.id)
     .then((user) => res.redirect("/users/"+ req.params.id ) 
    // what is the show page route?
     );
   });


// module.exports = {router, checkToken}
module.exports = router