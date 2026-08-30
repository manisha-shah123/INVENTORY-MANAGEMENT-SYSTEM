const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");

const loginAdmin = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  console.log("[LOGIN DEBUG] Received email:", JSON.stringify(email));
  console.log(
    "[LOGIN DEBUG] Normalized email:",
    JSON.stringify(normalizedEmail),
  );

  const admin = await Admin.findOne({ email: normalizedEmail });

  console.log("[LOGIN DEBUG] Admin found in DB:", !!admin);
  if (admin) {
    console.log(
      "[LOGIN DEBUG] Admin email stored as:",
      JSON.stringify(admin.email),
    );
  }

  if (!admin) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);

  console.log("[LOGIN DEBUG] Password matched:", isPasswordValid);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: admin._id,
      email: admin.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    token,
    admin: {
      id: admin._id,
      email: admin.email,
    },
  };
};

module.exports = {
  loginAdmin,
};
