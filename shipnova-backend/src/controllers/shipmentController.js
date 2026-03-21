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

    queueEmail({
      email: shipment.customerEmail,
      subject: "Your Shipnova Tracking ID",
      message: `Hello ${shipment.customerName},\n\nTrackingID: ${shipment.trackingId}\n\nAI INSIGHTS:\n${aiInsights}\n\nTrack: http://localhost:3000/track`
    });

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

    let emailMsg = `Your shipment (${shipment.trackingId}) is now: ${status}\n`;
    if (message) emailMsg += `Note: ${message}\n`;
    if (status === "Out for Delivery") {
      emailMsg += `\nOTP: ${shipment.deliveryOTP}\n`;
    }
    emailMsg += `\nTrack: ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/track`;

    queueEmail({
      email: shipment.customerEmail,
      subject: `Shipment Update: ${status}`,
      message: emailMsg
    });

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
        ? `${process.env.BACKEND_URL || "http://localhost:5000"}${shipment.proofOfDelivery}`
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
      return res.status(404).json({ message: "Invalid Hub Scan. Check your location." });
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
  const { trackingIds, status, message, hubId, proofOfPickup } = req.body;
  
  try {
    const updatePayload = {
      $set: { status: status, hub: hubId || null },
      $push: { 
        history: {
          status: status,
          message: message || `Bulk Status Update to ${status}`,
          updatedBy: req.user._id,
          timestamp: new Date()
        }
      }
    };

    // If a pickup photo was provided, attach it to proofOfPickup
    if (proofOfPickup) {
      updatePayload.$set.proofOfPickup = proofOfPickup;
    }

    const results = await Shipment.updateMany(
      { trackingId: { $in: trackingIds.map(id => id.toUpperCase()) } },
      updatePayload
    );

    // Create individual records in ShipmentEvent for history tracking compatibility
    const shipments = await Shipment.find({ trackingId: { $in: trackingIds.map(id => id.toUpperCase()) } });
    const events = shipments.map(s => ({
      shipment: s._id,
      status,
      message: message || `Bulk status update to ${status}`,
      updatedBy: req.user._id,
      tenant_id: s.tenant_id,
    }));
    await ShipmentEvent.insertMany(events);

    // Invalidate caches and send emails
    for (const sh of shipments) {
      await delCache(`track:${sh.trackingId}`);
      await delCache(`analytics:${sh.tenant_id}`);
      
      let emailMsg = `Hello ${sh.customerName},\n\nYour shipment (${sh.trackingId}) has been updated:\n\nStatus: ${status}\n${message ? `Note: ${message}\n` : ""}`;
      if (status === "Out for Delivery") {
        emailMsg += `\n\n**IMPORTANT SECURITY PIN**: Your secret delivery OTP is ${sh.deliveryOTP}.\nOur agent will ask for this 4-digit code when they arrive. Do not share it with anyone else.`;
      }
      emailMsg += `\n\nTrack your package: ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/track`;

      queueEmail({
        email: sh.customerEmail,
        subject: `Shipnova Update: Your package is now "${status}"`,
        message: emailMsg
      });
    }

    res.json({ message: `${results.modifiedCount} units updated.`, results });
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
      queueEmail({
        email: shipment.customerEmail,
        subject: "Your UPDATED Shipnova Tracking ID",
        message: `Hello ${shipment.customerName},\n\nThe logistical details for your shipment have been updated by ShipNova processing.\n\nYour Tracking ID remains: ${shipment.trackingId}\n\nYou can track it here: ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/track`
      });
    }

    res.json({ message: "Shipment details updated", shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
