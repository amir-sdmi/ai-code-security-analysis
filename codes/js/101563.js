const User =  require('../models/userModel'); //importing user model/schema
const jtw = require('jsonwebtoken'); //import JSON Web Totken module for user authentication
require('dotenv').config();
const OpenAI = require('openai');

//Function that creates a JSON Web Token
const createToken = (_id) => {
    return jtw.sign({_id}, process.env.SECRET, {expiresIn: '3d'});
}

//login user
const loginUser = async (req, res) => {
    const {email, password, accountType} = req.body; //get email and password from request body

    try{
        const user = await User.login(email, password, accountType); //call login function from User model login user
        const token = createToken(user._id); //create JSON Web Token
        res.status(200).json({accountType, email, token}); //respond with newly added email, accountType and JWT
    }
    catch (error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//signup user
const signupUser = async (req, res) => {
    const {firstName, lastName, email, password, accountType} = req.body; //get email and password from request body

    try{
        const user = await User.signup(firstName, lastName, email, password, accountType); //call signup function from User model to create new user in database
        const token = createToken(user._id); //create JSON Web Token
        res.status(200).json({firstName, lastName, email, accountType, token}); //respond with newly added email and JWT
    }
    catch (error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//save joblisting
const savejobUser = async (req, res) => {
    const {email, jobData} = req.body;

    try{
        const user = await User.savejobUser(email, jobData);
        res.status(200).json({user});
    }
    catch (error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//get joblistings
const getjobUser = async (req, res) => {
    const {email} = req.body;

    try{
        const user = await User.getjobUser(email);
        res.status(200).json({user});
    }
    catch (error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//delete joblisting
const deletejobUser = async (req, res) => {
    const {email, jobPost} = req.body;

    try{
        const user = await User.deletejobUser(email, jobPost);
        res.status(200).json({user});
    }
    catch (error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//save resume from resumeBuilder to user's account
const saveResumeUser = async (req, res) => {
    const resume = req.body;
    
    const certification = resume.certification;
    const education = resume.education;
    const professional = resume.professional;
    const profile = resume.profile;

    try{
        const userResume = await User.saveResumeUser(certification, education, professional, profile);
        res.status(200).json({userResume});
    }
    catch(error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//get user's resume from database
const getResumeUser = async (req, res) => {
    const {email} = req.body;

    try{
        const userResume = await User.getResumeUser(email);
        res.status(200).json({userResume});
    }
    catch(error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

//SET YOUR CHATGPT API KEY IN .env file
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

//compare jobPost details and userResume details with chatGPT API
const chatGPTUser = async (req, res) => {
    const {userResumeInfo, jobPostInfo} = req.body;
    try{
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            //SET UP PROMPTS IN THE messages array
            //messages: [{role: "user", content: `Can you compare these skills from a job description ${JSON.stringify(jobPostInfo)} and the skills from this resume ${userResumeInfo} and tell me what skills are missing in the resume that are in the job description?`}]
            messages: [{role: "user", content: `Job Post Info:${jobPostInfo} User Resume Info: ${userResumeInfo}
                Instructions: Given a JSON object with 'skillSets' containing user skills and
                'jobQualifications' containing a job qualifications, please compare the skill 
                sets and job qualifications. Provide a list of any missing skill sets with at 
                most 6 words per missing skill. The output should only be in 
                JSON object with following field: missing_skills array.
                `}]
        });

        //console.log(completion.choices[0].message.content);
        chatgptresponse = completion.choices[0].message.content;
        res.status(200).json({chatgptresponse});
    }
    catch(error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

const updateResumeskillsUser = async (req, res) => {
    const {email, missingSkills} = req.body;

    try{
        const userResume = await User.updateResumeskills(email, missingSkills);
        res.status(200).json({userResume});
    }
    catch(error){
        res.status(400).json({error: error.message}); //respond with error message
    }
}

module.exports = {loginUser, signupUser, savejobUser, getjobUser, deletejobUser, saveResumeUser, getResumeUser, chatGPTUser, updateResumeskillsUser}