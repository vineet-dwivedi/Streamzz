const express = require("express");
const cors = require("cors");
const mainRoute = require("./routes");
const { notFoundMiddleware } = require("./middleware/notFound.middleware");
const { errorMiddleware } = require("./middleware/error.middleware");

const app = express();

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", mainRoute);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
