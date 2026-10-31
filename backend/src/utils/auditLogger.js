import { AuditLog } from "../models/auditlog.model.js";

export const logAudit = async ({ actorId, action, bookingId, resourceId, notes }) => {
    try {
        await AuditLog.create({
            actorId,
            action,
            bookingId: bookingId || undefined,
            resourceId: resourceId || undefined,
            notes: notes || ""
        });
    } catch (err) {
        console.error("AuditLog write failed:", err.message);
    }
};
