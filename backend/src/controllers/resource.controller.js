import { asyncHandler } from "../utils/asyncHandler.js";
import { Resource } from "../models/resource.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiRespoce.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const createResource = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        location,
        pricingType,
        pricePerUnit,
        securityDeposit,
        termsAndCondition,
        requiredQualification,
        requireSupervision,
        maxBookingDays
    } = req.body;

    if (
        [title, description, category, pricingType, termsAndCondition].some(
            (field) => !field || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All required fields must be provided");
    }

    if (!pricePerUnit || !securityDeposit || !maxBookingDays) {
        throw new ApiError(400, "pricePerUnit, securityDeposit and maxBookingDays are required");
    }

    const imageLocalFiles = req.files?.images;
    if (!imageLocalFiles || imageLocalFiles.length === 0) {
        throw new ApiError(400, "At least one resource image is required");
    }

    const uploadPromises = imageLocalFiles.map((file) =>
        uploadOnCloudinary(file.path)
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults
        .filter((result) => result !== null)
        .map((result) => result.secure_url || result.url);

    if (imageUrls.length === 0) {
        throw new ApiError(500, "Failed to upload resource images");
    }

    let termsDocUrl = "";
    if (req.files?.termsDocs?.[0]?.path) {
        const termsResult = await uploadOnCloudinary(req.files.termsDocs[0].path);
        termsDocUrl = termsResult?.secure_url || termsResult?.url || "";
    }

    let parsedLocation = location;
    if (typeof location === "string") {
        try {
            parsedLocation = JSON.parse(location);
        } catch (err) {
            throw new ApiError(400, "Invalid location format. Send as JSON object.");
        }
    }
    let parsedQualifications = requiredQualification || [];
    if (typeof requiredQualification === "string") {
        try {
            parsedQualifications = JSON.parse(requiredQualification);
        } catch (err) {
            parsedQualifications = [requiredQualification];
        }
    }

    const resource = await Resource.create({
        ownerId: req.user._id,
        title,
        description,
        category,
        image: imageUrls,
        location: parsedLocation,
        pricingType,
        pricePerUnit,
        securityDeposit,
        termsAndCondition,
        termsDocs: termsDocUrl,
        requiredQualification: parsedQualifications,
        requireSupervision: requireSupervision || false,
        maxBookingDays
    });

    if (!resource) {
        throw new ApiError(500, "Something went wrong while creating the resource");
    }

    return res.status(201).json(
        new ApiResponce(200, "Resource created successfully", resource)
    );
});


const getAllResources = asyncHandler(async (req, res) => {
    const { category, search, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) {
        filter.status = status;
    } else {
        filter.status = "AVAILABLE";
    }

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const resources = await Resource.find(filter)
        .populate("ownerId", "fullname username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Resource.countDocuments(filter);

    return res.status(200).json(
        new ApiResponce(200, "Resources fetched successfully", {
            resources,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        })
    );
});



const getResourceById = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId)
        .populate("ownerId", "fullname username avatar email");

    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    const activeBookings = await Booking.find({
        resouceId: resourceId,
        status: { $in: ["APPROVED", "CHECKED_IN"] }
    }).select("startDate endDate status");

    return res.status(200).json(
        new ApiResponce(200, "Resource fetched successfully", {
            resource,
            activeBookings
        })
    );
});



const getMyResources = asyncHandler(async (req, res) => {
    const resources = await Resource.find({ ownerId: req.user._id })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponce(200, "Your resources fetched successfully", resources)
    );
});



const updateResource = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    const activeBookings = await Booking.findOne({
        resouceId: resourceId,
        status: { $in: ["APPROVED", "CHECKED_IN", "PENDING_APPROVAL"] }
    });

    if (activeBookings) {
        throw new ApiError(
            400,
            "Cannot delete resource with active or pending bookings. Cancel or complete them first."
        );
    }

    if (resource.ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can update this resource");
    }

    const {
        title,
        description,
        category,
        location,
        pricingType,
        pricePerUnit,
        securityDeposit,
        termsAndCondition,
        requiredQualification,
        requireSupervision,
        status,
        maxBookingDays
    } = req.body;

    const fieldToUpdate = {};
    if (title?.trim()) fieldToUpdate.title = title;
    if (description?.trim()) fieldToUpdate.description = description;
    if (category?.trim()) fieldToUpdate.category = category;
    if (pricingType?.trim()) fieldToUpdate.pricingType = pricingType;
    if (termsAndCondition?.trim()) fieldToUpdate.termsAndCondition = termsAndCondition;
    if (pricePerUnit !== undefined) fieldToUpdate.pricePerUnit = pricePerUnit;
    if (securityDeposit !== undefined) fieldToUpdate.securityDeposit = securityDeposit;
    if (maxBookingDays !== undefined) fieldToUpdate.maxBookingDays = maxBookingDays;
    if (requireSupervision !== undefined) fieldToUpdate.requireSupervision = requireSupervision;
    if (status?.trim()) fieldToUpdate.status = status;

    if (location) {
        let parsedLocation = location;
        if (typeof location === "string") {
            try {
                parsedLocation = JSON.parse(location);
            } catch (err) {
                throw new ApiError(400, "Invalid location format");
            }
        }
        fieldToUpdate.location = parsedLocation;
    }

    if (requiredQualification) {
        let parsed = requiredQualification;
        if (typeof requiredQualification === "string") {
            try {
                parsed = JSON.parse(requiredQualification);
            } catch (err) {
                parsed = [requiredQualification];
            }
        }
        fieldToUpdate.requiredQualification = parsed;
    }

    if (req.files?.images && req.files.images.length > 0) {
        const uploadPromises = req.files.images.map((file) =>
            uploadOnCloudinary(file.path)
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newImageUrls = uploadResults
            .filter((result) => result !== null)
            .map((result) => result.secure_url || result.url);

        fieldToUpdate.image = [...resource.image, ...newImageUrls];
    }

    if (req.files?.termsDocs?.[0]?.path) {
        const termsResult = await uploadOnCloudinary(req.files.termsDocs[0].path);
        if (termsResult) {
            fieldToUpdate.termsDocs = termsResult.secure_url || termsResult.url;
        }
    }

    const updatedResource = await Resource.findByIdAndUpdate(
        resourceId,
        { $set: fieldToUpdate },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponce(200, "Resource updated successfully", updatedResource)
    );
});


const deleteResource = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    if (resource.ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can delete this resource");
    }

    const activeBookings = await Booking.findOne({
        resouceId: resourceId,
        status: { $in: ["APPROVED", "CHECKED_IN", "PENDING_APPROVAL"] }
    });

    if (activeBookings) {
        throw new ApiError(
            400,
            "Cannot delete resource with active or pending bookings. Cancel or complete them first."
        );
    }

    await Resource.findByIdAndDelete(resourceId);

    return res.status(200).json(
        new ApiResponce(200, "Resource deleted successfully", {})
    );
});



const toggleResourceStatus = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;
    const { status } = req.body;

    if (!status || !["AVAILABLE", "IN_USE", "MAINTENANCE"].includes(status)) {
        throw new ApiError(400, "Valid status is required (AVAILABLE, IN_USE, MAINTENANCE)");
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
        throw new ApiError(404, "Resource not found");
    }

    if (resource.ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the owner can change resource status");
    }

    resource.status = status;
    await resource.save();

    return res.status(200).json(
        new ApiResponce(200, "Resource status updated", resource)
    );
});


export {
    createResource,
    getAllResources,
    getResourceById,
    getMyResources,
    updateResource,
    deleteResource,
    toggleResourceStatus
};
