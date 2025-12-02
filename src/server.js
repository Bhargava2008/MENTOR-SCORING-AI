// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

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

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: "GET,POST",
  })
);

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

// TTS audio
app.use("/tts", express.static(path.join(__dirname, "../uploads/tts")));

// Transcripts
app.use("/transcripts", express.static(path.join(__dirname, "../transcripts")));

// Routes
app.use("/session", require("./routes/sessionRoutes"));

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

app.listen(5000, () => console.log("Server running on port 5000"));
