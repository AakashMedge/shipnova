const express = require("express");
const router = express.Router();
const {
  createShipment,
  assignAgent,
  updateStatus,
  getShipments,
  getShipmentById,
  trackShipment,
  getAnalytics,
  verifyHub,
  bulkUpdateStatus,
  optimizeRoute,
} = require("../controllers/shipmentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { trackingLimiter } = require("../middleware/rateLimiter");
const {
  validate,
  shipmentValidators,
  statusValidators,
  idParamValidator,
  trackingIdParamValidator,
  assignAgentValidators,
  bulkStatusValidators,
  verifyHubValidators,
  shipmentDetailsUpdateValidators,
} = require("../middleware/validators");

// ─── Static routes MUST come before /:id to avoid route conflicts ───

// Private Routes (Admin or Agents)
router.post("/", protect, authorize("Super Admin", "Company Admin"), shipmentValidators, validate, createShipment);
router.get("/analytics", protect, authorize("Company Admin"), getAnalytics);

// Hub Verification (Agent checks into a hub)
router.post("/verify-hub", protect, verifyHubValidators, validate, verifyHub);

// Bulk status update (Agent handover)
router.patch("/bulk/status", protect, bulkStatusValidators, validate, bulkUpdateStatus);

// Public tracking API (rate limited)
router.get("/track/:trackingId", trackingLimiter, trackingIdParamValidator, validate, trackShipment);

// Route Optimization (Feature 2)
router.post("/optimize-route", protect, authorize("Agent"), optimizeRoute);

// Universal Scanning Route (Supports Tracking ID as identifier)
router.patch(
  "/track/:trackingId/status",
  protect,
  authorize("Super Admin", "Company Admin", "Hub Manager", "Agent"),
  trackingIdParamValidator,
  statusValidators,
  validate,
  updateStatus
);

// Get all shipments (Agent sees their own, Admin sees all)
router.get("/", protect, getShipments);

// Single shipment by ID
router.get("/:id", protect, idParamValidator, validate, getShipmentById);

// Assign agent
router.post(
  "/:id/assign-agent",
  protect,
  authorize("Super Admin", "Company Admin"),
  idParamValidator,
  assignAgentValidators,
  validate,
  assignAgent
);

// Status updates (both PATCH & POST to satisfy API requirements)
router.patch(
  "/:id/status",
  protect,
  authorize("Super Admin", "Company Admin", "Agent"),
  idParamValidator,
  statusValidators,
  validate,
  updateStatus
);
router.post(
  "/:id/status",
  protect,
  authorize("Super Admin", "Company Admin", "Agent"),
  idParamValidator,
  statusValidators,
  validate,
  updateStatus
);

// Admin Edit details
router.put(
  "/:id",
  protect,
  authorize("Super Admin", "Company Admin"),
  idParamValidator,
  shipmentDetailsUpdateValidators,
  validate,
  require("../controllers/shipmentController").updateShipmentDetails
);

module.exports = router;
