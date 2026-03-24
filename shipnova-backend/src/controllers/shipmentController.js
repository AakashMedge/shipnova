const Shipment = require("../models/Shipment");
const ShipmentEvent = require("../models/ShipmentEvent");
const logAction = require("../utils/logger");
const { queueEmail } = require("../queues/emailQueue");
const { getCache, setCache, delCache } = require("../utils/redis");
const { predictDelivery } = require("../utils/deliveryPredictor");
const { getTenantIdFromUser, normalizeTenantId } = require("../utils/tenantId");

exports.createShipment = async (req, res) => {
  const { customerName, customerEmail, address, phoneNumber, packageDetails, tenant_id, hub, agent, estimatedDelivery } = req.body;

  try {
    const finalTenantId = tenant_id ? normalizeTenantId(tenant_id) : getTenantIdFromUser(req.user);

    const shipment = new Shipment({
      customerName,
      customerEmail,
      address,
      phoneNumber,
      packageDetails,
      tenant_id: finalTenantId,
      hub: hub || null,
      agent: agent || null,
      estimatedDelivery: estimatedDelivery || null
    });

    const { generateDispatchInsights } = require("../utils/aiService");
    const aiInsights = await generateDispatchInsights({
      senderName: req.user.name,
      receiverAddress: shipment.address,
      receiverCity: "Location",
      description: shipment.packageDetails,
      subscriptionPlan: "Advanced"
    });

    shipment.aiInsights = aiInsights;
    await shipment.save();

    await ShipmentEvent.create({
      shipment: shipment._id,
      status: "Created",
      message: "Shipment created.",
      updatedBy: req.user._id,
      tenant_id: shipment.tenant_id,
    });

    await logAction(req, {
      action: "SHIPMENT_CREATED",
      entityType: "Shipment",
      entityId: shipment._id,
      details: `${shipment.customerName} (${shipment.customerEmail})`
    });

    const { getShipmentCreatedTemplate } = require("../utils/emailTemplates");
    const sendSMS = require("../utils/sendSMS");
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    // ── TRIGGER 1: Email Alert ───────────────────────────────────────────
    await queueEmail({
      email: shipment.customerEmail,
      subject: `[${shipment.trackingId}] ShipNova Induction Alert`,
      html: getShipmentCreatedTemplate({
        customerName: shipment.customerName,
        trackingId: shipment.trackingId,
        aiInsights: shipment.aiInsights,
        trackingUrl: `${frontendUrl}/track?id=${shipment.trackingId}`
      })
    });

    // ── TRIGGER 1: SMS Alert ─────────────────────────────────────────────
    if (shipment.phoneNumber) {
      await sendSMS({
        phoneNumber: shipment.phoneNumber,
        message: `ShipNova Alert [${shipment.trackingId}]: Your package is booked! Track it here: ${frontendUrl}/track?id=${shipment.trackingId}`
      });
    }

    res.status(201).json(shipment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignAgent = async (req, res) => {
  const { agentId } = req.body;

  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const shipmentTenantId = shipment.tenant_id ? shipment.tenant_id.toString() : "000000000000000000000000";
    const userTenantId = getTenantIdFromUser(req.user);

    if (shipmentTenantId !== userTenantId && req.user.role !== "Super Admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    shipment.agent = agentId;
    await shipment.save();

    await logAction(req, {
      action: "AGENT_ASSIGNED",
      entityType: "Shipment",
      entityId: shipment._id,
      details: `Agent ${agentId} assigned`
    });

    res.json({ message: "Agent assigned", shipment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status, message, lat, lng, signature, otp } = req.body;
  const { id, trackingId } = req.params;

  try {
    let shipment = trackingId 
      ? await Shipment.findOne({ trackingId: trackingId.toUpperCase() })
      : await Shipment.findById(id);

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    if (req.user.role === "Agent" && shipment.agent?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not assigned to this shipment" });
    }

    const statusSequence = ["Created", "Picked Up", "At Sorting Facility", "In Transit", "Out for Delivery", "Delivered"];
    const currentIndex = statusSequence.indexOf(shipment.status);
    const nextIndex = statusSequence.indexOf(status);

    if (status !== "Failed / Retry / Returned" && nextIndex !== -1) {
      if (nextIndex < currentIndex) {
        return res.status(400).json({ message: `Cannot move back from ${shipment.status}` });
      }
      if (nextIndex > currentIndex + 1) {
        return res.status(400).json({ message: `Next step should be ${statusSequence[currentIndex + 1]}` });
      }
    }

    if (status === "Delivered" && (!otp || otp !== shipment.deliveryOTP)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const shipmentTenantId = shipment.tenant_id ? shipment.tenant_id.toString() : "000000000000000000000000";
    const userTenantId = getTenantIdFromUser(req.user);

    if (shipmentTenantId !== userTenantId && req.user.role !== "Super Admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    shipment.status = status;
    if (lat) shipment.currentLat = lat;
    if (lng) shipment.currentLong = lng;
    if (signature) shipment.podSignature = signature;
    if (req.body.proofOfDelivery) shipment.proofOfDelivery = req.body.proofOfDelivery;

    if (status === "Delivered") {
      const crypto = require("crypto");
      const secret = process.env.JWT_SECRET || "shipnova_secure_salt_77";
      const proofPayload = `${shipment.trackingId}-${req.user._id}-${Date.now()}`;
      shipment.deliveryToken = crypto.createHmac("sha256", secret).update(proofPayload).digest("hex").toUpperCase();
      shipment.otpVerified = true;
    }

    shipment.history.push({
      status,
      message: message || `Updated to ${status}`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await shipment.save();

    await ShipmentEvent.create({
      shipment: shipment._id,
      status,
      message: message || `Updated to ${status}`,
      updatedBy: req.user._id,
      tenant_id: shipment.tenant_id,
    });

    await logAction(req, {
      action: "STATUS_UPDATE",
      entityType: "Shipment",
      entityId: shipment._id,
      details: `Updated to ${status}`
    });

    await delCache(`track:${shipment.trackingId}`);
    await delCache(`analytics:${shipment.tenant_id}`);

    const { getShipmentUpdateTemplate } = require("../utils/emailTemplates");
    const sendSMS = require("../utils/sendSMS");
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

    // ── TRIGGER 2: Email Update ─────────────────────────────────────────
    await queueEmail({
      email: shipment.customerEmail,
      subject: `Shipment Update [${shipment.trackingId}]: ${status}`,
      html: getShipmentUpdateTemplate({
        trackingId: shipment.trackingId,
        status: status,
        message: message,
        otp: shipment.deliveryOTP,
        proofOfDelivery: shipment.proofOfDelivery ? (shipment.proofOfDelivery.startsWith("http") ? shipment.proofOfDelivery : `${process.env.BACKEND_URL}${shipment.proofOfDelivery}`) : null,
        trackingUrl: `${frontendUrl}/track?id=${shipment.trackingId}`
      })
    });

    // ── TRIGGER 2: SMS Update ───────────────────────────────────────────
    if (shipment.phoneNumber) {
      let smsMsg = `ShipNova: [${shipment.trackingId}] is now ${status}.`;
      if (status === "Out for Delivery") {
        smsMsg += ` Your PIN: ${shipment.deliveryOTP}. Keep it ready!`;
      }
      if (status === "Delivered") {
        smsMsg += ` Thank you for choosing ShipNova!`;
      }
      await sendSMS({ phoneNumber: shipment.phoneNumber, message: smsMsg });
    }

    res.json({ message: "Status updated", shipment });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.trackShipment = async (req, res) => {
  const trackingIdRaw = req.params.trackingId || req.params.tracking_id;
  const trackingId = trackingIdRaw.toUpperCase();
  const cacheKey = `track:${trackingId}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      cached._cache = "HIT";
      return res.json(cached);
    }

    const shipment = await Shipment.findOne({ trackingId })
      .select("-tenant_id")
      .populate("agent", "name");

    if (!shipment) {
      return res.status(404).json({ message: "Tracking ID not found" });
    }

    const history = await ShipmentEvent.find({ shipment: shipment._id })
      .sort("createdAt")
      .populate("updatedBy", "name role")
      .select("status message createdAt updatedBy");

    const prediction = predictDelivery(shipment);

    const response = {
      tracking_id: shipment.trackingId,
      status: shipment.status,
      estimated_delivery: prediction.estimatedDeliveryLabel,
      ai_prediction: {
        estimated_delivery: prediction.estimatedDelivery,
        estimated_delivery_label: prediction.estimatedDeliveryLabel,
        confidence: prediction.confidence,
        stage_label: prediction.stageLabel,
        remaining_stages: prediction.remainingStages,
        basis: prediction.basis,
      },
      delivery_token: shipment.deliveryToken,
      delivery_otp: shipment.deliveryOTP,
      otp_verified: shipment.otpVerified,
      pod_photo: shipment.proofOfDelivery
        ? (shipment.proofOfDelivery.startsWith("data:") || shipment.proofOfDelivery.startsWith("http")
            ? shipment.proofOfDelivery
            : `${process.env.BACKEND_URL || "http://localhost:5000"}${shipment.proofOfDelivery}`)
        : null,
      agent: shipment.agent,
      customer: {
        name: shipment.customerName,
        address: shipment.address,
      },
      package_info: {
        details: shipment.packageDetails,
      },
      timeline: history.map(event => ({
        status: event.status,
        message: event.message,
        time: event.createdAt,
        updatedBy: event.updatedBy?.name || "System",
        updatedByRole: event.updatedBy?.role || "system",
      })),
      _cache: "MISS",
    };

    // ── Cache for 60 seconds ───────────────────────────────────────────────
    await setCache(cacheKey, response, 60);

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all shipments for a tenant/admin
// @route   GET /api/shipments
// @access  Private
exports.getShipments = async (req, res) => {
  try {
    let query = {};

    // Filter by tenant unless Super Admin
    if (req.user.role !== "Super Admin" && req.user.role !== "Customer") {
      query.tenant_id = getTenantIdFromUser(req.user);
    }

    // Agents see only their assigned shipments
    if (req.user.role === "Agent") {
      query.agent = req.user._id;
    }

    // Customers see only shipments that match their email address
    if (req.user.role === "Customer") {
      query.customerEmail = req.user.email;
    }

    // Populate agent, tenant (carrier) names, and hub routing for the frontend
    const shipments = await Shipment.find(query)
      .populate("agent", "name")
      .populate("tenant_id", "name")
      .populate("hub", "name");
      
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/shipments/analytics
// @access  Private/Company Admin
exports.getAnalytics = async (req, res) => {
  try {
    // `tenant_id` may be either an ObjectId or a populated Tenant document.
    const tenantId = getTenantIdFromUser(req.user);
    const cacheKey = `analytics:${tenantId}`;

    // ── Redis Cache Check (2 min TTL) ──────────────────────────────────────
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ ...cached, _cache: "HIT" });
    
    const allShipments = await Shipment.find({ tenant_id: tenantId })
      .sort("-updatedAt")
      .populate("agent", "name")
      .populate("hub", "name");

    const AgentModel = require("../models/User");
    const totalAgents = await AgentModel.countDocuments({ role: "Agent", tenant_id: tenantId });

    const analytics = {
      totalAgents,
      totalShipments: allShipments.length,
      metrics: { active: 0, delivered: 0, failed: 0, warehouse: 0 },
      recentExceptions: [],
      recentActivity: allShipments.slice(0, 6),
      _cache: "MISS",
    };

    allShipments.forEach(shipment => {
      const s = shipment.status;
      if (s === "Delivered") analytics.metrics.delivered += 1;
      else if (s === "Failed / Retry / Returned") {
        analytics.metrics.failed += 1;
        if (analytics.recentExceptions.length < 5) analytics.recentExceptions.push(shipment);
      }
      else if (s === "Created" || s === "At Sorting Facility" || s === "Picked Up") analytics.metrics.warehouse += 1;
      else analytics.metrics.active += 1;
    });

    // ── Daily Chart — last 7 days ───────────────────────────────────────────
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[key] = { date: key, created: 0, delivered: 0, failed: 0 };
    }

    allShipments.forEach(s => {
      const createdDate = new Date(s.createdAt);
      if (createdDate >= sevenDaysAgo) {
        const key = createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dailyMap[key]) dailyMap[key].created += 1;
      }
      const updatedDate = new Date(s.updatedAt);
      if (updatedDate >= sevenDaysAgo) {
        const key = updatedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dailyMap[key]) {
          if (s.status === "Delivered") dailyMap[key].delivered += 1;
          if (s.status === "Failed / Retry / Returned") dailyMap[key].failed += 1;
        }
      }
    });
    analytics.dailyChart = Object.values(dailyMap);

    // ── Status donut ────────────────────────────────────────────────────────
    analytics.statusDonut = [
      { name: "Delivered",    value: analytics.metrics.delivered, color: "#10b981" },
      { name: "Active",       value: analytics.metrics.active,    color: "#6366f1" },
      { name: "In Warehouse", value: analytics.metrics.warehouse, color: "#f59e0b" },
      { name: "Failed",       value: analytics.metrics.failed,    color: "#ef4444" },
    ].filter(d => d.value > 0);

    // ── Completion rate ─────────────────────────────────────────────────────
    analytics.completionRate = allShipments.length > 0
      ? Math.round((analytics.metrics.delivered / allShipments.length) * 100)
      : 0;

    // ── Agent leaderboard (top 5) ───────────────────────────────────────────
    const agentMap = {};
    allShipments.forEach(s => {
      if (!s.agent?._id) return;
      const id = s.agent._id.toString();
      if (!agentMap[id]) agentMap[id] = { name: s.agent.name, delivered: 0, total: 0 };
      agentMap[id].total += 1;
      if (s.status === "Delivered") agentMap[id].delivered += 1;
    });
    analytics.agentLeaderboard = Object.values(agentMap)
      .sort((a, b) => b.delivered - a.delivered)
      .slice(0, 5)
      .map(a => ({ ...a, rate: a.total > 0 ? Math.round((a.delivered / a.total) * 100) : 0 }));

    // ── Hub breakdown ───────────────────────────────────────────────────────
    const hubMap = {};
    allShipments.forEach(s => {
      if (!s.hub?._id) return;
      const id = s.hub._id.toString();
      if (!hubMap[id]) hubMap[id] = { name: s.hub.name, total: 0, delivered: 0 };
      hubMap[id].total += 1;
      if (s.status === "Delivered") hubMap[id].delivered += 1;
    });
    analytics.hubBreakdown = Object.values(hubMap)
      .sort((a, b) => b.total - a.total)
      .map(h => ({ ...h, rate: h.total > 0 ? Math.round((h.delivered / h.total) * 100) : 0 }));

    await setCache(cacheKey, analytics, 120);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get single shipment by ID (Satisfies exact API Requirement)
// @route   GET /api/shipments/:id
// @access  Private
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate("agent", "name email")
      .populate("tenant_id", "name")
      .populate("hub", "name location")
      .populate("history.updatedBy", "name role");

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    // Role checks
    if (req.user.role === "Agent" && shipment.agent?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not assigned to this shipment" });
    }

    const shipmentTenantId = shipment.tenant_id ? shipment.tenant_id._id.toString() : "000000000000000000000000";
    const userTenantId = getTenantIdFromUser(req.user);
    
    if (req.user.role !== "Super Admin" && req.user.role !== "Customer" && shipmentTenantId !== userTenantId) {
      return res.status(403).json({ message: "Not authorized for this tenant" });
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Agent at Hub using scanned hub code
// @route   POST /api/shipments/verify-hub
// @access  Private (Agent)
exports.verifyHub = async (req, res) => {
  const { hubCode } = req.body;
  const Hub = require("../models/Hub");

  try {
    const hub = await Hub.findOne({ hubCode });
    if (!hub) {
      return res.status(404).json({ message: "Invalid Hub Code entered. Please verify with the Hub Manager." });
    }

    res.json({ 
      message: `Verified at ${hub.name}`, 
      hubId: hub._id,
      hubName: hub.name 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk Status update for scanning at Handover 
// @route   PATCH /api/shipments/bulk/status
// @access  Private (Agent / Admin)
exports.bulkUpdateStatus = async (req, res) => {
  const { trackingIds, status, message, hubId, hubCode, proofOfPickup } = req.body;
  
  try {
    // STRONG BACKEND VALIDATION 1: Validate input
    if (!trackingIds || !Array.isArray(trackingIds) || trackingIds.length === 0) {
      return res.status(400).json({ message: "No shipments scanned to update." });
    }

    // STRONG BACKEND VALIDATION 2: If Agent is starting shift (Moving to Out for Delivery), they MUST provide a valid Hub Authorization
    let verifiedHubId = hubId;
    if (status === "Out for Delivery") {
      if (!hubCode && !hubId) {
        return res.status(401).json({ message: "Security Block: Hub Manager Authorization Code is required to load truck." });
      }
      if (hubCode) {
        const Hub = require("../models/Hub");
        const hub = await Hub.findOne({ hubCode: hubCode.toUpperCase() });
        if (!hub) return res.status(404).json({ message: "Security Block: Invalid Hub Authorization Code." });
        verifiedHubId = hub._id;
      }
    }

    // Fetch the target shipments to validate their current state
    const upperTrackingIds = trackingIds.map(id => id.toUpperCase());
    const shipments = await Shipment.find({ trackingId: { $in: upperTrackingIds } });

    if (shipments.length !== trackingIds.length) {
      return res.status(400).json({ message: "Security Block: One or more scanned tracking IDs do not exist." });
    }

    // STRONG BACKEND VALIDATION 3: Status progression integrity (Chain of custody)
    for (const s of shipments) {
      if (req.user.role === "Agent" && s.agent && s.agent.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: `Security Block: You are not assigned to transport package ${s.trackingId}.` });
      }
      
      // Before an agent can load it, the hub must have received it
      if (status === "Out for Delivery" && s.status === "Created") {
        return res.status(400).json({ message: `Security Block: Package ${s.trackingId} has not been received by the Hub yet.` });
      }
    }

    const updatePayload = {
      $set: { status: status, hub: verifiedHubId || null },
      $push: { 
        history: {
          status: status,
          message: message || `Bulk Status Update to ${status} (Verified at Hub)`,
          updatedBy: req.user._id,
          timestamp: new Date()
        }
      }
    };

    if (proofOfPickup) {
      updatePayload.$set.proofOfPickup = proofOfPickup;
    }

    const results = await Shipment.updateMany(
      { trackingId: { $in: upperTrackingIds } },
      updatePayload
    );

    const events = shipments.map(s => ({
      shipment: s._id,
      status,
      message: message || `Bulk Status Update to ${status} (Verified at Hub)`,
      updatedBy: req.user._id,
      tenant_id: s.tenant_id,
    }));
    await ShipmentEvent.insertMany(events);

    for (const sh of shipments) {
      await delCache(`track:${sh.trackingId}`);
      await delCache(`analytics:${sh.tenant_id}`);
      
      const { getShipmentUpdateTemplate } = require("../utils/emailTemplates");
      const sendSMS = require("../utils/sendSMS");
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

      // ── TRIGGER 3: Email Update (Bulk) ───────────────────────────────
      await queueEmail({ 
        email: sh.customerEmail, 
        subject: `Shipment Update [${sh.trackingId}]: ${status}`, 
        html: getShipmentUpdateTemplate({
          trackingId: sh.trackingId,
          status: status,
          message: message,
          otp: sh.deliveryOTP,
          proofOfDelivery: sh.proofOfDelivery ? (sh.proofOfDelivery.startsWith("http") ? sh.proofOfDelivery : `${process.env.BACKEND_URL}${sh.proofOfDelivery}`) : null,
          trackingUrl: `${frontendUrl}/track?id=${sh.trackingId}`
        })
      });

      // ── TRIGGER 3: SMS Update (Bulk) ─────────────────────────────────
      if (sh.phoneNumber) {
        let bulkSmsMsg = `ShipNova: [${sh.trackingId}] is now ${status}. ${status === 'Out for Delivery' ? 'OTP: ' + sh.deliveryOTP : ''}`;
        await sendSMS({ phoneNumber: sh.phoneNumber, message: bulkSmsMsg });
      }
    }

    res.json({ message: `${results.modifiedCount} packages securely transferred to your custody.`, results });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin Edit Shipment Details
// @route   PUT /api/shipments/:id
// @access  Private (Admin)
exports.updateShipmentDetails = async (req, res) => {
  const { customerName, customerEmail, address, phoneNumber, packageDetails, estimatedDelivery, resendEmail } = req.body;
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // Validate tenant
    const shipmentTenantId = shipment.tenant_id ? shipment.tenant_id.toString() : "000000000000000000000000";
    const userTenantId = getTenantIdFromUser(req.user);
    if (shipmentTenantId !== userTenantId && req.user.role !== "Super Admin") {
      return res.status(403).json({ message: "Not authorized for this tenant" });
    }

    // Update mutable details
    if (customerName) shipment.customerName = customerName;
    if (customerEmail) shipment.customerEmail = customerEmail;
    if (address) shipment.address = address;
    if (phoneNumber) shipment.phoneNumber = phoneNumber;
    if (packageDetails) shipment.packageDetails = packageDetails;
    if (estimatedDelivery) shipment.estimatedDelivery = estimatedDelivery;

    shipment.history.push({
      status: shipment.status,
      message: "Admin revised shipment details",
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await shipment.save();

    await logAction(req, {
       action: "SHIPMENT_EDIT",
       entityType: "Shipment",
       entityId: shipment._id,
       details: `Details modified by Admin. Resent Email: ${resendEmail ? "Yes" : "No"}`
    });

    await delCache(`track:${shipment.trackingId}`);
    await delCache(`analytics:${shipment.tenant_id}`);

    // If Admin requested a resend (e.g. wrong email typo was fixed)
    if (resendEmail) {
      const { getShipmentCreatedTemplate } = require("../utils/emailTemplates");
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

      await queueEmail({
        email: shipment.customerEmail,
        subject: `[${shipment.trackingId}] ShipNova Induction Alert (Updated)`,
        html: getShipmentCreatedTemplate({
          customerName: shipment.customerName,
          trackingId: shipment.trackingId,
          aiInsights: "Your logistical details have been updated by ShipNova processing.",
          trackingUrl: `${frontendUrl}/track?id=${shipment.trackingId}`
        })
      });
    }

    res.json({ message: "Shipment details updated", shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const geolib = require("geolib");

// @desc    Optimize Agent's Active Route using Nearest Neighbor (TSP)
// @route   POST /api/shipments/optimize-route
// @access  Private (Agent)
exports.optimizeRoute = async (req, res) => {
  const { currentLat, currentLng } = req.body;

  try {
    const pendingDeliveries = await Shipment.find({
      agent: req.user._id,
      status: "Out for Delivery"
    });

    if (pendingDeliveries.length === 0) {
      return res.json({ message: "No active deliveries to optimize.", route: [] });
    }

    let unvisited = pendingDeliveries.map(s => {
      // Create a plain object and guarantee numerical latitude/longitude for geolib
      const sObj = s.toObject ? s.toObject() : s;
      return {
        ...sObj,
        latitude: Number(s.currentLat) || 0,
        longitude: Number(s.currentLong) || 0,
      };
    });

    let currentLocation = { 
      latitude: Number(currentLat) || 0, 
      longitude: Number(currentLng) || 0 
    };
    
    let optimizedRoute = [];

    // Simple Greedy Traveling Salesperson
    while (unvisited.length > 0) {
      // Find the closest package
      const nearest = geolib.findNearest(currentLocation, unvisited);
      
      optimizedRoute.push(nearest);
      
      currentLocation = { latitude: nearest.latitude, longitude: nearest.longitude };
      
      unvisited = unvisited.filter(s => s._id.toString() !== nearest._id.toString());
    }

    res.json({ 
      message: "Route successfully optimized!", 
      totalStops: optimizedRoute.length,
      route: optimizedRoute 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
