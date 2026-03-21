const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const app = express();
const cors = require("cors");
const { apiLimiter, authLimiter, trackingLimiter } = require("./src/middleware/rateLimiter");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Apply rate limiters
app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/shipments", require("./src/routes/shipmentRoutes"));
app.use("/api/track", require("./src/routes/trackRoutes"));
app.use("/api/tenants", require("./src/routes/tenantRoutes"));
app.use("/api/super-admin", require("./src/routes/superAdminRoutes"));
app.use("/api/hubs", require("./src/routes/hubRoutes"));
app.use("/api/upload", require("./src/routes/uploadRoutes"));
app.use("/api/plans", require("./src/routes/planRoutes"));

// Static File Access
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Shipnova API Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});