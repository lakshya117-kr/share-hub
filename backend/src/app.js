import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/user.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import incidentRouter from "./routes/incident.routes.js";
import qualificationRouter from "./routes/qualification.routes.js";

app.use("/api/v1/users",userRouter)
app.use("/api/v1/resources",resourceRouter)
app.use("/api/v1/bookings",bookingRouter)
app.use("/api/v1/incidents",incidentRouter)
app.use("/api/v1/qualifications",qualificationRouter)


export { app };