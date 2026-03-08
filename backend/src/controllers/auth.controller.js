const jwt = require("jsonwebtoken");
const userModel = require("../models/User");

// Create JWT token for logged-in user
const getToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("JWT_SECRET is missing in .env");
  }

  return jwt.sign({ userId }, secret, { expiresIn });
};

// Remove sensitive fields before sending user in response
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBanned: user.isBanned,
});

/**
 * POST /api/auth/signup
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await userModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      // Demo shortcut: every new signup becomes admin.
      // Change this back to "user" for production.
      role: "admin",
    });

    const token = getToken(user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Signup failed",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account is banned",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Demo shortcut: anyone who logs in is promoted to admin.
    // Keeps admin panel accessible without Mongo manual updates.
    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = getToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/logout
 * JWT is stateless, so backend usually just tells client to remove token.
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Remove token from client storage.",
  });
};

/**
 * GET /api/auth/me
 */
const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    user: safeUser(req.user),
  });
};

module.exports = {
  signup,
  login,
  logout,
  me,
};
