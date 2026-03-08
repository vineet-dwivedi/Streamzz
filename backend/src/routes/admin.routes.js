const express = require("express");
const adminController = require("../controllers/admin.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const adminRoute = express.Router();

// All admin routes require login + admin role
adminRoute.use(authMiddleware, roleMiddleware("admin"));

adminRoute.get("/movies", adminController.getMovies);
adminRoute.post("/movies", adminController.addMovie);
adminRoute.patch("/movies/:id", adminController.updateMovie);
adminRoute.delete("/movies/:id", adminController.deleteMovie);

adminRoute.get("/users", adminController.getUsers);
adminRoute.patch("/users/:id/ban", adminController.toggleBanUser);
adminRoute.delete("/users/:id", adminController.deleteUser);

module.exports = adminRoute;
