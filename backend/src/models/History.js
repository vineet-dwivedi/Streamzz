const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    // Logged-in user who owns this history entry
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Unique content id like: tmdb:550
    contentKey: {
      type: String,
      required: true,
      trim: true,
    },

    // Display fields for quick UI rendering
    title: {
      type: String,
      required: true,
      trim: true,
    },
    posterPath: {
      type: String,
      default: "",
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv", "person", "custom"],
      default: "movie",
    },
    releaseDate: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["tmdb", "local"],
      default: "tmdb",
    },

    // Why it was added to history: opened details page or watched trailer
    action: {
      type: String,
      enum: ["open", "trailer"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Prevent duplicate history entries for same user + same content.
historySchema.index({ userId: 1, contentKey: 1 }, { unique: true });

const historyModel = mongoose.model("History", historySchema);

module.exports = historyModel;
