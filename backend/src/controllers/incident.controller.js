import { asyncHandler } from "../utils/asyncHandler.js";
import { Incident } from "../models/IncidentReport.model.js";
import { Booking } from "../models/booking.model.js";
import { Resource } from "../models/resource.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiRespoce.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { logAudit } from "../utils/auditLogger.js";

const createIncident = asyncHandler(async (req, res) => {
    const { bookingId, type, severity, description } = req.body;

    if (
        [bookingId, type, severity, description].some(
            (field) => !field || field?.trim?.() === ""
        )
    ) {
        throw new ApiError(400, "bookingId, type, severity and description are required");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const resource = await Resource.findById(booking.resouceId);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    const userId = req.user._id;
    const isBorrower = booking.owner.toString() === userId.toString();
    const isOwner = resource.ownerId.toString() === userId.toString();

    if (!isBorrower && !isOwner) {
        throw new ApiError(403, "Only the borrower or resource owner can report an incident");
    }

    let imageUrls = [];
    if (req.files?.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map((file) =>
            uploadOnCloudinary(file.path)
        );
        const uploadResults = await Promise.all(uploadPromises);
        imageUrls = uploadResults
            .filter((result) => result !== null)
            .map((result) => result.secure_url || result.url);
    }

    const incident = await Incident.create({
        bookingId: booking._id,
        resourceId: booking.resouceId,
        reportedBy: userId,
        type,
        severity,
        description,
        image: imageUrls
    });

    if (!incident) {
        throw new ApiError(500, "Something went wrong while creating incident report");
    }

    await Booking.findByIdAndUpdate(
        bookingId,
        { $push: { incidents: incident._id } },
        { new: true }
    );

    if (["HIGH", "CRITICAL"].includes(severity)) {
        const deduction = severity === "CRITICAL" ? 20 : 10;
        await User.findByIdAndUpdate(
            booking.owner,
            { $inc: { trustScore: -deduction } }
        );
    }

    await logAudit({
        actorId: userId,
        action: "INCIDENT_REPORTED",
        bookingId: booking._id,
        resourceId: booking.resouceId,
        notes: `Incident [${type}] reported with severity ${severity}: ${description}`
    });

    return res.status(201).json(
        new ApiResponce(200, "Incident report created successfully", incident)
    );
});

const getIncidentsByBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const incidents = await Incident.find({ bookingId })
        .populate("reportedBy", "fullname username avatar")
        .populate("resourceId", "title")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponce(200, "Incidents fetched successfully", incidents)
    );
});

const getIncidentsByResource = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    if (resource.ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the resource owner can view incidents for this resource");
    }

    const incidents = await Incident.find({ resourceId })
        .populate("reportedBy", "fullname username avatar")
        .populate("bookingId", "startDate endDate status")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponce(200, "Incidents fetched successfully", incidents)
    );
});

const resolveIncident = asyncHandler(async (req, res) => {
    const { incidentId } = req.params;
    const { status, resolutionNote, penaltyAmount } = req.body;

    if (!status || !["RESOLVED", "DISPUTED"].includes(status)) {
        throw new ApiError(400, "Status must be RESOLVED or DISPUTED");
    }

    const incident = await Incident.findById(incidentId);
    if (!incident) {
        throw new ApiError(404, "Incident not found");
    }

    const resource = await Resource.findById(incident.resourceId);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    if (resource.ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the resource owner can resolve this incident");
    }

    incident.status = status;
    if (resolutionNote) {
        incident.resolutionNote = resolutionNote;
    }
    if (penaltyAmount !== undefined) {
        incident.penaltyAmount = penaltyAmount;
    }

    await incident.save();

    if (penaltyAmount && penaltyAmount > 0) {
        const booking = await Booking.findById(incident.bookingId);
        if (booking) {
            await User.findByIdAndUpdate(
                booking.owner,
                { $inc: { trustScore: -5 } }
            );
        }
    }

    await logAudit({
        actorId: req.user._id,
        action: status === "RESOLVED" ? "INCIDENT_RESOLVED" : "INCIDENT_DISPUTED",
        bookingId: incident.bookingId,
        resourceId: incident.resourceId,
        notes: `Incident ${status}. Penalty: ${penaltyAmount || 0}. Note: ${resolutionNote || "None"}`
    });

    return res.status(200).json(
        new ApiResponce(200, `Incident ${status.toLowerCase()} successfully`, incident)
    );
});

const getIncidentById = asyncHandler(async (req, res) => {
    const { incidentId } = req.params;

    const incident = await Incident.findById(incidentId)
        .populate("reportedBy", "fullname username avatar")
        .populate("resourceId", "title image")
        .populate("bookingId", "startDate endDate status owner");

    if (!incident) {
        throw new ApiError(404, "Incident not found");
    }

    return res.status(200).json(
        new ApiResponce(200, "Incident fetched successfully", incident)
    );
});

export {
    createIncident,
    getIncidentsByBooking,
    getIncidentsByResource,
    resolveIncident,
    getIncidentById
};
