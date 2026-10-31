import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import { User} from "../models/user.model.js";
import { Qualification } from "../models/userqualification.model.js"
import { ApiResponce } from "../utils/ApiRespoce.js";

const putQualification = asyncHandler(async(req,res) => {
    const {qualificationName,certificateNumber} = req.body
    const userid = req.user._id
    if (
        [qualificationName].some(
            (field) => !field || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All required fields must be provided");
    }

    let certificatelocalpath = req.file?.path || req.files?.proofDocument?.[0]?.path || req.files?.proofDocument?.path;
    if(!certificatelocalpath){
        throw new ApiError(400,"Proof of certificate is required")
    }
    const certificate = await uploadOnCloudinary(certificatelocalpath)

    if(!certificate){
        throw new ApiError(400,"Certificate is required")
    }

    const qualification = await Qualification.create({
        userid,
        qualificationName,
        certificateNumber,
        proofDocument : certificate?.url || ""
    })

    if(!qualification){
        throw new ApiError(200,"Error while creating qualification")
    }
    const user = await User.findByIdAndUpdate(
        userid,
	{
            $addToSet: {
                qualification: qualification._id
            }
	},
        { new: true }
    ).select("-password");

    return res.status(201).json(
        new ApiResponce(200,"Qualification is added to verify",user)
    )
})

const verifyQualification = asyncHandler(async (req, res) => {
        const { qualificationId } = req.params;
        const { status, rejectionReason } = req.body; 

        if (!["APPROVED", "REJECTED"].includes(status)) {
            throw new ApiError(400, "Status must be either APPROVED or REJECTED");
        }

        const qualification = await Qualification.findById(qualificationId);
        if (!qualification) {
            throw new ApiError(404, "Qualification not found");
        }

        qualification.status = status;
        qualification.verifiedBy = req.user._id; 
        if (status === "REJECTED" && rejectionReason) {
            qualification.rejectionReason = rejectionReason;
        }

        await qualification.save();

        return res.status(200).json(
            new ApiResponce(200, `Qualification ${status.toLowerCase()} successfully`, qualification)
        );
})

const getMyQualifications = asyncHandler(async (req, res) => {
    const qualifications = await Qualification.find({ userid: req.user._id })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponce(200, "Qualifications fetched successfully", qualifications)
    );
});

export {
    putQualification,
    verifyQualification,
    getMyQualifications
}