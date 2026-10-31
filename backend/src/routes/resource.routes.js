import { Router } from "express";
import {
    createResource,
    getAllResources,
    getResourceById,
    getMyResources,
    updateResource,
    deleteResource,
    toggleResourceStatus
} from "../controllers/resource.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllResources);
router.route("/:resourceId").get(getResourceById);

router.route("/create").post(
    verifyJWT,
    upload.fields([
        { name: "images", maxCount: 5 },
        { name: "termsDocs", maxCount: 1 }
    ]),
    createResource
);

router.route("/my-resources").get(verifyJWT, getMyResources);

router.route("/update/:resourceId").patch(
    verifyJWT,
    upload.fields([
        { name: "images", maxCount: 5 },
        { name: "termsDocs", maxCount: 1 }
    ]),
    updateResource
);

router.route("/delete/:resourceId").delete(verifyJWT, deleteResource);
router.route("/status/:resourceId").patch(verifyJWT, toggleResourceStatus);

export default router;
