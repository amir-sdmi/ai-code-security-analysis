import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  useremail: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    // minlength: 6,
    //this is suggested by copilot, have to check how this will work
  }, 
  picture:{
    type: String,
    required: false,
  }
});


const userTempSchema = new mongoose.Schema({
  useremail: {
    type: String,
    required: true,
  },
  otp: {
    //this is the otp that is sent to the user email
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now, expires: "2m" }, 
});




export const userDetailsTemp = mongoose.model("userTemp", userTempSchema);
export const userDetails = mongoose.model("userSignedUp", userDataSchema);


