import { asyncHandler } from "../utils/asyncHandler.js";
import { Booking } from "../models/booking.model.js"
import { Resource } from "../models/resource.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiRespoce.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const bookRequestResource = asyncHandler(async(req,res) => {
    const { resouceId, purpose,startDate , endDate } = req.body
    const owner = req.user._id;
     if(
        [resouceId,purpose,startDate,endDate].some((field) => field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required");
    }
    const bookedItem = await Booking.create({
        resouceId,
        purpose,
        owner,
        startDate,
        endDate
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

    if(resource.ownerId.toString() !== userid.toString()){
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

    const bookedItem = await Booking.findByIdAndUpdate(
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
endDate
const pickUpBooking = asyncHandler(async(req,res) => {
    const { actualCheckInDate, bookingId, conditionRating, conditionNote } = req.body

    const status = "CHECKED_IN"

    const imageLocalFiles = req.files?.images;
    if (!imageLocalFiles || imageLocalFiles.toString().length === 0) {
      throw new ApiError(400, "At least one resource image is required");
    }
    const uploadPromises = imageLocalFiles.map((file) => uploadOnCloudinary(file.path));

    const uploadResults = await Promise.all(uploadPromises);

    const imageUrls = uploadResults
      .filter((result) => result !== null)
      .map((result) => result.secure_url || result.url);

      const fieldToUpdate = {}
      fieldToUpdate.actualCheckInDate = actualCheckInDate || new Date();
      fieldToUpdate.status = status;
      fieldToUpdate.beforePhotoURI = imageUrls;
      if (conditionRating) {
        fieldToUpdate.conditionRating = conditionRating;
      }
      if (conditionNote) {
        fieldToUpdate.conditionNote = conditionNote;
      }

    const bookedItem = await Booking.findByIdAndUpdate(
            bookingId,
            {
                $set : fieldToUpdate
    
            },
            {
                new : true
            }
    
    )

    return res.status(201).json(
        new ApiResponce(200,"Booking Check In confirmed",bookedItem)
    ); 
})




export {
    bookRequestResource,
    confirmBooking,
    pickUpBooking
}