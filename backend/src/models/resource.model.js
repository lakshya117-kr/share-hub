import mongoose, {Schema} from "mongoose";

const resourceSchema = new Schema({
     ownerId : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    category : {
        type: String,
        enum: ["SERVICE", "PRODUCT"],
        required : true
    },
    image : [{
        type : String
    }],
    location : {
        type : {
            firstLine : String,
            secondLine : String,
            country : String,
            state : String
        },
        required : true
    },
    pricingType : {
        type: String,
        enum: ["PER_DAY", "PER_HOUR"],
        required : true
    },
    pricePerUnit : {
        type : Number,
        required : true
    },
    securityDeposit : {
        type : Number,
        required : true
    },
    termsAndCondition : {
        type : String,
        required : true
    },
    termsDocs : {
        type : String
    },
    requiredQualification : [{
        type : String
    }],
    requireSupervision : {
        type : Boolean,
        default : false
    },
    status : {
        type: String,
        enum: ["AVAILABLE", "IN_USE","MAINTENANCE"],
        default : "AVAILABLE"
    },
    maxBookingDays : {
        type : Number,
        required : true
    }
}, {timestamps: true});

export  const Resource = mongoose.model("Resource", resourceSchema);