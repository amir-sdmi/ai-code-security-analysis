import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js"
import { uploadonCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose, { isValidObjectId } from "mongoose";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        /*NOTE: whenever we generate the refresh token we need to save it in the database for the further use or to recreate the access token later(after its expiry)*/
        await user.save({ validateBeforeSave: false }) //SINCE IT IS A OBJECT CREATED BY MONGODB SO WE CAN USE SAVE METHOD TO SAVE IT
        /*so when we save anything in the mongoose model we need to have the password field also to validate to avoid that we can use "validateBeforeSave:false " by doing this password field don't get kickin and we can proceed without having the password field*/
        return { accessToken, refreshToken }

    } catch (err) {
        throw new apiError(500, "SOMETHING WENT WRONG WHILE GENERATING REFRESH AND ACCESS TOKEN");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    /*
    step 1: get the user details from the frontend
    step 2: validation of data sent by the user {whether the user has entered all the field or whether the email is in right manner etc}
    step 3: Check if user already exist {through username or by using email id} 
    step 4: Check for images ,check for avatar
    step 5: Upload them to cloudinary,avatar 
    step 6: create user object - create entry in DB
    step 7:remove password and refresh token field from response
    Check for user creation {if created send a response {else return the error response}}
*/
    // we use "req.body()" to get the data from JSON or the forms
    // but we use different things for the the coming from the URL
    /*console.log("THE OUTPUT OF REQ.BODY IS ",req.body);
    THE OUTPUT OF REQ.BODY IS  [Object: null prototype] {
        username: 'uttam',
        email: 'uttam@uttam.com',
        password: '12333',
        fullName: 'uttamSeervi'
    }*/
    const { fullName, email, username, password } = req.body
    // console.log("Email", email);
    // console.log("username", username);
    // console.log("password", password);
    // console.log("fullName", fullName);

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All fields are compulsory")
    }

    const existedUser = await User.findOne({
        /*we can use the inbuilt mongoose operators by using the dollar sign
        there are soo many operators for more ref use chatgpt*/
        $or: [{ username }, { email }]

    })
    if (existedUser) {
        throw new apiError(409, "User with this user name or the email already exist");
    }
    // here in the below middleware {multer} has given much more options like we have body inbuilt in express and we get the access to files attribute from multer
    // what multer does is it add additional functionalities to the request
    /*
    console.log("THE OUTPUT OF REQ.FILES IS",req.files);
    THE OUTPUT OF REQ.FILES IS [Object: null prototype] {
        avatar: [
            {
            fieldname: 'avatar',
            originalname: 'WIN_20230329_14_32_41_Pro.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: './public/temp',
            filename: 'WIN_20230329_14_32_41_Pro.jpg',
            path: 'public\\temp\\WIN_20230329_14_32_41_Pro.jpg',
            size: 376150
            }
        ],
        coverImage: [
            {
            fieldname: 'coverImage',
            originalname: 'pxfuel (1).jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: './public/temp',
            filename: 'pxfuel (1).jpg',
            path: 'public\\temp\\pxfuel (1).jpg',
            size: 1105101
            }
        ]
        }*/
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) throw new apiError(400, "Avatar file is required");
    // add the validation for the cover image from the git

    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if (!avatar) throw new apiError(400, "Avatar file is required")

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    /*WE CAN CHECK WHETHER THE USER IS CREATED OR NOT BY CHECKING ITS ID BECAUSE MONGODB CREATES AN ELEMENT _ID WITH EVERY NEW OBJECT CREATED SO WE CAN USE THAT TO CHECK THE OBJECT IS CREATED OR NOT
    */
    /*SO AS PER THE ABOVE STEPS WE NEED TO REMOVE THE PASSWORD AND REFReSH TOKEN FROM THE DATABASE SO TO DO THAT WE HAVE A METHOD CALLED SELECT {THIS METHOD IS SOMETHING WEIRD} {INITIALLY EVERYTHING IS SELECTED SO TO REMOVE A FIELD WE USE A SYNTAX "-PASSWORD" WE'LL JUST PUT THE "-" INFRonT OF THAT FIELD */
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) throw new apiError(500, "SOMETHING WENT WRONG WHILE REGISTERING THE USER");

    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {

    // todo's:
    // first get the data from the req.body
    // username or email is registered
    // find the user
    // check the password
    // generate access and refresh token and send it to user
    // we send the token to the user via cookies {send cookies}

    const { username, email, password } = req.body
    if (!username && !email) throw new apiError(400, "USERNAME OR EMAIL IS REQUIRED");

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) throw new apiError(404, "USER DOES NOT EXIST");

    const isPasswordValid = await user.isPasswordCorrect(password) //ye password hamne req.body se liya hai
    if (!isPasswordValid) throw new apiError(401, "PASSWORD INCORRECT");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    // console.log("ACCES TOKEN IS ",accessToken);
    // console.log("refresh TOKEN IS ",refreshToken);

    // so here we have to create the one more user object bcoz the above "user" we created has empty refresh and access token in it bcoz we created the tokens using a functions and also we have to remove the unwanted fields also from the user object we took only username email and password but we still got the unwanted fields 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    // we are writing these options for the security of the cookies so that cookies cant be modified by the frontend it can only be modified from the backend
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new apiResponse(200, {
            user: loggedInUser, refreshToken, accessToken
        }, "USER LOGGED IN SUCCESSFULLY")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    // const user = req.user._id
    // here also we can use findById but if we do that then after deleting the tokens we have to save it again and all the circus instead we can use findByIdAndUpdate
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
            // jab value response me return hoke ayegi to new value ayegi old me to refresh token bhi ajjayega
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new apiResponse(200, {}, "User logged out "))
})

