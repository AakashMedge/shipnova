const AuditLog = require("../models/AuditLog");
const { getTenantIdFromUser } = require("./tenantId");

/**
 * Creates an audit log entry.
 * @param {Object} req - The express request object (containing user and tenant info)
 * @param {Object} params - Logging parameters
 * @param {String} params.action - The action being performed (e.g., "STATUS_UPDATE")
 * @param {String} params.entityType - Type of entity ("Shipment", "Hub", etc.)
 * @param {String} params.entityId - ID of the entity
 * @param {String} params.details - Additional human-readable details
 */
const logAction = async (req, { action, entityType, entityId, details }) => {
  try {
    await AuditLog.create({
      user: req.user._id,
      tenant_id: getTenantIdFromUser(req.user),
      action,
      entityType,
      entityId,
      details,
    });
  } catch (error) {
    console.error("Critical: Failed to record audit log entry.", error);
  }
};

module.exports = logAction;
