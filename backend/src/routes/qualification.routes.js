import { Router } from "express";
import {
    putQualification,
    verifyQualification,
    getMyQualifications
} from "../controllers/qualification.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/submit").post(
    upload.fields([
        { name: "proofDocument", maxCount: 1 }
    ]),
    putQualification
);

router.route("/my").get(getMyQualifications);
router.route("/verify/:qualificationId").patch(verifyQualification);

export default router;
