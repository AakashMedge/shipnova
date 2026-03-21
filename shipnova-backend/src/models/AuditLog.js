const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ["Shipment", "Hub", "Agent", "Tenant"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
    tenant_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Tenant",
       required: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
