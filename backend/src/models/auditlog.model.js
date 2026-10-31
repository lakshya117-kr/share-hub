import mongoose, {Schema} from "mongoose";

const auditLogSchema = new Schema({
    bookingId : {
        type : Schema.Types.ObjectId,
        ref : "Booking"
    },
    resourceId : {
        type : Schema.Types.ObjectId,
        ref : "Resource"
    },
    actorId : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    action : {
        type : String,
        required : true
    },
    notes : {
        type : String
    }
}, {timestamps: true});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
