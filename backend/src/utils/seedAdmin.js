require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    // Hash the plain-text password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    // Save the hashed password
    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
    });

    console.log("Admin created successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
