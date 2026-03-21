const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Stricter limiter for auth routes (login/register) - Relaxed for local dev
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Allow high limit so you don't get blocked testing locally
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many auth attempts, please try again after 15 minutes.",
  },
});

// Tracking public endpoint limiter
const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 30,
  message: {
    message: "Rate limit exceeded for tracking lookups.",
  },
});

module.exports = { apiLimiter, authLimiter, trackingLimiter };
