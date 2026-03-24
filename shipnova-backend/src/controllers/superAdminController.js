const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const Tenant = require("../models/Tenant");

const buildTenantBaseName = (adminName) => `${adminName}'s Logistics`;

const createUniqueTenant = async (adminName) => {
  const baseName = buildTenantBaseName(adminName);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : ` ${attempt + 1}`;
    const candidateName = `${baseName}${suffix}`;

    try {
      const tenant = await Tenant.create({
        name: candidateName,
        subscriptionPlan: "Starter",
        isActive: true,
      });

      return tenant;
    } catch (error) {
      // Retry only when the unique index on name is hit.
      if (error?.code === 11000 && error?.keyPattern?.name) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to create a unique tenant name. Please retry.");
};

// @desc    Super Admin Login (isolated from normal auth)
// @route   POST /api/super-admin/login
// @access  Public (but ONLY allows Super Admin role)
exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // STRICT: Only Super Admin can login through this route
    if (user.role !== "Super Admin") {
      return res.status(403).json({ message: "Access denied. This portal is for System Administrators only." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending admin registration requests
// @route   GET /api/super-admin/admin-requests
// @access  Private/SuperAdmin
exports.getAdminRequests = async (req, res) => {
  try {
    const pendingAdmins = await User.find({
      role: "Company Admin",
      status: "pending",
    }).select("-password").sort({ createdAt: -1 });

    res.json(pendingAdmins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all admins (active, pending, suspended)
// @route   GET /api/super-admin/all-admins
// @access  Private/SuperAdmin
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: "Company Admin",
    }).select("-password").populate("approvedBy", "name email").sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve an admin registration request
// @route   PATCH /api/super-admin/admin-requests/:id/approve
// @access  Private/SuperAdmin
exports.approveAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin request not found" });
    }

    if (admin.role !== "Company Admin") {
      return res.status(400).json({ message: "This user is not a Company Admin" });
    }

    if (admin.status === "active") {
      return res.status(400).json({ message: "Admin is already approved" });
    }

    // Auto-create a Tenant for this admin only if they don't already have one from registration
    let finalTenantId = admin.tenant_id;
    if (!finalTenantId) {
      const tenant = await createUniqueTenant(admin.name);
      finalTenantId = tenant._id;
    }

    admin.status = "active";
    admin.approvedBy = req.user._id;
    admin.approvedAt = new Date();
    admin.tenant_id = finalTenantId; // Enforce Multi-tenancy!
    await admin.save();

    res.json({
      message: "Admin approved successfully and Tenant created.",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        tenant_id: admin.tenant_id,
        approvedAt: admin.approvedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject an admin registration request
// @route   PATCH /api/super-admin/admin-requests/:id/reject
// @access  Private/SuperAdmin
exports.rejectAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin request not found" });
    }

    if (admin.role !== "Company Admin") {
      return res.status(400).json({ message: "This user is not a Company Admin" });
    }

    admin.status = "suspended";
    await admin.save();

    res.json({
      message: "Admin request rejected",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Super Admin creates an admin directly (with tenant assignment)
// @route   POST /api/super-admin/create-admin
// @access  Private/SuperAdmin
exports.createAdmin = async (req, res) => {
  const { name, email, password, tenant_id } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    let finalTenantId = tenant_id;
    
    // AUTO-TENANT: If no tenant_id is provided, create a new Tenant for this admin. 
    // This fixes the 'Tenant access required' error for manually created admins.
    if (!finalTenantId) {
      const tenant = await createUniqueTenant(name);
      finalTenantId = tenant._id;
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "Company Admin",
      status: "active", // Super Admin created = auto-approved
      tenant_id: finalTenantId,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        tenant_id: admin.tenant_id,
      },
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system-wide stats for Super Admin dashboard
// @route   GET /api/super-admin/stats
// @access  Private/SuperAdmin
exports.getSystemStats = async (req, res) => {
  try {
    const Tenant = require("../models/Tenant");
    const Shipment = require("../models/Shipment");
    const Plan = require("../models/Plan");

    const [tenantCount, shipmentCount, userCount, pendingAdminCount, allTenants, allPlans] = await Promise.all([
      Tenant.countDocuments({}),
      Shipment.countDocuments({}),
      User.countDocuments({}),
      User.countDocuments({ role: "Company Admin", status: "pending" }),
      Tenant.find({}),
      Plan.find({})
    ]);

    // Calculate Simulated Revenue based on Tenant Plans
    let revenue = 0;
    allTenants.forEach(t => {
       const plan = allPlans.find(p => p.name === t.subscriptionPlan);
       if (plan && plan.price) {
          // Extract numeric value from price string like "$99" or "$149/mo"
          const num = plan.price.replace(/[^0-9]/g, '');
          if (num) revenue += parseInt(num);
       }
    });

    res.json({
      tenants: tenantCount,
      activeShipments: shipmentCount,
      globalUsers: userCount,
      pendingApprovals: pendingAdminCount,
      estimatedRevenue: `$${revenue.toLocaleString()}`,
      systemUptime: "99.99%"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
