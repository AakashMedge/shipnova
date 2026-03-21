const mongoose = require("mongoose");

const shipmentEventSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    status: {
      type: String,
      required: [true, "Status is required for every tracking update"],
    },
    message: {
      type: String, // Optional: e.g., "Picked up from Warehouse A"
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The admin or agent who made the update
      required: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ShipmentEvent", shipmentEventSchema);
