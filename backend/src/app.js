const express = require("express");
const cors = require("cors");
const mainRoute = require("./routes");
const { notFoundMiddleware } = require("./middleware/notFound.middleware");
const { errorMiddleware } = require("./middleware/error.middleware");

const app = express();

const envOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URLS]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set(["http://localhost:5173", ...envOrigins]));
const vercelPreviewPattern = /^https:\/\/.*\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", mainRoute);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
