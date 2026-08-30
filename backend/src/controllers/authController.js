const { loginAdmin } = require("../services/authService");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginAdmin(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  // req.admin is set by the auth middleware after verifying the JWT
  res.status(200).json({
    success: true,
    data: {
      admin: req.admin,
    },
  });
};

module.exports = {
  login,
  getMe,
};
