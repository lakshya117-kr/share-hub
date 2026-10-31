import { Router } from "express";
import {
     registerUser, 
     loginUser, 
     logoutUser,
     updateUserAvatar,
     changePassword,
     updateDetails,
     getCurrentUser
} from "../controllers/user.controller.js";

import { maxHeaderSize } from "http";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount : 1
        }
    ])
    ,registerUser);
    router.route("/login").post(loginUser)

    //secured route
    router.route("/logout").post(verifyJWT,logoutUser)
    router.route("/change-password").post(verifyJWT,changePassword)
    router.route("/update-details").post(verifyJWT,updateDetails)
    router.route("/get_user").get(verifyJWT,getCurrentUser)

    router.route("/update-avatar").post(verifyJWT,upload.single("avatar"),updateUserAvatar)
    
export default router;