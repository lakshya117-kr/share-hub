import mongoose, {Schema} from "mongoose";

const userQualificationSchema = new Schema({
    userid : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    qualificationName : {
        type : String,
        required: true
    },
    certificateNumber : {
        type : String,
    },
    proofDocument : {
        type : String,
        required : true
    },
    status : {
        type: String,
        enum: ["PENDING", "APPROVED","REJECTED"],
        default : "PENDING"
    },
    verifiedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }

}, {timestamps: true})

export  const Qualification = mongoose.model("Qualification", userQualificationSchema);