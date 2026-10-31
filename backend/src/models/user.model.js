import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase : true,
        trim : true,
        index : true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase : true,
        trim : true
    },
    fullname:{
        type: String,
        required: true,
        trim : true,
        index: true
    },
    avatar:{
        type : String,
        required : true
    },
    coverImage:{
        type : String,
    },
    resources : [{
        type : Schema.Types.ObjectId,
        ref : "Resource"
    }],
    history : [{
        type : Schema.Types.ObjectId,
        ref : "Booking"
    }],
    qualification : [{
        type : Schema.Types.ObjectId,
        ref : "Qualification"
    }],
    // TODO: implement history,qualification,resouce in user part
    password : {
        type : String,
        required : [true, "Password is required"]
    },
    trustScore : {
        type : Number,
        default : 100
    },
    IdentityNumber : {
        type : Number,
        unique : true,
        required : true
    },
    isIdentityVerified : {
        type: Boolean,
        default : false
    },
    role : {
        type: String,
        enum: ["USER", "OWNER", "ADMIN"],
        default: "USER"
    },
    refreshToken : {
        type : String
    }


}, {timestamps: true});

userSchema.pre("save",async function(){
    if(!this.isModified("password")) return ;
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        username : this.username,
        email : this.email
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id,
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}

export  const User = mongoose.model("User", userSchema);