const express = require("express");
const router = express.Router();
const { 
  createHub, 
  getHubs, 
  assignShipmentToHub, 
  getHubById, 
  updateHub,
  getIncomingRequests,
  verifyAndAcceptShipment,
  getShipmentQR,
  getHubQR,
  agentHandover,
  getHubChatMessages,
  postHubChatMessage,
} = require("../controllers/hubController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validate,
  idParamValidator,
  hubIdParamValidator,
  trackingIdParamValidator,
  hubCreateValidators,
  assignShipmentToHubValidators,
  verifyShipmentValidators,
  agentHandoverValidators,
  hubChatMessageValidators,
} = require("../middleware/validators");

// Hub CRUD
router.post("/", protect, authorize("Company Admin"), hubCreateValidators, validate, createHub);
router.get("/", protect, authorize("Company Admin", "Hub Manager"), getHubs);

// QR Code generation for shipment labels (must be before /:id to avoid route conflict)
router.get("/shipment-qr/:trackingId", protect, authorize("Company Admin", "Hub Manager"), trackingIdParamValidator, validate, getShipmentQR);

// Hub detail & update
router.get("/:id", protect, authorize("Company Admin", "Hub Manager"), idParamValidator, validate, getHubById);
router.patch("/:id", protect, authorize("Company Admin"), idParamValidator, hubCreateValidators, validate, updateHub);

// Shipment assignment
router.post("/:hubId/assign-shipment", protect, authorize("Company Admin"), hubIdParamValidator, assignShipmentToHubValidators, validate, assignShipmentToHub);

// Hub Operations Flow
router.get("/:id/incoming", protect, authorize("Hub Manager", "Company Admin"), idParamValidator, validate, getIncomingRequests);
router.post("/:id/verify-shipment", protect, authorize("Hub Manager"), idParamValidator, verifyShipmentValidators, validate, verifyAndAcceptShipment);
router.get("/:id/qr", protect, authorize("Hub Manager", "Company Admin"), idParamValidator, validate, getHubQR);

// Hub chat (isolated by hub + tenant)
router.get("/:id/chat", protect, authorize("Company Admin", "Hub Manager"), idParamValidator, validate, getHubChatMessages);
router.post("/:id/chat", protect, authorize("Company Admin", "Hub Manager"), idParamValidator, hubChatMessageValidators, validate, postHubChatMessage);

// Agent Handover (Agent scans hub + parcels)
router.post("/:id/agent-handover", protect, authorize("Agent"), idParamValidator, agentHandoverValidators, validate, agentHandover);

module.exports = router;
