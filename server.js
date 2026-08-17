import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import teacherRoutes from "./routes/teacher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env relative to server.js path
dotenv.config({ path: path.join(__dirname, ".env") });

// Initialize express app
const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Connect to MongoDB with local fallback
const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/school_management";
console.log("Attempting to connect to MongoDB using URI:", mongoURI.replace(/\/\/[^@]+@/, "//[CREDENTIALS_REDACTED]@"));

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    if (!process.env.MONGODB_URI) {
      console.log("Tip: Ensure a local MongoDB instance is running or provide MONGODB_URI in your .env file.");
    }
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);

// Basic route to verify connection
app.get("/api/status", (req, res) => {
  res.json({ status: "success", message: "Frontend and Backend are connected successfully!" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

