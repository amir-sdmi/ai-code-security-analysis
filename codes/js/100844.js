import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.js"
import usersRoute from "./routes/users.js"
import vehiclesRoute from "./routes/vehicles.js"
import cors from 'cors';

//import required packages, need to import self defined routes
//why use dottenv,mongoose learn??? learn how to copy code from official mongoose
dotenv.config();
const app = express();
app.use(cors());
//mongoDB connection code
const connect = async() => {
    try {
        await mongoose.connect(process.env.mongo);
        console.log("connected to mongoDB")
    } 
    catch (error) {
        throw(error);
    }
};

//ask chatgpt..this is a important piece of code..
mongoose.connection.on("disconnected", () =>{
    console.log("mongoDB disconnected");
})
mongoose.connection.on("connected", () =>{
    console.log("mongoDB connected");
})

/*app.get("/", (req,res) => {
    res.send("Hello first request")
})*/

//middleware
app.use(cookieParser())
app.use(express.json())

//define api endpoints..use chatgpt to learn this part 
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/vehicles", vehiclesRoute);
//create a middleware to handle errors..remember the parameter format
app.use((err,req,res,next) => {
    const errorstatus = err.status || 500;
    const errorMessage = err.message || "Something went wrong!"
    //you can send whatever you like in the below json format..
    return res.status(errorstatus).json({
        success: false,
        status: errorstatus,
        message: errorMessage,
        stack: err.stack,

    })


})

// start the Express server..this is how you create backend code...
app.listen(8070, () => {
    connect();
    console.log("Connected to backend.");
});