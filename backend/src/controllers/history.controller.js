const historyModel = require("../models/History");

// GET /api/history
// Return all history items for logged-in user
const getHistory = async (req, res) => {
  try {
    const list = await historyModel.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch history",
      error: err.message,
    });
  }
};

// POST /api/history
// Add or update one history entry for logged-in user
const addHistory = async (req, res) => {
  try {
    const { contentKey, title, posterPath, mediaType, releaseDate, source, action } = req.body;

    if (!contentKey || !title) {
      return res.status(400).json({
        success: false,
        message: "contentKey and title are required",
      });
    }

    const cleanKey = contentKey.trim();

    const oldItem = await historyModel.findOne({
      userId: req.user._id,
      contentKey: cleanKey,
    });

    if (oldItem) {
      oldItem.title = title.trim();
      oldItem.posterPath = posterPath || "";
      oldItem.mediaType = mediaType || "movie";
      oldItem.releaseDate = releaseDate || "";
      oldItem.source = source || "tmdb";
      oldItem.action = action || "open";
      await oldItem.save();

      return res.status(200).json({
        success: true,
        message: "History updated successfully",
        data: oldItem,
      });
    }

    const newItem = await historyModel.create({
      userId: req.user._id,
      contentKey: cleanKey,
      title: title.trim(),
      posterPath: posterPath || "",
      mediaType: mediaType || "movie",
      releaseDate: releaseDate || "",
      source: source || "tmdb",
      action: action || "open",
    });

    return res.status(201).json({
      success: true,
      message: "History added successfully",
      data: newItem,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not add history",
      error: err.message,
    });
  }
};

// DELETE /api/history/:contentKey
// Remove one history item by contentKey for logged-in user
const removeHistory = async (req, res) => {
  try {
    const contentKey = decodeURIComponent(req.params.contentKey || "");

    if (!contentKey) {
      return res.status(400).json({
        success: false,
        message: "contentKey is required",
      });
    }

    const removedItem = await historyModel.findOneAndDelete({
      userId: req.user._id,
      contentKey,
    });

    if (!removedItem) {
      return res.status(404).json({
        success: false,
        message: "History item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "History item removed successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Could not remove history item",
      error: err.message,
    });
  }
};

module.exports = { getHistory, addHistory, removeHistory };
