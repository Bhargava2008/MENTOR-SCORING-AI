// server.js
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
    methods: "GET,POST",
  })
);

// ---------- ENSURE FOLDERS EXIST ----------
const folders = [
  path.join(__dirname, "../uploads"),
  path.join(__dirname, "../uploads/audio"),
  path.join(__dirname, "../uploads/evidence"),
  path.join(__dirname, "../uploads/tts"),
  path.join(__dirname, "../transcripts"),
];

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// ---------- STATIC ROUTES ----------

// Main uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
      if (filePath.endsWith(".mp3"))
        res.setHeader("Content-Type", "audio/mpeg");
      if (filePath.endsWith(".wav")) res.setHeader("Content-Type", "audio/wav");
    },
  })
);

// Evidence clips
app.use(
  "/evidence",
  express.static(path.join(__dirname, "../uploads/evidence"))
);

// TTS AUDIO  ✔ FIXED — only ONE definition
app.use(
  "/tts",
  express.static(path.join(__dirname, "../uploads/tts"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    },
  })
);

// Transcripts
app.use("/transcripts", express.static(path.join(__dirname, "../transcripts")));

// Serve frontend
app.use(express.static(path.join(__dirname)));

// ---------- ROUTES ----------
app.use("/session", require("./routes/sessionRoutes"));

// ---------- DATABASE ----------
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

// ---------- START SERVER ----------
app.listen(5000, () => console.log("Server running on port 5000"));
