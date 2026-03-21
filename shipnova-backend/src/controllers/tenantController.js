const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { getTenantIdFromUser } = require("../utils/tenantId");

// @desc    Create a new Tenant (Courier Company) + First Admin Account
// @route   POST /api/tenants
// @access  Private/SuperAdmin
exports.createTenant = async (req, res) => {
  const { name, subscriptionPlan, isActive, adminName, adminEmail, adminPassword } = req.body;

  try {
    const tenantExists = await Tenant.findOne({ name });
    if (tenantExists) {
      return res.status(400).json({ message: "Tenant company already exists" });
    }

    // 1. Create the Company Entity
    const tenant = await Tenant.create({
      name,
      subscriptionPlan,
      isActive: isActive !== undefined ? isActive : true,
    });

    // 2. Create the first Admin for this company
    let user = null;
    if (adminEmail && adminPassword) {
      user = await User.create({
        name: adminName || `${name} Admin`,
        email: adminEmail,
        password: adminPassword,
        role: "Company Admin",
        tenant_id: tenant._id,
        status: "active"
      });
    }

    res.status(201).json({
      message: "Tenant initialized and Master Admin provisioned.",
      tenant,
      admin: user ? { id: user._id, email: user.email } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Tenants
// @route   GET /api/tenants
// @access  Private/SuperAdmin
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({});
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Tenant Details for currently logged in Admin
// @route   GET /api/tenants/my-tenant
// @access  Private/CompanyAdmin
exports.getMyTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(getTenantIdFromUser(req.user));
    if (!tenant) return res.status(404).json({ message: "Tenant detail not found" });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Subscription Plan (Simulated Billing)
// @route   PATCH /api/tenants/subscription
// @access  Private/CompanyAdmin
exports.updateSubscriptionPlan = async (req, res) => {
  const { planName } = req.body;

  try {
    const tenant = await Tenant.findById(getTenantIdFromUser(req.user));
    if (!tenant) return res.status(404).json({ message: "Tenant profile not accessible" });

    tenant.subscriptionPlan = planName;
    await tenant.save();

    res.json({ 
        message: "Subscription successfully updated globally.", 
        newPlan: tenant.subscriptionPlan 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Detailed Tenant Info (For Super Admin)
// @route   GET /api/tenants/:id
// @access  Private/SuperAdmin
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Also find the master admin for this tenant
    const masterAdmin = await User.findOne({ tenant_id: tenant._id, role: "Company Admin" }).select("-password");

    res.json({
      tenant,
      masterAdmin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend/Activate Tenant
// @route   PATCH /api/tenants/:id/toggle-status
// @access  Private/SuperAdmin
exports.toggleTenantStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    tenant.isActive = !tenant.isActive;
    await tenant.save();

    res.json({ 
        message: `Tenant ${tenant.isActive ? "Activated" : "Suspended"} successfully.`,
        isActive: tenant.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
