import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {oauth2client} from"../utils/googleConfig.js"
import axios from "axios";
import { UserSubscription } from "../models/userSubscription.model.js";
import { Subscription } from "../models/subscription.model.js";
import { UserTokens } from "../models/userToken.model.js";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";
// import { Configuration, OpenAIApi } from 'openai';
import OpenAI from "openai";


const openai = new OpenAI({apiKey:process.env.OPENAI_KEY})

// OpenAI API Configuration
// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in your environment variables
// });
// const openai = new OpenAIApi(configuration);



// generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {

  try {
    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()


    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh token !")
  }

}


//resigtering the user
const registerUser = asyncHandler(async (req, res) => {
  //ALL STEPS
  //get the user detail from frontend
  //check if validation not empty
  //check for images avatar and coverimage
  //upload images to cloudinary
  //create user object create entry in db
  //remove password and refresh token from response
  //check for user Creation
  // return response



  const {firstname,lastname,email, phoneNo, password, } = req.body;



  
if ([email, firstname,lastname, password,phoneNo].some((field) => field?.trim() === "")) {

  console.log(email, firstname,lastname, password,phoneNo);
  
  throw new ApiError(400, "All fields are required.");
};

   //check if user exists
   const existedUser = await User.findOne( { email });

  if (existedUser) {
    throw new ApiError(409, "Email with email and username already exists")
  }



  //creating user object for db
  const user = await User.create({
    firstname: firstname.toLowerCase(),
    lastname: lastname.toLowerCase(),
    email,
    phoneNo,
    password,
    role:'user'
  })

  // const createdUser = User.findById(user._id).select("-password -refreshToken")
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

const userId = createdUser._id;
  let userTokens = await UserTokens.findOne({ userId });

  if (!userTokens) {
    userTokens = new UserTokens({ userId, tokens: [] });
  }

   // Automatically apply the Free version subscription to the new user
   const freeSubscription = await Subscription.findOne({ type: 'free' });  // Assuming "Free" is the subscription name

   const totalTokens = freeSubscription.noOfTokens ;


   

   if (freeSubscription) {
     await UserSubscription.create({
       userId: createdUser._id,
       subscriptionId: freeSubscription._id,
       purchasedPrice: 0,
       actualPrice: 0,
       discountAmount: 0,
       noOfTokens: freeSubscription.noOfTokens || 0,
       isActive: true,
       });
    
     // Add 5 tokens to the new user’s account
    
       // setting tokens table object
       const newSubscription = {
        subscriptionId: freeSubscription._id,
        type: 'free',
        initialTokens: totalTokens,
        remainingTokens: totalTokens,
        // initialTokens: subscription.noOfTokens,
        // remainingTokens: subscription.noOfTokens,
        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //  30days
        isActive: userTokens.tokens.length === 0, // If no active subscription, set this to active
      };
      
      
      // pushed newsubcription to tokens 
      userTokens.tokens.push(newSubscription);
  
      await userTokens.save();
    }
 
 

  return res.status(201).json(
    new ApiResponse(200, {createdUser,userTokens}, "User registered Successfully")
  )

})


//login user
const loginUser = asyncHandler(async (req, res) => {
  // get data from req.body
  // userName or email
  //find the user
  //check password
  //generate access and refresh token
  //send cookies
  //send response --user logged in

  const { email,password } = req.body

  if (!email) {
    throw new ApiError(400, " Email is required")
  }

  const user = await User.findOne({email})

  if (!user) {
    throw new ApiError(404, "User does not exists")
  }

  // checking if password is valid
  const isPasswordValid = await user.isPasswordCorrect(password)


  if (!isPasswordValid) {
    throw new ApiError(401, "Password incorrect!")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)



  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

 
  const options = {
    // httpOnly: true,
    // secure: true,
    // maxAge: 900000
}


  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
      )
    )

})



