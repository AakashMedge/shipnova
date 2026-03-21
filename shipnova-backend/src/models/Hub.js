const mongoose = require("mongoose");

const hubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a Hub name"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Please add a location/address"],
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hubCode: {
      type: String,
      unique: true,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hub", hubSchema);
