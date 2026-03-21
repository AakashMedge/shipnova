const Plan = require("../models/Plan");

// @desc    Get all available plans
// @route   GET /api/plans
// @access  Public (logged in anyway)
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/SuperAdmin
exports.createPlan = async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/SuperAdmin
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/SuperAdmin
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    await plan.deleteOne();
    res.json({ message: "Plan removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