const googleLogin = asyncHandler(async (req,res)=>{
  try {
    
    const {code} = req.query;
    
    

    const googleResponse = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleResponse.tokens)
    console.log('code--',googleResponse?.tokens?.access_token);
    
    const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`) 
    



    const {email,name,id,picture} = userRes?.data;
    let user = await User.findOne({email});

    // if(!user){
    //   user = await User.create({
    //      username:name,
    //     email:email,
    //     googleId:id,
    //     role:'user'
    //   })
    // }

    if (!user) {
      throw new ApiError(404, "User does not exists")
    }
  
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    // httpOnly: true,
    // secure: true,
    // maxAge: 900000
}


  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully using google authentication"
      )
    )


  } catch (error) {
    console.error('error',error)
    throw new ApiError(500, "Something went wrong while registering the user")
  }
})



const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        accessToken: undefined
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res.status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "User Logged out"))


})


const refreshAccessToken = asyncHandler(async  (req,res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized Request!")
  }

try {
  
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
  
   const {accessToken,newRefreshToken} =  await generateAccessAndRefreshToken(user._id)
  
   const options = {
    httpOnly:true,
    secure:true
   }
  
   return res
            .cookie("accessToken",accessToken)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
              new ApiResponse(
                200,
                {accessToken,newRefreshToken},
                "access token refreshed successfully"
              )
            )
} catch (error) {
   throw new ApiError(401,error?.message || "Refresh token is expired or used")
}

})

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    // Fetch all users from the database, excluding sensitive fields
    const users = await User.find().select("-password -refreshToken");

    if (!users.length) {
      return res.status(200).json(
        new ApiResponse(200, [], "No users found.")
      );
    }

    // Return the list of users
    return res.status(200).json(
      new ApiResponse(200, users, "Users retrieved successfully.")
    );
  } catch (error) {
    // Handle any errors
    throw new ApiError(500, "An error occurred while fetching users.");
  }
});


const changeCurrentPassword = asyncHandler(async  (req,res) => {


  const {oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
          .status(200)
          .json(new ApiResponse(200,{},"password changed successfully"))
  
})

const getCurrentUser = asyncHandler(async  (req,res) => {

  
  return res
          .status(200)
          .json(new ApiResponse(200,req.user,"current user fetched successfully"))
  
})

const updateAccountDetails = asyncHandler(async  (req,res) => {

  const {email,userName} = req.body

  if(!fullName || !email){
    throw new ApiError(400,"all fields are requied")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new:true}
  ).select("-password")

  return res
          .status(200)
          .json(new ApiResponse(200,user,"account details updated successfully"))


  
})


const UserChannelProfile = asyncHandler(async  (req,res) => {

  const {userName} = req.params

  if(!userName?.trim()){
    throw new ApiError(400,"username is missing")
  }
   
  const channel = await User.aggregate([
    {
      $match:{
          userName:userName?.toLowerCase()
      },
    },{
      $lookup:{
        from :"subscription",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    }
    ,{
      $lookup:{
        from :"subscription",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscriberTo"
      }
    },{
      $addFields:{
        subscriberCount:{
          $size:"$subscribers"
        },
        channelSubscriberToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond: {
            if:{$in: [req.user?._id, "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        },
      }
    },{
      $project:{
        fullName:1,
        userName:1,
        subscriberCount:1,
        channelSubscriberToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1,

      }
    }
  ])
  

  if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
  }

  return res
        .status(200)
        .json(new ApiResponse(200,"user channel fetched successfully!"))

})


// Controller for Admin to get all user details including subscription, coupons, tokens, etc.
 const getAllUsersDetails2 = asyncHandler(async (req, res) => {
  try {
      // Aggregation pipeline to gather all relevant user information
      const users = await User.aggregate([
          // Lookup for UserSubscription to get subscription details
          {
              $lookup: {
                  from: "usersubscriptions",
                  localField: "_id",
                  foreignField: "userId",
                  as: "subscriptions",
              },
          },
          // Lookup for UserTokens to get tokens history and current token data
          {
              $lookup: {
                  from: "usertokens",
                  localField: "_id",
                  foreignField: "userId",
                  as: "tokensHistory",
              },
          },
          // Lookup for UserCoupon to get coupon usage history
          {
              $lookup: {
                  from: "usercoupons",
                  localField: "_id",
                  foreignField: "userId",
                  as: "couponsUsed",
              },
          },
          // Unwind subscriptions to separate each subscription (if multiple)
          {
              $unwind: {
                  path: "$subscriptions",
                  preserveNullAndEmptyArrays: true, // In case the user has no subscriptions
              },
          },
          // Lookup to get subscription details (name, tokens, expiry, etc.)
          {
              $lookup: {
                  from: "subscriptions",
                  localField: "subscriptions.subscriptionId",
                  foreignField: "_id",
                  as: "subscriptionDetails",
              },
          },
          // Unwind subscription details to extract the subscription information
          {
              $unwind: {
                  path: "$subscriptionDetails",
                  preserveNullAndEmptyArrays: true,
              },
          },
          // Lookup to get coupon details (if coupons used)
          {
              $lookup: {
                  from: "coupons",
                  localField: "couponsUsed.couponId",
                  foreignField: "_id",
                  as: "couponDetails",
              },
          },
          // Unwind coupon details to extract coupon information
          {
              $unwind: {
                  path: "$couponDetails",
                  preserveNullAndEmptyArrays: true,
              },
          },
          // Project fields to display necessary user info
          {
              $project: {
                  _id: 1,
                  firstname: 1,
                  lastname: 1,
                  email: 1,
                  phoneNo: 1,
                  role: 1,
                  isActive: 1,
                  "subscriptions._id": 1,
                  "subscriptionDetails.name": 1,
                  "subscriptionDetails.type": 1,
                  "subscriptions.actualPrice": 1,
                  "subscriptions.discountedPrice": 1,
                  "subscriptions.noOfTokens": 1,
                  "subscriptions.startDate": 1,
                  "subscriptions.endDate": 1,
                  "subscriptions.isActive": 1,
                  "tokensHistory.tokens": 1, // Array of tokens history
                  "couponsUsed._id": 1,
                  "couponDetails.name": 1,
                  "couponDetails.code": 1,
                  "couponDetails.type": 1,
                  "couponDetails.value": 1,
                  "couponsUsed.usedAt": 1, // When the coupon was used
              },
          },
      ]);

      res.status(200).json({
          success: true,
          data: users,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: "Error fetching users details",
      });
  }
});

const getAllUsersDetails = asyncHandler(async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' } // Exclude users with the role 'admin'
        },
      },
      {
        $lookup: {
          from: 'usersubscriptions',
          localField: '_id',
          foreignField: 'userId',
          as: 'subscriptions',
        },
      },
      {
        $lookup: {
          from: 'usercoupons',
          localField: '_id',
          foreignField: 'userId',
          as: 'coupons',
        },
      },
      {
        $lookup: {
          from: 'usertokens',
          localField: '_id',
          foreignField: 'userId',
          as: 'tokens',
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscriptions.subscriptionId',
          foreignField: '_id',
          as: 'subscriptionDetails',
        },
      },
      {
        $lookup: {
          from: 'coupons',
          localField: 'coupons.couponId',
          foreignField: '_id',
          as: 'couponDetails',
        },
      },
      {
        $unwind: {
          path: '$couponDetails', // Unwind couponDetails if needed
          preserveNullAndEmptyArrays: true, // Optional: Keep users without coupons
        },
      },
      {
        $group: {
          _id: '$_id',
          firstname: { $first: '$firstname' },
          lastname: { $first: '$lastname' },
          email: { $first: '$email' },
          phoneNo: { $first: '$phoneNo' },
          role: { $first: '$role' },
          isActive: { $first: '$isActive' },
          subscriptions: { $first: '$subscriptions' },
          tokens: { $first: '$tokens' },
          coupons: { $first: '$coupons' },
          subscriptionDetails: { $push: '$subscriptionDetails' },
          couponDetails: { $push: '$couponDetails' },
          createdAt: { $first: '$createdAt' }, // Assuming you have a createdAt field
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $project: {
          password: 0, // Exclude sensitive data
          refreshToken: 0, // Exclude refreshToken if needed
        },
      },
    ]);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});






// const uploadImage = asyncHandler(async (req, res) => {
//   // Check if the file exists

// console.log("ooo",req.files);
// console.log(req.files);

//   if (!req.files) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   const filePath = req.files.path;

//   // Return the path of the uploaded image
//   res.status(200).json({
//     message: 'Image uploaded successfully',
//     filePath: filePath,
//   });
// })






// Function to extract text from image using Tesseract.js
// const extractTextFromImage = async (filePath) => {
//   const result = await Tesseract.recognize(filePath, 'eng');
//   return result.data.text;
// };

// Function to send extracted text to ChatGPT for analysis
// const analyzeStockChart = async (extractedText) => {
//   const prompt = `
//     Here's the extracted data from a stock chart: ${extractedText}.
//     Please analyze the stock trends, patterns, and provide any predictions you can infer based on this data.
//   `;

//   const response = await openai.createChatCompletion({
//     model: 'gpt-3.5-turbo', // Use the appropriate ChatGPT model
//     messages: [{ role: 'user', content: prompt }],
//   });

//   return response.data.choices[0].message.content;
// };



// const uploadImage = asyncHandler(async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   const filePath = path.join(__dirname, '../public/temp', req.file.filename);

//   try {
//     // Step 1: Extract text from the uploaded image using Tesseract.js
//     const extractedText = await extractTextFromImage(filePath);

//     // Step 2: Analyze the extracted text using ChatGPT
//     const analysis = await analyzeStockChart(extractedText);

//     // Step 3: Send the analysis result back to the client
//     res.status(200).json({
//       message: 'Analysis complete',
//       analysis: analysis,
//     });
//   } catch (error) {
//     console.error('Error processing the image:', error);
//     res.status(500).json({ message: 'Failed to analyze the stock chart image' });
//   }
// });






// const uploadImage2 = asyncHandler(async (req, res) => {
//   // Log uploaded files to verify
//   // console.log('Uploaded files:', req.files);

//   // Check if the files exist in the request
//   if (!req.files || !req.files.image || req.files.image.length === 0) {
//     return res.status(400).json({ message: 'No image uploaded' });
//   }

//   // Get the file path from the uploaded image
//   const filePath = req.files.image[0].path;
//   // console.log('-----',openai.chat.completions.create({model:"gpt-4o"}));

//   const imageAsBase64 = fs.readFileSync(filePath,'base64');
//   console.log("djfkdfjk",imageAsBase64)

//   const response = await openai.chat.completions.create({
//     model: 'gpt-4o-mini', // Use the appropriate ChatGPT model
//     messages: [
//       { role: 'user',
//          content: [ {type:"text",text:"hello"},

//         {type:"image_url ",image_url:{
//           url:`data:image/png;base64,${imageAsBase64}`
//         }},
//       ]
      
//       }],
//   });


// console.log('--->',response);


//   // Return the file path as the response
//   res.status(200).json({
//     message: 'Image uploaded successfully',
//     filePath: filePath,
//   });
// });


const uploadImage = asyncHandler(async (req, res) => {
  // Log uploaded files to verify
  console.log('Uploaded files:', req.files);

  // Check if the files exist in the request
  if (!req.files || !req.files.image || req.files.image.length === 0) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    // Get the file path from the uploaded image
    const filePath = req.files.image[0].path;

    // Read the image file as Base64
    const imageAsBase64 = fs.readFileSync(filePath, 'base64');
    // console.log('Image in Base64:', imageAsBase64);

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use the appropriate ChatGPT model
      messages: [
        {
          role: 'user',
          content: 'Hello, here is an image:', // Text part of the message
        },
        {
          role: 'user',
          content: `data:image/png;base64,${imageAsBase64}`, // Base64 image as a string
        },
      ],
    });

    console.log('---> OpenAI Response:', response);

    // Return a success response
    res.status(200).json({
      message: 'Image uploaded and processed successfully',
      filePath: filePath,
      aiResponse: response.data, // Include the OpenAI response if needed
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Controller to handle image upload, OCR, and ChatGPT analysis







export { 
  loginUser,
   logoutUser,
    registerUser,
     googleLogin,
      getCurrentUser,
       getAllUsersDetails,
         uploadImage,

  //    refreshAccessToken,
  //     changeCurrentPassword,
  //       updateAccountDetails,
  //       UserChannelProfile,
     };




