const adminMovieModel = require("../models/AdminMovie");
const userModel = require("../models/User");
const favModel = require("../models/Favorite");
const historyModel = require("../models/History");

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBanned: user.isBanned,
  createdAt: user.createdAt,
});

const getGenreArray = (genre) => {
  if (Array.isArray(genre)) {
    return genre.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof genre === "string") {
    return genre
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

// GET /api/admin/movies
const getMovies = async (req, res) => {
  try {
    const movies = await adminMovieModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch admin movies",
      error: err.message,
    });
  }
};

// POST /api/admin/movies
const addMovie = async (req, res) => {
  try {
    const {
      movieId,
      title,
      posterUrl,
      description,
      releaseDate,
      trailerYoutubeLink,
      genre,
      category,
    } = req.body;

    if (!movieId || !title || !category) {
      return res.status(400).json({
        success: false,
        message: "movieId, title and category are required",
      });
    }

    const movie = await adminMovieModel.create({
      movieId: String(movieId).trim(),
      title: String(title).trim(),
      posterUrl: posterUrl || "",
      description: description || "Description not available",
      releaseDate: releaseDate || "",
      trailerYoutubeLink: trailerYoutubeLink || "",
      genre: getGenreArray(genre),
      category: String(category).trim().toLowerCase(),
    });

    return res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: movie,
    });
  } catch (err) {
    let message = "Could not add movie";
    if (err.code === 11000) {
      message = "movieId already exists";
    }

    return res.status(500).json({
      success: false,
      message,
      error: err.message,
    });
  }
};

// PATCH /api/admin/movies/:id
const updateMovie = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (typeof updates.genre !== "undefined") {
      updates.genre = getGenreArray(updates.genre);
    }

    if (updates.category) {
      updates.category = String(updates.category).trim().toLowerCase();
    }

    const movie = await adminMovieModel.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: movie,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not update movie",
      error: err.message,
    });
  }
};

// DELETE /api/admin/movies/:id
const deleteMovie = async (req, res) => {
  try {
    const movie = await adminMovieModel.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not delete movie",
      error: err.message,
    });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await userModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(safeUser),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch users",
      error: err.message,
    });
  }
};

// PATCH /api/admin/users/:id/ban
const toggleBanUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot ban your own account",
      });
    }

    if (typeof req.body.isBanned === "boolean") {
      user.isBanned = req.body.isBanned;
    } else {
      user.isBanned = !user.isBanned;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isBanned ? "User banned successfully" : "User unbanned successfully",
      data: safeUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not update ban status",
      error: err.message,
    });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    await Promise.all([
      favModel.deleteMany({ userId: user._id }),
      historyModel.deleteMany({ userId: user._id }),
      userModel.deleteOne({ _id: user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not delete user",
      error: err.message,
    });
  }
};

module.exports = {
  getMovies,
  addMovie,
  updateMovie,
  deleteMovie,
  getUsers,
  toggleBanUser,
  deleteUser,
};
