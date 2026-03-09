require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB().catch((error) => {
  console.error("Database connection failed:", error.message);
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}!!`);
  });
}

module.exports = app;
