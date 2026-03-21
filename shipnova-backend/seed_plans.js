const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const Plan = require("./src/models/Plan");

dotenv.config();

const INITIAL_PLANS = [
  {
    name: "Starter",
    price: "$0",
    description: "Launch your independent courier company with digital logistics.",
    features: ["500 Shipments/mo", "2 Managed Hubs", "Email Alerts", "Standard Tracking"],
    displayOrder: 1
  },
  {
    name: "Professional",
    price: "$99",
    description: "Scale your delivery fleet with industrial grade tracking.",
    features: ["5,000 Shipments/mo", "Unlimited Hubs", "Priority Support", "Real-time Telemetry"],
    displayOrder: 2
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Global logistics infrastructure for massive corporations.",
    features: ["Unlimited Everything", "White-label Portal", "24/7 Priority Support", "Direct Database Access"],
    displayOrder: 3
  }
];

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for plan seeding...");

    // Clear existing
    await Plan.deleteMany({});
    
    // Seed new
    await Plan.insertMany(INITIAL_PLANS);
    
    console.log("✅ Platform plans initialized successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
};

seedPlans();
