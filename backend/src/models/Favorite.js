const mongoose = require("mongoose");

const favSchema = new mongoose.Schema(
  {
    // Logged-in user who owns this favorite
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
  },
  { timestamps: true }
);

// Prevent duplicate favorites for same user + same content.
favSchema.index({ userId: 1, contentKey: 1 }, { unique: true });

const favModel = mongoose.model("Favorite", favSchema);
module.exports = favModel;
