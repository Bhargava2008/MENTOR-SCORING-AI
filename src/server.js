// server.js - ADD THESE UPDATES
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const app = express();

// ---------- BASIC MIDDLEWARE ----------
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// ---------- ENSURE FOLDERS EXIST ----------
const folders = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads/audio"),
  path.join(__dirname, "uploads/evidence"),
  path.join(__dirname, "uploads/tts"),
  path.join(__dirname, "transcripts"),
];

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// ---------- STATIC ROUTES ----------
// ---------- STATIC ROUTES ----------
// Serve from BOTH locations
app.use("/uploads", (req, res, next) => {
  // Try src/uploads first
  const srcPath = path.join(__dirname, "uploads", req.path);
  const rootPath = path.join(__dirname, "..", "uploads", req.path);

  console.log("Looking for:", req.path);
  console.log("Trying src path:", srcPath);
  console.log("Trying root path:", rootPath);

  if (fs.existsSync(srcPath)) {
    console.log("Found in src/uploads");
    return res.sendFile(srcPath);
  }

  if (fs.existsSync(rootPath)) {
    console.log("Found in root/uploads");
    return res.sendFile(rootPath);
  }

  console.log("File not found");
  res.status(404).send("File not found");
});

// Keep these as backup
app.use("/src/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/root/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/tts", express.static(path.join(__dirname, "uploads/tts")));
app.use("/transcripts", express.static(path.join(__dirname, "transcripts")));

// ---------- API ROUTES ----------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/institution", require("./routes/institutionRoutes"));
app.use("/api/session", require("./routes/sessionRoutes"));
console.log("📌 Loading report routes...");
app.use("/api/reports", require("./routes/reportRoutes"));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
// ---------- DATABASE ----------
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
