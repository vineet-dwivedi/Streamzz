const favModel = require("../models/Favorite");

// GET /api/favorites
// Return all favorites for logged-in user
const getFavorites = async (req, res) => {
  try {
    const list = await favModel.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch favorites",
      error: err.message,
    });
  }
};

// POST /api/favorites
// Add one favorite for logged-in user
const addFavorite = async (req, res) => {
  try {
    const { contentKey, title, posterPath, mediaType, releaseDate, source } = req.body;

    if (!contentKey || !title) {
      return res.status(400).json({
        success: false,
        message: "contentKey and title are required",
      });
    }

    const existingFav = await favModel.findOne({
      userId: req.user._id,
      contentKey: contentKey.trim(),
    });

    if (existingFav) {
      return res.status(200).json({
        success: true,
        message: "Already in favorites",
        data: existingFav,
      });
    }

    const newFav = await favModel.create({
      userId: req.user._id,
      contentKey: contentKey.trim(),
      title: title.trim(),
      posterPath: posterPath || "",
      mediaType: mediaType || "movie",
      releaseDate: releaseDate || "",
      source: source || "tmdb",
    });

    return res.status(201).json({
      success: true,
      message: "Favorite added successfully",
      data: newFav,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not add favorite",
      error: err.message,
    });
  }
};

// DELETE /api/favorites/:contentKey
// Remove one favorite by contentKey for logged-in user
const removeFavorite = async (req, res) => {
  try {
    const contentKey = decodeURIComponent(req.params.contentKey || "");

    if (!contentKey) {
      return res.status(400).json({
        success: false,
        message: "contentKey is required",
      });
    }

    const removedFav = await favModel.findOneAndDelete({
      userId: req.user._id,
      contentKey,
    });

    if (!removedFav) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Favorite removed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not remove favorite",
      error: err.message,
    });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };
