const express = require("express");
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require("../controllers/planController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate, idParamValidator, planCreateUpdateValidators } = require("../middleware/validators");

// All routes require login
router.get("/", protect, getPlans);

// Super Admin Only
router.post("/", protect, authorize("Super Admin"), planCreateUpdateValidators, validate, createPlan);
router.put("/:id", protect, authorize("Super Admin"), idParamValidator, planCreateUpdateValidators, validate, updatePlan);
router.delete("/:id", protect, authorize("Super Admin"), idParamValidator, validate, deletePlan);

module.exports = router;
