const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const User = require("../models/User");

// Resolve .env from the backend root (two directories up from src/utils/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SUPER_ADMIN_CREDENTIALS = {
  name: "Shipnova Super Admin",
  email: "superadmin@shipnova.com",
  password: "SuperAdmin@123",
  role: "Super Admin",
  status: "active",
};

const seedSuperAdmin = async () => {
  try {
    // Direct connection with increased timeout for scripts
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("MongoDB Connected for seeding...");

    // DELETE any existing Super Admin account(s)
    const deleted = await User.deleteMany({ role: "Super Admin" });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleted.deletedCount} existing Super Admin account(s).`);
    }

    // Create fresh Super Admin with dummy credentials
    const superAdmin = await User.create(SUPER_ADMIN_CREDENTIALS);

    console.log("✅ Super Admin seeded successfully!");
    console.log(`   Name:     ${superAdmin.name}`);
    console.log(`   Email:    ${superAdmin.email}`);
    console.log(`   Password: SuperAdmin@123`);
    console.log(`   Role:     ${superAdmin.role}`);
    console.log(`   Status:   ${superAdmin.status}`);
    console.log(`   ID:       ${superAdmin._id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
