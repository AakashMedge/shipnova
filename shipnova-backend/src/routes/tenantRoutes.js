const express = require("express");
const router = express.Router();
const { 
  createTenant, 
  getTenants, 
  updateSubscriptionPlan, 
  getMyTenant,
  getTenantById,
  toggleTenantStatus
} = require("../controllers/tenantController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validate,
  idParamValidator,
  tenantCreateValidators,
  subscriptionUpdateValidators,
} = require("../middleware/validators");

// Super Admin Management
router.route("/")
  .post(protect, authorize("Super Admin"), tenantCreateValidators, validate, createTenant)
  .get(protect, authorize("Super Admin"), getTenants);

// Company Admin Subscription / Billing Simulation
router.get("/my-tenant", protect, authorize("Company Admin"), getMyTenant);
router.patch("/subscription", protect, authorize("Company Admin"), subscriptionUpdateValidators, validate, updateSubscriptionPlan);

router.get("/:id", protect, authorize("Super Admin"), idParamValidator, validate, getTenantById);
router.patch("/:id/toggle-status", protect, authorize("Super Admin"), idParamValidator, validate, toggleTenantStatus);

module.exports = router;
