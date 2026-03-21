const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getTenantAgents,
  createAgent,
  updateAgent,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { loginValidators, registerValidators, validate } = require("../middleware/validators");

// Public auth
router.post("/register", registerValidators, validate, registerUser);
router.post("/login", loginValidators, validate, loginUser);

// Protected
router.get("/profile", protect, getUserProfile);

// Company Admin or Hub Manager managing their agents
router.get("/agents", protect, authorize("Company Admin", "Hub Manager"), getTenantAgents);
router.post("/agents", protect, authorize("Company Admin", "Hub Manager"), createAgent);
router.patch("/agents/:id", protect, authorize("Company Admin", "Hub Manager"), updateAgent);

module.exports = router;
