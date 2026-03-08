const jwt = require("jsonwebtoken");
const userModel = require("../models/User");

// Protect private routes
// Steps: read token -> verify token -> load user -> attach req.user
const authMiddleware = async (req, res, next) => {
  try {
    const authText = req.headers.authorization || "";

    if (!authText.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing",
      });
    }

    const userToken = authText.split(" ")[1];

    if (!userToken) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is missing in .env",
      });
    }

    const tokenData = jwt.verify(userToken, secret);
    const user = await userModel.findById(tokenData.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found for this token",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account is banned",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  authMiddleware,
};
