import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import { User} from "../models/user.model.js";
import { ApiResponce } from "../utils/ApiRespoce.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateRefreshtokenAndAccessToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
        return {accessToken , refreshToken}
    } catch (error) {
        console.log("Error while generating access and refresh token", error);
        throw new ApiError(500,"Something went wrong during generation of access and refresh token")
    }
}


const registerUser = asyncHandler(async (req,res) => {

    const {username, email,password,fullname , IdentityNumber} = req.body
    
    if(
        [username,email,password,fullname,IdentityNumber].some((field) => field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required");
    }
    
    const requiredUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(requiredUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    let avatarlocalpath = req.files?.avatar[0]?.path
    if(!avatarlocalpath){
        throw new ApiError(400, "Avatar is required");
    }
    let coverimagelocalpath=req.files?.coverImage[0]?.path

    const avatar = await uploadOnCloudinary(avatarlocalpath)
    const coverImage = await uploadOnCloudinary(coverimagelocalpath)

    if(!avatar){
        throw new ApiError(400,"All fields are required");
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase(),
        email,
        IdentityNumber,
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponce(200,createdUser,"User Resgisytered Successfully")
    )
   
})

const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    const {email,username, password} = req.body
    if(!username && !email){
        throw new ApiError(400, "username and email is necessary for login")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    if(!user){
        throw new ApiError(400,"User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(400,"Invalid Password")
    }

    const {accessToken , refreshToken }= await generateRefreshtokenAndAccessToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken, option)
    .cookie("refreshToken" , refreshToken, option)
    .json(
        new ApiResponce(
            200,
            {
                user : loggedInUser, accessToken,  refreshToken
            },
            "User logged in seccessfully"
        )
    )


})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
        }
    )
    const option = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(new ApiResponce(200, {}, "User logged out"))
    
})

const changePassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body
    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Old password and new password is required")
    }

    const user = await User.findById(req.user?._id)

    const isPasswordcorrect = await user.isPasswordCorrect(oldPassword) 
    if(!isPasswordcorrect){
        throw new ApiError(400,"Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(
        new ApiResponce(200,{},"Password is changed successfully")
    )
})


const updateUserAvatar = asyncHandler(async (req,res) => {
    let avatarlocalpath = req.file?.path
    if(!avatarlocalpath){
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarlocalpath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar to cloudinary");
    }
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(404,"User not found");
    }
    const oldAvatarurl = user.avatar
    
    const uploadedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                avatar : avatar.url
            },
        },
        {
            new : true
        }.select("-password")
    )

    if(oldAvatarurl){
        await deleteFromCloudinary(oldAvatarurl)
    }

    return res
    .status(200)
    .json(
        new ApiResponce(200, uploadedUser, "User avatar updated sucessfully")
    )
})

const updateDetails = asyncHandler(async (req,res) => {
    const {fullname, email} = req.body
    if(!fullname && !email){
        throw new ApiError(400,"Fullname or email is required to update")
    }

    const fieldToUpdate = {}
    if(fullname?.trim()){
        fieldToUpdate.fullname = fullname
    }
    if(email?.trim()){
        fieldToUpdate.email = email
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : fieldToUpdate

        },
        {
            new : true
        }

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponce(200,user,"User detail updated successfully"))

})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(new ApiResponce(200,req.user,"Current user fetched successfully"))
})

export {
    registerUser, 
    loginUser,
    logoutUser,
    updateUserAvatar,
    changePassword,
    updateDetails,
    getCurrentUser
};