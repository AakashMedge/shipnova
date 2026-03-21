const express = require("express");
const router = express.Router();

const { trackShipment } = require("../controllers/shipmentController");
const { trackingLimiter } = require("../middleware/rateLimiter");
const {
  validate,
  trackingIdLegacyParamValidator,
} = require("../middleware/validators");

// Public API alias required by assessment spec
router.get("/:tracking_id", trackingLimiter, trackingIdLegacyParamValidator, validate, trackShipment);

module.exports = router;
