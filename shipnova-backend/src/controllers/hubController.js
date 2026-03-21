const Hub = require("../models/Hub");
const { getTenantIdFromUser } = require("../utils/tenantId");

const assertHubChatAccess = async (req, hubId) => {
  const hub = await Hub.findById(hubId);
  if (!hub) {
    return { error: { status: 404, message: "Hub not found" } };
  }

  const userTenantId = getTenantIdFromUser(req.user);
  const hubTenantId = hub.tenant_id ? hub.tenant_id.toString() : "000000000000000000000000";

  if (hubTenantId !== userTenantId) {
    return { error: { status: 403, message: "Not authorized to access this hub chat" } };
  }

  if (req.user.role === "Hub Manager") {
    const managerId = hub.manager ? hub.manager.toString() : null;
    const primaryHubId = req.user.primaryHub ? req.user.primaryHub.toString() : null;
    const isAssignedManager = managerId === req.user._id.toString();
    const isPrimaryHubMatch = primaryHubId === hub._id.toString();

    if (!isAssignedManager && !isPrimaryHubMatch) {
      return { error: { status: 403, message: "Hub managers can only access their own hub chat" } };
    }
  }

  return { hub };
};

// @desc    Create a new hub
// @route   POST /api/hubs
// @access  Private/Admin
exports.createHub = async (req, res) => {
  const { name, location, managerEmail, managerPassword } = req.body;

  try {
    const User = require("../models/User");
    const safeTenantId = getTenantIdFromUser(req.user);
    
    let managerId = null;

    // If manager details provided, create account
    if (managerEmail && managerPassword) {
       const userExists = await User.findOne({ email: managerEmail });
       if (userExists) return res.status(400).json({ message: "Manager account with this email already exists." });

       const manager = await User.create({
          name: `${name} Manager`,
          email: managerEmail,
          password: managerPassword,
          role: "Hub Manager",
          tenant_id: safeTenantId,
           primaryHub: null,
          status: "active"
       });
       managerId = manager._id;
    }

    const hub = await Hub.create({
      name,
      location,
      tenant_id: safeTenantId,
      manager: managerId
    });

    if (managerId) {
      await User.findByIdAndUpdate(managerId, { primaryHub: hub._id });
    }

    res.status(201).json(hub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all hubs for the tenant
// @route   GET /api/hubs
// @access  Private/Admin
exports.getHubs = async (req, res) => {
  try {
    const safeTenantId = getTenantIdFromUser(req.user);
    let query = { tenant_id: safeTenantId };

    // If Hub Manager, only show their hub
    if (req.user.role === "Hub Manager") {
       query = {
         tenant_id: safeTenantId,
         $or: [
           { manager: req.user._id },
           { _id: req.user.primaryHub || null },
         ],
       };
    }

    const hubs = await Hub.find(query);
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign shipment to a hub
// @route   POST /api/hubs/:hubId/assign-shipment
// @access  Private/Admin
exports.assignShipmentToHub = async (req, res) => {
  const { shipmentId } = req.body;
  const Shipment = require("../models/Shipment");
  
  try {
    const hub = await Hub.findById(req.params.hubId);
    
    const hubTenantId = hub?.tenant_id ? hub.tenant_id.toString() : "000000000000000000000000";
    const userTenantId = getTenantIdFromUser(req.user);
    
    if (!hub || hubTenantId !== userTenantId) {
      return res.status(404).json({ message: "Hub not found or unauthorized" });
    }

    const shipment = await Shipment.findById(shipmentId);
    const shipmentTenantId = shipment?.tenant_id ? shipment.tenant_id.toString() : "000000000000000000000000";

    if (!shipment || shipmentTenantId !== userTenantId) {
      return res.status(404).json({ message: "Shipment not found or unauthorized" });
    }

    shipment.hub = hub._id;
    await shipment.save();

    res.json({ message: "Shipment assigned to hub successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single hub with active inventory
// @route   GET /api/hubs/:id
// @access  Private/Admin
exports.getHubById = async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id).populate("manager", "name email phoneNumber");
    if (!hub) return res.status(404).json({ message: "Hub not found" });

    const Shipment = require("../models/Shipment");
    const safeTenantId = getTenantIdFromUser(req.user);

    // Security lock
    if (hub.tenant_id.toString() !== safeTenantId.toString() && req.user.role !== "Super Admin") {
      return res.status(403).json({ message: "Not authorized to view this Hub" });
    }

    // Get all shipments currently assigned to this hub
    const shipments = await Shipment.find({ hub: hub._id })
      .select("trackingId customerName status updatedAt agent")
      .populate("agent", "name email phone")
      .sort("-updatedAt");

    res.json({ hub, shipments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update hub details or provision account
// @route   PATCH /api/hubs/:id
// @access  Private/Admin
exports.updateHub = async (req, res) => {
  const { name, location, managerEmail, managerPassword } = req.body;

  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Hub not found" });

    const safeTenantId = getTenantIdFromUser(req.user);
    if (hub.tenant_id.toString() !== safeTenantId.toString() && req.user.role !== "Super Admin") {
      return res.status(403).json({ message: "Not authorized to update this Hub" });
    }

    if (name) hub.name = name;
    if (location) hub.location = location;

    // Handle Manager Account Provisioning
    if (managerEmail && managerPassword) {
       const User = require("../models/User");
       let manager;

       // If hub already has a manager, update them. Else create new.
       if (hub.manager) {
          manager = await User.findById(hub.manager);
          if (manager) {
             manager.email = managerEmail;
             manager.password = managerPassword; // Pre-save hook will hash it
           manager.primaryHub = hub._id;
             await manager.save();
          }
       } else {
          const userExists = await User.findOne({ email: managerEmail });
          if (userExists) return res.status(400).json({ message: "An account with this email already exists." });

          manager = await User.create({
             name: `${hub.name} Manager`,
             email: managerEmail,
             password: managerPassword,
             role: "Hub Manager",
             tenant_id: safeTenantId,
             primaryHub: hub._id,
             status: "active"
          });
          hub.manager = manager._id;
       }
    }

    await hub.save();
    res.json(hub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get incoming shipment requests assigned to this hub (status = Created)
// @route   GET /api/hubs/:id/incoming
// @access  Private/Hub Manager
exports.getIncomingRequests = async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Hub not found" });

    const Shipment = require("../models/Shipment");
    const shipments = await Shipment.find({ 
      hub: hub._id, 
      status: { $in: ["Created", "Picked Up"] }
    })
      .populate("agent", "name email phone")
      .populate("tenant_id", "name")
      .sort("-createdAt");

    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hub verifies physical parcel and accepts it into the facility 
// @route   POST /api/hubs/:id/verify-shipment
// @access  Private/Hub Manager
exports.verifyAndAcceptShipment = async (req, res) => {
  const { trackingId } = req.body;
  const crypto = require("crypto");

  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Hub not found" });

    const Shipment = require("../models/Shipment");
    const ShipmentEvent = require("../models/ShipmentEvent");
    
    const shipment = await Shipment.findOne({ 
      trackingId: trackingId.toUpperCase(), 
      hub: hub._id 
    });

    if (!shipment) {
      return res.status(404).json({ 
        message: "Shipment not found at this Hub. Verify the tracking ID or hub assignment." 
      });
    }

    if (shipment.status === "At Sorting Facility") {
      return res.status(400).json({ message: "Shipment already verified at this facility." });
    }

    // Generate cryptographic verification signature
    const HMAC_SECRET = process.env.JWT_SECRET || "shipnova_secure_salt_77";
    const verificationPayload = `${shipment.trackingId}:${hub._id}:${req.user._id}:${Date.now()}`;
    const verificationHash = crypto
      .createHmac("sha256", HMAC_SECRET)
      .update(verificationPayload)
      .digest("hex")
      .toUpperCase();

    // Update shipment status
    shipment.status = "At Sorting Facility";
    shipment.history.push({
      status: "At Sorting Facility",
      message: `Verified and accepted at ${hub.name} by Hub Manager. Integrity Hash: ${verificationHash.substring(0, 12)}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });
    await shipment.save();

    // Record event
    await ShipmentEvent.create({
      shipment: shipment._id,
      status: "At Sorting Facility",
      message: `Hub Verification Complete at ${hub.name}. HMAC: ${verificationHash.substring(0, 12)}`,
      updatedBy: req.user._id,
      tenant_id: shipment.tenant_id,
    });

    res.json({
      message: `Shipment ${shipment.trackingId} verified and accepted.`,
      shipment,
      verificationHash: verificationHash.substring(0, 16),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate QR code for a specific shipment (for label printing)
// @route   GET /api/hubs/shipment-qr/:trackingId
// @access  Private/Hub Manager, Company Admin
exports.getShipmentQR = async (req, res) => {
  const { generateShipmentQR } = require("../utils/qrCrypto");

  try {
    const Shipment = require("../models/Shipment");
    const shipment = await Shipment.findOne({ 
      trackingId: req.params.trackingId.toUpperCase() 
    });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    const tenantId = shipment.tenant_id ? shipment.tenant_id.toString() : "000000000000000000000000";
    const { qrDataUrl, signature } = await generateShipmentQR(shipment.trackingId, tenantId);

    res.json({
      trackingId: shipment.trackingId,
      customerName: shipment.customerName,
      address: shipment.address,
      status: shipment.status,
      qrCode: qrDataUrl,
      signature,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate QR code for the Hub itself (printed on wall)
// @route   GET /api/hubs/:id/qr
// @access  Private/Hub Manager, Company Admin
exports.getHubQR = async (req, res) => {
  const { generateHubQR } = require("../utils/qrCrypto");

  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Hub not found" });

    const qrDataUrl = await generateHubQR(hub.hubCode, hub.name);

    res.json({
      hubName: hub.name,
      hubCode: hub.hubCode,
      location: hub.location,
      qrCode: qrDataUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Agent handover - verify agent and release parcels
// @route   POST /api/hubs/:id/agent-handover
// @access  Private/Agent
exports.agentHandover = async (req, res) => {
  const { trackingIds, hubCode } = req.body;
  const crypto = require("crypto");

  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ message: "Hub not found" });

    // Verify hub code matches (proves agent is at this hub)
    if (hub.hubCode !== hubCode) {
      return res.status(403).json({ message: "Hub verification failed. Invalid hub code." });
    }

    const Shipment = require("../models/Shipment");
    const ShipmentEvent = require("../models/ShipmentEvent");

    const results = [];
    const HMAC_SECRET = process.env.JWT_SECRET || "shipnova_secure_salt_77";

    for (const tid of trackingIds) {
      const shipment = await Shipment.findOne({ 
        trackingId: tid.toUpperCase(), 
        hub: hub._id 
      }).populate("agent", "name");

      if (!shipment) {
        results.push({ trackingId: tid, status: "FAILED", reason: "Not found at this hub" });
        continue;
      }

      // Verify agent assignment
      if (shipment.agent && shipment.agent._id.toString() !== req.user._id.toString()) {
        results.push({ trackingId: tid, status: "FAILED", reason: "Not assigned to you" });
        continue;
      }

      // Generate handover token
      const handoverPayload = `HANDOVER:${tid}:${hub._id}:${req.user._id}:${Date.now()}`;
      const handoverToken = crypto
        .createHmac("sha256", HMAC_SECRET)
        .update(handoverPayload)
        .digest("hex")
        .substring(0, 16)
        .toUpperCase();

      shipment.status = "Out for Delivery";
      shipment.agent = req.user._id;
      shipment.history.push({
        status: "Out for Delivery",
        message: `Released to Agent ${req.user.name} from ${hub.name}. Handover Token: ${handoverToken}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      });
      await shipment.save();

      await ShipmentEvent.create({
        shipment: shipment._id,
        status: "Out for Delivery",
        message: `Agent Handover at ${hub.name}. Token: ${handoverToken}`,
        updatedBy: req.user._id,
        tenant_id: shipment.tenant_id,
      });

      results.push({ trackingId: tid, status: "RELEASED", handoverToken });
    }

    res.json({
      message: `Handover complete. ${results.filter(r => r.status === "RELEASED").length}/${trackingIds.length} parcels released.`,
      hubName: hub.name,
      agentName: req.user.name,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hub chat messages
// @route   GET /api/hubs/:id/chat
// @access  Private (Company Admin, Hub Manager)
exports.getHubChatMessages = async (req, res) => {
  try {
    const { error, hub } = await assertHubChatAccess(req, req.params.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const HubChatMessage = require("../models/HubChatMessage");
    const messages = await HubChatMessage.find({
      hub: hub._id,
      tenant_id: hub.tenant_id,
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate("sender", "name role email");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send hub chat message
// @route   POST /api/hubs/:id/chat
// @access  Private (Company Admin, Hub Manager)
exports.postHubChatMessage = async (req, res) => {
  const { text } = req.body;

  try {
    const { error, hub } = await assertHubChatAccess(req, req.params.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const HubChatMessage = require("../models/HubChatMessage");
    const message = await HubChatMessage.create({
      tenant_id: hub.tenant_id,
      hub: hub._id,
      sender: req.user._id,
      senderRole: req.user.role,
      text,
    });

    const populated = await HubChatMessage.findById(message._id).populate("sender", "name role email");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
