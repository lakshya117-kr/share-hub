import { Router } from "express";
import {
    bookRequestResource,
    confirmBooking,
    pickUpBooking,
    checkoutBooking,
    getBookingTimeline,
    getMyBookings,
    getBookingsForOwner
} from "../controllers/booking.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/request").post(bookRequestResource);
router.route("/confirm").post(confirmBooking);
router.route("/pickup").post(
    upload.fields([
        { name: "images", maxCount: 5 }
    ]),
    pickUpBooking
);

router.route("/checkout").post(
    upload.fields([
        { name: "images", maxCount: 5 }
    ]),
    checkoutBooking
);

router.route("/my-bookings").get(getMyBookings);
router.route("/owner-bookings").get(getBookingsForOwner);
router.route("/:bookingId/timeline").get(getBookingTimeline);

export default router;
