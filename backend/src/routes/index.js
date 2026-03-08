const express = require("express");
const authRoute = require("./auth.routes");
const favoritesRoute = require("./favorites.routes");
const historyRoute = require("./history.routes");
const adminRoute = require("./admin.routes");

const mainRoute = express.Router();

mainRoute.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

mainRoute.use("/auth", authRoute);
mainRoute.use("/favorites", favoritesRoute);
mainRoute.use("/history", historyRoute);
mainRoute.use("/admin", adminRoute);

module.exports = mainRoute;
