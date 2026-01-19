import User from '../models/User.js'
import Message from '../models/Message.js'
import cloudinary from '../lib/cloudinary.js'
import {io,userSocketMap} from'../server.js'
import mongoose from 'mongoose'


export const getUserForSidebar=async(req,res)=>{
    try{
        const userId =req.user._id
        console.log("userID",userId)
        const filteredUsers=await User.find({_id:{$ne:userId}}).select("-password") //$ne means not equal.Accessing all users of database.-password removes password property


        const unseenMessages={}
        const promises=filteredUsers.map(async(user)=>{
            const messages =await Message.find({
                senderId: user._id,
                receiverId:userId,
                seen:false
            })
            if(messages.length >0){
                unseenMessages[user._id]= messages.length
            }
        })

        //I am setting promises array with promises which are void bcoz no return used,they only execute.use chatgpt to covert it in resolve reject too.
        await Promise.all(promises)
        res.json({success:true,filteredUsers,unseenMessages})

    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}


export const getMessages = async(req,res)=>{
    try{
        const {id:selectedUserId}=req.params;
        const myId=req.user._id

        const messages=await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId}
            ]
        })

        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true})

        res.json({success:true,messages})
    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}


export const markMessageAsSeen=async (req,res)=>{
    try{
        const {id}=req.params 
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})

    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}

export const sendMessage=async(req,res)=>{
    try{
        const {text,image}=req.body
        const receiverId=req.params.id
        const senderId=req.user._id

        let imageUrl;
        if(image){
            const uploadResponse=await cloudinary.uploader.upload(image)
            imageUrl=uploadResponse.secure_url
        }

        const newMessage= await Message.create({
            senderId,receiverId,text,image:imageUrl
        })

        //socket
        const receiverSocketId=userSocketMap[receiverId]
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.json({success:true,newMessage})
    }catch(e){
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}