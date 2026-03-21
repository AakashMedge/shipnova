const mongoose = require("mongoose");

const hubChatMessageSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    hub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hub",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["Company Admin", "Hub Manager"],
      required: true,
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

hubChatMessageSchema.index({ tenant_id: 1, hub: 1, createdAt: -1 });

module.exports = mongoose.model("HubChatMessage", hubChatMessageSchema);
