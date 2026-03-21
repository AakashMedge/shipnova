const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a plan name"],
      unique: true,
      trim: true,
    },
    price: {
      type: String,
      default: "$0",
    },
    description: {
      type: String,
    },
    features: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Plan", planSchema);
