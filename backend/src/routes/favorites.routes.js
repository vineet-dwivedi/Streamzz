const express = require("express");
const favController = require("../controllers/favorites.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const favoritesRoute = express.Router();

favoritesRoute.get("/", authMiddleware, favController.getFavorites);
favoritesRoute.post("/", authMiddleware, favController.addFavorite);
favoritesRoute.delete("/:contentKey", authMiddleware, favController.removeFavorite);

module.exports = favoritesRoute;

