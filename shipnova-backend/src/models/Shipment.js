const mongoose = require("mongoose");
const crypto = require("crypto");

const shipmentSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      default: () => `SN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
    customerName: {
      type: String,
      required: [true, "Please add a customer name"],
    },
    customerEmail: {
      type: String,
      required: [true, "Please add a customer email"],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please add a phone number"],
    },
    packageDetails: {
      type: String,
      required: [true, "Please add package details"],
    },
    status: {
      type: String,
      enum: ["Created", "Picked Up", "At Sorting Facility", "In Transit", "Out for Delivery", "Delivered", "Failed / Retry / Returned"],
      default: "Created",
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hub",
      default: null,
    },
    proofOfDelivery: {
      type: String, // URL to uploaded image
      default: null,
    },
    proofOfPickup: {
      type: String, // URL to uploaded image for agent hub handover
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    // Industry-Grade Add-ons
    currentLat: { type: Number, default: null },
    currentLong: { type: Number, default: null },
    podSignature: { type: String, default: null }, // Digital Signature String
    deliveryToken: { type: String, default: null }, // Cryptographic HMAC Integrity Token
    isBulkUploaded: { type: Boolean, default: false },
    history: [
      {
        status: String,
        message: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deliveryOTP: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(), // Generate 4-digit OTP
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    aiInsights: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
