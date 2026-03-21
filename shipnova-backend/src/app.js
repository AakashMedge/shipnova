const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");

let isDbConnected = false;

const ensureDbConnection = async (req, res, next) => {
	if (!isDbConnected) {
		try {
			await connectDB();
			isDbConnected = true;
		} catch (error) {
			return res.status(500).json({ message: "Database connection failed" });
		}
	}
	next();
};

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api", ensureDbConnection);

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/track", require("./routes/trackRoutes"));
app.use("/api/tenants", require("./routes/tenantRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/hubs", require("./routes/hubRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/plans", require("./routes/planRoutes"));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
	res.send("Shipnova API Running");
});

module.exports = app;
