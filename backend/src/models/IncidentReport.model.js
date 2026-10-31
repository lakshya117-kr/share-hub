import mongoose, {Schema} from "mongoose";

const incidentReportSchema = new Schema({
    bookingId : {
        type : Schema.Types.ObjectId,
        ref : "Booking",
        required : true
    },
    resourceId : {
        type : Schema.Types.ObjectId,
        ref : "Resource",
        required : true
    },
    reportedBy : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    type : {
        type: String,
        enum: ["DAMAGE", "LATE_RETURN","MISSING_PARTS","SAFETY_VIOLATION"],
        required : true
    },
    severity : {
        type: String,
        enum: ["LOW", "MEDIUM","HIGH","CRITICAL"],
        required : true
    },
    description : {
        type : String,
        required : true
    },
    image : [{
        type : String
    }],
    status : {
        type: String,
        enum: ["OPEN", "RESOLVED","DISPUTED"],
        default : "OPEN"
    },
    penaltyAmount : {
        type : Number,
        default : 0
    },
    resolutionNote : {
        type : String
    }
}, {timestamps : true})

export  const Incident = mongoose.model("Incident", incidentReportSchema);
