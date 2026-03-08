const express = require("express");
const historyController = require("../controllers/history.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const historyRoute = express.Router();

historyRoute.get("/", authMiddleware, historyController.getHistory);
historyRoute.post("/", authMiddleware, historyController.addHistory);
historyRoute.delete("/:contentKey", authMiddleware, historyController.removeHistory);

module.exports = historyRoute;
