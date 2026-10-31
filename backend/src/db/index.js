import mongoose from "mongoose";
import { DB_NAME } from "./../constants.js";

const connectDB = async () => {
    try {
        const connectIstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected : ${connectIstant.connection.host}`);

    }catch(err){
        console.log("ERROR while connecting" , err);
        process.exit(1);
    }
}

export default connectDB;