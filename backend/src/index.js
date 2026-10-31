import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config(
    {
        path: "./.env"
    }
);

connectDB()
.then(() => {
    app.on("error", (err) => {
            console.log("ERR: ", err);
            throw err;
        })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running : ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("Error while connecting to database", err);
})

// ( async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", (err) => {
//             console.log("ERR: ", err);
//             throw err;
//         })
//         app.listen 
//     } catch(err){
//         console.log("Error while connecting to database", err);
//         throw err;
//     }
// })()