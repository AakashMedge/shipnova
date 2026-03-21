const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { getTenantIdFromUser } = require("../utils/tenantId");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const Tenant = require("../models/Tenant");

  try {
    if (role !== "Company Admin") {
      return res.status(403).json({ message: "Public registration is only available for Company Admin accounts." });
    }

    if (role === "Super Admin") {
      return res.status(403).json({ message: "Super Admin accounts cannot be created through registration." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let assignedTenantId = req.body.tenant_id;

    // AUTOMATIC TENANT GENERATION: If Company Admin registers without a tenant, create one.
    // This solves the isolation bug where multiple admins shared a 'null' tenant.
    if (role === "Company Admin" && !assignedTenantId) {
       const newTenant = await Tenant.create({
          name: `${name}'s Logistics`,
         subscriptionPlan: "Starter",
         isActive: true,
       });
       assignedTenantId = newTenant._id;
    }

    const status = role === "Company Admin" ? "pending" : "active";

    const user = await User.create({
      name,
      email,
      password,
      role,
      tenant_id: assignedTenantId,
      status,
    });

    if (user) {
      const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        tenant_id: user.tenant_id,
      };

      if (user.status === "active") {
        response.token = generateToken(user._id);
      }

      res.status(201).json(response);
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // SECURITY: Block Super Admin from logging in through tenant login route
    if (user.role === "Super Admin") {
      return res.status(403).json({ message: "Access denied. Please use the admin portal." });
    }

    // Block users whose accounts are not active (pending approval or suspended)
    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is pending approval. Please wait for the administrator to verify your registration." });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended. Contact the administrator." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      tenant_id: user.tenant_id,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Get all agents under a specific tenant
// @route   GET /api/auth/agents
// @access  Private
exports.getTenantAgents = async (req, res) => {
  try {
    // SAFELY handle missing tenant_id to prevent UI crashes.
    // Fallback to a dummy ID to return empty list instead of 403 error.
    const userTenantId = getTenantIdFromUser(req.user);
    console.log("DEBUG: getTenantAgents req.user:", { id: req.user._id, role: req.user.role, tenant_id: req.user.tenant_id });
    
    // If not super admin and no tenant_id, we still try to fetch but usually it'll be empty.
    // This removes the "Tenant access required" hard block.

    const agents = await User.find({
      role: "Agent",
      tenant_id: userTenantId,
    }).select("-password");

    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Company Admin creates a new Delivery Agent
// @route   POST /api/auth/agents
// @access  Private (Company Admin only)
exports.createAgent = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An agent with this email already exists." });
    }

    const agent = await User.create({
      name,
      email,
      password,
      role: "Agent",
      status: "active",
      tenant_id: getTenantIdFromUser(req.user),
    });

    res.status(201).json({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      tenant_id: agent.tenant_id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Agent Details
// @route   PATCH /api/auth/agents/:id
// @access  Private (Company Admin only)
exports.updateAgent = async (req, res) => {
  const { name, email, phone, address, profileUrl } = req.body;
  
  try {
    const userTenantId = getTenantIdFromUser(req.user);
    const agent = await User.findById(req.params.id);

    if (!agent || agent.role !== "Agent") {
      return res.status(404).json({ message: "Agent not found" });
    }

    const agentTenantId = agent.tenant_id ? agent.tenant_id.toString() : "000000000000000000000000";
    
    // Ensure admin only updates their own agents
    if (agentTenantId !== userTenantId) {
      return res.status(403).json({ message: "Not authorized to update this agent" });
    }

    if (name) agent.name = name;
    if (email) agent.email = email;
    if (phone !== undefined) agent.phone = phone;
    if (address !== undefined) agent.address = address;
    if (profileUrl !== undefined) agent.profileUrl = profileUrl;

    const updatedAgent = await agent.save();
    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
