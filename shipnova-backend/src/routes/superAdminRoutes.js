const express = require("express");
const router = express.Router();
const {
  superAdminLogin,
  getAdminRequests,
  getAllAdmins,
  approveAdmin,
  rejectAdmin,
  createAdmin,
  getSystemStats,
} = require("../controllers/superAdminController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validate,
  loginValidators,
  idParamValidator,
  superAdminCreateAdminValidators,
} = require("../middleware/validators");

// Public: Super Admin login (no auth needed)
router.post("/login", loginValidators, validate, superAdminLogin);

// Protected: All below require Super Admin role
router.get("/stats", protect, authorize("Super Admin"), getSystemStats);
router.get("/admin-requests", protect, authorize("Super Admin"), getAdminRequests);
router.get("/all-admins", protect, authorize("Super Admin"), getAllAdmins);
router.patch("/admin-requests/:id/approve", protect, authorize("Super Admin"), idParamValidator, validate, approveAdmin);
router.patch("/admin-requests/:id/reject", protect, authorize("Super Admin"), idParamValidator, validate, rejectAdmin);
router.post("/create-admin", protect, authorize("Super Admin"), superAdminCreateAdminValidators, validate, createAdmin);

module.exports = router;
