const { body, param, validationResult } = require("express-validator");

// Middleware: check for validation errors and return 400 if any
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: "Input validation failed.",
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Shipment creation validators
const shipmentValidators = [
  body("customerName").trim().notEmpty().withMessage("Customer name is required"),
  body("customerEmail").isEmail().withMessage("Valid email is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("phoneNumber").trim().notEmpty().withMessage("Phone number is required"),
  body("packageDetails").trim().notEmpty().withMessage("Package details are required"),
];

// Status update validators
const statusValidators = [
  body("status").notEmpty().withMessage("Status is required").isIn([
    "Created", "Picked Up", "At Sorting Facility", "In Transit", 
    "Out for Delivery", "Delivered", "Failed / Retry / Returned"
  ]).withMessage("Invalid shipment status"),
];

// Auth login validators
const loginValidators = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Auth register validators
const registerValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// Common ID validators
const idParamValidator = [
  param("id").isMongoId().withMessage("Invalid resource ID"),
];

const hubIdParamValidator = [
  param("hubId").isMongoId().withMessage("Invalid hub ID"),
];

const agentIdParamValidator = [
  param("id").isMongoId().withMessage("Invalid agent ID"),
];

const trackingIdParamValidator = [
  param("trackingId")
    .trim()
    .notEmpty()
    .withMessage("Tracking ID is required")
    .matches(/^SN-[A-Z0-9]{8}$/)
    .withMessage("Invalid tracking ID format"),
];

const trackingIdLegacyParamValidator = [
  param("tracking_id")
    .trim()
    .notEmpty()
    .withMessage("Tracking ID is required")
    .matches(/^SN-[A-Z0-9]{8}$/)
    .withMessage("Invalid tracking ID format"),
];

// Shipment validators
const assignAgentValidators = [
  body("agentId").isMongoId().withMessage("Valid agent ID is required"),
];

const bulkStatusValidators = [
  body("trackingIds")
    .isArray({ min: 1 })
    .withMessage("trackingIds must be a non-empty array"),
  body("trackingIds.*")
    .trim()
    .matches(/^SN-[A-Z0-9]{8}$/)
    .withMessage("Each tracking ID must match SN-XXXXXXXX format"),
  body("status").notEmpty().withMessage("Status is required").isIn([
    "Created", "Picked Up", "At Sorting Facility", "In Transit",
    "Out for Delivery", "Delivered", "Failed / Retry / Returned"
  ]).withMessage("Invalid shipment status"),
  body("hubId").optional().isMongoId().withMessage("hubId must be a valid Mongo ID"),
  body("proofOfPickup").optional().isString().withMessage("proofOfPickup must be a string URL"),
];

const verifyHubValidators = [
  body("hubCode").trim().notEmpty().withMessage("hubCode is required"),
];

const shipmentDetailsUpdateValidators = [
  body("customerEmail").optional().isEmail().withMessage("Valid customerEmail is required"),
  body("resendEmail").optional().isBoolean().withMessage("resendEmail must be boolean"),
];

// Hub validators
const hubCreateValidators = [
  body("name").trim().notEmpty().withMessage("Hub name is required"),
  body("location").trim().notEmpty().withMessage("Hub location is required"),
  body("managerEmail").optional().isEmail().withMessage("managerEmail must be valid"),
  body("managerPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("managerPassword must be at least 6 characters"),
];

const assignShipmentToHubValidators = [
  body("shipmentId").isMongoId().withMessage("shipmentId must be a valid Mongo ID"),
];

const verifyShipmentValidators = [
  body("trackingId").trim().notEmpty().withMessage("trackingId is required"),
];

const agentHandoverValidators = [
  body("hubCode").trim().notEmpty().withMessage("hubCode is required"),
  body("trackingIds").isArray({ min: 1 }).withMessage("trackingIds must be a non-empty array"),
  body("trackingIds.*")
    .trim()
    .matches(/^SN-[A-Z0-9]{8}$/)
    .withMessage("Each tracking ID must match SN-XXXXXXXX format"),
];

const hubChatMessageValidators = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Message text is required")
    .isLength({ max: 1000 })
    .withMessage("Message must be 1000 characters or less"),
];

// Tenant validators
const tenantCreateValidators = [
  body("name").trim().notEmpty().withMessage("Tenant name is required"),
  body("subscriptionPlan")
    .optional()
    .isIn(["Starter", "Professional", "Enterprise"])
    .withMessage("Invalid subscription plan"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
  body("adminEmail").optional().isEmail().withMessage("adminEmail must be valid"),
  body("adminPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("adminPassword must be at least 6 characters"),
];

const subscriptionUpdateValidators = [
  body("planName")
    .trim()
    .notEmpty()
    .withMessage("planName is required")
    .isIn(["Starter", "Professional", "Enterprise"])
    .withMessage("Invalid planName"),
];

// Plan validators
const planCreateUpdateValidators = [
  body("name").trim().notEmpty().withMessage("Plan name is required"),
  body("price").trim().notEmpty().withMessage("Plan price is required"),
  body("description").optional().isString().withMessage("description must be text"),
  body("features").optional().isArray().withMessage("features must be an array"),
  body("displayOrder").optional().isInt({ min: 0 }).withMessage("displayOrder must be a positive integer"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
];

// Super Admin validators
const superAdminCreateAdminValidators = [
  body("name").trim().notEmpty().withMessage("Admin name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("tenant_id").optional().isMongoId().withMessage("tenant_id must be a valid Mongo ID"),
];

module.exports = {
  validate,
  shipmentValidators,
  statusValidators,
  loginValidators,
  registerValidators,
  idParamValidator,
  hubIdParamValidator,
  agentIdParamValidator,
  trackingIdParamValidator,
  trackingIdLegacyParamValidator,
  assignAgentValidators,
  bulkStatusValidators,
  verifyHubValidators,
  shipmentDetailsUpdateValidators,
  hubCreateValidators,
  assignShipmentToHubValidators,
  verifyShipmentValidators,
  agentHandoverValidators,
  hubChatMessageValidators,
  tenantCreateValidators,
  subscriptionUpdateValidators,
  planCreateUpdateValidators,
  superAdminCreateAdminValidators,
};
