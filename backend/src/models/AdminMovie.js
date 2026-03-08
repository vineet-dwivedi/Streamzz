const mongoose = require("mongoose");

const adminMovieSchema = new mongoose.Schema(
  {
    // Custom id from admin panel (example: MOV-1001)
    movieId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    posterUrl: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "Description not available",
      trim: true,
    },
    releaseDate: {
      type: String,
      default: "",
      trim: true,
    },
    trailerYoutubeLink: {
      type: String,
      default: "",
      trim: true,
    },
    genre: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
  },
  { timestamps: true }
);

const adminMovieModel = mongoose.model("AdminMovie", adminMovieSchema);

module.exports = adminMovieModel;
