import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const bookingSchema = new Schema({ 
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    resouceId : {
        type : Schema.Types.ObjectId,
        ref : "Resource",
        required : true
    },
    startDate : {
        type : Date,
        required : true
    },
    endtDate : {
        type : Date,
        required : true
    },
    actualCheckInDate : {
        type : Date,
    },
    actualReturnDate : {
        type : Date,
    },
    purpose : {
        type : String,
        required : true
    },
    totalPrice : {
        type : Number,
    },
    depositStatus : {
        type: String,
        enum: ["NOT_PAID", "PENDING", "COMPLETED"],
        default: "NOT_PAID"
    },
    status : {
        type: String,
        enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED","RETURNED","CANCELLED","OVERDUE"],
        default: "PENDING_APPROVAL"
    },
    rejectionReason : {
        type : String,
    },
    conditionRating : {
        type: String,
        enum: ["GOOD", "FAIR", "DAMAGED"],
        default: "GOOD"
    },
    beforePhotoURI : [{
        type : String,
    }],
    afterPhotoURI : [{
        type : String,
    }],
    conditionNote : {
        type : String,
    }


}, {timestamps: true});

// videoSchema.plugin(mongooseAggregatePaginate);

export  const Booking = mongoose.model("Booking", bookingSchema);