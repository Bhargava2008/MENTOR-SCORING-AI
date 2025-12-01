// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

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

// Main static files
app.use(express.static(__dirname));

// Routes
app.use("/session", require("./routes/sessionRoutes"));

app.get(/^\/(?!session).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

app.listen(5000, () => console.log("Server running on port 5000"));