const refreshAccessToken = asyncHandler(async (req, res) => {


    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken //ye token hame user bhej raha hai isko hame compare karna hai hamare DB  wale token ke sath
    if (!incomingRefreshToken) throw new apiError(401, "UNAUTHORIZED REQUEST");


    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id);
        if (!user) throw new apiError(401, "INVALID REFRESH TOKEN");
        if (incomingRefreshToken !== user?.refreshToken) throw new apiError(401, " REFRESH TOKEN IS USED OR EXPIRED");

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessToken(user._id);
        return res.
            status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new apiResponse(200, { accessToken, refreshToken: newRefreshToken }, "ACCESS TOKEN REFRESHED SUCCESSFULLY"))


    } catch (error) {
        throw new apiError(401, error?.message || "INVALID REFRESH TOKEN")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id) //check for the bug fixed the bug

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) throw new apiError(400, "INVALID PASSWORD");
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new apiResponse(200, {}, "Password changed Successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new apiResponse(200, req.user, "Current User fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) throw new apiError(400, "All fields are required");
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(new apiResponse(200, user, "Update the account details Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path; // MIGHT BE THE BUG UPDATE IT LATER 

    if (!avatarLocalPath) throw new apiError(400, "AVATAR FILE IS MISSING");

    const avatar = await uploadonCloudinary(avatarLocalPath);

    if (!avatar.url) throw new apiError(400, "ERROR WHILE UPLOADING THE AVATAR");
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password")
    return res.status(200)
        .json(new apiResponse(200, user, "AVATAR UPDATED SUCCESSFULLY"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;// MIGHT BE THE BUG UPDATE IT LATER 
    if (!coverImageLocalPath) throw new apiError(400, "COVER IMAGE FILE IS MISSING");
    const coverImage = await uploadonCloudinary(coverImageLocalPath);
    if (!coverImage.url) throw new apiError(400, "ERROR WHILE UPLOADING THE COVER IMAGE");
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password")
    return res.status(200)
        .json(new apiResponse(200, user, "AVATAR UPDATED SUCCESSFULLY"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;
    if (!username?.trim()) throw new apiError(400, "USERNAME IS MISSING");
    await User.find({ username })

    const channel = User.aggregate([
        {
            $match: {
                username: username?.toLowerCase
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" } /*WE USE DOLLER SYMBOL JUST TO DEMONSTRATE IT AS A FIELD*/,
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    cond: {
                        /*cond {condition has three parameters one is if agar true hai to then warna else}*/
                        if: { $in: [req.user?._id, "$subscribers.subscriber"], then: true, else: false } /*we use in to check whether the user exist in it or not it will work for both arrays and objects z*/
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,

            }/*what will project do????>>>  it will project the fields that we want to see in the result*/ /*we use project to remove the fields that we dont want to see in the result*/


        }
    ])
    if (!channel?.length) throw new apiError(400, "CHANNEL DON'T EXIST");
    return res
        .status(200)
        .json(new apiResponse(200, channel[0], "USER CHANNEL FETCHED SUCCESSFULLY"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos", //MIGHT BE THE BUG FIX IT LATER
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                /*WE USE A METHOD PIPELINE FOR NESTED PIPELINING OR FOR NESTED AGGREGATION*/
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                                // also we can write 
                                // ArrayElementsAt:["$owner"]
                            }
                        }
                    }
                ]
            }
        },
        {}
    ])
    return res
        .status(200)
        .json(new apiResponse(200, user[0].watchHistory, "USER WATCH HISTORY FETCHED SUCCESSFULLY"))
})











export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory }
