import { asyncHandler } from "../utils/asyncHandler.js";
import { Booking } from "../models/booking.model.js"
import { Resource } from "../models/resource.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiRespoce.js";

const bookRequestResource = asyncHandler(async(req,res) => {
    const { resouceId, purpose,startDate , endtDate } = req.body
    const owner = req.user._id;
     if(
        [resouceId,purpose].some((field) => field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required");
    }
    const bookedItem = await Booking.create({
        resouceId,
        purpose,
        owner,
        startDate,
        endtDate
    })
    if(!bookedItem){
        throw new ApiError(500,"Something went wrong while booking request this resorce")
    }

    return res.status(201).json(
        new ApiResponce(200,"Request sent sucessfully",bookedItem)
    );
})

const confirmBooking = asyncHandler(async(req,res)=>{
    const { resouceId, status, bookingId } = req.body
    if(
        [resouceId,status].some((field) => field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required");
    }
    const resource = await Resource.findById(resouceId);

    if(!resource){
        throw new ApiError(400,"Wrong resource id");
    }
    const userid=req.user._id;

    if(resource.ownerId != userid){
        throw new ApiError(400,"Owner of this resource can only confirm this booking");
    }


     
    const fieldToUpdate = {}
    fieldToUpdate.status = status
    if(status === "REJECTED"){
        const { rejectionReason } = req.body
        if(rejectionReason.trim()===""){
            throw new ApiError(400,"All fields are required");
        }

        fieldToUpdate.rejectionReason = rejectionReason;
        

    }
    else{
        const { totalPrice } = req.body
        fieldToUpdate.totalPrice = totalPrice;
    }

    const bookedItem = await User.findByIdAndUpdate(
            bookingId,
            {
                $set : fieldToUpdate
    
            },
            {
                new : true
            }
    
    )
    if(!bookedItem){
        throw new ApiError(400,"Wrong booking id");
    }

    return res.status(201).json(
        new ApiResponce(200,"Booking confirmation done",bookedItem)
    );

})

const pickUpBooking = asyncHandler(async(req,res) => {
    const { actualCheckInDate } = req.body
    
})