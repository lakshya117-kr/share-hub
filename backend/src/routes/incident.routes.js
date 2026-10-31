import { Router } from "express";
import {
    createIncident,
    getIncidentsByBooking,
    getIncidentsByResource,
    resolveIncident,
    getIncidentById
} from "../controllers/incident.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create").post(
    upload.fields([
        { name: "images", maxCount: 5 }
    ]),
    createIncident
);

router.route("/booking/:bookingId").get(getIncidentsByBooking);
router.route("/resource/:resourceId").get(getIncidentsByResource);
router.route("/:incidentId").get(getIncidentById);
router.route("/resolve/:incidentId").patch(resolveIncident);

export default router;
