const express = require("express");
const authRoute = express.Router();
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

authRoute.post("/signup", authController.signup);
authRoute.post("/login", authController.login);
authRoute.post("/logout", authController.logout);
authRoute.get("/me", authMiddleware, authController.me);

module.exports = authRoute;
