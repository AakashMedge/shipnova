const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a courier company name"],
      trim: true,
      unique: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ["Starter", "Professional", "Enterprise"],
      default: "Starter",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tenant", tenantSchema);
